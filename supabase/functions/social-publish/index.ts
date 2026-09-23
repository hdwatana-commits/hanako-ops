const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "POSTのみ利用できます" }, 405);

  try {
    const ownerId = await requireOwner(request);
    const body = await request.json();
    if (body.action === "status") {
      return json({
        connections: {
          x: Boolean(secret("X_API_KEY") && secret("X_API_SECRET") && secret("X_ACCESS_TOKEN") && secret("X_ACCESS_TOKEN_SECRET")),
          instagram: Boolean(secret("INSTAGRAM_ACCESS_TOKEN") && secret("INSTAGRAM_USER_ID")),
          threads: Boolean(secret("THREADS_ACCESS_TOKEN") && secret("THREADS_USER_ID")),
        },
      });
    }

    if (body.action === "publishDraft") return json(await publishDraft(String(body.draftId || ""), ownerId));
    if (body.action === "retryDraft") return json(await retryDraft(String(body.draftId || ""), ownerId));
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

async function requireOwner(request: Request) {
  const configuredOwner = required("HANAKO_OWNER_USER_ID");
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!token) throw new Error("ログインが必要です");
  const response = await fetch(`${required("SUPABASE_URL")}/auth/v1/user`, {
    headers: { apikey: required("SUPABASE_ANON_KEY"), Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("ログインを確認できませんでした");
  const user = await response.json();
  if (user.id !== configuredOwner) throw new Error("このSNSアカウントの公開権限がありません");
  return String(user.id);
}

async function publishDraft(id: string, ownerId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("下書きIDが不正です");
  const draft = await serviceDb("/rest/v1/rpc/hanako_begin_publish", "POST", { draft_id: id, owner_id: ownerId });
  let startedMeta = false;
  try {
    const urls = await Promise.all((draft.image_paths || []).map((path: string) => signPrivatePhoto(path)));
    startedMeta = true;
    const result = draft.platform === "Instagram"
      ? await publishInstagramCarousel(draft.caption, urls)
      : await publishThreadsCarousel(draft.caption, urls);
    await serviceDb(`/rest/v1/hanako_auto_drafts?id=eq.${encodeURIComponent(id)}`, "PATCH", {
      status: "published", published_id: result.id || "", error: "", updated_at: new Date().toISOString(),
    });
    return result;
  } catch (error) {
    // A timed-out Meta request may have succeeded. Never retry automatically.
    await serviceDb(`/rest/v1/hanako_auto_drafts?id=eq.${encodeURIComponent(id)}`, "PATCH", {
      status: startedMeta ? "publish_uncertain" : "ready", error: error instanceof Error ? error.message.slice(0, 500) : "公開結果を確認できませんでした",
      updated_at: new Date().toISOString(),
    }).catch(() => {});
    if (!startedMeta) throw error;
    throw new Error("公開結果を確認できません。SNS側を確認してください。重複防止のため再送は停止しました");
  }
}

async function retryDraft(id: string, ownerId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("下書きIDが不正です");
  const updated = await serviceDb(`/rest/v1/hanako_auto_drafts?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(ownerId)}&status=eq.failed`, "PATCH", {
    status: "pending", error: "", lease_until: null, updated_at: new Date().toISOString(),
  });
  if (!Array.isArray(updated) || !updated.length) throw new Error("再試行できる下書きがありません");
  return { status: "pending" };
}

async function signPrivatePhoto(path: string) {
  const response = await fetch(`${required("SUPABASE_URL")}/storage/v1/object/sign/hanako-private-photos/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "POST",
    headers: { apikey: required("SUPABASE_SERVICE_ROLE_KEY"), Authorization: `Bearer ${required("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  const result = await readApi(response, "画像URL発行");
  const signed = String(result.signedURL || result.signedUrl || "");
  if (!signed) throw new Error("画像URLがありません");
  return /^https?:\/\//.test(signed) ? signed : `${required("SUPABASE_URL")}/storage/v1${signed.startsWith("/") ? "" : "/"}${signed}`;
}

async function serviceDb(path: string, method: string, body: unknown) {
  const response = await fetch(`${required("SUPABASE_URL")}${path}`, {
    method,
    headers: { apikey: required("SUPABASE_SERVICE_ROLE_KEY"), Authorization: `Bearer ${required("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.status === 204 ? null : readApi(response, "下書きの更新");
}

async function publishInstagramCarousel(caption: string, urls: string[]) {
  if (urls.length !== 3) throw new Error("Instagram用画像が3枚必要です");
  const token = required("INSTAGRAM_ACCESS_TOKEN");
  const userId = required("INSTAGRAM_USER_ID");
  const base = `https://graph.facebook.com/${secret("META_GRAPH_VERSION") || "v23.0"}`;
  const children: string[] = [];
  for (const imageUrl of urls) {
    const response = await fetch(`${base}/${encodeURIComponent(userId)}/media`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ image_url: imageUrl, is_carousel_item: "true", access_token: token }),
    });
    children.push((await readApi(response, "Instagram画像登録")).id);
  }
  const parentResponse = await fetch(`${base}/${encodeURIComponent(userId)}/media`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ media_type: "CAROUSEL", children: children.join(","), caption, access_token: token }),
  });
  const parent = await readApi(parentResponse, "Instagramカルーセル作成");
  await waitInstagramContainer(base, parent.id, token);
  const publishResponse = await fetch(`${base}/${encodeURIComponent(userId)}/media_publish`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ creation_id: parent.id, access_token: token }),
  });
  const result = await readApi(publishResponse, "Instagram公開");
  return { id: result.id, platform: "Instagram" };
}

async function waitInstagramContainer(base: string, id: string, token: string) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const response = await fetch(`${base}/${encodeURIComponent(id)}?fields=status_code&access_token=${encodeURIComponent(token)}`);
    const result = await readApi(response, "Instagram画像処理");
    if (result.status_code === "FINISHED") return;
    if (result.status_code === "ERROR" || result.status_code === "EXPIRED") throw new Error(`Instagram画像処理: ${result.status_code}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("Instagramの画像処理がまだ完了していません");
}

async function publishThreadsCarousel(text: string, urls: string[]) {
  if (urls.length !== 3) throw new Error("Threads用画像が3枚必要です");
  const token = required("THREADS_ACCESS_TOKEN");
  const userId = required("THREADS_USER_ID");
  const base = `https://graph.threads.net/${secret("META_GRAPH_VERSION") || "v23.0"}`;
  const children: string[] = [];
  for (const imageUrl of urls) {
    const response = await fetch(`${base}/${encodeURIComponent(userId)}/threads`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ media_type: "IMAGE", image_url: imageUrl, is_carousel_item: "true", access_token: token }),
    });
    children.push((await readApi(response, "Threads画像登録")).id);
  }
  const parentResponse = await fetch(`${base}/${encodeURIComponent(userId)}/threads`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ media_type: "CAROUSEL", children: children.join(","), text, access_token: token }),
  });
  const parent = await readApi(parentResponse, "Threadsカルーセル作成");
  const publishResponse = await fetch(`${base}/${encodeURIComponent(userId)}/threads_publish`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ creation_id: parent.id, access_token: token }),
  });
  const result = await readApi(publishResponse, "Threads公開");
  return { id: result.id, platform: "Threads" };
}

async function publishX(text: string) {
  const apiKey = required("X_API_KEY");
  const apiSecret = required("X_API_SECRET");
  const accessToken = required("X_ACCESS_TOKEN");
  const accessTokenSecret = required("X_ACCESS_TOKEN_SECRET");
  const url = "https://api.x.com/2/tweets";
  const oauth = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomUUID().replaceAll("-", ""),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };
  const parameterString = Object.entries(oauth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${percent(key)}=${percent(value)}`)
    .join("&");
  const signatureBase = `POST&${percent(url)}&${percent(parameterString)}`;
  const signingKey = `${percent(apiSecret)}&${percent(accessTokenSecret)}`;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingKey),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(signatureBase));
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
  const authorization = `OAuth ${Object.entries({ ...oauth, oauth_signature: signature })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${percent(key)}="${percent(value)}"`)
    .join(", ")}`;
  const response = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const result = await readApi(response, "X");
  return { id: result.data?.id, platform: "X" };
}

function percent(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
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
