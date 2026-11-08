import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");

function loadFunctions(names, globals = {}) {
  const source = names.map((name) => {
    const match = new RegExp(`^(?:async )?function ${name}\\([\\s\\S]*?^}`, "m").exec(app);
    assert.ok(match, name);
    return match[0];
  }).join("\n");
  return runInNewContext(`${source}\n({ ${names.join(", ")} })`, globals);
}

test("the default photo survives a temporary selection and falls back when deleted", () => {
  const { restoreCoordinatePhotoSelection } = loadFunctions(["restoreCoordinatePhotoSelection"]);
  const saved = {
    coordinatePhotos: [{ id: "first" }, { id: "default" }, { id: "temporary" }],
    defaultCoordinatePhotoId: "default",
    selectedCoordinatePhotoId: "temporary",
  };
  restoreCoordinatePhotoSelection(saved, "temporary");
  assert.equal(saved.selectedCoordinatePhotoId, "temporary");
  const reopened = JSON.parse(JSON.stringify(saved));
  restoreCoordinatePhotoSelection(reopened);
  assert.equal(reopened.selectedCoordinatePhotoId, "default");
  reopened.coordinatePhotos = [{ id: "first" }];
  restoreCoordinatePhotoSelection(reopened);
  assert.equal(reopened.defaultCoordinatePhotoId, "");
  assert.equal(reopened.selectedCoordinatePhotoId, "first");
  const old = { coordinatePhotos: saved.coordinatePhotos, selectedCoordinatePhotoId: "temporary" };
  restoreCoordinatePhotoSelection(old);
  assert.equal(old.selectedCoordinatePhotoId, "temporary");
});

test("clearing a loading URL allows a new request and discards the old response", async () => {
  const makeControl = (value = "") => ({
    value, disabled: false, handlers: {},
    addEventListener(type, listener) { this.handlers[type] = listener; },
    focus() { this.focused = true; },
  });
  const url = makeControl("https://item.rakuten.co.jp/test/old/");
  const button = makeControl();
  const clear = makeControl();
  const controls = { "#coordProductUrl": url, "#coordImportProduct": button, "#clearCoordProductUrl": clear };
  const requests = [];
  const messages = [];
  const state = { products: [] };
  const { bindCoordinateActions } = loadFunctions(["bindCoordinateActions", "importProductForCoordinate"], {
    document: { querySelector: (id) => controls[id], querySelectorAll: () => [] },
    coordinateOutput: {}, coordBoard: {}, generateCoordinate() {}, copyCoordinateImagePrompt() {}, openGemini() {},
    shareCoordinateToGemini() {}, downloadCoordinateBoard() {}, previewGeneratedCoordinateImage() {},
    populateCoordinateOverseasCities() {}, applyRandomCoordinateLocation() {}, applyRandomCoordinatePose() {},
    bindHanakoTeacherSelector() {}, updateHanakoTeacherPreview() {}, clearTimeout, AbortController,
    showCoordinateImportStatus: (message) => messages.push(message),
    normalizeRakutenImportUrl: (value) => value, normalizeCoordinateImportedProduct: (value) => value,
    cloudSync: { configured: true, signedIn: true }, state,
    fetchRakutenProduct: (address, signal) => new Promise((resolve) => requests.push({ address, signal, resolve })),
  });
  bindCoordinateActions();
  const oldRequest = button.handlers.click();
  assert.equal(button.disabled, true);
  clear.handlers.click();
  assert.equal(url.value, "");
  assert.equal(url.focused, true);
  assert.equal(requests[0].signal.aborted, true);
  assert.match(messages.at(-1), /URLをクリア/);

  url.value = "https://item.rakuten.co.jp/test/new/";
  const newRequest = button.handlers.click();
  requests[0].resolve({ name: "Old product" });
  await oldRequest;
  assert.equal(state.products.length, 0);
  assert.equal(button.disabled, true);
  assert.equal(requests[1].address, url.value);
  clear.handlers.click();
  requests[1].resolve({ name: "New product" });
  await newRequest;
  assert.equal(button.disabled, false);
  assert.equal(state.products.length, 0);
});

const { chooseCoordinateCompanion, coordinateSelectionContext, buildCoordinateRakutenQuery, coordinateProductKey, coordinateCompanionType } =
  loadFunctions([
    "chooseCoordinateCompanion", "coordinateSelectionContext", "buildCoordinateRakutenQuery",
    "coordinateProductKey", "coordinateCompanionType", "coordinateRecentUse", "coordinateItemColor",
    "normalizeComparableUrl", "currentSeason",
  ]);

const product = (id, category, name, color) => ({ id, category, name, details: { color } });
const top = product("top", "トップス", "白のボリューム袖ブラウス", "ホワイト");
const bottom = { selector: "#coordBottom", categories: ["スカート", "パンツ", "デニム"], keyword: "レディース スカート パンツ" };
const bag = { selector: "#coordBag", categories: ["バッグ"], keyword: "レディース バッグ" };
const shoes = { selector: "#coordShoes", categories: ["シューズ"], keyword: "レディース シューズ" };
const cafe = { occasion: "友達とカフェ", style: "大人ガーリー", season: "春" };

test("mini skirts stay preferred for cafe looks while recent items rotate", () => {
  const products = [
    product("mini-1", "スカート", "台形ミニスカート", "ブラック"),
    product("mini-2", "スカート", "ミニ丈プリーツスカート", "ホワイト"),
    product("midi", "スカート", "ミディスカート", "ベージュ"),
    product("pants", "パンツ", "テーパードパンツ", "ホワイト"),
  ];
  const history = [];
  const picked = Array.from({ length: 8 }, () => {
    const choice = chooseCoordinateCompanion(products, bottom, coordinateSelectionContext(cafe, history), [top]);
    history.unshift({ [bottom.selector]: { key: coordinateProductKey(choice), type: coordinateCompanionType(choice) } });
    return choice.id;
  });
  assert.ok(picked.filter((id) => id.startsWith("mini-")).length >= 6);
  assert.ok(new Set(picked).size >= 2);
  const work = coordinateSelectionContext({ ...cafe, occasion: "きれいめ通勤" }, []);
  assert.equal(chooseCoordinateCompanion(products, bottom, work, [top]).id, "pants");
  assert.match(buildCoordinateRakutenQuery(bottom, coordinateSelectionContext(cafe, [])), /ミニスカート/);
});

test("shoe and bag choices rotate among compatible shapes and respect weather and scene", () => {
  const products = [
    product("tote", "バッグ", "白トートバッグ", "ホワイト"),
    product("mini-bag", "バッグ", "白ミニバッグ", "ホワイト"),
    product("shoulder", "バッグ", "白ショルダーバッグ", "ホワイト"),
    product("ballet", "シューズ", "白バレエシューズ", "ホワイト"),
    product("mary", "シューズ", "白メリージェーン", "ホワイト"),
    product("rain", "シューズ", "白レインシューズ", "ホワイト"),
    product("sandals", "シューズ", "白サンダル", "ホワイト"),
  ];
  const initial = coordinateSelectionContext(cafe, []);
  const recent = coordinateSelectionContext(cafe, [{
    [bag.selector]: { key: "mini-bag", type: "ミニバッグ" },
    [shoes.selector]: { key: "ballet", type: "バレエシューズ" },
  }]);
  assert.equal(chooseCoordinateCompanion(products, bag, initial, [top]).id, "mini-bag");
  assert.equal(chooseCoordinateCompanion(products, bag, recent, [top]).id, "shoulder");
  assert.equal(chooseCoordinateCompanion(products, shoes, recent, [top]).id, "mary");
  assert.notEqual(buildCoordinateRakutenQuery(shoes, initial), buildCoordinateRakutenQuery(shoes, recent));
  const rain = coordinateSelectionContext({ ...cafe, occasion: "雨の日のおでかけ" }, []);
  assert.equal(chooseCoordinateCompanion(products, shoes, rain, [top]).id, "rain");
  const winter = coordinateSelectionContext({ ...cafe, season: "冬" }, []);
  assert.equal(chooseCoordinateCompanion(products.filter(({ id }) => id === "sandals"), shoes, winter, [top]), null);
});

test("each product name copies at most 40 visible characters", () => {
  const limit = Number(app.match(/const COORDINATE_PRODUCT_COPY_LIMIT = (\d+);/)[1]);
  const { shortCoordinateProductName } = loadFunctions(["shortCoordinateProductName"], { COORDINATE_PRODUCT_COPY_LIMIT: limit });
  const prefix = "服".repeat(39);
  assert.equal(shortCoordinateProductName(`${prefix}👩‍🎨春`), `${prefix}👩‍🎨`);
  assert.equal(shortCoordinateProductName("  春の   コーデ  "), "春の コーデ");
});
