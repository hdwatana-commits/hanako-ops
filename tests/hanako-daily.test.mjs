import assert from "node:assert/strict";
import fs from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const source = fs.readFileSync(path.resolve("supabase/functions/hanako-daily/index.ts"), "utf8");

function worker(fetch = async () => { throw new Error("unexpected fetch"); }) {
  let handler;
  const context = vm.createContext({
    Deno: { env: { get: (name) => ({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service", OPENAI_API_KEY: "test", HANAKO_OWNER_USER_ID: "owner", HANAKO_CRON_SECRET: "cron" })[name] || "" }, serve: (fn) => { handler = fn; } },
    fetch,
    Response,
    FormData,
    Blob,
    AbortSignal,
    TextEncoder,
    URLSearchParams,
    Uint8Array,
    atob,
    setTimeout,
    crypto,
  });
  vm.runInContext(stripTypeScriptTypes(source), context);
  context.handleRequest = handler;
  return context;
}

test("daily look is deterministic and Instagram location remains within allowed pool", () => {
  const context = worker();
  const draft = { id: "draft", user_id: "owner", local_date: "2026-09-23", platform: "Instagram", look: { autoVariation: true } };
  const first = vm.runInContext(`chooseLook(${JSON.stringify(draft)})`, context);
  const second = vm.runInContext(`chooseLook(${JSON.stringify(draft)})`, context);
  assert.deepEqual(first, second);
  assert.match(first.location, /自宅|スタジオ|公園/);
  assert.equal(first.chosen, true);
});

test("four-image drafts keep one saved story with distinct moments and preserve a manual queue request", () => {
  const context = worker();
  for (const platform of ["Instagram", "Threads"]) for (const storyTheme of ["auto", "cafe", "date", "outfit", "surprise"]) {
    const draft = { user_id: "owner", local_date: "2026-11-01", platform, look: { imageCount: 4, storyTheme, manualRequested: true, autoVariation: false, locationId: "homeWindow", location: "自宅の窓辺" } };
    const look = vm.runInContext(`chooseLook(${JSON.stringify(draft)})`, context);
    assert.equal(look.imageCount, 4);
    assert.equal(look.manualRequested, true);
    assert.equal(look.location, "自宅の窓辺");
    assert.equal(look.story.shots.length, 4);
    assert.equal(new Set(look.story.shots.map((shot) => shot.role)).size, 4);
    assert.equal(new Set(look.story.shots.map((shot) => shot.pose)).size, 4);
    assert.equal(new Set(look.story.shots.map((shot) => shot.composition)).size, 4);
    const retry = vm.runInContext(`chooseLook(${JSON.stringify({ ...draft, look })})`, context);
    assert.deepEqual(retry, look);
  }
});

test("legacy drafts stay at three even when later settings request four", () => {
  const context = worker();
  const look = vm.runInContext(`chooseLook(${JSON.stringify({ user_id: "owner", platform: "Instagram", look: { instagramImageCount: 4, threadsImageCount: 4 } })})`, context);
  assert.equal(look.imageCount, 3);
  assert.equal(look.story, undefined);
});

test("story caption describes the same four scenes without inventing a real outing", async () => {
  let input;
  const context = worker(async (_url, options) => {
    input = JSON.parse(options.body).input;
    return Response.json({ output_text: "今日の可愛いところ、どこが好き？" });
  });
  await vm.runInContext(`captionFor("Threads", chooseLook({user_id:"owner",platform:"Threads",local_date:"2026-11-01",look:{imageCount:4,storyTheme:"outfit"}}))`, context);
  assert.match(input, /写真4枚/);
  assert.match(input, /今日の服、いちばん好きなところ/);
  assert.match(input, /4枚目=/);
  assert.match(input, /実際に出かけた・交際したとは書かない/);
  assert.match(input, /自然に返信したくなる問いかけ/);
});

for (const existing of [2, 3]) test(`four-image worker with ${existing} existing images finishes only after the fourth`, async () => {
  let patch;
  let imageCalls = 0;
  const draft = { id: "draft", user_id: "owner", platform: "Threads", caption: "可愛い休日", reference_path: "owner/personal.jpg", image_paths: Array.from({ length: existing }, (_, i) => `owner/drafts/draft/${i + 1}.jpg`), look: { chosen: true, imageCount: 4, manualRequested: true } };
  const context = worker(async (url, options = {}) => {
    if (url.includes("/rpc/hanako_claim_daily_image")) return Response.json(draft);
    if (url.includes("/object/sign/")) return Response.json({ signedURL: "/object/signed/image.jpg" });
    if (url.includes("/object/signed/")) return new Response(new Blob(["reference"]));
    if (url === "https://api.openai.com/v1/images/edits") {
      imageCalls++;
      assert.match(options.body.get("prompt"), /4-photo series/);
      assert.match(options.body.get("prompt"), new RegExp(`shot ${existing + 1} only`));
      return Response.json({ data: [{ b64_json: btoa("image") }] });
    }
    if (url.includes("/storage/v1/object/hanako-private-photos/")) return new Response(null, { status: 200 });
    if (url.includes("/rest/v1/hanako_auto_drafts")) { patch = JSON.parse(options.body); return new Response(null, { status: 204 }); }
    throw new Error(`Unexpected request: ${url}`);
  });
  const response = await context.handleRequest(new Request("https://example.supabase.co/functions/v1/hanako-daily", { method: "POST", headers: { "x-cron-secret": "cron" } }));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(imageCalls, 1);
  assert.equal(result.targetImageCount, 4);
  assert.equal(result.status, existing === 3 ? "ready" : "generating");
  assert.equal(patch.image_paths.length, existing + 1);
  assert.equal(patch.status, existing === 3 ? "ready" : "generating");
});

test("fixed Threads settings reject an overseas location", () => {
  const context = worker();
  const look = vm.runInContext(`chooseLook(${JSON.stringify({ user_id: "owner", local_date: "2026-09-23", platform: "Threads", look: { autoVariation: false, locationId: "paris", location: "パリ", hair: "ポニーテール" } })})`, context);
  assert.notEqual(look.location, "パリ");
  assert.equal(look.hair, "ポニーテール");
});

test("image edit sends the private identity reference and keeps 4:5 portrait output", async () => {
  let request;
  const context = worker(async (url, options) => {
    if (url === "https://example.com/reference") {
      return { ok: true, blob: async () => new Blob(["reference-bytes"], { type: "image/jpeg" }) };
    }
    request = { url, body: options.body, headers: options.headers };
    return { ok: true, json: async () => ({ data: [{ b64_json: btoa("jpeg-bytes") }] }) };
  });
  const image = await vm.runInContext(`imageFor("Instagram", { scene: "朝", location: "自宅", outfit: "ワンピース", hair: "ロング", light: "自然光", pose: "座る", expression: "笑顔", composition: "バストアップ" }, 0, "https://example.com/reference", "")`, context);
  assert.equal(request.url, "https://api.openai.com/v1/images/edits");
  assert.equal(request.body.get("model"), "gpt-image-2");
  assert.equal(request.body.get("size"), "1024x1280");
  assert.equal(request.body.get("n"), "1");
  assert.match(request.body.get("prompt"), /exactly ONE image file/);
  assert.match(request.body.get("prompt"), /Never compose multiple camera frames/);
  assert.equal(request.body.getAll("image[]").length, 1);
  assert.equal(await request.body.get("image[]").text(), "reference-bytes");
  assert.equal(request.headers.Authorization, "Bearer test");
  assert.equal(new TextDecoder().decode(image), "jpeg-bytes");
});
