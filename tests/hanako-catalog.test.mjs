import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const start = source.indexOf("const hanakoExtraOutfits = [");
const end = source.indexOf("const hanakoIdeaCatalog = [", start);
const catalogs = vm.runInNewContext(`${source.slice(start, end)}\n({ outfits: hanakoExtraOutfits, expressions: hanakoExtraExpressions, poses: hanakoExtraPoses, locations: hanakoExtraLocations })`);

test("Hanako catalogs have the requested counts, unique IDs and image directions", () => {
  assert.deepEqual(Array.from(catalogs.outfits, (group) => group.items.length), [10, 10, 5, 10]);
  assert.equal(catalogs.expressions[0].items.length, 20);
  assert.equal(catalogs.poses[0].items.length, 20);
  assert.equal(catalogs.locations[0].items.length, 10);
  for (const groups of Object.values(catalogs)) {
    const items = groups.flatMap((group) => Array.from(group.items));
    assert.equal(new Set(items.map((item) => item.id)).size, items.length);
    for (const item of items) {
      assert.ok(item.label && item.prompt, item.id);
    }
  }
});

test("new selections are connected to the image prompt and searchable picker", () => {
  assert.match(source, /Object\.assign\(labels\.outfit, \.\.\.hanakoExtraOutfits/);
  assert.match(source, /Object\.assign\(labels\.pose, \.\.\.hanakoExtraPoses/);
  assert.match(source, /Object\.assign\(labels\.location, \.\.\.hanakoExtraLocations/);
  assert.match(source, /Object\.assign\(hanakoExpressionOptions, Object\.fromEntries\(hanakoExtraExpressions/);
  assert.match(source, /installHanakoPickers\(\)/);
});
