import assert from "node:assert/strict";
import fs from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const source = fs.readFileSync(path.resolve("supabase/functions/hanako-daily/index.ts"), "utf8");

function worker(fetch = async () => { throw new Error("unexpected fetch"); }) {
  const context = vm.createContext({
    Deno: { env: { get: (name) => ({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service", OPENAI_API_KEY: "test", HANAKO_OWNER_USER_ID: "owner", HANAKO_CRON_SECRET: "cron" })[name] || "" }, serve: () => {} },
    fetch,
    Response,
    AbortSignal,
    TextEncoder,
    URLSearchParams,
    Uint8Array,
    atob,
    setTimeout,
    crypto,
  });
  vm.runInContext(stripTypeScriptTypes(source), context);
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

test("fixed Threads settings reject an overseas location", () => {
  const context = worker();
  const look = vm.runInContext(`chooseLook(${JSON.stringify({ user_id: "owner", local_date: "2026-09-23", platform: "Threads", look: { autoVariation: false, locationId: "paris", location: "パリ", hair: "ポニーテール" } })})`, context);
  assert.notEqual(look.location, "パリ");
  assert.equal(look.hair, "ポニーテール");
});

test("image edit sends the private identity reference and keeps 4:5 portrait output", async () => {
  let request;
  const context = worker(async (url, options) => {
    request = { url, body: JSON.parse(options.body) };
    return { ok: true, json: async () => ({ data: [{ b64_json: btoa("jpeg-bytes") }] }) };
  });
  const image = await vm.runInContext(`imageFor("Instagram", { scene: "朝", location: "自宅", outfit: "ワンピース", hair: "ロング", light: "自然光", pose: "座る", expression: "笑顔", composition: "バストアップ" }, 0, "https://example.com/reference", "")`, context);
  assert.equal(request.url, "https://api.openai.com/v1/images/edits");
  assert.equal(request.body.images[0].image_url, "https://example.com/reference");
  assert.equal(request.body.size, "1024x1280");
  assert.equal(new TextDecoder().decode(image), "jpeg-bytes");
});
