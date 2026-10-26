import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("published version matches the app script and service worker cache", () => {
  const version = JSON.parse(read("version.json")).version;
  const index = read("index.html");
  const worker = read("sw.js");

  assert.match(index, new RegExp(`app\\.js\\?v=${version}["']`));
  assert.match(worker, new RegExp(`hanako-room-ops-v${version}["']`));
  assert.equal((worker.match(new RegExp(`app\\.js\\?v=${version}`, "g")) || []).length, 2);
});
