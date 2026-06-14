const lastProductTabByWindow = new Map();

function rememberProductTab(sender) {
  if (!sender.tab || !sender.tab.id) return;
  lastProductTabByWindow.set(sender.tab.windowId, sender.tab.id);
}

function closeTabs(tabIds) {
  const unique = Array.from(new Set(tabIds.filter(Boolean)));
  if (!unique.length) return;
  chrome.tabs.remove(unique).catch(() => {});
}

chrome.runtime.onMessage.addListener((message, sender) => {
  if (!message || !message.type) return;
  if (!sender.tab || !sender.tab.id) return;

  if (message.type === "register-product-tab") {
    rememberProductTab(sender);
    return;
  }

  if (message.type === "close-current-and-product") {
    const productTabId = lastProductTabByWindow.get(sender.tab.windowId);
    closeTabs([sender.tab.id, productTabId]);
    if (productTabId) lastProductTabByWindow.delete(sender.tab.windowId);
    return;
  }

  if (!message.url) return;

  if (message.type === "open-product-tab") {
    chrome.tabs.create({
      url: message.url,
      active: true,
      windowId: sender.tab.windowId,
    }, (tab) => {
      if (tab?.id) lastProductTabByWindow.set(sender.tab.windowId, tab.id);
    });
    return;
  }

  if (message.type === "open-room-post-from-product") {
    rememberProductTab(sender);
    chrome.tabs.create({
      url: message.url,
      active: true,
      windowId: sender.tab.windowId,
    });
    return;
  }

  if (message.type === "open-tab-same-window") {
    chrome.tabs.create({
      url: message.url,
      active: true,
      windowId: sender.tab.windowId,
    });
    return;
  }

  if (message.type === "open-tab-same-window-inactive") {
    chrome.tabs.create({
      url: message.url,
      active: false,
      windowId: sender.tab.windowId,
    });
    return;
  }

  if (message.type !== "open-tab-and-close-sender") return;

  chrome.tabs.create({
    url: message.url,
    active: true,
    windowId: sender.tab.windowId,
  }, () => {
    window.setTimeout(() => {
      chrome.tabs.remove(sender.tab.id);
    }, 800);
  });
});
