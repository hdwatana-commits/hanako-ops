import assert from "node:assert/strict";
import fs from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const source = fs.readFileSync(path.resolve("supabase/functions/social-publish/index.ts"), "utf8");

function createWorker(fetch) {
  let handler;
  const env = {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "anon",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    HANAKO_OWNER_USER_ID: "owner",
    THREADS_ACCESS_TOKEN: "threads-token",
    THREADS_USER_ID: "threads-user",
    INSTAGRAM_ACCESS_TOKEN: "instagram-token",
    INSTAGRAM_USER_ID: "instagram-user",
  };
  const context = vm.createContext({
    Deno: { env: { get: (name) => env[name] || "" }, serve: (fn) => { handler = fn; } },
    fetch, Response, Request, URLSearchParams, TextEncoder, setTimeout, crypto,
  });
  vm.runInContext(stripTypeScriptTypes(source), context);
  return (body) => handler(new Request("https://example.supabase.co/functions/v1/social-publish", {
    method: "POST", headers: { Authorization: "Bearer user-token", "Content-Type": "application/json" }, body: JSON.stringify(body),
  }));
}

test("a non-owner cannot publish to connected accounts", async () => {
  const calls = [];
  const worker = createWorker(async (url) => {
    calls.push(String(url));
    return Response.json({ id: "different-user" });
  });
  const response = await worker({ action: "publishDraft", draftId: "00000000-0000-0000-0000-000000000001" });
  assert.equal(response.status, 400);
  assert.equal(calls.length, 1);
  assert.match(calls[0], /auth\/v1\/user/);
});

test("retrying a failed draft requests the updated row", async () => {
  let patchOptions;
  const worker = createWorker(async (url, options = {}) => {
    if (String(url).includes("/auth/v1/user")) return Response.json({ id: "owner" });
    if (String(url).includes("/rest/v1/hanako_auto_drafts")) {
      patchOptions = options;
      return Response.json([{ status: "pending" }]);
    }
    throw new Error(`unexpected ${url}`);
  });
  const response = await worker({ action: "retryDraft", draftId: "00000000-0000-0000-0000-000000000001" });
  assert.equal(response.status, 200);
  assert.equal(patchOptions.headers.Prefer, "return=representation");
  assert.equal(JSON.parse(patchOptions.body).manual_requested, true);
});

test("create-now authenticates the owner and queues selected platforms without publishing", async () => {
  const calls = [];
  const worker = createWorker(async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("/auth/v1/user")) return Response.json({ id: "owner" });
    if (String(url).includes("/rpc/hanako_start_daily_drafts")) return Response.json({ status: "queued", workerDispatched: true, drafts: [{ id: "draft", platform: "Threads", status: "pending", created: true, imageCount: 4 }] });
    throw new Error(`unexpected ${url}`);
  });
  const response = await worker({ action: "createDailyDrafts", platforms: ["Threads"] });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.drafts[0].imageCount, 4);
  assert.deepEqual(JSON.parse(calls[1].options.body), { owner_id: "owner", platforms: ["Threads"] });
  assert.equal(calls.length, 2);
});

test("create-now rejects unsupported, duplicate or empty platform lists before queueing", async () => {
  for (const platforms of [[], ["X"], ["Instagram", "Instagram"], ["Instagram", "Threads", "Threads"], "Threads", null]) {
    let calls = 0;
    const worker = createWorker(async (url) => {
      calls++;
      assert.match(String(url), /auth\/v1\/user/);
      return Response.json({ id: "owner" });
    });
    const response = await worker({ action: "createDailyDrafts", platforms });
    assert.equal(response.status, 400);
    assert.equal(calls, 1);
  }
});

test("create-now cannot be called by another signed-in user", async () => {
  let calls = 0;
  const worker = createWorker(async () => { calls++; return Response.json({ id: "another-user" }); });
  assert.equal((await worker({ action: "createDailyDrafts", platforms: ["Instagram", "Threads"] })).status, 400);
  assert.equal(calls, 1);
});

for (const platform of ["Instagram", "Threads"]) test(`approved four-image ${platform} draft publishes four individual carousel items`, async () => {
  const calls = [];
  let container = 0;
  const worker = createWorker(async (url, options = {}) => {
    const address = String(url);
    const body = new URLSearchParams(options.body || "");
    calls.push({ address, body });
    if (address.includes("/auth/v1/user")) return Response.json({ id: "owner" });
    if (address.includes("/rpc/hanako_begin_publish")) return Response.json({ platform, caption: "今日はどの瞬間が好き？", image_paths: [1, 2, 3, 4].map((i) => `owner/drafts/one/${i}.jpg`) });
    if (address.includes("/storage/v1/object/sign/")) return Response.json({ signedURL: "/object/sign/hanako-private-photos/image.jpg?token=sample" });
    if (address.includes("/rest/v1/hanako_auto_drafts")) return Response.json([{ status: "published" }]);
    if (address.includes("/media_publish") || address.includes("/threads_publish")) return Response.json({ id: "published-post" });
    if (address.includes("fields=status_code")) return Response.json({ status_code: "FINISHED" });
    if (address.endsWith("/media") || address.endsWith("/threads")) return Response.json({ id: `container-${++container}` });
    throw new Error(`unexpected ${address}`);
  });
  const response = await worker({ action: "publishDraft", draftId: "00000000-0000-0000-0000-000000000001" });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).id, "published-post");
  const items = calls.filter((call) => call.body.get("is_carousel_item") === "true");
  assert.equal(items.length, 4);
  const parent = calls.find((call) => call.body.get("media_type") === "CAROUSEL");
  assert.equal(parent.body.get("children").split(",").length, 4);
  assert.equal(calls.filter((call) => /\/(media|threads)_publish$/.test(call.address)).length, 1);
});

test("approved Threads draft creates three image items, one carousel and one publish", async () => {
  const calls = [];
  let item = 0;
  const worker = createWorker(async (url, options = {}) => {
    const address = String(url);
    calls.push({ address, body: String(options.body || "") });
    if (address.includes("/auth/v1/user")) return Response.json({ id: "owner" });
    if (address.includes("/rpc/hanako_begin_publish")) return Response.json({
      id: "00000000-0000-0000-0000-000000000001", platform: "Threads", caption: "今日はどっちが好き？",
      image_paths: ["owner/drafts/one/1.jpg", "owner/drafts/one/2.jpg", "owner/drafts/one/3.jpg"],
    });
    if (address.includes("/storage/v1/object/sign/")) return Response.json({ signedURL: "/object/sign/hanako-private-photos/image.jpg?token=sample" });
    if (address.includes("/rest/v1/hanako_auto_drafts")) return Response.json([{ status: "published" }]);
    if (address.includes("/threads_publish")) return Response.json({ id: "published-post" });
    if (address.includes("/threads")) return Response.json({ id: `container-${++item}` });
    throw new Error(`unexpected ${address}`);
  });
  const response = await worker({ action: "publishDraft", draftId: "00000000-0000-0000-0000-000000000001" });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.id, "published-post");
  const threads = calls.filter((call) => call.address.endsWith("/threads"));
  assert.equal(threads.length, 4);
  assert.equal(threads.filter((call) => call.body.includes("is_carousel_item=true")).length, 3);
  assert.match(threads[3].body, /media_type=CAROUSEL/);
  assert.equal(calls.filter((call) => call.address.includes("/threads_publish")).length, 1);
});

test("approved Instagram draft waits for carousel readiness before publishing", async () => {
  const calls = [];
  let container = 0;
  const worker = createWorker(async (url, options = {}) => {
    const address = String(url);
    calls.push(address);
    if (address.includes("/auth/v1/user")) return Response.json({ id: "owner" });
    if (address.includes("/rpc/hanako_begin_publish")) return Response.json({
      platform: "Instagram", caption: "今日の服", image_paths: ["owner/drafts/one/1.jpg", "owner/drafts/one/2.jpg", "owner/drafts/one/3.jpg"],
    });
    if (address.includes("/storage/v1/object/sign/")) return Response.json({ signedURL: "/object/sign/hanako-private-photos/image.jpg?token=sample" });
    if (address.includes("/rest/v1/hanako_auto_drafts")) return Response.json([{ status: "published" }]);
    if (address.includes("/media_publish")) return Response.json({ id: "instagram-post" });
    if (address.includes("/media")) return Response.json({ id: `ig-container-${++container}` });
    if (address.includes("fields=status_code")) return Response.json({ status_code: "FINISHED" });
    throw new Error(`unexpected ${address} ${options.method || ""}`);
  });
  const response = await worker({ action: "publishDraft", draftId: "00000000-0000-0000-0000-000000000001" });
  assert.equal(response.status, 200);
  assert.equal(calls.filter((call) => call.endsWith("/media")).length, 4);
  assert.equal(calls.filter((call) => call.includes("fields=status_code")).length, 1);
  assert.equal(calls.filter((call) => call.includes("/media_publish")).length, 1);
});
