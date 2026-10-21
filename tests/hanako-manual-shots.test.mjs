import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const helperStart = source.indexOf("function extractSocialExtraLocation(");
const helperEnd = source.indexOf("\nfunction buildSocialCreativeDirective(", helperStart);
const start = source.indexOf("function buildHanakoLifestyleImagePrompt(");
const end = source.indexOf("\nfunction buildHanakoLifestyleCopyPrompt(", start);
assert.ok(helperStart >= 0 && helperEnd > helperStart && start >= 0 && end > start);
const functionSource = `${source.slice(helperStart, helperEnd)}\n${source.slice(start, end)}`;

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
    hanakoInstagramBuzzStories: [{ id: "lazyMorning", label: "休日の寝起き", direction: "恋人だけが知っている柔らかな朝", shots: ["目が合う朝", "身支度", "隣へ誘う", "続きを想像したくなる静かな一枚"] }],
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

test("Instagram indoor buzz mode creates a safe fourth story shot", () => {
  const prompt = makePrompt({ hanakoInstagramMode: true, hanakoInstagramBuzzKawaiiMode: true, hanakoInstagramBuzzStory: "lazyMorning", locationPreset: "homeWindow", posePreset: "pose1", hanakoExpression: "smile", compositionPreset: "face" }, 3);
  assert.match(prompt, /全4枚のうち、今回は4枚目/);
  assert.match(prompt, /室内バズかわハプニング/);
  assert.match(prompt, /休日の寝起き/);
  assert.match(prompt, /続きを想像したくなる静かな一枚/);
  assert.match(prompt, /服の裾、襟、ボタンは全カットで整ったまま固定/);
  assert.match(prompt, /第4カットの画像ファイル1個だけ/);
  assert.doesNotMatch(prompt, /小さな失敗→照れ笑い→くつろぎ/);
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

test("extra instructions override the location preset in Threads mode", () => {
  const profile = { hanakoThreadsMode: true, threadsImageCount: 3, locationPreset: "homeWindow", extra: "場所は雨上がりの東京駅前。赤い傘を持つ", hanakoExpression: "smile", compositionPreset: "face" };
  const prompt = makePrompt(profile, 0);
  assert.match(prompt, /撮影場所は「雨上がりの東京駅前」/);
  assert.match(prompt, /場所プリセット「自宅の窓辺」より、この自由指定を優先/);
  assert.doesNotMatch(prompt, /全画像で同じ成人女性、同じ場所「自宅の窓辺」/);
});

test("Threads A/B never creates a side-by-side image", () => {
  const prompt = makePrompt({ hanakoThreadsMode: true, hanakoThreadsAbMode: true, hanakoThreadsAbAxis: "pose", hanakoThreadsAbB: "pose2", locationPreset: "homeWindow", compositionPreset: "face" }, 1);
  assert.match(prompt, /今回はBの写真1枚のみ/);
  assert.match(prompt, /画像ファイル1個だけ/);
  assert.doesNotMatch(prompt, /左パネル|右パネル|1200×800/);
});
