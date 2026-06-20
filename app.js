const defaultProfile = `毎日おしゃれ研究家のハナコです
大人ガーリー＆甘めきれいめコーデを研究中

👗 きれいめ可愛い着回し
🛍 楽天ROOMで高見えアイテム発掘
🍛 渋谷グルメも開拓中
🎀 気分が上がる可愛いもの記録

※ROOMリンクはアフィリエイトを含みます
愛用品・推し服はこちら👇`;

const starterProducts = [
  {
    id: createId(),
    name: "高見えフリルブラウス",
    url: "",
    category: "トップス",
    price: "3,000円台",
    hook: "甘めだけどジャケット合わせで通勤にも使える",
  },
  {
    id: createId(),
    name: "細見えマーメイドスカート",
    url: "",
    category: "スカート",
    price: "4,000円台",
    hook: "腰まわりがすっきり見えて大人ガーリーに寄せやすい",
  },
  {
    id: createId(),
    name: "淡色ミニショルダー",
    url: "",
    category: "バッグ",
    price: "2,000円台",
    hook: "白ワンピにもデニムにも合わせやすい万能小物",
  },
];

let hasMeaningfulLocalData = Boolean(localStorage.getItem("hanako-room-ops"));
const state = loadState();
state.updatedAt ||= new Date().toISOString();
state.roomQueue ||= [];
let activePlatform = "Instagram";
let lastGenerated = "";
let lastGenerationContext = null;
let generationVariant = 0;
let suppressCloudSave = false;
let cloudSaveTimer = null;
let lastCloudSyncAt = null;
const cloudSync = new window.HanakoCloudSync(window.HANAKO_CLOUD_CONFIG || {});

const anglePresets = {
  Instagram: ["季節の3選カルーセル", "高見え深掘り", "12秒リール", "着回し保存版", "失敗しない選び方", "本音レビュー", "1週間コーデ", "予算別比較", "女子大生あるある"],
  Threads: ["1日5本セット", "今日の可愛い発掘", "骨格ウェーブ目線", "ファッション小話", "小さな失敗談", "朝の支度", "二択で相談", "本音レビュー", "女子大生あるある", "ROOM更新メモ"],
  X: ["2商品比較", "ランキング", "セール速報", "着回し案", "買う前チェック", "予算別3選", "二択で相談", "女子大生あるある"],
};

const travelAnglePresets = {
  Instagram: ["女子旅ホテル保存版", "客室・食事・アクセス比較", "週末旅行モデルプラン", "予約前チェック", "宿泊本音レビュー"],
  Threads: ["次の旅の候補", "ホテル選びの小話", "立地と客室の二択", "予約前の確認", "宿泊本音レビュー"],
  X: ["宿泊プラン比較", "女子旅ホテル3選", "セール・クーポン確認", "予約前チェック", "アクセス重視比較"],
};

const views = {
  brief: "今日の運用",
  products: "商品パイプライン",
  generator: "投稿メーカー",
  room: "ROOM投稿",
  coordinate: "コーデ作成",
  calendar: "投稿カレンダー",
  connections: "SNS連携",
  analytics: "成果メモ",
};

const profileText = document.querySelector("#profileText");
const productGrid = document.querySelector("#productGrid");
const selectedProduct = document.querySelector("#selectedProduct");
const postOutput = document.querySelector("#postOutput");
const checklist = document.querySelector("#checklist");
const calendarList = document.querySelector("#calendarList");
const metricList = document.querySelector("#metricList");
const metricSummary = document.querySelector("#metricSummary");
const roomProductSelect = document.querySelector("#roomProductSelect");
const roomPostOutput = document.querySelector("#roomPostOutput");
const roomQueue = document.querySelector("#roomQueue");
const coordinateOutput = document.querySelector("#coordinateOutput");
const coordBoard = document.querySelector("#coordBoard");
const toast = document.querySelector("#toast");
let deferredInstallPrompt = null;
let coordinatePhotoDataUrl = "";
let coordinateBoardDataUrl = "";

initialize();

function initialize() {
  profileText.value = state.profile || defaultProfile;
  document.querySelector('input[name="date"]').valueAsDate = new Date();
  renderAngleOptions();
  registerPwa();
  bindNavigation();
  bindForms();
  bindActions();
  bindCloudSync();
  renderProducts();
  renderProductOptions();
  renderRoomProductOptions();
  renderCoordinateOptions();
  renderRoomQueue();
  renderCalendar();
  renderMetrics();
  renderLearningHint();
  renderChecks("");
  renderHome();
}

function loadState() {
  const saved = localStorage.getItem("hanako-room-ops");
  if (!saved) {
    return {
      profile: defaultProfile,
      products: starterProducts,
      drafts: [],
      calendar: [],
      metrics: [],
      roomQueue: [],
    };
  }

  try {
    return JSON.parse(saved);
  } catch {
    return {
      profile: defaultProfile,
      products: starterProducts,
      drafts: [],
      calendar: [],
      metrics: [],
      roomQueue: [],
    };
  }
}

function saveState() {
  state.profile = profileText.value;
  state.updatedAt = new Date().toISOString();
  hasMeaningfulLocalData = true;
  localStorage.setItem("hanako-room-ops", JSON.stringify(state));
  renderHome();
  if (!suppressCloudSave) scheduleCloudSave();
}

function bindNavigation() {
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", () => activateView(tab.dataset.view));
  });
  document.querySelectorAll("[data-open-view]").forEach((button) => {
    button.addEventListener("click", () => activateView(button.dataset.openView));
  });
}

function activateView(viewName) {
  const nextView = document.querySelector(`#${viewName}`);
  const nextTab = document.querySelector(`.nav-tab[data-view="${viewName}"]`);
  if (!nextView || !nextTab) return;
  document.querySelectorAll(".nav-tab").forEach((item) => item.classList.remove("active"));
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  nextTab.classList.add("active");
  nextView.classList.add("active");
  document.querySelector("#viewTitle").textContent = views[viewName];
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderHome() {
  const date = new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", weekday: "short" }).format(new Date());
  const productCount = state.products?.length || 0;
  const queueCount = (state.roomQueue || []).filter((item) => !item.done).length;
  const calendarCount = (state.calendar || []).filter((item) => !item.done).length;
  const dateNode = document.querySelector("#homeDate");
  const productNode = document.querySelector("#homeProductCount");
  const queueNode = document.querySelector("#homeRoomQueueCount");
  const calendarNode = document.querySelector("#homeCalendarCount");
  if (dateNode) dateNode.textContent = date;
  if (productNode) productNode.textContent = productCount;
  if (queueNode) queueNode.textContent = queueCount;
  if (calendarNode) calendarNode.textContent = calendarCount;
}

function bindForms() {
  document.querySelector("#productForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.products.unshift({
      id: createId(),
      name: form.get("name").trim(),
      url: form.get("url").trim(),
      image: form.get("image").trim(),
      details: parseProductDetails(form.get("details")),
      category: form.get("category"),
      price: form.get("price").trim(),
      hook: form.get("hook").trim(),
    });
    event.currentTarget.reset();
    saveState();
    renderProducts();
    renderProductOptions();
    renderRoomProductOptions();
    renderCoordinateOptions();
    renderAngleOptions();
    showToast("商品を追加しました");
  });

  document.querySelector("#metricForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.metrics.unshift({
      id: createId(),
      date: form.get("date"),
      platform: form.get("platform").trim() || "未設定",
      post: form.get("post").trim() || "投稿テーマなし",
      pattern: form.get("pattern") || "",
      views: Number(form.get("views") || 0),
      saves: Number(form.get("saves") || 0),
      replies: Number(form.get("replies") || 0),
      clicks: Number(form.get("clicks") || 0),
      sales: Number(form.get("sales") || 0),
    });
    event.currentTarget.reset();
    document.querySelector('input[name="date"]').valueAsDate = new Date();
    saveState();
    renderMetrics();
    renderLearningHint();
    showToast("成果を記録しました");
  });
}

function bindActions() {
  profileText.addEventListener("input", saveState);
  bindInstallButton();
  bindProductImporter();

  document.querySelector("#copyProfile").addEventListener("click", () => copyText(profileText.value));
  document.querySelector("#resetProfile").addEventListener("click", () => {
    profileText.value = defaultProfile;
    saveState();
    showToast("推奨プロフィールに戻しました");
  });

  document.querySelectorAll("#platformTabs button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("#platformTabs button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      activePlatform = button.dataset.platform;
      renderAngleOptions();
      renderLearningHint();
    });
  });
  selectedProduct.addEventListener("change", renderAngleOptions);

  document.querySelector("#optimizationSelect").addEventListener("change", renderLearningHint);

  document.querySelector("#generatePost").addEventListener("click", () => generateEditorialPost(false));
  document.querySelector("#generateVariation").addEventListener("click", () => generateEditorialPost(true));
  document.querySelector("#generateThree").addEventListener("click", generateThreeEditorialPosts);
  postOutput.addEventListener("input", () => renderChecks(postOutput.value));

  document.querySelector("#copyPost").addEventListener("click", () => copyText(postOutput.value));
  document.querySelector("#publishPost").addEventListener("click", publishGeneratedPost);
  document.querySelector("#refreshConnections").addEventListener("click", refreshSocialConnections);
  bindRoomActions();
  bindCoordinateActions();

  document.querySelector("#saveDraft").addEventListener("click", () => {
    if (!postOutput.value.trim()) return showToast("投稿を生成してください");
    state.drafts.unshift({
      id: createId(),
      platform: activePlatform,
      copy: postOutput.value,
      pattern: lastGenerationContext?.viralPattern || "",
      goal: lastGenerationContext?.goal || "",
      createdAt: new Date().toISOString(),
    });
    saveState();
    showToast("下書きを保存しました");
  });

  document.querySelector("#scheduleTomorrow").addEventListener("click", () => {
    if (!postOutput.value.trim()) return showToast("投稿を生成してください");
    const date = new Date();
    date.setDate(date.getDate() + 1);
    state.calendar.unshift({
      id: createId(),
      date: date.toISOString().slice(0, 10),
      platform: activePlatform,
      copy: postOutput.value,
      done: false,
    });
    saveState();
    renderCalendar();
    showToast("明日のカレンダーに追加しました");
  });

  document.querySelector("#clearCalendar").addEventListener("click", () => {
    state.calendar = state.calendar.filter((item) => !item.done);
    saveState();
    renderCalendar();
    showToast("完了済みを整理しました");
  });

  document.querySelector("#exportBtn").addEventListener("click", exportData);
  document.querySelector("#importInput").addEventListener("change", importData);
}

function bindProductImporter() {
  const importUrl = document.querySelector("#productImportUrl");
  const importBtn = document.querySelector("#importProductBtn");
  const searchQuery = document.querySelector("#productSearchQuery");
  const searchBtn = document.querySelector("#searchProductBtn");
  if (!importUrl || !importBtn) return;

  const importProduct = async () => {
    const url = importUrl.value.trim();
    if (!url) {
      showProductImportStatus("楽天ROOM、楽天市場、楽天トラベルのURLを入力してください", true);
      importUrl.focus();
      return;
    }

    if (!cloudSync.configured) {
      showProductImportStatus("クラウド接続が未設定です", true);
      return;
    }

    if (!cloudSync.signedIn) {
      showProductImportStatus("先に画面上部の「同期」からログインしてください", true);
      return;
    }

    const originalLabel = importBtn.textContent;
    importBtn.disabled = true;
    importBtn.textContent = "取得中...";
    showProductImportStatus("楽天の商品・宿泊施設情報を確認しています");

    try {
      const product = await fetchRakutenProduct(url);
      fillProductForm(product, url);
      showProductImportStatus(product.category === "ホテル・旅行"
        ? "宿泊施設情報を入力しました。内容を確認して「追加」を押してください"
        : "商品情報を入力しました。内容を確認して「追加」を押してください");
    } catch (error) {
      showProductImportStatus(error.message || "商品情報を取得できませんでした", true);
    } finally {
      importBtn.disabled = false;
      importBtn.textContent = originalLabel;
    }
  };

  importBtn.addEventListener("click", importProduct);
  importUrl.addEventListener("paste", () => window.setTimeout(importProduct, 0));
  importUrl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      importProduct();
    }
  });

  const searchProducts = async () => {
    const query = searchQuery?.value.trim();
    if (!query) {
      showProductImportStatus("検索したい商品名を入力してください", true);
      searchQuery?.focus();
      return;
    }

    if (!cloudSync.configured) {
      showProductImportStatus("クラウド接続が未設定です", true);
      return;
    }

    if (!cloudSync.signedIn) {
      showProductImportStatus("先に画面上部の「同期」からログインしてください", true);
      return;
    }

    const originalLabel = searchBtn.textContent;
    searchBtn.disabled = true;
    searchBtn.textContent = "検索中...";
    showProductImportStatus("楽天市場から候補を探しています");

    try {
      const results = await fetchRakutenProductSearch(query);
      renderProductSearchResults(results);
      showProductImportStatus(results.length
        ? "候補を表示しました。登録したい商品を選んでください"
        : "候補が見つかりませんでした。キーワードを少し変えてください", !results.length);
    } catch (error) {
      showProductImportStatus(error.message || "商品検索に失敗しました", true);
      renderProductSearchResults([]);
    } finally {
      searchBtn.disabled = false;
      searchBtn.textContent = originalLabel;
    }
  };

  searchBtn?.addEventListener("click", searchProducts);
  searchQuery?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchProducts();
    }
  });
}

async function fetchRakutenProduct(url) {
  const token = await cloudSync.getAccessToken();
  const response = await fetch(`${cloudSync.url}/functions/v1/rakuten-product-import`, {
    method: "POST",
    headers: {
      apikey: cloudSync.key,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "楽天の商品情報を取得できませんでした");
  return body;
}

async function fetchRakutenProductSearch(query) {
  const token = await cloudSync.getAccessToken();
  const response = await fetch(`${cloudSync.url}/functions/v1/rakuten-product-import`, {
    method: "POST",
    headers: {
      apikey: cloudSync.key,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "楽天の商品検索に失敗しました");
  return Array.isArray(body.results) ? body.results : [];
}

function fillProductForm(product, originalUrl) {
  const form = document.querySelector("#productForm");
  form.elements.name.value = product.name || "";
  form.elements.url.value = originalUrl || product.sourceUrl || product.url || "";
  form.elements.image.value = product.image || "";
  form.elements.details.value = JSON.stringify(product.details || {});
  form.elements.price.value = product.price || "";
  form.elements.hook.value = product.hook || "";
  const categoryOption = [...form.elements.category.options].find((option) => option.value === product.category);
  if (categoryOption) form.elements.category.value = product.category;
}

function renderProductSearchResults(results) {
  const container = document.querySelector("#productSearchResults");
  if (!container) return;
  container.innerHTML = "";
  container.hidden = !results.length;
  results.forEach((product) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "product-search-result";
    card.innerHTML = `
      ${product.image ? `<img src="${escapeHtml(product.image)}" alt="">` : `<span class="product-search-placeholder">品</span>`}
      <span>
        <strong>${escapeHtml(product.name || "商品名未取得")}</strong>
        <small>${escapeHtml([product.price, product.shopName || product.details?.brand, product.category].filter(Boolean).join(" / "))}</small>
      </span>
      <em>選ぶ</em>
    `;
    card.addEventListener("click", () => {
      fillProductForm(product, product.sourceUrl || product.url || "");
      container.hidden = true;
      showProductImportStatus("商品情報を入力しました。内容を確認して「追加」を押してください");
      document.querySelector("#productForm").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    container.appendChild(card);
  });
}

function showProductImportStatus(message, isError = false) {
  const status = document.querySelector("#productImportStatus");
  status.textContent = message;
  status.className = `import-status${isError ? " error" : ""}`;
  status.hidden = false;
}

async function refreshSocialConnections() {
  const message = document.querySelector("#connectionMessage");
  if (!cloudSync.signedIn) {
    message.textContent = "先に画面上部の「同期」からログインしてください。";
    return;
  }

  message.textContent = "接続状況を確認しています...";
  try {
    const result = await callSocialApi({ action: "status" });
    updateConnectionCard("X", result.connections?.x);
    updateConnectionCard("Instagram", result.connections?.instagram);
    updateConnectionCard("Threads", result.connections?.threads);
    message.textContent = "Supabase Secretsの設定状況を確認しました。";
  } catch (error) {
    message.textContent = error.message || "接続状況を確認できませんでした。";
  }
}

function updateConnectionCard(platform, connected) {
  const card = document.querySelector(`[data-connection="${platform}"]`);
  const stateLabel = card?.querySelector(".connection-state");
  if (!stateLabel) return;
  stateLabel.textContent = connected ? "接続済み" : "未接続";
  stateLabel.classList.toggle("connected", Boolean(connected));
}

async function publishGeneratedPost() {
  const text = postOutput.value.trim();
  if (!text) return showToast("先に投稿を生成してください");
  if (!cloudSync.signedIn) return showToast("先に同期ログインしてください");

  const product = state.products.find((item) => item.id === selectedProduct.value) || null;
  if (activePlatform === "Instagram" && !product?.image) {
    return showToast("Instagram投稿には商品画像が必要です");
  }

  const approved = window.confirm(`${activePlatform}へこの内容を投稿します。よろしいですか？`);
  if (!approved) return;

  const button = document.querySelector("#publishPost");
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "投稿中...";
  try {
    const result = await callSocialApi({
      action: "publish",
      platform: activePlatform,
      text,
      imageUrl: product?.image || "",
    });
    showToast(`${activePlatform}へ投稿しました`);
    state.metrics.unshift({
      id: createId(),
      date: new Date().toISOString().slice(0, 10),
      platform: activePlatform,
      post: `API投稿 ${result.id || ""}`.trim(),
      pattern: lastGenerationContext?.viralPattern || "",
      views: 0,
      saves: 0,
      replies: 0,
      clicks: 0,
      sales: 0,
    });
    saveState();
    renderMetrics();
  } catch (error) {
    showToast(error.message || "投稿できませんでした");
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

async function callSocialApi(payload) {
  const token = await cloudSync.getAccessToken();
  const response = await fetch(`${cloudSync.url}/functions/v1/social-publish`, {
    method: "POST",
    headers: {
      apikey: cloudSync.key,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "SNS連携でエラーが発生しました");
  return body;
}

function bindInstallButton() {
  const installBtn = document.querySelector("#installBtn");
  const installModal = document.querySelector("#installModal");
  const closeInstallModal = document.querySelector("#closeInstallModal");
  const installBackdrop = document.querySelector("#installBackdrop");
  const shareInstallLink = document.querySelector("#shareInstallLink");
  const safariNote = document.querySelector("#safariNote");
  if (!installBtn) return;

  const userAgent = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

  if (isIos && !isStandalone) {
    installBtn.hidden = false;
  }

  const openIosGuide = () => {
    safariNote.hidden = isSafari;
    installModal.hidden = false;
    document.body.style.overflow = "hidden";
  };

  const closeIosGuide = () => {
    installModal.hidden = true;
    document.body.style.overflow = "";
  };

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installBtn.hidden = false;
  });

  installBtn.addEventListener("click", async () => {
    if (isIos) {
      openIosGuide();
      return;
    }

    if (!deferredInstallPrompt) return;

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.hidden = true;
  });

  closeInstallModal?.addEventListener("click", closeIosGuide);
  installBackdrop?.addEventListener("click", closeIosGuide);

  shareInstallLink?.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url: location.href });
      } catch {
        // 共有シートを閉じた場合は何もしない。
      }
      return;
    }

    await copyText(location.href);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !installModal.hidden) closeIosGuide();
  });
}

function bindCloudSync() {
  const syncBtn = document.querySelector("#syncBtn");
  const syncModal = document.querySelector("#syncModal");
  const syncBackdrop = document.querySelector("#syncBackdrop");
  const closeSyncModal = document.querySelector("#closeSyncModal");
  const loginForm = document.querySelector("#syncLoginForm");
  const createAccountBtn = document.querySelector("#createSyncAccount");
  const syncNowBtn = document.querySelector("#syncNowBtn");
  const logoutBtn = document.querySelector("#syncLogoutBtn");
  if (!syncBtn || !syncModal) return;

  const openModal = () => {
    clearSyncMessage();
    renderCloudAccountUi();
    syncModal.hidden = false;
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    syncModal.hidden = true;
    document.body.style.overflow = "";
  };

  syncBtn.addEventListener("click", openModal);
  syncBackdrop?.addEventListener("click", closeModal);
  closeSyncModal?.addEventListener("click", closeModal);

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(loginForm);
    await runCloudAction(async () => {
      await cloudSync.signIn(String(form.get("email")).trim(), String(form.get("password")));
      await reconcileCloudData();
      loginForm.reset();
      renderCloudAccountUi();
      showSyncMessage("ログインして同期しました");
      showToast("ログインして同期しました");
    });
  });

  createAccountBtn?.addEventListener("click", async () => {
    if (!loginForm.reportValidity()) return;
    const form = new FormData(loginForm);
    await runCloudAction(async () => {
      const result = await cloudSync.signUp(String(form.get("email")).trim(), String(form.get("password")));
      if (result.confirmationRequired) {
        showSyncMessage("登録できました。Supabaseから届く確認メールを開き、その後この画面で「ログインして同期」を押してください。");
        return;
      }
      await cloudSync.save(cloneState());
      renderCloudAccountUi();
      showSyncMessage("同期アカウントを作成しました");
      showToast("同期アカウントを作成しました");
    });
  });

  syncNowBtn?.addEventListener("click", async () => {
    await runCloudAction(async () => {
      await reconcileCloudData();
      showToast("最新データに同期しました");
    });
  });

  logoutBtn?.addEventListener("click", () => {
    cloudSync.signOut();
    setSyncStatus("off");
    renderCloudAccountUi();
    showToast("同期からログアウトしました");
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && cloudSync.signedIn) pullCloudIfNewer();
  });

  window.addEventListener("online", () => {
    if (cloudSync.signedIn) reconcileCloudData().catch(() => setSyncStatus("error"));
  });

  window.setInterval(() => {
    if (cloudSync.signedIn && document.visibilityState === "visible") pullCloudIfNewer();
  }, 30_000);

  if (cloudSync.signedIn) {
    setSyncStatus("busy");
    reconcileCloudData().catch(() => setSyncStatus("error"));
  } else {
    setSyncStatus("off");
  }
}

function renderCloudAccountUi() {
  const setupState = document.querySelector("#syncSetupState");
  const loginForm = document.querySelector("#syncLoginForm");
  const accountState = document.querySelector("#syncAccountState");
  const accountEmail = document.querySelector("#syncAccountEmail");
  const lastSyncText = document.querySelector("#lastSyncText");

  setupState.hidden = cloudSync.configured;
  loginForm.hidden = !cloudSync.configured || cloudSync.signedIn;
  accountState.hidden = !cloudSync.signedIn;
  if (cloudSync.signedIn) accountEmail.textContent = cloudSync.user.email || "同期アカウント";
  lastSyncText.textContent = lastCloudSyncAt
    ? `最終同期: ${lastCloudSyncAt.toLocaleString("ja-JP")}`
    : "まだ同期していません";
}

async function runCloudAction(action) {
  try {
    clearSyncMessage();
    setSyncStatus("busy");
    await action();
    setSyncStatus(cloudSync.signedIn ? "online" : "off");
  } catch (error) {
    setSyncStatus("error");
    showSyncMessage(error.message || "同期に失敗しました", true);
    showToast(error.message || "同期に失敗しました");
  }
}

function showSyncMessage(message, isError = false) {
  const element = document.querySelector("#syncMessage");
  if (!element) return;
  element.textContent = message;
  element.className = `sync-message${isError ? " error" : ""}`;
  element.hidden = false;
}

function clearSyncMessage() {
  const element = document.querySelector("#syncMessage");
  if (!element) return;
  element.hidden = true;
  element.textContent = "";
}

function scheduleCloudSave() {
  if (!cloudSync.signedIn) return;
  window.clearTimeout(cloudSaveTimer);
  setSyncStatus("busy");
  cloudSaveTimer = window.setTimeout(() => {
    saveCloudNow().catch(() => setSyncStatus("error"));
  }, 800);
}

async function saveCloudNow() {
  if (!cloudSync.signedIn) return;
  await cloudSync.save(cloneState());
  lastCloudSyncAt = new Date();
  setSyncStatus("online");
  renderCloudAccountUi();
}

async function reconcileCloudData() {
  const cloudRow = await cloudSync.load();
  if (!cloudRow?.payload) {
    await saveCloudNow();
    return;
  }

  const cloudTime = new Date(cloudRow.payload.updatedAt || cloudRow.updated_at || 0).getTime();
  const localTime = new Date(state.updatedAt || 0).getTime();
  if (!hasMeaningfulLocalData || cloudTime > localTime) {
    applyCloudState(cloudRow.payload);
  } else {
    await saveCloudNow();
  }
  lastCloudSyncAt = new Date();
  setSyncStatus("online");
  renderCloudAccountUi();
}

async function pullCloudIfNewer() {
  try {
    const cloudRow = await cloudSync.load();
    const cloudTime = new Date(cloudRow?.payload?.updatedAt || cloudRow?.updated_at || 0).getTime();
    const localTime = new Date(state.updatedAt || 0).getTime();
    if (cloudRow?.payload && cloudTime > localTime) applyCloudState(cloudRow.payload);
    lastCloudSyncAt = new Date();
    setSyncStatus("online");
  } catch {
    setSyncStatus("error");
  }
}

function applyCloudState(payload) {
  suppressCloudSave = true;
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, payload);
  hasMeaningfulLocalData = true;
  localStorage.setItem("hanako-room-ops", JSON.stringify(state));
  profileText.value = state.profile || defaultProfile;
  renderProducts();
  renderProductOptions();
  renderRoomProductOptions();
  renderCoordinateOptions();
  renderRoomQueue();
  renderAngleOptions();
  renderCalendar();
  renderMetrics();
  renderHome();
  suppressCloudSave = false;
}

function cloneState() {
  return JSON.parse(JSON.stringify(state));
}

function setSyncStatus(status) {
  const dot = document.querySelector("#syncDot");
  const label = document.querySelector("#syncLabel");
  dot.className = `sync-dot ${status === "off" ? "" : status}`.trim();
  label.textContent = status === "online" ? "同期済み" : status === "busy" ? "同期中" : status === "error" ? "要確認" : "同期";
}

function renderProducts() {
  productGrid.innerHTML = "";
  state.products.forEach((product) => {
    const recommendations = buildProductRecommendations(product);
    const cardFacts = product.category === "ホテル・旅行"
      ? [product.details?.location, product.details?.rating ? `評価 ${product.details.rating}` : ""].filter(Boolean).join(" / ")
      : [product.details?.brand, product.details?.color, product.details?.material].filter(Boolean).slice(0, 3).join(" / ");
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      ${product.image ? `<img class="product-image" src="${escapeHtml(product.image)}" alt="" loading="lazy">` : ""}
      <div>
        <h4>${escapeHtml(product.name)}</h4>
        <p class="muted">${escapeHtml(product.hook || "推しポイント未設定")}</p>
        ${cardFacts ? `<p class="muted">${escapeHtml(cardFacts)}</p>` : ""}
      </div>
      <div class="product-meta">
        <span class="tag">${escapeHtml(product.category)}</span>
        <span class="tag">${escapeHtml(product.price || "価格未設定")}</span>
      </div>
      <div class="recommendation-list">
        <p class="eyebrow">おすすめ投稿プラン</p>
        ${recommendations.map((recommendation, index) => `
          <article class="recommendation-item">
            <div class="recommendation-head">
              <strong>${escapeHtml(recommendation.platform)}｜${escapeHtml(recommendation.angle)}</strong>
              <span>${escapeHtml(recommendation.dayLabel)} ${escapeHtml(recommendation.time)}</span>
            </div>
            <p>${escapeHtml(recommendation.reason)}</p>
            <div class="recommendation-actions">
              <button data-use-plan="${product.id}" data-plan-index="${index}">この案で作る</button>
              <button data-schedule-plan="${product.id}" data-plan-index="${index}">予定に追加</button>
            </div>
          </article>
        `).join("")}
      </div>
      <div class="button-row">
        <button data-use="${product.id}">投稿に使う</button>
        ${product.category !== "ホテル・旅行" ? `<button data-room-use="${product.id}">ROOM文を作る</button>` : ""}
        <button data-delete="${product.id}">削除</button>
      </div>
    `;
    productGrid.appendChild(card);
  });

  productGrid.querySelectorAll("[data-use]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedProduct.value = button.dataset.use;
      renderAngleOptions();
      openView("generator");
      showToast("投稿メーカーにセットしました");
    });
  });

  productGrid.querySelectorAll("[data-use-plan]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = state.products.find((item) => item.id === button.dataset.usePlan);
      const recommendation = buildProductRecommendations(product)[Number(button.dataset.planIndex)];
      if (!product || !recommendation) return;
      applyProductRecommendation(product, recommendation);
      openView("generator");
      generateEditorialPost(false);
    });
  });

  productGrid.querySelectorAll("[data-room-use]").forEach((button) => {
    button.addEventListener("click", () => {
      roomProductSelect.value = button.dataset.roomUse;
      renderRoomProductPreview();
      openView("room");
      generateRoomPost();
    });
  });

  productGrid.querySelectorAll("[data-schedule-plan]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = state.products.find((item) => item.id === button.dataset.schedulePlan);
      const recommendation = buildProductRecommendations(product)[Number(button.dataset.planIndex)];
      if (!product || !recommendation) return;
      scheduleProductRecommendation(product, recommendation);
    });
  });

  productGrid.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      state.products = state.products.filter((item) => item.id !== button.dataset.delete);
      saveState();
      renderProducts();
      renderProductOptions();
      renderRoomProductOptions();
      renderCoordinateOptions();
      renderAngleOptions();
    });
  });
}

function buildProductRecommendations(product) {
  if (!product) return [];
  const isTravel = product.category === "ホテル・旅行";
  const text = `${product.name} ${product.hook || ""}`;
  const isSale = /セール|クーポン|割引|半額|ポイント|お買い物マラソン|スーパーSALE/i.test(text);
  const learned = ["Instagram", "Threads", "X"].reduce((map, platform) => {
    map[platform] = getPerformanceInsight(platform, "balanced");
    return map;
  }, {});

  if (isTravel) {
    return [
      recommendation("Instagram", "女子旅ホテル保存版", learned.Instagram, "checklist", "save", 0, "20:30", "日曜夜は次の旅行を考える時間に合わせ、客室・アクセス・料金を保存用に整理します。", { travelPriority: "room" }),
      recommendation("Threads", "次の旅の候補", learned.Threads, "microstory", "reply", 4, "21:00", "週末前に旅の気分が高まる時間帯。宿を選ぶ時の本音から自然な会話を作ります。", { travelPriority: "access" }),
      recommendation("X", isSale ? "セール・クーポン確認" : "予約前チェック", learned.X, isSale ? "ranking" : "comparison", "room", isSale ? 5 : 2, isSale ? "12:10" : "20:00", isSale ? "昼休みに最新料金とクーポンを短く確認できる速報型です。" : "料金・立地・キャンセル条件を短く比較し、予約ページへつなげます。", { travelPriority: isSale ? "cost" : "access" }),
    ];
  }

  const instagramAngle = ["バッグ", "シューズ", "アクセサリー"].includes(product.category) ? "高見え深掘り" : "着回し保存版";
  const xAngle = isSale ? "セール速報" : ["バッグ", "シューズ"].includes(product.category) ? "買う前チェック" : "2商品比較";
  const fashionPriority = /素材|綿|コットン|リネン|ニット|シアー/.test(text) ? "material" : /細見え|華奢|骨格|ウエスト|脚長/.test(text) ? "balance" : "versatility";
  const timing = fashionRecommendationTiming(product.category, isSale);
  return [
    recommendation("Instagram", instagramAngle, learned.Instagram, product.category === "バッグ" ? "checklist" : "beforeafter", "save", timing.Instagram.weekday, timing.Instagram.time, `${product.category}は写真と具体的な着回し・確認項目をまとめると、保存して比較する理由を作りやすいです。`, { fashionPriority, fashionOccasion: timing.Instagram.occasion }),
    recommendation("Threads", "今日の可愛い発掘", learned.Threads, "microstory", "reply", timing.Threads.weekday, timing.Threads.time, timing.Threads.reason, { fashionPriority, fashionOccasion: timing.Threads.occasion }),
    recommendation("X", xAngle, learned.X, isSale ? "ranking" : "comparison", "room", timing.X.weekday, timing.X.time, isSale ? "セール情報を昼休みに短く確認できる形で、価格・在庫の最新確認へつなげます。" : "比較と買う前チェックを短く提示し、ROOMで詳細を見る流れを作ります。", { fashionPriority: isSale ? "cost" : fashionPriority, fashionOccasion: timing.X.occasion }),
  ];
}

function fashionRecommendationTiming(category, isSale) {
  if (isSale) {
    return {
      Instagram: { weekday: 5, time: "20:00", occasion: "weekend" },
      Threads: { weekday: 5, time: "12:15", occasion: "weekend", reason: "セールを確認しやすい昼休みに、気になる理由と確認点を短く共有します。" },
      X: { weekday: 5, time: "12:10", occasion: "weekend" },
    };
  }
  if (["バッグ", "アクセサリー"].includes(category)) {
    return {
      Instagram: { weekday: 5, time: "20:30", occasion: "date" },
      Threads: { weekday: 4, time: "21:00", occasion: "date", reason: "週末前の夜に、いつもの服へ可愛さを足す小物として会話を作ります。" },
      X: { weekday: 5, time: "12:15", occasion: "date" },
    };
  }
  if (["アウター", "シューズ"].includes(category)) {
    return {
      Instagram: { weekday: 0, time: "20:30", occasion: "campus" },
      Threads: { weekday: 2, time: "07:45", occasion: "campus", reason: "朝の服選びと天気を意識する時間に、実用性を含む短い発見として届けます。" },
      X: { weekday: 2, time: "12:15", occasion: "office" },
    };
  }
  return {
    Instagram: { weekday: 0, time: "20:30", occasion: "date" },
    Threads: { weekday: 2, time: "21:00", occasion: "campus", reason: "平日夜に、商品説明ではなく『今日気になった理由』を短く話す共感型です。" },
    X: { weekday: 4, time: "20:00", occasion: "office" },
  };
}

function recommendation(platform, angle, learned, fallbackPattern, goal, weekday, time, reason, settings = {}) {
  const useLearned = learned?.sampleSize >= 2;
  return {
    platform,
    angle,
    pattern: useLearned ? learned.pattern : fallbackPattern,
    goal,
    weekday,
    dayLabel: ["日", "月", "火", "水", "木", "金", "土"][weekday] + "曜",
    time,
    reason: `${reason}${useLearned ? ` 過去実績から「${viralPatternLabels[learned.pattern]}」を優先します。` : ""}`,
    ...settings,
  };
}

function applyProductRecommendation(product, recommendation) {
  selectedProduct.value = product.id;
  document.querySelector(`#platformTabs button[data-platform="${recommendation.platform}"]`)?.click();
  const angleSelect = document.querySelector("#angleSelect");
  if ([...angleSelect.options].some((option) => option.value === recommendation.angle)) angleSelect.value = recommendation.angle;
  document.querySelector("#viralPatternSelect").value = recommendation.pattern;
  document.querySelector("#goalSelect").value = recommendation.goal;
  const optimization = { room: "click", save: "save", reply: "balanced", follow: "reach" }[recommendation.goal] || "balanced";
  document.querySelector("#optimizationSelect").value = optimization;
  if (recommendation.fashionPriority) document.querySelector("#fashionPrioritySelect").value = recommendation.fashionPriority;
  if (recommendation.fashionOccasion) document.querySelector("#fashionOccasionSelect").value = recommendation.fashionOccasion;
  if (recommendation.travelPriority) document.querySelector("#travelPrioritySelect").value = recommendation.travelPriority;
  renderLearningHint();
}

function scheduleProductRecommendation(product, recommendation) {
  const scheduled = nextWeekdayAt(recommendation.weekday, recommendation.time);
  state.calendar.unshift({
    id: createId(),
    date: scheduled.date,
    time: recommendation.time,
    platform: recommendation.platform,
    productId: product.id,
    pattern: recommendation.pattern,
    copy: `${product.name}\n${recommendation.angle}｜${viralPatternLabels[recommendation.pattern]}\n${recommendation.reason}`,
    done: false,
  });
  saveState();
  renderCalendar();
  showToast(`${recommendation.dayLabel} ${recommendation.time}の予定に追加しました`);
}

function nextWeekdayAt(weekday, time) {
  const now = new Date();
  const [hour, minute] = time.split(":").map(Number);
  const target = new Date(now);
  let days = (weekday - now.getDay() + 7) % 7;
  target.setHours(hour, minute, 0, 0);
  if (days === 0 && target <= now) days = 7;
  target.setDate(now.getDate() + days);
  const date = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
  return { date, time };
}

function renderProductOptions() {
  selectedProduct.innerHTML = "";
  state.products.forEach((product) => {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = `${product.name} / ${product.category}`;
    selectedProduct.appendChild(option);
  });
  document.querySelector("#todayFocus").textContent = state.products[0]?.name || "商品を追加";
}

function bindCoordinateActions() {
  if (!coordinateOutput || !coordBoard) return;
  document.querySelector("#coordPhoto")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    coordinatePhotoDataUrl = file ? await readFileAsDataUrl(file) : "";
    showToast(coordinatePhotoDataUrl ? "写真を読み込みました" : "写真を解除しました");
    if (coordinateOutput.value.trim()) drawCoordinateBoard(getSelectedCoordinate(), coordinateOutput.value);
  });
  document.querySelector("#generateCoordinate")?.addEventListener("click", generateCoordinate);
  document.querySelector("#generateOutfitImage")?.addEventListener("click", generateOutfitImage);
  document.querySelector("#copyCoordinateText")?.addEventListener("click", () => copyText(coordinateOutput.value));
  document.querySelector("#downloadCoordinateBoard")?.addEventListener("click", downloadCoordinateBoard);
}

function renderCoordinateOptions() {
  const configs = [
    ["#coordOnepiece", ["ワンピース"]],
    ["#coordTop", ["トップス", "アウター"]],
    ["#coordBottom", ["スカート", "パンツ"]],
    ["#coordBag", ["バッグ"]],
    ["#coordShoes", ["シューズ"]],
    ["#coordAccessory", ["アクセサリー"]],
  ];
  configs.forEach(([selector, categories]) => {
    const select = document.querySelector(selector);
    if (!select) return;
    const previous = select.value;
    select.innerHTML = `<option value="">使わない</option>`;
    state.products
      .filter((product) => categories.includes(product.category))
      .forEach((product) => {
        const option = document.createElement("option");
        option.value = product.id;
        option.textContent = `${product.name} / ${product.price || "価格未設定"}`;
        select.appendChild(option);
      });
    if ([...select.options].some((option) => option.value === previous)) select.value = previous;
  });
}

function getSelectedCoordinate() {
  const byId = (selector) => state.products.find((product) => product.id === document.querySelector(selector)?.value) || null;
  const onepiece = byId("#coordOnepiece");
  const pieces = [
    onepiece,
    onepiece ? null : byId("#coordTop"),
    onepiece ? null : byId("#coordBottom"),
    byId("#coordBag"),
    byId("#coordShoes"),
    byId("#coordAccessory"),
  ].filter(Boolean);
  return {
    style: document.querySelector("#coordStyle")?.value || "大人ガーリー",
    occasion: document.querySelector("#coordOccasion")?.value || "友達とカフェ",
    products: pieces,
  };
}

async function generateCoordinate() {
  const coordinate = getSelectedCoordinate();
  if (!coordinate.products.length) return showToast("コーデに使う商品を選んでください");
  const text = buildCoordinateText(coordinate);
  coordinateOutput.value = text;
  document.querySelector("#coordStatus").textContent = "画像ボード作成済み";
  await drawCoordinateBoard(coordinate, text);
  showToast("コーデ文と画像ボードを作りました");
}

function buildCoordinateText(coordinate) {
  const names = coordinate.products.map((product) => product.name);
  const categories = coordinate.products.map((product) => product.category).join("・");
  const totalHint = coordinate.products.map((product) => product.price).filter(Boolean).slice(0, 3).join(" / ");
  const main = coordinate.products[0];
  const points = coordinate.products.map((product) => `・${product.category}: ${product.hook || createCoordinateHook(product)}`).join("\n");
  return `【PR】${coordinate.style}でまとめる${coordinate.occasion}コーデ\n\n${names.join(" × ")}を合わせた着用イメージです。\n${main?.category || "主役アイテム"}を中心に、甘さは残しつつ大人っぽく見えるように色と小物をそろえました。\n\n${points}\n\n${totalHint ? `価格メモ: ${totalHint}\n` : ""}楽天ROOMに載せているアイテムで組んだコーデ案です。\n実物のサイズ感や色味は商品ページで確認してください。\n\n#楽天ROOM #大人ガーリー #甘めきれいめ #高見えコーデ #${categories.replaceAll("・", " #")}`;
}

function createCoordinateHook(product) {
  const hooks = {
    トップス: "顔まわりを華やかに見せやすい主役アイテム",
    アウター: "羽織るだけで全体の印象を整えやすい",
    ワンピース: "一枚でコーデの雰囲気が決まりやすい",
    スカート: "甘めに寄せつつ大人っぽいラインを作りやすい",
    パンツ: "甘めトップスをすっきり見せやすい",
    バッグ: "淡色コーデに可愛さを足しやすい",
    シューズ: "足元をきれいめにまとめやすい",
    アクセサリー: "さりげなく華やかさを足しやすい",
  };
  return hooks[product.category] || "コーデの雰囲気を整えやすい";
}

async function drawCoordinateBoard(coordinate, text) {
  const canvas = coordBoard;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff8f9";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f8dce4";
  ctx.fillRect(0, 0, canvas.width, 250);
  ctx.fillStyle = "#2f292c";
  ctx.font = "700 56px Yu Gothic UI, Meiryo, sans-serif";
  wrapCanvasText(ctx, `${coordinate.style} ${coordinate.occasion}`, 70, 95, 660, 64, 2);
  ctx.font = "28px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillStyle = "#795c50";
  ctx.fillText("Hanako coordinate board", 72, 206);

  if (coordinatePhotoDataUrl) {
    const image = await loadImage(coordinatePhotoDataUrl).catch(() => null);
    if (image) drawCoverImage(ctx, image, 760, 54, 230, 230, 18);
  } else {
    drawPlaceholder(ctx, "PHOTO", 760, 54, 230, 230);
  }

  const products = coordinate.products.slice(0, 6);
  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 70 + col * 485;
    const y = 330 + row * 285;
    drawProductCard(ctx, product, x, y);
  }

  ctx.fillStyle = "#2f292c";
  ctx.font = "700 30px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText("ROOM caption", 72, 1220);
  ctx.font = "24px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillStyle = "#6c555e";
  wrapCanvasText(ctx, text.replace(/\n+/g, " "), 72, 1260, 930, 34, 2);
  coordinateBoardDataUrl = canvas.toDataURL("image/png");
}

async function drawProductCard(ctx, product, x, y) {
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x, y, 440, 240, 18);
  ctx.fill();
  ctx.strokeStyle = "#eadde1";
  ctx.stroke();
  if (product.image) {
    const image = await loadImage(product.image).catch(() => null);
    if (image) drawCoverImage(ctx, image, x + 18, y + 18, 150, 150, 12);
    else drawPlaceholder(ctx, product.category, x + 18, y + 18, 150, 150);
  } else {
    drawPlaceholder(ctx, product.category, x + 18, y + 18, 150, 150);
  }
  ctx.fillStyle = "#2f292c";
  ctx.font = "700 25px Yu Gothic UI, Meiryo, sans-serif";
  wrapCanvasText(ctx, product.name, x + 188, y + 45, 220, 32, 2);
  ctx.fillStyle = "#a43d64";
  ctx.font = "700 21px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText(product.price || product.category, x + 188, y + 130);
  ctx.fillStyle = "#796e73";
  ctx.font = "20px Yu Gothic UI, Meiryo, sans-serif";
  wrapCanvasText(ctx, product.hook || createCoordinateHook(product), x + 18, y + 196, 390, 28, 1);
}

async function generateOutfitImage() {
  const coordinate = getSelectedCoordinate();
  if (!coordinatePhotoDataUrl) return showToast("先に自分の全身写真を選んでください");
  if (!coordinate.products.length) return showToast("コーデに使う商品を選んでください");
  if (!cloudSync.configured || !cloudSync.signedIn) return showToast("先にクラウド同期へログインしてください");

  const button = document.querySelector("#generateOutfitImage");
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "生成中...";
  document.querySelector("#coordStatus").textContent = "AI生成中";
  try {
    const token = await cloudSync.getAccessToken();
    const response = await fetch(`${cloudSync.url}/functions/v1/outfit-image`, {
      method: "POST",
      headers: {
        apikey: cloudSync.key,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        photo: coordinatePhotoDataUrl,
        prompt: buildOutfitImagePrompt(coordinate),
        productImages: coordinate.products.map((product) => product.image).filter(Boolean).slice(0, 4),
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "着用イメージを生成できませんでした");
    const result = document.querySelector("#coordAiResult");
    result.hidden = false;
    result.innerHTML = `<img src="data:image/png;base64,${body.image}" alt="AI着用イメージ"><a class="primary" download="hanako-outfit-image.png" href="data:image/png;base64,${body.image}">AI画像を保存</a>`;
    document.querySelector("#coordStatus").textContent = "AI画像生成済み";
  } catch (error) {
    showToast(error.message || "AI画像生成に失敗しました");
    document.querySelector("#coordStatus").textContent = "生成エラー";
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

function buildOutfitImagePrompt(coordinate) {
  const items = coordinate.products.map((product) => `${product.category}: ${product.name} ${product.hook || ""}`).join("\n");
  return `Create a tasteful fashion try-on concept image based on the uploaded full-body photo of the same person. Keep the person's identity, face, pose, and body shape respectful and natural. Change only the outfit styling to match these fashion items and mood. This is a styling concept, not an exact product guarantee.\nMood: ${coordinate.style}\nOccasion: ${coordinate.occasion}\nItems:\n${items}\nJapanese adult-girly, clean feminine styling, natural lighting, modest pose, realistic fabric, no exaggerated body changes, no logos added.`;
}

function downloadCoordinateBoard() {
  if (!coordinateBoardDataUrl) return showToast("先に画像ボードを作ってください");
  const link = document.createElement("a");
  link.href = coordinateBoardDataUrl;
  link.download = `hanako-coordinate-${new Date().toISOString().slice(0, 10)}.png`;
  link.click();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", async () => {
      const dataUrl = String(reader.result || "");
      if (!file.type.startsWith("image/")) return resolve(dataUrl);
      try {
        const image = await loadImage(dataUrl);
        const maxSide = 1400;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      } catch {
        resolve(dataUrl);
      }
    });
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawCoverImage(ctx, image, x, y, width, height, radius) {
  ctx.save();
  roundRect(ctx, x, y, width, height, radius);
  ctx.clip();
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  ctx.restore();
}

function drawPlaceholder(ctx, label, x, y, width, height) {
  ctx.fillStyle = "#fff0f4";
  roundRect(ctx, x, y, width, height, 14);
  ctx.fill();
  ctx.fillStyle = "#a43d64";
  ctx.font = "700 22px Yu Gothic UI, Meiryo, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, x + width / 2, y + height / 2 + 8);
  ctx.textAlign = "left";
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const chars = String(text || "").split("");
  let line = "";
  let lines = 0;
  for (const char of chars) {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      line = char;
      lines += 1;
      if (lines >= maxLines) return;
    } else {
      line = test;
    }
  }
  if (line && lines < maxLines) ctx.fillText(line, x, y + lines * lineHeight);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function bindRoomActions() {
  if (!roomProductSelect || !roomPostOutput) return;
  roomProductSelect.addEventListener("change", () => {
    renderRoomProductPreview();
    roomPostOutput.value = "";
    updateRoomCharacterCount();
  });
  roomPostOutput.addEventListener("input", updateRoomCharacterCount);
  document.querySelector("#generateRoomPost").addEventListener("click", generateRoomPost);
  document.querySelector("#copyRoomPost").addEventListener("click", () => copyRoomText(roomPostOutput.value));
  document.querySelector("#copyOpenRoomProduct").addEventListener("click", copyAndOpenRoomProduct);
  document.querySelector("#addRoomQueue").addEventListener("click", addCurrentRoomPostToQueue);
  document.querySelector("#downloadRoomExtension").addEventListener("click", downloadRoomExtension);
}

function renderRoomProductOptions() {
  if (!roomProductSelect) return;
  const previous = roomProductSelect.value;
  roomProductSelect.innerHTML = "";
  state.products.filter((product) => product.category !== "ホテル・旅行").forEach((product) => {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = `${product.name} / ${product.category}`;
    roomProductSelect.appendChild(option);
  });
  if ([...roomProductSelect.options].some((option) => option.value === previous)) roomProductSelect.value = previous;
  renderRoomProductPreview();
}

function renderRoomProductPreview() {
  const target = document.querySelector("#roomProductPreview");
  if (!target) return;
  const product = getSelectedRoomProduct();
  if (!product) {
    target.innerHTML = `<p class="muted">ROOMへ投稿できる商品がありません。商品パイプラインへ登録してください。</p>`;
    return;
  }
  const facts = [product.category, product.price, product.details?.brand, product.details?.material].filter(Boolean);
  target.innerHTML = `
    ${product.image ? `<img src="${escapeHtml(product.image)}" alt="">` : `<div class="room-preview-placeholder">R</div>`}
    <div>
      <strong>${escapeHtml(product.name)}</strong>
      <p>${escapeHtml(product.hook || "推しポイント未設定")}</p>
      <div class="product-meta">${facts.map((fact) => `<span class="tag">${escapeHtml(fact)}</span>`).join("")}</div>
    </div>
  `;
}

function getSelectedRoomProduct() {
  return state.products.find((product) => product.id === roomProductSelect?.value) || state.products.find((product) => product.category !== "ホテル・旅行") || null;
}

function generateRoomPost() {
  const product = getSelectedRoomProduct();
  if (!product) return showToast("先に商品を登録してください");
  if (!window.RoomReviewGenerator?.generateFromInfo) return showToast("ROOM生成エンジンを読み込めませんでした");
  const info = {
    title: product.name,
    description: [product.hook, product.price, product.details?.color, product.details?.material].filter(Boolean).join("。"),
    shopName: product.details?.brand || "",
  };
  roomPostOutput.value = cleanRoomMultilineText(window.RoomReviewGenerator.generateFromInfo(info));
  updateRoomCharacterCount();
  showToast("ROOM投稿文を作りました");
}

function cleanRoomMultilineText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]{2,}/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatRoomClipboard(text) {
  return cleanRoomMultilineText(text)
    .split("\n")
    .map((line) => line.trim() === "" ? "\u200B" : line)
    .join("\r\n");
}

async function copyRoomText(text) {
  if (!String(text || "").trim()) return showToast("先にROOM投稿文を作ってください");
  await copyText(formatRoomClipboard(text));
}

async function copyAndOpenRoomProduct() {
  const product = getSelectedRoomProduct();
  if (!product) return showToast("商品を選んでください");
  if (!roomPostOutput.value.trim()) generateRoomPost();
  if (!roomPostOutput.value.trim()) return;
  const copyPromise = copyRoomText(roomPostOutput.value);
  if (product.url) window.open(product.url, "_blank", "noopener");
  else showToast("コピーしました。商品URLが未登録です");
  await copyPromise;
}

function downloadRoomExtension() {
  const link = document.createElement("a");
  link.href = "room-helper-extension-v1.zip";
  link.download = "hanako-room-helper-extension.zip";
  link.click();
  showToast("PC用ROOMヘルパーをダウンロードします");
}

function addCurrentRoomPostToQueue() {
  const product = getSelectedRoomProduct();
  if (!product) return showToast("商品を選んでください");
  if (!roomPostOutput.value.trim()) generateRoomPost();
  if (!roomPostOutput.value.trim()) return;
  const existing = state.roomQueue.find((item) => item.productId === product.id && !item.done);
  if (existing) {
    existing.text = cleanRoomMultilineText(roomPostOutput.value);
    existing.updatedAt = new Date().toISOString();
  } else {
    state.roomQueue.unshift({
      id: createId(),
      productId: product.id,
      productName: product.name,
      productUrl: product.url || "",
      image: product.image || "",
      text: cleanRoomMultilineText(roomPostOutput.value),
      done: false,
      createdAt: new Date().toISOString(),
    });
  }
  saveState();
  renderRoomQueue();
  showToast(existing ? "投稿待ちを更新しました" : "ROOM投稿待ちに追加しました");
}

function updateRoomCharacterCount() {
  const target = document.querySelector("#roomCharacterCount");
  if (target) target.textContent = `${Array.from(roomPostOutput?.value || "").length}文字`;
}

function renderRoomQueue() {
  if (!roomQueue) return;
  state.roomQueue ||= [];
  const pending = state.roomQueue.filter((item) => !item.done);
  document.querySelector("#roomQueueCount").textContent = `${pending.length}件`;
  if (!state.roomQueue.length) {
    roomQueue.innerHTML = `<p class="muted">投稿待ちはありません。商品を選んでROOM文を作成してください。</p>`;
    return;
  }
  roomQueue.innerHTML = state.roomQueue.map((item) => `
    <article class="room-queue-item ${item.done ? "done" : ""}">
      ${item.image ? `<img src="${escapeHtml(item.image)}" alt="">` : `<div class="room-queue-placeholder">R</div>`}
      <div class="room-queue-copy">
        <div class="room-queue-title"><strong>${escapeHtml(item.productName)}</strong><span>${item.done ? "投稿済み" : "投稿待ち"}</span></div>
        <p>${escapeHtml(trimText(item.text, 150))}</p>
      </div>
      <div class="room-queue-actions">
        <button data-room-copy="${item.id}">コピー</button>
        <button data-room-open="${item.id}">商品を開く</button>
        <button data-room-done="${item.id}">${item.done ? "未投稿へ戻す" : "投稿済みにする"}</button>
        <button data-room-delete="${item.id}" aria-label="削除">×</button>
      </div>
    </article>
  `).join("");
  roomQueue.querySelectorAll("[data-room-copy]").forEach((button) => button.addEventListener("click", () => {
    const item = state.roomQueue.find((entry) => entry.id === button.dataset.roomCopy);
    if (item) copyRoomText(item.text);
  }));
  roomQueue.querySelectorAll("[data-room-open]").forEach((button) => button.addEventListener("click", () => {
    const item = state.roomQueue.find((entry) => entry.id === button.dataset.roomOpen);
    if (item?.productUrl) window.open(item.productUrl, "_blank", "noopener");
    else showToast("商品URLが未登録です");
  }));
  roomQueue.querySelectorAll("[data-room-done]").forEach((button) => button.addEventListener("click", () => {
    const item = state.roomQueue.find((entry) => entry.id === button.dataset.roomDone);
    if (!item) return;
    item.done = !item.done;
    saveState();
    renderRoomQueue();
  }));
  roomQueue.querySelectorAll("[data-room-delete]").forEach((button) => button.addEventListener("click", () => {
    state.roomQueue = state.roomQueue.filter((entry) => entry.id !== button.dataset.roomDelete);
    saveState();
    renderRoomQueue();
  }));
}

function renderAngleOptions() {
  const angleSelect = document.querySelector("#angleSelect");
  angleSelect.innerHTML = "";
  const product = state.products.find((item) => item.id === selectedProduct.value) || state.products[0];
  const isTravel = product?.category === "ホテル・旅行";
  const presets = isTravel ? travelAnglePresets[activePlatform] : anglePresets[activePlatform];
  presets.forEach((angle) => {
    const option = document.createElement("option");
    option.value = angle;
    option.textContent = angle;
    angleSelect.appendChild(option);
  });
  renderTravelSettings(product, isTravel);
}

function parseProductDetails(value) {
  try {
    return JSON.parse(String(value || "{}"));
  } catch {
    return {};
  }
}

function renderTravelSettings(product, isTravel) {
  const settings = document.querySelector("#travelSettings");
  const fashionSettings = document.querySelector("#fashionSettings");
  if (!settings) return;
  settings.hidden = !isTravel;
  if (fashionSettings) fashionSettings.hidden = isTravel;
  if (!isTravel) renderFashionFacts(product);
  if (!isTravel) return;
  const details = product?.details || {};
  const facts = [
    details.location,
    details.rating ? `評価 ${details.rating}${details.reviewCount ? `（${details.reviewCount}件）` : ""}` : "",
    details.checkin ? `チェックイン ${details.checkin}` : "",
    details.checkout ? `チェックアウト ${details.checkout}` : "",
    ...(details.amenities || []).slice(0, 3),
  ].filter(Boolean);
  document.querySelector("#travelFacts").textContent = facts.length
    ? facts.join(" / ")
    : "料金・アクセス・客室条件は予約画面で確認してください。";
}

function renderFashionFacts(product) {
  const target = document.querySelector("#fashionFacts");
  if (!target) return;
  const details = product?.details || {};
  const facts = [
    details.brand,
    details.color,
    details.material,
    details.rating ? `評価 ${details.rating}${details.reviewCount ? `（${details.reviewCount}件）` : ""}` : "",
  ].filter(Boolean);
  target.textContent = facts.length ? facts.join(" / ") : "素材・サイズ・色は商品ページで確認してください。";
}

function generateEditorialPost(isVariation) {
  const product = state.products.find((item) => item.id === selectedProduct.value) || state.products[0];
  if (!product) return showToast("先に商品を登録してください");
  generationVariant = isVariation ? generationVariant + 1 : 0;
  const context = buildEditorialContext(product);
  lastGenerationContext = context;
  lastGenerated = generatePremiumCopy(context);
  postOutput.value = lastGenerated;
  const learnedLabel = context.learnedPattern.sampleSize >= 2 ? "実績から最適化" : "新規テスト";
  document.querySelector("#outputMeta").textContent = `${activePlatform} / ${viralPatternLabels[context.viralPattern]} / ${learnedLabel} / ${context.ownershipVoice.status}`;
  renderChecks(lastGenerated);
  rememberGeneration(lastGenerated);
  showToast(isVariation ? "切り口を変えて別案を作りました" : "媒体に合わせて投稿を作りました");
}

function generateThreeEditorialPosts() {
  const product = state.products.find((item) => item.id === selectedProduct.value) || state.products[0];
  if (!product) return showToast("先に商品を登録してください");
  const versions = [];
  const experimentPatterns = getExperimentPatterns(activePlatform, document.querySelector("#goalSelect").value);
  for (let index = 0; index < 3; index += 1) {
    generationVariant += 1;
    const context = buildEditorialContext(product);
    context.hookType = ["scene", "confession", "question"][index];
    context.viralPattern = experimentPatterns[index];
    versions.push(`━━━━━━━━━━\n案${index + 1}｜${hookTypeLabels[context.hookType]}・${viralPatternLabels[context.viralPattern]}\n━━━━━━━━━━\n${generatePremiumCopy(context)}`);
    lastGenerationContext = context;
  }
  lastGenerated = versions.join("\n\n");
  postOutput.value = lastGenerated;
  document.querySelector("#outputMeta").textContent = `${activePlatform} / 3つの共感アプローチを比較 / 購入状況に合う表現`;
  renderChecks(lastGenerated);
  showToast("共感の入口を変えた3案を作りました");
}

function getExperimentPatterns(platform, goal) {
  const learned = getPerformanceInsight(platform, document.querySelector("#optimizationSelect")?.value || "balanced");
  const byGoal = {
    save: ["checklist", "comparison", "beforeafter"],
    room: ["comparison", "costperwear", "mistake"],
    reply: ["microstory", "commentreply", "unpopular"],
    follow: ["microstory", "beforeafter", "ranking"],
  };
  const candidates = learned.sampleSize >= 2
    ? [learned.pattern, ...(byGoal[goal] || byGoal.save)]
    : byGoal[goal] || byGoal.save;
  return [...new Set(candidates)].concat(["comparison", "checklist", "microstory"]).slice(0, 3);
}

function buildEditorialContext(product) {
  const seasonValue = document.querySelector("#seasonSelect").value;
  const season = seasonValue === "auto" ? currentSeason() : seasonValue;
  const audience = document.querySelector("#audienceSelect").value;
  const goal = document.querySelector("#goalSelect").value;
  const optimization = document.querySelector("#optimizationSelect").value;
  const tone = document.querySelector("#toneSelect").value;
  const brief = document.querySelector("#postBrief").value.trim();
  const emotionValue = document.querySelector("#emotionSelect").value;
  const emotion = emotionValue === "auto" ? inferEmotion(audience, product.category, generationVariant) : emotionValue;
  const hookValue = document.querySelector("#hookSelect").value;
  const hookType = hookValue === "auto" ? pick(["scene", "confession", "question", "contrarian", "specific", "whisper"], generationVariant + product.name.length) : hookValue;
  const ownership = document.querySelector("#ownershipSelect").value;
  const isTravel = product.category === "ホテル・旅行";
  const travelCompanion = document.querySelector("#travelCompanionSelect")?.value || "girls";
  const travelPriority = document.querySelector("#travelPrioritySelect")?.value || "access";
  const fashionOccasion = document.querySelector("#fashionOccasionSelect")?.value || "campus";
  const fashionPriority = document.querySelector("#fashionPrioritySelect")?.value || "versatility";
  const fashionConcern = document.querySelector("#fashionConcernSelect")?.value || "upper";
  const viralValue = document.querySelector("#viralPatternSelect").value;
  const learnedPattern = getPerformanceInsight(activePlatform, optimization);
  const viralPattern = viralValue === "auto"
    ? learnedPattern.sampleSize >= 2
      ? learnedPattern.pattern
      : inferViralPattern(goal, platformSafe(activePlatform), generationVariant)
    : viralValue;
  const seed = hashText(`${product.id}-${activePlatform}-${generationVariant}-${Date.now().toString().slice(0, -4)}`);
  return {
    product,
    products: [product, ...state.products.filter((item) => item.id !== product.id)].slice(0, 4),
    platform: activePlatform,
    angle: document.querySelector("#angleSelect").value,
    audience,
    audienceLabel: audienceLabels[audience],
    goal,
    optimization,
    learnedPattern,
    tone,
    emotion,
    hookType,
    ownership,
    isTravel,
    travelCompanion,
    travelPriority,
    travelCompanionLabel: travelCompanionLabels[travelCompanion],
    travelPriorityLabel: travelPriorityLabels[travelPriority],
    fashionOccasion,
    fashionPriority,
    fashionConcern,
    fashionOccasionLabel: fashionOccasionLabels[fashionOccasion],
    fashionPriorityLabel: fashionPriorityLabels[fashionPriority],
    fashionConcernLabel: fashionConcernLabels[fashionConcern],
    viralPattern,
    brief,
    season,
    seasonLabel: seasonLabels[season],
    seed,
    style: categoryStyles[product.category] || categoryStyles.トップス,
    roomLine: product.url
      ? product.category === "ホテル・旅行"
        ? `楽天トラベルでプランを確認\n${product.url}`
        : `ROOMはこちら\n${product.url}`
      : ["owned", "favorite"].includes(ownership)
        ? "愛用品はプロフィールの楽天ROOMにまとめています"
        : "気になる候補はプロフィールの楽天ROOMにまとめています",
    disclosure: "※アフィリエイトを含みます",
    empathy: empathyLibrary[emotion],
    ownershipVoice: product.category === "ホテル・旅行" ? travelOwnershipVoices[ownership] : ownershipVoices[ownership],
  };
}

const travelOwnershipVoices = {
  considering: {
    status: "予約を検討中",
    truth: "まだ宿泊前なので、公式情報と宿泊者レビューを見ながら候補を整理しています",
    verb: "旅の候補に入れています",
    caution: "宿泊日やプランによって料金・食事・客室条件が変わるため、予約画面で確認したいです",
  },
  ordered: {
    status: "予約済み・宿泊前",
    truth: "予約済みで、今は当日の過ごし方を楽しみに考えています",
    verb: "予約しました",
    caution: "宿泊後に客室、食事、アクセスの実感を正直に追記します",
  },
  tried: {
    status: "現地確認済み",
    truth: "現地で確認できた雰囲気と、予約前に知りたい条件をまとめています",
    verb: "現地で確認しました",
    caution: "実際の宿泊体験ではないため、滞在中のサービスは宿泊者レビューも確認してください",
  },
  owned: {
    status: "宿泊済み",
    truth: "実際に宿泊して感じた良い点と、予約前に知りたかった点をまとめています",
    verb: "実際に宿泊しました",
    caution: "宿泊時点での感想です。最新のプラン内容や館内情報は予約画面で確認してください",
  },
  favorite: {
    status: "再訪したい宿",
    truth: "宿泊したうえで、また訪れたいと感じた理由をまとめています",
    verb: "また泊まりたい宿です",
    caution: "季節や客室、宿泊プランで印象が変わるため、条件を比較して選んでください",
  },
};

const travelCompanionLabels = {
  girls: "女子旅",
  solo: "ひとり旅",
  couple: "カップル・記念日旅行",
  family: "家族旅行",
  oshi: "推し活・ライブ遠征",
};

const travelPriorityLabels = {
  access: "アクセスの良さ",
  room: "客室と眺望",
  food: "食事と朝食",
  spa: "温泉と大浴場",
  cost: "料金とコスパ",
};

const fashionOccasionLabels = {
  campus: "大学・通学",
  office: "通勤・きちんとした日",
  date: "デート・カフェ",
  oshi: "推し活・イベント",
  weekend: "休日・近所のお出かけ",
};

const fashionPriorityLabels = {
  versatility: "着回しやすさ",
  premium: "高見え",
  balance: "体型バランス",
  material: "素材と着心地",
  cost: "価格とコスパ",
};

const fashionConcernLabels = {
  upper: "顔まわりと上半身",
  waist: "腰まわりとウエスト",
  length: "丈と身長バランス",
  comfort: "動きやすさと締め付け",
  weather: "透け・汗・気温対応",
};

const ownershipVoices = {
  considering: {
    status: "購入前の検討候補",
    truth: "まだ購入前なので、商品ページとレビューから気になる点を整理しています",
    verb: "候補に入れています",
    caution: "実際の着用感は購入後に改めて確認したいです",
  },
  ordered: {
    status: "注文済み・到着待ち",
    truth: "注文済みで、今は届くのを待っています",
    verb: "注文しました",
    caution: "届いたら素材感とサイズ感を正直に追記します",
  },
  tried: {
    status: "実物を確認済み",
    truth: "実物を確認した範囲で感じたことをまとめています",
    verb: "実物を見てきました",
    caution: "長時間の着用感はまだ分からないため、見た印象を中心にしています",
  },
  owned: {
    status: "購入して使用中",
    truth: "実際に使って感じた良い点と気になる点をまとめています",
    verb: "購入して使っています",
    caution: "体型や使い方によって感じ方は変わると思います",
  },
  favorite: {
    status: "何度も使う愛用品",
    truth: "何度も使ったうえで、出番が多い理由をまとめています",
    verb: "気づくと何度も手に取っています",
    caution: "私の使い方での感想なので、サイズ表や商品情報も確認してください",
  },
};

const viralPatternLabels = {
  microstory: "小さな実話",
  beforeafter: "変化",
  mistake: "失敗からの学び",
  comparison: "比較",
  ranking: "目的別ランキング",
  checklist: "保存用チェック",
  costperwear: "コスパ",
  unpopular: "やさしい逆張り",
  commentreply: "コメント回答",
};

function platformSafe(platform) {
  return String(platform || "").toLowerCase();
}

function inferViralPattern(goal, platform, variant) {
  const byGoal = {
    save: ["checklist", "comparison", "ranking", "beforeafter", "costperwear"],
    room: ["comparison", "ranking", "mistake", "costperwear", "microstory"],
    reply: ["commentreply", "comparison", "unpopular", "microstory"],
    follow: ["microstory", "unpopular", "beforeafter", "commentreply"],
  };
  const platformPatterns = platform === "threads"
    ? ["commentreply", "microstory", "unpopular"]
    : platform === "instagram"
      ? ["checklist", "beforeafter", "comparison"]
      : ["comparison", "ranking", "unpopular", "costperwear"];
  return pick([...(byGoal[goal] || byGoal.save), ...platformPatterns], variant + goal.length);
}

const hookTypeLabels = {
  scene: "情景から入る",
  confession: "本音から入る",
  question: "問いかけから入る",
  contrarian: "意外な気づきから入る",
  specific: "具体性から入る",
  whisper: "そっと話しかける",
};

const empathyLibrary = {
  morning: {
    feeling: "朝、鏡の前で何度も着替えてしまう",
    reassurance: "迷うのはセンスがないからではなく、今日の自分に似合う着地点を丁寧に探しているから",
    wish: "考えすぎなくても自然に手が伸びる服がほしい",
  },
  overdress: {
    feeling: "可愛くしたいのに、頑張りすぎて見えるのは少し恥ずかしい",
    reassurance: "控えめにしたい気持ちと、ときめきを大切にしたい気持ちは両立していい",
    wish: "きちんとしているのに、自分らしい可愛さが残る服がほしい",
  },
  body: {
    feeling: "好きな服と、自分が安心して着られる服が同じとは限らない",
    reassurance: "体を隠すことより、落ち着いて過ごせるバランスを見つける方が大切",
    wish: "鏡を見るたび直したくならない、安心できるコーデにしたい",
  },
  budget: {
    feeling: "可愛いと思った瞬間と、値段を見た瞬間の間で気持ちが揺れる",
    reassurance: "慎重になるのは我慢ではなく、本当に使うものを選びたいから",
    wish: "買った後までうれしくいられる、出番の多い一着を選びたい",
  },
  weather: {
    feeling: "天気に合わせると可愛さが減り、可愛さを優先すると一日が少し大変になる",
    reassurance: "実用性を考えることも、おしゃれを楽しむための大事な工夫",
    wish: "気温や雨を気にしすぎず、帰宅まで気分よく過ごしたい",
  },
  repeat: {
    feeling: "新しい服はあるのに、気づくといつも同じ組み合わせを選んでいる",
    reassurance: "定番があるのは悪いことではなく、少しの変化で十分新鮮になれる",
    wish: "手持ち服を活かしながら、昨日とは少し違う自分になりたい",
  },
  confidence: {
    feeling: "服が決まらない日は、人に会う前から少しだけ自信がなくなる",
    reassurance: "完璧でなくても、自分が落ち着ける一か所があれば大丈夫",
    wish: "玄関を出る時に、今日はこれでいいと思えるコーデにしたい",
  },
};

const audienceLabels = {
  university: "きれいめ好きの女子大生",
  office: "20代の通勤・オフィス服",
  date: "デート服を探している人",
  budget: "高見え・予算重視の人",
  wave: "骨格ウェーブを意識する人",
};

const seasonLabels = { spring: "春", summer: "夏", autumn: "秋", winter: "冬" };

const categoryStyles = {
  トップス: {
    focus: "顔まわりの印象と上半身のバランス",
    pairings: ["マーメイドスカート", "センタープレスパンツ", "濃色デニム"],
    checks: ["透け感とインナー", "袖のボリューム", "裾をインした時の収まり"],
    shots: ["顔まわりの寄り", "袖や襟のディテール", "ボトムを替えた全身"],
  },
  アウター: {
    focus: "羽織った時の肩・着丈と、前を開けても閉じても整うシルエット",
    pairings: ["淡色ワンピース", "きれいめパンツ", "マーメイドスカート"],
    checks: ["肩幅と袖のゆとり", "前を閉じた時のシルエット", "重さ・裏地・季節対応"],
    shots: ["前開きと前閉じの比較", "横から見た着丈", "袖口と裏地の寄り"],
  },
  ワンピース: {
    focus: "一枚で決まるシルエットと小物で変わる印象",
    pairings: ["小さめの黒バッグ", "短丈カーディガン", "華奢なパンプス"],
    checks: ["着丈", "ウエスト位置", "裏地と透け感"],
    shots: ["正面の全身", "横からのシルエット", "バッグを替えた比較"],
  },
  スカート: {
    focus: "腰まわりの見え方とトップスを替えた着回し力",
    pairings: ["コンパクトなニット", "きれいめブラウス", "ロゴTシャツ"],
    checks: ["ウエスト仕様", "座った時の丈", "生地の落ち感"],
    shots: ["腰まわりの寄り", "歩いた時の揺れ", "トップス3パターン"],
  },
  パンツ: {
    focus: "腰まわり・脚のラインと、座った時にも崩れにくいシルエット",
    pairings: ["甘めブラウス", "コンパクトなニット", "短丈ジャケット"],
    checks: ["股上とウエスト仕様", "太もも・ヒップのゆとり", "丈と靴のバランス"],
    shots: ["正面と横のシルエット", "座った時の腰まわり", "靴を替えた丈比較"],
  },
  バッグ: {
    focus: "収納力とコーデ全体を整える色・形",
    pairings: ["淡色ワンピース", "ジャケットコーデ", "デニムスタイル"],
    checks: ["A4や長財布の収納", "肩掛けできるか", "金具の色"],
    shots: ["手持ちした全身", "中身と収納量", "斜め掛けと肩掛けの比較"],
  },
  シューズ: {
    focus: "足元の抜け感と長時間歩ける実用性",
    pairings: ["ロングスカート", "きれいめパンツ", "ワンピース"],
    checks: ["ヒール高", "足幅", "雨の日に使える素材か"],
    shots: ["足元の寄り", "全身バランス", "歩いているカット"],
  },
  アクセサリー: {
    focus: "顔まわりの華やかさと毎日使える合わせやすさ",
    pairings: ["白ブラウス", "黒のワンピース", "淡色ニット"],
    checks: ["サイズ感", "金属の色", "重さと留め具"],
    shots: ["着用した顔まわり", "手のひらでサイズ比較", "服の色を替えた比較"],
  },
  "ホテル・旅行": {
    focus: "立地・客室・食事と、旅行全体の過ごしやすさ",
    pairings: ["女子旅", "記念日・推し活旅行", "ひとり旅・週末旅行"],
    checks: ["駅や観光地からのアクセス", "客室タイプと食事条件", "キャンセル条件と追加料金"],
    shots: ["客室全体と窓からの景色", "朝食・夕食と館内設備", "駅や観光地からの道順"],
  },
};

function generatePremiumCopy(context) {
  let result;
  if (context.product.category === "ホテル・旅行") result = generateTravelCopy(context);
  else if (context.platform === "Instagram") result = generatePremiumInstagram(context);
  else if (context.platform === "Threads") result = generatePremiumThreads(context);
  else result = generatePremiumX(context);
  if (!context.isTravel) result = enrichFashionCopy(result, context);
  result = applyViralPattern(result, context);
  result = weaveEmpathy(result, context);
  if (context.platform === "Instagram") result += originalContentDirections(context);
  return result;
}

function enrichFashionCopy(text, c) {
  const details = c.product.details || {};
  const facts = [
    details.brand ? `ブランド｜${details.brand}` : "",
    details.color ? `色｜${details.color}` : "",
    details.material ? `素材｜${details.material}` : "",
    details.rating ? `評価｜${details.rating}${details.reviewCount ? `（${details.reviewCount}件）` : ""}` : "",
  ].filter(Boolean);
  const fitNote = fashionConcernNote(c);
  const priorityNote = fashionPriorityNote(c, details);

  if (c.platform === "Instagram") {
    return `${text}\n\n【今回の選び方】\n場面｜${c.fashionOccasionLabel}\n重視｜${c.fashionPriorityLabel}\n確認｜${fitNote}\n${priorityNote}${facts.length ? `\n\n【商品ページで確認できた情報】\n${facts.join("\n")}` : ""}`;
  }
  if (c.platform === "Threads") {
    return `${text}\n\n${c.fashionOccasionLabel}で着るなら、${c.fashionPriorityLabel}を優先。${fitNote}`;
  }
  const line = `${c.fashionOccasionLabel}向け。${c.fashionPriorityLabel}重視で、${trimText(fitNote, 42)}`;
  return `${line}\n\n${text}`.length <= 280 ? `${line}\n\n${text}` : text;
}

function fashionConcernNote(c) {
  const notes = {
    upper: `襟・肩・袖のボリュームが、顔まわりと上半身を重く見せないか確認します。`,
    waist: `ウエスト位置と腰まわりの落ち方を、正面だけでなく横からも確認します。`,
    length: `商品丈だけでなく、モデル身長との差と手持ちの靴での見え方を確認します。`,
    comfort: `座る・歩く・腕を上げる動作で、締め付けやずれがないかを確認します。`,
    weather: `透け感、裏地、汗の目立ち方、羽織りとの相性を確認します。`,
  };
  return notes[c.fashionConcern] || notes.upper;
}

function fashionPriorityNote(c, details) {
  const material = details.material ? `素材表記は「${details.material}」` : "素材表記は商品ページで確認";
  const notes = {
    versatility: `手持ち服で最低3コーデ作れて、違う予定にも使えるかを見ます。`,
    premium: `縫い目、金具、生地の落ち感、裏地まで見て、価格だけで高見えと決めません。`,
    balance: `細見えと断定せず、自分が落ち着ける重心とシルエットかで判断します。`,
    material: `${material}。肌触り、洗濯表示、しわ、毛玉も確認します。`,
    cost: `価格を着用予定回数で割り、安さより本当に手が伸びるかで考えます。`,
  };
  return notes[c.fashionPriority] || notes.versatility;
}

function applyViralPattern(text, c) {
  const block = createViralPatternBlock(c);
  if (!block) return text;

  if (c.platform === "Instagram") {
    if (text.includes("【キャプション】")) {
      return text.replace("【キャプション】", `【キャプション】\n${block}`);
    }
    return `${text}\n\n【反応を生む補足】\n${block}`;
  }

  if (c.platform === "Threads") {
    return `${block}\n\n${text}\n\n${threadsTopicSuggestion(c)}`;
  }

  const combined = `${block}\n\n${text}`;
  return combined.length <= 280 ? combined : text;
}

function createViralPatternBlock(c) {
  if (c.product.category === "ホテル・旅行") return createTravelViralPatternBlock(c);
  const p = c.product;
  const name = shortName(p.name);
  const truth = c.ownershipVoice.truth;
  const alternatives = c.products.filter((item) => item.id !== p.id);
  const comparison = alternatives[0] ? shortName(alternatives[0].name) : c.style.pairings[0];
  const price = productPriceNumber(p.price);
  const perWear = price ? Math.max(1, Math.round(price / 20)) : null;
  const ranked = c.products.slice(0, 3);
  const blocks = {
    microstory: `今日気になったのは、${name}。${c.empathy.feeling}日に思い出せそうな一着です。`,
    beforeafter: `選ぶ前｜「可愛いけれど、${c.fashionOccasionLabel}で本当に使えるかな」\n選んだ後に目指したいこと｜${c.style.pairings[0]}とすぐ組めて、朝の迷いを一つ減らす。`,
    mistake: `${c.ownership === "considering" ? "通販での失敗を減らすため" : "次に同じ失敗をしないため"}、可愛さだけで決めずに確認したいこと。\n・${c.style.checks[0]}\n・${c.style.checks[1]}\n・手持ちで3コーデ作れるか`,
    comparison: `迷ったのは「${name}」と「${comparison}」。\n今回は${c.fashionOccasionLabel}での${c.fashionPriorityLabel}を軸に比較。私は${c.style.focus}まで想像して選びます。`,
    ranking: `目的別に3候補を並べるなら。\n${ranked.map((item, index) => `${index + 1}｜${shortName(item.name)}｜${index === 0 ? c.fashionPriorityLabel : index === 1 ? c.fashionOccasionLabel : "手持ち服との相性"}`).join("\n")}\n順位より、自分が一番大切にしたい軸で選びます。`,
    checklist: `保存用｜買う前の3チェック\n□ ${c.style.checks[0]}\n□ ${c.style.checks[1]}\n□ 手持ちの靴・バッグと3通り合わせられる`,
    costperwear: perWear
      ? `${p.price}でも、20回着るなら1回あたり約${perWear.toLocaleString("ja-JP")}円。安さだけでなく「本当に20回手が伸びるか」で考えます。`
      : `価格を見る前に「20回着る場面が浮かぶか」を確認。通学・きちんとした日・休日の3場面で使えそうなら候補に残します。`,
    unpopular: `少しだけ逆のことを言うと、可愛いだけでは選びません。${c.style.focus}まで想像できるものの方が、結局たくさん使えます。`,
    commentreply: `「${name}、どう合わせる？」と聞かれたら。\nまずは${c.style.pairings[0]}、甘さを抑えたい日は${c.style.pairings[2]}を合わせます。`,
  };
  return blocks[c.viralPattern] ? `${truth}\n${blocks[c.viralPattern]}` : truth;
}

function createTravelViralPatternBlock(c) {
  const name = shortName(c.product.name);
  const truth = c.ownershipVoice.truth;
  const alternatives = c.products.filter((item) => item.id !== c.product.id && item.category === "ホテル・旅行");
  const comparison = alternatives[0] ? shortName(alternatives[0].name) : "駅近の別ホテル";
  const blocks = {
    microstory: `次の休日、少しだけ日常を離れたくて見つけたのが「${name}」でした。`,
    beforeafter: `予約前｜写真の可愛さだけで決めそうになる\n予約後に目指したいこと｜アクセス・客室・食事まで確認して、現地で迷わず楽しむ。`,
    mistake: `ホテル選びで後悔を減らす3確認。\n・${c.style.checks[0]}\n・${c.style.checks[1]}\n・${c.style.checks[2]}`,
    comparison: `迷ったのは「${name}」と「${comparison}」。\n非日常感を優先するなら前者、移動の楽さを優先するなら後者で考えます。`,
    ranking: `女子旅の宿候補を選ぶ基準。\n1｜アクセス\n2｜客室と水まわり\n3｜食事・館内設備\n知名度より、今回の旅で大切にしたい順に比べます。`,
    checklist: `保存用｜予約前の3チェック\n□ ${c.style.checks[0]}\n□ ${c.style.checks[1]}\n□ ${c.style.checks[2]}`,
    costperwear: `宿泊料金だけでなく、朝食・温泉・送迎・観光地への移動費まで含めて比較。合計で考えると、納得できるプランが見つけやすいです。`,
    unpopular: `少しだけ逆のことを言うと、ホテルは最安だけでは選びません。移動時間と現地で過ごせる時間まで含めて、旅全体の満足度で考えます。`,
    commentreply: `「${name}、予約前にどこを見る？」と聞かれたら。\n私はまずアクセス、次に客室タイプ、最後に食事とキャンセル条件を確認します。`,
  };
  return `${truth}\n${blocks[c.viralPattern] || blocks.checklist}`;
}

function productPriceNumber(value) {
  const digits = String(value || "").replace(/[^0-9]/g, "");
  const price = Number(digits);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function threadsTopicSuggestion(c) {
  if (c.product.category === "ホテル・旅行") {
    const travelTopics = {
      girls: "話題候補：女子旅",
      solo: "話題候補：ひとり旅",
      couple: "話題候補：記念日旅行",
      family: "話題候補：家族旅行",
      oshi: "話題候補：ライブ遠征",
    };
    return travelTopics[c.travelCompanion] || "話題候補：ホテルステイ";
  }
  const topics = {
    university: "話題候補：大学生コーデ",
    office: "話題候補：通勤コーデ",
    date: "話題候補：デートコーデ",
    budget: "話題候補：プチプラファッション",
    wave: "話題候補：骨格ウェーブ",
  };
  return topics[c.audience] || "話題候補：大人ガーリー";
}

function originalContentDirections(c) {
  if (c.product.category === "ホテル・旅行") {
    const firstVisual = ["owned", "favorite"].includes(c.ownership)
      ? "自分で撮影した客室または旅先の象徴的な一枚"
      : c.ownership === "tried"
        ? "現地で自分が撮影した外観・周辺写真"
        : "自作したアクセス地図・旅程メモ・3条件比較表";
    return `\n\n【オリジナル素材メモ】\n・1枚目：${firstVisual}\n・比較：客室・食事・アクセスの3点\n・正直メモ：予約前は宿泊日、プラン、キャンセル条件を確認\n・公式画像を使う場合は、転載・加工の可否を必ず確認`;
  }
  const ownedShot = ["owned", "favorite"].includes(c.ownership)
    ? "自分で着た全身写真と、素材感が分かる寄り写真"
    : c.ownership === "tried"
      ? "試着時の全身写真と、許可を確認したディテール写真"
      : "手持ち服3点を並べた『合わせるなら』の自分撮り写真";
  return `\n\n【オリジナル素材メモ】\n・1枚目：${ownedShot}\n・比較：${c.style.pairings[0]}と${c.style.pairings[2]}の2通り\n・正直メモ：${c.ownershipVoice.caution}\n・商品画像を使う場合は、転載・加工の可否を必ず確認`;
}

function generateTravelCopy(c) {
  const p = c.product;
  const details = p.details || {};
  const name = shortName(p.name);
  const price = p.price || "料金は宿泊日・プランで変動";
  const disclosure = c.disclosure;
  const location = details.location || "アクセスは予約画面で確認";
  const rating = details.rating ? `評価 ${details.rating}${details.reviewCount ? `・口コミ${details.reviewCount}件` : ""}` : "口コミは宿泊日の新しい順でも確認";
  const hours = [details.checkin ? `IN ${details.checkin}` : "", details.checkout ? `OUT ${details.checkout}` : ""].filter(Boolean).join(" / ") || "チェックイン・アウト時間を確認";
  const priorityNote = travelPriorityNote(c, details);
  const amenityLine = details.amenities?.length ? details.amenities.slice(0, 4).join("・") : "館内設備とアメニティはプラン詳細で確認";

  if (c.platform === "Instagram") {
    return `【表紙】\n${c.travelCompanionLabel}の宿候補\n${name}\n\n【2枚目｜気になった理由】\n${naturalHook(p.hook)}\n今回は「${c.travelPriorityLabel}」を重視して見ています。\n\n【3枚目｜場所と時間】\n${location}\n${hours}\n送迎、最終チェックイン時刻、観光地までの移動も確認。\n\n【4枚目｜客室と設備】\n${amenityLine}\n写真では分かりにくい水まわり、ベッド幅、眺望は口コミでも比較。\n\n【5枚目｜料金と口コミ】\n${price}\n${rating}\n食事・入湯税・追加料金を含む合計で考えます。\n\n【6枚目｜今回の注目点】\n${priorityNote}\n・${c.style.checks[2]}\n・宿泊日と同じ季節の新しい口コミ\n\n【7枚目】\n旅の候補を比べる時に見返せるよう保存\n\n【キャプション】\n${c.ownershipVoice.truth}。\n\n写真の可愛さだけで決めず、${c.travelCompanionLabel}で心地よく過ごせるかまで考えて選びたい宿です。${briefSentence(c)}\n\n${goalCta(c, "Instagram")}\n${disclosure}\n#楽天トラベル #${c.travelCompanionLabel.replace(/[・]/g, "")} #ホテルステイ #週末旅行\n${c.roomLine}`;
  }

  if (c.platform === "Threads") {
    return `${c.ownershipVoice.truth}。\n\n次の${c.travelCompanionLabel}で気になっている「${name}」。\n${naturalHook(p.hook)}ところに惹かれました。\n\n${location}\n${rating}\n\n今回は${c.travelPriorityLabel}を重視。\n${priorityNote}\n\n皆さんは宿を選ぶ時、立地・客室・食事のどれを先に見ますか？\n\n${disclosure}\n${c.roomLine}`;
  }

  return `${c.travelCompanionLabel}の宿候補｜${name}\n\n${location}\n${price}\n${rating}\n\n${c.travelPriorityLabel}重視で確認\n・${priorityNote}\n・${hours}\n・キャンセル条件\n\n料金・空室は日程で変わるため最新プランを確認。\n${disclosure}\n${c.roomLine}`;
}

function travelPriorityNote(c, details) {
  const notes = {
    access: details.location ? `${details.location}から観光・会場への移動時間を確認` : "最寄り駅、送迎、観光地までの移動時間を確認",
    room: "客室の広さ、ベッド、水まわり、眺望をプラン写真と口コミで確認",
    food: "食事の有無、提供時間、朝食会場、アレルギー対応を確認",
    spa: "大浴場・温泉の利用時間、男女入替、客室からの動線を確認",
    cost: "税・食事・交通費まで含む旅行全体の合計で比較",
  };
  return notes[c.travelPriority] || notes.access;
}

function generatePremiumInstagram(c) {
  if (c.angle === "女子大生あるある") return generateRelatableCarousel(c);
  if (c.angle === "12秒リール") return generateReel(c);
  if (c.angle === "季節の3選カルーセル") return generateThreePickCarousel(c);
  if (c.angle === "着回し保存版") return generateStylingCarousel(c);
  if (c.angle === "失敗しない選び方") return generateBuyingGuide(c);
  if (c.angle === "本音レビュー") return generateHonestReview(c);
  if (c.angle === "1週間コーデ") return generateWeekCarousel(c);
  if (c.angle === "予算別比較") return generateBudgetCarousel(c);
  return generateDeepDiveCarousel(c);
}

function generateHonestReview(c) {
  const p = c.product;
  return `${c.disclosure}

【表紙】
可愛いだけで決めない
${shortName(p.name)}を本音で検討

【2枚目｜最初に惹かれた点】
${naturalHook(p.hook)}ところ。
${c.style.focus}を整えやすそうです。

【3枚目｜良さそうなところ】
・${c.style.pairings[0]}と合わせやすい
・${itemUseCase(p.category, c.audience)}
・${p.price ? `${p.price}の候補として見やすい` : "価格を比べて検討しやすい"}

【4枚目｜少し気になるところ】
・${c.style.checks[0]}
・${c.style.checks[1]}
・写真と実物の色差

【5枚目｜向いていそうな人】
${c.empathy.wish}人。
手持ちの${c.style.pairings[1]}をよく使う人。

【6枚目｜見送ってもよい人】
似た役割の服をすでに持っている人。
サイズ表やレビューに不安が残る人。

【7枚目｜結論】
一目惚れだけで急がず、手持ち3コーデを作れたら候補に。
${goalCta(c, "Instagram")}

【キャプション】
気になるところも含めて、買う前の検討メモをまとめました。
「可愛いから欲しい」と「本当に着るかな」の間で迷う時に、一緒に考えるような投稿になればうれしいです。

${c.disclosure}
${instagramHashtags(c)}
${c.roomLine}`;
}

function generateWeekCarousel(c) {
  const p = c.product;
  const days = [
    ["月", "少しきちんと始めたい日", c.style.pairings[1]],
    ["火", "授業や仕事に集中したい日", c.style.pairings[2]],
    ["水", "気分を立て直したい日", c.style.pairings[0]],
    ["木", "予定が読めない日", "黒小物とシンプルな靴"],
    ["金", "少しだけ華やかにしたい日", "華奢なアクセサリーと小さめバッグ"],
  ];
  return `【表紙】
${shortName(p.name)}を主役に
平日5日コーデ

${days.map(([day, mood, pairing], index) => `【${index + 2}枚目｜${day}曜日】
${mood}
合わせ方: ${pairing}
ポイント: 甘さを一か所に絞って、朝迷いにくく。`).join("\n\n")}

【7枚目】
服を増やす前に、5日分使えるか考える。
${goalCta(c, "Instagram")}

【キャプション】
新しい服を選ぶ時、「特別な日に着たい」だけでなく、普通の平日に何回頼れそうかを考えます。
${shortName(p.name)}なら、${naturalHook(p.hook)}ので曜日ごとに雰囲気を変えやすそうです。

${c.disclosure}
${instagramHashtags(c)}
${c.roomLine}`;
}

function generateBudgetCarousel(c) {
  const items = c.products.slice(0, 3);
  return `【表紙】
予算だけで決めない
楽天ROOM候補3つを比較

${items.map((item, index) => `【${index + 2}枚目｜候補${index + 1}】
${shortName(item.name)}
価格: ${item.price || "商品ページで確認"}
魅力: ${naturalHook(item.hook)}
確認: ${(categoryStyles[item.category] || categoryStyles.トップス).checks[0]}`).join("\n\n")}

【5枚目｜安さ以外の基準】
・手持ち服と3コーデ作れるか
・来月も着たいと思えるか
・お手入れの負担が大きくないか

【6枚目｜私なら】
一番安いものではなく、1回あたりの出番が多そうなものを選びます。

【7枚目】
迷っている間に見返せるように保存

【キャプション】
予算は大切。でも、安かったのに着なかった服がいちばんもったいない気がしています。
価格と一緒に「何回着られそうか」まで見て比べました。

${c.disclosure}
${instagramHashtags(c)}
${c.roomLine}`;
}

function generateThreePickCarousel(c) {
  const items = c.products.slice(0, 3);
  const title = pick([
    `${c.seasonLabel}の甘めきれいめ 失敗しない3選`,
    `大学にもお出かけにも使える ${c.seasonLabel}服3選`,
    `楽天で見つけた 大人可愛い高見え3選`,
  ], c.seed);
  return `${c.disclosure}

【表紙】
${title}
小さく: ${c.audienceLabel}向け

【2枚目｜選定基準】
可愛いだけでなく、手持ち服に3通り以上合わせやすいものを選びました。
見るポイントは「${c.style.focus}」です。

${items.map((item, index) => `【${index + 3}枚目｜${index + 1}位】
${item.name}
${naturalHook(item.hook)}
価格: ${item.price || "商品ページで確認"}
向いている日: ${itemUseCase(item.category, c.audience)}`).join("\n\n")}

【6枚目｜迷った時の選び方】
・華やかさ重視 → ${items[0]?.name || c.product.name}
・着回し重視 → ${items[1]?.name || c.product.name}
・コーデの変化重視 → ${items[2]?.name || c.product.name}

【7枚目｜CTA】
${goalCta(c, "Instagram")}
紹介したものはプロフィールの楽天ROOMへ

【キャプション】
${c.seasonLabel}のお買い物候補を、${c.audienceLabel}目線で3つに絞りました。
今回は「可愛いけれど、頑張りすぎて見えないこと」と「普段の服に合わせやすいこと」を重視しています。${briefSentence(c)}

皆さんなら1・2・3のどれを選びますか？

${c.disclosure}
${instagramHashtags(c)}
${c.roomLine}`;
}

function generateDeepDiveCarousel(c) {
  const p = c.product;
  return `${c.disclosure}

【表紙】
${pick(["楽天で見つけた、ちゃんと高見えする候補", "大人ガーリー派が気になる一着", "可愛いだけで終わらない楽天服"], c.seed)}
${shortName(p.name)}

【2枚目｜ひとことで】
${naturalHook(p.hook)}
${p.price ? `${p.price}で探している方の候補に。` : "価格は商品ページで確認できます。"}

【3枚目｜ここが良い】
・${c.style.focus}
・${c.style.pairings[0]}と合わせやすい
・甘さを残しつつ、きちんと見せやすい

【4枚目｜買う前に見る】
・${c.style.checks[0]}
・${c.style.checks[1]}
・${c.style.checks[2]}

【5枚目｜着るなら】
大学・通勤: ${c.style.pairings[1]}で端正に
休日: ${c.style.pairings[2]}で力を抜く
デート: 小物を華奢にして可愛さを残す

【6枚目｜正直メモ】
オンライン購入なので、サイズ表とレビュー確認は必須。
「手持ちの3コーデに合うか」を考えてから選ぶのがおすすめです。

【7枚目｜CTA】
${goalCta(c, "Instagram")}
商品はプロフィールの楽天ROOMにまとめています

【キャプション】
${shortName(p.name)}を、見た目だけでなく着回しやすさまで考えてチェックしました。
${toneSentence(c, `${naturalHook(p.hook)}ので、${c.audienceLabel}の更新候補に入れやすそうです。`)}${briefSentence(c)}

買う前に確認したい点も載せたので、あとで見返せるように保存していただけたらうれしいです。

${c.disclosure}
${instagramHashtags(c)}
${c.roomLine}`;
}

function generateReel(c) {
  const p = c.product;
  return `${c.disclosure}

【12秒リール設計】
0.0–1.5秒｜完成コーデを先に見せる
テロップ: ${pick(["楽天で見つけた大人可愛い服", "この高見え候補、見てほしい", `${c.seasonLabel}コーデを1点で更新`], c.seed)}

1.5–4.0秒｜${c.style.shots[0]}
テロップ: ${shortName(p.name)}

4.0–6.5秒｜${c.style.shots[1]}
テロップ: ${trimText(naturalHook(p.hook), 28)}

6.5–9.5秒｜${c.style.shots[2]}
テロップ: ${c.style.pairings[0]}なら上品 / ${c.style.pairings[2]}なら休日向け

9.5–12.0秒｜完成コーデ + ROOM画面
テロップ: ${trimText(goalCta(c, "Instagram"), 24)}

【撮影メモ】
・最初の1秒は静止せず、服かカメラを動かす
・全身 → 寄り → 全身の順で変化を作る
・商品名は長いので画面では短く表示

【キャプション】
今日の可愛い研究は、${shortName(p.name)}。
${naturalHook(p.hook)}ところに惹かれました。${briefSentence(c)}

合わせるなら、きれいめの日は${c.style.pairings[0]}、少し力を抜くなら${c.style.pairings[2]}が良さそう。
気になる方は保存して、プロフィールの楽天ROOMから見てみてください。

${c.disclosure}
${instagramHashtags(c)}
${c.roomLine}`;
}

function generateStylingCarousel(c) {
  const p = c.product;
  return `${c.disclosure}

【表紙】
${shortName(p.name)}
予定別・着回し4パターン

【2枚目｜授業・通学】
${c.style.pairings[2]} + 大きめバッグ
座って過ごす時間と荷物量まで考えた、頑張りすぎない組み合わせ。

【3枚目｜きちんとした日】
${c.style.pairings[1]} + 直線的な小物
先生や先輩に会う日にも使いやすい、甘さ控えめのまとめ方。

【4枚目｜友達とカフェ】
${c.style.pairings[0]} + 淡色小物
写真に残った時もやわらかく見える大人ガーリー。

【5枚目｜デート】
華奢なアクセサリー + 小さめバッグ
可愛さは足しすぎず、ひとつのディテールを主役に。

【6枚目｜買う前チェック】
${c.style.checks.map((item) => `・${item}`).join("\n")}

【7枚目】
${goalCta(c, "Instagram")}
商品はプロフィールの楽天ROOMへ

【キャプション】
一目惚れした服ほど、「どこへ着ていくか」を4つ考えてから選ぶようにしています。
${shortName(p.name)}は、${naturalHook(p.hook)}ので予定に合わせて雰囲気を変えやすそうです。${briefSentence(c)}

${c.disclosure}
${instagramHashtags(c)}
${c.roomLine}`;
}

function generateBuyingGuide(c) {
  return `【表紙】
楽天服で失敗を減らす
${c.product.category}の確認ポイント5つ

【2枚目】サイズ表は「いつものM」だけで決めない
手持ちの似た服を平置きで測り、数字で比べます。

【3枚目】商品写真よりレビュー写真を見る
色、厚み、シルエットの現実に近い情報を確認。

【4枚目】${c.style.checks[0]}を確認
可愛さだけでなく、実際に一日使う場面を想像します。

【5枚目】手持ち服との3コーデを作る
候補: ${c.style.pairings.join(" / ")}

【6枚目】今回の候補
${c.product.name}
${naturalHook(c.product.hook)}

【7枚目】
${goalCta(c, "Instagram")}

【キャプション】
通販で服を選ぶ時に、私が必ず見るポイントをまとめました。
可愛い気持ちは大事にしつつ、届いてから困らないように一呼吸置くためのチェックリストです。${briefSentence(c)}

#楽天購入品候補 #通販コーデ #大人ガーリー #甘めきれいめ #ファッション研究`;
}

function generateRelatableCarousel(c) {
  const situations = relatableSituations(c.season, c.seed);
  return `【表紙】
礼儀正しくいたい女子大生の
${c.seasonLabel}ファッションあるある

${situations.map((text, index) => `【${index + 2}枚目】\n${text}`).join("\n\n")}

【7枚目】
ひとつでも共感したら保存
皆さんの「あるある」もコメントで教えてください

【キャプション】
きちんと見せたい。でも、自分の可愛いも忘れたくない。
毎朝その間で少しだけ悩んでいる人へ。${briefSentence(c)}

同じ気持ちの方がいたら、そっと教えていただけたらうれしいです。

#女子大生コーデ #ファッションあるある #通学コーデ #大人ガーリー #甘めきれいめ`;
}

function generatePremiumThreads(c) {
  const p = c.product;
  if (c.angle === "小さな失敗談") {
    return `この前、可愛いだけで選んだ服が、手持ちのバッグにも靴にも合わなくて少し反省しました。

それからは、買う前に最低3コーデ考えるようにしています。
${shortName(p.name)}なら、${c.style.pairings[0]}と${c.style.pairings[2]}までは浮かぶ。

完璧な買い物は難しいけれど、失敗を少しずつ減らせたら十分ですよね。`;
  }
  if (c.angle === "朝の支度") {
    return `朝、服が決まらない時って、服が足りないというより「今日どう見られたいか」が決まっていない時なのかもしれません。

今日は、きちんと見せたいけれど少し可愛くいたい日。
そんな日に${shortName(p.name)}と${c.style.pairings[1]}を合わせたいです。

皆さんは、朝のコーデを何から決めますか？`;
  }
  if (c.angle === "二択で相談") {
    return `${shortName(p.name)}に合わせるなら、どちらが好きですか？

A｜${c.style.pairings[0]}で大人ガーリー
B｜${c.style.pairings[2]}で少し力を抜く

私は今日は${pick(["A", "B"], c.seed)}寄り。でも予定によって迷います。
よかったらAかBで教えてください。`;
  }
  if (c.angle === "本音レビュー") {
    return `正直に言うと、${shortName(p.name)}は可愛いだけで即決せず、${c.style.checks[0]}を確認してから選びたいです。

惹かれたのは、${naturalHook(p.hook)}ところ。
少し気になるのは、写真だけではサイズ感が分かりにくいこと。

「欲しい」と「ちゃんと着る」の間で、一緒に考えられる投稿を増やしたいです。

${c.disclosure}
${c.roomLine}`;
  }
  if (c.angle === "女子大生あるある" || c.angle === "ファッション小話") {
    return relatableSituations(c.season, c.seed).map((text, index) => `${index + 1}. ${toneSentence(c, text)}`).join("\n\n");
  }
  if (c.angle === "1日5本セット") {
    return `【朝 8:10｜気分】
${pick(["朝、服が決まると一日の機嫌が少し整う。", "大学へ行くだけの日ほど、頑張りすぎない可愛さが難しい。", `${c.seasonLabel}の朝は、気温より服の正解が読めない。`], c.seed)}

【昼 12:20｜発見】
今日気になったのは${shortName(p.name)}。
${naturalHook(p.hook)}ところが、普段使いしやすそうです。

【夕方 17:30｜役立ち】
${p.category}を通販で見る時は、${c.style.checks[0]}と${c.style.checks[1]}を先に確認しています。
可愛い気持ちで押し切る前の、小さな冷静タイム。

【夜 20:30｜会話】
${c.style.pairings[0]}と${c.style.pairings[2]}、合わせるならどちらが好きですか？
私は今日は${pick(c.style.pairings, c.seed + 2)}の気分です。

【ROOM 22:00｜導線】
今日見つけた大人可愛い候補を楽天ROOMにまとめました。
${c.disclosure}
${c.roomLine}`;
  }
  if (c.angle === "骨格ウェーブ目線") {
    return `【Threads短文 4本】

1. ${shortName(p.name)}、骨格ウェーブを意識するなら「上半身の重心」と「ウエスト位置」を見て選びたいです。

2. ${naturalHook(p.hook)}ところは魅力。ただ、体型の見え方には個人差があるので、サイズ表と着用写真はしっかり確認。

3. 合わせるなら${c.style.pairings[0]}。甘さを足すより、全体の重心を整える感覚がよさそうです。

4. ${c.disclosure}\n${c.roomLine}`;
  }
  if (c.angle === "ROOM更新メモ") {
    return `ROOM更新しました。

今日の主役は${shortName(p.name)}。
選んだ理由は、${naturalHook(p.hook)}から。

一緒に見たい候補
・${c.products[1]?.name || c.style.pairings[0]}
・${c.products[2]?.name || c.style.pairings[1]}

ただ可愛いだけでなく、${c.style.checks[0]}も確認してから選びたいです。

${c.disclosure}
${c.roomLine}`;
  }
  return `今日の可愛い発掘は、${shortName(p.name)}。

${naturalHook(p.hook)}ところに目が止まりました。
合わせるなら${c.style.pairings[0]}で上品に、${c.style.pairings[2]}で少し力を抜きたいです。${briefSentence(c)}

${goalCta(c, "Threads")}
${c.disclosure}
${c.roomLine}`;
}

function generatePremiumX(c) {
  const p = c.product;
  if (c.angle === "女子大生あるある") {
    return `${pick(relatableSituations(c.season, c.seed), c.seed)}\n\n同じ人いますか？\n\n#女子大生コーデ #ファッションあるある`;
  }
  if (c.angle === "2商品比較") {
    const second = c.products[1] || p;
    return `楽天ROOM候補を比較。

A｜${shortName(p.name)}
${naturalHook(p.hook)}。${p.price || "価格は商品ページで確認"}。

B｜${shortName(second.name)}
${naturalHook(second.hook)}。${second.price || "価格は商品ページで確認"}。

華やかさならA、着回しならB。私は${pick(["A", "B"], c.seed)}が気になります。

${c.disclosure}
${c.roomLine}`;
  }
  if (c.angle === "ランキング") {
    return `今週の大人ガーリー候補3選

1. ${shortName(c.products[0]?.name)}
2. ${shortName(c.products[1]?.name || p.name)}
3. ${shortName(c.products[2]?.name || p.name)}

基準は「普段着に混ぜやすい」「${c.style.checks[0]}を確認しやすい」「甘すぎない」。

詳細は楽天ROOMへ。
${c.disclosure}
${c.roomLine}`;
  }
  if (c.angle === "セール速報") {
    return `セールで見るなら、${shortName(p.name)}。

・${naturalHook(p.hook)}
・${p.price || "価格は商品ページで確認"}
・買う前に${c.style.checks[0]}を確認

価格と在庫は変わるので、気になる方は商品ページで最新情報を見てください。

${c.disclosure}
${c.roomLine}`;
  }
  if (c.angle === "買う前チェック") {
    return `${shortName(p.name)}を買う前の3確認。

1. ${c.style.checks[0]}
2. ${c.style.checks[1]}
3. 手持ち服と3コーデ作れるか

可愛い気持ちを大切にしつつ、届いた後も喜べる選び方をしたい。

${c.disclosure}
${c.roomLine}`;
  }
  if (c.angle === "予算別3選") {
    return `予算と着回しで選ぶROOM候補。

${c.products.slice(0, 3).map((item, index) => `${index + 1}. ${shortName(item.name)}｜${item.price || "価格確認"}`).join("\n")}

安さより「何回使えそうか」で比べたいです。

${c.disclosure}
${c.roomLine}`;
  }
  if (c.angle === "二択で相談") {
    return `${shortName(p.name)}、合わせるならどちら？

A ${c.style.pairings[0]}で甘めに
B ${c.style.pairings[2]}で力を抜く

私は${pick(["A", "B"], c.seed)}が気になる。皆さんは？

${c.disclosure}`;
  }
  return `${shortName(p.name)}の着回し案。

通学｜${c.style.pairings[2]}
きちんとした日｜${c.style.pairings[1]}
休日｜${c.style.pairings[0]}

買う前に3コーデ作れたら、出番は多そうです。${briefSentence(c)}

${c.disclosure}
${c.roomLine}`;
}

function weaveEmpathy(text, c) {
  const lead = createEmpathyLead(c);
  const bridge = createEmpathyBridge(c);
  if (c.platform === "Instagram") {
    if (text.includes("【キャプション】")) {
      return text.replace("【キャプション】", `【キャプション】\n${lead}\n\n${bridge}`);
    }
    return `${text}\n\n【投稿文の冒頭候補】\n${lead}\n${bridge}`;
  }
  if (c.platform === "Threads") {
    if (/^【/.test(text)) return text;
    return `${lead}\n\n${bridge}\n\n${text}`;
  }
  const combined = `${lead}\n\n${text}`;
  return combined.length <= 280 ? combined : text;
}

function createEmpathyLead(c) {
  if (c.isTravel) return createTravelEmpathyLead(c);
  return createFashionEmpathyLead(c);
}

function createFashionEmpathyLead(c) {
  const feeling = c.empathy.feeling;
  const occasionThoughts = {
    campus: "大学へ行くだけの日ほど、頑張りすぎずちゃんと可愛い服が難しいです。",
    office: "きちんと見せたい日ほど、自分らしい可愛さをどこまで残すか迷います。",
    date: "可愛くしたい日ほど、服が気になって落ち着かないのは避けたいです。",
    oshi: "写真には可愛く残したい。でも長時間でも疲れない服でいたいです。",
    weekend: "近所のお出かけでも、少しだけ気分が上がる服を選びたいです。",
  };
  const hooks = {
    scene: [
      occasionThoughts[c.fashionOccasion],
      `${c.fashionOccasionLabel}の予定まであと少しなのに、まだ鏡の前で迷っている朝。`,
      `${c.seasonLabel}の朝、可愛さと過ごしやすさの間で手が止まります。`,
    ],
    confession: [
      `正直、${feeling}ことがあります。`,
      `可愛い服は好き。でも、選ぶ時はいつも少し慎重になります。`,
      `私も「これで大丈夫かな」と鏡を何度も見てしまう側です。`,
    ],
    question: [
      `「ちゃんと可愛い」のちょうどいいところ、難しくないですか？`,
      `好きな服なのに、着て出かける直前に不安になることはありませんか？`,
      `買う時は可愛かったのに、合わせ方で迷った経験はありませんか？`,
    ],
    contrarian: [
      `服が足りないのではなく、安心して頼れる組み合わせが足りないのかもしれません。`,
      `高見えするかどうかは、値段より「無理なく着られるか」で決まる気がします。`,
      `可愛く見せたい日ほど、足し算より一つ引く方がうまくいくことがあります。`,
    ],
    specific: [
      `${c.fashionOccasionLabel}を含む3コーデが浮かぶか、買う前に確認します。`,
      `朝の着替えを1回減らしたくて、合わせ方を先に3つ考えます。`,
      `${c.fashionConcernLabel}を見ると、通販でも少し落ち着いて選べます。`,
    ],
    whisper: [
      `同じように迷う方へ、そっと共有したい候補です。`,
      `今日は、無理に背伸びしなくても可愛くいられそうなものを。`,
      `頑張る日の服ではなく、自然に頼れる服を探している方へ。`,
    ],
  };
  return pickFresh(hooks[c.hookType], c.seed + generationVariant);
}

function createTravelEmpathyLead(c) {
  const priority = c.travelPriorityLabel;
  const hooks = {
    scene: [
      `旅行の日程は決まったのに、ホテルだけがまだ決まらない夜。`,
      `写真を見ているだけで、もう少し旅が始まったような気持ちになります。`,
      `帰りの電車を気にせず、旅先でゆっくり過ごしたい日に。`,
    ],
    confession: [
      `正直、ホテルは写真の可愛さだけで選びそうになります。`,
      `宿選びでは、口コミを読みすぎて余計に迷うことがあります。`,
      `せっかくの${c.travelCompanionLabel}だから、失敗したくない気持ちがあります。`,
    ],
    question: [
      `ホテル選び、立地と客室ならどちらを優先しますか？`,
      `宿泊料金だけで決めて、現地の移動で疲れた経験はありませんか？`,
      `${c.travelCompanionLabel}の宿選びで、一番大切にしていることは何ですか？`,
    ],
    contrarian: [
      `最安の宿より、旅先で自由に使える時間が増える宿を選びたいです。`,
      `豪華さより、今回の旅にちょうどいいことの方が大切かもしれません。`,
      `口コミ点数だけでは、私たちの旅に合うかまでは分かりません。`,
    ],
    specific: [
      `予約前に3つだけ、アクセス・客室・キャンセル条件を確認します。`,
      `${priority}を最初に見ると、宿の候補をかなり絞りやすくなります。`,
      `宿泊料金に朝食と移動費を足すと、本当のコスパが見えやすくなります。`,
    ],
    whisper: [
      `同じように旅の宿で迷っている方へ、そっと共有したい候補です。`,
      `忙しい毎日から少し離れたい時に、思い出してほしい宿です。`,
      `次の休日を楽しみに変えてくれそうな場所を見つけました。`,
    ],
  };
  return pickFresh(hooks[c.hookType], c.seed + generationVariant);
}

function pickFresh(candidates, seed) {
  const recentOpenings = (state.generatorHistory || []).map((item) => item.opening);
  const fresh = candidates.filter((candidate) => !recentOpenings.some((opening) => opening.includes(candidate.slice(0, 24))));
  return pick(fresh.length ? fresh : candidates, seed);
}

function createEmpathyBridge(c) {
  if (c.isTravel) {
    return `今回は${c.travelCompanionLabel}を想定して、${c.travelPriorityLabel}を中心に、予約前に知りたいことを整理しました。`;
  }
  return `今回は${c.fashionOccasionLabel}を想定して、${c.fashionPriorityLabel}と${c.fashionConcernLabel}を中心に見ました。`;
}

function inferEmotion(audience, category, variant) {
  const candidates = {
    university: ["morning", "overdress", "budget", "weather"],
    office: ["morning", "overdress", "repeat", "confidence"],
    date: ["confidence", "body", "overdress"],
    budget: ["budget", "repeat", "morning"],
    wave: ["body", "confidence", "overdress"],
  }[audience] || ["morning"];
  if (category === "シューズ") candidates.push("weather");
  if (category === "バッグ") candidates.push("repeat");
  return candidates[Math.abs(variant) % candidates.length];
}

function rememberGeneration(text) {
  state.generatorHistory ||= [];
  state.generatorHistory.unshift({
    at: new Date().toISOString(),
    platform: activePlatform,
    opening: text.split("\n").find(Boolean)?.slice(0, 80) || "",
  });
  state.generatorHistory = state.generatorHistory.slice(0, 30);
  localStorage.setItem("hanako-room-ops", JSON.stringify(state));
}

function currentSeason() {
  const month = new Date().getMonth() + 1;
  if ([3, 4, 5].includes(month)) return "spring";
  if ([6, 7, 8].includes(month)) return "summer";
  if ([9, 10, 11].includes(month)) return "autumn";
  return "winter";
}

function relatableSituations(season, seed) {
  const common = [
    "友達に会うだけの日ほど、頑張りすぎずちゃんと可愛い服がいちばん難しいです。",
    "可愛いバッグを選んだ日に限って、授業の資料が多いです。",
    "朝は完璧だと思ったコーデも、大学に着く頃には少しだけ不安になります。",
    "シンプルにしようと思ったのに、最後にリボンか華奢なアクセサリーを足したくなります。",
    "先生や先輩に会う日は、いつもの可愛いに少しだけきちんと感を足します。",
  ];
  const seasonal = {
    spring: "春は朝晩の寒暖差のせいで、可愛いより羽織れるかが最終判断になりがちです。",
    summer: "夏は可愛さと涼しさと汗対策を同時に満たす服を探しています。",
    autumn: "秋服が一番可愛いと思うのに、着られる期間はいつも想像より短いです。",
    winter: "冬はコートで全部隠れるのに、コートの中までちゃんと考えてしまいます。",
  };
  return shuffle([...common, seasonal[season]], seed).slice(0, 5);
}

function itemUseCase(category, audience) {
  const map = {
    university: "授業から友達とのカフェまで",
    office: "通勤から仕事後の予定まで",
    date: "昼のカフェから夜の食事まで",
    budget: "少ない買い足しで印象を変えたい日",
    wave: "重心とシルエットを意識したい日",
  };
  return `${map[audience]}使いやすい${category}`;
}

function naturalHook(hook) {
  return String(hook || "手持ち服に合わせやすそう")
    .replace(/[。．]+$/, "")
    .replace(/ところ$/, "")
    .trim();
}

function toneSentence(c, sentence) {
  if (c.tone === "natural") return sentence.replace(/です。/g, "かも。").replace(/ます。/g, "そう。");
  if (c.tone === "expert") return `研究メモとして見ると、${sentence}`;
  return sentence;
}

function briefSentence(c) {
  return c.brief ? `\n今回は「${c.brief.replace(/[。．]+$/, "")}」も意識しています。` : "";
}

function goalCta(c, platform) {
  if (c.product.category === "ホテル・旅行") {
    const optimizedTravel = {
      reach: "旅の候補を探している方へ、そっと共有してもらえたらうれしいです。",
      save: "宿泊日が決まった時に比較できるよう、保存しておいてください。",
      click: "空室・最新料金・宿泊プランは楽天トラベルのリンクから確認できます。",
      sale: "日程、人数、食事条件を入れて、楽天トラベルで合計料金を確認してください。",
    };
    if (c.optimization !== "balanced") return optimizedTravel[c.optimization];
    const travelMap = {
      save: "次の旅行で比較できるように保存しておいてください。",
      room: "宿泊プランと最新料金は楽天トラベルのリンクから確認できます。",
      reply: "宿選びでは、立地・客室・食事のどれを一番大切にしますか？",
      follow: "女子旅や週末旅行の候補を研究しているので、また見に来てください。",
    };
    return travelMap[c.goal];
  }
  const optimized = {
    reach: platform === "Threads" ? "同じことで迷った方の考えも、丁寧に聞いてみたいです。" : "似た場面で迷う方へ、そっと共有してもらえたらうれしいです。",
    save: platform === "Threads" ? "次の買い物で迷った時に、見返せるよう保存しておいてください。" : "買う前の比較に使えるよう、保存しておいてください。",
    click: "サイズ・価格・在庫は、プロフィールの楽天ROOMから確認できます。",
    sale: "買う前にサイズ表とレビューも確認できるよう、楽天ROOMに商品ページをまとめています。",
  };
  if (c.optimization !== "balanced") return optimized[c.optimization];
  const map = {
    save: platform === "Threads" ? "あとで見返したい方は、この投稿を保存しておいてください。" : "買い物前に見返せるように保存がおすすめです。",
    room: "商品はプロフィールの楽天ROOMにまとめています。",
    reply: "皆さんなら、どんなふうに合わせますか？",
    follow: "大人可愛い候補を毎日研究しているので、また見に来てください。",
  };
  return map[c.goal];
}

function instagramHashtags(c) {
  if (c.product.category === "ホテル・旅行") return "#楽天トラベル #女子旅 #ホテルステイ #週末旅行 #旅行計画";
  const audienceTag = { university: "#大学生コーデ", office: "#通勤コーデ", date: "#デートコーデ", budget: "#高見えコーデ", wave: "#骨格ウェーブコーデ" }[c.audience];
  return `${audienceTag} #大人ガーリー #甘めきれいめ #楽天ROOM #${c.product.category}`;
}

function shortName(value) {
  return trimText(String(value || "商品候補").replace(/【[^】]*】/g, "").trim(), 34);
}

function trimText(value, max) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function pick(values, seed) {
  return values[Math.abs(seed) % values.length];
}

function shuffle(values, seed) {
  return [...values].sort((a, b) => hashText(`${a}-${seed}`) - hashText(`${b}-${seed}`));
}

function hashText(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) | 0;
  return Math.abs(hash);
}

function generateCopy(product, platform, angle) {
  const roomLine = product.url ? `\n\nROOMはこちら\n${product.url}` : "\n\n愛用品はプロフィールのROOMから見られます";
  const disclosure = "※アフィリエイトを含みます";
  const hashtags = "#大人ガーリー #甘めきれいめ #楽天ROOM #高見えコーデ";

  if (platform === "Threads") {
    return generateThreadsCopy(product, angle, disclosure, roomLine);
  }

  if (platform === "X") {
    return generateXCopy(product, angle, disclosure, hashtags, roomLine);
  }

  return generateInstagramCopy(product, angle, disclosure, hashtags, roomLine);
}

function generateThreadsCopy(product, angle, disclosure, roomLine) {
  const products = [product, ...state.products.filter((item) => item.id !== product.id)].slice(0, 3);
  const second = products[1] || product;
  const third = products[2] || product;
  const roomNote = product.url ? `ROOM: ${product.url}` : "詳しくはプロフィールのROOMにまとめます";

  if (angle === "女子大生あるある") {
    return `【Threads短文 5本】

1.
大学に着ていく服、ちゃんと可愛くしたい日ほど電車で座ることまで考えて選びがちです。

2.
「今日はシンプルで行こう」と思ったのに、結局どこかにリボンかフリルを足したくなります。

3.
友達に会うだけの日の服が、いちばん悩みます。
頑張りすぎず、でもちゃんと可愛い、の加減がむずかしいです。

4.
授業の日のバッグ、可愛さだけで選ぶと資料が入らなくて静かに反省します。

5.
雨の日はおしゃれの難易度が急に上がります。
でも、傘と靴まで合った日は少しだけ誇らしいです。`;
  }

  if (angle === "今日の可愛い発掘") {
    return `${disclosure}

【Threads短文 3本】

1.
今日の可愛い発掘。
${product.name}、${product.hook}ところが好き。
甘めきれいめ派の更新候補に入れたい。

2.
この雰囲気で${product.price || "価格帯未設定"}なら、かなり見に行きたい。
可愛い服って、見つけた瞬間にちょっと元気出る。

3.
${roomNote}`;
  }

  if (angle === "骨格ウェーブ寄せ") {
    return `${disclosure}

【Threads短文 4本】

1.
${product.name}、骨格ウェーブ寄せコーデに使いやすそう。
上半身かウエストまわりに可愛いポイントがある服、やっぱり強い。

2.
甘め服を大人っぽく着るなら、黒小物かかっちりバッグを足すのが一番早い。

3.
${product.hook}なら、デート服にも通勤寄せにも振れそう。
こういう服がクローゼットにあると朝ちょっと助かる。

4.
${roomNote}`;
  }

  if (angle === "軽い雑談") {
    return `${disclosure}

【Threads短文 5本】

1.
可愛い服を見てる時間、普通に回復タイム。
今日は${product.name}が気になってる。

2.
大人ガーリーって、甘くするより「甘さをどこで止めるか」が大事な気がする。

3.
渋谷でランチして、そのまま淡色コーデで歩く日を想像して服を選びがち。

4.
${product.hook}って、地味に使いやすいポイント。
買う前にここ見ちゃう。

5.
今日のROOM候補、あとでまとめます。`;
  }

  if (angle === "ROOM更新メモ") {
    return `${disclosure}

【Threads短文 3本】

1.
ROOM更新メモ。
今日は${product.name}を候補に追加。
${product.hook}

2.
一緒に見たい候補
・${second.name}
・${third.name}
甘めきれいめで並べるとかなり可愛い。

3.
${roomNote}`;
  }

  return `${disclosure}

【Threads 1日5本セット】

朝 8:00
今日の可愛い発掘。
${product.name}、${product.hook}ところがかなり好き。

昼 12:30
甘めきれいめって、服単体より「小物で締められるか」が大事。
${product.name}は黒小物と合わせてみたい。

夕方 17:30
このブラウス、骨格ウェーブ寄せコーデに良さそう。
上品だけどちゃんと可愛い、みたいな空気がある。

夜 20:30
今日の候補3つ
1. ${product.name}
2. ${second.name}
3. ${third.name}
どれも大人ガーリー更新枠。

ROOM 22:00
今日見つけた可愛いもの、ROOMにまとめます。
${roomNote}`;
}

function generateInstagramCopy(product, angle, disclosure, hashtags, roomLine) {
  const products = [product, ...state.products.filter((item) => item.id !== product.id)].slice(0, 4);
  const second = products[1] || product;
  const third = products[2] || product;

  if (angle === "女子大生あるある") {
    return `【カルーセル構成】

1枚目 表紙
礼儀正しくいたい女子大生の
ファッションあるある

2枚目
「きちんと感」は欲しいけど
可愛さも少しだけ残したい

3枚目
友達と会う日ほど
頑張りすぎて見えない服を選びたい

4枚目
授業の日はバッグ問題が大きい
可愛いバッグほど資料が入らない

5枚目
雨の日は靴で悩みがち
でも足元まで合うと一日うれしい

6枚目
大人っぽくしたい日ほど
小物で甘さを調整する

7枚目
共感したら保存してね
同じ気持ちの人に届きますように

【キャプション】
毎日ちゃんとしたいけど、可愛いも諦めたくない。
礼儀正しく見える服と、自分の気分が上がる服のあいだで、いつも少し悩んでいます。

同じように感じる方、いますか？

#女子大生コーデ #ファッションあるある #大人ガーリー #甘めきれいめ #通学コーデ`;
  }

  if (angle === "カルーセル3選") {
    return `${disclosure}

【カルーセル構成】

1枚目 表紙
春の甘めきれいめ3選
楽天ROOMで見つけた高見え候補

2枚目
1. ${product.name}
${product.hook}
価格帯: ${product.price || "未設定"}

3枚目
2. ${second.name}
${second.hook}
価格帯: ${second.price || "未設定"}

4枚目
3. ${third.name}
${third.hook}
価格帯: ${third.price || "未設定"}

5枚目
選ぶコツ
・甘め服は黒小物で締める
・淡色は素材感で高見えを狙う
・通勤にも使うなら装飾は控えめに

6枚目
あとで見返せるように保存してね
愛用品はプロフィールのROOMにまとめています

【キャプション】
春に着たい甘めきれいめアイテムを3つ選びました。
可愛いだけで終わらず、普段のコーデに混ぜやすいものを中心にしています。

${hashtags}${roomLine}`;
  }

  if (angle === "楽天で買える高見え") {
    return `${disclosure}

【カルーセル構成】

1枚目 表紙
楽天で買える高見えブラウス
大人ガーリー派が見るべき1枚

2枚目
${product.name}
${product.price || "価格帯未設定"}

3枚目
推しポイント
${product.hook}

4枚目
高見えする理由
・甘さが強すぎない
・きれいめ小物と合わせやすい
・写真映えしやすいディテール

5枚目
合わせ方
・マーメイドスカートで上品に
・デニムで甘さを抜く
・ジャケットで通勤寄せ

6枚目
気になる人は保存
ROOMに載せたらプロフィールから見られます

【キャプション】
楽天で探していたら、甘めきれいめに使いやすそうな高見え候補を発見。
大人ガーリーに寄せたい日にちょうどいい雰囲気です。

${hashtags}${roomLine}`;
  }

  if (angle === "リール台本") {
    return `${disclosure}

【リール台本 12秒】

0-2秒
画面テキスト: 楽天で見つけた高見え服
映像: 商品の全体感を見せる

2-5秒
画面テキスト: ${product.name}
映像: 素材感、袖、シルエットなど寄り

5-8秒
画面テキスト: ${product.hook}
映像: 手持ち服との組み合わせ

8-10秒
画面テキスト: 甘めだけど大人っぽい
映像: 黒小物や淡色バッグと合わせる

10-12秒
画面テキスト: 保存してROOMで見返してね
映像: コーデ完成カット

【キャプション】
今日の可愛い発掘は、${product.name}。
${product.hook}ところが推しです。

${hashtags}${roomLine}`;
  }

  if (angle === "着回し保存版") {
    return `${disclosure}

【カルーセル構成】

1枚目 表紙
${product.name}
着回し保存版

2枚目
通勤コーデ
ジャケット + きれいめバッグで甘さを調整

3枚目
週末コーデ
淡色バッグ + フレア系ボトムで大人ガーリーに

4枚目
カフェコーデ
白、ベージュ、ピンク系でやわらかく

5枚目
甘すぎ防止
黒小物、シンプル靴、直線的なバッグを足す

6枚目
保存ポイント
買う前に「手持ち3コーデ」に合わせられるか確認

【キャプション】
${product.name}を買うなら、可愛いだけじゃなく着回せるかも大事。
${product.hook}ので、甘めきれいめ派の更新候補に入れたいです。

${hashtags}${roomLine}`;
  }

  return `${disclosure}

【カルーセル構成】

1枚目 表紙
楽天服で失敗しない選び方
甘めきれいめ編

2枚目
1. 写真だけで決めない
レビュー、素材、サイズ表を見る

3枚目
2. 甘さは1点まで
フリル、リボン、レースを重ねすぎない

4枚目
3. 小物で大人っぽくする
黒、シルバー、かっちりバッグが便利

5枚目
4. 今回の候補
${product.name}
${product.hook}

6枚目
保存して買い物前に見返してね
候補はプロフィールのROOMにまとめます

【キャプション】
楽天で服を探すとき、可愛いだけで選ぶと着回しに迷いがち。
甘めきれいめ派は「甘さを足す場所」と「締める場所」を決めると失敗しにくいです。

${hashtags}${roomLine}`;
}

function generateXCopy(product, angle, disclosure, hashtags, roomLine) {
  const products = [product, ...state.products.filter((item) => item.id !== product.id)].slice(0, 4);
  const second = products[1] || product;
  const third = products[2] || product;

  if (angle === "女子大生あるある") {
    return `礼儀正しく見えたい女子大生のファッションあるある。

ちゃんとして見せたい日は、結局「甘さ控えめの可愛い」に落ち着きがち。
派手すぎず、でも地味すぎず、友達に会っても少し気分が上がる服がちょうどいい。

#ファッションあるある #女子大生コーデ #大人ガーリー`;
  }

  if (angle === "比較") {
    return `${disclosure}

甘めきれいめで迷うなら、この2つ。

A. ${product.name}
→ ${product.hook}

B. ${second.name}
→ ${second.hook}

可愛さ重視ならA、着回し重視ならBが使いやすそう。
価格帯はAが${product.price || "未設定"}、Bが${second.price || "未設定"}。

${hashtags}${roomLine}`;
  }

  if (angle === "ランキング") {
    return `${disclosure}

今週のROOM候補ランキング

1位 ${product.name}
${product.hook}

2位 ${second.name}
${second.hook}

3位 ${third.name}
${third.hook}

大人ガーリーを更新したい人は、まず1位から見るのがよさそう。

${hashtags}${roomLine}`;
  }

  if (angle === "セール速報") {
    return `${disclosure}

セールで見るならこれ。
${product.name}

推しポイント
・${product.hook}
・${product.price || "価格帯未設定"}で狙いやすい
・甘めだけど普段コーデに混ぜやすい

在庫と価格は変わりやすいので、気になる人は早めにチェック。

${hashtags}${roomLine}`;
  }

  return `${disclosure}

${product.name}の着回し案

月: 黒小物で甘さを締める
水: 白、ベージュ系でやわらかく
金: ジャケット合わせできれいめに
週末: 淡色バッグで大人ガーリー全開

${product.hook}から、1点投入でも雰囲気を変えやすい。

${hashtags}${roomLine}`;
}

function renderChecks(text) {
  const commercial = /ROOM|楽天|商品|価格|セール|アフィリエイト/.test(text);
  const platformLengthOk = activePlatform === "X"
    ? text.length <= 280
    : activePlatform === "Instagram"
      ? text.length <= 2200
      : text.split(/\n\n+/).every((block) => block.length <= 500);
  const hasSpecificity = /価格|料金|アクセス|客室|食事|キャンセル|チェックイン|サイズ|素材|着丈|ウエスト|インナー|バッグ|パンツ|スカート|レビュー|[0-9]枚目/.test(text);
  const hasCta = /保存|コメント|教えて|ROOM|見返|フォロー|どちら|どれ/.test(text);
  const hasHook = text.trim().split("\n").filter(Boolean)[0]?.length <= 34;
  const hasEmpathy = /迷|不安|気持ち|うれしい|恥ずかしい|安心|自信|悩|わか|同じ|一緒/.test(text);
  const hasConversationSpace = /ですか|ますか|教えて|どちら|どれ|皆さん|同じ人|一緒に/.test(text);
  const hasHumanVoice = !/おすすめです。おすすめ|かなり優秀|絶対買い|優勝です。優勝/.test(text);
  const ownership = document.querySelector("#ownershipSelect")?.value || "considering";
  const claimsExperience = /愛用品|愛用して|何度も着ています|何度も着ました|何度も使っています|何度も使いました|買ってよかった|着てみたら|使ってみたら|実際に宿泊|泊まってよかった|宿泊して感じ/.test(text);
  const ownershipHonest = ownership !== "considering" || !claimsExperience;
  const hasSaveableStructure = /チェック|比較|選ぶ前|選んだ後|着回し|3コーデ|1回あたり|保存用|アクセス|客室|キャンセル/.test(text);
  const hasOriginalityPlan = activePlatform !== "Instagram" || /オリジナル素材メモ|自分で着た|手持ち服3点|試着時/.test(text);
  const hasHonestCaveat = /気になる|確認|注意|迷|正直|変わる|個人差|購入前/.test(text);
  const genericBaitOnly = /同じ人いますか[？?]?\s*$/.test(text.trim()) && !/合わせ|サイズ|素材|コーデ|A｜|B｜|どちら/.test(text);
  const selectedProductData = state.products.find((item) => item.id === selectedProduct.value);
  const isFashionPost = selectedProductData?.category !== "ホテル・旅行";
  const hasWearScene = !isFashionPost || /通学|大学|通勤|オフィス|デート|カフェ|推し活|イベント|休日|お出かけ/.test(text);
  const avoidsBodyPromise = !/絶対細見え|着るだけで痩せ|骨格ウェーブ優勝|誰でも華奢見え/.test(text);
  const hasFitCheck = !isFashionPost || /サイズ|着丈|ウエスト|肩|袖|腰|丈|締め付け|透け|素材|レビュー/.test(text);
  const checks = [
    {
      ok: !commercial || /PR|広告|アフィリエイト/.test(text),
      okText: commercial ? "広告・アフィリエイト表記あり" : "広告表記が不要な共感投稿です",
      warnText: "商品導線があるため、広告・アフィリエイト表記を入れてください",
    },
    {
      ok: !/絶対|必ず痩せる|誰でも|100%|最安/.test(text),
      okText: "誇大表現は見当たりません",
      warnText: "絶対・100%・最安などの断定表現を確認してください",
    },
    {
      ok: text.length === 0 || platformLengthOk,
      okText: `${activePlatform}に適した文字量です`,
      warnText: `${activePlatform}向けとして長めです。公開部分を分けてください`,
    },
    {
      ok: text.length === 0 || !/無断転載|公式画像加工/.test(text),
      okText: "権利リスクの高い文言は見当たりません",
      warnText: "画像や素材の権利表記を確認してください",
    },
    {
      ok: text.length === 0 || hasSpecificity,
      okText: "具体的な選び方・合わせ方があります",
      warnText: "具体的な素材、サイズ、合わせ方を1つ加えると強くなります",
    },
    {
      ok: text.length === 0 || hasCta,
      okText: "読者の次の行動が明確です",
      warnText: "保存・返信・ROOMなど次の行動を入れてください",
    },
    {
      ok: text.length === 0 || hasHook,
      okText: "冒頭が短く、内容をつかみやすいです",
      warnText: "最初の一文を34文字以内のフックにすると読みやすくなります",
    },
    {
      ok: text.length === 0 || hasEmpathy,
      okText: "読者の迷いや気持ちに触れています",
      warnText: "読者が感じている迷いを、具体的な一文で受け止めてください",
    },
    {
      ok: text.length === 0 || hasConversationSpace,
      okText: "読者が参加できる余白があります",
      warnText: "答えたくなる問いや、意見を言える余白を加えてください",
    },
    {
      ok: text.length === 0 || hasHumanVoice,
      okText: "定型的な売り文句に寄りすぎていません",
      warnText: "よくある売り文句を減らし、本人の観察や本音へ置き換えてください",
    },
    {
      ok: text.length === 0 || ownershipHonest,
      okText: "購入状況と体験表現が一致しています",
      warnText: "未購入の商品を愛用品・使用体験のように書いていないか確認してください",
    },
    {
      ok: text.length === 0 || hasSaveableStructure,
      okText: "比較・確認項目など保存する理由があります",
      warnText: "比較、3項目、着回しなど後で見返す情報を加えてください",
    },
    {
      ok: text.length === 0 || hasOriginalityPlan,
      okText: activePlatform === "Instagram" ? "自分の写真・観察を入れる設計です" : "媒体に合う独自の視点があります",
      warnText: "Instagramでは、自分で撮った写真や自分だけの観察を入れてください",
    },
    {
      ok: text.length === 0 || hasHonestCaveat,
      okText: "良い点だけでなく、確認点も伝えています",
      warnText: "一つだけ正直な注意点・確認点を添えると信頼されやすくなります",
    },
    {
      ok: text.length === 0 || !genericBaitOnly,
      okText: "会話のきっかけが内容と結びついています",
      warnText: "『同じ人いますか？』だけで終わらず、答えやすい具体的な問いにしてください",
    },
    {
      ok: text.length === 0 || hasWearScene,
      okText: "実際に着る場面が想像できます",
      warnText: "通学・通勤・デートなど、着ていく場面を一つ加えてください",
    },
    {
      ok: text.length === 0 || avoidsBodyPromise,
      okText: "体型効果を断定していません",
      warnText: "『絶対細見え』『骨格優勝』ではなく、確認したシルエットを具体的に書いてください",
    },
    {
      ok: text.length === 0 || hasFitCheck,
      okText: "サイズ・素材・着用感の確認点があります",
      warnText: "通販で失敗しないためのサイズ・素材・着用感を加えてください",
    },
  ];

  checklist.innerHTML = checks
    .map((check) => `<li class="${check.ok ? "ok" : "warn"}">${check.ok ? check.okText : check.warnText}</li>`)
    .join("");
  const passed = checks.filter((check) => check.ok).length;
  const score = text.length ? Math.round((passed / checks.length) * 100) : 0;
  document.querySelector("#qualityScore").textContent = text.length ? `${score}` : "--";
}

function renderCalendar() {
  if (!state.calendar.length) {
    calendarList.innerHTML = `<p class="muted">まだ予定がありません。投稿メーカーから追加できます。</p>`;
    return;
  }

  calendarList.innerHTML = "";
  state.calendar.forEach((item) => {
    const row = document.createElement("div");
    row.className = "calendar-item";
    row.innerHTML = `
      <strong>${escapeHtml(item.date)}${item.time ? `<small>${escapeHtml(item.time)}</small>` : ""}</strong>
      <span class="tag">${escapeHtml(item.platform)}</span>
      <div class="calendar-copy">${escapeHtml(item.copy)}</div>
      <button data-done="${item.id}">${item.done ? "戻す" : "完了"}</button>
    `;
    calendarList.appendChild(row);
  });

  calendarList.querySelectorAll("[data-done]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.calendar.find((entry) => entry.id === button.dataset.done);
      item.done = !item.done;
      saveState();
      renderCalendar();
    });
  });
}

function renderMetrics() {
  state.metrics ||= [];
  const views = state.metrics.reduce((sum, item) => sum + Number(item.views || 0), 0);
  const saves = state.metrics.reduce((sum, item) => sum + Number(item.saves || 0), 0);
  const replies = state.metrics.reduce((sum, item) => sum + Number(item.replies || 0), 0);
  const clicks = state.metrics.reduce((sum, item) => sum + Number(item.clicks || 0), 0);
  const sales = state.metrics.reduce((sum, item) => sum + Number(item.sales || 0), 0);
  const conversion = clicks ? `${((sales / clicks) * 100).toFixed(1)}%` : "0%";
  const winner = getPerformanceInsight("all", "balanced");

  metricSummary.innerHTML = `
    <div class="summary-card"><strong>${views.toLocaleString("ja-JP")}</strong><span>表示</span></div>
    <div class="summary-card"><strong>${saves.toLocaleString("ja-JP")}</strong><span>保存・シェア</span></div>
    <div class="summary-card"><strong>${replies.toLocaleString("ja-JP")}</strong><span>返信</span></div>
    <div class="summary-card"><strong>${clicks}</strong><span>ROOMクリック</span></div>
    <div class="summary-card"><strong>${sales}</strong><span>売上 / CVR ${conversion}</span></div>
    <div class="summary-card winner-card"><strong>${winner.sampleSize ? viralPatternLabels[winner.pattern] : "学習中"}</strong><span>現在の総合勝ち型</span></div>
  `;

  if (!state.metrics.length) {
    metricList.innerHTML = `<p class="muted">投稿後のクリックや売上を記録すると、伸びる型が見えます。</p>`;
    return;
  }

  metricList.innerHTML = state.metrics
    .map(
      (item) => `
        <div class="metric-item">
          <strong>${escapeHtml(item.date)}</strong>
          <span class="tag">${escapeHtml(item.platform)}</span>
          <span>${escapeHtml(item.post)}</span>
          <span>${item.pattern ? escapeHtml(viralPatternLabels[item.pattern] || item.pattern) : "型未設定"}</span>
          <span>${Number(item.views || 0).toLocaleString("ja-JP")}表示 / ${Number(item.saves || 0)}保存 / ${Number(item.replies || 0)}返信 / ${Number(item.clicks || 0)}クリック / ${Number(item.sales || 0)}件</span>
          <button data-delete-metric="${item.id}" aria-label="成果記録を削除">×</button>
        </div>
      `,
    )
    .join("");

  metricList.querySelectorAll("[data-delete-metric]").forEach((button) => {
    button.addEventListener("click", () => {
      state.metrics = state.metrics.filter((item) => item.id !== button.dataset.deleteMetric);
      saveState();
      renderMetrics();
      renderLearningHint();
    });
  });
}

function getPerformanceInsight(platform, mode = "balanced") {
  const eligible = (state.metrics || []).filter((item) => {
    const samePlatform = platform === "all" || String(item.platform).toLowerCase() === String(platform).toLowerCase();
    return samePlatform && item.pattern && viralPatternLabels[item.pattern];
  });
  const groups = new Map();
  eligible.forEach((item) => {
    const group = groups.get(item.pattern) || { pattern: item.pattern, sampleSize: 0, score: 0 };
    group.sampleSize += 1;
    group.score += performanceScore(item, mode);
    groups.set(item.pattern, group);
  });
  const ranked = [...groups.values()]
    .map((group) => ({ ...group, score: (group.score / group.sampleSize) * Math.min(1, group.sampleSize / 3) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0] || { pattern: "comparison", sampleSize: 0, score: 0 };
}

function performanceScore(item, mode) {
  const views = Number(item.views || 0);
  const saves = Number(item.saves || 0);
  const replies = Number(item.replies || 0);
  const clicks = Number(item.clicks || 0);
  const sales = Number(item.sales || 0);
  const rates = {
    save: views ? (saves / views) * 1000 : saves,
    click: views ? (clicks / views) * 1000 : clicks,
    sale: clicks ? (sales / clicks) * 100 : sales,
  };
  if (mode === "reach") return views;
  if (mode === "save") return saves * 8 + rates.save;
  if (mode === "click") return clicks * 12 + rates.click;
  if (mode === "sale") return sales * 100 + clicks * 4 + rates.sale;
  return views * 0.01 + saves * 6 + replies * 4 + clicks * 10 + sales * 80;
}

function renderLearningHint() {
  const target = document.querySelector("#learningHint");
  if (!target) return;
  const mode = document.querySelector("#optimizationSelect")?.value || "balanced";
  const insight = getPerformanceInsight(activePlatform, mode);
  if (insight.sampleSize < 2) {
    target.textContent = `${activePlatform}の投稿型を2件以上記録すると、成果が高い構成を自動で優先します。現在${insight.sampleSize}件です。`;
    return;
  }
  target.textContent = `${activePlatform}では「${viralPatternLabels[insight.pattern]}」が現在の勝ち型です。次の自動生成で優先します。`;
}

function openView(viewName) {
  document.querySelector(`.nav-tab[data-view="${viewName}"]`).click();
}

async function copyText(text) {
  if (!text.trim()) return showToast("コピーする内容がありません");
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
  showToast("コピーしました");
}

function exportData() {
  saveState();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `hanako-room-ops-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = JSON.parse(reader.result);
      Object.assign(state, imported);
      saveState();
      location.reload();
    } catch {
      showToast("JSONを読み込めませんでした");
    }
  });
  reader.readAsText(file);
}

function registerPwa() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch(() => {
        // PWA登録はHTTPS配信時だけ成功すればよいので、ローカル表示では静かに無視する。
      });
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
