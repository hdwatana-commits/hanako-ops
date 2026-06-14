(function () {
  "use strict";

  if (window.__codexRoomMainWorldGuard) return;
  window.__codexRoomMainWorldGuard = true;

  const SOURCE = "codex-room-repost-helper-main";

  function post(url) {
    window.postMessage({
      source: SOURCE,
      type: "open-room-post-in-tab",
      url,
    }, location.origin);
  }

  function pathOf(href) {
    try {
      return decodeURIComponent(new URL(href, location.href).pathname).replace(/\/+$/, "");
    } catch {
      return "";
    }
  }

  function isRoomHost(href) {
    try {
      return /room\.rakuten\.co\.jp$/.test(new URL(href, location.href).hostname);
    } catch {
      return false;
    }
  }

  function isCollectionPage(href) {
    const path = pathOf(href || location.href);
    return /^\/[^/]+\/18\d{14,}$/.test(path);
  }

  function isPostPage(href) {
    const path = pathOf(href);
    return /^\/[^/]+\/17\d{14,}$/.test(path);
  }

  function isEditUrl(href) {
    try {
      const url = new URL(href, location.href);
      return /\/edit(\/|$)|[?&](edit|mode=edit|isEdit)=/.test(`${url.pathname}${url.search}`);
    } catch {
      return false;
    }
  }

  function shouldOpenInTab(href) {
    return isCollectionPage(location.href) &&
      isRoomHost(href) &&
      isPostPage(href) &&
      !isEditUrl(href);
  }

  function findPostLink(target) {
    const direct = target && target.closest && target.closest("a[href]");
    if (direct && shouldOpenInTab(direct.href)) return direct.href;
    return "";
  }

  document.addEventListener("click", (event) => {
    const href = findPostLink(event.target);
    if (!href) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    post(href);
  }, true);

  function watchNavigation(before) {
    window.setTimeout(() => {
      if (location.href === before) return;
      if (!shouldOpenInTab(location.href)) return;
      const href = location.href;
      post(href);
      history.back();
    }, 40);
  }

  document.addEventListener("pointerdown", () => {
    if (!isCollectionPage(location.href)) return;
    watchNavigation(location.href);
  }, true);

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (state, title, url) {
    if (url && shouldOpenInTab(new URL(url, location.href).href)) {
      post(new URL(url, location.href).href);
      return;
    }
    return originalPushState.apply(this, arguments);
  };

  history.replaceState = function (state, title, url) {
    if (url && shouldOpenInTab(new URL(url, location.href).href)) {
      post(new URL(url, location.href).href);
      return;
    }
    return originalReplaceState.apply(this, arguments);
  };
})();
