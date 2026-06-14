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
let activePlatform = "Instagram";
let lastGenerated = "";
let suppressCloudSave = false;
let cloudSaveTimer = null;
let lastCloudSyncAt = null;
const cloudSync = new window.HanakoCloudSync(window.HANAKO_CLOUD_CONFIG || {});

const anglePresets = {
  Instagram: ["カルーセル3選", "楽天で買える高見え", "リール台本", "着回し保存版", "失敗しない選び方", "女子大生あるある"],
  Threads: ["1日5本セット", "今日の可愛い発掘", "骨格ウェーブ寄せ", "軽い雑談", "女子大生あるある", "ROOM更新メモ"],
  X: ["比較", "ランキング", "セール速報", "着回し案", "女子大生あるある"],
};

const views = {
  brief: "プロフィール",
  products: "商品パイプライン",
  generator: "投稿メーカー",
  calendar: "投稿カレンダー",
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
const toast = document.querySelector("#toast");
let deferredInstallPrompt = null;

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
  renderCalendar();
  renderMetrics();
  renderChecks("");
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
    };
  }
}

function saveState() {
  state.profile = profileText.value;
  state.updatedAt = new Date().toISOString();
  hasMeaningfulLocalData = true;
  localStorage.setItem("hanako-room-ops", JSON.stringify(state));
  if (!suppressCloudSave) scheduleCloudSave();
}

function bindNavigation() {
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
      tab.classList.add("active");
      document.querySelector(`#${tab.dataset.view}`).classList.add("active");
      document.querySelector("#viewTitle").textContent = views[tab.dataset.view];
    });
  });
}

function bindForms() {
  document.querySelector("#productForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.products.unshift({
      id: createId(),
      name: form.get("name").trim(),
      url: form.get("url").trim(),
      category: form.get("category"),
      price: form.get("price").trim(),
      hook: form.get("hook").trim(),
    });
    event.currentTarget.reset();
    saveState();
    renderProducts();
    renderProductOptions();
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
      clicks: Number(form.get("clicks") || 0),
      sales: Number(form.get("sales") || 0),
    });
    event.currentTarget.reset();
    document.querySelector('input[name="date"]').valueAsDate = new Date();
    saveState();
    renderMetrics();
    showToast("成果を記録しました");
  });
}

function bindActions() {
  profileText.addEventListener("input", saveState);
  bindInstallButton();

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
    });
  });

  document.querySelector("#generatePost").addEventListener("click", () => {
    const product = state.products.find((item) => item.id === selectedProduct.value) || state.products[0];
    if (!product) {
      showToast("先に商品を登録してください");
      return;
    }
    lastGenerated = generateCopy(product, activePlatform, document.querySelector("#angleSelect").value);
    postOutput.value = lastGenerated;
    renderChecks(lastGenerated);
  });

  document.querySelector("#copyPost").addEventListener("click", () => copyText(postOutput.value));

  document.querySelector("#saveDraft").addEventListener("click", () => {
    if (!postOutput.value.trim()) return showToast("投稿を生成してください");
    state.drafts.unshift({
      id: createId(),
      platform: activePlatform,
      copy: postOutput.value,
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
  renderCalendar();
  renderMetrics();
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
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div>
        <h4>${escapeHtml(product.name)}</h4>
        <p class="muted">${escapeHtml(product.hook || "推しポイント未設定")}</p>
      </div>
      <div class="product-meta">
        <span class="tag">${escapeHtml(product.category)}</span>
        <span class="tag">${escapeHtml(product.price || "価格未設定")}</span>
      </div>
      <div class="button-row">
        <button data-use="${product.id}">投稿に使う</button>
        <button data-delete="${product.id}">削除</button>
      </div>
    `;
    productGrid.appendChild(card);
  });

  productGrid.querySelectorAll("[data-use]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedProduct.value = button.dataset.use;
      openView("generator");
      showToast("投稿メーカーにセットしました");
    });
  });

  productGrid.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      state.products = state.products.filter((item) => item.id !== button.dataset.delete);
      saveState();
      renderProducts();
      renderProductOptions();
    });
  });
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

function renderAngleOptions() {
  const angleSelect = document.querySelector("#angleSelect");
  angleSelect.innerHTML = "";
  anglePresets[activePlatform].forEach((angle) => {
    const option = document.createElement("option");
    option.value = angle;
    option.textContent = angle;
    angleSelect.appendChild(option);
  });
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
  const checks = [
    {
      ok: /PR|広告|アフィリエイト/.test(text),
      okText: "広告・アフィリエイト表記あり",
      warnText: "広告・アフィリエイト表記を入れてください",
    },
    {
      ok: !/絶対|必ず痩せる|誰でも|100%|最安/.test(text),
      okText: "誇大表現は見当たりません",
      warnText: "絶対・100%・最安などの断定表現を確認してください",
    },
    {
      ok: text.length === 0 || text.length <= 2200,
      okText: "Instagramの長文投稿にも収まる長さです",
      warnText: "投稿文が長すぎます。媒体別に短くしてください",
    },
    {
      ok: text.length === 0 || !/無断転載|公式画像加工/.test(text),
      okText: "権利リスクの高い文言は見当たりません",
      warnText: "画像や素材の権利表記を確認してください",
    },
  ];

  checklist.innerHTML = checks
    .map((check) => `<li class="${check.ok ? "ok" : "warn"}">${check.ok ? check.okText : check.warnText}</li>`)
    .join("");
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
      <strong>${escapeHtml(item.date)}</strong>
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
  const clicks = state.metrics.reduce((sum, item) => sum + item.clicks, 0);
  const sales = state.metrics.reduce((sum, item) => sum + item.sales, 0);
  const conversion = clicks ? `${((sales / clicks) * 100).toFixed(1)}%` : "0%";

  metricSummary.innerHTML = `
    <div class="summary-card"><strong>${clicks}</strong><span>ROOMクリック</span></div>
    <div class="summary-card"><strong>${sales}</strong><span>売上件数</span></div>
    <div class="summary-card"><strong>${conversion}</strong><span>簡易CVR</span></div>
    <div class="summary-card"><strong>${state.metrics.length}</strong><span>記録数</span></div>
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
          <span>${item.clicks}クリック / ${item.sales}件</span>
        </div>
      `,
    )
    .join("");
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
