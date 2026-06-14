const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") return json({ error: "POSTのみ利用できます" }, 405);

  try {
    const body = await request.json();
    const originalUrl = String(body?.url || "").trim();
    if (!originalUrl) return json({ error: "URLを入力してください" }, 400);

    const { html, finalUrl } = await fetchRakutenPage(originalUrl);
    const isTravel = isRakutenTravelUrl(finalUrl) || isRakutenTravelUrl(originalUrl) || /楽天トラベル|travel\.rakuten\.co\.jp/i.test(html);
    const product = extractProduct(html, isTravel);
    if (!product.name) {
      return json({ error: isTravel
        ? "宿泊施設情報を読み取れませんでした。楽天トラベルの施設ページURLでもう一度お試しください"
        : "商品情報を読み取れませんでした。楽天の商品ページURLでもう一度お試しください" }, 422);
    }

    const category = isTravel ? "ホテル・旅行" : classifyCategory([product.name, product.category, product.description].filter(Boolean).join(" "));
    return json({
      name: cleanTitle(product.name),
      price: formatPrice(product.price) || (isTravel ? "料金は日程で変動" : ""),
      category,
      image: product.image || "",
      hook: isTravel ? createTravelHook(product) : createHook(category, product.name),
      kind: isTravel ? "travel" : "product",
      details: isTravel ? {
        location: product.location || "",
        rating: product.rating || "",
        reviewCount: product.reviewCount || "",
        checkin: product.checkin || "",
        checkout: product.checkout || "",
        amenities: product.amenities || [],
      } : {
        brand: product.brand || "",
        color: product.color || "",
        material: product.material || "",
        rating: product.rating || "",
        reviewCount: product.reviewCount || "",
      },
      sourceUrl: finalUrl,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "商品情報を取得できませんでした" }, 400);
  }
});

async function fetchRakutenPage(input: string) {
  let current = new URL(input);
  assertAllowedUrl(current);

  for (let index = 0; index < 8; index += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept-Language": "ja-JP,ja;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("リンクの転送先を確認できませんでした");
      current = new URL(location, current);
      assertAllowedUrl(current);
      continue;
    }

    if (!response.ok) throw new Error(`楽天ページを開けませんでした (${response.status})`);
    return { html: await response.text(), finalUrl: current.toString() };
  }

  throw new Error("リンクの転送回数が多すぎます");
}

function assertAllowedUrl(url: URL) {
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("httpまたはhttpsのURLを入力してください");
  const host = url.hostname.toLowerCase();
  const allowed = host === "rakuten.co.jp" || host.endsWith(".rakuten.co.jp") || host === "r10.to" || host.endsWith(".r10.to");
  if (!allowed) throw new Error("楽天ROOM、楽天市場、楽天トラベル、楽天アフィリエイトのURLだけ利用できます");
}

function isRakutenTravelUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname.toLowerCase() === "travel.rakuten.co.jp" || /travel\.rakuten\.co\.jp/i.test(value);
  } catch {
    return /travel\.rakuten\.co\.jp/i.test(value);
  }
}

function extractProduct(html: string, isTravel = false) {
  const jsonLdProduct = isTravel ? findJsonLdTravel(html) : findJsonLdProduct(html);
  const offers = jsonLdProduct?.offers || jsonLdProduct?.makesOffer;
  const offer = Array.isArray(offers) ? offers[0] : offers;
  const address = jsonLdProduct?.address;
  const location = typeof address === "string"
    ? address
    : [address?.addressRegion, address?.addressLocality].filter(Boolean).join(" ");
  const aggregateRating = jsonLdProduct?.aggregateRating || {};
  const brand = typeof jsonLdProduct?.brand === "string" ? jsonLdProduct.brand : jsonLdProduct?.brand?.name;
  return {
    name: jsonLdProduct?.name || getMeta(html, "og:title") || getTitle(html),
    description: jsonLdProduct?.description || getMeta(html, "og:description"),
    category: jsonLdProduct?.category || "",
    image: normalizeImage(jsonLdProduct?.image) || getMeta(html, "og:image"),
    price: offer?.price || offer?.lowPrice || getMeta(html, "product:price:amount"),
    location,
    rating: aggregateRating.ratingValue || getMeta(html, "rating") || findTextValue(html, ["ratingValue", "reviewAverage"]),
    reviewCount: aggregateRating.reviewCount || aggregateRating.ratingCount || findTextValue(html, ["reviewCount", "ratingCount"]),
    checkin: normalizeTime(jsonLdProduct?.checkinTime || findTextValue(html, ["checkinTime", "checkIn"])),
    checkout: normalizeTime(jsonLdProduct?.checkoutTime || findTextValue(html, ["checkoutTime", "checkOut"])),
    amenities: normalizeAmenities(jsonLdProduct?.amenityFeature),
    brand: brand || getMeta(html, "product:brand") || "",
    color: normalizeScalar(jsonLdProduct?.color),
    material: normalizeScalar(jsonLdProduct?.material),
  };
}

function normalizeScalar(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item || "")).filter(Boolean).join("・");
  if (value && typeof value === "object") return String((value as Record<string, unknown>).name || "");
  return String(value || "").trim();
}

function findTextValue(html: string, keys: string[]) {
  for (const key of keys) {
    const pattern = new RegExp(`["']${key}["']\\s*:\\s*["']([^"']+)["']`, "i");
    const found = html.match(pattern)?.[1];
    if (found) return decodeHtml(found);
  }
  return "";
}

function normalizeTime(value: unknown) {
  const text = String(value || "").trim();
  const match = text.match(/(?:T|\s)?(\d{1,2}:\d{2})/);
  return match?.[1] || text.slice(0, 20);
}

function normalizeAmenities(value: unknown): string[] {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map((item) => typeof item === "string" ? item : String((item as Record<string, unknown>)?.name || ""))
    .map((item) => cleanTitle(item))
    .filter(Boolean)
    .slice(0, 8);
}

function findJsonLdProduct(html: string) {
  return findJsonLdNode(html, ["product"]);
}

function findJsonLdTravel(html: string) {
  return findJsonLdNode(html, ["hotel", "lodgingbusiness", "resort", "bedandbreakfast", "accommodation"]);
}

function findJsonLdNode(html: string, acceptedTypes: string[]) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) {
    try {
      const root = JSON.parse(decodeHtml(match[1].trim()));
      const product = findSchemaNode(root, acceptedTypes);
      if (product) return product;
    } catch {
      // 壊れたJSON-LDは次の候補へ進む。
    }
  }
  return null;
}

function findSchemaNode(value: unknown, acceptedTypes: string[]): Record<string, any> | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findSchemaNode(item, acceptedTypes);
      if (found) return found;
    }
    return null;
  }

  const node = value as Record<string, any>;
  const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
  if (types.some((type) => acceptedTypes.includes(String(type).toLowerCase()))) return node;
  for (const child of Object.values(node)) {
    const found = findSchemaNode(child, acceptedTypes);
    if (found) return found;
  }
  return null;
}

function getMeta(html: string, key: string) {
  const tags = html.match(/<meta\s+[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrs = Object.fromEntries(
      [...tag.matchAll(/([:\w-]+)\s*=\s*["']([^"']*)["']/g)].map((match) => [match[1].toLowerCase(), decodeHtml(match[2])]),
    );
    if (attrs.property === key || attrs.name === key) return attrs.content || "";
  }
  return "";
}

function getTitle(html: string) {
  return decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
}

function normalizeImage(image: unknown): string {
  if (typeof image === "string") return image;
  if (Array.isArray(image)) return normalizeImage(image[0]);
  if (image && typeof image === "object") return String((image as Record<string, unknown>).url || "");
  return "";
}

function classifyCategory(text: string) {
  if (/コート|ジャケット|ブルゾン|カーディガン|ボレロ|アウター|パーカー/.test(text)) return "アウター";
  if (/ワンピ|ドレス/.test(text)) return "ワンピース";
  if (/スカート/.test(text)) return "スカート";
  if (/パンツ|ズボン|デニム|ジーンズ|スラックス|キュロット/.test(text)) return "パンツ";
  if (/バッグ|鞄|トート|ショルダー|リュック/.test(text)) return "バッグ";
  if (/パンプス|サンダル|スニーカー|ブーツ|シューズ|靴/.test(text)) return "シューズ";
  if (/ピアス|イヤリング|ネックレス|リング|アクセサリ|ブレスレット/.test(text)) return "アクセサリー";
  return "トップス";
}

function createHook(category: string, name: string) {
  const hooks: Record<string, string> = {
    トップス: "甘めコーデにもきれいめコーデにも合わせやすそう",
    アウター: "羽織るだけで全体を整えやすく、季節の変わり目にも頼れそう",
    ワンピース: "一枚で大人ガーリーな雰囲気を作りやすそう",
    スカート: "トップスを変えて着回しやすく、通学にも使いやすそう",
    パンツ: "甘めトップスを大人っぽく整えながら、きれいめにも使いやすそう",
    バッグ: "普段のコーデに可愛さを足しつつ、きれいめにも合わせやすそう",
    シューズ: "足元から甘めきれいめに整えやすそう",
    アクセサリー: "さりげなく華やかさを足せて、毎日のコーデに使いやすそう",
  };
  return `${hooks[category] || hooks["トップス"]}（${cleanTitle(name).slice(0, 24)}）`;
}

function createTravelHook(product: Record<string, any>) {
  const location = String(product.location || "").trim();
  const description = cleanTitle(String(product.description || ""));
  if (location) return `${location}で、女子旅や週末旅行の候補として比較したい宿`;
  if (description) return `${description.slice(0, 54)}${description.length > 54 ? "…" : ""}`;
  return "客室・食事・アクセスを比べて、女子旅の候補として検討したい宿";
}

function formatPrice(value: unknown) {
  const amount = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? `${Math.round(amount).toLocaleString("ja-JP")}円` : "";
}

function cleanTitle(value: string) {
  return decodeHtml(String(value || ""))
    .replace(/\s*[|｜]\s*楽天市場.*$/i, "")
    .replace(/\s*[|｜]\s*楽天トラベル.*$/i, "")
    .replace(/\s*[-–]\s*楽天.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value: string) {
  return String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}
