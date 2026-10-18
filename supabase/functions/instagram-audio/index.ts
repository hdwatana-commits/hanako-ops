// Official Meta Audio API. Credentials stay in Edge Function Secrets.
// References: developers.facebook.com/docs/instagram-platform/content-publishing/audio-api/
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const bucket = 'hanako-private-reels';
const maxBytes = 40 * 1024 * 1024;
class ApiError extends Error { constructor(message: string, public status = 400, public code = 'AUDIO_ERROR') { super(message); } }
const secret = (name: string) => Deno.env.get(name) || '';
function required(name: string) { const value = secret(name); if (!value) throw new ApiError(`${name}がサーバーに設定されていません`, 503, 'SETUP_REQUIRED'); return value; }
function json(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }); }
async function checked(response: Response, label: string) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const metaCode = Number(data.error?.code || 0);
    const hint = metaCode === 190 ? 'Instagramのアクセストークンを更新してください。' : [10, 200].includes(metaCode) ? 'Facebookページ連携・Facebook Login・instagram_basic / instagram_content_publish権限とアプリ審査を確認してください。' : '';
    let detail = String(data.error?.message || data.message || data.msg || response.statusText).slice(0, 500);
    for (const key of ['INSTAGRAM_ACCESS_TOKEN','SUPABASE_SERVICE_ROLE_KEY']) if (secret(key)) detail = detail.split(secret(key)).join('[redacted]');
    throw new ApiError(`${label}: ${hint || detail}`, response.status === 401 ? 401 : 400, metaCode ? `META_${metaCode}` : 'UPSTREAM_ERROR');
  }
  return data;
}
async function owner(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!token) throw new ApiError('OPSのクラウドにログインしてください。', 401, 'LOGIN_REQUIRED');
  const response = await fetch(`${required('SUPABASE_URL')}/auth/v1/user`, { headers: { apikey: required('SUPABASE_ANON_KEY'), Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new ApiError('ログインの有効期限を確認してください。', 401, 'LOGIN_REQUIRED');
  const user = await response.json();
  if (user.id !== required('HANAKO_OWNER_USER_ID')) throw new ApiError('このInstagramアカウントを操作する権限がありません。', 403, 'OWNER_REQUIRED');
  return String(user.id);
}
async function graph(path: string, params: Record<string, string> = {}, method = 'GET') {
  const version = secret('META_GRAPH_VERSION') || 'v23.0';
  if (!/^v\d+\.\d+$/.test(version)) throw new ApiError('META_GRAPH_VERSIONを確認してください。');
  const url = new URL(`https://graph.facebook.com/${version}/${path}`);
  const form = new URLSearchParams(params);
  // Bearer header avoids access tokens in query strings, logs, and returned links.
  if (method === 'GET') url.search = form.toString();
  let response;
  try { response = await fetch(url, { method, headers: { Authorization: `Bearer ${required('INSTAGRAM_ACCESS_TOKEN')}`, ...(method === 'POST' ? { 'Content-Type':'application/x-www-form-urlencoded' } : {}) }, ...(method === 'POST' ? { body: form } : {}), signal: AbortSignal.timeout(20000) }); }
  catch { throw new ApiError('Instagramの応答を確認できませんでした。投稿操作の再送はせず、Instagram側の結果を確認してください。', 504, 'META_UNCERTAIN'); }
  return checked(response, 'Instagram音楽API');
}
function id(value: unknown) { const text = String(value || ''); if (!/^\d{1,30}$/.test(text)) throw new ApiError('音源IDが不正です。'); return text; }
function safeUrl(value: unknown, instagramOnly = false) {
  try { const url = new URL(String(value)); const allowed = instagramOnly ? /(^|\.)instagram\.com$/ : /(^|\.)(fbcdn\.net|fbsbx\.com|cdninstagram\.com|facebook\.com|instagram\.com)$/; return url.protocol === 'https:' && allowed.test(url.hostname) ? url.href : null; } catch { return null; }
}
function track(raw: Record<string, unknown>) {
  return { audio_id: id(raw.audio_id), title: String(raw.title || 'オリジナル音源').slice(0, 200), artist: String(raw.display_artist || raw.ig_username || '').slice(0, 200), duration_ms: Math.max(0, Number(raw.duration_in_ms) || 0), preview_url: safeUrl(raw.download_url), instagram_url: safeUrl(raw.on_platform_audio_preview_link, true), artwork_url: safeUrl(raw.cover_artwork_thumbnail_uri || raw.cover_artwork_thumbnail_url), is_ads_eligible: typeof raw.is_ads_eligible === 'boolean' ? raw.is_ads_eligible : null };
}
async function metadata(audioId: string) { return track(await graph(audioId, { user_id: required('INSTAGRAM_USER_ID') })); }
function storageHeaders() { return { apikey: required('SUPABASE_SERVICE_ROLE_KEY'), Authorization: `Bearer ${required('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type':'application/json' }; }
async function storage(path: string, method = 'GET', body?: unknown, extra: Record<string,string> = {}) {
  return fetch(`${required('SUPABASE_URL')}/storage/v1${path}`, { method, headers: { ...storageHeaders(), ...extra }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15000) });
}
async function ensureBucket() {
  const response = await storage(`/bucket/${bucket}`);
  if (response.ok) { const info = await response.json(); if (info.public) throw new ApiError('動画ストレージが公開設定です。管理者に確認してください。'); return; }
  if (![400,404].includes(response.status)) await checked(response, '動画ストレージ確認');
  const create = await storage('/bucket', 'POST', { id: bucket, name: bucket, public: false, file_size_limit: maxBytes, allowed_mime_types: ['video/mp4','application/json'] });
  if (!create.ok) { const verify = await storage(`/bucket/${bucket}`); if (!verify.ok || (await verify.json()).public) await checked(create, '動画ストレージ作成'); }
}
function jobPrefix(user: string, job: unknown) {
  const value = String(job || '');
  if (!/^\d{13}-[0-9a-f-]{36}$/.test(value)) throw new ApiError('制作ジョブIDが不正です。');
  const age = Date.now() - Number(value.slice(0,13));
  if (age < -60000 || age > 86400000) throw new ApiError('投稿準備の有効期限（24時間）が過ぎています。Instagram側の投稿結果を確認してください。');
  return `${user}/${value}`;
}
async function loadJob(prefix: string) { return checked(await storage(`/object/authenticated/${bucket}/${prefix}.json`), '投稿準備の読み込み'); }
async function saveJob(prefix: string, data: unknown, create = false) { return checked(await storage(`/object/${bucket}/${prefix}.json`, create ? 'POST' : 'PUT', data, { 'x-upsert':'false' }), '投稿準備の保存'); }
async function claim(prefix: string, kind: string) {
  const response = await storage(`/object/${bucket}/${prefix}.${kind}.json`, 'POST', { claimed_at: new Date().toISOString() }, { 'x-upsert':'false' });
  if (!response.ok) throw new ApiError('すでに処理済み、または処理結果が不明です。「投稿状況を確認」で確認してください。重複防止のため再送しません。',409,'ALREADY_STARTED');
}
async function cleanup(user: string) {
  const response = await storage(`/object/list/${bucket}`, 'POST', { prefix: `${user}/`, limit: 1000, sortBy: { column:'name', order:'asc' } });
  if (!response.ok) return;
  const files = await response.json();
  if (!Array.isArray(files)) return;
  const paths = files.filter(file => {
    const timestamp = Number(String(file.name).slice(0,13));
    return timestamp > 0 && Date.now() - timestamp > (String(file.name).endsWith('.mp4') ? 86400000 : 30 * 86400000);
  }).map(file => `${user}/${file.name}`);
  if (paths.length) await storage(`/object/${bucket}`, 'DELETE', { prefixes: paths });
}
async function jobStatus(prefix: string, job: Record<string, any>) {
  if (!job.container_id) return { state: job.state, job_id: job.job_id };
  const state = await graph(id(job.container_id), { fields:'status_code,status' });
  return { state: job.state === 'published' ? 'published' : String(state.status_code || 'IN_PROGRESS'), job_id: job.job_id, published_id: job.published_id || null };
}
Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers:cors });
  if (request.method !== 'POST') return json({ error:'POSTのみ利用できます' },405);
  try {
    const user = await owner(request);
    if (Number(request.headers.get('content-length') || 0) > 20000) throw new ApiError('リクエストが大きすぎます。',413);
    const body = await request.json();
    if (body.action === 'search' || body.action === 'status') {
      const query = String(body.query || '').trim(); if (query.length > 120) throw new ApiError('検索語は120文字以内にしてください。');
      const type = body.audio_type === 'original_sound' ? 'original_sound' : 'music';
      const response = await graph('ig_audio', { audio_type: type, user_id: required('INSTAGRAM_USER_ID'), ...(query ? { search_query: query } : {}) });
      return json({ connected:true, audio:(Array.isArray(response.audio) ? response.audio : []).slice(0,50).map(track), login_method:'facebook', exact_start_supported:false, mp4_embedding_supported:false });
    }
    if (body.action === 'metadata') return json({ audio: await metadata(id(body.audio_id)) });
    if (body.action === 'prepare') {
      const audio = await metadata(id(body.audio_id));
      if (!Number.isInteger(body.size) || body.size < 100 || body.size > maxBytes) throw new ApiError('動画は40MB以下のMP4が必要です。');
      if (![15,20,30].includes(body.duration)) throw new ApiError('動画の長さが不正です。');
      if (audio.duration_ms && audio.duration_ms < body.duration * 1000) throw new ApiError('選択した音源が動画より短いため別の音源を選択してください。');
      await ensureBucket(); await cleanup(user);
      const job = `${Date.now()}-${crypto.randomUUID()}`, prefix = jobPrefix(user,job);
      await saveJob(prefix, { job_id:job, audio_id:audio.audio_id, title:audio.title, size:body.size, duration:body.duration, state:'uploading' }, true);
      const signed = await checked(await storage(`/object/upload/sign/${bucket}/${prefix}.mp4`, 'POST', {}), '動画アップロードURL発行');
      const upload = new URL(signed.url, `${required('SUPABASE_URL')}/storage/v1/`);
      // Storage returns /object/... relative to storage/v1, not the origin.
      const uploadUrl = String(signed.url).startsWith('/object/') ? `${required('SUPABASE_URL')}/storage/v1${signed.url}` : upload.href;
      return json({ job_id:job, upload_url:uploadUrl });
    }
    const prefix = jobPrefix(user,body.job_id), job = await loadJob(prefix);
    if (body.action === 'jobStatus') return json(await jobStatus(prefix,job));
    if (body.action === 'deleteVideo') {
      await checked(await storage(`/object/${bucket}`, 'DELETE', { prefixes:[`${prefix}.mp4`] }), '一時動画の削除'); return json({ deleted:true });
    }
    if (body.action === 'createReel') {
      if (job.container_id) return json(await jobStatus(prefix,job));
      const caption = String(body.caption || '').trim(); if (caption.length > 2200) throw new ApiError('キャプションは2200文字以内にしてください。');
      await metadata(id(job.audio_id));
      // Validate the real uploaded object before exposing a signed URL to Meta.
      const info = await checked(await storage(`/object/info/${bucket}/${prefix}.mp4`), '動画の確認');
      const actualSize = Number(info.metadata?.size || info.size || 0);
      const mime = String(info.metadata?.mimetype || info.content_type || info.contentType || '');
      if (actualSize !== job.size || actualSize > maxBytes || mime !== 'video/mp4') throw new ApiError('アップロードした動画の形式またはサイズが一致しません。');
      const signed = await checked(await storage(`/object/sign/${bucket}/${prefix}.mp4`, 'POST', { expiresIn:3600 }), '動画URL発行');
      const relative = signed.signedURL || signed.signedUrl;
      const videoUrl = String(relative).startsWith('http') ? relative : `${required('SUPABASE_URL')}/storage/v1${relative}`;
      await claim(prefix,'create-lock');
      const container = await graph(`${required('INSTAGRAM_USER_ID')}/media`, { media_type:'REELS', video_url:videoUrl, caption, audio_configuration: JSON.stringify({ audio_id:job.audio_id, audio_volume:100, video_volume:1 }) }, 'POST');
      job.container_id = id(container.id); job.state = 'processing'; await saveJob(prefix,job);
      return json({ state:'IN_PROGRESS', job_id:job.job_id });
    }
    if (body.action === 'publish') {
      if (body.confirm !== true) throw new ApiError('Instagramへの公開の明示的な確認が必要です。');
      if (job.state === 'published') return json({ state:'published', published_id:job.published_id });
      if (!job.container_id) throw new ApiError('投稿準備が完了していません。');
      const current = await jobStatus(prefix,job);
      if (current.state === 'PUBLISHED') return json({ state:'published', published_id:null });
      if (current.state !== 'FINISHED') throw new ApiError('Instagramの動画処理がまだ完了していません。');
      await claim(prefix,'publish-lock');
      const published = await graph(`${required('INSTAGRAM_USER_ID')}/media_publish`, { creation_id:id(job.container_id) }, 'POST');
      job.state = 'published'; job.published_id = id(published.id); await saveJob(prefix,job);
      await storage(`/object/${bucket}`, 'DELETE', { prefixes:[`${prefix}.mp4`] });
      return json({ state:'published', published_id:job.published_id });
    }
    throw new ApiError('未対応の操作です。');
  } catch (error) {
    const known = error instanceof ApiError;
    return json({ error:known ? error.message : '音楽連携に失敗しました。ログイン・接続条件を確認してください。', code:known ? error.code : 'AUDIO_ERROR' }, known ? error.status : 500);
  }
});
