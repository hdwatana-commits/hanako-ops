const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "POSTのみ利用できます" }, 405);

  try {
    const body = await request.json();
    if (body.action === "status") {
      return json({
        connections: {
          x: Boolean(secret("X_ACCESS_TOKEN")),
          instagram: Boolean(secret("INSTAGRAM_ACCESS_TOKEN") && secret("INSTAGRAM_USER_ID")),
          threads: Boolean(secret("THREADS_ACCESS_TOKEN") && secret("THREADS_USER_ID")),
        },
      });
    }

    if (body.action !== "publish") return json({ error: "操作が不正です" }, 400);
    const platform = String(body.platform || "");
    const text = String(body.text || "").trim();
    const imageUrl = String(body.imageUrl || "").trim();
    if (!text) return json({ error: "投稿文が空です" }, 400);

    if (platform === "X") return json(await publishX(text));
    if (platform === "Instagram") return json(await publishInstagram(text, imageUrl));
    if (platform === "Threads") return json(await publishThreads(text));
    return json({ error: "未対応のSNSです" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "SNS投稿に失敗しました" }, 400);
  }
});

async function publishX(text: string) {
  const token = required("X_ACCESS_TOKEN");
  const response = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const result = await readApi(response, "X");
  return { id: result.data?.id, platform: "X" };
}

async function publishInstagram(caption: string, imageUrl: string) {
  if (!imageUrl) throw new Error("Instagram投稿には公開画像URLが必要です");
  const token = required("INSTAGRAM_ACCESS_TOKEN");
  const userId = required("INSTAGRAM_USER_ID");
  const version = secret("META_GRAPH_VERSION") || "v23.0";
  const base = `https://graph.facebook.com/${version}`;

  const containerResponse = await fetch(`${base}/${encodeURIComponent(userId)}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ image_url: imageUrl, caption, access_token: token }),
  });
  const container = await readApi(containerResponse, "Instagramメディア作成");

  const publishResponse = await fetch(`${base}/${encodeURIComponent(userId)}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ creation_id: container.id, access_token: token }),
  });
  const published = await readApi(publishResponse, "Instagram公開");
  return { id: published.id, platform: "Instagram" };
}

async function publishThreads(text: string) {
  const token = required("THREADS_ACCESS_TOKEN");
  const userId = required("THREADS_USER_ID");
  const version = secret("META_GRAPH_VERSION") || "v23.0";
  const base = `https://graph.threads.net/${version}`;

  const containerResponse = await fetch(`${base}/${encodeURIComponent(userId)}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ media_type: "TEXT", text, access_token: token }),
  });
  const container = await readApi(containerResponse, "Threads投稿作成");

  const publishResponse = await fetch(`${base}/${encodeURIComponent(userId)}/threads_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ creation_id: container.id, access_token: token }),
  });
  const published = await readApi(publishResponse, "Threads公開");
  return { id: published.id, platform: "Threads" };
}

async function readApi(response: Response, label: string) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body.detail || body.error?.message || body.title || body.message || response.statusText;
    throw new Error(`${label}: ${detail}`);
  }
  return body;
}

function secret(name: string) {
  return Deno.env.get(name) || "";
}

function required(name: string) {
  const value = secret(name);
  if (!value) throw new Error(`${name}がSupabase Secretsに設定されていません`);
  return value;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}
