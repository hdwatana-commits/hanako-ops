import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const start = source.indexOf("let hanakoDailyDrafts = [];");
const end = source.indexOf("\nfunction bindInstallButton(", start);
assert.ok(start >= 0 && end > start);

const plain = (value) => JSON.parse(JSON.stringify(value));
function client({ signedIn = true, photo = { name: "本人.jpg", path: "owner/photo.jpg" }, consent = true, beforeSave, beforeRead } = {}) {
  const values = {
    hanakoDailyInstagramEnabled: { checked: false }, hanakoDailyThreadsEnabled: { checked: false },
    hanakoDailyInstagramCount: { value: "4" }, hanakoDailyThreadsCount: { value: "3" },
    hanakoDailyStoryTheme: { value: "outfit" }, hanakoDailyNowPlatform: { value: "both" },
    hanakoDailyPhotoConsent: { checked: consent }, hanakoDailyVariation: { checked: true },
    hanakoDailyInstagramTime: { value: "08:00" }, hanakoDailyThreadsTime: { value: "18:00" },
    hanakoDailySave: {}, hanakoDailyCreateNow: {}, hanakoDailyRefresh: {}, hanakoDaily: {},
    hanakoDailyStatus: {}, hanakoDailyPhoto: {}, hanakoDailyStoryPreview: {}, hanakoDailyDrafts: {},
  };
  const elements = new Map(Object.entries(values).map(([id, fields]) => [id, { id, value: "", checked: false, disabled: false, innerHTML: "", textContent: "", addEventListener() {}, querySelectorAll: () => [], ...fields }]));
  const calls = [], toasts = [], confirmations = [], timers = [];
  const server = { settings: { instagram_enabled: false, threads_enabled: false, photo_consent: true, look: { instagramImageCount: 3, threadsImageCount: 3, storyTheme: "auto" } }, drafts: [] };
  const context = vm.createContext({
    document: {
      hidden: false, visibilityState: "visible", addEventListener() {},
      querySelector: (selector) => elements.get(selector.slice(1)) || null,
      querySelectorAll: () => [...elements.values()].filter((element) => !["hanakoDailyStatus", "hanakoDailyDrafts", "hanakoDailyPhoto", "hanakoDailyStoryPreview", "hanakoDaily", "hanakoDailyRefresh"].includes(element.id)),
    },
    cloudSync: {
      signedIn, user: { id: "owner" },
      async authorizedFetch(url, options) {
        if (options?.method === "POST") {
          const payload = JSON.parse(options.body); calls.push({ type: "save", payload });
          await beforeSave?.(); server.settings = payload;
          return { json: async () => null };
        }
        if (options?.method === "PATCH") { calls.push({ type: "caption", url }); return {}; }
        await beforeRead?.(url);
        return { json: async () => url.includes("/hanako_auto_settings?") ? [server.settings] : server.drafts };
      },
      async createSignedImageUrl(path) { return { signedUrl: `https://example.test/${path}` }; },
    },
    getSelectedCoordinatePhoto: () => photo,
    recoverPrivatePhotoPath: () => "",
    showToast: (message) => toasts.push(message),
    callSocialApi: async (payload) => { calls.push({ type: "social", payload: plain(payload) }); return { drafts: payload.platforms?.map((platform) => ({ platform, created: true })) || [] }; },
    escapeHtml: (text) => String(text).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]),
    window: { confirm: (message) => { confirmations.push(message); return false; } },
    clearTimeout() {}, setTimeout: (callback, delay) => { timers.push({ callback, delay }); return timers.length; },
  });
  vm.runInContext(source.slice(start, end), context);
  return { context, elements, calls, toasts, confirmations, timers, server,
    run: (code) => vm.runInContext(code, context),
    setDrafts(drafts) { context.testDrafts = drafts; vm.runInContext("hanakoDailyDrafts = testDrafts", context); },
    async publish(draft) {
      this.setDrafts([draft]);
      const card = { dataset: { dailyDraft: draft.id }, querySelector: () => ({ value: draft.caption }) };
      const button = { dataset: { dailyAction: "publish" }, closest: () => card, disabled: false };
      context.testClick = { target: { closest: () => button } };
      await vm.runInContext("handleHanakoDailyDraftClick(testClick)", context);
    },
  };
}

test("daily settings save separate 3/4-image counts and the story theme without enabling schedules", async () => {
  const ui = client();
  await ui.run("persistHanakoDailySettings(true)");
  const payload = ui.calls[0].payload;
  assert.equal(payload.look.instagramImageCount, 4);
  assert.equal(payload.look.threadsImageCount, 3);
  assert.equal(payload.look.storyTheme, "outfit");
  assert.equal(payload.instagram_enabled, false);
  assert.equal(payload.threads_enabled, false);
  ui.elements.get("hanakoDailyInstagramCount").value = "9";
  ui.elements.get("hanakoDailyThreadsCount").value = "4";
  assert.equal(ui.run("selectedHanakoDailyLook().instagramImageCount"), 3);
  assert.equal(ui.run("selectedHanakoDailyLook().threadsImageCount"), 4);
});

test("create now saves the visible settings then queues selected platforms while daily schedules stay off", async () => {
  const ui = client();
  await ui.run("createHanakoDailyNow()");
  assert.deepEqual(ui.calls.map((call) => call.type), ["save", "social"]);
  assert.deepEqual(ui.calls[1].payload, { action: "createDailyDrafts", platforms: ["Instagram", "Threads"] });
  assert.equal(ui.elements.get("hanakoDailyInstagramEnabled").checked, false);
  assert.equal(ui.elements.get("hanakoDailyThreadsEnabled").checked, false);
  assert.equal(ui.confirmations.length, 0);
  assert.equal(ui.calls.some((call) => call.payload?.action === "publishDraft"), false);
  assert.match(ui.elements.get("hanakoDailyStatus").textContent, /2件の下書き/);
});

test("create now requires login, consent and a private identity photo even when both schedules are off", async () => {
  for (const options of [{ signedIn: false }, { consent: false }, { photo: null }, { photo: { name: "missing-path.jpg" } }]) {
    const ui = client(options);
    await ui.run("createHanakoDailyNow()");
    assert.equal(ui.calls.length, 0);
    assert.ok(ui.toasts.length > 0);
    assert.equal(ui.elements.get("hanakoDailyCreateNow").disabled, false);
  }
});

test("a second create click is ignored while the first request is saving", async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const ui = client({ beforeSave: () => gate });
  const first = ui.run("createHanakoDailyNow()");
  assert.equal(ui.elements.get("hanakoDailyCreateNow").disabled, true);
  await ui.run("createHanakoDailyNow()");
  assert.equal(ui.calls.length, 1);
  release(); await first;
  assert.equal(ui.calls.filter((call) => call.type === "social").length, 1);
  assert.equal(ui.elements.get("hanakoDailyCreateNow").disabled, false);
});

test("draft previews allow old three-image drafts and complete four-image drafts, blocking incomplete sets", async () => {
  const ui = client();
  ui.setDrafts([
    { id: "old", platform: "Instagram", status: "ready", image_paths: ["1", "2", "3"], caption: "本文" },
    { id: "new", platform: "Threads", status: "ready", image_paths: ["1", "2", "3", "4"], look: { imageCount: 4, story: { title: "<テーマ>" } }, caption: "本文" },
    { id: "partial", platform: "Threads", status: "ready", image_paths: ["1", "2", "3"], look: { imageCount: 4 }, caption: "本文" },
  ]);
  await ui.run("renderHanakoDailyDrafts()");
  const html = ui.elements.get("hanakoDailyDrafts").innerHTML;
  const articles = html.match(/<article[\s\S]*?<\/article>/g);
  assert.equal(articles.length, 3);
  assert.match(articles[0], /3 \/ 3枚/);
  assert.match(articles[0], /data-daily-action="publish" >確認して公開/);
  assert.match(articles[1], /4 \/ 4枚 · &lt;テーマ&gt;/);
  assert.match(articles[1], /data-daily-action="publish" >確認して公開/);
  assert.match(articles[2], /data-daily-action="publish" disabled/);
});

test("publish confirmation reports the actual expected image count and rejects an incomplete four-image draft", async () => {
  const draft = { id: "draft", platform: "Threads", status: "ready", image_paths: ["1", "2", "3", "4"], look: { imageCount: 4 }, caption: "本文" };
  const ui = client();
  await ui.publish(draft);
  assert.match(ui.confirmations[0], /画像4枚と本文/);
  assert.equal(ui.calls.length, 0); // User declined the preview confirmation.
  const incomplete = client();
  await incomplete.publish({ ...draft, image_paths: ["1", "2", "3"] });
  assert.equal(incomplete.confirmations.length, 0);
  assert.equal(incomplete.calls.length, 0);
  assert.match(incomplete.toasts[0], /画像がそろってから/);
});

test("background polling preserves unsaved count and theme changes while tracking generation progress", async () => {
  const ui = client();
  ui.server.drafts = [{ id: "pending", platform: "Threads", status: "generating", image_paths: [], look: { imageCount: 4 } }];
  ui.run("hanakoDailySettingsDirty = true");
  await ui.run("refreshHanakoDaily()");
  assert.equal(ui.elements.get("hanakoDailyInstagramCount").value, "4");
  assert.equal(ui.elements.get("hanakoDailyStoryTheme").value, "outfit");
  assert.equal(ui.timers[0].delay, 20000);
  assert.match(ui.elements.get("hanakoDailyDrafts").innerHTML, /0 \/ 4枚/);
});

test("settings changed during an in-flight refresh are not overwritten when the server response arrives", async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const ui = client({ beforeRead: () => gate });
  const refresh = ui.run("refreshHanakoDaily()");
  ui.elements.get("hanakoDailyThreadsCount").value = "4";
  ui.run("hanakoDailySettingsDirty = true");
  release(); await refresh;
  assert.equal(ui.elements.get("hanakoDailyThreadsCount").value, "4");
  assert.equal(ui.elements.get("hanakoDailyStoryTheme").value, "outfit");
});

test("refreshing draft progress preserves an unsaved caption and its caret", async () => {
  const ui = client();
  const list = ui.elements.get("hanakoDailyDrafts");
  let renderedCards = [];
  let html = "";
  Object.defineProperty(list, "innerHTML", {
    get: () => html,
    set: (value) => {
      html = value;
      renderedCards = [...value.matchAll(/<article[^>]*data-daily-draft="([^"]+)"[\s\S]*?<textarea[^>]*>([^<]*)<\/textarea>[\s\S]*?<\/article>/g)].map((match) => {
        const card = { dataset: { dailyDraft: match[1] } };
        const input = { value: match[2], readOnly: false, selectionStart: 0, selectionEnd: 0,
          matches: () => true, closest: () => card,
          focus() { ui.context.document.activeElement = this; },
          setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
        };
        card.querySelector = () => input;
        return card;
      });
    },
  });
  list.querySelectorAll = () => renderedCards;
  const draft = { id: "editing", platform: "Instagram", status: "ready", caption: "保存済みの本文", image_paths: ["1", "2", "3"] };
  ui.setDrafts([draft]);
  await ui.run("renderHanakoDailyDrafts()");
  const input = renderedCards[0].querySelector();
  input.value = "まだ保存していない本文"; input.selectionStart = 3; input.selectionEnd = 7; input.focus();
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  ui.context.cloudSync.createSignedImageUrl = async (path) => { await gate; return { signedUrl: `https://example.test/${path}` }; };
  const render = ui.run("renderHanakoDailyDrafts()");
  // Continue typing while the image preview URLs are being refreshed.
  input.value = "まだ保存していない本文に追記"; input.selectionStart = 4; input.selectionEnd = 8;
  release(); await render;
  const refreshed = renderedCards[0].querySelector();
  assert.notEqual(refreshed, input);
  assert.equal(refreshed.value, "まだ保存していない本文に追記");
  assert.equal(ui.context.document.activeElement, refreshed);
  assert.equal(refreshed.selectionStart, 4);
  assert.equal(refreshed.selectionEnd, 8);
});

test("the themed four-part preview is shown for either platform and hidden for two three-image settings", () => {
  const ui = client();
  ui.run("renderHanakoDailyStoryPreview()");
  const preview = ui.elements.get("hanakoDailyStoryPreview");
  assert.equal(preview.hidden, false);
  assert.equal((preview.innerHTML.match(/<li>/g) || []).length, 4);
  assert.match(preview.innerHTML, /コーデ全体/);
  ui.elements.get("hanakoDailyInstagramCount").value = "3";
  ui.run("renderHanakoDailyStoryPreview()");
  assert.equal(preview.hidden, true);
  ui.elements.get("hanakoDailyThreadsCount").value = "4";
  ui.elements.get("hanakoDailyStoryTheme").value = "surprise";
  ui.run("renderHanakoDailyStoryPreview()");
  assert.equal(preview.hidden, false);
  assert.match(preview.innerHTML, /照れ隠し/);
});
