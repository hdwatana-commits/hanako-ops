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
