const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "POSTのみ利用できます" }, 405);

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "Supabase SecretsにOPENAI_API_KEYを設定してください" }, 400);

    const body = await request.json();
    const photo = String(body?.photo || "");
    const prompt = String(body?.prompt || "").trim();
    const productImages = Array.isArray(body?.productImages) ? body.productImages.map(String).filter(Boolean).slice(0, 4) : [];

    if (!photo.startsWith("data:image/")) return json({ error: "自分の写真をアップロードしてください" }, 400);
    if (!prompt) return json({ error: "生成指示がありません" }, 400);

    const form = new FormData();
    form.append("model", "gpt-image-2");
    form.append("prompt", `${prompt}

Important safety and honesty:
- Generate a styling concept image only.
- Do not sexualize the person.
- Do not alter body size dramatically.
- Do not add brand logos or claim exact product fit.
- Keep the result suitable for fashion affiliate content.`);
    form.append("image[]", dataUrlToFile(photo, "person.png"));

    for (let index = 0; index < productImages.length; index += 1) {
      const file = await urlToFile(productImages[index], `item-${index + 1}.png`).catch(() => null);
      if (file) form.append("image[]", file);
    }

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return json({ error: result?.error?.message || "OpenAI画像生成に失敗しました" }, response.status);
    }

    const image = result?.data?.[0]?.b64_json;
    if (!image) return json({ error: "画像データを取得できませんでした" }, 502);
    return json({ image });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "着用イメージを生成できませんでした" }, 400);
  }
});

function dataUrlToFile(dataUrl: string, filename: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("画像形式を読み取れませんでした");
  const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
  return new File([bytes], filename, { type: match[1] });
}

async function urlToFile(url: string, filename: string) {
  const target = new URL(url);
  if (!["https:", "http:"].includes(target.protocol)) throw new Error("画像URLが不正です");
  const response = await fetch(target, {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
      Accept: "image/avif,image/webp,image/png,image/jpeg,image/*",
    },
  });
  if (!response.ok) throw new Error("商品画像を取得できませんでした");
  const blob = await response.blob();
  const type = blob.type && blob.type.startsWith("image/") ? blob.type : "image/png";
  return new File([blob], filename, { type });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}
