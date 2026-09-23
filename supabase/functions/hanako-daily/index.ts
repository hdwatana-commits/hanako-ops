// Cron-only. The owner explicitly opts in to using their selected private photo
// as an image-generation reference; no private URLs are returned to the browser.
const base = Deno.env.get("SUPABASE_URL") || "";
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const bucket = "hanako-private-photos";

Deno.serve(async (request) => {
  if (request.method !== "POST") return respond({ error: "POST only" }, 405);
  if (!Deno.env.get("HANAKO_CRON_SECRET") || request.headers.get("x-cron-secret") !== Deno.env.get("HANAKO_CRON_SECRET")) return respond({ error: "Unauthorized" }, 401);
  if (!base || !key || !Deno.env.get("OPENAI_API_KEY") || !Deno.env.get("HANAKO_OWNER_USER_ID")) return respond({ error: "Server secrets are incomplete" }, 503);
  let draft: any = null;
  try {
    draft = await db("/rest/v1/rpc/hanako_claim_daily_image", "POST", { owner_id: Deno.env.get("HANAKO_OWNER_USER_ID") });
    if (!draft) return respond({ status: "idle" });
    const paths: string[] = Array.isArray(draft.image_paths) ? [...draft.image_paths] : [];
    const look = chooseLook(draft);
    if (!draft.caption) {
      const caption = await captionFor(draft.platform, look);
      await db(`/rest/v1/hanako_auto_drafts?id=eq.${draft.id}`, "PATCH", {
        caption, look, status: "generating", lease_until: null, error: "", updated_at: new Date().toISOString(),
      });
      return respond({ id: draft.id, status: "generating", step: "caption" });
    }
    const ownerPrefix = `${draft.user_id}/`;
    const referencePath = String(draft.reference_path || "");
    if (!referencePath.startsWith(ownerPrefix) || referencePath.includes("/drafts/")) throw new Error("Selected personal photo path is invalid");
    const personalReference = await signPrivateImage(referencePath, ownerPrefix);
    const syntheticReference = paths.length ? await signPrivateImage(paths[0], `${draft.user_id}/drafts/${draft.id}/`) : "";
    const image = await imageFor(draft.platform, look, paths.length, personalReference, syntheticReference);
    const path = `${draft.user_id}/drafts/${draft.id}/${paths.length + 1}.jpg`;
    await upload(path, image);
    paths.push(path);
    await db(`/rest/v1/hanako_auto_drafts?id=eq.${draft.id}`, "PATCH", {
      image_paths: paths, look, status: paths.length === 3 ? "ready" : "generating",
      lease_until: null, error: "", updated_at: new Date().toISOString(),
    });
    return respond({ id: draft.id, status: paths.length === 3 ? "ready" : "generating", imageCount: paths.length });
  } catch (error) {
    if (draft?.id) await db(`/rest/v1/hanako_auto_drafts?id=eq.${draft.id}`, "PATCH", {
      status: "failed", lease_until: null, error: safeError(error), updated_at: new Date().toISOString(),
    }).catch(() => {});
    return respond({ error: safeError(error) }, 500);
  }
});

function chooseLook(draft: any) {
  const saved = draft.look && typeof draft.look === "object" ? draft.look : {};
  if (saved.chosen === true) return saved;
  const instagram = draft.platform === "Instagram";
  const seed = `${draft.user_id}:${draft.local_date}:${draft.platform}`;
  const hash = [...seed].reduce((n, letter) => (n * 33 + letter.charCodeAt(0)) >>> 0, 5381);
  const pick = (items: string[], offset: number) => items[(hash + offset) % items.length];
  const defaults = {
    scene: pick(instagram ? ["やわらかな休日", "窓辺のデート服", "午後のスタジオ", "公園の散歩", "部屋で過ごす朝"] : ["今日の小さな出来事", "カフェのひと休み", "雨の日の気分", "今日の服のこと", "ふと笑った瞬間"], 0),
    location: pick(instagram ? ["自宅の窓辺", "自宅のリビング", "自然光の撮影スタジオ", "パステルの撮影スタジオ", "公園"] : ["自宅の窓辺", "自宅のリビング", "撮影スタジオ", "カフェ", "書店", "公園", "八百屋の一角"], 3),
    outfit: pick(instagram ? ["アイボリーのニットと上品なミニスカート", "淡色のツイードワンピース", "リボン付きブラウスとフレアスカート", "黒のニットとプリーツスカート", "花柄ワンピースとカーディガン"] : ["淡色のカーディガンと花柄ワンピース", "白ブラウスとツイードスカート", "リボン付きニットとフレアスカート", "自然体のカフェコーデ", "アイボリーのニットとプリーツスカート"], 7),
    hair: pick(["自然なロングヘア", "ゆるい巻き髪", "低めポニーテール", "柔らかなハーフアップ", "サイドに流した髪"], 11),
    light: pick(["午前の柔らかな自然光", "午後の暖かな光", "曇りの日の拡散光", "夕方の穏やかな光"], 17),
    pose: pick(instagram ? ["髪にそっと触れる", "肩越しに振り返る", "窓辺で座る", "一歩近づく", "服のリボンを整える"] : ["頬杖をつく", "カップを両手で持つ", "髪を耳にかける", "少し首をかしげる", "手を軽く振る"], 23),
    expression: pick(instagram ? ["はにかみ笑顔", "柔らかく見つめる", "いたずらっぽい微笑み", "自然な満面の笑み"] : ["はにかみ笑顔", "くしゃっとした笑顔", "少し照れた笑顔", "好奇心のある眼差し"], 29),
    composition: pick(instagram ? ["バストアップ", "腰上のポートレート", "全身のファッション写真"] : ["顔のアップ", "バストアップ", "バストアップ", "腰上のポートレート"], 31),
  };
  const fixed = saved.autoVariation === false;
  const allowedLocationIds = instagram
    ? ["homeLiving", "homeSofa", "homeBedroom", "homeBed", "homeKitchen", "homeWindow", "homeDesk", "homeVanity", "room", "studioDaylight", "studioPastel", "studioNoir", "park"]
    : ["homeLiving", "homeSofa", "homeBedroom", "homeBed", "homeKitchen", "homeWindow", "homeDesk", "homeVanity", "room", "studioDaylight", "studioPastel", "studioNoir", "park", "cafe", "cafeTerrace", "bookstore", "museum", "riverside", "street", "rooftop", "grocer", "pianoBar", "noodle"];
  const overrides: Record<string, string> = fixed ? Object.fromEntries(Object.entries(saved).filter(([name, value]) => name in defaults && typeof value === "string" && value && value !== "自動")) : {};
  if (!allowedLocationIds.includes(saved.locationId)) delete overrides.location;
  return { ...defaults, ...overrides, autoVariation: !fixed, chosen: true };
}

async function captionFor(platform: string, look: Record<string, unknown>) {
  const prompt = `成人の架空ファッションモデル「ハナ」の写真3枚に共通する日本語のSNS投稿文を1つ作成。投稿先: ${platform}。テーマ: ${look.scene}。場所: ${look.location}。服装: ${look.outfit}。${platform === "Threads" ? "親しみやすい2〜4行。最後に自然に返信したくなる問いかけを1つ。可愛さ重視。" : "可愛さと上品な色気のある自然な一人称。3〜5行。"} 実際の行動、店名、居住地、恋愛、個人情報を捏造しない。楽天誘導、商品広告はしない。投稿文だけ返す。`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST", headers: aiHeaders(),
    body: JSON.stringify({ model: Deno.env.get("OPENAI_TEXT_MODEL") || "gpt-5.5", input: prompt, max_output_tokens: 350, reasoning: { effort: "none" } }),
    signal: AbortSignal.timeout(90_000),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Caption API: ${body.error?.message || response.status}`);
  const text = String(body.output_text || body.output?.flatMap((item: { content?: { text?: string }[] }) => item.content || []).map((item: { text?: string }) => item.text || "").join("") || "").trim();
  if (!text) throw new Error("Caption API returned empty text");
  return text.slice(0, 2100);
}

async function imageFor(platform: string, look: Record<string, unknown>, index: number, personalReference: string, syntheticReference: string) {
  const instagram = platform === "Instagram";
  const shots = instagram
    ? [[look.pose, look.expression, look.composition], ["髪に触れながら振り返る", "自然な笑顔", "腰上の斜め構図"], ["座ってカメラを見る", "照れた眼差し", "顔が主役の寄り構図"]]
    : [[look.pose, look.expression, look.composition], ["髪を耳にかける", "ほどける笑顔", look.composition], ["頬に手を添える", "首をかしげた照れ笑い", look.composition]];
  const [pose, expression, composition] = shots[index];
  const prompt = `Create one photorealistic vertical 4:5 editorial photo of the same adult woman in a three-photo series. The first supplied image is the person's identity reference: retain recognizable facial features and adult appearance. ${syntheticReference ? "The second supplied image is the prior AI-generated shot: use it only for continuity of the outfit, hair and setting." : "Establish a consistent outfit, hair and setting for the series."} Scene: ${look.scene}. Same exact location in all three: ${look.location}. Same exact outfit and hair in all three: ${look.outfit}, ${look.hair}. Light: ${look.light}. Shot ${index + 1} of 3. Pose: ${pose}. Expression: ${expression}. Framing: ${composition}. ${instagram ? "Charming, elegant, subtly flirtatious fashion portrait." : "Warm, approachable, cute and conversation-inviting portrait."} Fully opaque clothing, no underwear visible. Indoors no shoes. Natural anatomy, realistic hands and eyes, believable fabric, authentic camera light. No artificial skin, distortions, extra limbs or fingers. No text, logos, watermarks, split panels or borders.`;
  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST", headers: aiHeaders(),
    body: JSON.stringify({ model: Deno.env.get("OPENAI_IMAGE_MODEL") || "gpt-image-2", images: [{ image_url: personalReference }, ...(syntheticReference ? [{ image_url: syntheticReference }] : [])], input_fidelity: "high", prompt, size: "1024x1280", quality: "high", output_format: "jpeg", output_compression: 88, n: 1 }),
    signal: AbortSignal.timeout(130_000),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Image API: ${body.error?.message || response.status}`);
  const encoded = body.data?.[0]?.b64_json;
  if (!encoded) throw new Error("Image API returned no image");
  return decodeBase64(encoded);
}

function decodeBase64(value: string) {
  const output = new Uint8Array(Math.floor(value.length * 3 / 4));
  let offset = 0;
  for (let start = 0; start < value.length; start += 32768) {
    const chunk = atob(value.slice(start, start + 32768));
    for (let i = 0; i < chunk.length; i++) output[offset++] = chunk.charCodeAt(i);
  }
  return output.subarray(0, offset);
}

async function signPrivateImage(path: string, ownerPrefix: string) {
  if (!path.startsWith(ownerPrefix)) throw new Error("Photo does not belong to this owner or draft");
  const response = await fetch(`${base}/storage/v1/object/sign/${bucket}/${encodePath(path)}`, {
    method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 600 }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Image sign: ${data.message || response.status}`);
  const signed = String(data.signedURL || data.signedUrl || "");
  if (!signed) throw new Error("Generated image URL is empty");
  return /^https?:\/\//.test(signed) ? signed : `${base}/storage/v1${signed.startsWith("/") ? "" : "/"}${signed}`;
}

async function upload(path: string, image: Uint8Array) {
  const response = await fetch(`${base}/storage/v1/object/${bucket}/${encodePath(path)}`, {
    method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "image/jpeg", "x-upsert": "true" }, body: image,
  });
  if (!response.ok) throw new Error(`Image save: ${response.status} ${await response.text()}`);
}

async function db(path: string, method: string, body: unknown): Promise<any> {
  const response = await fetch(`${base}${path}`, {
    method, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Database: ${response.status} ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function aiHeaders() { return { Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`, "Content-Type": "application/json" }; }
function encodePath(path: string) { return path.split("/").map(encodeURIComponent).join("/"); }
function safeError(error: unknown) { return (error instanceof Error ? error.message : "Daily generation failed").slice(0, 500); }
function respond(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } }); }
