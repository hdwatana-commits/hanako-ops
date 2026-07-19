(function () {
  "use strict";

  const STORAGE_KEY = "codex.room.repostHelper.v1";
  const COLLECTION_STATE_KEY = "codex.room.collectionState.v1";
  const PANEL_ID = "codex-room-repost-helper";
  let suppressCollectionScrollSave = false;

  if (window.__codexRoomRepostHelperLoaded) return;
  window.__codexRoomRepostHelperLoaded = true;

  function injectMainWorldFallback() {
    if (!/room\.rakuten\.co\.jp$/.test(location.hostname)) return;
    if (document.getElementById("codex-room-main-world-script")) return;
    if (typeof chrome === "undefined" || !chrome.runtime?.getURL) return;

    const script = document.createElement("script");
    script.id = "codex-room-main-world-script";
    script.src = chrome.runtime.getURL("main-world.js");
    script.onload = () => script.remove();
    (document.documentElement || document.head || document.body).append(script);
  }

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function writeState(next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...readState(),
      ...next,
      savedAt: new Date().toISOString(),
    }));
  }

  function cleanText(text) {
    return String(text || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\s+\n/g, "\n")
      .replace(/\n\s+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  function cleanMultilineText(text) {
    return String(text || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map((line) => line.replace(/[ \t]{2,}/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function formatForRoomClipboard(text) {
    return cleanMultilineText(text)
      .split("\n")
      .map((line) => (line.trim() === "" ? "\u200B" : line))
      .join("\r\n");
  }

  function visible(el) {
    if (!el || el.closest(`#${PANEL_ID}`)) return false;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }

  function findText() {
    const selected = cleanText(String(getSelection()));
    if (selected.length >= 3) return selected;

    const inputText = Array.from(document.querySelectorAll("textarea, [contenteditable='true']"))
      .filter(visible)
      .map((el) => cleanText(el.value || el.innerText || el.textContent))
      .find((text) => text.length >= 3);
    if (inputText) return inputText;

    const candidates = Array.from(document.querySelectorAll("p, div, span"))
      .filter(visible)
      .map((el) => cleanText(el.innerText || el.textContent))
      .filter((text) => text.length >= 8 && text.length <= 1000)
      .filter((text) => !text.includes("ROOM再投稿ヘルパー"))
      .filter((text) => !/^いいね|^コメント|^フォロー|^楽天市場|^商品ページ/.test(text));

    candidates.sort((a, b) => scoreText(b) - scoreText(a));
    return candidates[0] || "";
  }

  function scoreText(text) {
    let score = Math.min(text.length, 300);
    if (text.includes("#")) score += 40;
    if (text.includes("ROOM")) score -= 70;
    if (text.includes("楽天市場")) score -= 50;
    return score;
  }

  function findProductUrl() {
    const links = Array.from(document.links)
      .filter(visible)
      .map((a) => ({
        href: a.href,
        text: cleanText(a.innerText || a.textContent || a.getAttribute("aria-label")),
      }))
      .filter((link) => link.href && !link.href.includes("javascript:"))
      .filter((link) => !isCampaignLink(link.href, link.text));

    const direct = links.find((link) => /^https:\/\/(item|books|brandavenue|fashion)\.rakuten\.co\.jp\//.test(link.href));
    if (direct) return direct.href;

    const market = links.find((link) => isLikelyProductLink(link.href, link.text));
    if (market) return market.href;

    const byText = links.find((link) =>
      /商品ページ|商品詳細|楽天市場で詳細|楽天市場で見る|購入する/.test(link.text) &&
      isLikelyProductLink(link.href, link.text)
    );
    return byText?.href || readState().productUrl || "";
  }

  function findProductLinkElement() {
    const links = Array.from(document.links)
      .filter(visible)
      .filter((a) => !isCampaignLink(a.href, cleanText(a.innerText || a.textContent || a.getAttribute("aria-label"))));
    return links.find((a) => /^https:\/\/(item|books|brandavenue|fashion)\.rakuten\.co\.jp\//.test(a.href)) ||
      links.find((a) => isLikelyProductLink(a.href, cleanText(a.innerText || a.textContent || a.getAttribute("aria-label")))) ||
      links.find((a) =>
        /商品ページ|商品詳細|楽天市場で詳細|楽天市場で見る|購入する/.test(cleanText(a.innerText || a.textContent || a.getAttribute("aria-label"))) &&
        isLikelyProductLink(a.href, cleanText(a.innerText || a.textContent || a.getAttribute("aria-label")))
      ) ||
      null;
  }

  function productLinkCandidates() {
    return Array.from(document.links)
      .filter(visible)
      .map((a) => ({
        href: a.href,
        text: cleanText(a.innerText || a.textContent || a.getAttribute("aria-label")) || "(文字なし)",
      }))
      .filter((link) => link.href && !link.href.includes("javascript:"))
      .filter((link) => !/room\.rakuten\.co\.jp|my\.bookmark\.rakuten\.co\.jp/.test(link.href))
      .filter((link) => !isCampaignLink(link.href, link.text))
      .filter((link) => /rakuten|r10s|afl|商品|詳細|購入/.test(`${link.href} ${link.text}`))
      .slice(0, 5);
  }

  function isRoomPostUrl(href) {
    if (!href) return false;
    let url;
    try {
      url = new URL(href, location.href);
    } catch {
      return false;
    }
    if (!/room\.rakuten\.co\.jp$/.test(url.hostname)) return false;
    const path = decodeURIComponent(url.pathname);
    if (/\/edit(\/|$)|[?&](edit|mode=edit|isEdit)=/.test(`${path}${url.search}`)) return false;
    if (isRoomCollectionUrl(href)) return false;
    if (/\/(collections?|profile|followers?|followings?|likes?|search|items?)\/?$/.test(path)) return false;
    return /\/items?\//.test(path) ||
      /\/item\//.test(path) ||
      /\/collections?\/[^/]+\/items?\//.test(path) ||
      /\/myroom\/[^/]+\/\d+/.test(path) ||
      /\/room_[^/]+\/\d{8,}/.test(path) ||
      /\/[^/]+\/17\d{14,}/.test(path);
  }

  function isRoomCollectionUrl(href) {
    if (!href) return false;
    let url;
    try {
      url = new URL(href, location.href);
    } catch {
      return false;
    }
    if (!/room\.rakuten\.co\.jp$/.test(url.hostname)) return false;
    const path = decodeURIComponent(url.pathname).replace(/\/+$/, "");
    return /^\/collections?\/[^/]+$/.test(path) ||
      /^\/room_[^/]+\/collections?\/[^/]+$/.test(path) ||
      /^\/[^/]+\/collections?\/[^/]+$/.test(path) ||
      /^\/[^/]+\/18\d{14,}$/.test(path);
  }

  function isCollectionListPage() {
    const path = decodeURIComponent(location.pathname).replace(/\/+$/, "");
    return /^\/collections?\/[^/]+/.test(path) ||
      /^\/room_[^/]+\/collections?\/[^/]+/.test(path) ||
      /^\/[^/]+\/collections?\/[^/]+/.test(path) ||
      /^\/[^/]+\/18\d{14,}$/.test(path);
  }

  function shouldOpenRoomNavigationInNewTab(nextHref, currentHref) {
    if (!isCollectionListPage()) return false;

    let nextUrl;
    let currentUrl;
    try {
      nextUrl = new URL(nextHref, location.href);
      currentUrl = new URL(currentHref || location.href, location.href);
    } catch {
      return false;
    }

    if (!/room\.rakuten\.co\.jp$/.test(nextUrl.hostname)) return false;
    if (nextUrl.href === currentUrl.href) return false;
    if (/\/edit(\/|$)|[?&](edit|mode=edit|isEdit)=/.test(`${nextUrl.pathname}${nextUrl.search}`)) return false;
    if (isRoomCollectionUrl(nextUrl.href)) return false;

    const path = decodeURIComponent(nextUrl.pathname).replace(/\/+$/, "");
    if (/\/(collections?|profile|followers?|followings?|likes?|search)\/?/.test(path)) return false;

    return isRoomPostUrl(nextUrl.href) ||
      /\/items?\//.test(path) ||
      /\/item\//.test(path) ||
      /\d{8,}/.test(path);
  }

  function findRoomPostLinkFromClick(event) {
    const direct = event.target.closest?.("a[href]");
    if (direct && isRoomPostUrl(direct.href)) return direct;
    return null;
  }

  function openRoomPostLinksInNewTabs() {
    if (!/room\.rakuten\.co\.jp$/.test(location.hostname)) return;
    if (!isCollectionListPage()) return;
    Array.from(document.links)
      .filter((a) => isRoomPostUrl(a.href))
      .forEach((a) => {
        a.target = "_blank";
        a.rel = "noopener";
      });
  }

  function enableRoomPostNewTabClickGuard() {
    if (window.__codexRoomPostNewTabGuard) return;
    window.__codexRoomPostNewTabGuard = true;

    document.addEventListener("pointerdown", () => {
      openRoomPostLinksInNewTabs();
    }, true);

    document.addEventListener("click", (event) => {
      if (!/room\.rakuten\.co\.jp$/.test(location.hostname)) return;
      if (!isCollectionListPage()) return;
      if (event.target.closest(`#${PANEL_ID}`)) return;

      const beforeUrl = location.href;
      const wasCollectionList = isCollectionListPage();
      const direct = event.target.closest?.("a[href]");
      if (direct && isRoomCollectionUrl(direct.href)) return;

      const link = findRoomPostLinkFromClick(event);
      if (!link) {
        watchSameTabRoomNavigation(beforeUrl, wasCollectionList);
        return;
      }
      if (isRoomCollectionUrl(link.href)) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      openTabInSameWindow(link.href);
    }, true);
  }

  function enableRoomHistoryGuard() {
    if (window.__codexRoomHistoryGuard) return;
    window.__codexRoomHistoryGuard = true;

    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = function (state, title, url) {
      if (url && shouldOpenRoomNavigationInNewTab(url, location.href)) {
        openTabInSameWindow(new URL(url, location.href).href);
        return;
      }
      return originalPushState(state, title, url);
    };

    history.replaceState = function (state, title, url) {
      if (url && shouldOpenRoomNavigationInNewTab(url, location.href)) {
        openTabInSameWindow(new URL(url, location.href).href);
        return;
      }
      return originalReplaceState(state, title, url);
    };
  }

  function watchSameTabRoomNavigation(beforeUrl, wasCollectionList) {
    if (!wasCollectionList || !beforeUrl) return;
    const check = () => {
      const afterUrl = location.href;
      if (afterUrl === beforeUrl) return;
      if (!isRoomPostUrl(afterUrl)) return;

      openTabInSameWindow(afterUrl);
      history.back();
    };

    setTimeout(check, 80);
    setTimeout(check, 250);
    setTimeout(check, 700);
  }

  function findRoomPostElement() {
    const targets = Array.from(document.querySelectorAll("a, button, [role='button']"))
      .filter(visible)
      .map((el) => ({
        el,
        href: el.href || el.getAttribute("href") || "",
        text: cleanText(el.innerText || el.textContent || el.getAttribute("aria-label") || el.title),
      }));

    return targets.find((target) => /ROOMに投稿|ROOMへ投稿|ROOM投稿|投稿する|ROOMで紹介/.test(target.text) && /ROOM/i.test(target.text)) ||
      targets.find((target) => /room\.rakuten\.co\.jp/.test(target.href) && /collect|post|room|item|投稿|紹介/i.test(`${target.href} ${target.text}`)) ||
      targets.find((target) => /ROOM/i.test(target.text) && /投稿|コレ|追加/.test(target.text)) ||
      null;
  }

  function openRoomPost() {
    const target = findRoomPostElement();
    if (!target) {
      toast("ROOM投稿ボタンが見つかりません");
      return;
    }

    if (target.href) {
      if (isProductSite()) {
        openRoomPostFromProduct(target.href);
        toast("ROOM投稿を開いて商品ページを閉じます");
      } else {
        window.open(target.href, "_blank", "noopener");
        toast("ROOM投稿を別タブで開きます");
      }
      return;
    }

    target.el.click();
    toast("ROOM投稿を開きます");
  }

  function isCampaignLink(href, text) {
    const value = `${href || ""} ${text || ""}`.toLowerCase();
    return /spu|super[-_]?point|point[-_]?up|campaign|campaigns|event|sale|スーパーpoint|スーパーポイント|ポイントアップ|キャンペーン|お買い物マラソン|スーパーセール|勝ったら倍|39ショップ/.test(value);
  }

  function isLikelyProductLink(href, text) {
    const value = `${href || ""} ${text || ""}`;
    if (!/rakuten|r10s|afl/.test(value)) return false;
    if (/room\.rakuten\.co\.jp|my\.bookmark\.rakuten\.co\.jp/.test(href)) return false;
    if (isCampaignLink(href, text)) return false;
    return /item\.rakuten\.co\.jp|books\.rakuten\.co\.jp|brandavenue\.rakuten\.co\.jp|fashion\.rakuten\.co\.jp|hb\.afl\.rakuten\.co\.jp|pt\.afl\.rakuten\.co\.jp|linksynergy|商品ページ|商品詳細|楽天市場で詳細|楽天市場で見る|購入する/.test(value);
  }

  function findInput() {
    const fields = Array.from(document.querySelectorAll("textarea, [contenteditable='true']"))
      .filter(visible)
      .sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height);
    return fields[0] || null;
  }

  function fillInput(el, text) {
    const value = formatForRoomClipboard(text);
    el.focus();
    if ("value" in el) {
      el.value = value;
    } else {
      el.textContent = value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function copy(text) {
    navigator.clipboard?.writeText(formatForRoomClipboard(text)).catch(() => {});
  }

  async function pasteClipboardToSavedText() {
    try {
      const text = cleanMultilineText(await navigator.clipboard.readText());
      if (!text) {
        toast("クリップボードが空です");
        return;
      }
      writeState({
        comment: text,
        productUrl: findProductUrl(),
        sourceUrl: location.href,
      });
      refresh();
      toast("貼り付けました");
    } catch {
      toast("クリップボードを読めませんでした");
    }
  }

  function openSearchSortedByNewest() {
    if (!/search\.rakuten\.co\.jp$/.test(location.hostname)) {
      toast("検索結果ページで使ってください");
      return;
    }

    const url = new URL(location.href);
    url.searchParams.set("s", "4");
    url.searchParams.delete("p");
    location.href = url.toString();
  }

  function extractDisplayedProductInfo() {
    const title =
      cleanText(document.querySelector("h1")?.innerText) ||
      cleanText(document.querySelector("[class*='itemName'], [class*='ItemName'], [class*='productName'], [class*='ProductName']")?.innerText) ||
      cleanText(document.querySelector("meta[property='og:title']")?.getAttribute("content")) ||
      cleanText(document.title);

    const description =
      cleanText(document.querySelector("meta[property='og:description']")?.getAttribute("content")) ||
      cleanText(document.querySelector("meta[name='description']")?.getAttribute("content")) ||
      cleanText(Array.from(document.querySelectorAll("p, [class*='description'], [class*='Description'], [class*='explanation'], [class*='Explanation']"))
        .map((el) => el.innerText || el.textContent)
        .filter(Boolean)
        .slice(0, 6)
        .join(" "));

    const price =
      cleanText(Array.from(document.querySelectorAll("[class*='price'], [class*='Price'], [data-testid*='price']"))
        .map((el) => el.innerText || el.textContent)
        .find((text) => /[0-9０-９,，]+円|¥|￥/.test(text)));

    return {
      title: title.replace(/\s*[|｜].*楽天.*$/u, "").slice(0, 120),
      description: description.slice(0, 500),
      price: price.slice(0, 80),
    };
  }

  function hasAny(text, words) {
    return words.some((word) => text.includes(word));
  }

  function pickByHash(list, seed) {
    const values = list.filter(Boolean);
    if (!values.length) return "";
    let hash = 0;
    for (const char of String(seed || "")) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    return values[Math.abs(hash) % values.length];
  }

  function uniquePick(list, seed, count) {
    const pool = [...new Set(list.filter(Boolean))];
    const picked = [];
    for (let i = 0; picked.length < count && i < pool.length * 2; i += 1) {
      const value = pickByHash(pool, `${seed}:${i}`);
      if (!picked.includes(value)) picked.push(value);
    }
    return picked;
  }

  function inferReviewCategory(source) {
    if (hasAny(source, ["ワンピ", "ドレス", "ジャンスカ"])) return "ワンピース";
    if (hasAny(source, ["パンツ", "スラックス", "デニム", "レギンス"])) return "パンツ";
    if (hasAny(source, ["スカート"])) return "スカート";
    if (hasAny(source, ["カーデ", "羽織", "ボレロ"])) return "カーディガン";
    if (hasAny(source, ["ブラウス", "シャツ", "トップス", "ニット", "カットソー", "tシャツ"])) return "トップス";
    if (hasAny(source, ["バッグ", "トート", "ショルダー", "ポーチ"])) return "バッグ";
    if (hasAny(source, ["パンプス", "サンダル", "ブーツ", "スニーカー", "シューズ"])) return "シューズ";
    return "アイテム";
  }

  function inferReviewFeatures(source) {
    const rules = [
      ["体型カバー", ["体型カバー", "ゆったり", "ワイド", "ドルマン", "フレア"]],
      ["細見えシルエット", ["細見え", "痩せ見え", "着痩せ", "すっきり", "スリム"]],
      ["高見えデザイン", ["高見え", "上品", "きれいめ", "ツイード", "パール", "ジャガード"]],
      ["シアー素材", ["シアー", "透け", "チュール", "オーガンジー"]],
      ["二の腕カバー", ["二の腕", "フレンチスリーブ", "パフスリーブ", "袖"]],
      ["接触冷感素材", ["接触冷感", "冷感", "ひんやり", "クール"]],
      ["UV対策", ["uv", "uvカット", "紫外線", "日焼け"]],
      ["洗える素材", ["洗える", "ウォッシャブル", "洗濯", "手洗い"]],
      ["撥水加工", ["撥水", "防水", "雨", "レイン"]],
      ["美脚見え", ["美脚", "脚長", "センタープレス", "テーパード"]],
      ["セットアップ対応", ["セットアップ", "上下セット", "2点セット"]],
      ["淡色コーデ向き", ["淡色", "ベージュ", "アイボリー", "ホワイト", "ピンク"]],
      ["旅行にも使いやすい", ["旅行", "トラベル", "軽量", "シワ", "しわ", "リゾート"]],
    ];
    const found = rules
      .filter(([, words]) => hasAny(source, words.map((word) => word.toLowerCase())))
      .map(([feature]) => feature);
    return [...new Set([...found, "大人可愛い雰囲気", "着回し力"])].slice(0, 4);
  }

  function inferReviewWorry(category, features, seed) {
    const featureText = features.join(" ");
    const choices = [];
    if (featureText.includes("体型カバー")) choices.push("可愛く着たいけど、体のラインを拾いすぎる服は避けたい");
    if (featureText.includes("二の腕カバー")) choices.push("ノースリや半袖は好きだけど、二の腕まわりが気になって挑戦しにくい");
    if (featureText.includes("シアー")) choices.push("抜け感は欲しいけど、透けすぎて安っぽく見えるのは避けたい");
    if (featureText.includes("接触冷感")) choices.push("暑い日も可愛くいたいけど、汗ばむ服や重たい素材は選びたくない");
    if (featureText.includes("UV")) choices.push("日差し対策はしたいけど、いかにも対策服っぽく見えるのは避けたい");
    if (category === "ワンピース") choices.push("1枚で可愛く決めたいけど、部屋着っぽく見えたり体型が出すぎたりするのは避けたい");
    if (category === "パンツ") choices.push("楽なパンツを選ぶと、下半身のラインや部屋着っぽさが気になりそう");
    if (category === "トップス") choices.push("合わせやすいトップスほど、普通すぎて写真映えしないのが悩み");
    if (category === "カーディガン") choices.push("羽織るだけだと生活感が出て、せっかくのコーデがぼやけそう");
    choices.push("可愛いだけじゃなく、ちゃんと高見えして着回せるアイテムが欲しい");
    return pickByHash(choices, `${seed}:worry`);
  }

  function inferReviewLine(category, features, seed, kind) {
    const featureA = features[0] || "きれいめデザイン";
    const featureB = features[1] || "着回し力";
    const pools = {
      lead: [
        `${featureA}がほどよく効いて、着るだけで大人可愛い印象に整えてくれます✨`,
        `${featureA}と${featureB}のバランスがよく、いつものコーデを自然に高見えさせてくれます💖`,
        `派手すぎないのにちゃんと印象に残るので、普段使いにもお出かけにも頼れます🎀`,
      ],
      detail: [
        `気になる部分をふわっとごまかしながら、女性らしい雰囲気はしっかり残せるのが魅力です。`,
        `シンプルに合わせても地味になりにくく、写真で見てもきれいめにまとまりやすいです。`,
        `手持ち服に足すだけで印象が変わるので、買い足しアイテムとしても優秀です。`,
      ],
      sales: [
        `レビューで見比べる時も、細見え・高見え・着回しの3つが揃っていると選びやすいです✨`,
        `「何着よう？」の日に手が伸びるタイプなので、ワードローブにあると出番が増えそうです💖`,
        `トレンド感はありつつ派手すぎないので、長く使える大人可愛い1枚を探している人に刺さります🎀`,
      ],
      click: [
        `カラーやサイズで印象が変わるので、商品ページで写真とレビューを見比べて選びたいです🔍`,
        `人気カラーは早めに動くこともあるので、気になる色があるうちにチェックしておきたいです✨`,
        `着用写真を見ると雰囲気がつかみやすいので、購入前にシルエットまで確認したいです💖`,
      ],
      trust: [
        `迷った時はレビューの写真やサイズ感まで見ると、失敗しにくそうです◎`,
        `普段使いしやすいデザインなので、色違いまでチェックしたくなるアイテムです。`,
        `季節の変わり目にも使いやすく、今から長く着回せそうです✨`,
      ],
      final: [
        `気になる方は、在庫とカラーを早めに見ておきたいです✨`,
        `お気に入り登録して比較しておくのもおすすめです💖`,
        `売り切れ前に候補へ入れておきたい可愛さです♡`,
      ],
    };
    if (category === "ワンピース") pools.final.push("褒められワンピを探している方は要チェックです👗");
    if (category === "パンツ") pools.final.push("美脚見えパンツを探している方は要チェックです✨");
    if (category === "カーディガン") pools.final.push("冷房対策にも使える羽織りを探している方に◎");
    return pickByHash(pools[kind], `${seed}:${kind}`);
  }

  function inferReviewPoints(category, features, seed) {
    const pool = [
      "細見えしやすいシルエット",
      "高見えするきれいめデザイン",
      "着回し力が高い",
      "大人可愛い印象にまとまる",
      "普段使いにもお出かけにも使いやすい",
      "写真映えしやすい",
    ];
    if (features.includes("UV対策")) pool.unshift("UV対策にも便利");
    if (features.includes("洗える素材")) pool.unshift("お手入れしやすい");
    if (features.includes("美脚見え")) pool.unshift("脚をすっきり見せやすい");
    if (features.includes("接触冷感素材")) pool.unshift("暑い日も快適に着やすい");
    if (category === "ワンピース") pool.unshift("1枚でコーデが完成");
    return uniquePick(pool, `${seed}:points`, 3);
  }

  function inferReviewCoords(category, seed) {
    const common = [
      "ヒール合わせで上品なお出かけコーデに",
      "サンダルやミニバッグで軽やかな休日コーデに",
      "ジャケットを羽織って通勤にもきれいめに",
      "アクセを足してデートや女子会にも華やかに",
      "スニーカー合わせで抜け感のある大人カジュアルに",
    ];
    if (category === "パンツ") common.unshift("ブラウス合わせでオフィスにも好印象に");
    if (category === "カーディガン") common.unshift("ノースリーブやワンピに羽織って冷房対策に");
    if (category === "スカート") common.unshift("コンパクトトップス合わせでバランスよく");
    return uniquePick(common, `${seed}:coords`, 2);
  }

  function pickReviewHashtags(source, category, features) {
    const rules = [
      ["#骨格ウェーブ", /骨格ウェーブ|ウェーブ|ハイウエスト|ウエストマーク|フレア|aライン/],
      ["#高見え", /高見え|上品|きれいめ|大人|ツイード|パール|ジャガード/],
      ["#褒められワンピ", /ワンピ|ドレス|ジャンスカ/],
      ["#二の腕カバー", /二の腕|フレンチスリーブ|袖|パフスリーブ|ドルマン/],
      ["#痩せ見え", /痩せ見え|細見え|着痩せ|すっきり|体型カバー|スリム/],
      ["#カップ付き", /カップ付き|ブラトップ|ブラカップ|インナー/],
      ["#シアー", /シアー|透け|チュール|オーガンジー/],
      ["#抜け感", /抜け感|ゆったり|オーバーサイズ|リラックス/],
      ["#大人ガーリー", /ガーリー|フリル|リボン|レース|フェミニン/],
      ["#セットアップ", /セットアップ|上下セット|2点セット|ツーピース/],
      ["#接触冷感", /接触冷感|冷感|ひんやり|クール/],
      ["#きれいめ", /きれいめ|上品|通勤|オフィス|セレモニー/],
      ["#垢抜け", /垢抜け|こなれ|トレンド|今っぽ|洒落/],
      ["#淡色コーデ", /淡色|ベージュ|アイボリー|ホワイト|白|エクリュ|ライトグレー|ピンク/],
      ["#神アイテム", /ランキング|高評価|レビュー|万能|楽ちん|人気|売れ/],
      ["#水際ファッション", /水着|ラッシュガード|ビーチ|プール|海|水際|リゾート/],
      ["#洗える", /洗える|ウォッシャブル|自宅で洗える|洗濯/],
      ["#撥水", /撥水|防水|レイン|雨/],
      ["#冷房対策", /冷房|羽織|カーデ|カーディガン|uv|薄手/],
      ["#美脚見え", /美脚|センタープレス|テーパード|脚長|パンツ|スラックス/],
      ["#旅行コーデ", /旅行|トラベル|シワ|しわ|軽量|リゾート|楽ちん/],
      ["#大人可愛い", /大人可愛い|大人|可愛い|フェミニン|ガーリー|きれいめ/],
      ["#金属アレルギー対応", /金属アレルギー|サージカルステンレス|ニッケルフリー|アクセサリー|ピアス|ネックレス/],
      ["#UVカット", /uv|紫外線|日焼け|遮蔽/],
      ["#卒入園", /卒入園|卒園|入園|卒業|入学|セレモニー|オケージョン/],
    ];
    const base = {
      "ワンピース": ["#ワンピース", "#大人可愛い", "#きれいめ"],
      "パンツ": ["#パンツ", "#美脚見え", "#きれいめ"],
      "スカート": ["#スカート", "#大人可愛い", "#きれいめ"],
      "カーディガン": ["#冷房対策", "#きれいめ", "#着回し"],
      "トップス": ["#トップス", "#大人可愛い", "#着回し"],
      "バッグ": ["#バッグ", "#高見え", "#大人可愛い"],
      "シューズ": ["#シューズ", "#きれいめ", "#高見え"],
      "アイテム": ["#大人可愛い", "#きれいめ", "#高見え"],
    }[category] || ["#大人可愛い", "#きれいめ", "#高見え"];
    const matched = rules.filter(([, pattern]) => pattern.test(source)).map(([tag]) => tag);
    return Array.from(new Set([...matched, ...base, ...features.map((feature) => `#${feature.replace(/\s+/g, "")}`), "#楽天ROOM"]))
      .slice(0, 7)
      .join(" ");
  }

  function buildRoomReviewText(info) {
    const source = `${info.title} ${info.description}`.toLowerCase();
    const title = info.title || "このアイテム";
    const category = inferReviewCategory(source);
    const features = inferReviewFeatures(source);
    const seed = `${title} ${info.description} ${features.join(" ")}`;
    const worry = inferReviewWorry(category, features, seed);
    const points = inferReviewPoints(category, features, seed);
    const coords = inferReviewCoords(category, seed);
    const hashtags = pickReviewHashtags(source, category, features);

    return `☁️“${worry}”を解決♡

${inferReviewLine(category, features, seed, "lead")}
${inferReviewLine(category, features, seed, "detail")}
${inferReviewLine(category, features, seed, "sales")}
${inferReviewLine(category, features, seed, "click")}
${inferReviewLine(category, features, seed, "trust")}
${inferReviewLine(category, features, seed, "final")}

✔ポイント
・${points[0]}
・${points[1]}
・${points[2]}

💫コーデ＆使い方
✨${coords[0]}
✨${coords[1]}

🍀━━━━━━━━━━━━🍀
🐾 #ファッションハナコ
🍀━━━━━━━━━━━━🍀

${hashtags}`;
  }

  function createReviewFromDisplayedProduct() {
    const info = extractDisplayedProductInfo();
    if (!info.title && !info.description) {
      toast("商品情報が見つかりません");
      return;
    }

    if (!window.RoomReviewGenerator?.generateFromInfo) {
      toast("レビュー生成ロジックを読み込めませんでした");
      return;
    }

    const comment = cleanMultilineText(window.RoomReviewGenerator.generateFromInfo(info));
    writeState({
      comment,
      productUrl: findProductUrl() || location.href,
      sourceUrl: location.href,
    });
    copy(comment);
    refresh();
    toast("レビューを作成しました");
  }

  function isProductSite() {
    return /^(item|books|brandavenue|fashion)\.rakuten\.co\.jp$/.test(location.hostname);
  }

  function registerProductTab() {
    if (!isProductSite()) return;
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "register-product-tab" });
    }
  }

  function shouldAutoOpenRoomPost() {
    if (!isProductSite()) return false;
    try {
      const url = new URL(location.href);
      return url.searchParams.get("hanakoRoomPost") === "1";
    } catch {
      return false;
    }
  }

  function autoOpenRoomPostFromHanakoOps() {
    if (!shouldAutoOpenRoomPost()) return;
    let opened = false;
    let attempts = 0;
    const run = () => {
      if (opened) return;
      attempts += 1;
      if (!findRoomPostElement()) {
        if (attempts < 10) setTimeout(run, 1200);
        return;
      }
      opened = true;
      openRoomPost();
      try {
        const url = new URL(location.href);
        url.searchParams.delete("hanakoRoomPost");
        history.replaceState(history.state, document.title, url.href);
      } catch {
        // keep the page usable even if URL cleanup fails
      }
    };
    setTimeout(run, 900);
  }

  function openProductTab(url) {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "open-product-tab", url });
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  function openRoomPostFromProduct(url) {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "open-room-post-from-product", url });
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  function closeCurrentAndProductTabs() {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "close-current-and-product" });
      return;
    }
    window.close();
  }

  function openTabAndCloseThis(url) {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "open-tab-and-close-sender", url });
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  function openTabInSameWindow(url) {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "open-tab-same-window", url });
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  function openInactiveTabInSameWindow(url) {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "open-tab-same-window-inactive", url });
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  function readCollectionState() {
    try {
      return JSON.parse(sessionStorage.getItem(COLLECTION_STATE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function writeCollectionState(next) {
    sessionStorage.setItem(COLLECTION_STATE_KEY, JSON.stringify({
      ...readCollectionState(),
      ...next,
      updatedAt: Date.now(),
    }));
  }

  function handleCollectionAutoReturn() {
    if (!/room\.rakuten\.co\.jp$/.test(location.hostname)) return;

    if (isCollectionListPage()) {
      if (restoreCollectionScrollIfNeeded()) return;

      writeCollectionState({
        collectionUrl: location.href,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        armed: true,
      });
      return;
    }

    if (!isRoomPostUrl(location.href)) return;

    const state = readCollectionState();
    if (!state.armed || !state.collectionUrl) return;
    if (Date.now() - Number(state.updatedAt || 0) > 10 * 60 * 1000) return;
    if (state.lastOpenedPostUrl === location.href) return;

    writeCollectionState({
      armed: false,
      lastOpenedPostUrl: location.href,
    });
    openInactiveTabInSameWindow(location.href);
    window.setTimeout(() => {
      writeCollectionState({
        restoreScroll: true,
        scrollX: state.scrollX || 0,
        scrollY: state.scrollY || 0,
      });
      history.back();
    }, 120);
  }

  function restoreCollectionScrollIfNeeded() {
    const state = readCollectionState();
    if (!state.restoreScroll) return false;

    suppressCollectionScrollSave = true;
    writeCollectionState({ restoreScroll: false });
    const x = Number(state.scrollX || 0);
    const y = Number(state.scrollY || 0);
    const restore = () => window.scrollTo(x, y);
    restore();
    setTimeout(restore, 120);
    setTimeout(restore, 350);
    setTimeout(restore, 900);
    setTimeout(() => {
      suppressCollectionScrollSave = false;
      writeCollectionState({
        collectionUrl: location.href,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        armed: true,
      });
    }, 1400);
    return true;
  }

  window.addEventListener("scroll", () => {
    if (!isCollectionListPage()) return;
    if (suppressCollectionScrollSave) return;
    const state = readCollectionState();
    if (state.restoreScroll) return;
    writeCollectionState({
      collectionUrl: location.href,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      armed: true,
    });
  }, { passive: true });

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.origin !== location.origin) return;
    if (event.data?.source !== "codex-room-repost-helper-main") return;
    if (event.data?.type !== "open-room-post-in-tab") return;
    if (!event.data.url) return;

    openTabInSameWindow(event.data.url);
  });

  function maybeAutoCloseAfterCompletion() {
    if (!/room\.rakuten\.co\.jp$/.test(location.hostname)) return;
    const pageText = cleanText(document.body?.innerText || "");
    if (!/投稿しました|投稿が完了|コレしました|コレクションに追加しました|追加しました/.test(pageText)) return;
    if (sessionStorage.getItem("codex.room.closedAfterComplete") === location.href) return;

    sessionStorage.setItem("codex.room.closedAfterComplete", location.href);
    setTimeout(closeCurrentAndProductTabs, 1200);
  }

  document.addEventListener("click", (event) => {
    if (!/room\.rakuten\.co\.jp$/.test(location.hostname)) return;
    const action = event.target.closest?.("button, a, [role='button']");
    if (!action) return;

    const label = cleanText(action.innerText || action.textContent || action.getAttribute("aria-label"));
    if (!/コレクションに追加|追加する|投稿する|完了/.test(label)) return;

    setTimeout(maybeAutoCloseAfterCompletion, 1200);
    setTimeout(maybeAutoCloseAfterCompletion, 2500);
    setTimeout(maybeAutoCloseAfterCompletion, 4500);
  }, true);

  function toast(message) {
    const status = document.querySelector(`#${PANEL_ID} .rrh-status`);
    if (status) status.textContent = message;
  }

  function refresh() {
    const preview = document.querySelector(`#${PANEL_ID} .rrh-preview`);
    if (!preview) return;
    const text = readState().comment;
    preview.textContent = text ? text.slice(0, 100) + (text.length > 100 ? "..." : "") : "未保存";
  }

  function button(label, onClick) {
    const el = document.createElement("button");
    el.type = "button";
    el.textContent = label;
    el.addEventListener("click", onClick);
    return el;
  }

  function inject() {
    if (document.getElementById(PANEL_ID)) return;

    const style = document.createElement("style");
    style.textContent = `
      #${PANEL_ID} {
        position: fixed !important;
        left: 12px !important;
        bottom: 12px !important;
        z-index: 2147483647 !important;
        width: 260px !important;
        padding: 12px !important;
        border: 1px solid #cfcfcf !important;
        border-radius: 8px !important;
        background: #fff !important;
        color: #222 !important;
        font: 13px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        box-shadow: 0 8px 28px rgba(0,0,0,.22) !important;
      }
      #${PANEL_ID} * {
        box-sizing: border-box !important;
        font: inherit !important;
      }
      #${PANEL_ID} .rrh-head {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
        margin-bottom: 8px !important;
        font-weight: 700 !important;
      }
      #${PANEL_ID} .rrh-close {
        width: 24px !important;
        height: 24px !important;
        padding: 0 !important;
      }
      #${PANEL_ID} .rrh-preview {
        min-height: 42px !important;
        max-height: 78px !important;
        overflow: auto !important;
        margin: 8px 0 !important;
        padding: 8px !important;
        border-radius: 6px !important;
        background: #f5f5f5 !important;
        white-space: pre-wrap !important;
        word-break: break-word !important;
      }
      #${PANEL_ID} .rrh-grid {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 6px !important;
      }
      #${PANEL_ID} button {
        min-height: 32px !important;
        border: 1px solid #d0d0d0 !important;
        border-radius: 6px !important;
        background: #f8f8f8 !important;
        color: #222 !important;
        cursor: pointer !important;
      }
      #${PANEL_ID} .rrh-status {
        min-height: 18px !important;
        margin-top: 8px !important;
        color: #bf0000 !important;
      }
    `;

    const panel = document.createElement("aside");
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="rrh-head">
        <span>ROOM再投稿ヘルパー</span>
        <button type="button" class="rrh-close">x</button>
      </div>
      <div class="rrh-preview"></div>
      <div class="rrh-grid"></div>
      <div class="rrh-status"></div>
    `;

    const grid = panel.querySelector(".rrh-grid");
    grid.append(
      button("保存", () => {
        const text = findText();
        if (!text) {
          toast("投稿文を選択してから保存してください");
          return;
        }
        writeState({ comment: cleanMultilineText(text), productUrl: findProductUrl(), sourceUrl: location.href });
        copy(text);
        refresh();
        toast("保存しました");
      }),
      button("コピー", () => {
        const text = readState().comment;
        if (!text) {
          toast("未保存です");
          return;
        }
        copy(text);
        toast("コピーしました");
      }),
      button("商品ページ", () => {
        const link = findProductLinkElement();
        const url = findProductUrl();
        if (!url && !link) {
          toast("商品リンクが見つかりません");
          return;
        }
        if (link) {
          writeState({ productUrl: link.href });
          openProductTab(link.href);
          toast("商品ページを開きます");
          return;
        }
        writeState({ productUrl: url });
        openProductTab(url);
      }),
      button("リンク確認", () => {
        const candidates = productLinkCandidates();
        if (!candidates.length) {
          toast("候補リンクが見つかりません");
          return;
        }
        const message = candidates
          .map((link, index) => `${index + 1}. ${link.text}\n${link.href}`)
          .join("\n\n");
        const choice = prompt(`開く商品リンクの番号を入力してください。\n\n${message}`, "1");
        const index = Number(choice) - 1;
        if (!Number.isInteger(index) || !candidates[index]) {
          toast("キャンセルしました");
          return;
        }
        writeState({ productUrl: candidates[index].href });
        openProductTab(candidates[index].href);
      }),
      button("ROOM投稿", () => {
        openRoomPost();
      }),
      button("フォーム入力", () => {
        const text = readState().comment;
        const input = findInput();
        if (!text) {
          toast("未保存です");
          return;
        }
        if (!input) {
          toast("入力欄が見つかりません");
          return;
        }
        fillInput(input, text);
        toast("入力しました");
      }),
      button("保存を消す", () => {
        localStorage.removeItem(STORAGE_KEY);
        refresh();
        toast("消しました");
      })
    );

    grid.append(button("レビュー作成", () => {
      createReviewFromDisplayedProduct();
    }));
    grid.append(button("貼り付け", () => {
      pasteClipboardToSavedText();
    }));
    grid.append(button("完了して閉じる", () => {
      closeCurrentAndProductTabs();
    }));

    panel.querySelector(".rrh-close").addEventListener("click", () => panel.remove());
    document.documentElement.append(style, panel);
    refresh();
  }

  function boot() {
    injectMainWorldFallback();
    registerProductTab();
    autoOpenRoomPostFromHanakoOps();
    handleCollectionAutoReturn();
    setTimeout(maybeAutoCloseAfterCompletion, 1500);
    inject();
    openRoomPostLinksInNewTabs();
    enableRoomPostNewTabClickGuard();
    enableRoomHistoryGuard();
    setTimeout(inject, 1000);
    setTimeout(inject, 3000);
    setTimeout(inject, 6000);
    setTimeout(openRoomPostLinksInNewTabs, 1000);
    setTimeout(openRoomPostLinksInNewTabs, 3000);
    setTimeout(openRoomPostLinksInNewTabs, 6000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
