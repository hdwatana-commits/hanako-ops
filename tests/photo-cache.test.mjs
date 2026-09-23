import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const listeners = {};
const deleted = [];
const self = {
  location: { origin: "https://example.github.io" },
  addEventListener(name, handler) { listeners[name] = handler; },
  clients: { claim() {} },
  skipWaiting() {},
};
const caches = {
  keys: async () => ["hanako-room-ops-v314", "hanako-room-ops-v315", "hanako-private-photo-previews-v1"],
  delete: async (name) => { deleted.push(name); },
};
vm.runInNewContext(readFileSync(new URL("../sw.js", import.meta.url), "utf8"), { self, caches, URL, fetch: async () => ({ ok: true }) });

test("app update preserves private photo previews", async () => {
  let activation;
  listeners.activate({ waitUntil(promise) { activation = promise; } });
  await activation;
  assert.deepEqual(deleted, ["hanako-room-ops-v314"]);
});

test("service worker never intercepts Supabase private images", () => {
  let intercepted = false;
  listeners.fetch({
    request: { method: "GET", url: "https://project.supabase.co/storage/v1/object/authenticated/hanako-private-photos/user/photo.jpg" },
    respondWith() { intercepted = true; },
  });
  assert.equal(intercepted, false);
});
