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
    const product = extractProduct(html);
    if (!product.name) {
      return json({ error: "商品情報を読み取れませんでした。楽天の商品ページURLでもう一度お試しください" }, 422);
    }

    const category = classifyCategory([product.name, product.category, product.description].filter(Boolean).join(" "));
    return json({
      name: cleanTitle(product.name),
      price: formatPrice(product.price),
      category,
      image: product.image || "",
      hook: createHook(category, product.name),
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
  if (!allowed) throw new Error("楽天ROOM、楽天市場、楽天アフィリエイトのURLだけ利用できます");
}

function extractProduct(html: string) {
  const jsonLdProduct = findJsonLdProduct(html);
  const offers = jsonLdProduct?.offers;
  const offer = Array.isArray(offers) ? offers[0] : offers;
  return {
    name: jsonLdProduct?.name || getMeta(html, "og:title") || getTitle(html),
    description: jsonLdProduct?.description || getMeta(html, "og:description"),
    category: jsonLdProduct?.category || "",
    image: normalizeImage(jsonLdProduct?.image) || getMeta(html, "og:image"),
    price: offer?.price || offer?.lowPrice || getMeta(html, "product:price:amount"),
  };
}

function findJsonLdProduct(html: string) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) {
    try {
      const root = JSON.parse(decodeHtml(match[1].trim()));
      const product = findProductNode(root);
      if (product) return product;
    } catch {
      // 壊れたJSON-LDは次の候補へ進む。
    }
  }
  return null;
}

function findProductNode(value: unknown): Record<string, any> | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findProductNode(item);
      if (found) return found;
    }
    return null;
  }

  const node = value as Record<string, any>;
  const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
  if (types.some((type) => String(type).toLowerCase() === "product")) return node;
  for (const child of Object.values(node)) {
    const found = findProductNode(child);
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
  if (/ワンピ|ドレス/.test(text)) return "ワンピース";
  if (/スカート/.test(text)) return "スカート";
  if (/バッグ|鞄|トート|ショルダー|リュック/.test(text)) return "バッグ";
  if (/パンプス|サンダル|スニーカー|ブーツ|シューズ|靴/.test(text)) return "シューズ";
  if (/ピアス|イヤリング|ネックレス|リング|アクセサリ|ブレスレット/.test(text)) return "アクセサリー";
  return "トップス";
}

function createHook(category: string, name: string) {
  const hooks: Record<string, string> = {
    トップス: "甘めコーデにもきれいめコーデにも合わせやすそう",
    ワンピース: "一枚で大人ガーリーな雰囲気を作りやすそう",
    スカート: "トップスを変えて着回しやすく、通学にも使いやすそう",
    バッグ: "普段のコーデに可愛さを足しつつ、きれいめにも合わせやすそう",
    シューズ: "足元から甘めきれいめに整えやすそう",
    アクセサリー: "さりげなく華やかさを足せて、毎日のコーデに使いやすそう",
  };
  return `${hooks[category] || hooks["トップス"]}（${cleanTitle(name).slice(0, 24)}）`;
}

function formatPrice(value: unknown) {
  const amount = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? `${Math.round(amount).toLocaleString("ja-JP")}円` : "";
}

function cleanTitle(value: string) {
  return decodeHtml(String(value || ""))
    .replace(/\s*[|｜]\s*楽天市場.*$/i, "")
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
