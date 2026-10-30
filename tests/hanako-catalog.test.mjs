import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const start = source.indexOf("const hanakoExtraOutfits = [");
const end = source.indexOf("const hanakoIdeaCatalog = [", start);
const catalogs = vm.runInNewContext(`${source.slice(start, end)}\n({ outfits: hanakoExtraOutfits, expressions: hanakoExtraExpressions, poses: hanakoExtraPoses, locations: hanakoExtraLocations })`);

test("Hanako catalogs have the requested counts, unique IDs and image directions", () => {
  assert.deepEqual(Array.from(catalogs.outfits.slice(0, 5), (group) => group.items.length), [10, 10, 10, 5, 10]);
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

test("Doronjo costume, expressions and poses are available in SNS modes", () => {
  const ids = (groups) => groups.flatMap((group) => group.items.map((item) => item.id));
  assert.ok(ids(catalogs.outfits).includes("cosDoronjo"));
  assert.ok(ids(catalogs.expressions).includes("doronjoConfidentSmile"));
  assert.ok(ids(catalogs.poses).includes("poseDoronjoCape"));
  assert.match(source, /hanakoInstagramOutfits\.push\(\.\.\.hanakoExtraOutfits\.slice\(5\)/);
  assert.match(source, /hanakoThreadsExpressions\.push\(\.\.\.hanakoExtraExpressions\.slice\(1\)/);
});

test("adult kindergarten costume uses a nonsexual image and caption path", () => {
  const costume = catalogs.outfits.flatMap((group) => group.items).find((item) => item.id === "cosKindergarten");
  assert.ok(costume);
  assert.match(costume.prompt, /成人女性/);
  assert.ok(catalogs.expressions.flatMap((group) => group.items).some((item) => item.id === "costumeWarmSmile"));
  assert.ok(catalogs.poses.flatMap((group) => group.items).some((item) => item.id === "poseCostumeWave"));
  assert.match(source, /function buildHanakoLifestyleImagePrompt[\s\S]*?outfitPreset === "cosKindergarten"[\s\S]*?色気、恋人目線、ハプニング/);
  assert.match(source, /function buildHanakoLifestyleCopyPrompt[\s\S]*?outfitPreset === "cosKindergarten"/);
});

test("new hair, expressions, jobs, places, poses and compositions are complete", () => {
  const group = (groups, label) => groups.find((item) => item.label === label)?.items || [];
  assert.equal(group(catalogs.outfits, "物語のある職業コスプレ（新着10）").length, 10);
  assert.equal(group(catalogs.expressions, "あざとい表情・第二弾（新着10）").length, 10);
  assert.equal(group(catalogs.locations, "普段の街で使える背景（新着10）").length, 10);
  assert.equal(group(catalogs.poses, "シルエットが映えるポーズ（新着10）").length, 10);

  const hairIds = ["longRibbonHalfUp", "longSwanWave", "longSideTwist", "longAiryBang", "longPearlBraid", "longSoftHime", "longLowTwin", "longScarfHalfUp", "longFeatherEnds", "longSideSweep"];
  const compositionIds = ["silhouetteThreeQuarter", "silhouetteSideLight", "silhouetteLowDiagonal", "silhouetteOverShoulder", "silhouetteLongLens", "silhouetteWalkingSpace", "silhouetteMirrorWide", "silhouetteStairLanding", "silhouetteWindowFrame", "silhouetteSeatedProfile"];
  for (const id of [...hairIds, ...compositionIds]) {
    assert.match(source, new RegExp(`\\["${id}",`), `${id} is selectable`);
    assert.match(source, new RegExp(`\\b${id}:`), `${id} has an image prompt`);
  }
  assert.match(source, /hanakoExtraOutfits\[4\]\.items/);
  assert.match(source, /hanakoExtraOutfits\.slice\(5\)/);
});

test("seven relaxed room outfits have stable image directions and enter indoor picks", () => {
  const group = catalogs.outfits.find((item) => item.label === "おうち時間のラフ可愛い部屋着（新着7）");
  assert.equal(group?.items.length, 7);
  for (const item of group.items) {
    assert.match(item.prompt, /成人女性/);
    assert.match(source, new RegExp(`"${item.id}"`));
  }
  assert.match(source, /const outfits = available\("snsOutfitPreset", \["homeKnit"[^\n]*"roomSoftCardigan"/);
});
