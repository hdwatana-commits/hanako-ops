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
    const imageCount = look.imageCount === 4 ? 4 : 3;
    if (paths.length >= imageCount) throw new Error("This draft already has all requested images");
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
      image_paths: paths, look, status: paths.length === imageCount ? "ready" : "generating",
      lease_until: null, error: "", updated_at: new Date().toISOString(),
    });
    return respond({ id: draft.id, status: paths.length === imageCount ? "ready" : "generating", imageCount: paths.length, targetImageCount: imageCount });
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
  // Explicit SNS catalogue entries only: fixed settings retain their selected
  // everyday background; automatic variation keeps the existing defaults above.
  allowedLocationIds.push(
    "dailyGirlLocationHomeToiletDoor", "dailyGirlLocationRoadsideResidentialWall", "dailyGirlLocationHomeWashroomOuterDoor", "dailyGirlLocationClosetSlidingDoor", "dailyGirlLocationPlainBedroomDoor",
    "dailyGirlLocationKitchenSideWall", "dailyGirlLocationCurtainRailCorner", "dailyGirlLocationWoodSkirtingWall", "dailyGirlLocationShoeCabinetSide", "dailyGirlLocationDiningChairBack",
    "dailyGirlLocationHomeIntercomWall", "dailyGirlLocationLinenCabinetDoor", "dailyGirlLocationResidentialHedgeWall", "dailyGirlLocationQuietRollerShutter", "dailyGirlLocationNeighborhoodTileWall",
    "dailyGirlLocationNarrowLaneCorner", "dailyGirlLocationOrdinaryFencePath", "dailyGirlLocationUtilityPoleShadowWall", "dailyGirlLocationPedestrianStoneEdge", "dailyGirlLocationBackstreetWhiteGarage",
  );
  const overrides: Record<string, string> = fixed ? Object.fromEntries(Object.entries(saved).filter(([name, value]) => name in defaults && typeof value === "string" && value && value !== "自動")) : {};
  if (!allowedLocationIds.includes(saved.locationId)) delete overrides.location;
  // The queue snapshots this count. Never reinterpret an in-progress legacy draft.
  const imageCount = saved.imageCount === 4 ? 4 : 3;
  const storyTheme = ["auto", "cafe", "date", "outfit", "surprise"].includes(saved.storyTheme) ? saved.storyTheme : "auto";
  const story = imageCount === 4 ? chooseStory(storyTheme, hash) : null;
  return { ...defaults, ...overrides, imageCount, storyTheme, ...(story ? { story } : {}), manualRequested: saved.manualRequested === true, autoVariation: !fixed, chosen: true };
}

function chooseStory(theme: string, hash: number) {
  // Every frame is generated separately; a stored plan keeps retries and captions consistent.
  const themes: Record<string, { title: string; arc: string; shots: string[][] }> = {
    cafe: { title: "ひと休みの、小さなときめき", arc: "目が合う → 服の可愛いところ → くつろぐ仕草 → また会いたくなる笑顔", shots: [
      ["表紙・目が合う", "休憩の一瞬にカメラを見つける", "手を胸元より下で自然に重ね、顔をカメラへ向ける", "ふわっとほどける微笑み", "目線の高さの顔寄り。目と表情が主役"],
      ["発見・服の見どころ", "同じ場所でコーデの素材と小さなディテールを見せる", "片手で袖口を軽く整える", "服を見てうれしそうな横顔", "腰上の斜め構図。服の質感と手元が見える"],
      ["変化・くつろぎ", "カメラとの距離が少し縮まる自然な仕草", "体を少し横に向けてから髪を耳にかける", "目が合って照れた笑顔", "少し引いた膝上構図。同じ背景が分かる"],
      ["余韻・またね", "休憩の終わりを感じる柔らかい締め", "肩越しに振り返り、小さく手を振る", "くしゃっとした親しみのある笑顔", "顔と肩の寄り。1枚目と異なる角度"],
    ] },
    date: { title: "見つけた、待ち合わせ気分", arc: "見つける → 一歩近づく → コーデを見せる → 照れ笑いでまたね", shots: [
      ["表紙・見つけた", "カメラを見つけた瞬間の目線で引きつける", "少し首をかしげ、視線をカメラへ向ける", "驚きからうれしそうな笑顔", "バストアップ。瞳に自然なキャッチライト"],
      ["展開・近づく", "同じ場面で距離が近づく小さな変化", "カメラへ小さく一歩。片手を自然に振る", "楽しそうな自然な微笑み", "全身のファッション構図。足元まで自然に入れる"],
      ["発見・今日の服", "一緒に見たくなる服のディテール", "少し横を向き、袖口をそっと整える", "ふと目線を戻す照れた表情", "腰上の斜め構図。服と手元を見せる"],
      ["余韻・またね", "次の瞬間を想像できる自然な締め", "肩越しに振り返り、頬の近くへ片手を添える", "カメラ目線のはにかみ笑顔", "顔寄り。肩越しの角度を生かす"],
    ] },
    outfit: { title: "今日の服、いちばん好きなところ", arc: "表情で惹く → 全身のシルエット → 素材と仕草 → 余韻のポートレート", shots: [
      ["表紙・ときめき", "服を着たうれしさが伝わる一瞬", "少し首をかしげカメラを見る", "思わず目が留まる明るい微笑み", "顔と上半身の寄り。服の色も見える"],
      ["全身・シルエット", "1枚目では見えなかったコーデ全体を見せる", "片足を半歩前にして体重を自然に移す", "自信のある柔らかな笑顔", "目線の高さからの全身。衣服の輪郭が明瞭"],
      ["発見・ディテール", "素材や袖口など同じ服の可愛いポイント", "指先で袖口を軽く整え、もう一方の手は自然に下ろす", "手元からカメラへ目線を戻す楽しそうな表情", "斜めの腰上。手元と服を主役にする"],
      ["余韻・お気に入り", "コーデの最後に本人らしい表情を残す", "髪にそっと触れながら肩越しに振り返る", "少し照れた満面の笑み", "肩から顔の寄り。最初と違う角度"],
    ] },
    surprise: { title: "目が合って、思わず照れた", arc: "ふと気づく → 小さく驚く → 笑ってしまう → 照れながら手を振る", shots: [
      ["表紙・ふと目が合う", "横を見ていたところからカメラへ視線を戻す", "顔を少し横からカメラへ向ける", "好奇心のある柔らかい眼差し", "目線の高さの顔寄り"],
      ["変化・見つかった", "同じ場面でカメラに気づく小さな驚き", "胸より下で両手を自然に重ねて小さく首をかしげる", "目を少し見開いた可愛い驚き", "膝上の少し引いた構図。背景との関係も見せる"],
      ["展開・笑ってしまう", "緊張がほどける自然な笑い", "片手を口元の横へ軽く添え、肩の力を抜く", "口元を隠しすぎない自然なくしゃっとした笑顔", "腰上の斜め構図。手と表情を見せる"],
      ["余韻・また見てね", "気まずさではなく親しみが残る締め", "頬の横で小さく手を振る", "照れたカメラ目線の微笑み", "顔と肩の寄り。1枚目と違う顔の向き"],
    ] },
  };
  const id = theme === "auto" ? ["cafe", "date", "outfit", "surprise"][hash % 4] : theme;
  const selected = themes[id] || themes.outfit;
  return { id, title: selected.title, arc: selected.arc, shots: selected.shots.map(([role, beat, pose, expression, composition]) => ({ role, beat, pose, expression, composition })) };
}

async function captionFor(platform: string, look: Record<string, unknown>) {
  const count = look.imageCount === 4 ? 4 : 3;
  const story: any = look.story;
  const storyBrief = count === 4 && story?.shots?.length === 4 ? `4枚で一つのミニストーリー。題材: ${story.title}。流れ: ${story.arc}。各場面: ${story.shots.map((shot: any, i: number) => `${i + 1}枚目=${shot.beat}`).join("、")}。1枚目の表情で目を引き、最後に余韻が残る自然なひと言へ。画像の説明を番号付きで羅列せず、同じテーマの一つの投稿文にする。カフェ/デートは撮影の雰囲気であり、実際に出かけた・交際したとは書かない。バズや反応数を保証しない。` : "";
  const prompt = `成人の架空ファッションモデル「ハナ」の写真${count}枚に共通する日本語のSNS投稿文を1つ作成。投稿先: ${platform}。テーマ: ${look.scene}。場所: ${look.location}。服装: ${look.outfit}。${storyBrief}${platform === "Threads" ? "親しみやすい2〜4行。最後に自然に返信したくなる問いかけを1つ。可愛さ重視。" : "可愛さと上品な色気のある自然な一人称。3〜5行。"} 実際の行動、店名、居住地、恋愛、個人情報を捏造しない。楽天誘導、商品広告はしない。投稿文だけ返す。`;
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
  const count = look.imageCount === 4 ? 4 : 3;
  if (!Number.isInteger(index) || index < 0 || index >= count) throw new Error("Requested shot is outside this draft's image count");
  const story: any = look.story;
  const legacyShots = instagram
    ? [[look.pose, look.expression, look.composition], ["髪に触れながら振り返る", "自然な笑顔", "腰上の斜め構図"], ["座ってカメラを見る", "照れた眼差し", "顔が主役の寄り構図"]]
    : [[look.pose, look.expression, look.composition], ["髪を耳にかける", "ほどける笑顔", look.composition], ["頬に手を添える", "首をかしげた照れ笑い", look.composition]];
  const fallbackStory = count === 4 ? chooseStory("outfit", 0) : null;
  const shot = count === 4 ? (story?.shots?.length === 4 ? story.shots[index] : fallbackStory!.shots[index]) : null;
  const [pose, expression, composition] = shot ? [shot.pose, shot.expression, shot.composition] : legacyShots[index];
  const storyPrompt = shot ? ` Four-photo story theme: ${story?.title || fallbackStory!.title}. Narrative order: ${story?.arc || fallbackStory!.arc}. This frame's role: ${shot.role}. Moment: ${shot.beat}. Make this a clearly different framing and gesture from the continuity reference, while preserving the same adult identity, costume, hairstyle, location, props and lighting. This is a staged portrait story, not proof of an actual visit or relationship. Use the chosen location exactly; a theme must not relocate the subject or invent a cafe.` : "";
  const prompt = `IMPORTANT OUTPUT CONTRACT: Generate exactly ONE image file for this API call (n=1). The canvas must show ONE continuous scene and ONE portrait shot. Never compose multiple camera frames, side-by-side portraits, a diptych, triptych, collage, contact sheet, grid, storyboard or comic panels inside this image. Other shots will be made by separate API calls. Create one photorealistic vertical 4:5 editorial photo of the same adult woman in a ${count}-photo series. The first supplied image is the person's identity reference: retain recognizable facial features and adult appearance. ${syntheticReference ? "The second supplied image is the prior AI-generated shot: use it only for continuity of the outfit, hair and setting; do not copy its borders or create a before-and-after composition." : "Establish a consistent outfit, hair and setting for the series."} Scene: ${look.scene}. Same exact location in all ${count}: ${look.location}. Same exact outfit and hair in all ${count}: ${look.outfit}, ${look.hair}. Light: ${look.light}. This API call makes shot ${index + 1} only.${storyPrompt} Pose: ${pose}. Expression: ${expression}. Framing: ${composition}. ${instagram ? "Charming, elegant, subtly flirtatious fashion portrait." : "Warm, approachable, cute and conversation-inviting portrait."} Fully opaque clothing, no underwear visible. Keep hems, collars and buttons naturally in place throughout. Indoors no shoes. Natural anatomy, realistic hands and eyes, believable fabric, authentic camera light. No artificial skin, distortions, extra limbs or fingers. No text, logos, watermarks, split panels or borders. Return just the single unpartitioned image.`;
  const form = new FormData();
  form.set("model", Deno.env.get("OPENAI_IMAGE_MODEL") || "gpt-image-2");
  form.set("prompt", prompt);
  form.set("size", "1024x1280");
  form.set("quality", "high");
  form.set("output_format", "jpeg");
  form.set("output_compression", "88");
  form.set("n", "1");
  for (const [position, url] of [personalReference, syntheticReference].filter(Boolean).entries()) {
    const input = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!input.ok) throw new Error(`Reference image download: ${input.status}`);
    form.append("image[]", await input.blob(), `reference-${position + 1}.jpg`);
  }
  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST", headers: { Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: form,
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
