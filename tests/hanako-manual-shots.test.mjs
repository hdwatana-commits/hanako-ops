import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const start = source.indexOf("function buildHanakoLifestyleImagePrompt(");
const end = source.indexOf("\nfunction buildHanakoLifestyleCopyPrompt(", start);
assert.ok(start >= 0 && end > start);
const functionSource = source.slice(start, end);

function makePrompt(profile, shotIndex) {
  const options = {
    snsLocationPreset: [{ value: "homeWindow", textContent: "自宅の窓辺" }],
    snsPosePreset: ["pose1", "pose2", "pose3"].map((value) => ({ value, textContent: value })),
    snsCompositionPreset: ["face", "bust", "waist", "full", "thigh"].map((value) => ({ value, textContent: value })),
    snsHairPreset: [{ value: "hair", textContent: "ロングヘア" }],
    snsOutfitPreset: [{ value: "dress", textContent: "ワンピース" }],
  };
  const context = {
    state: { hanakoInstagramLook: "look" },
    document: { querySelector: (selector) => ({ options: options[selector.slice(1)] || [], value: "pose1" }) },
    buildSocialCreativeDirective: () => "同一人物・同じ衣装",
    getHanakoThreadsAbLayout: () => "separate",
    getHanakoThreadsAbOptions: () => [{ value: "pose2", textContent: "pose2" }],
    hanakoInstagramLooks: [{ id: "look", label: "自然光", direction: "自然な写真", poses: ["pose1", "pose2", "pose3"], expressions: ["smile", "soft", "bashful"], compositions: ["face", "bust", "waist"] }],
    hanakoInstagramPoses: ["pose1", "pose2", "pose3"],
    hanakoInstagramLocations: ["homeWindow"],
    hanakoThreadsLocations: ["homeWindow"],
    hanakoExtraLocations: [{ items: [] }],
    hanakoThreadsExpressions: ["smile", "soft", "bashful"],
    hanakoBuzzKawaiiThemes: [{ id: "protect", label: "守ってあげたい", expressions: ["smile", "soft", "bashful", "smile"] }],
    hanakoExpressionOptions: { smile: { label: "笑顔" }, soft: { label: "やさしい笑顔" }, bashful: { label: "はにかみ" } },
    hanakoThreadsAbFields: { outfit: { source: "snsOutfitPreset", label: "服装" }, pose: { source: "snsPosePreset", label: "ポーズ" } },
    hanakoThreadsAbLooks: [],
    generateHanakoLifestyleCopy: () => "caption",
  };
  vm.runInNewContext(`${functionSource}\nresult = buildHanakoLifestyleImagePrompt({ creativeProfile: ${JSON.stringify(profile)} }, "", ${shotIndex})`, context);
  return context.result;
}

test("Instagram creates only the selected shot per request", () => {
  const prompt = makePrompt({ hanakoInstagramMode: true, locationPreset: "homeWindow", posePreset: "pose1", hanakoExpression: "smile", compositionPreset: "face" }, 1);
  assert.match(prompt, /第2カットの画像ファイル1個だけ/);
  assert.match(prompt, /n=1/);
  assert.doesNotMatch(prompt, /完成画像3枚と/);
  assert.doesNotMatch(prompt, /1枚目｜1枚カット/);
});

test("Threads two-image mode makes two separate calls", () => {
  const profile = { hanakoThreadsMode: true, threadsImageCount: 2, locationPreset: "homeWindow", hanakoExpression: "smile", compositionPreset: "face" };
  assert.match(makePrompt(profile, 0), /全2枚のうち、今回は1枚目/);
  assert.match(makePrompt(profile, 1), /全2枚のうち、今回は2枚目/);
  assert.doesNotMatch(makePrompt(profile, 1), /今回は3枚目/);
});

test("Buzz kawaii mode creates a distinct fourth story shot", () => {
  const profile = { hanakoThreadsMode: true, hanakoBuzzKawaiiMode: true, hanakoBuzzKawaiiTheme: "protect", threadsImageCount: 4, locationPreset: "homeWindow", hanakoExpression: "smile", compositionPreset: "face" };
  const prompt = makePrompt(profile, 3);
  assert.match(prompt, /全4枚のうち、今回は4枚目/);
  assert.match(prompt, /表情アップ→全身→親密な仕草→余韻/);
  assert.match(prompt, /続きを想像したくなる静かな一枚/);
  assert.match(prompt, /第4カットの画像ファイル1個だけ/);
  assert.doesNotMatch(prompt, /4枚とも構図とカメラ位置を固定/);
});

test("Threads A/B never creates a side-by-side image", () => {
  const prompt = makePrompt({ hanakoThreadsMode: true, hanakoThreadsAbMode: true, hanakoThreadsAbAxis: "pose", hanakoThreadsAbB: "pose2", locationPreset: "homeWindow", compositionPreset: "face" }, 1);
  assert.match(prompt, /今回はBの写真1枚のみ/);
  assert.match(prompt, /画像ファイル1個だけ/);
  assert.doesNotMatch(prompt, /左パネル|右パネル|1200×800/);
});
