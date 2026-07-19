const APP_VERSION = (() => {
  try {
    return new URL(document.currentScript?.src || location.href).searchParams.get("v") || "開発版";
  } catch {
    return "開発版";
  }
})();

const COORDINATE_PHOTO_LIMIT = 6;
const ROOM_SIGNATURE_LOGO_PATH = "icons/fashion-hanako-kawaisa-lab-logo.svg";

const defaultProfile = `毎日おしゃれ研究家のハナコです
大人ガーリー＆甘めきれいめコーデを研究中

👗 きれいめ可愛い着回し
🛍 楽天ROOMで高見えアイテム発掘
🌍 海外旅行好き｜95か国を旅して世界の可愛いを発掘
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
state.appearance ||= { avatarTheme: "original" };
state.coordinatePhotos ||= [];
state.selectedCoordinatePhotoId ||= state.coordinatePhotos[0]?.id || "";
ensureOpsState(state);

const avatarThemes = {
  custom: {
    avatar: "icons/hanako-avatar.jpg",
    icon: "icons/icon-192.png",
    manifest: "manifest.webmanifest",
    label: "自作アイコン",
  },
  original: {
    avatar: "icons/hanako-avatar.jpg",
    icon: "icons/icon-192.png",
    manifest: "manifest.webmanifest",
    label: "リボンピンク",
  },
  cafe: {
    avatar: "icons/hanako-avatar-cafe.png",
    icon: "icons/icon-cafe-192.png",
    manifest: "manifest-cafe.webmanifest",
    label: "カフェローズ",
  },
  chic: {
    avatar: "icons/hanako-avatar-chic.png",
    icon: "icons/icon-chic-192.png",
    manifest: "manifest-chic.webmanifest",
    label: "モノトーン",
  },
  lavender: {
    avatar: "icons/hanako-avatar-lavender.png",
    icon: "icons/icon-lavender-192.png",
    manifest: "manifest-lavender.webmanifest",
    label: "ラベンダー",
  },
  mint: {
    avatar: "icons/hanako-avatar-mint.png",
    icon: "icons/icon-mint-192.png",
    manifest: "manifest-mint.webmanifest",
    label: "ミントおでかけ",
  },
  navy: {
    avatar: "icons/hanako-avatar-navy.png",
    icon: "icons/icon-navy-192.png",
    manifest: "manifest-navy.webmanifest",
    label: "ネイビー上品",
  },
  strawberry: {
    avatar: "icons/hanako-avatar-strawberry.png",
    icon: "icons/icon-strawberry-192.png",
    manifest: "manifest-strawberry.webmanifest",
    label: "いちごピーチ",
  },
  lemon: {
    avatar: "icons/hanako-avatar-lemon.png",
    icon: "icons/icon-lemon-192.png",
    manifest: "manifest-lemon.webmanifest",
    label: "レモンクリーム",
  },
  aqua: {
    avatar: "icons/hanako-avatar-aqua.png",
    icon: "icons/icon-aqua-192.png",
    manifest: "manifest-aqua.webmanifest",
    label: "アクアリボン",
  },
  classic: {
    avatar: "icons/hanako-avatar-classic.png",
    icon: "icons/icon-classic-192.png",
    manifest: "manifest-classic.webmanifest",
    label: "クラシックローズ",
  },
  office: {
    avatar: "icons/hanako-avatar-office.png",
    icon: "icons/icon-office-192.png",
    manifest: "manifest-office.webmanifest",
    label: "きれいめOL",
  },
  oshikatsu: {
    avatar: "icons/hanako-avatar-oshikatsu.png",
    icon: "icons/icon-oshikatsu-192.png",
    manifest: "manifest-oshikatsu.webmanifest",
    label: "推し活ガール",
  },
  campus: { avatar: "icons/hanako-avatar-campus.png", icon: "icons/icon-campus-192.png", manifest: "manifest-campus.webmanifest", label: "キャンパスプレッピー" },
  rainy: { avatar: "icons/hanako-avatar-rainy.png", icon: "icons/icon-rainy-192.png", manifest: "manifest-rainy.webmanifest", label: "雨の日ブルー" },
  sakura: { avatar: "icons/hanako-avatar-sakura.png", icon: "icons/icon-sakura-192.png", manifest: "manifest-sakura.webmanifest", label: "桜ピクニック" },
  marine: { avatar: "icons/hanako-avatar-marine.png", icon: "icons/icon-marine-192.png", manifest: "manifest-marine.webmanifest", label: "マリンリボン" },
  autumn: { avatar: "icons/hanako-avatar-autumn.png", icon: "icons/icon-autumn-192.png", manifest: "manifest-autumn.webmanifest", label: "秋色ブック" },
  winter: { avatar: "icons/hanako-avatar-winter.png", icon: "icons/icon-winter-192.png", manifest: "manifest-winter.webmanifest", label: "冬ふわピンク" },
  beauty: { avatar: "icons/hanako-avatar-beauty.png", icon: "icons/icon-beauty-192.png", manifest: "manifest-beauty.webmanifest", label: "ビューティーローズ" },
  travelgirl: { avatar: "icons/hanako-avatar-travelgirl.png", icon: "icons/icon-travelgirl-192.png", manifest: "manifest-travelgirl.webmanifest", label: "旅するハナコ" },
  sporty: { avatar: "icons/hanako-avatar-sporty.png", icon: "icons/icon-sporty-192.png", manifest: "manifest-sporty.webmanifest", label: "スポーティー" },
  evening: { avatar: "icons/hanako-avatar-evening.png", icon: "icons/icon-evening-192.png", manifest: "manifest-evening.webmanifest", label: "ナイトエレガント" },
  chocolate: { avatar: "icons/hanako-avatar-chocolate.png", icon: "icons/icon-chocolate-192.png", manifest: "manifest-chocolate.webmanifest", label: "チョコブラウン" },
  florist: { avatar: "icons/hanako-avatar-florist.png", icon: "icons/icon-florist-192.png", manifest: "manifest-florist.webmanifest", label: "フラワーショップ" },
  music: { avatar: "icons/hanako-avatar-music.png", icon: "icons/icon-music-192.png", manifest: "manifest-music.webmanifest", label: "ミュージック" },
  denim: { avatar: "icons/hanako-avatar-denim.png", icon: "icons/icon-denim-192.png", manifest: "manifest-denim.webmanifest", label: "デニム休日" },
  museum: { avatar: "icons/hanako-avatar-museum.png", icon: "icons/icon-museum-192.png", manifest: "manifest-museum.webmanifest", label: "ミュージアム" },
  bakery: { avatar: "icons/hanako-avatar-bakery.png", icon: "icons/icon-bakery-192.png", manifest: "manifest-bakery.webmanifest", label: "ベーカリー" },
  resort: { avatar: "icons/hanako-avatar-resort.png", icon: "icons/icon-resort-192.png", manifest: "manifest-resort.webmanifest", label: "リゾート" },
  studynight: { avatar: "icons/hanako-avatar-studynight.png", icon: "icons/icon-studynight-192.png", manifest: "manifest-studynight.webmanifest", label: "お勉強ナイト" },
  wamodern: { avatar: "icons/hanako-avatar-wamodern.png", icon: "icons/icon-wamodern-192.png", manifest: "manifest-wamodern.webmanifest", label: "和モダン" },
  holiday: { avatar: "icons/hanako-avatar-holiday.png", icon: "icons/icon-holiday-192.png", manifest: "manifest-holiday.webmanifest", label: "ホリデー" },
  parisienne: { avatar: "icons/hanako-avatar-parisienne.png", icon: "icons/icon-parisienne-192.png", manifest: "manifest-parisienne.webmanifest", label: "パリジェンヌ" },
  picnic: { avatar: "icons/hanako-avatar-picnic.png", icon: "icons/icon-picnic-192.png", manifest: "manifest-picnic.webmanifest", label: "ピクニック" },
  balletcore: { avatar: "icons/hanako-avatar-balletcore.png", icon: "icons/icon-balletcore-192.png", manifest: "manifest-balletcore.webmanifest", label: "バレエコア" },
  cinema: { avatar: "icons/hanako-avatar-cinema.png", icon: "icons/icon-cinema-192.png", manifest: "manifest-cinema.webmanifest", label: "映画館" },
  ceramics: { avatar: "icons/hanako-avatar-ceramics.png", icon: "icons/icon-ceramics-192.png", manifest: "manifest-ceramics.webmanifest", label: "陶芸アトリエ" },
  gardening: { avatar: "icons/hanako-avatar-gardening.png", icon: "icons/icon-gardening-192.png", manifest: "manifest-gardening.webmanifest", label: "お花ガーデン" },
  library: { avatar: "icons/hanako-avatar-library.png", icon: "icons/icon-library-192.png", manifest: "manifest-library.webmanifest", label: "図書館" },
  seaside: { avatar: "icons/hanako-avatar-seaside.png", icon: "icons/icon-seaside-192.png", manifest: "manifest-seaside.webmanifest", label: "海辺のお嬢さん" },
  nightout: { avatar: "icons/hanako-avatar-nightout.png", icon: "icons/icon-nightout-192.png", manifest: "manifest-nightout.webmanifest", label: "夜のおでかけ" },
  ribbonlady: { avatar: "icons/hanako-avatar-ribbonlady.png", icon: "icons/icon-ribbonlady-192.png", manifest: "manifest-ribbonlady.webmanifest", label: "リボンレディ" },
  royalgala: { avatar: "icons/hanako-avatar-royalgala.png", icon: "icons/icon-royalgala-192.png", manifest: "manifest-royalgala.webmanifest", label: "ロイヤルガラ" },
  yozakura: { avatar: "icons/hanako-avatar-yozakura.png", icon: "icons/icon-yozakura-192.png", manifest: "manifest-yozakura.webmanifest", label: "夜桜スペシャル" },
  moonlight: { avatar: "icons/hanako-avatar-moonlight.png", icon: "icons/icon-moonlight-192.png", manifest: "manifest-moonlight.webmanifest", label: "月夜のプリンセス" },
  anniversaryrose: { avatar: "icons/hanako-avatar-anniversaryrose.png", icon: "icons/icon-anniversaryrose-192.png", manifest: "manifest-anniversaryrose.webmanifest", label: "記念日ローズ" },
  jewelprincess: { avatar: "icons/hanako-avatar-jewelprincess.png", icon: "icons/icon-jewelprincess-192.png", manifest: "manifest-jewelprincess.webmanifest", label: "宝石箱プリンセス" },
  perfume: {
    avatar: "icons/hanako-avatar-perfume.png",
    icon: "icons/icon-perfume-192.png",
    manifest: "manifest-perfume.webmanifest",
    label: "リボン香水",
  },
  closet: {
    avatar: "icons/hanako-avatar-closet.png",
    icon: "icons/icon-closet-192.png",
    manifest: "manifest-closet.webmanifest",
    label: "クローゼット",
  },
  shopping: {
    avatar: "icons/hanako-avatar-shopping.png",
    icon: "icons/icon-shopping-192.png",
    manifest: "manifest-shopping.webmanifest",
    label: "お買い物バッグ",
  },
  mirror: {
    avatar: "icons/hanako-avatar-mirror.png",
    icon: "icons/icon-mirror-192.png",
    manifest: "manifest-mirror.webmanifest",
    label: "花と手鏡",
  },
  notebook: {
    avatar: "icons/hanako-avatar-notebook.png",
    icon: "icons/icon-notebook-192.png",
    manifest: "manifest-notebook.webmanifest",
    label: "コーデノート",
  },
  heels: { avatar: "icons/hanako-avatar-heels.png", icon: "icons/icon-heels-192.png", manifest: "manifest-heels.webmanifest", label: "リボンパンプス" },
  jewelry: { avatar: "icons/hanako-avatar-jewelry.png", icon: "icons/icon-jewelry-192.png", manifest: "manifest-jewelry.webmanifest", label: "ジュエリーボックス" },
  teatime: { avatar: "icons/hanako-avatar-teatime.png", icon: "icons/icon-teatime-192.png", manifest: "manifest-teatime.webmanifest", label: "アフタヌーンティー" },
  bouquet: { avatar: "icons/hanako-avatar-bouquet.png", icon: "icons/icon-bouquet-192.png", manifest: "manifest-bouquet.webmanifest", label: "ピンクブーケ" },
  smartphone: { avatar: "icons/hanako-avatar-smartphone.png", icon: "icons/icon-smartphone-192.png", manifest: "manifest-smartphone.webmanifest", label: "投稿プランナー" },
  parasol: { avatar: "icons/hanako-avatar-parasol.png", icon: "icons/icon-parasol-192.png", manifest: "manifest-parasol.webmanifest", label: "レース日傘" },
  sewing: { avatar: "icons/hanako-avatar-sewing.png", icon: "icons/icon-sewing-192.png", manifest: "manifest-sewing.webmanifest", label: "ソーイングバスケット" },
  camera: { avatar: "icons/hanako-avatar-camera.png", icon: "icons/icon-camera-192.png", manifest: "manifest-camera.webmanifest", label: "リボンカメラ" },
  sunhat: { avatar: "icons/hanako-avatar-sunhat.png", icon: "icons/icon-sunhat-192.png", manifest: "manifest-sunhat.webmanifest", label: "夏のおでかけ" },
  dessert: { avatar: "icons/hanako-avatar-dessert.png", icon: "icons/icon-dessert-192.png", manifest: "manifest-dessert.webmanifest", label: "いちごケーキ" },
  vanitytray: { avatar: "icons/hanako-avatar-vanitytray.png", icon: "icons/icon-vanitytray-192.png", manifest: "manifest-vanitytray.webmanifest", label: "コスメトレー" },
  maryjanes: { avatar: "icons/hanako-avatar-maryjanes.png", icon: "icons/icon-maryjanes-192.png", manifest: "manifest-maryjanes.webmanifest", label: "メリージェーン" },
  ribboncardigan: { avatar: "icons/hanako-avatar-ribboncardigan.png", icon: "icons/icon-ribboncardigan-192.png", manifest: "manifest-ribboncardigan.webmanifest", label: "リボンカーデ" },
  cafeplate: { avatar: "icons/hanako-avatar-cafeplate.png", icon: "icons/icon-cafeplate-192.png", manifest: "manifest-cafeplate.webmanifest", label: "カフェプレート" },
  charmbracelet: { avatar: "icons/hanako-avatar-charmbracelet.png", icon: "icons/icon-charmbracelet-192.png", manifest: "manifest-charmbracelet.webmanifest", label: "チャームブレス" },
  colorpalette: { avatar: "icons/hanako-avatar-colorpalette.png", icon: "icons/icon-colorpalette-192.png", manifest: "manifest-colorpalette.webmanifest", label: "色合わせ先生" },
  wardrobeaudit: { avatar: "icons/hanako-avatar-wardrobeaudit.png", icon: "icons/icon-wardrobeaudit-192.png", manifest: "manifest-wardrobeaudit.webmanifest", label: "クローゼット診断" },
  fitcheck: { avatar: "icons/hanako-avatar-fitcheck.png", icon: "icons/icon-fitcheck-192.png", manifest: "manifest-fitcheck.webmanifest", label: "着やせチェック" },
  shoeclinic: { avatar: "icons/hanako-avatar-shoeclinic.png", icon: "icons/icon-shoeclinic-192.png", manifest: "manifest-shoeclinic.webmanifest", label: "靴選び先生" },
  accessorylab: { avatar: "icons/hanako-avatar-accessorylab.png", icon: "icons/icon-accessorylab-192.png", manifest: "manifest-accessorylab.webmanifest", label: "小物研究室" },
  salehunter: { avatar: "icons/hanako-avatar-salehunter.png", icon: "icons/icon-salehunter-192.png", manifest: "manifest-salehunter.webmanifest", label: "セール発掘隊" },
  layering: { avatar: "icons/hanako-avatar-layering.png", icon: "icons/icon-layering-192.png", manifest: "manifest-layering.webmanifest", label: "重ね着先生" },
  formalguest: { avatar: "icons/hanako-avatar-formalguest.png", icon: "icons/icon-formalguest-192.png", manifest: "manifest-formalguest.webmanifest", label: "お呼ばれハナコ" },
  streetstyle: { avatar: "icons/hanako-avatar-streetstyle.png", icon: "icons/icon-streetstyle-192.png", manifest: "manifest-streetstyle.webmanifest", label: "街角スナップ" },
  creatorstudio: { avatar: "icons/hanako-avatar-creatorstudio.png", icon: "icons/icon-creatorstudio-192.png", manifest: "manifest-creatorstudio.webmanifest", label: "撮影スタジオ" },
  ribbonmannequin: { avatar: "icons/hanako-avatar-ribbonmannequin.png", icon: "icons/icon-ribbonmannequin-192.png", manifest: "manifest-ribbonmannequin.webmanifest", label: "リボンマネキン" },
  styletablet: { avatar: "icons/hanako-avatar-styletablet.png", icon: "icons/icon-styletablet-192.png", manifest: "manifest-styletablet.webmanifest", label: "コーデタブレット" },
  magazinestack: { avatar: "icons/hanako-avatar-magazinestack.png", icon: "icons/icon-magazinestack-192.png", manifest: "manifest-magazinestack.webmanifest", label: "ルックブック" },
  jewelhanger: { avatar: "icons/hanako-avatar-jewelhanger.png", icon: "icons/icon-jewelhanger-192.png", manifest: "manifest-jewelhanger.webmanifest", label: "ジュエルハンガー" },
  coordboard: { avatar: "icons/hanako-avatar-coordboard.png", icon: "icons/icon-coordboard-192.png", manifest: "manifest-coordboard.webmanifest", label: "コーデボード" },
  wavebalance: { avatar: "icons/hanako-avatar-wavebalance.png", icon: "icons/icon-wavebalance-192.png", manifest: "manifest-wavebalance.webmanifest", label: "骨格ウェーブ先生" },
  petitebalance: { avatar: "icons/hanako-avatar-petitebalance.png", icon: "icons/icon-petitebalance-192.png", manifest: "manifest-petitebalance.webmanifest", label: "小柄バランス" },
  fabricexpert: { avatar: "icons/hanako-avatar-fabricexpert.png", icon: "icons/icon-fabricexpert-192.png", manifest: "manifest-fabricexpert.webmanifest", label: "素材見極め先生" },
  bagstylist: { avatar: "icons/hanako-avatar-bagstylist.png", icon: "icons/icon-bagstylist-192.png", manifest: "manifest-bagstylist.webmanifest", label: "バッグ合わせ先生" },
  travelpacking: { avatar: "icons/hanako-avatar-travelpacking.png", icon: "icons/icon-travelpacking-192.png", manifest: "manifest-travelpacking.webmanifest", label: "旅行パッキング" },
  photoangle: { avatar: "icons/hanako-avatar-photoangle.png", icon: "icons/icon-photoangle-192.png", manifest: "manifest-photoangle.webmanifest", label: "写真映え先生" },
  temperature: { avatar: "icons/hanako-avatar-temperature.png", icon: "icons/icon-temperature-192.png", manifest: "manifest-temperature.webmanifest", label: "気温別コーデ" },
  datestyle: { avatar: "icons/hanako-avatar-datestyle.png", icon: "icons/icon-datestyle-192.png", manifest: "manifest-datestyle.webmanifest", label: "デート服先生" },
  fabriccare: { avatar: "icons/hanako-avatar-fabriccare.png", icon: "icons/icon-fabriccare-192.png", manifest: "manifest-fabriccare.webmanifest", label: "服のお手入れ" },
  trendcheck: { avatar: "icons/hanako-avatar-trendcheck.png", icon: "icons/icon-trendcheck-192.png", manifest: "manifest-trendcheck.webmanifest", label: "トレンド診断" },
  ribbonresort: { avatar: "icons/hanako-avatar-ribbonresort.png", icon: "icons/hanako-avatar-ribbonresort.png", manifest: "manifest-ribbonresort.webmanifest", label: "リボンリゾート水着" },
  marineswim: { avatar: "icons/hanako-avatar-marineswim.png", icon: "icons/hanako-avatar-marineswim.png", manifest: "manifest-marineswim.webmanifest", label: "マリン水着" },
};
let activePlatform = "Instagram";
let lastGenerated = "";
let lastGenerationContext = null;
let generationVariant = 0;
let roomGenerationVariant = 0;
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
  brief: "ホーム",
  products: "商品を探す・登録",
  generator: "SNS投稿を作る",
  room: "ROOM投稿",
  coordinate: "コーデ作成",
  calendar: "投稿予定",
  connections: "SNS連携",
  analytics: "成果を記録",
};

const profileText = document.querySelector("#profileText");
const productGrid = document.querySelector("#productGrid");
const selectedProduct = document.querySelector("#selectedProduct");
const postOutput = document.querySelector("#postOutput");
const snsGeminiPrompt = document.querySelector("#snsGeminiPrompt");
const snsGeminiCopyPrompt = document.querySelector("#snsGeminiCopyPrompt");
const checklist = document.querySelector("#checklist");
const calendarList = document.querySelector("#calendarList");
const metricList = document.querySelector("#metricList");
const metricSummary = document.querySelector("#metricSummary");
const roomProductSelect = document.querySelector("#roomProductSelect");
const roomPostOutput = document.querySelector("#roomPostOutput");
const roomQueue = document.querySelector("#roomQueue");
const coordinateOutput = document.querySelector("#coordinateOutput");
const coordGeminiPrompt = document.querySelector("#coordGeminiPrompt");
const coordGeminiCaptionPrompt = document.querySelector("#coordGeminiCaptionPrompt");
const coordBoard = document.querySelector("#coordBoard");
const toast = document.querySelector("#toast");
let deferredInstallPrompt = null;
let coordinatePhotoDataUrl = "";
const coordinatePhotoPreviewCache = new Map();
const COORDINATE_PHOTO_CACHE = "hanako-private-photo-previews-v1";
let coordinatePhotoPreviewHydrating = false;
let coordinateBoardDataUrl = "";
let coordinateBoardHasPerson = false;
let coordinateBoardRenderId = 0;
let roomReferenceBoardDataUrl = "";
let roomReferenceBoardHasPerson = false;
let socialReferenceBoardDataUrl = "";
const coordinateImageCache = new Map();
const coordinateProductHydration = new Map();
let currentHanakoComment = "";
let currentHanakoCommentConcern = "";
let recentHanakoComments = [];
let currentCoordinateHandwrittenPoints = new Map();
let socialGeminiGeneratedImageDataUrl = "";
let socialGeminiGeneratedImageExtension = "png";
let socialGeminiAwaitingReturn = false;
let socialGeminiPromptNeedsRefresh = false;
let selectedAiProvider = localStorage.getItem("hanako-ai-provider") === "chatgpt" ? "chatgpt" : "gemini";
let socialHanakoCoverflowScrollTimer = null;
let socialHanakoCoverflowIgnoreUntil = 0;
let hanakoTeacherMode = "random";
let hanakoTeacherCoverflowScrollTimer = null;
let hanakoTeacherCoverflowIgnoreUntil = 0;
const hanakoTeacherGuides = [
  { id: "original", name: "リボンピンクのハナコ", avatar: "icons/hanako-avatar.jpg", tone: "王道かわいいを、分かりやすく解説" },
  { id: "cafe", name: "カフェローズのハナコ", avatar: "icons/hanako-avatar-cafe.png", tone: "やわらかな色合わせを、やさしく解説" },
  { id: "chic", name: "モノトーンのハナコ", avatar: "icons/hanako-avatar-chic.png", tone: "甘さを大人っぽく整えるコツを解説" },
  { id: "lavender", name: "ラベンダーのハナコ", avatar: "icons/hanako-avatar-lavender.png", tone: "淡色コーデのまとまり方を解説" },
  { id: "mint", name: "ミントおでかけのハナコ", avatar: "icons/hanako-avatar-mint.png", tone: "清潔感と抜け感の作り方を解説" },
  { id: "navy", name: "ネイビー上品のハナコ", avatar: "icons/hanako-avatar-navy.png", tone: "高見えするバランスを端的に解説" },
  { id: "strawberry", name: "いちごピーチのハナコ", avatar: "icons/hanako-avatar-strawberry.png", tone: "明るくかわいく、着たくなる理由を解説" },
  { id: "lemon", name: "レモンクリームのハナコ", avatar: "icons/hanako-avatar-lemon.png", tone: "明るい色合わせを、やさしく解説" },
  { id: "aqua", name: "アクアリボンのハナコ", avatar: "icons/hanako-avatar-aqua.png", tone: "さわやかな抜け感を、すっきり解説" },
  { id: "classic", name: "クラシックローズのハナコ", avatar: "icons/hanako-avatar-classic.png", tone: "大人っぽい華やかさを、上品に解説" },
  { id: "office", name: "きれいめOLのハナコ", avatar: "icons/hanako-avatar-office.png", tone: "通勤にも使える上品な着回しを解説" },
  { id: "oshikatsu", name: "推し活ガールのハナコ", avatar: "icons/hanako-avatar-oshikatsu.png", tone: "推し色を大人かわいく取り入れるコツを解説" },
  { id: "campus", name: "キャンパスプレッピーのハナコ", avatar: "icons/hanako-avatar-campus.png", tone: "通学コーデを知的にかわいく解説" },
  { id: "rainy", name: "雨の日ブルーのハナコ", avatar: "icons/hanako-avatar-rainy.png", tone: "雨の日も崩れにくい着こなしを解説" },
  { id: "sakura", name: "桜ピクニックのハナコ", avatar: "icons/hanako-avatar-sakura.png", tone: "春色を甘くなりすぎず整えるコツを解説" },
  { id: "marine", name: "マリンリボンのハナコ", avatar: "icons/hanako-avatar-marine.png", tone: "夏の爽やかな配色と抜け感を解説" },
  { id: "autumn", name: "秋色ブックのハナコ", avatar: "icons/hanako-avatar-autumn.png", tone: "深みカラーを重く見せない方法を解説" },
  { id: "winter", name: "冬ふわピンクのハナコ", avatar: "icons/hanako-avatar-winter.png", tone: "防寒とかわいさを両立する重ね方を解説" },
  { id: "beauty", name: "ビューティーローズのハナコ", avatar: "icons/hanako-avatar-beauty.png", tone: "服とメイクの色を自然につなげて解説" },
  { id: "travelgirl", name: "旅するハナコ", avatar: "icons/hanako-avatar-travelgirl.png", tone: "女子旅で動きやすいきれいめコーデを解説" },
  { id: "sporty", name: "スポーティーなハナコ", avatar: "icons/hanako-avatar-sporty.png", tone: "カジュアルを子どもっぽく見せないコツを解説" },
  { id: "evening", name: "ナイトエレガントのハナコ", avatar: "icons/hanako-avatar-evening.png", tone: "夜のおめかしを上品にまとめるコツを解説" },
  { id: "chocolate", name: "チョコブラウンのハナコ", avatar: "icons/hanako-avatar-chocolate.png", tone: "ブラウンを甘く上品に見せる配色を解説" },
  { id: "florist", name: "フラワーショップのハナコ", avatar: "icons/hanako-avatar-florist.png", tone: "花色を取り入れた優しいコーデを解説" },
  { id: "music", name: "ミュージックのハナコ", avatar: "icons/hanako-avatar-music.png", tone: "リラックス感のある淡色カジュアルを解説" },
  { id: "denim", name: "デニム休日のハナコ", avatar: "icons/hanako-avatar-denim.png", tone: "デニムを甘めきれいめに寄せる方法を解説" },
  { id: "museum", name: "ミュージアムのハナコ", avatar: "icons/hanako-avatar-museum.png", tone: "静かなモノトーンの高見えバランスを解説" },
  { id: "bakery", name: "ベーカリーのハナコ", avatar: "icons/hanako-avatar-bakery.png", tone: "温かみのあるベージュコーデを解説" },
  { id: "resort", name: "リゾートのハナコ", avatar: "icons/hanako-avatar-resort.png", tone: "旅先で映える爽やかな着こなしを解説" },
  { id: "studynight", name: "お勉強ナイトのハナコ", avatar: "icons/hanako-avatar-studynight.png", tone: "夜まで快適な通学コーデを解説" },
  { id: "wamodern", name: "和モダンのハナコ", avatar: "icons/hanako-avatar-wamodern.png", tone: "和の色を今っぽく整えるコツを解説" },
  { id: "holiday", name: "ホリデーのハナコ", avatar: "icons/hanako-avatar-holiday.png", tone: "イベント服を華やかにまとめるコツを解説" },
  { id: "parisienne", name: "パリジェンヌのハナコ", avatar: "icons/hanako-avatar-parisienne.png", tone: "フレンチシックを軽やかに見せるコツを解説" },
  { id: "picnic", name: "ピクニックのハナコ", avatar: "icons/hanako-avatar-picnic.png", tone: "ギンガムを子どもっぽく見せないコツを解説" },
  { id: "balletcore", name: "バレエコアのハナコ", avatar: "icons/hanako-avatar-balletcore.png", tone: "淡いピンクをすっきり着るコツを解説" },
  { id: "cinema", name: "映画館のハナコ", avatar: "icons/hanako-avatar-cinema.png", tone: "深い赤を主役にした夜コーデを解説" },
  { id: "ceramics", name: "陶芸アトリエのハナコ", avatar: "icons/hanako-avatar-ceramics.png", tone: "天然素材を可愛く整えるコツを解説" },
  { id: "gardening", name: "お花ガーデンのハナコ", avatar: "icons/hanako-avatar-gardening.png", tone: "花柄とグリーンを爽やかにまとめるコツを解説" },
  { id: "library", name: "図書館のハナコ", avatar: "icons/hanako-avatar-library.png", tone: "知的なブラウンコーデを重く見せないコツを解説" },
  { id: "seaside", name: "海辺のお嬢さんハナコ", avatar: "icons/hanako-avatar-seaside.png", tone: "水色を上品に見せる夏コーデを解説" },
  { id: "nightout", name: "夜のおでかけハナコ", avatar: "icons/hanako-avatar-nightout.png", tone: "黒を甘く華やかに着るコツを解説" },
  { id: "ribbonlady", name: "リボンレディのハナコ", avatar: "icons/hanako-avatar-ribbonlady.png", tone: "リボンを盛っても上品に見せるコツを解説" },
  { id: "royalgala", name: "ロイヤルガラのハナコ", avatar: "icons/hanako-avatar-royalgala.png", tone: "特別な日の濃色ドレスを上品に見せるコツを解説" },
  { id: "yozakura", name: "夜桜スペシャルのハナコ", avatar: "icons/hanako-avatar-yozakura.png", tone: "夜の桜色を華やかにまとめるコツを解説" },
  { id: "moonlight", name: "月夜のプリンセスハナコ", avatar: "icons/hanako-avatar-moonlight.png", tone: "光る淡色を大人っぽく見せるコツを解説" },
  { id: "anniversaryrose", name: "記念日ローズのハナコ", avatar: "icons/hanako-avatar-anniversaryrose.png", tone: "記念日コーデの盛りすぎない華やかさを解説" },
  { id: "jewelprincess", name: "宝石箱プリンセスハナコ", avatar: "icons/hanako-avatar-jewelprincess.png", tone: "宝石色を主役にする配色のコツを解説" },
  { id: "royalribbon", name: "ロイヤルリボン女王のハナコ", avatar: "icons/hanako-avatar-royalribbon.png", tone: "特別な日の華やかさを、品よくまとめるコツを解説" },
  { id: "grandgala", name: "グランドガラのハナコ", avatar: "icons/hanako-avatar-grandgala.png", tone: "黒とピンクのごほうびコーデを、堂々と着こなす方法を解説" },
  { id: "sakurajewel", name: "桜ジュエル姫のハナコ", avatar: "icons/hanako-avatar-sakurajewel.png", tone: "桜色ときらめきを、大人っぽく見せる配色を解説" },
  { id: "legendteacher", name: "伝説のファッション先生ハナコ", avatar: "icons/hanako-avatar-legendteacher.png", tone: "主役、引き立て役、締め色をズバッと見極めて解説" },
  { id: "celestial", name: "星月夜のスペシャルハナコ", avatar: "icons/hanako-avatar-celestial.png", tone: "深い夜色と淡い光を、華やかに整えるコツを解説" },
  { id: "ribbonresort", name: "リボンリゾートのハナコ先生", avatar: "icons/hanako-avatar-ribbonresort.png", tone: "水着の甘さと羽織りを、上品にまとめるコツを解説" },
  { id: "marineswim", name: "マリン水着のハナコ先生", avatar: "icons/hanako-avatar-marineswim.png", tone: "紺と白で爽やかなリゾートコーデを作る方法を解説" },
  { id: "colorpalette", name: "色合わせ先生のハナコ", avatar: "icons/hanako-avatar-colorpalette.png", tone: "似合う色と顔映りを、迷わず選べるように解説" },
  { id: "wardrobeaudit", name: "クローゼット診断のハナコ", avatar: "icons/hanako-avatar-wardrobeaudit.png", tone: "手持ち服を生かす着回しと買い足し順を解説" },
  { id: "fitcheck", name: "着やせチェックのハナコ", avatar: "icons/hanako-avatar-fitcheck.png", tone: "丈とシルエットで、すっきり見せるコツを解説" },
  { id: "shoeclinic", name: "靴選び先生のハナコ", avatar: "icons/hanako-avatar-shoeclinic.png", tone: "足もとで全身のバランスを整えるコツを解説" },
  { id: "accessorylab", name: "小物研究室のハナコ", avatar: "icons/hanako-avatar-accessorylab.png", tone: "小物を盛りすぎず、華やかに見せるコツを解説" },
  { id: "salehunter", name: "セール発掘隊のハナコ", avatar: "icons/hanako-avatar-salehunter.png", tone: "安さだけで選ばず、長く使える一着を見抜いて解説" },
  { id: "layering", name: "重ね着先生のハナコ", avatar: "icons/hanako-avatar-layering.png", tone: "着ぶくれしない重ね方と色のつなぎ方を解説" },
  { id: "formalguest", name: "お呼ばれハナコ", avatar: "icons/hanako-avatar-formalguest.png", tone: "きちんと感と華やかさを両立する方法を解説" },
  { id: "streetstyle", name: "街角スナップのハナコ", avatar: "icons/hanako-avatar-streetstyle.png", tone: "写真映えする主役と抜け感の作り方を解説" },
  { id: "creatorstudio", name: "撮影スタジオのハナコ", avatar: "icons/hanako-avatar-creatorstudio.png", tone: "商品の魅力が伝わる並べ方と見せ場を解説" },
  { id: "wavebalance", name: "骨格ウェーブ先生のハナコ", avatar: "icons/hanako-avatar-wavebalance.png", tone: "重心を上げて、やわらかな体型をきれいに見せるコツを解説" },
  { id: "petitebalance", name: "小柄バランスのハナコ", avatar: "icons/hanako-avatar-petitebalance.png", tone: "丈と小物の大きさで、すらりと見せる方法を解説" },
  { id: "fabricexpert", name: "素材見極め先生のハナコ", avatar: "icons/hanako-avatar-fabricexpert.png", tone: "生地の質感から、高見えする組み合わせを解説" },
  { id: "bagstylist", name: "バッグ合わせ先生のハナコ", avatar: "icons/hanako-avatar-bagstylist.png", tone: "服の甘さとバッグの形を自然につなぐコツを解説" },
  { id: "travelpacking", name: "旅行パッキングのハナコ", avatar: "icons/hanako-avatar-travelpacking.png", tone: "少ない服で着回せる、旅コーデの組み方を解説" },
  { id: "photoangle", name: "写真映え先生のハナコ", avatar: "icons/hanako-avatar-photoangle.png", tone: "服がきれいに見える角度とポーズをやさしく解説" },
  { id: "temperature", name: "気温別コーデのハナコ", avatar: "icons/hanako-avatar-temperature.png", tone: "寒暖差に対応しながら、かわいさを保つ重ね方を解説" },
  { id: "datestyle", name: "デート服先生のハナコ", avatar: "icons/hanako-avatar-datestyle.png", tone: "頑張りすぎず、好印象に見える甘さを解説" },
  { id: "fabriccare", name: "服のお手入れ先生のハナコ", avatar: "icons/hanako-avatar-fabriccare.png", tone: "お気に入りを長くきれいに着るお手入れ方法を解説" },
  { id: "trendcheck", name: "トレンド診断のハナコ", avatar: "icons/hanako-avatar-trendcheck.png", tone: "流行を盛りすぎず、自分らしく取り入れる方法を解説" },
];
let currentHanakoTeacher = hanakoTeacherGuides[0];
let socialHanakoTeacherMode = "random";
let currentSocialHanakoTeacher = hanakoTeacherGuides[0];
let currentSocialHanakoComment = "";
let recentSocialHanakoComments = [];

queueMicrotask(initialize);

function initialize() {
  const syncAppVersion = document.querySelector("#syncAppVersion");
  if (syncAppVersion) syncAppVersion.textContent = APP_VERSION === "開発版" ? APP_VERSION : `v${APP_VERSION}`;
  document.querySelector("#forceAppUpdate")?.addEventListener("click", forceAppUpdate);
  profileText.value = state.profile || defaultProfile;
  document.querySelector('input[name="date"]').valueAsDate = new Date();
  hydrateCustomBrandAssets();
  applyAppearance();
  bindAppearancePicker();
  bindAiProviderSelectors();
  bindHomeAvatarCoverflow();
  registerPwa();
  checkPublishedAppVersion();
  bindNavigation();
  bindForms();
  bindActions();
  bindPhase2Actions();
  bindPhase3Actions();
  bindPhase4Actions();
  bindCloudSync();
  renderProducts();
  renderDailySelection();
  renderOpsPipeline();
  renderProductOptions();
  restoreGeneratorPreferences();
  renderRoomProductOptions();
  renderCoordinateOptions();
  renderCoordinatePhotoLibrary();
  refreshCoordinatePhotoLibraryUrls();
  renderRoomQueue();
  renderCalendar();
  renderMetrics();
  renderPhase2Panels();
  renderAiAgentDashboard();
  ensurePhase4DailyRun();
  renderAiLearningDashboard();
  renderLearningHint();
  renderChecks("");
  renderHome();
}

function getSelectedAiName() {
  return selectedAiProvider === "chatgpt" ? "ChatGPT" : "Gemini";
}

function adaptPromptToSelectedAi(value) {
  return String(value || "").replace(/Gemini|ChatGPT/g, getSelectedAiName());
}

function bindAiProviderSelectors() {
  const selectors = document.querySelectorAll(".ai-provider-select");
  selectors.forEach((select) => {
    select.value = selectedAiProvider;
    select.addEventListener("change", () => {
      selectedAiProvider = select.value === "chatgpt" ? "chatgpt" : "gemini";
      localStorage.setItem("hanako-ai-provider", selectedAiProvider);
      selectors.forEach((item) => { item.value = selectedAiProvider; });
      [coordGeminiPrompt, coordGeminiCaptionPrompt, snsGeminiPrompt, snsGeminiCopyPrompt, document.querySelector("#roomImagePrompt")]
        .filter(Boolean)
        .forEach((output) => { output.value = adaptPromptToSelectedAi(output.value); });
      showToast(`${getSelectedAiName()}を使う設定にしました`);
    });
  });
}

function bindAppearancePicker() {
  document.querySelectorAll("[data-avatar-theme]").forEach((button) => {
    button.addEventListener("click", () => {
      selectAppearanceTheme(button.dataset.avatarTheme);
    });
  });
  document.querySelector("#customAvatarInput")?.addEventListener("change", uploadCustomAvatar);
  document.querySelector("#customCoverInput")?.addEventListener("change", uploadCustomCover);
  document.querySelector("#resetCustomBrand")?.addEventListener("click", resetCustomBrandAssets);
}

function selectAppearanceTheme(themeName, scrollCoverflow = true) {
  if (!avatarThemes[themeName]) return;
  if (themeName === "custom" && !state.appearance?.customAvatar) return;
  state.appearance = { ...state.appearance, avatarTheme: themeName };
  applyAppearance();
  saveState();
  syncHomeAvatarCoverflow(scrollCoverflow);
  showToast(`${avatarThemes[themeName].label}に着替えました`);
}

function applyAppearance() {
  hydrateCustomBrandAssets();
  const themeName = avatarThemes[state.appearance?.avatarTheme] ? state.appearance.avatarTheme : "original";
  const theme = avatarThemes[themeName];
  state.appearance ||= {};
  state.appearance.avatarTheme = themeName;

  document.querySelectorAll("[data-app-avatar]").forEach((image) => {
    image.src = theme.avatar;
  });
  document.querySelectorAll("[data-avatar-theme]").forEach((button) => {
    const selected = button.dataset.avatarTheme === themeName;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-checked", String(selected));
  });
  syncHomeAvatarCoverflow(false);
  if (socialHanakoTeacherMode === "appearance") {
    resolveSocialHanakoTeacher(false);
    updateSocialHanakoTeacherPreview();
  }
  syncSocialHanakoTeacherCoverflow(false);

  const manifestLink = document.querySelector("#appManifestLink");
  const favicon = document.querySelector("#appFavicon");
  const appleTouchIcon = document.querySelector("#appleTouchIcon");
  if (manifestLink) manifestLink.href = theme.manifest;
  if (favicon) favicon.href = theme.icon;
  if (appleTouchIcon) appleTouchIcon.href = theme.icon;

  if (hanakoTeacherMode === "appearance") {
    currentHanakoTeacher = hanakoTeacherGuides.find((guide) => guide.id === themeName)
      || (themeName === "custom" ? {
        id: "custom",
        name: "自作アイコンのハナコ先生",
        avatar: theme.avatar,
        tone: "自分で選んだアイコンでコーデを解説",
      } : hanakoTeacherGuides[0]);
    updateHanakoTeacherPreview();
    if (coordinateOutput?.value.trim() && isHanakoTeacherPattern()) {
      const coordinate = getSelectedCoordinate();
      drawCoordinateBoard(coordinate, coordinateOutput.value);
    }
  }
}

function hydrateCustomBrandAssets() {
  state.appearance ||= { avatarTheme: "original" };
  const customAvatar = state.appearance.customAvatar || "";
  const customCover = state.appearance.customCover || "";
  const customChoice = document.querySelector("#customAvatarChoice");
  const customPreview = document.querySelector("#customAvatarPreview");
  const homeCover = document.querySelector("#homeCoverImage");
  const status = document.querySelector("#customBrandStatus");

  avatarThemes.custom.avatar = customAvatar || "icons/hanako-avatar.jpg";
  avatarThemes.custom.icon = customAvatar || "icons/icon-192.png";
  if (customChoice) customChoice.hidden = !customAvatar;
  if (customPreview) customPreview.src = avatarThemes.custom.avatar;
  if (homeCover) homeCover.src = customCover || "covers/rakuten-room-cover-hanako-v5.jpg";
  if (status) {
    const saved = [customAvatar && "アイコン", customCover && "カバー"].filter(Boolean);
    status.textContent = saved.length ? `${saved.join("と")}を自作画像に設定中です。` : "画像を選ぶと、この端末と同期データへ保存されます。";
  }
}

async function uploadCustomAvatar(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    validateCustomImage(file);
    const dataUrl = await resizeCustomImage(file, 512, 512);
    state.appearance = { ...state.appearance, customAvatar: dataUrl, avatarTheme: "custom" };
    hydrateCustomBrandAssets();
    applyAppearance();
    saveState();
    renderHomeAvatarCoverflow();
    syncHanakoTeacherCoverflow(false);
    showToast("自作アイコンを設定しました");
  } catch (error) {
    showToast(error.message || "アイコン画像を読み込めませんでした");
  } finally {
    event.target.value = "";
  }
}

async function uploadCustomCover(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    validateCustomImage(file);
    state.appearance = { ...state.appearance, customCover: await resizeCustomImage(file, 1600, 562) };
    hydrateCustomBrandAssets();
    saveState();
    showToast("自作カバーを設定しました");
  } catch (error) {
    showToast(error.message || "カバー画像を読み込めませんでした");
  } finally {
    event.target.value = "";
  }
}

function validateCustomImage(file) {
  if (!file.type.startsWith("image/")) throw new Error("画像ファイルを選んでください");
  if (file.size > 15 * 1024 * 1024) throw new Error("画像は15MB以下にしてください");
}

async function resizeCustomImage(file, targetWidth, targetHeight) {
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  drawCoverImage(ctx, image, 0, 0, targetWidth, targetHeight, 0);
  return canvas.toDataURL("image/jpeg", targetWidth === targetHeight ? 0.9 : 0.86);
}

function resetCustomBrandAssets() {
  state.appearance ||= {};
  delete state.appearance.customAvatar;
  delete state.appearance.customCover;
  if (state.appearance.avatarTheme === "custom") state.appearance.avatarTheme = "original";
  hydrateCustomBrandAssets();
  applyAppearance();
  saveState();
  renderHomeAvatarCoverflow();
  syncHanakoTeacherCoverflow(false);
  showToast("自作画像を外しました");
}

function bindHomeAvatarCoverflow() {
  const coverflow = document.querySelector("#homeAvatarCoverflow");
  if (!coverflow || coverflow.dataset.bound === "true") return;
  coverflow.dataset.bound = "true";
  coverflow.addEventListener("click", (event) => {
    const card = event.target.closest("[data-home-avatar-theme]");
    if (card) selectAppearanceTheme(card.dataset.homeAvatarTheme, false);
  });
  coverflow.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    stepHomeAvatarCoverflow(event.key === "ArrowRight" ? 1 : -1);
  });
  coverflow.addEventListener("scroll", () => window.requestAnimationFrame(paintHomeAvatarCoverflow), { passive: true });
  document.querySelector("#homeAvatarCoverflowPrev")?.addEventListener("click", () => stepHomeAvatarCoverflow(-1));
  document.querySelector("#homeAvatarCoverflowNext")?.addEventListener("click", () => stepHomeAvatarCoverflow(1));
  window.addEventListener("resize", paintHomeAvatarCoverflow, { passive: true });
  renderHomeAvatarCoverflow();
}

function renderHomeAvatarCoverflow() {
  const coverflow = document.querySelector("#homeAvatarCoverflow");
  if (!coverflow) return;
  const items = [...document.querySelectorAll("#avatarPicker [data-avatar-theme]")]
    .map((button) => button.dataset.avatarTheme)
    .filter((themeName) => themeName !== "custom" || Boolean(state.appearance?.customAvatar))
    .filter((themeName, index, values) => avatarThemes[themeName] && values.indexOf(themeName) === index)
    .map((themeName) => ({ id: themeName, ...avatarThemes[themeName] }));
  coverflow.innerHTML = items.map((item) => `
    <button class="teacher-coverflow-card home-avatar-coverflow-card" type="button" role="option" aria-selected="false" data-home-avatar-theme="${item.id}" title="${escapeHtml(item.label)}">
      <span class="teacher-coverflow-image-wrap"><img src="${item.avatar}" alt=""></span>
      <strong>${escapeHtml(item.label)}</strong>
    </button>`).join("");
  syncHomeAvatarCoverflow(true);
}

function syncHomeAvatarCoverflow(scrollSelected = false) {
  const coverflow = document.querySelector("#homeAvatarCoverflow");
  if (!coverflow) return;
  const selectedId = state.appearance?.avatarTheme || "original";
  coverflow.querySelectorAll("[data-home-avatar-theme]").forEach((card) => {
    const selected = card.dataset.homeAvatarTheme === selectedId;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-selected", String(selected));
  });
  paintHomeAvatarCoverflow();
  if (scrollSelected) {
    const selectedCard = coverflow.querySelector(`[data-home-avatar-theme="${selectedId}"]`);
    selectedCard?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }
}

function stepHomeAvatarCoverflow(direction) {
  const coverflow = document.querySelector("#homeAvatarCoverflow");
  if (!coverflow) return;
  const cards = [...coverflow.querySelectorAll("[data-home-avatar-theme]")];
  if (!cards.length) return;
  const selectedId = state.appearance?.avatarTheme || "original";
  const currentIndex = Math.max(0, cards.findIndex((card) => card.dataset.homeAvatarTheme === selectedId));
  const nextIndex = (currentIndex + direction + cards.length) % cards.length;
  selectAppearanceTheme(cards[nextIndex].dataset.homeAvatarTheme, true);
}

function paintHomeAvatarCoverflow() {
  const coverflow = document.querySelector("#homeAvatarCoverflow");
  if (!coverflow) return;
  const center = coverflow.getBoundingClientRect().left + coverflow.clientWidth / 2;
  coverflow.querySelectorAll("[data-home-avatar-theme]").forEach((card) => {
    const bounds = card.getBoundingClientRect();
    const offset = (bounds.left + bounds.width / 2 - center) / Math.max(bounds.width, 1);
    const distance = Math.min(3, Math.abs(offset));
    card.style.setProperty("--cover-rotate", `${offset * -22}deg`);
    card.style.setProperty("--cover-scale", String(Math.max(0.74, 1 - distance * 0.15)));
    card.style.setProperty("--cover-opacity", String(Math.max(0.5, 1 - distance * 0.2)));
    card.style.setProperty("--cover-z", String(Math.round(20 - distance * 5)));
  });
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
    return normalizeState(JSON.parse(saved));
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

function normalizeState(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    ...source,
    profile: typeof source.profile === "string" ? migrateProfileText(source.profile) : defaultProfile,
    products: Array.isArray(source.products) ? source.products.filter((item) => item && typeof item === "object") : [],
    drafts: Array.isArray(source.drafts) ? source.drafts : [],
    calendar: Array.isArray(source.calendar) ? source.calendar : [],
    metrics: Array.isArray(source.metrics) ? source.metrics : [],
    roomQueue: Array.isArray(source.roomQueue) ? source.roomQueue : [],
    roomCollectionDrafts: Array.isArray(source.roomCollectionDrafts) ? source.roomCollectionDrafts : [],
    coordinatePhotos: Array.isArray(source.coordinatePhotos) ? source.coordinatePhotos : [],
    appearance: source.appearance && typeof source.appearance === "object" ? source.appearance : { avatarTheme: "original" },
    collections: Array.isArray(source.collections) ? source.collections : [],
    dailySelections: Array.isArray(source.dailySelections) ? source.dailySelections : [],
    postPlans: Array.isArray(source.postPlans) ? source.postPlans : [],
    posts: Array.isArray(source.posts) ? source.posts : [],
    userDecisions: Array.isArray(source.userDecisions) ? source.userDecisions : [],
    duplicateMatches: Array.isArray(source.duplicateMatches) ? source.duplicateMatches : [],
    collectionRuleVersions: Array.isArray(source.collectionRuleVersions) ? source.collectionRuleVersions : [],
    collectionMemberships: Array.isArray(source.collectionMemberships) ? source.collectionMemberships : [],
    collectionBalanceSnapshots: Array.isArray(source.collectionBalanceSnapshots) ? source.collectionBalanceSnapshots : [],
    postSimilarities: Array.isArray(source.postSimilarities) ? source.postSimilarities : [],
    decisionInboxItems: Array.isArray(source.decisionInboxItems) ? source.decisionInboxItems : [],
    csvImports: Array.isArray(source.csvImports) ? source.csvImports : [],
    csvColumnMappings: Array.isArray(source.csvColumnMappings) ? source.csvColumnMappings : [],
    csvImportRows: Array.isArray(source.csvImportRows) ? source.csvImportRows : [],
    salesResults: Array.isArray(source.salesResults) ? source.salesResults : [],
    salesAttributions: Array.isArray(source.salesAttributions) ? source.salesAttributions : [],
    performanceAggregates: Array.isArray(source.performanceAggregates) ? source.performanceAggregates : [],
    scoreAdjustments: Array.isArray(source.scoreAdjustments) ? source.scoreAdjustments : [],
    weeklyInsights: Array.isArray(source.weeklyInsights) ? source.weeklyInsights : [],
    ruleConflicts: Array.isArray(source.ruleConflicts) ? source.ruleConflicts : [],
    automationDecisions: Array.isArray(source.automationDecisions) ? source.automationDecisions : [],
    aiProductEvaluations: Array.isArray(source.aiProductEvaluations) ? source.aiProductEvaluations : [],
    aiPostPlans: Array.isArray(source.aiPostPlans) ? source.aiPostPlans : [],
    aiImageJobs: Array.isArray(source.aiImageJobs) ? source.aiImageJobs : [],
    aiCopyBundles: Array.isArray(source.aiCopyBundles) ? source.aiCopyBundles : [],
    aiCollectionSuggestions: Array.isArray(source.aiCollectionSuggestions) ? source.aiCollectionSuggestions : [],
    aiRepostSuggestions: Array.isArray(source.aiRepostSuggestions) ? source.aiRepostSuggestions : [],
    aiSalesInsights: Array.isArray(source.aiSalesInsights) ? source.aiSalesInsights : [],
    aiImprovementReports: Array.isArray(source.aiImprovementReports) ? source.aiImprovementReports : [],
    aiSchedulePlans: Array.isArray(source.aiSchedulePlans) ? source.aiSchedulePlans : [],
    aiAssistantMessages: Array.isArray(source.aiAssistantMessages) ? source.aiAssistantMessages : [],
    aiAgentRuns: Array.isArray(source.aiAgentRuns) ? source.aiAgentRuns : [],
    aiLearningProfile: source.aiLearningProfile && typeof source.aiLearningProfile === "object" ? source.aiLearningProfile : {},
    aiLearningEvents: Array.isArray(source.aiLearningEvents) ? source.aiLearningEvents : [],
    aiDailyRetrospectives: Array.isArray(source.aiDailyRetrospectives) ? source.aiDailyRetrospectives : [],
    aiImprovementPlans: Array.isArray(source.aiImprovementPlans) ? source.aiImprovementPlans : [],
    aiWeightProposals: Array.isArray(source.aiWeightProposals) ? source.aiWeightProposals : [],
    aiWinPatterns: Array.isArray(source.aiWinPatterns) ? source.aiWinPatterns : [],
    aiLosePatterns: Array.isArray(source.aiLosePatterns) ? source.aiLosePatterns : [],
    aiExperimentPlans: Array.isArray(source.aiExperimentPlans) ? source.aiExperimentPlans : [],
    aiBrandKnowledge: Array.isArray(source.aiBrandKnowledge) ? source.aiBrandKnowledge : [],
    aiBackgroundKnowledge: Array.isArray(source.aiBackgroundKnowledge) ? source.aiBackgroundKnowledge : [],
    aiCopyKnowledge: Array.isArray(source.aiCopyKnowledge) ? source.aiCopyKnowledge : [],
    aiImageKnowledge: Array.isArray(source.aiImageKnowledge) ? source.aiImageKnowledge : [],
    aiSimulations: Array.isArray(source.aiSimulations) ? source.aiSimulations : [],
    aiWeeklyMeetings: Array.isArray(source.aiWeeklyMeetings) ? source.aiWeeklyMeetings : [],
    aiMonthlyMeetings: Array.isArray(source.aiMonthlyMeetings) ? source.aiMonthlyMeetings : [],
    aiKnowledgeBase: Array.isArray(source.aiKnowledgeBase) ? source.aiKnowledgeBase : [],
    aiPhase4Runs: Array.isArray(source.aiPhase4Runs) ? source.aiPhase4Runs : [],
    jobRuns: Array.isArray(source.jobRuns) ? source.jobRuns : [],
    errorLogs: Array.isArray(source.errorLogs) ? source.errorLogs : [],
  };
}

function ensureOpsState(target = state) {
  target.collections ||= window.HanakoOpsEngine?.defaultCollections?.() || [];
  target.dailySelections ||= [];
  target.postPlans ||= [];
  target.posts ||= [];
  target.roomCollectionDrafts ||= [];
  target.userDecisions ||= [];
  target.duplicateMatches ||= [];
  target.collectionRuleVersions ||= [];
  target.collectionMemberships ||= [];
  target.collectionBalanceSnapshots ||= [];
  target.postSimilarities ||= [];
  target.decisionInboxItems ||= [];
  target.csvImports ||= [];
  target.csvColumnMappings ||= [];
  target.csvImportRows ||= [];
  target.salesResults ||= [];
  target.salesAttributions ||= [];
  target.performanceAggregates ||= [];
  target.scoreAdjustments ||= [];
  target.weeklyInsights ||= [];
  target.ruleConflicts ||= [];
  target.automationDecisions ||= [];
  target.aiProductEvaluations ||= [];
  target.aiPostPlans ||= [];
  target.aiImageJobs ||= [];
  target.aiCopyBundles ||= [];
  target.aiCollectionSuggestions ||= [];
  target.aiRepostSuggestions ||= [];
  target.aiSalesInsights ||= [];
  target.aiImprovementReports ||= [];
  target.aiSchedulePlans ||= [];
  target.aiAssistantMessages ||= [];
  target.aiAgentRuns ||= [];
  target.aiLearningProfile ||= {};
  target.aiLearningEvents ||= [];
  target.aiDailyRetrospectives ||= [];
  target.aiImprovementPlans ||= [];
  target.aiWeightProposals ||= [];
  target.aiWinPatterns ||= [];
  target.aiLosePatterns ||= [];
  target.aiExperimentPlans ||= [];
  target.aiBrandKnowledge ||= [];
  target.aiBackgroundKnowledge ||= [];
  target.aiCopyKnowledge ||= [];
  target.aiImageKnowledge ||= [];
  target.aiSimulations ||= [];
  target.aiWeeklyMeetings ||= [];
  target.aiMonthlyMeetings ||= [];
  target.aiKnowledgeBase ||= [];
  target.aiPhase4Runs ||= [];
  target.jobRuns ||= [];
  target.errorLogs ||= [];
  if (window.HanakoPhase2Engine) {
    target.collections = window.HanakoPhase2Engine.defaultCollectionRules(target.collections);
  }
  target.products = (target.products || []).map((product) => enrichProductForOps(product));
  return target;
}

function enrichProductForOps(product) {
  if (!product || !window.HanakoOpsEngine?.enrichProduct) return product;
  const enriched = window.HanakoOpsEngine.enrichProduct(product);
  return {
    ...product,
    ops: {
      ...(product.ops || {}),
      source: enriched.source,
      shopCode: enriched.shopCode,
      itemCode: enriched.itemCode,
      normalizedUrl: enriched.normalizedUrl,
      canonicalProductId: enriched.canonicalProductId,
      productFamilyId: enriched.productFamilyId,
      normalizedProductName: enriched.normalizedProductName,
      modelNumber: enriched.modelNumber,
      janCode: enriched.janCode,
      color: enriched.color,
      size: enriched.size,
      canonicalConfidence: enriched.canonicalConfidence,
    },
    details: {
      ...(product.details || {}),
      brand: enriched.brand || product.details?.brand || "",
      color: enriched.color || product.details?.color || "",
      size: enriched.size || product.details?.size || "",
    },
  };
}

function migrateProfileText(profile) {
  return String(profile || "")
    .replace(/^🍛[^\n]*渋谷[^\n]*グルメ[^\n]*$/gm, "🌍 海外旅行好き｜95か国を旅して世界の可愛いを発掘");
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
  document.querySelector("#homeNextActionButton")?.addEventListener("click", (event) => {
    activateView(event.currentTarget.dataset.target || "products");
  });
  document.querySelector("#homeBuildPlan")?.addEventListener("click", addHomeSmartPlan);
  bindHomeActionHub();
}

function bindHomeActionHub() {
  document.querySelector("#homeRunAiAgent")?.addEventListener("click", () => {
    const runButton = document.querySelector("#runAiAgent");
    if (runButton) runButton.click();
  });
  document.querySelector("#homeOpenRoom")?.addEventListener("click", () => activateView("room"));
  document.querySelector("#homeOpenCoordinateMaker")?.addEventListener("click", () => {
    activateView("coordinate");
    window.setTimeout(() => {
      document.querySelector("#coordinate")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  });
  document.querySelector("#homeRunLearningCycle")?.addEventListener("click", () => {
    const runButton = document.querySelector("#runAiLearningCycle");
    if (runButton) runButton.click();
  });
}

function activateView(viewName) {
  const nextView = document.querySelector(`#${viewName}`);
  const nextTab = document.querySelector(`.nav-tab[data-view="${viewName}"]`);
  if (!nextView || !nextTab) return;
  document.querySelectorAll(".nav-tab").forEach((item) => {
    item.classList.remove("active");
    item.removeAttribute("aria-current");
  });
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  nextTab.classList.add("active");
  nextTab.setAttribute("aria-current", "page");
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
  renderHomeCommandCenter();
}

function getLatestDailySelection() {
  state.dailySelections ||= [];
  return state.dailySelections[0] || null;
}

function runDailySelection({ sourceFailed = false } = {}) {
  ensureOpsState();
  const selection = window.HanakoOpsEngine.buildDailySelection({
    products: state.products,
    posts: buildOpsPostHistory(),
    metrics: state.metrics,
    collections: state.collections,
    today: new Date(),
    sourceFailed,
  });
  state.dailySelections = [
    selection,
    ...(state.dailySelections || []).filter((item) => item.selectionDate !== selection.selectionDate),
  ].slice(0, 14);
  saveUserDecision("DailySelection", selection.id, "run", null, {
    sourceCount: selection.sourceCount,
    candidateCount: selection.candidateCount,
    visibleCount: selection.visibleCount,
  }, sourceFailed ? "API失敗時フォールバック" : "手動実行");
  runPhase2AutomationJobs("daily-selection");
  saveState();
  renderDailySelection();
  renderOpsPipeline();
  renderPhase2Panels();
  showToast(`Sランク${selection.visibleCount}件に絞りました`);
}

function buildOpsPostHistory() {
  const explicitPosts = (state.posts || []).map((post) => ({ ...post }));
  const roomPosts = (state.roomQueue || [])
    .filter((item) => item.done)
    .map((item) => {
      const product = state.products.find((entry) => entry.id === item.productId);
      return {
        id: item.id,
        productId: item.productId,
        canonicalProductId: product?.ops?.canonicalProductId || item.productId,
        brand: product?.details?.brand || "",
        category: product?.category || "",
        color: product?.details?.color || product?.ops?.color || "",
        copyText: item.copy || "",
        collectionIds: item.collectionIds || [],
        postedAt: item.postedAt || item.createdAt || item.updatedAt || new Date().toISOString(),
        sales: item.sales || 0,
      };
    });
  const calendarPosts = (state.calendar || [])
    .filter((item) => item.done && item.productId)
    .map((item) => {
      const product = state.products.find((entry) => entry.id === item.productId);
      return {
        id: item.id,
        productId: item.productId,
        canonicalProductId: product?.ops?.canonicalProductId || item.productId,
        brand: product?.details?.brand || "",
        category: product?.category || "",
        color: product?.details?.color || product?.ops?.color || "",
        copyText: item.copy || "",
        postedAt: item.date ? `${item.date}T00:00:00.000Z` : new Date().toISOString(),
        sales: 0,
      };
    });
  return [...explicitPosts, ...roomPosts, ...calendarPosts];
}

function renderDailySelection(showAll = false) {
  const grid = document.querySelector("#dailySelectionGrid");
  const kpiGrid = document.querySelector("#opsKpiGrid");
  if (!grid || !kpiGrid) return;
  const selection = getLatestDailySelection();
  if (!selection) {
    kpiGrid.innerHTML = [
      ["候補", state.products.length],
      ["初期表示", "未作成"],
      ["重複防止", "未計測"],
      ["削減率", "未計測"],
    ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
    grid.innerHTML = `<div class="ops-empty"><strong>今朝のおすすめは未作成です</strong><p>「今朝のおすすめを作る」を押すと、登録済み商品からSランクだけを表示します。</p></div>`;
    return;
  }
  const items = (showAll ? selection.items : selection.visibleItems)
    .filter((item) => item.decision !== "excluded")
    .slice(0, showAll ? 200 : 30);
  kpiGrid.innerHTML = [
    ["収集候補", selection.sourceCount],
    ["保存候補", selection.candidateCount],
    ["確認対象", items.length],
    ["削減率", `${selection.kpis?.expectedReviewReductionRate || 0}%`],
    ["重複防止", selection.kpis?.duplicatePrevented || 0],
    ["状態", selection.job?.status === "fallback" ? "前回/手動データ" : "最新"],
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
  if (!items.length) {
    grid.innerHTML = `<div class="ops-empty"><strong>表示できる候補がありません</strong><p>商品を登録するか、候補200表示で除外済み商品を確認してください。</p></div>`;
    return;
  }
  grid.innerHTML = items.map((item) => renderDailySelectionCard(item)).join("");
  bindDailySelectionCardActions(grid);
}

function renderDailySelectionCard(item) {
  const saleReasons = item.salePotentialBreakdown?.factors || [];
  const operationReasons = item.operationPriorityBreakdown?.factors || [];
  const collections = item.recommendedCollections || [];
  const missing = item.missingItems || [];
  return `
    <article class="daily-card rank-${escapeHtml(item.rank)}" data-daily-product="${escapeHtml(item.id)}" data-canonical="${escapeHtml(item.canonicalProductId)}">
      <label class="daily-card-check"><input type="checkbox" data-daily-select="${escapeHtml(item.id)}"><span>${escapeHtml(item.rank)}</span></label>
      ${item.mainImageUrl ? `<img src="${escapeHtml(item.mainImageUrl)}" alt="">` : `<div class="daily-placeholder">品</div>`}
      <div class="daily-card-body">
        <div class="daily-title-row">
          <h4>${escapeHtml(item.name || "商品名未設定")}</h4>
          <button type="button" data-daily-detail="${escapeHtml(item.id)}">理由</button>
        </div>
        <p>${escapeHtml([item.brand, item.category, item.price].filter(Boolean).join(" / "))}</p>
        <div class="daily-score-row">
          <span>売れやすさ <strong>${item.salePotentialScore}</strong></span>
          <span>運用優先 <strong>${item.operationPriorityScore}</strong></span>
          <span class="repost-state">${escapeHtml(item.repost?.status || "投稿可能")}</span>
        </div>
        <div class="daily-collections">
          ${collections.map((collection) => `<span>${escapeHtml(collection.name)} ${collection.score}</span>`).join("") || "<span>未分類</span>"}
        </div>
        <details class="daily-reasons">
          <summary>加点・注意理由を見る</summary>
          <div class="daily-reason-columns">
            <div><strong>加点</strong>${saleReasons.slice(0, 4).map((reason) => `<p>+${reason.points} ${escapeHtml(reason.label)}</p>`).join("")}</div>
            <div><strong>運用</strong>${operationReasons.slice(0, 4).map((reason) => `<p>+${reason.points} ${escapeHtml(reason.label)}</p>`).join("")}</div>
            <div><strong>注意</strong><p>${escapeHtml(item.repost?.reason || "問題なし")}</p><p>${escapeHtml(missing.length ? `不足: ${missing.join(" / ")}` : "不足なし")}</p></div>
          </div>
        </details>
        <div class="daily-actions">
          <button class="primary" type="button" data-daily-adopt="${escapeHtml(item.id)}">採用</button>
          <button type="button" data-daily-image="${escapeHtml(item.id)}">画像生成へ</button>
          <button type="button" data-daily-room="${escapeHtml(item.id)}">ROOM文へ</button>
          <button type="button" data-daily-hold="${escapeHtml(item.id)}">保留</button>
          <button type="button" data-daily-exclude="${escapeHtml(item.id)}">除外</button>
        </div>
      </div>
    </article>`;
}

function bindDailySelectionCardActions(root) {
  root.querySelectorAll("[data-daily-adopt]").forEach((button) => button.addEventListener("click", () => setDailyDecision(button.dataset.dailyAdopt, "adopted")));
  root.querySelectorAll("[data-daily-exclude]").forEach((button) => button.addEventListener("click", () => setDailyDecision(button.dataset.dailyExclude, "excluded")));
  root.querySelectorAll("[data-daily-hold]").forEach((button) => button.addEventListener("click", () => setDailyDecision(button.dataset.dailyHold, "held")));
  root.querySelectorAll("[data-daily-image]").forEach((button) => button.addEventListener("click", () => sendProductToPipeline(button.dataset.dailyImage, "画像待ち")));
  root.querySelectorAll("[data-daily-room]").forEach((button) => button.addEventListener("click", () => sendProductToRoomQueue(button.dataset.dailyRoom)));
  root.querySelectorAll("[data-daily-detail]").forEach((button) => button.addEventListener("click", () => showDailyDetail(button.dataset.dailyDetail)));
}

function bindOpsActions() {
  if (document.body.dataset.opsBound === "true") return;
  document.body.dataset.opsBound = "true";
  document.querySelector("#runDailySelection")?.addEventListener("click", () => runDailySelection());
  document.querySelector("#showAllDailyCandidates")?.addEventListener("click", () => renderDailySelection(true));
  document.querySelector("#selectAllDailyVisible")?.addEventListener("change", (event) => {
    document.querySelectorAll("#dailySelectionGrid [data-daily-select]").forEach((input) => { input.checked = event.target.checked; });
  });
  document.querySelector("#bulkAdoptDaily")?.addEventListener("click", () => bulkDailyAction((id) => setDailyDecision(id, "adopted", false), "採用しました"));
  document.querySelector("#bulkExcludeDaily")?.addEventListener("click", () => bulkDailyAction((id) => setDailyDecision(id, "excluded", false), "除外しました"));
  document.querySelector("#bulkSendImageQueue")?.addEventListener("click", () => bulkDailyAction((id) => sendProductToPipeline(id, "画像待ち", false), "画像生成キューへ送りました"));
  document.querySelector("#bulkSendRoomQueue")?.addEventListener("click", () => bulkDailyAction((id) => sendProductToRoomQueue(id, false), "ROOM文生成へ送りました"));
}

function selectedDailyIds() {
  return [...document.querySelectorAll("#dailySelectionGrid [data-daily-select]:checked")].map((input) => input.dataset.dailySelect);
}

function bulkDailyAction(callback, message) {
  const ids = selectedDailyIds();
  if (!ids.length) return showToast("先に商品を選択してください");
  ids.forEach(callback);
  saveState();
  renderDailySelection();
  renderOpsPipeline();
  renderRoomQueue();
  showToast(`${ids.length}件を${message}`);
}

function setDailyDecision(productId, decision, shouldSave = true) {
  const selection = getLatestDailySelection();
  const product = state.products.find((item) => item.id === productId);
  if (!selection || !product) return;
  [selection.items, selection.visibleItems].forEach((list) => {
    (list || []).forEach((item) => {
      if (item.id === productId) item.decision = decision;
    });
  });
  product.opsDecision = decision;
  if (decision === "adopted") sendProductToPipeline(productId, "採用", false);
  saveUserDecision("Product", productId, decision, product.opsDecision, { decision }, "今日のおすすめから変更");
  if (shouldSave) {
    saveState();
    renderDailySelection();
    renderOpsPipeline();
    showToast(decision === "excluded" ? "除外しました" : decision === "held" ? "保留にしました" : "採用しました");
  }
}

function sendProductToPipeline(productId, status = "採用", shouldSave = true) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  state.postPlans ||= [];
  const existing = state.postPlans.find((plan) => plan.productId === productId && !["投稿済み", "成果確認済み"].includes(plan.status));
  const collections = getDailyItem(productId)?.recommendedCollections || window.HanakoOpsEngine.recommendCollections(enrichProductForOps(product), state.collections);
  if (existing) {
    existing.status = status;
    existing.updatedAt = new Date().toISOString();
  } else {
    state.postPlans.unshift({
      id: createId(),
      productId,
      productName: product.name,
      image: product.image || "",
      status,
      collectionIds: collections.slice(0, 3).map((item) => item.collectionId),
      recommendedCollections: collections.slice(0, 3),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  if (shouldSave) {
    saveState();
    renderOpsPipeline();
    showToast(`${product.name}を${status}へ移動しました`);
  }
}

function sendProductToRoomQueue(productId, shouldSave = true) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  sendProductToPipeline(productId, "文章完成", false);
  if (!state.roomQueue.some((item) => item.productId === productId && !item.done)) {
    state.roomQueue.unshift({
      id: createId(),
      productId,
      productName: product.name,
      productUrl: product.url || "",
      image: product.image || "",
      copy: "",
      done: false,
      createdAt: new Date().toISOString(),
    });
  }
  if (shouldSave) {
    saveState();
    renderRoomQueue();
    renderOpsPipeline();
    showToast("ROOM文生成キューへ送りました");
  }
}

function getDailyItem(productId) {
  const selection = getLatestDailySelection();
  return selection?.items?.find((item) => item.id === productId) || null;
}

function showDailyDetail(productId) {
  const item = getDailyItem(productId);
  if (!item) return;
  const collections = (item.recommendedCollections || []).map((collection, index) => `${index + 1}. ${collection.name} 適合度${collection.score}`).join("\n");
  const saleReasons = (item.salePotentialBreakdown?.factors || []).map((reason) => `+${reason.points} ${reason.label}`).join("\n");
  const opReasons = (item.operationPriorityBreakdown?.factors || []).map((reason) => `+${reason.points} ${reason.label}`).join("\n");
  alert(`総合ランク: ${item.rank}\n売れやすさ: ${item.salePotentialScore}\n運用優先度: ${item.operationPriorityScore}\n\n推奨コレクション\n${collections || "なし"}\n\n売れやすさ理由\n${saleReasons}\n\n運用理由\n${opReasons}\n\n重複/再投稿\n${item.repost?.status} / ${item.repost?.reason}`);
}

function renderOpsPipeline() {
  const board = document.querySelector("#opsPipelineBoard");
  if (!board) return;
  state.postPlans ||= [];
  const statuses = [
    "Candidate",
    "Adopted",
    "AI image waiting",
    "AI image running",
    "AI image done",
    "AI image failed",
    "Copy done",
    "Scheduled",
    "Posted",
    "Result checked",
  ];
  board.innerHTML = statuses.map((status) => {
    const plans = state.postPlans.filter((plan) => plan.status === status).slice(0, 20);
    return `<section class="pipeline-column"><h4>${status}<span>${plans.length}</span></h4>${plans.map(renderPipelineCard).join("") || "<p>No items</p>"}</section>`;
  }).join("");
}

function renderPipelineCard(plan) {
  const product = state.products.find((item) => item.id === plan.productId);
  const collections = plan.recommendedCollections || [];
  return `<article class="pipeline-card">
    ${plan.image ? `<img src="${escapeHtml(plan.image)}" alt="">` : ""}
    <strong>${escapeHtml(plan.productName || product?.name || "Product")}</strong>
    <small>${escapeHtml(collections[0]?.name || "Collection undecided")}</small>
  </article>`;
}

function saveUserDecision(entityType, entityId, decision, beforeValue, afterValue, reason = "") {
  state.userDecisions ||= [];
  state.userDecisions.unshift({
    id: createId(),
    entityType,
    entityId,
    decision,
    beforeValue,
    afterValue,
    reason,
    createdAt: new Date().toISOString(),
  });
  state.userDecisions = state.userDecisions.slice(0, 500);
}

function runPhase2AutomationJobs(reason = "manual") {
  if (!window.HanakoPhase2Engine) return;
  ensureOpsState();
  const startedAt = new Date().toISOString();
  const job = {
    id: createId(),
    jobName: "phase2Automation",
    reason,
    status: "running",
    startedAt,
    targetCount: 0,
    successCount: 0,
    errorCount: 0,
  };
  state.jobRuns.unshift(job);
  try {
    const selection = getLatestDailySelection();
    const items = selection?.items || state.products.map((product) => enrichProductForOps(product));
    const context = {
      products: state.products,
      posts: buildOpsPostHistory(),
      collectionMemberships: state.collectionMemberships,
      performanceAggregates: state.performanceAggregates,
    };

    items.forEach((item) => {
      const product = state.products.find((entry) => entry.id === item.id) || item;
      const adjusted = window.HanakoPhase2Engine.applyScoreAdjustments(item, state.scoreAdjustments);
      if (adjusted.correction) {
        item.performanceAdjustedScore = adjusted.finalScore;
        item.performanceAdjustmentBreakdown = adjusted;
      }
      item.recommendedCollections = window.HanakoPhase2Engine.classifyCollections(product, state.collections, {
        ...context,
        collectionMemberships: state.collectionMemberships,
      });
    });

    const pendingMemberships = window.HanakoPhase2Engine.buildPendingMemberships(items, state.collections, {
      ...context,
      collectionMemberships: state.collectionMemberships,
    });
    mergeById(state.collectionMemberships, pendingMemberships);

    state.collectionBalanceSnapshots = state.collections.map((collection) => (
      window.HanakoPhase2Engine.analyzeCollectionBalance(collection, state.collectionMemberships, state.products, state.salesResults)
    ));

    state.postSimilarities = buildPhase2PostSimilarities();
    state.decisionInboxItems = mergeOpenInboxItems(window.HanakoPhase2Engine.generateDecisionInbox({
      selectionItems: items,
      postSimilarities: state.postSimilarities,
      salesAttributions: state.salesAttributions,
    }));

    state.performanceAggregates = window.HanakoPhase2Engine.aggregatePerformance({
      products: state.products,
      posts: buildOpsPostHistory(),
      salesResults: state.salesResults,
      attributions: state.salesAttributions,
      metrics: state.metrics,
    });
    state.scoreAdjustments = mergeScoreAdjustments(window.HanakoPhase2Engine.calculateScoreAdjustments(state.performanceAggregates));
    state.weeklyInsights = [window.HanakoPhase2Engine.buildWeeklyInsights({
      performanceAggregates: state.performanceAggregates,
      userDecisions: state.userDecisions,
    }), ...(state.weeklyInsights || []).filter((item) => item.id !== `weekly-${new Date().toISOString().slice(0, 10)}`)].slice(0, 12);

    job.targetCount = items.length;
    job.successCount = items.length;
    job.status = "success";
    job.finishedAt = new Date().toISOString();
  } catch (error) {
    job.status = "failed";
    job.errorCount = 1;
    job.finishedAt = new Date().toISOString();
    state.errorLogs.unshift({
      id: createId(),
      source: "phase2Automation",
      message: error.message || String(error),
      createdAt: new Date().toISOString(),
    });
  }
  state.jobRuns = state.jobRuns.slice(0, 80);
  state.errorLogs = state.errorLogs.slice(0, 100);
}

function buildPhase2PostSimilarities() {
  if (!window.HanakoPhase2Engine) return [];
  const posts = buildOpsPostHistory();
  return (state.postPlans || []).flatMap((plan) => {
    const product = state.products.find((item) => item.id === plan.productId) || {};
    const candidate = {
      ...product,
      productId: product.id,
      canonicalProductId: product.ops?.canonicalProductId,
      brand: product.details?.brand || product.ops?.brand || "",
      category: product.category || "",
      colorFamily: product.details?.color || product.ops?.color || "",
      scene: plan.scene || product.scene || "",
      backgroundLocation: plan.backgroundLocation || "",
      pose: plan.pose || "",
      hairstyle: plan.hairstyle || "",
      problemSolution: plan.problemSolution || product.hook || "",
      copyType: plan.copyType || "",
      copyText: plan.copyText || plan.copy || "",
      imageLayout: plan.imageLayout || "",
      collectionIds: plan.collectionIds || [],
    };
    return window.HanakoPhase2Engine.findSimilarPosts(candidate, posts, { compareDays: 90 })
      .filter((similarity) => similarity.similarityScore >= 40)
      .map((similarity) => ({
        id: `${plan.id}-${similarity.existingPostId}`,
        newPostPlanId: plan.id,
        ...similarity,
      }));
  }).slice(0, 80);
}

function mergeOpenInboxItems(nextItems) {
  const resolved = (state.decisionInboxItems || []).filter((item) => item.status === "resolved");
  const manualOpen = (state.decisionInboxItems || []).filter((item) => item.status === "open" && item.manual);
  return [...resolved, ...manualOpen, ...nextItems.filter((item) => !resolved.some((done) => done.id === item.id))].slice(0, 200);
}

function mergeById(target, rows) {
  const map = new Map((target || []).map((item) => [item.id, item]));
  rows.forEach((row) => {
    if (!map.has(row.id)) map.set(row.id, row);
  });
  target.splice(0, target.length, ...map.values());
}

function mergeScoreAdjustments(nextRows) {
  const existing = new Map((state.scoreAdjustments || []).map((item) => [item.id, item]));
  return nextRows.map((row) => ({ ...row, isEnabled: existing.get(row.id)?.isEnabled ?? row.isEnabled }));
}

function renderPhase2Panels() {
  renderDecisionInbox();
  renderCollectionRules();
  renderSalesCsvPreview();
  renderPerformanceAnalytics();
  renderWeeklyInsights();
}

function renderDecisionInbox() {
  const summary = document.querySelector("#decisionInboxSummary");
  const list = document.querySelector("#decisionInboxList");
  if (!summary || !list) return;
  const openItems = (state.decisionInboxItems || []).filter((item) => item.status !== "resolved").sort((a, b) => b.priority - a.priority);
  const byType = openItems.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});
  summary.innerHTML = [
    ["未処理", openItems.length],
    ["重複", byType.duplicate || 0],
    ["分類", byType.collection || 0],
    ["類似投稿", byType.similar_post || 0],
    ["売上紐付け", byType.sales_link || 0],
  ].map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
  if (!openItems.length) {
    list.innerHTML = `<div class="phase2-empty"><strong>判断待ちはありません</strong><p>高確信度の分類と低リスク商品は自動で進みます。</p></div>`;
    return;
  }
  list.innerHTML = openItems.slice(0, 20).map((item) => {
    const entity = getInboxEntity(item);
    return `<article class="decision-card" data-inbox-id="${escapeHtml(item.id)}">
      <div>
        <span class="status-pill">${escapeHtml(inboxTypeLabel(item.type))}</span>
        <strong>${escapeHtml(entity?.name || entity?.productName || item.entityId || "対象データ")}</strong>
        <p>${escapeHtml(item.reason)}</p>
        <small>推奨: ${escapeHtml(item.recommendedAction)} / 確信度 ${escapeHtml(item.recommendationConfidence || 0)}%</small>
      </div>
      <div class="decision-actions">
        <button class="primary" type="button" data-inbox-resolve="${escapeHtml(item.id)}">推奨で解決</button>
        <button type="button" data-inbox-ignore="${escapeHtml(item.id)}">今回は無視</button>
      </div>
    </article>`;
  }).join("");
}

function getInboxEntity(item) {
  if (item.entityType === "Product") return state.products.find((product) => product.id === item.entityId);
  if (item.entityType === "PostPlan") return state.postPlans.find((plan) => plan.id === item.entityId);
  if (item.entityType === "SalesResult") return state.salesResults.find((sale) => sale.id === item.entityId);
  return null;
}

function inboxTypeLabel(type) {
  return {
    duplicate: "重複確認",
    repost: "再投稿判断",
    collection: "コレクション確認",
    similar_post: "類似投稿",
    sales_link: "売上紐付け",
    data_missing: "データ不足",
  }[type] || type;
}

function resolveInboxItem(id, resolution = "recommended") {
  const item = state.decisionInboxItems.find((entry) => entry.id === id);
  if (!item) return;
  item.status = "resolved";
  item.resolution = resolution;
  item.resolvedAt = new Date().toISOString();
  saveUserDecision(item.entityType, item.entityId, `inbox:${resolution}`, item.reason, item.recommendedAction, "Phase 2判断待ち受信箱");
  state.automationDecisions.unshift({
    id: createId(),
    inboxItemId: id,
    action: resolution,
    reason: item.reason,
    createdAt: new Date().toISOString(),
  });
}

function renderCollectionRules() {
  const list = document.querySelector("#collectionRuleList");
  if (!list || !window.HanakoPhase2Engine) return;
  const previews = state.collections.map((rule) => window.HanakoPhase2Engine.previewRule(rule, state.products, {
    collectionMemberships: state.collectionMemberships,
    products: state.products,
    performanceAggregates: state.performanceAggregates,
  }));
  list.innerHTML = previews.map((preview) => {
    const rule = preview.rule;
    const balance = state.collectionBalanceSnapshots.find((item) => item.collectionId === rule.collectionId);
    return `<article class="collection-rule-card">
      <div>
        <span class="status-pill">${escapeHtml(rule.automationMode)}</span>
        <strong>${escapeHtml(rule.name)}</strong>
        <p>${escapeHtml(rule.description || "説明未設定")}</p>
        <small>対象 ${preview.targetCount}件 / 自動予約 ${preview.autoTargetCount}件 / 偏り ${escapeHtml(balance?.status || "未集計")}</small>
      </div>
      <div class="decision-actions">
        <button type="button" data-rule-toggle="${escapeHtml(rule.collectionId)}">${rule.isActive ? "一時停止" : "再開"}</button>
        <button type="button" data-rule-duplicate="${escapeHtml(rule.collectionId)}">複製</button>
      </div>
    </article>`;
  }).join("");
}

function addCollectionRuleFromForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  if (!name) return showToast("ルール名を入れてください");
  const rule = window.HanakoPhase2Engine.normalizeRule({
    id: createId(),
    collectionId: createId(),
    name,
    automationMode: data.get("automationMode"),
    minimumConfidence: Number(data.get("minimumConfidence") || 86),
    requiredConditions: { category: splitCsv(data.get("requiredCategory")) },
    preferredConditions: { taste: splitCsv(data.get("preferredTaste")) },
    description: "画面から追加した分類ルール",
  });
  state.collections.unshift(rule);
  state.collectionRuleVersions.unshift({
    id: createId(),
    collectionRuleId: rule.id,
    version: 1,
    snapshot: rule,
    changeReason: "manual_create",
    createdAt: new Date().toISOString(),
  });
  runPhase2AutomationJobs("collection-rule-create");
  saveState();
  renderPhase2Panels();
  form.reset();
  showToast("コレクションルールを追加しました");
}

function splitCsv(value) {
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function renderSalesCsvPreview() {
  const target = document.querySelector("#salesCsvPreview");
  if (!target) return;
  const latest = state.csvImports?.[0];
  const pending = window.pendingSalesCsvImport;
  if (pending) {
    target.innerHTML = `<div class="csv-map-grid">
      <div><span>文字コード</span><strong>${escapeHtml(pending.encoding)}</strong></div>
      <div><span>行数</span><strong>${pending.rows.length}</strong></div>
      <div><span>自動マッピング</span><strong>${Object.keys(pending.mapping).length}列</strong></div>
    </div>
    <p class="muted">${escapeHtml(pending.headers.join(" / "))}</p>
    <div class="csv-preview-table">${pending.rows.slice(0, 5).map((row) => `<p>${escapeHtml(row.slice(0, 6).join(" | "))}</p>`).join("")}</div>`;
    return;
  }
  if (!latest) {
    target.innerHTML = `<div class="phase2-empty"><strong>CSV未取込</strong><p>楽天アフィリエイトの成果CSVを選ぶと、列を自動判定して重複なしで取り込みます。</p></div>`;
    return;
  }
  target.innerHTML = `<div class="csv-map-grid">
    <div><span>前回取込</span><strong>${escapeHtml(latest.fileName || latest.id)}</strong></div>
    <div><span>新規</span><strong>${latest.insertedCount || 0}</strong></div>
    <div><span>重複スキップ</span><strong>${latest.duplicateCount || 0}</strong></div>
    <div><span>要確認</span><strong>${latest.needsReviewCount || 0}</strong></div>
  </div>`;
}

async function handleSalesCsvFile(event) {
  const file = event.target.files?.[0];
  if (!file || !window.HanakoPhase2Engine) return;
  const buffer = await file.arrayBuffer();
  const candidates = [
    ["UTF-8", "utf-8"],
    ["Shift_JIS", "shift_jis"],
  ];
  let parsed = null;
  for (const [label, encoding] of candidates) {
    try {
      const text = new TextDecoder(encoding).decode(buffer);
      const csv = window.HanakoPhase2Engine.parseCsv(text);
      if (csv.headers.length) {
        parsed = { ...csv, encoding: label };
        break;
      }
    } catch {
      // Try next encoding.
    }
  }
  if (!parsed) return showToast("CSVを読み込めませんでした");
  window.pendingSalesCsvImport = {
    fileName: file.name,
    encoding: parsed.encoding,
    headers: parsed.headers,
    rows: parsed.rows,
    mapping: getSavedOrAutoMapping(parsed.headers),
  };
  renderSalesCsvPreview();
}

function getSavedOrAutoMapping(headers) {
  const key = headers.map((header) => String(header).trim()).join("|");
  const saved = state.csvColumnMappings.find((item) => item.headerFingerprint === key);
  return saved?.mapping || window.HanakoPhase2Engine.autoMapColumns(headers);
}

function executeSalesImport() {
  const pending = window.pendingSalesCsvImport;
  if (!pending || !window.HanakoPhase2Engine) return showToast("先にCSVを選んでください");
  const importId = createId();
  const results = window.HanakoPhase2Engine.rowsToSalesResults(pending.headers, pending.rows, pending.mapping, importId);
  const fingerprints = new Set((state.salesResults || []).map((item) => item.importFingerprint));
  let insertedCount = 0;
  let duplicateCount = 0;
  results.forEach((result) => {
    if (fingerprints.has(result.importFingerprint)) {
      duplicateCount += 1;
      return;
    }
    state.salesResults.unshift(result);
    fingerprints.add(result.importFingerprint);
    insertedCount += 1;
  });
  const attributions = results
    .filter((result) => !state.salesAttributions.some((item) => item.salesResultId === result.id))
    .map((result) => window.HanakoPhase2Engine.attributeSales(result, state.products, buildOpsPostHistory()));
  mergeById(state.salesAttributions, attributions);
  const headerFingerprint = pending.headers.map((header) => String(header).trim()).join("|");
  state.csvColumnMappings.unshift({ id: createId(), headerFingerprint, mapping: pending.mapping, createdAt: new Date().toISOString() });
  const importRow = {
    id: importId,
    fileName: pending.fileName,
    encoding: pending.encoding,
    rowCount: pending.rows.length,
    insertedCount,
    duplicateCount,
    autoLinkedCount: attributions.filter((item) => item.status === "confirmed").length,
    needsReviewCount: attributions.filter((item) => item.status !== "confirmed").length,
    createdAt: new Date().toISOString(),
  };
  state.csvImports.unshift(importRow);
  window.pendingSalesCsvImport = null;
  runPhase2AutomationJobs("sales-csv-import");
  saveState();
  renderPhase2Panels();
  showToast(`CSV取込: 新規${insertedCount}件 / 重複${duplicateCount}件`);
}

function renderPerformanceAnalytics() {
  const summary = document.querySelector("#performanceSummary");
  const adjustments = document.querySelector("#scoreAdjustmentList");
  if (!summary || !adjustments) return;
  const totals = (state.salesResults || []).reduce((acc, item) => {
    acc.salesCount += Number(item.quantity || 1);
    acc.salesAmount += Number(item.salesAmount || 0);
    acc.rewardAmount += Number(item.rewardAmount || 0);
    return acc;
  }, { salesCount: 0, salesAmount: 0, rewardAmount: 0 });
  const topAggregates = [...(state.performanceAggregates || [])]
    .filter((item) => Number(item.sampleSize || 0) > 0)
    .sort((a, b) => Number(b.conversionRate || 0) - Number(a.conversionRate || 0))
    .slice(0, 8);
  summary.innerHTML = [
    ["売上件数", totals.salesCount],
    ["売上金額", `${totals.salesAmount.toLocaleString()}円`],
    ["成果報酬", `${totals.rewardAmount.toLocaleString()}円`],
    ["集計セグメント", state.performanceAggregates?.length || 0],
  ].map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")
    + topAggregates.map((item) => `<article class="performance-row"><strong>${escapeHtml(item.dimension)} / ${escapeHtml(item.dimensionValue)}</strong><span>成果${item.salesCount}件 / サンプル${item.sampleSize}件</span></article>`).join("");
  adjustments.innerHTML = (state.scoreAdjustments || []).slice(0, 12).map((item) => `
    <article class="score-adjustment-row">
      <div><strong>${escapeHtml(item.dimension)}：${escapeHtml(item.dimensionValue)}</strong><p>${escapeHtml(item.reason || "")}</p><small>サンプル${item.sampleSize}件 / 補正 ${item.adjustmentValue > 0 ? "+" : ""}${item.adjustmentValue}</small></div>
      <button type="button" data-score-toggle="${escapeHtml(item.id)}">${item.isEnabled === false ? "有効化" : "無効化"}</button>
    </article>`).join("") || `<div class="phase2-empty"><strong>実績補正はまだありません</strong><p>20件以上のサンプルが集まるまで断定的な補正はしません。</p></div>`;
}

function renderWeeklyInsights() {
  const panel = document.querySelector("#weeklyInsightPanel");
  if (!panel) return;
  const insight = state.weeklyInsights?.[0];
  if (!insight) {
    panel.innerHTML = `<div class="phase2-empty"><strong>レポート未生成</strong><p>CSV取込後に更新すると、事実と推測を分けて改善案を出します。</p></div>`;
    return;
  }
  panel.innerHTML = `<div class="weekly-columns">
    <section><h4>事実</h4>${(insight.facts || []).slice(0, 5).map((item) => `<p>${escapeHtml(item)}</p>`).join("") || "<p>十分な実績がまだありません。</p>"}</section>
    <section><h4>推測</h4>${(insight.assumptions || []).slice(0, 5).map((item) => `<p>${escapeHtml(item)}</p>`).join("") || "<p>サンプル不足のため保留です。</p>"}</section>
    <section><h4>次の一手</h4>${(insight.recommendations || []).slice(0, 6).map((item) => `<p>${escapeHtml(item)}</p>`).join("") || "<p>まず成果CSVを取り込みます。</p>"}</section>
  </div>`;
}

function bindPhase2Actions() {
  if (document.body.dataset.phase2Bound === "true") return;
  document.body.dataset.phase2Bound = "true";
  document.querySelector("#collectionRuleForm")?.addEventListener("submit", addCollectionRuleFromForm);
  document.querySelector("#testCollectionRules")?.addEventListener("click", () => {
    runPhase2AutomationJobs("rule-test");
    saveState();
    renderPhase2Panels();
    showToast("ルールをテストしました");
  });
  document.querySelector("#bulkResolveInbox")?.addEventListener("click", () => {
    (state.decisionInboxItems || []).filter((item) => item.status !== "resolved").slice(0, 20).forEach((item) => resolveInboxItem(item.id, "bulk_recommended"));
    saveState();
    renderPhase2Panels();
    showToast("表示分を解決しました");
  });
  document.querySelector("#salesCsvFile")?.addEventListener("change", handleSalesCsvFile);
  document.querySelector("#executeSalesImport")?.addEventListener("click", executeSalesImport);
  document.querySelector("#recalculatePerformance")?.addEventListener("click", () => {
    runPhase2AutomationJobs("performance-recalculate");
    saveState();
    renderPhase2Panels();
    showToast("成果分析を再集計しました");
  });
  document.querySelector("#generateWeeklyInsight")?.addEventListener("click", () => {
    runPhase2AutomationJobs("weekly-insight");
    saveState();
    renderWeeklyInsights();
    showToast("改善レポートを更新しました");
  });
  document.addEventListener("click", (event) => {
    const resolveButton = event.target.closest("[data-inbox-resolve]");
    if (resolveButton) {
      resolveInboxItem(resolveButton.dataset.inboxResolve, "recommended");
      saveState();
      renderPhase2Panels();
    }
    const ignoreButton = event.target.closest("[data-inbox-ignore]");
    if (ignoreButton) {
      resolveInboxItem(ignoreButton.dataset.inboxIgnore, "ignored");
      saveState();
      renderPhase2Panels();
    }
    const toggleRule = event.target.closest("[data-rule-toggle]");
    if (toggleRule) {
      const rule = state.collections.find((item) => item.collectionId === toggleRule.dataset.ruleToggle);
      if (rule) {
        rule.isActive = !rule.isActive;
        state.collectionRuleVersions.unshift({ id: createId(), collectionRuleId: rule.id, version: Date.now(), snapshot: rule, changeReason: "toggle", createdAt: new Date().toISOString() });
        runPhase2AutomationJobs("rule-toggle");
        saveState();
        renderPhase2Panels();
      }
    }
    const duplicateRule = event.target.closest("[data-rule-duplicate]");
    if (duplicateRule) {
      const rule = state.collections.find((item) => item.collectionId === duplicateRule.dataset.ruleDuplicate);
      if (rule && window.HanakoPhase2Engine) {
        const copy = window.HanakoPhase2Engine.normalizeRule({ ...rule, id: createId(), collectionId: createId(), name: `${rule.name} コピー`, automationMode: "confirm" });
        state.collections.unshift(copy);
        saveState();
        renderCollectionRules();
      }
    }
    const scoreToggle = event.target.closest("[data-score-toggle]");
    if (scoreToggle) {
      const adjustment = state.scoreAdjustments.find((item) => item.id === scoreToggle.dataset.scoreToggle);
      if (adjustment) {
        adjustment.isEnabled = adjustment.isEnabled === false;
        saveState();
        renderPerformanceAnalytics();
      }
    }
  });
}

function runPhase3Agent(reason = "manual") {
  if (!window.HanakoPhase3Engine) {
    showToast("Phase3 engine is not loaded");
    return null;
  }
  ensureOpsState();
  const latestSelection = getLatestDailySelection();
  const selectionItems = Array.isArray(latestSelection?.items) && latestSelection.items.length
    ? latestSelection.items
    : (state.products || []).slice(0, 200);
  const run = window.HanakoPhase3Engine.buildAgentRun({
    products: state.products || [],
    selectionItems,
    posts: state.posts || [],
    collections: state.collections || [],
    salesResults: state.salesResults || [],
    performanceAggregates: state.performanceAggregates || [],
    scoreAdjustments: state.scoreAdjustments || [],
    calendar: state.calendar || [],
    aiProvider: getSelectedAiName(),
  });
  run.reason = reason;
  state.aiAgentRuns = [run, ...(state.aiAgentRuns || []).filter((item) => item.id !== run.id)].slice(0, 30);
  state.aiProductEvaluations = mergeAiRows(state.aiProductEvaluations, run.evaluations);
  state.aiPostPlans = mergeAiRows(state.aiPostPlans, run.plans);
  state.aiImageJobs = mergeAiRows(state.aiImageJobs, run.plans.map((plan) => ({ ...plan.imageJob, productId: plan.productId, planId: plan.id })));
  state.aiCopyBundles = mergeAiRows(state.aiCopyBundles, run.plans.map((plan) => ({ id: plan.id, productId: plan.productId, ...plan.copyBundle })));
  state.aiCollectionSuggestions = mergeAiRows(state.aiCollectionSuggestions, run.collectionSuggestions || []);
  state.aiRepostSuggestions = mergeAiRows(
    state.aiRepostSuggestions,
    (run.reposts || []).map((item) => ({ id: window.HanakoPhase3Engine.stableHash(`repost:${item.productId}`), ...item }))
  );
  state.aiSalesInsights = mergeAiRows(state.aiSalesInsights, [run.salesInsight].filter(Boolean));
  state.aiImprovementReports = mergeAiRows(state.aiImprovementReports, [run.weeklyReport].filter(Boolean));
  state.aiSchedulePlans = mergeAiRows(state.aiSchedulePlans, (run.schedule || []).map((item) => ({ id: window.HanakoPhase3Engine.stableHash(`schedule:${item.day}:${item.productId}`), ...item })));
  state.aiLearningProfile = buildAiLearningProfile(run);
  saveUserDecision("AiAgent", run.id, "generated", null, { planCount: run.plans.length, reason }, "Phase3 AI agent");
  saveState();
  renderAiAgentDashboard();
  renderOpsPipeline();
  showToast("AIが今日の投稿準備を作りました");
  return run;
}

function mergeAiRows(existing = [], incoming = []) {
  const rows = new Map();
  (existing || []).forEach((item) => item?.id && rows.set(item.id, item));
  (incoming || []).forEach((item) => item?.id && rows.set(item.id, item));
  return Array.from(rows.values()).sort((a, b) => String(b.generatedAt || b.createdAt || "").localeCompare(String(a.generatedAt || a.createdAt || ""))).slice(0, 500);
}

function buildAiLearningProfile(run = null) {
  const adopted = (state.userDecisions || []).filter((item) => /adopt|approve|accept/i.test(`${item.decision} ${item.afterValue || ""}`)).length;
  const excluded = (state.userDecisions || []).filter((item) => /exclude|reject|skip/i.test(`${item.decision} ${item.afterValue || ""}`)).length;
  const sales = (state.salesResults || []).reduce((sum, item) => sum + (Number(item.salesAmount) || 0), 0);
  return {
    updatedAt: new Date().toISOString(),
    adoptedDecisions: adopted,
    excludedDecisions: excluded,
    totalSalesAmount: sales,
    lastRunId: run?.id || state.aiLearningProfile?.lastRunId || "",
    styleSignals: ["adult cute", "high-looking", "travel", "ROOM friendly", "low effort approval"],
  };
}

function renderAiAgentDashboard() {
  const section = document.querySelector("#aiAgentSummary");
  if (!section) return;
  const run = state.aiAgentRuns?.[0] || null;
  const plans = state.aiPostPlans || [];
  const waitingImages = (state.aiImageJobs || []).filter((item) => item.status === "waiting").length;
  const scheduled = (state.aiSchedulePlans || []).length;
  const inbox = (state.decisionInboxItems || []).filter((item) => item.status !== "resolved").length;
  const strongPlans = plans.filter((plan) => plan.aiRank === "S").length;
  section.innerHTML = `
    <article><strong>${strongPlans}</strong><span>Sランク案</span></article>
    <article><strong>${waitingImages}</strong><span>画像待ち</span></article>
    <article><strong>${scheduled}</strong><span>投稿予定</span></article>
    <article><strong>${inbox}</strong><span>判断待ち</span></article>
  `;
  const taskList = document.querySelector("#aiTaskList");
  if (taskList) {
    const tasks = run?.tasks?.length ? run.tasks : [
      { title: "AIに今日の投稿準備を作らせる", detail: "商品選定、画像プロンプト、ROOM文、投稿予定までまとめて作ります。", count: plans.length },
    ];
    taskList.innerHTML = tasks.slice(0, 6).map((task) => `
      <article class="ai-task-card">
        <strong>${escapeHtml(task.title || "AIタスク")}</strong>
        <p>${escapeHtml(task.detail || "")}</p>
        <span>${Number(task.count || 0)}件</span>
      </article>
    `).join("");
  }
  const planList = document.querySelector("#aiPlanList");
  if (planList) {
    const visiblePlans = plans.slice(0, 8);
    planList.innerHTML = visiblePlans.length
      ? visiblePlans.map(renderAiPlanCard).join("")
      : `<p class="muted">「AIに作らせる」を押すと、今日の投稿案がここに並びます。</p>`;
  }
  const assistantLog = document.querySelector("#aiAssistantLog");
  if (assistantLog) {
    const messages = (state.aiAssistantMessages || []).slice(0, 8);
    assistantLog.innerHTML = messages.length
      ? messages.map((message) => `<div class="ai-message ${message.role === "user" ? "user" : "assistant"}">${escapeHtml(message.text)}</div>`).join("")
      : `<div class="ai-message assistant">「今日は何を投稿する？」みたいに聞いてください。</div>`;
  }
}

function renderAiPlanCard(plan) {
  const product = (state.products || []).find((item) => item.id === plan.productId) || {};
  const image = product.image || product.mainImageUrl || "";
  const collection = plan.collectionCandidates?.[0]?.name || "AIおすすめコレクション";
  const roomCopy = plan.copyBundle?.room || "";
  const imagePrompt = plan.imageJob?.prompt || "";
  return `<article class="ai-plan-card">
    ${image ? `<img src="${escapeHtml(image)}" alt="">` : ""}
    <div>
      <strong>${escapeHtml(plan.productName || product.name || "商品")}</strong>
      <p>${escapeHtml(collection)}</p>
      <small>${escapeHtml(plan.aiRank || "-")} / ${Number(plan.aiTotalScore || 0)}pt</small>
    </div>
    <div class="ai-plan-actions">
      <button type="button" class="ghost-button" data-ai-copy-image="${escapeHtml(plan.id)}">画像プロンプト</button>
      <button type="button" class="ghost-button" data-ai-copy-copy="${escapeHtml(plan.id)}">ROOM文</button>
      <button type="button" class="primary-button" data-ai-approve="${escapeHtml(plan.id)}">OK</button>
    </div>
    <textarea hidden data-ai-image-prompt="${escapeHtml(plan.id)}">${escapeHtml(imagePrompt)}</textarea>
    <textarea hidden data-ai-room-copy="${escapeHtml(plan.id)}">${escapeHtml(roomCopy)}</textarea>
  </article>`;
}

function approveAiPlan(planId) {
  const plan = (state.aiPostPlans || []).find((item) => item.id === planId);
  if (!plan) return;
  const product = (state.products || []).find((item) => item.id === plan.productId);
  if (product) {
    sendProductToPipeline(product.id, "AI image waiting", false);
  }
  state.aiPostPlans = (state.aiPostPlans || []).map((item) => item.id === planId ? { ...item, status: "approved", approvedAt: new Date().toISOString() } : item);
  state.aiImageJobs = (state.aiImageJobs || []).map((item) => item.planId === planId ? { ...item, status: "waiting" } : item);
  saveUserDecision("AiPostPlan", planId, "approved", plan.status, "approved", "Phase3 approval");
  saveState();
  renderAiAgentDashboard();
  renderOpsPipeline();
  showToast("AI投稿案を承認しました");
}

function bindPhase3Actions() {
  document.querySelector("#runAiAgent")?.addEventListener("click", () => {
    runPhase3Agent("manual");
  });
  document.querySelector("#approveAiTopPlans")?.addEventListener("click", () => {
    (state.aiPostPlans || []).slice(0, 5).forEach((plan) => approveAiPlan(plan.id));
    renderAiAgentDashboard();
  });
  document.querySelector("#aiPlanList")?.addEventListener("click", (event) => {
    const approveButton = event.target.closest("[data-ai-approve]");
    const imageButton = event.target.closest("[data-ai-copy-image]");
    const copyButton = event.target.closest("[data-ai-copy-copy]");
    if (approveButton) approveAiPlan(approveButton.dataset.aiApprove);
    if (imageButton) {
      const text = document.querySelector(`[data-ai-image-prompt="${CSS.escape(imageButton.dataset.aiCopyImage)}"]`)?.value || "";
      copyText(text);
    }
    if (copyButton) {
      const text = document.querySelector(`[data-ai-room-copy="${CSS.escape(copyButton.dataset.aiCopyCopy)}"]`)?.value || "";
      copyText(text);
    }
  });
  document.querySelector("#aiAssistantForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#aiAssistantQuestion");
    const question = input?.value?.trim();
    if (!question || !window.HanakoPhase3Engine) return;
    const run = state.aiAgentRuns?.[0] || runPhase3Agent("assistant");
    const answer = window.HanakoPhase3Engine.answerAssistant(question, {
      run,
      products: state.products || [],
      posts: state.posts || [],
      collections: state.collections || [],
      salesResults: state.salesResults || [],
    });
    state.aiAssistantMessages = [
      { id: createId(), role: "assistant", text: answer, createdAt: new Date().toISOString() },
      { id: createId(), role: "user", text: question, createdAt: new Date().toISOString() },
      ...(state.aiAssistantMessages || []),
    ].slice(0, 50);
    input.value = "";
    saveState();
    renderAiAgentDashboard();
  });
}

function ensurePhase4DailyRun() {
  if (!window.HanakoPhase4Engine) return;
  const today = new Date().toISOString().slice(0, 10);
  const latest = state.aiPhase4Runs?.[0];
  if (latest?.generatedAt?.slice(0, 10) === today) return;
  runPhase4LearningCycle("daily-auto", true);
}

function runPhase4LearningCycle(reason = "manual", quiet = false) {
  if (!window.HanakoPhase4Engine) {
    if (!quiet) showToast("Phase4 engine is not loaded");
    return null;
  }
  ensureOpsState();
  const run = window.HanakoPhase4Engine.runLearningCycle({
    products: state.products || [],
    posts: state.posts || [],
    aiPostPlans: state.aiPostPlans || [],
    aiAgentRuns: state.aiAgentRuns || [],
    salesResults: state.salesResults || [],
    metrics: state.metrics || [],
    collections: state.collections || [],
    performanceAggregates: state.performanceAggregates || [],
    scoreAdjustments: state.scoreAdjustments || [],
    aiKnowledgeBase: state.aiKnowledgeBase || [],
  });
  run.reason = reason;
  state.aiPhase4Runs = [run, ...(state.aiPhase4Runs || []).filter((item) => item.id !== run.id)].slice(0, 60);
  state.aiLearningEvents = mergeAiRows(state.aiLearningEvents, run.observations || []);
  state.aiKnowledgeBase = mergeAiRows(state.aiKnowledgeBase, run.knowledge || []);
  state.aiDailyRetrospectives = mergeAiRows(state.aiDailyRetrospectives, [run.retrospective].filter(Boolean));
  state.aiImprovementPlans = mergeAiRows(state.aiImprovementPlans, run.improvements || []);
  state.aiWeightProposals = mergeAiRows(state.aiWeightProposals, run.weightProposals || []);
  state.aiWinPatterns = mergeAiRows(state.aiWinPatterns, run.winPatterns || []);
  state.aiLosePatterns = mergeAiRows(state.aiLosePatterns, run.losePatterns || []);
  state.aiExperimentPlans = mergeAiRows(state.aiExperimentPlans, [run.exploration].filter(Boolean));
  state.aiSimulations = mergeAiRows(state.aiSimulations, run.simulations || []);
  state.aiWeeklyMeetings = mergeAiRows(state.aiWeeklyMeetings, [run.weeklyMeeting].filter(Boolean));
  state.aiMonthlyMeetings = mergeAiRows(state.aiMonthlyMeetings, [run.monthlyMeeting].filter(Boolean));
  state.aiBrandKnowledge = (state.aiKnowledgeBase || []).filter((item) => item.type === "brand").slice(0, 100);
  state.aiBackgroundKnowledge = (state.aiKnowledgeBase || []).filter((item) => item.type === "background").slice(0, 100);
  state.aiCopyKnowledge = (state.aiKnowledgeBase || []).filter((item) => item.type === "copyType").slice(0, 100);
  state.aiImageKnowledge = (state.aiLearningEvents || []).map((item) => ({
    id: `image_${item.id}`,
    productId: item.productId,
    features: item.imageFeatures,
    actualScore: item.actualScore,
    outcome: item.outcome,
    updatedAt: item.createdAt,
  })).slice(0, 200);
  saveUserDecision("AiLearningCycle", run.id, "generated", null, { knowledge: run.knowledge.length, reason }, "Phase4 self learning");
  saveState();
  renderAiLearningDashboard();
  if (!quiet) showToast("AIの反省会と改善案を更新しました");
  return run;
}

function renderAiLearningDashboard() {
  const summary = document.querySelector("#aiLearningSummary");
  if (!summary) return;
  const run = state.aiPhase4Runs?.[0] || null;
  const knowledgeCount = state.aiKnowledgeBase?.length || 0;
  const winCount = state.aiWinPatterns?.length || 0;
  const loseCount = state.aiLosePatterns?.length || 0;
  const explorationCount = run?.exploration?.candidates?.length || state.aiExperimentPlans?.[0]?.candidates?.length || 0;
  summary.innerHTML = `
    <article><strong>${knowledgeCount}</strong><span>学習メモ</span></article>
    <article><strong>${winCount}</strong><span>勝ちパターン</span></article>
    <article><strong>${loseCount}</strong><span>注意パターン</span></article>
    <article><strong>${explorationCount}</strong><span>探索枠</span></article>
  `;
  renderAiLearningList("#aiLearningTop10", run?.dashboard?.top10 || [], (item) => `
    <article><strong>${escapeHtml(item.productName || "商品")}</strong><small>${Number(item.score || 0)}pt / ${escapeHtml(item.reason || "")}</small></article>
  `);
  renderAiLearningList("#aiLearningImprovements", run?.dashboard?.weeklyImprovements || state.aiImprovementPlans || [], (item) => `
    <article><strong>${escapeHtml(item.action || "改善案")}</strong><small>+${Number(item.expectedImpact || 0)}% / ${escapeHtml(item.reason || "")}</small></article>
  `);
  renderAiLearningList("#aiLearningExploration", run?.dashboard?.explorationItems || [], (item) => `
    <article><strong>${escapeHtml(item.productName || "探索商品")}</strong><small>${Number(item.explorationScore || 0)}pt / ${escapeHtml(item.reason || "")}</small></article>
  `);
  const patterns = [
    ...(run?.dashboard?.winPatterns || state.aiWinPatterns || []).slice(0, 3),
    ...(run?.dashboard?.cautionBrands || state.aiLosePatterns || []).slice(0, 3),
  ];
  renderAiLearningList("#aiLearningPatterns", patterns, (item) => `
    <article><strong>${escapeHtml(item.title || item.value || "パターン")}</strong><small>${escapeHtml(item.reason || item.verdict || "")}</small></article>
  `);
}

function renderAiLearningList(selector, items, renderItem) {
  const target = document.querySelector(selector);
  if (!target) return;
  target.innerHTML = items.length ? items.map(renderItem).join("") : `<p class="muted">売上やクリックを記録してから「今日の反省会」を作ると表示されます。</p>`;
}

function bindPhase4Actions() {
  document.querySelector("#runAiLearningCycle")?.addEventListener("click", () => runPhase4LearningCycle("manual"));
  document.querySelector("#copyAiWeeklyMeeting")?.addEventListener("click", () => {
    const meeting = state.aiWeeklyMeetings?.[0];
    if (!meeting) return showToast("先に今日の反省会を作ってください");
    copyText(`【${meeting.title}】\n\nFacts\n${(meeting.facts || []).map((item) => `・${item}`).join("\n")}\n\nAssumptions\n${(meeting.assumptions || []).map((item) => `・${item}`).join("\n")}\n\nNext strategy\n${(meeting.nextStrategy || []).map((item) => `・${item}`).join("\n")}`);
  });
  document.querySelector("#aiLearningQuestionForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#aiLearningQuestion");
    const question = input?.value?.trim();
    if (!question || !window.HanakoPhase4Engine) return;
    const run = state.aiPhase4Runs?.[0] || runPhase4LearningCycle("rag-question", true);
    const answer = window.HanakoPhase4Engine.answer(question, {
      run,
      knowledge: state.aiKnowledgeBase || [],
      aiKnowledgeBase: state.aiKnowledgeBase || [],
    });
    const target = document.querySelector("#aiLearningAnswer");
    if (target) target.textContent = answer;
    input.value = "";
  });
}

function renderHomeCommandCenter() {
  const focusProduct = getHomeFocusProduct();
  const activeCalendar = (state.calendar || []).filter((item) => !item.done);
  const hasDraft = Boolean((state.drafts || []).length || (state.roomQueue || []).length);
  const productReady = Boolean(focusProduct?.url && focusProduct?.hook);
  const readiness = Math.min(100,
    (state.products?.length ? 25 : 0)
    + (productReady ? 20 : 0)
    + (hasDraft ? 20 : 0)
    + (activeCalendar.length ? 20 : 0)
    + ((state.metrics || []).length ? 15 : 0));
  const readinessNode = document.querySelector("#homeReadinessValue");
  const progressNode = document.querySelector("#homeProgressBar");
  if (readinessNode) readinessNode.textContent = `${readiness}%`;
  if (progressNode) progressNode.style.width = `${readiness}%`;

  const action = getHomeNextAction(focusProduct, productReady, hasDraft, activeCalendar);
  const actionTitle = document.querySelector("#homeNextActionTitle");
  const actionReason = document.querySelector("#homeNextActionReason");
  const actionButton = document.querySelector("#homeNextActionButton");
  if (actionTitle) actionTitle.textContent = action.title;
  if (actionReason) actionReason.textContent = action.reason;
  if (actionButton) {
    actionButton.textContent = action.button;
    actionButton.dataset.target = action.target;
  }

  const insight = getPerformanceInsight("all", "balanced");
  const insightNode = document.querySelector("#homeInsight");
  if (insightNode) insightNode.textContent = insight.sampleSize
    ? `現在の勝ち型は「${viralPatternLabels[insight.pattern]}」。実績${insight.sampleSize}件を反映中です。`
    : "成果を2件以上記録すると、反応が良い構成を自動で優先します。";

  const focusNode = document.querySelector("#homeFocusProduct");
  const planNode = document.querySelector("#homeDailyPlan");
  const planButton = document.querySelector("#homeBuildPlan");
  if (focusNode) focusNode.textContent = focusProduct ? `主役｜${focusProduct.name}` : "主役商品を登録してください";
  if (planButton) planButton.disabled = !focusProduct;
  if (!planNode) return;
  if (!focusProduct) {
    planNode.innerHTML = `<p class="muted">商品を登録すると、Instagram・Threads・Xの企画と投稿時間を提案します。</p>`;
    return;
  }

  const recommendations = buildProductRecommendations(focusProduct);
  const platformMarks = { Instagram: "IG", Threads: "TH", X: "X" };
  planNode.innerHTML = recommendations.map((recommendation, index) => `
    <div class="home-plan-row">
      <span class="home-platform-mark platform-${recommendation.platform.toLowerCase()}">${platformMarks[recommendation.platform]}</span>
      <div>
        <strong>${escapeHtml(recommendation.angle)}</strong>
        <small>${escapeHtml(recommendation.dayLabel)} ${escapeHtml(recommendation.time)}｜${escapeHtml(trimText(recommendation.reason, 56))}</small>
      </div>
      <button type="button" data-home-plan-index="${index}" data-home-product="${focusProduct.id}">作る</button>
    </div>`).join("");
  planNode.querySelectorAll("[data-home-plan-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = state.products.find((item) => item.id === button.dataset.homeProduct);
      const recommendation = buildProductRecommendations(product)[Number(button.dataset.homePlanIndex)];
      if (!product || !recommendation) return;
      applyProductRecommendation(product, recommendation);
      activateView("generator");
      generateEditorialPost(false);
    });
  });
}

function getHomeFocusProduct() {
  const products = state.products || [];
  if (!products.length) return null;
  const scheduledIds = new Set((state.calendar || []).filter((item) => !item.done).map((item) => item.productId));
  return products
    .map((product, index) => ({
      product,
      score: (scheduledIds.has(product.id) ? -6 : 0)
        + (product.url ? 5 : 0)
        + (product.image ? 4 : 0)
        + (product.hook ? 3 : 0)
        + (product.details?.brand || product.details?.location ? 2 : 0)
        - index * 0.01,
    }))
    .sort((a, b) => b.score - a.score)[0].product;
}

function getHomeNextAction(product, productReady, hasDraft, activeCalendar) {
  if (!product) return { title: "最初の商品を登録", reason: "URLか商品検索から追加すると、3媒体の投稿案を自動で作れます。", button: "商品を探す", target: "products" };
  if (!productReady) return { title: "主役商品の情報を整える", reason: `「${product.name}」へURLと推しポイントを入れると、投稿文の具体性が上がります。`, button: "商品を確認", target: "products" };
  if (!hasDraft) return { title: "今日の投稿文を1本作る", reason: `「${product.name}」のおすすめ企画ができています。まず完成稿を作りましょう。`, button: "SNS投稿を作る", target: "generator" };
  if (!activeCalendar.length) return { title: "投稿時間を決める", reason: "右のスマートプランから3媒体のおすすめ時間をまとめて予定へ入れられます。", button: "投稿予定を見る", target: "calendar" };
  if (!(state.metrics || []).length) return { title: "投稿後の反応を記録", reason: "表示・保存・ROOMクリックを入れると、次回から伸びる構成を優先します。", button: "成果を記録", target: "analytics" };
  return { title: "次の投稿を仕上げる", reason: `${activeCalendar.length}件の予定があります。今日の順番を確認して投稿を進めましょう。`, button: "予定を確認", target: "calendar" };
}

function addHomeSmartPlan() {
  const product = getHomeFocusProduct();
  if (!product) return showToast("先に商品を登録してください");
  const existing = new Set((state.calendar || []).filter((item) => !item.done).map((item) => `${item.productId}:${item.platform}`));
  let added = 0;
  buildProductRecommendations(product).forEach((recommendation) => {
    const key = `${product.id}:${recommendation.platform}`;
    if (existing.has(key)) return;
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
    existing.add(key);
    added += 1;
  });
  if (!added) return showToast("この商品の3媒体プランはすでに予定へ入っています");
  saveState();
  renderCalendar();
  showToast(`${product.name}の${added}投稿を予定に追加しました`);
}

function bindForms() {
  document.querySelector("#productForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.products.unshift(enrichProductForOps({
      id: createId(),
      name: form.get("name").trim(),
      url: form.get("url").trim(),
      image: form.get("image").trim(),
      details: parseProductDetails(form.get("details")),
      category: form.get("category"),
      price: form.get("price").trim(),
      hook: form.get("hook").trim(),
    }));
    event.currentTarget.reset();
    saveState();
    renderProducts();
    renderDailySelection();
    renderOpsPipeline();
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
  bindOpsActions();

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
      renderSocialGeminiProductPreview();
      saveGeneratorPreferences();
      markSocialGeminiPromptStale();
    });
  });
  selectedProduct.addEventListener("change", () => {
    const product = state.products.find((item) => item.id === selectedProduct.value);
    applyRecommendedSnsDefaults(product);
  });

  document.querySelector("#optimizationSelect").addEventListener("change", renderLearningHint);

  document.querySelector("#generatePost").addEventListener("click", () => generateEditorialPost(false));
  document.querySelector("#generateVariation").addEventListener("click", () => generateEditorialPost(true));
  document.querySelector("#generateThree").addEventListener("click", generateThreeEditorialPosts);
  document.querySelector("#sendSocialGeminiImage")?.addEventListener("click", shareSocialReferenceToGemini);
  document.querySelector("#sendSocialGeminiCopy")?.addEventListener("click", () => sendSocialGeminiToGemini("copy"));
  document.querySelector("#goToSocialGemini")?.addEventListener("click", () => {
    generateBothSocialGeminiPrompts(true);
    renderSocialGeminiProgress();
    document.querySelector("#snsGeminiTools")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelector("#copySocialGeminiImagePrompt")?.addEventListener("click", () => copyText(snsGeminiPrompt?.value || ""));
  document.querySelector("#copySocialGeminiCopyPrompt")?.addEventListener("click", () => copyText(snsGeminiCopyPrompt?.value || ""));
  document.querySelector("#openSocialGeminiImage")?.addEventListener("click", shareSocialReferenceToGemini);
  document.querySelector("#openSocialGeminiCopy")?.addEventListener("click", () => copyAndOpenSocialGemini("copy"));
  document.querySelector("#snsGeneratedImage")?.addEventListener("change", previewSocialGeminiImage);
  document.querySelector("#snsGeminiResult")?.addEventListener("input", renderSocialGeminiProgress);
  document.querySelector("#applySocialGeminiCopy")?.addEventListener("click", applySocialGeminiCopy);
  document.querySelector("#downloadSocialGeminiImage")?.addEventListener("click", downloadSocialGeminiImage);
  bindSocialHanakoTeacher();
  document.querySelector("#generator")?.addEventListener("change", (event) => {
    if (!event.target?.closest?.(".sns-gemini-tools")) saveGeneratorPreferences();
    markSocialGeminiPromptStale(event);
  });
  window.addEventListener("focus", handleSocialGeminiReturn);
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

  document.querySelector("#exportBtn").addEventListener("click", () => {
    exportData();
    document.querySelector("#dataMenu")?.removeAttribute("open");
  });
  document.querySelector("#importInput").addEventListener("change", async (event) => {
    await importData(event);
    document.querySelector("#dataMenu")?.removeAttribute("open");
  });
  document.addEventListener("click", (event) => {
    const dataMenu = document.querySelector("#dataMenu");
    if (dataMenu?.open && !dataMenu.contains(event.target)) dataMenu.removeAttribute("open");
  });
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
  ensureOpsState(state);
  hasMeaningfulLocalData = true;
  localStorage.setItem("hanako-room-ops", JSON.stringify(state));
  profileText.value = state.profile || defaultProfile;
  state.appearance ||= { avatarTheme: "original" };
  state.coordinatePhotos ||= [];
  state.selectedCoordinatePhotoId ||= state.coordinatePhotos[0]?.id || "";
  applyAppearance();
  renderProducts();
  renderDailySelection();
  renderOpsPipeline();
  renderProductOptions();
  restoreGeneratorPreferences();
  renderRoomProductOptions();
  renderCoordinateOptions();
  renderCoordinatePhotoLibrary();
  refreshCoordinatePhotoLibraryUrls();
  renderRoomQueue();
  renderCalendar();
  renderMetrics();
  renderPhase2Panels();
  renderAiAgentDashboard();
  renderAiLearningDashboard();
  renderHome();
  suppressCloudSave = false;
}

function cloneState() {
  return JSON.parse(JSON.stringify(state));
}

function setSyncStatus(status) {
  const dot = document.querySelector("#syncDot");
  const label = document.querySelector("#syncLabel");
  const button = document.querySelector("#syncBtn");
  dot.className = `sync-dot ${status === "off" ? "" : status}`.trim();
  label.textContent = status === "online" ? "同期済み" : status === "busy" ? "同期中" : status === "error" ? "要確認" : "同期設定";
  button.dataset.status = status;
  button.setAttribute("aria-label", `${label.textContent}。クラウド同期を開く`);
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
      ${product.image ? `<img class="product-image" src="${escapeHtml(product.image)}" alt="" loading="lazy">` : `<div class="product-image product-image-placeholder">PHOTO</div>`}
      <div class="product-card-main">
        <div>
          <p class="eyebrow">${escapeHtml(product.category || "PRODUCT")}</p>
          <h4>${escapeHtml(product.name)}</h4>
        </div>
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
      <div class="product-card-actions">
        <button class="primary" data-use="${product.id}">SNS投稿へ</button>
        ${product.category !== "ホテル・旅行" ? `<button data-room-use="${product.id}">ROOM文へ</button>` : ""}
        <button data-delete="${product.id}">削除</button>
      </div>
    `;
    productGrid.appendChild(card);
  });

  productGrid.querySelectorAll("[data-use]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = state.products.find((item) => item.id === button.dataset.use);
      if (!product) return;
      selectedProduct.value = product.id;
      applyRecommendedSnsDefaults(product);
      openView("generator");
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
      renderDailySelection();
      renderOpsPipeline();
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

function applyRecommendedSnsDefaults(product, notify = true) {
  if (!product) return;
  const recommendations = buildProductRecommendations(product);
  const recommendation = recommendations.find((item) => item.platform === activePlatform) || recommendations[0];
  if (!recommendation) return;
  applyProductRecommendation(product, recommendation);

  const text = `${product.name || ""} ${product.hook || ""} ${product.details?.color || ""} ${product.details?.material || ""}`;
  const setSelect = (id, value) => {
    const select = document.querySelector(`#${id}`);
    if (select && [...select.options].some((option) => option.value === value)) select.value = value;
  };
  if (product.category !== "ホテル・旅行") {
    const audience = /骨格|細見え|華奢|ウエスト|脚長/.test(text)
      ? "wave"
      : /通勤|オフィス|仕事|ジャケット/.test(text)
        ? "office"
        : /デート|カフェ|お呼ばれ/.test(text)
          ? "date"
          : /高見え|プチプラ|価格|コスパ|セール/.test(text)
            ? "budget"
            : "university";
    const priority = /素材|綿|コットン|リネン|シアー|ニット|着心地/.test(text)
      ? "material"
      : /骨格|細見え|華奢|ウエスト|脚長/.test(text)
        ? "balance"
        : /高見え|上品|きれいめ|質感/.test(text)
          ? "premium"
          : /プチプラ|価格|コスパ|セール|割引/.test(text)
          ? "cost"
          : "versatility";
    const concern = /透け|汗|雨|撥水|半袖|ノースリーブ|シアー/.test(text)
      ? "weather"
      : /ウエスト|腰|お腹/.test(text)
        ? "waist"
        : /丈|ロング|ミニ|身長/.test(text)
          ? "length"
          : /ストレッチ|歩き|軽量|締め付け/.test(text)
            ? "comfort"
            : "upper";
    const occasion = /通勤|オフィス|仕事|ジャケット/.test(text)
      ? "office"
      : /デート|カフェ|お呼ばれ/.test(text)
        ? "date"
        : /推し|ライブ|イベント/.test(text)
          ? "oshi"
          : ["バッグ", "シューズ", "アクセサリー"].includes(product.category)
            ? "weekend"
            : "campus";
    const emotion = concern === "weather" ? "weather" : priority === "balance" ? "body" : priority === "cost" ? "budget" : priority === "premium" ? "confidence" : "repeat";
    setSelect("audienceSelect", audience);
    setSelect("fashionPrioritySelect", priority);
    setSelect("fashionConcernSelect", concern);
    setSelect("fashionOccasionSelect", occasion);
    setSelect("emotionSelect", emotion);
  } else {
    const travelPriority = /駅|アクセス|徒歩|空港/.test(text) ? "access" : /温泉|大浴場/.test(text) ? "spa" : /朝食|食事|レストラン/.test(text) ? "food" : /安|料金|クーポン/.test(text) ? "cost" : "room";
    setSelect("travelPrioritySelect", travelPriority);
    setSelect("emotionSelect", "confidence");
  }
  setSelect("hookSelect", "auto");
  setSelect("ownershipSelect", "considering");
  saveGeneratorPreferences();
  renderSocialGeminiProductPreview();
  markSocialGeminiPromptStale();
  if (notify) showToast(`${product.name}に合うSNS設定を自動で選びました`);
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
  const previous = selectedProduct.value;
  selectedProduct.innerHTML = "";
  state.products.forEach((product) => {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = `${product.name} / ${product.category}`;
    selectedProduct.appendChild(option);
  });
  if ([...selectedProduct.options].some((option) => option.value === previous)) selectedProduct.value = previous;
  document.querySelector("#todayFocus").textContent = state.products[0]?.name || "商品を追加";
  renderSocialGeminiProductPreview();
}

function saveGeneratorPreferences() {
  const ids = [
    "selectedProduct", "angleSelect", "audienceSelect", "goalSelect", "optimizationSelect",
    "emotionSelect", "hookSelect", "ownershipSelect", "viralPatternSelect", "seasonSelect",
    "toneSelect", "fashionOccasionSelect", "fashionPrioritySelect", "fashionConcernSelect",
    "travelCompanionSelect", "travelPrioritySelect", "postBrief",
  ];
  const values = {};
  ids.forEach((id) => {
    const element = document.querySelector(`#${id}`);
    if (element) values[id] = element.value;
  });
  state.generatorSettings = { platform: activePlatform, values };
  saveState();
}

function restoreGeneratorPreferences() {
  const preferences = state.generatorSettings;
  if (!preferences) {
    renderAngleOptions();
    return;
  }
  if (["Instagram", "Threads", "X"].includes(preferences.platform)) activePlatform = preferences.platform;
  document.querySelectorAll("#platformTabs button").forEach((button) => {
    button.classList.toggle("active", button.dataset.platform === activePlatform);
  });
  const values = preferences.values || {};
  Object.entries(values).forEach(([id, value]) => {
    if (id === "angleSelect") return;
    const element = document.querySelector(`#${id}`);
    if (!element) return;
    if (element.tagName === "SELECT" && ![...element.options].some((option) => option.value === value)) return;
    element.value = value;
  });
  renderAngleOptions();
  const angleSelect = document.querySelector("#angleSelect");
  if ([...angleSelect.options].some((option) => option.value === values.angleSelect)) angleSelect.value = values.angleSelect;
  renderSocialGeminiProductPreview();
}

function renderSocialGeminiProductPreview() {
  const target = document.querySelector("#snsGeminiProductPreview");
  if (!target) return;
  const product = state.products.find((item) => item.id === selectedProduct.value) || state.products[0];
  if (!product) {
    target.innerHTML = `<p class="muted">商品を登録すると、選んだAIへ渡す画像と商品情報がここに表示されます。</p>`;
    renderSocialGeminiProgress();
    return;
  }
  const imageUrl = safeHttpUrl(product.image);
  const productUrl = safeHttpUrl(product.url);
  target.innerHTML = `
    ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}">` : `<span class="sns-gemini-product-placeholder">品</span>`}
    <div class="sns-gemini-product-copy">
      <span>${escapeHtml(activePlatform)}で使用</span>
      <strong>${escapeHtml(product.name)}</strong>
      <small>${escapeHtml([product.category, product.price].filter(Boolean).join(" / "))}</small>
    </div>
    <div class="sns-gemini-product-links">
      ${imageUrl ? `<a href="${escapeHtml(imageUrl)}" target="_blank" rel="noopener noreferrer">商品画像を開く</a>` : ""}
      ${productUrl ? `<a href="${escapeHtml(productUrl)}" target="_blank" rel="noopener noreferrer">商品ページ</a>` : ""}
    </div>`;
  renderSocialGeminiProgress();
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || ""), window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function bindCoordinateActions() {
  if (!coordinateOutput || !coordBoard) return;
  populateCoordinateOverseasCities();
  applyRandomCoordinateLocation();
  const coordinateImportUrl = document.querySelector("#coordProductUrl");
  const coordinateImportButton = document.querySelector("#coordImportProduct");
  const importCoordinateProduct = () => importProductForCoordinate(coordinateImportUrl, coordinateImportButton);
  coordinateImportButton?.addEventListener("click", importCoordinateProduct);
  coordinateImportUrl?.addEventListener("paste", () => window.setTimeout(importCoordinateProduct, 0));
  coordinateImportUrl?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      importCoordinateProduct();
    }
  });
  document.querySelector("#coordPhoto")?.addEventListener("change", uploadCoordinatePhotos);
  document.querySelector("#coordPhotoLibrary")?.addEventListener("click", handleCoordinatePhotoLibraryClick);
  document.querySelector("#homeCoordPhoto")?.addEventListener("change", uploadCoordinatePhotos);
  document.querySelector("#homeCoordPhotoLibrary")?.addEventListener("click", handleCoordinatePhotoLibraryClick);
  document.querySelector("#coordMainProduct")?.addEventListener("change", (event) => {
    const product = state.products.find((item) => item.id === event.currentTarget.value);
    if (product) applyRecommendedCoordinateDefaults(product);
  });
  document.querySelector("#coordImagePattern")?.addEventListener("change", (event) => {
    if (isHanakoTeacherPattern(event.currentTarget.value)) applySelectedHanakoTeacher();
    else updateHanakoTeacherPreview();
    if (coordinateOutput.value.trim()) {
      const coordinate = getSelectedCoordinate();
      setCoordinatePrompts(coordinate);
      drawCoordinateBoard(coordinate, coordinateOutput.value);
    }
  });
  document.querySelector("#coordLocation")?.addEventListener("change", () => {
    updateCoordinateCityVisibility();
    refreshCoordinatePromptsAfterSettingChange();
  });
  document.querySelector("#coordCity")?.addEventListener("change", refreshCoordinatePromptsAfterSettingChange);
  document.querySelector("#coordPose")?.addEventListener("change", refreshCoordinatePromptsAfterSettingChange);
  applyRandomCoordinatePose();
  document.querySelector("#rerollHanakoTeacher")?.addEventListener("click", () => {
    activateHanakoTeacherMode("random", true, true);
  });
  document.querySelector("#autoCoordinate")?.addEventListener("click", () => autoSelectCoordinateItems(true, true, true));
  document.querySelector("#generateCoordinate")?.addEventListener("click", generateCoordinate);
  document.querySelector("#copyCoordinateText")?.addEventListener("click", () => copyText(coordinateOutput.value));
  document.querySelector("#copyGeminiImagePrompt")?.addEventListener("click", copyCoordinateImagePrompt);
  document.querySelector("#copyGeminiCaptionPrompt")?.addEventListener("click", () => copyText(coordGeminiCaptionPrompt.value));
  document.querySelector("#openGemini")?.addEventListener("click", openGemini);
  document.querySelector("#shareCoordinateToGemini")?.addEventListener("click", shareCoordinateToGemini);
  document.querySelector("#downloadCoordinateBoard")?.addEventListener("click", downloadCoordinateBoard);
  document.querySelector("#coordGeneratedImage")?.addEventListener("change", previewGeneratedCoordinateImage);
  bindHanakoTeacherSelector();
  updateHanakoTeacherPreview();
}

function isHanakoTeacherPattern(pattern = document.querySelector("#coordImagePattern")?.value) {
  const normalized = String(pattern || "").replace(/\s+/g, "").trim();
  return normalized === "ハナコ先生の吹き出し解説"
    || (normalized.includes("ハナコ先生") && normalized.includes("吹き出し"));
}

async function uploadCoordinatePhotos(event) {
  const files = [...(event.target.files || [])];
  event.target.value = "";
  if (!files.length) return;
  const status = document.querySelector(event.target.id === "homeCoordPhoto" ? "#homeCoordPhotoStatus" : "#coordPhotoStatus");
  if (!cloudSync.signedIn) {
    const message = "先に画面上の同期設定からログインしてください";
    if (status) {
      status.textContent = message;
      status.classList.add("error");
    }
    return showToast(message);
  }
  const available = Math.max(0, COORDINATE_PHOTO_LIMIT - state.coordinatePhotos.length);
  if (!available) return showToast(`写真は${COORDINATE_PHOTO_LIMIT}枚までです。入れ替える写真を削除してください`);
  const targets = files.slice(0, available);
  try {
    status?.classList.remove("error");
    if (status) status.textContent = `${targets.length}枚を安全に保存しています…`;
    let uploadedCount = 0;
    for (const file of targets) {
      const extension = String(file.name || "").split(".").pop().toLowerCase();
      const looksLikeImage = file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "heic", "heif", "avif"].includes(extension);
      if (!looksLikeImage) throw new Error("画像ファイルを選んでください");
      if (file.size > 10 * 1024 * 1024) throw new Error("写真は1枚10MB以下にしてください");
      const uploaded = await cloudSync.uploadPrivateImage(file);
      const photo = {
        id: createId(),
        name: file.name || `全身写真${state.coordinatePhotos.length + 1}`,
        path: uploaded.path,
        signedUrl: uploaded.signedUrl,
        expiresAt: uploaded.expiresAt,
        createdAt: new Date().toISOString(),
      };
      state.coordinatePhotos.push(photo);
      state.selectedCoordinatePhotoId = photo.id;
      coordinatePhotoDataUrl = await persistCoordinatePhotoPreview(photo.id, file);
      uploadedCount += 1;
    }
    if (!uploadedCount) throw new Error("写真を読み込めませんでした。写真アプリから画像を選び直してください");
    saveState();
    markRoomImagePromptStale();
    coordinateBoardDataUrl = "";
    coordinateBoardHasPerson = false;
    renderCoordinatePhotoLibrary();
    if (coordinateOutput.value.trim()) await drawCoordinateBoard(getSelectedCoordinate(), coordinateOutput.value);
    showToast(`${uploadedCount}枚の写真を保存しました`);
  } catch (error) {
    const message = error.message || "写真を保存できませんでした";
    if (status) {
      status.textContent = message;
      status.classList.add("error");
    }
    showToast(message);
  }
}

async function handleCoordinatePhotoLibraryClick(event) {
  const deleteButton = event.target.closest("[data-delete-coordinate-photo]");
  if (deleteButton) {
    event.stopPropagation();
    const photo = state.coordinatePhotos.find((item) => item.id === deleteButton.dataset.deleteCoordinatePhoto);
    if (!photo) return;
    try {
      await cloudSync.removePrivateImage(photo.path);
      await removeCoordinatePhotoPreview(photo.id);
      state.coordinatePhotos = state.coordinatePhotos.filter((item) => item.id !== photo.id);
      if (state.selectedCoordinatePhotoId === photo.id) state.selectedCoordinatePhotoId = state.coordinatePhotos[0]?.id || "";
      saveState();
      markRoomImagePromptStale();
      coordinateBoardDataUrl = "";
      coordinateBoardHasPerson = false;
      renderCoordinatePhotoLibrary();
      showToast("写真を削除しました");
    } catch (error) {
      showToast(error.message || "写真を削除できませんでした");
    }
    return;
  }
  const selectButton = event.target.closest("[data-select-coordinate-photo]");
  if (!selectButton) return;
  state.selectedCoordinatePhotoId = selectButton.dataset.selectCoordinatePhoto;
  saveState();
  markRoomImagePromptStale();
  coordinateBoardDataUrl = "";
  coordinateBoardHasPerson = false;
  renderCoordinatePhotoLibrary();
  showToast("今回使う写真を選びました");
  try {
    await ensureSelectedCoordinatePhotoUrl();
    saveState();
    renderCoordinatePhotoLibrary();
    if (coordinateOutput.value.trim()) drawCoordinateBoard(getSelectedCoordinate(), coordinateOutput.value);
  } catch (error) {
    const message = "写真は選択済みです。画像URLは生成時にもう一度更新します。";
    document.querySelectorAll("#coordPhotoStatus, #homeCoordPhotoStatus").forEach((status) => {
      status.textContent = message;
      status.classList.add("error");
    });
    showToast(message);
  }
}

function renderCoordinatePhotoLibrary() {
  state.coordinatePhotos ||= [];
  const selected = getSelectedCoordinatePhoto();
  coordinatePhotoDataUrl = selected ? getCoordinatePhotoDisplaySrc(selected) : "";
  const libraryHtml = state.coordinatePhotos.length ? state.coordinatePhotos.map((photo, index) => `
      <div class="coord-photo-card${photo.id === state.selectedCoordinatePhotoId ? " selected" : ""}">
        <button type="button" data-select-coordinate-photo="${escapeHtml(photo.id)}" aria-label="${index + 1}枚目の写真を選ぶ">
          ${renderCoordinatePhotoThumb(photo, index)}
          <strong>${escapeHtml(photo.name || `写真${index + 1}`)}</strong>
        </button>
        <button class="coord-photo-delete" type="button" data-delete-coordinate-photo="${escapeHtml(photo.id)}" aria-label="この写真を削除">×</button>
      </div>`).join("") : `<p class="muted">まだ写真がありません。「写真を追加」から登録してください。</p>`;
  document.querySelectorAll("#coordPhotoLibrary, #homeCoordPhotoLibrary").forEach((target) => {
    target.innerHTML = libraryHtml;
  });
  const selectedName = selected?.name || "未選択";
  const statusText = cloudSync.signedIn
    ? `${state.coordinatePhotos.length}/${COORDINATE_PHOTO_LIMIT}枚保存中。今回使う写真：${selectedName}`
    : "写真を追加・更新するには、クラウド同期へログインしてください。";
  document.querySelectorAll("#coordPhotoStatus, #homeCoordPhotoStatus").forEach((status) => {
    status.textContent = statusText;
    status.classList.remove("error");
  });
  renderRoomImagePhotoPreview();
  hydrateCoordinatePhotoPreviews();
}

function renderCoordinatePhotoThumb(photo, index) {
  const src = getCoordinatePhotoDisplaySrc(photo);
  if (src) return `<img src="${escapeHtml(src)}" alt="保存した全身写真${index + 1}">`;
  return `<div class="coord-photo-thumb-empty" aria-label="保存した全身写真${index + 1}を読み込み中">PHOTO</div>`;
}

function getCoordinatePhotoDisplaySrc(photo) {
  if (!photo?.id) return "";
  const localPreview = coordinatePhotoPreviewCache.get(photo.id);
  if (localPreview) return localPreview;
  if (photo.signedUrl && Number(photo.expiresAt || 0) - Date.now() > 60 * 1000) return photo.signedUrl;
  return "";
}

async function hydrateCoordinatePhotoPreviews() {
  if (coordinatePhotoPreviewHydrating || !state.coordinatePhotos?.length) return;
  const missing = state.coordinatePhotos.filter((photo) => photo?.id && !coordinatePhotoPreviewCache.has(photo.id));
  if (!missing.length) return;
  coordinatePhotoPreviewHydrating = true;
  let changed = false;
  try {
    for (const photo of missing) {
      const localPreview = await readPersistedCoordinatePhotoPreview(photo.id);
      if (localPreview) {
        coordinatePhotoPreviewCache.set(photo.id, localPreview);
        changed = true;
        continue;
      }
      if (photo.signedUrl && Number(photo.expiresAt || 0) - Date.now() > 60 * 1000) {
        try {
          await loadCoordinatePhotoPreview(photo);
          changed = true;
        } catch {
          // 期限切れや通信失敗の写真は、同期ログイン後のURL更新で復元する。
        }
      }
    }
  } finally {
    coordinatePhotoPreviewHydrating = false;
  }
  if (changed) renderCoordinatePhotoLibrary();
}

function getSelectedCoordinatePhoto() {
  return state.coordinatePhotos?.find((photo) => photo.id === state.selectedCoordinatePhotoId) || state.coordinatePhotos?.[0] || null;
}

async function ensureSelectedCoordinatePhotoUrl() {
  const photo = getSelectedCoordinatePhoto();
  if (!photo) return "";
  if (photo.signedUrl && Number(photo.expiresAt || 0) - Date.now() > 10 * 60 * 1000) {
    await loadCoordinatePhotoPreview(photo);
    return photo.signedUrl;
  }
  if (!cloudSync.signedIn) throw new Error("写真URLの更新にはクラウド同期へのログインが必要です");
  const signed = await cloudSync.createSignedImageUrl(photo.path);
  Object.assign(photo, signed);
  await loadCoordinatePhotoPreview(photo);
  return photo.signedUrl;
}

async function loadCoordinatePhotoPreview(photo = getSelectedCoordinatePhoto()) {
  if (!photo) {
    coordinatePhotoDataUrl = "";
    return "";
  }
  if (coordinatePhotoPreviewCache.has(photo.id)) {
    coordinatePhotoDataUrl = coordinatePhotoPreviewCache.get(photo.id);
    return coordinatePhotoDataUrl;
  }
  const localPreview = await readPersistedCoordinatePhotoPreview(photo.id);
  if (localPreview) {
    coordinatePhotoPreviewCache.set(photo.id, localPreview);
    coordinatePhotoDataUrl = localPreview;
    return localPreview;
  }
  if (!photo.signedUrl) return "";
  const response = await fetch(photo.signedUrl, { cache: "no-store" });
  if (!response.ok) throw new Error("保存した写真を読み込めませんでした");
  const dataUrl = await persistCoordinatePhotoPreview(photo.id, await response.blob());
  coordinatePhotoPreviewCache.set(photo.id, dataUrl);
  coordinatePhotoDataUrl = dataUrl;
  return dataUrl;
}

async function persistCoordinatePhotoPreview(photoId, sourceBlob) {
  const dataUrl = await createCanvasCompatiblePhotoPreview(sourceBlob);
  coordinatePhotoPreviewCache.set(photoId, dataUrl);
  if ("caches" in window) {
    try {
      const cache = await caches.open(COORDINATE_PHOTO_CACHE);
      const file = dataUrlToFile(dataUrl, `${photoId}.jpg`);
      await cache.put(coordinatePhotoCacheKey(photoId), new Response(file, { headers: { "Content-Type": file.type || "image/jpeg" } }));
    } catch {
      // メモリ上のプレビューは使えるため、端末保存だけ失敗しても続行する。
    }
  }
  return dataUrl;
}

async function readPersistedCoordinatePhotoPreview(photoId) {
  if (!("caches" in window)) return "";
  try {
    const cache = await caches.open(COORDINATE_PHOTO_CACHE);
    const response = await cache.match(coordinatePhotoCacheKey(photoId));
    return response ? await readOriginalFileAsDataUrl(await response.blob()) : "";
  } catch {
    return "";
  }
}

async function removeCoordinatePhotoPreview(photoId) {
  coordinatePhotoPreviewCache.delete(photoId);
  if (!("caches" in window)) return;
  try {
    const cache = await caches.open(COORDINATE_PHOTO_CACHE);
    await cache.delete(coordinatePhotoCacheKey(photoId));
  } catch {
    // 端末側キャッシュが既に無い場合は何もしない。
  }
}

function coordinatePhotoCacheKey(photoId) {
  return new URL(`./__photo_preview__/${encodeURIComponent(photoId)}`, location.href).href;
}

async function createCanvasCompatiblePhotoPreview(sourceBlob) {
  const original = await readOriginalFileAsDataUrl(sourceBlob);
  const image = await loadImage(original).catch(() => null);
  if (!image) return original;
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

async function refreshCoordinatePhotoLibraryUrls() {
  if (!cloudSync.signedIn || !state.coordinatePhotos?.length) return;
  try {
    for (const photo of state.coordinatePhotos) {
      if (!photo.signedUrl || Number(photo.expiresAt || 0) - Date.now() <= 10 * 60 * 1000) {
        Object.assign(photo, await cloudSync.createSignedImageUrl(photo.path));
      }
    }
    for (const photo of state.coordinatePhotos) {
      await loadCoordinatePhotoPreview(photo).catch(() => "");
    }
    localStorage.setItem("hanako-room-ops", JSON.stringify(state));
    renderCoordinatePhotoLibrary();
  } catch {
    renderCoordinatePhotoLibrary();
  }
}

function chooseRandomHanakoTeacher() {
  const candidates = hanakoTeacherGuides.filter((guide) => guide.id !== currentHanakoTeacher?.id);
  currentHanakoTeacher = candidates[Math.floor(Math.random() * candidates.length)] || hanakoTeacherGuides[0];
  updateHanakoTeacherPreview();
  return currentHanakoTeacher;
}

function bindHanakoTeacherSelector() {
  const selector = document.querySelector("#coordHanakoTeacher");
  const coverflow = document.querySelector("#teacherCoverflow");
  if (!selector || !coverflow) return;
  const items = getHanakoTeacherCoverflowItems();
  selector.innerHTML = items.map((item) => `<option value="${item.id}">${item.name}</option>`).join("");
  selector.value = hanakoTeacherMode;
  selector.addEventListener("change", (event) => {
    activateHanakoTeacherMode(event.currentTarget.value, true);
  });

  coverflow.innerHTML = items.map((item) => `
    <button class="teacher-coverflow-card" type="button" role="option" aria-selected="false" data-teacher-mode="${item.id}" title="${item.name}">
      <span class="teacher-coverflow-image-wrap">
        <img src="${item.avatar}" alt="">
        ${item.badge ? `<small>${item.badge}</small>` : ""}
      </span>
      <strong>${item.shortName}</strong>
    </button>`).join("");
  coverflow.addEventListener("click", (event) => {
    const card = event.target.closest("[data-teacher-mode]");
    if (card) activateHanakoTeacherMode(card.dataset.teacherMode, true);
  });
  coverflow.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    stepHanakoTeacherCoverflow(event.key === "ArrowRight" ? 1 : -1);
  });
  coverflow.addEventListener("scroll", () => {
    window.requestAnimationFrame(paintHanakoTeacherCoverflow);
    window.clearTimeout(hanakoTeacherCoverflowScrollTimer);
    hanakoTeacherCoverflowScrollTimer = window.setTimeout(selectCenteredHanakoTeacherCard, 140);
  }, { passive: true });
  document.querySelector("#teacherCoverflowPrev")?.addEventListener("click", () => stepHanakoTeacherCoverflow(-1));
  document.querySelector("#teacherCoverflowNext")?.addEventListener("click", () => stepHanakoTeacherCoverflow(1));
  window.addEventListener("resize", paintHanakoTeacherCoverflow, { passive: true });
  syncHanakoTeacherCoverflow(true);
}

function getHanakoTeacherCoverflowItems() {
  const appearanceId = state.appearance?.avatarTheme || "original";
  const appearanceGuide = hanakoTeacherGuides.find((guide) => guide.id === appearanceId)
    || (appearanceId === "custom" && state.appearance?.customAvatar ? {
      id: "custom",
      name: "自作アイコンのハナコ先生",
      avatar: state.appearance.customAvatar,
      tone: "自分で選んだアイコンでコーデを解説",
    } : hanakoTeacherGuides[0]);
  const featuredIds = new Set(["ribbonresort", "marineswim"]);
  const featured = hanakoTeacherGuides.filter((guide) => featuredIds.has(guide.id));
  const remaining = hanakoTeacherGuides.filter((guide) => !featuredIds.has(guide.id));
  return [
    { id: "random", name: "毎回ランダム", shortName: "おまかせ", avatar: currentHanakoTeacher.avatar, badge: "↻" },
    { id: "appearance", name: "選んだアプリアイコン", shortName: "アプリと同じ", avatar: appearanceGuide.avatar, badge: "同じ" },
    ...[...featured, ...remaining].map((guide) => ({ ...guide, shortName: guide.name.replace(/の?ハナコ(先生)?$/, "") })),
  ];
}

function activateHanakoTeacherMode(mode, scrollSelected = true, refreshComment = false) {
  const validModes = new Set(["random", "appearance", ...hanakoTeacherGuides.map((guide) => guide.id)]);
  hanakoTeacherMode = validModes.has(mode) ? mode : "random";
  const selector = document.querySelector("#coordHanakoTeacher");
  if (selector) selector.value = hanakoTeacherMode;
  applySelectedHanakoTeacher();
  syncHanakoTeacherCoverflow(scrollSelected);
  if (coordinateOutput.value.trim()) {
    const coordinate = getSelectedCoordinate();
    if (refreshComment) coordinate.hanakoComment = chooseHanakoTeacherComment(coordinate, true);
    setCoordinatePrompts(coordinate);
    drawCoordinateBoard(coordinate, coordinateOutput.value);
  }
}

function stepHanakoTeacherCoverflow(direction) {
  const items = getHanakoTeacherCoverflowItems();
  const currentIndex = Math.max(0, items.findIndex((item) => item.id === hanakoTeacherMode));
  const nextIndex = Math.min(items.length - 1, Math.max(0, currentIndex + direction));
  activateHanakoTeacherMode(items[nextIndex].id, true);
}

function selectCenteredHanakoTeacherCard() {
  if (Date.now() < hanakoTeacherCoverflowIgnoreUntil) return;
  const coverflow = document.querySelector("#teacherCoverflow");
  if (!coverflow) return;
  const center = coverflow.getBoundingClientRect().left + coverflow.clientWidth / 2;
  const cards = [...coverflow.querySelectorAll("[data-teacher-mode]")];
  const nearest = cards.reduce((best, card) => {
    const rect = card.getBoundingClientRect();
    const distance = Math.abs(rect.left + rect.width / 2 - center);
    return !best || distance < best.distance ? { card, distance } : best;
  }, null);
  const mode = nearest?.card.dataset.teacherMode;
  if (mode && mode !== hanakoTeacherMode) activateHanakoTeacherMode(mode, false);
}

function syncHanakoTeacherCoverflow(scrollSelected = false) {
  const coverflow = document.querySelector("#teacherCoverflow");
  if (!coverflow) return;
  const randomImage = coverflow.querySelector('[data-teacher-mode="random"] img');
  const appearanceImage = coverflow.querySelector('[data-teacher-mode="appearance"] img');
  const appearanceId = state.appearance?.avatarTheme || "original";
  const appearanceGuide = hanakoTeacherGuides.find((guide) => guide.id === appearanceId)
    || (appearanceId === "custom" && state.appearance?.customAvatar ? {
      avatar: state.appearance.customAvatar,
    } : hanakoTeacherGuides[0]);
  if (randomImage) randomImage.src = currentHanakoTeacher.avatar;
  if (appearanceImage) appearanceImage.src = appearanceGuide.avatar;
  coverflow.querySelectorAll("[data-teacher-mode]").forEach((card) => {
    const selected = card.dataset.teacherMode === hanakoTeacherMode;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-selected", String(selected));
  });
  if (scrollSelected) {
    const selectedCard = coverflow.querySelector(`[data-teacher-mode="${hanakoTeacherMode}"]`);
    if (selectedCard) {
      hanakoTeacherCoverflowIgnoreUntil = Date.now() + 550;
      selectedCard.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }
  window.requestAnimationFrame(paintHanakoTeacherCoverflow);
}

function paintHanakoTeacherCoverflow() {
  const coverflow = document.querySelector("#teacherCoverflow");
  if (!coverflow) return;
  const bounds = coverflow.getBoundingClientRect();
  const center = bounds.left + bounds.width / 2;
  coverflow.querySelectorAll("[data-teacher-mode]").forEach((card) => {
    const rect = card.getBoundingClientRect();
    const offset = Math.max(-2.2, Math.min(2.2, (rect.left + rect.width / 2 - center) / Math.max(82, rect.width)));
    const distance = Math.abs(offset);
    card.style.setProperty("--cover-rotate", `${offset * -24}deg`);
    card.style.setProperty("--cover-scale", String(Math.max(0.72, 1 - distance * 0.16)));
    card.style.setProperty("--cover-opacity", String(Math.max(0.48, 1 - distance * 0.22)));
    card.style.setProperty("--cover-z", String(Math.round(20 - distance * 5)));
  });
}

function applySelectedHanakoTeacher() {
  if (hanakoTeacherMode === "random") return chooseRandomHanakoTeacher();
  const selectedId = hanakoTeacherMode === "appearance" ? state.appearance?.avatarTheme : hanakoTeacherMode;
  currentHanakoTeacher = hanakoTeacherGuides.find((guide) => guide.id === selectedId) || hanakoTeacherGuides[0];
  updateHanakoTeacherPreview();
  return currentHanakoTeacher;
}

function updateHanakoTeacherPreview() {
  const preview = document.querySelector("#hanakoTeacherPreview");
  if (!preview) return;
  preview.hidden = !isHanakoTeacherPattern();
  const avatar = document.querySelector("#hanakoTeacherAvatar");
  const name = document.querySelector("#hanakoTeacherName");
  const tone = document.querySelector("#hanakoTeacherTone");
  if (avatar) avatar.src = currentHanakoTeacher.avatar;
  if (name) name.textContent = currentHanakoTeacher.name;
  if (tone) tone.textContent = currentHanakoTeacher.tone;
  syncHanakoTeacherCoverflow(false);
}

async function importProductForCoordinate(urlInput, button) {
  const url = urlInput?.value.trim();
  if (!url) {
    showCoordinateImportStatus("楽天ROOMまたは楽天市場の商品URLを入力してください", true);
    urlInput?.focus();
    return;
  }
  if (!cloudSync.configured) return showCoordinateImportStatus("先にクラウド同期を設定してください", true);
  if (!cloudSync.signedIn) return showCoordinateImportStatus("画面上部の「同期」からログインしてください", true);

  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "読込中...";
  showCoordinateImportStatus("商品情報を読み込んでいます...");
  try {
    const imported = normalizeCoordinateImportedProduct(await fetchRakutenProduct(url), url);
    if (isDefiniteTravelProduct(imported, url)) throw new Error("このURLは宿泊施設として判定されました。ファッション商品の楽天URLを入力してください");
    let product = state.products.find((item) => item.url === url || item.url === imported.sourceUrl || item.url === imported.resolvedUrl);
    if (product) {
      Object.assign(product, {
        name: imported.name || product.name,
        url,
        image: imported.image || product.image,
        details: imported.details || product.details || {},
        category: imported.category || product.category,
        price: imported.price || product.price,
        hook: imported.hook || product.hook,
      });
      Object.assign(product, enrichProductForOps(product));
    } else {
      product = enrichProductForOps({
        id: createId(),
        name: imported.name || "楽天ROOMの商品",
        url,
        image: imported.image || "",
        details: imported.details || {},
        category: imported.category || "その他",
        price: imported.price || "",
        hook: imported.hook || "コーデの雰囲気を整えやすい",
      });
      state.products.unshift(product);
    }
    saveState();
    renderProducts();
    renderProductOptions();
    renderRoomProductOptions();
    renderCoordinateOptions();
    renderAngleOptions();
    selectCoordinateProduct(product);
    showCoordinateImportStatus(`「${product.name}」を追加しました。コーデを作成しています...`);
    await generateCoordinate();
    showCoordinateImportStatus(`「${product.name}」からコーデ文・画像ボードを作りました`);
  } catch (error) {
    showCoordinateImportStatus(error.message || "商品情報を読み込めませんでした", true);
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

function normalizeCoordinateImportedProduct(imported, originalUrl) {
  const product = { ...imported, details: { ...(imported?.details || {}) } };
  const detectedCategory = detectFashionCategory(`${product.name || ""} ${product.category || ""} ${product.hook || ""}`);
  if (detectedCategory && product.category !== "ホテル・旅行") product.category = detectedCategory;
  if (product.category !== "ホテル・旅行") return product;
  const sourceUrl = product.sourceUrl || product.url || originalUrl;
  if (isExplicitRakutenTravelUrl(sourceUrl) || isExplicitRakutenTravelUrl(originalUrl)) return product;

  const text = `${product.name || ""} ${product.hook || ""} ${product.details?.brand || ""}`;
  const fashionCategory = detectFashionCategory(text);
  const travelText = `${product.name || ""} ${product.hook || ""} ${product.details?.location || ""}`;
  const hasTravelIdentity = hasTravelProductIdentity(travelText);
  if (!fashionCategory && hasTravelIdentity) return product;

  const category = fashionCategory || "トップス";
  return {
    ...product,
    category,
    kind: "product",
    hook: createCoordinateHook({ category }),
    details: {
      brand: product.details?.brand || "",
      color: product.details?.color || "",
      material: product.details?.material || "",
      rating: product.details?.rating || "",
      reviewCount: product.details?.reviewCount || "",
    },
    coordinateCategoryCorrected: true,
  };
}

function isDefiniteTravelProduct(product, originalUrl) {
  if (product?.category !== "ホテル・旅行") return false;
  if (isExplicitRakutenTravelUrl(product?.sourceUrl || product?.url || "") || isExplicitRakutenTravelUrl(originalUrl)) return true;
  const text = `${product?.name || ""} ${product?.hook || ""} ${product?.details?.location || ""}`;
  return hasTravelProductIdentity(text);
}

function hasTravelProductIdentity(value) {
  return /ホテル|旅館|宿泊|客室|温泉|リゾート|チェックイン|朝食付き|素泊まり|\b(?:hotel|inn|villa|lodge|resort|stay)\b/i.test(String(value || ""));
}

function isExplicitRakutenTravelUrl(value) {
  try {
    const host = new URL(String(value || "")).hostname.toLowerCase();
    return host === "travel.rakuten.co.jp" || host.endsWith(".travel.rakuten.co.jp");
  } catch {
    return false;
  }
}

function detectFashionCategory(value) {
  const text = String(value || "");
  if (/マタニティ|授乳服/.test(text)) return "マタニティ";
  if (/ブラジャー|ショーツ|ランジェリー|補正下着|ナイトブラ/.test(text)) return "ランジェリー";
  if (/インナー|ペチコート|肌着/.test(text)) return "インナー";
  if (/水着|ラッシュガード|ビキニ|スイムウェア/.test(text)) return "水着・水際";
  if (/ルームウェア|パジャマ|部屋着/.test(text)) return "ルームウェア";
  if (/浴衣|ゆかた|甚平/.test(text)) return "浴衣";
  if (/レインコート|レインウェア|雨具/.test(text)) return "レインウェア";
  if (/スポーツウェア|ヨガウェア|トレーニングウェア/.test(text)) return "スポーツウェア";
  if (/ブライダル|ウェディング|花嫁/.test(text)) return "ブライダル";
  if (/スーツ|フォーマル|礼服|喪服/.test(text)) return "スーツ・フォーマル";
  if (/セットアップ/.test(text)) return "セットアップ";
  if (/オールインワン|サロペット|ジャンプスーツ/.test(text)) return "オールインワン";
  if (/カーディガン|ボレロ/.test(text)) return "カーディガン";
  if (/コート|ジャケット|ブルゾン|アウター|パーカー/.test(text)) return "アウター";
  if (/ワンピ|ドレス|チュニック/.test(text)) return "ワンピース";
  if (/スカート/.test(text)) return "スカート";
  if (/デニム|ジーンズ|ジーパン/.test(text)) return "デニム";
  if (/パンツ|ズボン|スラックス|キュロット/.test(text)) return "パンツ";
  if (/バッグ|鞄|トート|ショルダー|リュック|ポーチ/.test(text)) return "バッグ";
  if (/パンプス|サンダル|スニーカー|ブーツ|シューズ|ローファー|靴/.test(text)) return "シューズ";
  if (/財布|ウォレット|カードケース/.test(text)) return "財布";
  if (/帽子|キャップ|ハット|ベレー/.test(text)) return "帽子";
  if (/ヘアクリップ|バレッタ|シュシュ|カチューシャ|ヘアアクセ/.test(text)) return "ヘアアクセサリー";
  if (/腕時計|ウォッチ/.test(text)) return "腕時計";
  if (/ストール|マフラー|スカーフ/.test(text)) return "ストール・マフラー";
  if (/ベルト/.test(text)) return "ベルト";
  if (/サングラス|眼鏡|メガネ/.test(text)) return "サングラス";
  if (/タイツ|靴下|ソックス|レギンス/.test(text)) return "レッグウェア";
  if (/傘|日傘/.test(text)) return "傘";
  if (/ピアス|イヤリング|ネックレス|リング|アクセサリ|ブレスレット|バングル/.test(text)) return "アクセサリー";
  if (/ニット|セーター/.test(text)) return "ニット";
  if (/ブラウス|シャツ|カットソー|Tシャツ|トップス|ベスト|キャミソール/.test(text)) return "トップス";
  return "";
}

function selectCoordinateProduct(product) {
  const selectors = {
    ワンピース: "#coordOnepiece",
    トップス: "#coordTop",
    アウター: "#coordTop",
    スカート: "#coordBottom",
    パンツ: "#coordBottom",
    バッグ: "#coordBag",
    シューズ: "#coordShoes",
    アクセサリー: "#coordAccessory",
    ニット: "#coordTop",
    カーディガン: "#coordTop",
    デニム: "#coordBottom",
    オールインワン: "#coordOnepiece",
    ヘアアクセサリー: "#coordAccessory",
    帽子: "#coordAccessory",
    腕時計: "#coordAccessory",
    "ストール・マフラー": "#coordAccessory",
    ベルト: "#coordAccessory",
    サングラス: "#coordAccessory",
    レッグウェア: "#coordAccessory",
    傘: "#coordAccessory",
    財布: "#coordAccessory",
    ファッション小物: "#coordAccessory",
  };
  const selector = selectors[product.category];
  const select = selector ? document.querySelector(selector) : null;
  const mainSelect = document.querySelector("#coordMainProduct");
  if (mainSelect && [...mainSelect.options].some((option) => option.value === product.id)) mainSelect.value = product.id;
  if (!select || ![...select.options].some((option) => option.value === product.id)) {
    showCoordinateImportStatus("商品を登録しました。下の商品欄から選んでください");
    return;
  }
  if (["ワンピース", "オールインワン"].includes(product.category)) {
    document.querySelector("#coordTop").value = "";
    document.querySelector("#coordBottom").value = "";
  } else if (["トップス", "ニット", "カーディガン", "アウター", "スカート", "パンツ", "デニム"].includes(product.category)) {
    document.querySelector("#coordOnepiece").value = "";
  }
  select.value = product.id;
  applyRecommendedCoordinateDefaults(product, false);
}

function showCoordinateImportStatus(message, isError = false) {
  const target = document.querySelector("#coordImportStatus");
  if (!target) return;
  target.textContent = message;
  target.classList.toggle("error", isError);
}

function renderCoordinateOptions() {
  const mainSelect = document.querySelector("#coordMainProduct");
  if (mainSelect) {
    const previousMain = mainSelect.value;
    mainSelect.innerHTML = `<option value="">主役商品を選ぶ</option>`;
    state.products
      .filter((product) => product.category !== "ホテル・旅行")
      .forEach((product) => {
        const option = document.createElement("option");
        option.value = product.id;
        option.textContent = `${product.name} / ${product.category}`;
        mainSelect.appendChild(option);
      });
    if ([...mainSelect.options].some((option) => option.value === previousMain)) mainSelect.value = previousMain;
  }
  const configs = [
    ["#coordOnepiece", ["ワンピース", "オールインワン"]],
    ["#coordTop", ["トップス", "ニット", "カーディガン", "アウター"]],
    ["#coordBottom", ["スカート", "パンツ", "デニム"]],
    ["#coordBag", ["バッグ"]],
    ["#coordShoes", ["シューズ"]],
    ["#coordAccessory", ["アクセサリー", "ヘアアクセサリー", "帽子", "腕時計", "ストール・マフラー", "ベルト", "サングラス", "レッグウェア", "傘", "財布", "ファッション小物"]],
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
  const mainProduct = byId("#coordMainProduct");
  const onepiece = byId("#coordOnepiece");
  const pieces = [
    mainProduct,
    onepiece,
    onepiece && byId("#coordTop")?.category !== "アウター" ? null : byId("#coordTop"),
    onepiece ? null : byId("#coordBottom"),
    byId("#coordBag"),
    byId("#coordShoes"),
    byId("#coordAccessory"),
  ].filter((product, index, products) => product && products.findIndex((item) => item?.id === product.id) === index);
  return {
    style: document.querySelector("#coordStyle")?.value || "大人ガーリー",
    occasion: document.querySelector("#coordOccasion")?.value || "友達とカフェ",
    hairStyle: document.querySelector("#coordHairStyle")?.value || "元写真の髪型を保つ",
    pose: document.querySelector("#coordPose")?.value || "全身が見える自然な立ち姿",
    imagePattern: document.querySelector("#coordImagePattern")?.value || "ハナコ先生の吹き出し解説",
    concern: document.querySelector("#coordConcern")?.value || "朝、服が決まらない",
    priority: document.querySelector("#coordPriority")?.value || "着回しやすさ",
    colorMood: document.querySelector("#coordColorMood")?.value || "商品から自動で整える",
    season: document.querySelector("#coordSeason")?.value || "今の季節",
    location: document.querySelector("#coordLocation")?.value || "overseas",
    city: document.querySelector("#coordCity")?.value || "パリ",
    landmark: getCoordinateSelectedLandmark(),
    hanakoTeacher: currentHanakoTeacher,
    hanakoComment: currentHanakoComment,
    personPhotoUrl: getSelectedCoordinatePhoto()?.signedUrl || "",
    products: pieces,
    mainProduct: mainProduct || pieces[0] || null,
  };
}

function populateCoordinateOverseasCities() {
  const select = document.querySelector("#coordCity");
  if (!select || select.options.length) return;
  getRoomOverseasCities().forEach(([city, landmark]) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = `${city}（${landmark}）`;
    option.dataset.landmark = landmark;
    select.appendChild(option);
  });
}

function applyRandomCoordinateLocation() {
  const location = document.querySelector("#coordLocation");
  const city = document.querySelector("#coordCity");
  if (location) location.value = "overseas";
  if (city) city.value = chooseBalancedOverseasCity("coordinate");
  updateCoordinateCityVisibility();
}

function coordinatePoseOptions() {
  const select = document.querySelector("#coordPose");
  return select ? [...select.options].map((option) => option.value).filter(Boolean) : [
    "全身が見える自然な立ち姿",
    "片足を少し前に出したきれいめ立ち",
    "バッグを持って軽く振り向く",
    "歩き出す瞬間のファッションスナップ",
  ];
}

function chooseRandomCoordinatePose(product = null) {
  const options = coordinatePoseOptions();
  const category = product?.category || "";
  const preferred = {
    ワンピース: ["歩き出す瞬間のファッションスナップ", "スカートや裾をふわっと見せるポーズ", "片足を少し前に出したきれいめ立ち"],
    スカート: ["スカートや裾をふわっと見せるポーズ", "歩き出す瞬間のファッションスナップ", "階段や街角で重心をきれいに見せる立ち姿"],
    パンツ: ["片足を少し前に出したきれいめ立ち", "歩き出す瞬間のファッションスナップ", "鏡を見るような自然な横向き"],
    バッグ: ["バッグを持って軽く振り向く", "小物を見せながら首元をすっきり見せる", "カフェ前で片手を添える上品ポーズ"],
    シューズ: ["椅子に浅く座って足元を見せる", "階段や街角で重心をきれいに見せる立ち姿", "歩き出す瞬間のファッションスナップ"],
    アクセサリー: ["小物を見せながら首元をすっきり見せる", "カフェ前で片手を添える上品ポーズ", "鏡を見るような自然な横向き"],
    アウター: ["バッグを持って軽く振り向く", "歩き出す瞬間のファッションスナップ", "片足を少し前に出したきれいめ立ち"],
    トップス: ["小物を見せながら首元をすっきり見せる", "片足を少し前に出したきれいめ立ち", "カフェ前で片手を添える上品ポーズ"],
  }[category] || options;
  const available = preferred.filter((pose) => options.includes(pose));
  const pool = available.length ? available : options;
  return pool[Math.floor(Math.random() * pool.length)] || "全身が見える自然な立ち姿";
}

function applyRandomCoordinatePose(product = null) {
  const select = document.querySelector("#coordPose");
  if (!select) return "";
  const pose = chooseRandomCoordinatePose(product);
  select.value = pose;
  return pose;
}

function updateCoordinateCityVisibility() {
  const field = document.querySelector("#coordCityField");
  if (field) field.hidden = document.querySelector("#coordLocation")?.value !== "overseas";
}

function getCoordinateSelectedLandmark() {
  const city = document.querySelector("#coordCity")?.value || "パリ";
  return getRoomOverseasCities().find(([name]) => name === city)?.[1] || "エッフェル塔";
}

function refreshCoordinatePromptsAfterSettingChange() {
  if (!coordinateOutput?.value.trim()) return;
  const coordinate = getSelectedCoordinate();
  setCoordinatePrompts(coordinate);
  void drawCoordinateBoard(coordinate, coordinateOutput.value);
}

async function autoSelectCoordinateItems(generateAfter = true, notify = true, searchRakuten = true) {
  const fashionProducts = state.products.filter((product) => product.category !== "ホテル・旅行");
  if (!fashionProducts.length) return showToast("先にファッション商品を登録してください");
  const mainSelect = document.querySelector("#coordMainProduct");
  const main = state.products.find((product) => product.id === mainSelect?.value) || fashionProducts[0];
  if (mainSelect && [...mainSelect.options].some((option) => option.value === main.id)) mainSelect.value = main.id;

  const selectedIds = new Set([main.id]);
  const slots = coordinateCompanionSlots(main.category);
  const setChoice = (selector, categories) => {
    const select = document.querySelector(selector);
    if (!select) return;
    const candidate = chooseCoordinateCompanion(categories, main, selectedIds);
    const value = candidate && [...select.options].some((option) => option.value === candidate.id) ? candidate.id : "";
    select.value = value;
    if (value) selectedIds.add(value);
  };

  clearCoordinateCompanionSelects();
  slots.forEach((slot) => setChoice(slot.selector, slot.categories));

  if (searchRakuten && slots.length) {
    await fillCoordinateSlotsFromRakuten(main, slots, selectedIds, notify);
  }

  const selectedCount = getSelectedCoordinate().products.length;
  if (notify) showToast(selectedCount > 1
    ? "主役に合うカテゴリだけでコーデを選びました"
    : "合う商品が見つかりませんでした。楽天検索設定を確認してください");
  if (generateAfter) await generateCoordinate();
}

function clearCoordinateCompanionSelects() {
  ["#coordOnepiece", "#coordTop", "#coordBottom", "#coordBag", "#coordShoes", "#coordAccessory"].forEach((selector) => {
    const select = document.querySelector(selector);
    if (select) select.value = "";
  });
}

function coordinateCompanionSlots(mainCategory) {
  const common = [
    { selector: "#coordBag", categories: ["バッグ"], keyword: "レディース バッグ" },
    { selector: "#coordShoes", categories: ["シューズ"], keyword: "レディース シューズ パンプス" },
    { selector: "#coordAccessory", categories: ["アクセサリー", "ヘアアクセサリー", "帽子", "腕時計", "ストール・マフラー", "ベルト", "サングラス", "レッグウェア", "傘", "財布", "ファッション小物"], keyword: "レディース ファッション小物 アクセサリー" },
  ];
  if (["ワンピース", "オールインワン", "セットアップ", "スーツ・フォーマル", "ブライダル", "ルームウェア", "水着・水際", "浴衣", "スポーツウェア", "レインウェア"].includes(mainCategory)) return common;
  if (["トップス", "ニット"].includes(mainCategory)) return [
    { selector: "#coordBottom", categories: ["スカート", "パンツ", "デニム"], keyword: "レディース スカート パンツ" },
    ...common,
  ];
  if (["スカート", "パンツ", "デニム"].includes(mainCategory)) return [
    { selector: "#coordTop", categories: ["トップス", "ニット"], keyword: "レディース ブラウス ニット トップス" },
    ...common,
  ];
  if (["アウター", "カーディガン"].includes(mainCategory)) return [
    { selector: "#coordTop", categories: ["トップス", "ニット"], keyword: "レディース ブラウス トップス" },
    { selector: "#coordBottom", categories: ["スカート", "パンツ", "デニム"], keyword: "レディース スカート パンツ" },
    ...common,
  ];
  return [
    { selector: "#coordTop", categories: ["トップス", "ニット"], keyword: "レディース ブラウス トップス" },
    { selector: "#coordBottom", categories: ["スカート", "パンツ", "デニム"], keyword: "レディース スカート パンツ" },
    ...common.filter((slot) => !slot.categories.includes(mainCategory)),
  ];
}

async function fillCoordinateSlotsFromRakuten(main, slots, selectedIds, notify) {
  if (!cloudSync.configured || !cloudSync.signedIn) {
    if (notify) showCoordinateImportStatus("登録商品で不足しています。楽天市場から探すには同期へログインしてください", true);
    return;
  }
  const button = document.querySelector("#autoCoordinate");
  const originalLabel = button?.textContent || "";
  if (button) {
    button.disabled = true;
    button.textContent = "楽天市場からコーデを検索中...";
  }
  showCoordinateImportStatus("主役に合う商品を楽天市場全体から探しています...");
  let added = 0;
  try {
    for (const slot of slots) {
      const query = buildCoordinateRakutenQuery(main, slot.keyword);
      const results = await fetchRakutenProductSearch(query);
      const candidate = chooseRakutenCoordinateCandidate(results, slot.categories, main, selectedIds);
      if (!candidate) continue;
      const product = addRakutenSearchProductToPipeline(candidate);
      if (!product) continue;
      selectedIds.add(product.id);
      added += 1;
      renderCoordinateOptions();
      const select = document.querySelector(slot.selector);
      if (select && [...select.options].some((option) => option.value === product.id)) select.value = product.id;
    }
    if (added) {
      saveState();
      renderProducts();
      renderRoomProductOptions();
      renderAngleOptions();
      showCoordinateImportStatus(`楽天市場から相性のよい商品を${added}点追加し、コーデに選びました`);
    } else {
      showCoordinateImportStatus("楽天市場で条件に合う商品が見つかりませんでした。登録商品から選びました", true);
    }
  } catch (error) {
    showCoordinateImportStatus(error.message || "楽天市場のコーデ検索に失敗しました", true);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }
}

function buildCoordinateRakutenQuery(main, categoryKeyword) {
  const style = document.querySelector("#coordStyle")?.value || "大人ガーリー";
  const season = document.querySelector("#coordSeason")?.value || "";
  const styleKeyword = {
    "大人ガーリー": "大人可愛い",
    "甘めきれいめ": "きれいめ",
    "骨格ウェーブ意識": "きれいめ",
    "淡色フェミニン": "淡色",
  }[style] || "きれいめ";
  const seasonalKeyword = ["夏", "冬"].includes(season) ? season : "";
  return [categoryKeyword, styleKeyword, seasonalKeyword]
    .filter(Boolean).join(" ").slice(0, 80);
}

function chooseRakutenCoordinateCandidate(results, categories, main, selectedIds) {
  const mainText = `${main.name || ""} ${main.details?.color || ""} ${main.details?.material || ""}`;
  const styleWords = (document.querySelector("#coordStyle")?.value || "").split(/[・\s]+/).filter((word) => word.length >= 2);
  return results
    .filter((item) => categories.includes(item.category))
    .filter((item) => !state.products.some((product) => selectedIds.has(product.id) && (product.url === item.sourceUrl || product.url === item.url)))
    .map((item) => {
      const text = `${item.name || ""} ${item.hook || ""} ${item.details?.color || ""}`;
      const styleScore = styleWords.reduce((score, word) => score + (text.includes(word) ? 2 : 0), 0);
      const imageScore = item.image ? 3 : 0;
      const ratingScore = Math.min(3, Number(item.details?.rating || 0) / 2);
      const duplicatePenalty = mainText && text === mainText ? -20 : 0;
      return { item, score: 10 + styleScore + imageScore + ratingScore + duplicatePenalty };
    })
    .sort((a, b) => b.score - a.score)[0]?.item || null;
}

function addRakutenSearchProductToPipeline(item) {
  const url = item.sourceUrl || item.url || "";
  const existing = state.products.find((product) => url && product.url === url);
  if (existing) return existing;
  const product = {
    id: createId(),
    name: item.name || "楽天市場の商品",
    url,
    image: item.image || "",
    details: { ...(item.details || {}), shopName: item.shopName || item.details?.brand || "" },
    category: item.category || "その他",
    price: item.price || "",
    hook: item.hook || createCoordinateHook(item),
  };
  state.products.unshift(product);
  return product;
}

function applyRecommendedCoordinateDefaults(product, notify = true) {
  if (!product || product.category === "ホテル・旅行") return;
  const text = `${product.name || ""} ${product.hook || ""} ${product.details?.color || ""} ${product.details?.material || ""}`;
  const setSelect = (id, value) => {
    const select = document.querySelector(`#${id}`);
    if (select && [...select.options].some((option) => option.value === value)) select.value = value;
  };
  const { style, occasion, concern, priority } = recommendCoordinateSettings(product, text);
  const colorMood = /黒|ブラック|ネイビー|濃色/.test(text)
    ? "白ベースで明るく"
    : /赤|ピンク|ブルー|グリーン|イエロー|パープル/.test(text)
      ? "差し色をひとつ"
      : /白|ホワイト|アイボリー|ベージュ|淡色/.test(text)
        ? "黒・濃色で引き締め"
        : "商品から自動で整える";
  const season = /半袖|ノースリーブ|シアー|サンダル|接触冷感|夏/.test(text)
    ? "夏"
    : /コート|ダウン|裏起毛|ブーツ|厚手|冬/.test(text)
      ? "冬"
      : /トレンチ|カーディガン|春/.test(text)
        ? "春"
        : /秋|スエード/.test(text)
          ? "秋"
          : "今の季節";
  const imagePattern = "ハナコ先生の吹き出し解説";
  const hairStyle = occasion === "きれいめ通勤"
    ? "低めポニーテール"
    : occasion === "デート"
      ? "ふんわりハーフアップ"
      : "元写真の髪型を保つ";

  setSelect("coordStyle", style);
  setSelect("coordOccasion", occasion);
  setSelect("coordConcern", concern);
  setSelect("coordPriority", priority);
  setSelect("coordColorMood", colorMood);
  setSelect("coordSeason", season);
  setSelect("coordImagePattern", imagePattern);
  setSelect("coordHairStyle", hairStyle);
  const pose = applyRandomCoordinatePose(product);
  applyRandomCoordinateLocation();
  setSelect("coordMainProduct", product.id);
  autoSelectCoordinateItems(false, false, true);
  if (notify) showToast(`おすすめを自動選択｜${style}・${occasion}・${concern}・${priority}・${pose}`);
}

function recommendCoordinateSettings(product, sourceText = "") {
  const text = String(sourceText || `${product.name || ""} ${product.hook || ""} ${product.details?.color || ""} ${product.details?.material || ""}`).toLowerCase();
  const category = product.category || "";
  const has = (pattern) => pattern.test(text);

  const style = has(/骨格|細見え|華奢|ウエスト|脚長|マーメイド|ハイウエスト/)
    ? "骨格ウェーブ意識"
    : has(/淡色|アイボリー|ベージュ|オフホワイト|くすみ|ミルク|エクリュ/)
      ? "淡色フェミニン"
      : has(/通勤|オフィス|仕事|ジャケット|上品|きれいめ|パール|ツイード/)
        ? "甘めきれいめ"
        : has(/大学|通学|スクール|スウェット|デニム|スニーカー|カジュアル/)
          ? "通学コーデ"
          : has(/渋谷|トレンド|韓国|ミニ|推し活/)
            ? "渋谷おでかけ"
            : has(/カフェ|休日|リラックス/)
              ? "週末カフェ"
              : "大人ガーリー";

  const occasion = has(/通勤|オフィス|仕事|ジャケット|きちんと|セットアップ/)
    ? "きれいめ通勤"
    : has(/旅行|トラベル|リゾート|温泉|キャリー/)
      ? "旅行"
      : has(/デート|お呼ばれ|記念日|レース|リボン|フリル|ワンピース/)
        ? "デート"
        : has(/大学|通学|スクール|スウェット|デニム|スニーカー/)
          ? "大学・通学"
          : ["バッグ", "シューズ", "アクセサリー"].includes(category) || has(/買い物|ショッピング|推し活/)
            ? "休日ショッピング"
            : "友達とカフェ";

  const concern = has(/骨格|細見え|華奢|ウエスト|脚長|体型|着やせ|マーメイド|ハイウエスト/)
    ? "全身のバランスを整えたい"
    : has(/透け|汗|雨|撥水|半袖|ノースリーブ|シアー|接触冷感|裏起毛|防寒/)
      ? "気温差に対応したい"
      : has(/映え|写真|推し活|顔映り|華やか/)
        ? "写真で可愛く見せたい"
        : has(/着回し|万能|2way|3way|定番|ベーシック/)
          ? "いつも同じ組み合わせになる"
          : has(/リボン|フリル|レース|甘め|ピンク|ティアード/)
            ? "甘すぎ・子どもっぽく見せたくない"
            : "朝、服が決まらない";

  const priority = has(/骨格|細見え|華奢|ウエスト|脚長|体型|着やせ|マーメイド|ハイウエスト/)
    ? "スタイルバランス"
    : has(/高見え|上品|きれいめ|素材感|パール|ツイード|本革/)
      ? "高見え"
      : has(/軽量|歩き|ストレッチ|スニーカー|通学|撥水|洗える|楽ちん/)
        ? "動きやすさ"
        : has(/映え|写真|推し活|華やか/)
          ? "写真映え"
          : "着回しやすさ";

  return { style, occasion, concern, priority };
}

function chooseCoordinateCompanion(categories, main, selectedIds) {
  const mainBrand = getCoordinateBrand(main).toLocaleLowerCase("ja-JP");
  return state.products
    .filter((product) => categories.includes(product.category) && !selectedIds.has(product.id))
    .map((product) => {
      const sameBrand = mainBrand && getCoordinateBrand(product).toLocaleLowerCase("ja-JP") === mainBrand;
      const hasDetails = Boolean(product.details?.color || product.details?.material);
      const hasImage = Boolean(product.image);
      const mainColor = String(main.details?.color || "").trim();
      const candidateText = `${product.name || ""} ${product.details?.color || ""} ${product.hook || ""}`;
      const colorMatch = mainColor && candidateText.includes(mainColor);
      return { product, score: (sameBrand ? 8 : 0) + (hasDetails ? 3 : 0) + (hasImage ? 2 : 0) + (colorMatch ? 2 : 0) };
    })
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, "ja"))[0]?.product || null;
}

async function generateCoordinate() {
  let photoWarning = "";
  if (!getSelectedCoordinatePhoto()) photoWarning = "本人写真が未選択です。ホーム画面で今回使う写真を選んでください";
  try {
    await ensureSelectedCoordinatePhotoUrl();
  } catch (error) {
    photoWarning = "本人写真を一時的に読めないため、写真欄は仮表示で作成しました";
  }
  let coordinate = getSelectedCoordinate();
  if (!coordinate.products.length) return showToast("コーデに使う商品を選んでください");
  if (isHanakoTeacherPattern(coordinate.imagePattern)) {
    applySelectedHanakoTeacher();
    coordinate = getSelectedCoordinate();
    coordinate.hanakoComment = chooseHanakoTeacherComment(coordinate, true);
  }
  refreshCoordinateHandwrittenPoints(coordinate);
  const analysis = buildCoordinateAnalysis(coordinate);
  const text = buildCoordinateText(coordinate);
  coordinateOutput.value = text;
  setCoordinatePrompts(coordinate);
  document.querySelector("#coordStatus").textContent = photoWarning
    ? "作成済み：本人写真を再確認"
    : analysis.roomReady ? "投稿条件を確認済み" : "要確認：商品を追加";
  await drawCoordinateBoard(coordinate, text);
  if (getSelectedCoordinatePhoto() && !coordinateBoardHasPerson) {
    document.querySelector("#coordStatus").textContent = "要確認：本人写真を選び直してください";
    return showToast("本人写真を画像ボードへ入れられませんでした。ホームで写真を選び直してください");
  }
  showToast(photoWarning || (analysis.roomReady ? "コーデ・画像ボード・2つのプロンプトを作りました" : "コーデと2つのプロンプトを作りました。ROOM投稿には商品を2点以上選んでください"));
}

function setCoordinatePrompts(coordinate) {
  if (coordGeminiPrompt) coordGeminiPrompt.value = adaptPromptToSelectedAi(buildOutfitImagePrompt(coordinate));
  if (coordGeminiCaptionPrompt) coordGeminiCaptionPrompt.value = adaptPromptToSelectedAi(buildCoordinateCaptionPrompt(coordinate));
}

async function copyCoordinateImagePrompt() {
  try {
    await ensureSelectedCoordinatePhotoUrl();
    const coordinate = getSelectedCoordinate();
    setCoordinatePrompts(coordinate);
    await copyText(coordGeminiPrompt.value);
    showToast("最新の写真URL入りプロンプトをコピーしました");
  } catch (error) {
    showToast(error.message || "プロンプトをコピーできませんでした");
  }
}

function buildCoordinateText(coordinate) {
  const analysis = buildCoordinateAnalysis(coordinate);
  const categories = coordinate.products.map((product) => product.category).join("・");
  const supportingRoles = analysis.itemRoles.slice(1);
  const itemLines = (supportingRoles.length ? supportingRoles : analysis.itemRoles)
    .map((item) => `・${item.emoji} ${item.name}｜${trimText(item.role, 38)}`)
    .join("\n");
  return `※アフィリエイトを含みます\n\nおはファッション🌸\n${analysis.headline}\n\n「${coordinate.concern}」に寄り添うコーデです。\n${analysis.solution}\n\n🎀 主役｜${analysis.mainName}\n${analysis.mainReason}\n\n🪄 似合わせ設計\n・形｜${analysis.silhouette}\n・色｜${analysis.colorPlan}\n・季節｜${analysis.seasonPlan}\n\n👗 合わせた理由\n${itemLines}\n\n🔎 買う前チェック\n${analysis.checks.map((item) => `・${item}`).join("\n")}\n${analysis.missingNote ? `\n💡 ${analysis.missingNote}\n` : ""}${analysis.totalLabel ? `\n予算メモ｜${analysis.totalLabel}\n` : ""}\n${coordinate.occasion}の日に、頑張りすぎず「ちゃんと可愛い」を作りたい方へ🩷\n保存して手持ち服と比べてみてください。\n\n#楽天ROOM #大人ガーリー #甘めきれいめ #${categories.replaceAll("・", " #")}`;
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

function buildCoordinateAnalysis(coordinate) {
  const main = coordinate.mainProduct || coordinate.products[0];
  const categories = new Set(coordinate.products.map((product) => product.category));
  const bottom = coordinate.products.find((product) => ["スカート", "パンツ"].includes(product.category));
  const colors = [...new Set(coordinate.products.map((product) => product.details?.color).filter(Boolean))];
  const concernSolutions = {
    "朝、服が決まらない": "主役を先に決め、色を3色以内にまとめる",
    "甘すぎ・子どもっぽく見せたくない": "甘い要素を主役ひとつに絞り、直線的な小物で締める",
    "全身のバランスを整えたい": "上下のボリュームに差をつけ、重心を散らさない",
    "いつも同じ組み合わせになる": "いつもの服に質感か小物で一か所だけ変化を足す",
    "気温差に対応したい": "脱ぎ着できる一枚と、温度調整しやすい素材を重ねる",
    "写真で可愛く見せたい": "顔まわりに明るさを置き、全身に縦の流れを作る",
  };
  const priorityPlans = {
    "着回しやすさ": "主役以外をベーシックにして、別の予定にもつなげる",
    "高見え": "色数を抑え、素材感と小物の形をそろえる",
    "スタイルバランス": "上半身と下半身のボリュームを片方だけに寄せる",
    "動きやすさ": "歩く・座る・荷物を持つ動作を邪魔しない組み合わせにする",
    "写真映え": "顔まわりと主役に明暗差をつけ、輪郭を背景へ埋もれさせない",
  };
  const colorPlans = {
    "商品から自動で整える": colors.length ? `${colors.slice(0, 2).join("＋")}を軸に、全体を3色以内へ` : "主役の色＋白系＋締め色の3色以内",
    "淡色ワントーン": "白・アイボリー・淡色を重ね、素材差でぼんやり見えを防ぐ",
    "白ベースで明るく": "白を広く使い、主役の色を一か所に集める",
    "黒・濃色で引き締め": "バッグか足元へ濃色を置き、甘さを大人っぽく締める",
    "差し色をひとつ": "ベースを2色に抑え、小物ひとつだけを差し色にする",
  };
  const seasonPlans = {
    "今の季節": `${currentSeason()}の気温に合わせ、羽織りと足元で調整`,
    春: "朝夕の気温差に備え、軽い羽織りを足せる余白を残す",
    夏: "透け・汗・日差しを確認し、涼しく見える明るい面積を作る",
    秋: "軽い重ね着と深みのある小物で、季節感をひとつ足す",
    冬: "防寒を保ちながら、上半身へ厚みを集めすぎない",
  };
  const silhouette = main?.category === "ワンピース"
    ? "ワンピースの縦ラインを主役に、小物を小さくまとめる"
    : bottom?.category === "スカート"
      ? "トップスをコンパクトに見せ、スカートの揺れを主役にする"
      : bottom?.category === "パンツ"
        ? "上半身の甘さをパンツの直線で整える"
        : "主役のボリュームと反対側をすっきりまとめる";
  const itemEmoji = { ワンピース: "👗", トップス: "👚", アウター: "🧥", スカート: "🎀", パンツ: "👖", バッグ: "👜", シューズ: "👠", アクセサリー: "✨" };
  const itemRoles = coordinate.products.map((product, index) => ({
    name: product.name,
    emoji: itemEmoji[product.category] || "♡",
    role: index === 0
      ? `主役として${product.hook || createCoordinateHook(product)}`
      : `${createCoordinateHook(product)}。主役の甘さと色を邪魔せず整える役`,
  }));
  const checks = [
    main?.category === "ワンピース" ? "着丈と靴を履いた時の裾位置" : "トップスをイン・アウトした時の重心",
    coordinate.priority === "動きやすさ" ? "歩く・座る・腕を上げる動作のしやすさ" : "素材の厚み、透け感、裏地の有無",
    "商品画像とレビューで実際の色味・サイズ感を確認",
    "ROOMへ投稿する時は、実際の写真に写っている商品だけを登録",
  ];
  const missing = [];
  if (!categories.has("バッグ")) missing.push("小さめバッグ");
  if (!categories.has("シューズ")) missing.push("主役と明るさをそろえた靴");
  if (!categories.has("アクセサリー")) missing.push("華奢なアクセサリー");
  const total = coordinate.products.reduce((sum, product) => sum + (productPriceNumber(product.price) || 0), 0);
  const apparelCategories = new Set(["ワンピース", "トップス", "ニット", "カーディガン", "アウター", "スカート", "パンツ", "デニム", "セットアップ", "オールインワン", "スーツ・フォーマル", "ブライダル", "ルームウェア", "水着・水際", "浴衣", "マタニティ", "スポーツウェア", "レインウェア"]);
  const roomReady = coordinate.products.length >= 2 && coordinate.products.some((product) => apparelCategories.has(product.category));
  return {
    headline: `${coordinate.style}｜${coordinate.occasion}の解決コーデ`,
    mainName: main?.name || "主役アイテム",
    mainReason: main?.hook || createCoordinateHook(main || {}),
    solution: `${concernSolutions[coordinate.concern] || concernSolutions["朝、服が決まらない"]}。${priorityPlans[coordinate.priority] || priorityPlans["着回しやすさ"]}`,
    silhouette,
    colorPlan: colorPlans[coordinate.colorMood] || colorPlans["商品から自動で整える"],
    seasonPlan: seasonPlans[coordinate.season] || seasonPlans["今の季節"],
    itemRoles,
    checks,
    missingNote: missing.length ? `${missing.slice(0, 2).join("、")}を加えると完成度が上がります。` : "",
    totalLabel: total ? `選択商品の合計 約${total.toLocaleString("ja-JP")}円` : "",
    roomReady,
  };
}

function buildCoordinateFashionScore(coordinate) {
  const products = coordinate.products || [];
  const categories = new Set(products.map((product) => product.category));
  const colors = products.map((product) => product.details?.color).filter(Boolean);
  const uniqueColors = new Set(colors);
  const hasMainWear = products.some((product) => ["ワンピース", "トップス", "アウター", "スカート", "パンツ"].includes(product.category));
  const hasBottom = products.some((product) => ["ワンピース", "スカート", "パンツ"].includes(product.category));
  const hasBag = categories.has("バッグ");
  const hasShoes = categories.has("シューズ");
  const hasAccessory = categories.has("アクセサリー");
  const categoryBalance = Math.min(86, 34 + Math.min(products.length, 5) * 8 + (hasMainWear ? 9 : 0) + (hasBottom ? 7 : 0) + (hasBag ? 5 : 0) + (hasShoes ? 5 : 0));
  const colorHarmony = Math.max(52, Math.min(88, 82 - Math.max(0, uniqueColors.size - 3) * 8 + (coordinate.colorMood === "商品から自動で整える" ? 0 : 3)));
  const sceneFit = Math.min(87, 56 + (coordinate.occasion ? 8 : 0) + (coordinate.priority ? 6 : 0) + (coordinate.season ? 4 : 0) + (coordinate.location ? 3 : 0));
  const solutionPower = Math.min(86, 54 + (coordinate.concern ? 9 : 0) + (coordinate.priority ? 7 : 0) + (products.some((product) => product.hook) ? 3 : 0));
  const trendMood = Math.min(86, 52 + (/(ガーリー|きれいめ|高見え|甘め|淡色|韓国|フェミニン|上品)/.test(`${coordinate.style} ${products.map((product) => product.name).join(" ")}`) ? 11 : 5) + (hasAccessory ? 3 : 0) + (hasBag ? 3 : 0));
  const metrics = [
    { label: "まとまり", value: Math.round(categoryBalance) },
    { label: "配色", value: Math.round(colorHarmony) },
    { label: "着回し", value: Math.round(sceneFit) },
    { label: "悩み解決", value: Math.round(solutionPower) },
    { label: "抜け感", value: Math.round(trendMood) },
  ];
  const power = Math.max(42, Math.min(89, Math.round(metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length) - 6));
  const rank = power >= 88 ? "S" : power >= 82 ? "A" : power >= 74 ? "B" : power >= 66 ? "C" : power >= 58 ? "D" : "E";
  const rankLabels = {
    S: "神コーデ級",
    A: "かなり優秀",
    B: "好印象",
    C: "あと一工夫",
    D: "見直し推奨",
    E: "組み直し",
  };
  return {
    rank,
    rankLabel: rankLabels[rank],
    power,
    metrics,
    summary: `${rank}ランク / ${power}pt / ${rankLabels[rank]}`,
  };
}

async function drawCoordinateBoard(coordinate, text) {
  const targetCanvas = coordBoard;
  if (!targetCanvas) return;
  const renderId = ++coordinateBoardRenderId;
  const canvas = document.createElement("canvas");
  canvas.width = targetCanvas.width;
  canvas.height = targetCanvas.height;
  const analysis = buildCoordinateAnalysis(coordinate);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff8f9";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f8dce4";
  ctx.fillRect(0, 0, canvas.width, 250);
  ctx.fillStyle = "#2f292c";
  ctx.font = "700 56px Yu Gothic UI, Meiryo, sans-serif";
  wrapCanvasText(ctx, analysis.headline, 70, 95, 660, 64, 2);
  ctx.font = "28px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillStyle = "#795c50";
  ctx.fillText(`${coordinate.priority} / ${coordinate.colorMood}`, 72, 206);

  const selectedPhoto = getSelectedCoordinatePhoto();
  let selectedPhotoSource = "";
  if (selectedPhoto) {
    try {
      await ensureSelectedCoordinatePhotoUrl();
      selectedPhotoSource = coordinatePhotoPreviewCache.get(selectedPhoto.id)
        || await loadCoordinatePhotoPreview(selectedPhoto)
        || selectedPhoto.signedUrl
        || "";
    } catch {
      selectedPhotoSource = coordinatePhotoPreviewCache.get(selectedPhoto.id) || selectedPhoto.signedUrl || "";
    }
  }
  const personImage = selectedPhotoSource ? await loadImage(selectedPhotoSource).catch(() => null) : null;
  coordinateBoardHasPerson = Boolean(personImage);
  if (personImage) {
    drawCoverImage(ctx, personImage, 760, 54, 230, 230, 18);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillRect(778, 234, 194, 34);
    ctx.fillStyle = "#8f3e5d";
    ctx.font = "700 18px Yu Gothic UI, Meiryo, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("選んだ本人写真", 875, 258);
    ctx.textAlign = "left";
  } else {
    drawPlaceholder(ctx, "PHOTO", 760, 54, 230, 230);
  }

  const teacherPattern = isHanakoTeacherPattern(coordinate.imagePattern);
  const products = coordinate.products.slice(0, 6);
  const compactProductLayout = teacherPattern && products.length > 4;
  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 70 + col * 485;
    const y = compactProductLayout ? 300 + row * 195 : 330 + row * 285;
    await drawProductCard(ctx, product, x, y, compactProductLayout);
    if (teacherPattern) drawTeacherHandwrittenPoint(ctx, product, index, x, y, coordinate, compactProductLayout);
  }

  if (teacherPattern) {
    try {
      await drawHanakoTeacherPanel(ctx, coordinate, analysis);
    } catch {
      drawHanakoTeacherFallbackPanel(ctx, coordinate);
    }
  } else {
    ctx.fillStyle = "#2f292c";
    ctx.font = "700 30px Yu Gothic UI, Meiryo, sans-serif";
    ctx.fillText("WHY IT WORKS", 72, 1220);
    ctx.font = "24px Yu Gothic UI, Meiryo, sans-serif";
    ctx.fillStyle = "#6c555e";
    wrapCanvasText(ctx, `${analysis.solution} 色は${analysis.colorPlan}`, 72, 1260, 930, 34, 2);
  }
  drawFashionScorePanel(ctx, buildCoordinateFashionScore(coordinate), 720, 1110, 290, 236);
  if (renderId !== coordinateBoardRenderId) return;
  const targetContext = targetCanvas.getContext("2d");
  targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  targetContext.drawImage(canvas, 0, 0);
  coordinateBoardDataUrl = canvas.toDataURL("image/png");
}

async function drawHanakoTeacherPanel(ctx, coordinate, analysis) {
  const guide = coordinate.hanakoTeacher || currentHanakoTeacher;
  const comment = coordinate.hanakoComment || chooseHanakoTeacherComment(coordinate);
  const previewAvatar = document.querySelector("#hanakoTeacherAvatar");
  let avatar = previewAvatar?.complete && previewAvatar.naturalWidth > 0 ? previewAvatar : null;
  if (!avatar) avatar = await loadImage(guide.avatar).catch(() => null);
  if (!avatar) avatar = await loadImage("icons/hanako-avatar.jpg").catch(() => null);
  const avatarX = 70;
  const avatarY = 1110;
  const avatarSize = 210;
  const bubbleX = 70;
  const bubbleY = 910;
  const bubbleWidth = 940;
  const bubbleHeight = 164;

  ctx.save();
  ctx.fillStyle = "#fff";
  roundRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, 24);
  ctx.fill();
  ctx.strokeStyle = "#e4b9c8";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bubbleX + 76, bubbleY + bubbleHeight);
  ctx.lineTo(bubbleX + 105, bubbleY + bubbleHeight + 28);
  ctx.lineTo(bubbleX + 134, bubbleY + bubbleHeight);
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.strokeStyle = "#e4b9c8";
  ctx.stroke();

  ctx.fillStyle = "#a43d64";
  ctx.font = "800 23px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText("ハナコ先生の今日のひとこと", bubbleX + 22, bubbleY + 34);
  ctx.fillStyle = "#4d3d43";
  ctx.font = "800 25px Yu Gothic UI, Meiryo, sans-serif";
  wrapCanvasText(ctx, `「${comment}」`, bubbleX + 22, bubbleY + 76, bubbleWidth - 44, 32, 3);

  ctx.fillStyle = "#f4cad7";
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2);
  ctx.fill();
  if (avatar) drawCoverImage(ctx, avatar, avatarX, avatarY, avatarSize, avatarSize, avatarSize / 2);
  else drawPlaceholder(ctx, "ハナコ", avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();
}

function drawHanakoTeacherFallbackPanel(ctx, coordinate) {
  const comment = coordinate.hanakoComment || chooseHanakoTeacherComment(coordinate);
  const bubbleX = 70;
  const bubbleY = 910;
  const bubbleWidth = 940;
  const bubbleHeight = 164;
  ctx.save();
  ctx.fillStyle = "#fff";
  roundRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, 24);
  ctx.fill();
  ctx.strokeStyle = "#e4b9c8";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bubbleX + 76, bubbleY + bubbleHeight);
  ctx.lineTo(bubbleX + 105, bubbleY + bubbleHeight + 28);
  ctx.lineTo(bubbleX + 134, bubbleY + bubbleHeight);
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#a43d64";
  ctx.font = "800 23px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText("ハナコ先生の今日のひとこと", bubbleX + 22, bubbleY + 34);
  ctx.fillStyle = "#4d3d43";
  ctx.font = "800 25px Yu Gothic UI, Meiryo, sans-serif";
  wrapCanvasText(ctx, `「${comment}」`, bubbleX + 22, bubbleY + 76, bubbleWidth - 44, 32, 3);
  ctx.fillStyle = "#f4cad7";
  ctx.beginPath();
  ctx.arc(175, 1215, 111, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#a43d64";
  ctx.font = "700 28px Yu Gothic UI, Meiryo, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ハナコ先生", 175, 1225);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawFashionScorePanel(ctx, fashionScore, x, y, width, height) {
  if (!fashionScore) return;
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  roundRect(ctx, x, y, width, height, 20);
  ctx.fill();
  ctx.strokeStyle = "rgba(196, 77, 118, 0.34)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#8f3e5d";
  ctx.font = "800 17px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText("FASHION SCORE", x + 16, y + 28);
  ctx.font = "700 14px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillStyle = "#7c6870";
  ctx.fillText("おしゃれ自己判定", x + 16, y + 48);

  const badgeX = x + 16;
  const badgeY = y + 64;
  const badgeSize = 72;
  const gradient = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeSize, badgeY + badgeSize);
  gradient.addColorStop(0, "#f8c6d7");
  gradient.addColorStop(1, "#c65a82");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "900 38px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText(fashionScore.rank, badgeX + badgeSize / 2, badgeY + 48);
  ctx.font = "700 13px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText("RANK", badgeX + badgeSize / 2, badgeY + 66);
  ctx.textAlign = "left";

  ctx.fillStyle = "#3d3036";
  ctx.font = "900 26px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText(`${fashionScore.power}pt`, x + 102, y + 88);
  ctx.fillStyle = "#a43d64";
  ctx.font = "700 16px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText("ファッションパワー", x + 102, y + 112);
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x + 102, y + 124, 120, 28, 14);
  ctx.fill();
  ctx.fillStyle = "#a43d64";
  ctx.font = "800 16px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText(fashionScore.rankLabel, x + 116, y + 144);

  drawFashionRadarChart(ctx, fashionScore.metrics, x + 142, y + 168, 44);
  ctx.restore();
}

function drawFashionRadarChart(ctx, metrics, centerX, centerY, radius) {
  const count = metrics.length;
  const angleOffset = -Math.PI / 2;
  ctx.save();
  for (let ring = 1; ring <= 3; ring += 1) {
    ctx.beginPath();
    const ringRadius = radius * (ring / 3);
    for (let index = 0; index < count; index += 1) {
      const angle = angleOffset + (Math.PI * 2 * index) / count;
      const px = centerX + Math.cos(angle) * ringRadius;
      const py = centerY + Math.sin(angle) * ringRadius;
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = ring === 3 ? "#e4b9c8" : "#f2d7e0";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.beginPath();
  for (let index = 0; index < count; index += 1) {
    const angle = angleOffset + (Math.PI * 2 * index) / count;
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
  }
  ctx.strokeStyle = "#efd2dc";
  ctx.stroke();

  ctx.beginPath();
  metrics.forEach((metric, index) => {
    const angle = angleOffset + (Math.PI * 2 * index) / count;
    const metricRadius = radius * Math.max(0.18, Math.min(1, metric.value / 100));
    const px = centerX + Math.cos(angle) * metricRadius;
    const py = centerY + Math.sin(angle) * metricRadius;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(196, 77, 118, 0.28)";
  ctx.fill();
  ctx.strokeStyle = "#c44d76";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#6c555e";
  ctx.font = "700 12px Yu Gothic UI, Meiryo, sans-serif";
  metrics.forEach((metric, index) => {
    const angle = angleOffset + (Math.PI * 2 * index) / count;
    const labelX = centerX + Math.cos(angle) * (radius + 30);
    const labelY = centerY + Math.sin(angle) * (radius + 22);
    ctx.textAlign = labelX < centerX - 4 ? "right" : labelX > centerX + 4 ? "left" : "center";
    ctx.fillText(metric.label, labelX, labelY + 4);
  });
  ctx.textAlign = "left";
  ctx.restore();
}

function chooseHanakoTeacherComment(coordinate, force = false) {
  const variations = {
    "朝、服が決まらない": [
      "迷う日は主役を一つ。全部かわいくしようとすると、全部ぼやけるわ。",
      "鏡の前で悩みすぎ。最初に手が伸びた一着を、堂々と主役にしなさい。",
      "決まらない原因は服じゃなく欲張り。色を三つまでに絞って。",
      "朝の正解探しはおしまい。主役、引き立て役、締め色で十分よ。",
      "時間がない日は冒険しない。得意な形に、旬の小物を一つで勝てるわ。",
      "一着目で七割決めなさい。残り三割で迷うのが、おしゃれの余裕よ。",
      "トップスから迷うなら、先に靴を決めて。行き先が見えれば服も決まるわ。",
      "鏡の前で会議しすぎよ。今日いちばん着たい色を、議長にしなさい。",
      "朝の迷子は色数で救えるわ。ベース二色に、差し色は一つだけ。",
      "全部候補では何も決まらないの。まず一着、ハンガーへ戻して。",
      "予定に似合う服を選んで。気分だけで決めると、玄関でまた迷うわ。",
      "コーデは多数決じゃないの。主役が決まれば、脇役は静かについてくるわ。",
      "迷った朝ほどシルエット優先。色はあとから整えれば間に合うわ。",
      "昨日と違う必要はないの。昨日より一つ丁寧なら、それで十分よ。",
      "その三択、似た服ばかりよ。いちばん顔色がよく見える一着に決めなさい。",
      "朝から百点を狙わないで。清潔感、サイズ感、好きの三つで合格よ。",
      "着替え直すたび自信まで脱がないで。二回目で決定、それが今日のルールよ。",
    ],
    "甘すぎて幼く見えそう": [
      "甘さは一か所で十分。リボンもフリルも全部盛りでは、服に着られるわよ。",
      "かわいいを重ねすぎないで。黒か直線を一つ入れれば、大人に戻れるわ。",
      "ピンクが悪いんじゃないの。形まで甘くするから、幼く見えるのよ。",
      "フリルを選んだなら小物は静かに。全員センターではまとまらないわ。",
      "甘め服ほど姿勢と靴が大事。足もとを締めれば、ちゃんと大人よ。",
      "レースを着るなら色は落ち着かせて。甘さにも引き算は必要よ。",
      "丸い形ばかり集めないで。バッグか靴に角を一つ作りなさい。",
      "大人の甘さは面積で決まるの。かわいい柄は、小さく効かせて。",
      "パステル同士で眠らせないで。濃い色を一点、目覚ましにしなさい。",
      "リボンが主役なら髪はすっきり。かわいい同士にも席順があるわ。",
      "甘めトップスに甘めボトム、そこへ甘い靴？ デザートは一皿で十分よ。",
      "肌見せより抜け感よ。首、手首、足首のどこか一つを軽くして。",
      "かわいい服ほど素材を見て。つやを抑えると、ぐっと上品になるわ。",
      "白を足せば清楚、黒を足せば大人。迷ったら小物で温度を変えなさい。",
      "幼く見えるのは丈よりバランス。ウエスト位置を曖昧にしないで。",
      "甘さは隠さなくていいの。直線を一本添えて、堂々と着なさい。",
      "そのフリル、十分かわいいわ。アクセまで競わせる必要はないの。",
    ],
    "頑張りすぎて見えたくない": [
      "盛る場所は一つで十分。主役が二人いたら、コーデは迷子よ。",
      "気合いは見せるものじゃないの。色数を減らして、余裕を着なさい。",
      "全部新品みたいな顔をさせないで。抜け感は、いつもの一着で作るの。",
      "アクセも柄も主張中。ひとつ黙らせたら、急におしゃれになるわ。",
      "完璧より自然体。鏡を見て最初に気になる一つを、潔く外して。",
      "おしゃれです、と全身で叫ばないで。ひとつ黙ると余裕が生まれるわ。",
      "新品を並べるより、いつものデニムを一つ。抜け感は生活感から生まれるの。",
      "髪も服も小物も完璧？ なら口紅は軽く。全部満点は少し息苦しいわ。",
      "気合いは裏地に隠しなさい。表から見えるのは、さらっとした自信だけ。",
      "柄を着た日はアクセを休ませて。視線にも休憩場所が必要よ。",
      "そのコーデ、説明が多すぎるわ。テーマを一文で言えないなら一つ外して。",
      "盛ったあとに引くまでがコーデよ。最後の一手は、足し算じゃないの。",
      "きれいめに寄せすぎたら、バッグだけ日常へ戻して。急にこなれるわ。",
      "抜け感はだらしなさじゃないの。袖か襟元を少し軽くするだけでいいわ。",
      "主役服には普通の靴を。頑張りを隠せる人が、いちばん上手なの。",
      "全身に見せ場を作らないで。写真で最初に見せたい場所は一つよ。",
      "おしゃれの余裕は余白から。アクセを一個置いて出かけなさい。",
    ],
    "体型やバランスが気になる": [
      "隠すだけでは重くなるわ。縦ラインを作って、堂々とすっきり見せて。",
      "体型より重心を見て。腰の位置を少し上げれば、印象は変わるわ。",
      "ゆるい服を重ねるほど細くは見えないの。どこか一か所、形を出して。",
      "気になる場所を見張りすぎ。顔まわりを明るくして、視線を上へ。",
      "サイズを隠すより比率を整えて。上短め、下すっきりが近道よ。",
      "細く見せるより、重心を上げて。目線が変われば全身が変わるわ。",
      "長い服には小さなバッグ。面積の大きさは、小物で締めなさい。",
      "上下ゆったりは休みの日だけ。今日はどちらか一方にメリハリを。",
      "腰位置が消えると全身まで迷うわ。前だけ少し入れて、道を作って。",
      "気になる部分へ暗色を置きすぎないで。全身が重くなったら逆効果よ。",
      "首元を詰めた日は手首を見せて。抜け道が一つあれば軽くなるわ。",
      "丈が中途半端なら靴でつなげて。脚の線を途中で切らないこと。",
      "隠したい場所より、見せたい場所を決めて。視線はちゃんと誘導できるわ。",
      "ボリューム服には小さな顔まわり。髪をまとめるだけでも違うの。",
      "体型は欠点じゃないわ。服との比率が合っていないだけ、直せばいいの。",
      "ぴったりか、ゆったりか。曖昧なサイズ感がいちばん惜しいわ。",
      "縦長を作りたいなら色を分断しないで。靴まで流れをつなぎなさい。",
    ],
    "可愛いけれど予算も大事": [
      "安いから買うは卒業。三回着たいか、それだけで選びなさい。",
      "値札より出番を見て。一回しか着ない服が、いちばん高いのよ。",
      "似た服があるなら今日は見送り。かわいいと必要は、別のお話よ。",
      "予算がある日は主役へ集中。小物まで全部買う必要はないわ。",
      "セールの魔法に負けないで。定価でも欲しいか、そこで答えが出るわ。",
      "安さにときめいたのか、服にときめいたのか。そこは正直になりなさい。",
      "一着買うなら三コーデ考えて。浮かばない服は、クローゼットでも浮くわ。",
      "高見えは値段じゃなく手入れよ。毛玉のある服では、どんな新作も負けるわ。",
      "予算内でも妥協はしない。サイズが惜しい服は、結局着なくなるの。",
      "主役へお金、流行は小物。全部に頑張らなくてもおしゃれは作れるわ。",
      "送料無料に釣られて不要品を足さないで。送料より無駄遣いが高いわ。",
      "色違いは便利じゃないの。同じ役の服を増やしているだけかもしれないわ。",
      "買う理由がセールだけなら戻して。着る理由が三つあれば合格よ。",
      "手持ちの靴と合わない服は追加料金つき。そこまで計算して選びなさい。",
      "レビューの星より、自分の生活を見て。着る場面がなければ出番もないわ。",
      "かわいい予算は有限よ。似ている一着より、足りない一着へ使いなさい。",
      "プチプラほど縫い目と透け感を確認。値段ではなく、仕上がりを買うの。",
    ],
    "気温・雨・汗にも対応したい": [
      "我慢はおしゃれじゃないの。脱ぎ着できない服は、今日はお留守番よ。",
      "天気を無視した服は美しくないわ。羽織り一枚までがコーデよ。",
      "汗じみを心配して笑えないなら、その色は今日は選ばないで。",
      "雨の日に繊細すぎる靴はお休み。足もとが決まれば気分も崩れないわ。",
      "気温差には薄手を重ねて。根性で着る服なんて、おしゃれじゃないの。",
      "予報を見ずに服を決めるのは、地図なしで出かけるのと同じよ。",
      "雨の日の白い裾は勇気じゃないわ。汚れを気にしない丈を選んで。",
      "冷房までが夏コーデよ。薄い羽織りをバッグへ入れて完成。",
      "汗ばむ日は肌離れする素材へ。見た目より、機嫌よく過ごせる服を。",
      "風の強い日に揺れる裾ばかり選ばないで。かわいさにも安全確認が必要よ。",
      "気温差が大きい日は首元で調整。脱げない厚着は後悔するわ。",
      "雨の日は素材が主役。ぬれて困る服を選んだ時点で負けなの。",
      "暑い日に裏地まで重ねないで。透け対策と通気性、両方見なさい。",
      "天気に勝とうとしないの。味方につけたコーデが、最後まできれいよ。",
      "歩く日は靴から決めて。痛い足では、どんな服も素敵に見えないわ。",
      "梅雨の広がる髪まで考えて。襟元をすっきりさせれば慌てないわ。",
      "寒暖差の日は色より層。薄く重ねて、一枚ずつ調整しなさい。",
    ],
    "いつも同じコーデになる": [
      "全部変えなくていいの。小物を一つ替えるだけで、昨日とは別人よ。",
      "同じ服でも配色は変えられるわ。いつもの黒を、今日は淡色にして。",
      "マンネリの犯人は服じゃなく組み合わせ。上下を一度、別居させなさい。",
      "新しい服を買う前に靴を替えて。印象の半分は足もとが決めるわ。",
      "定番は悪くないの。襟元、袖、バッグのどれか一つだけ遊んで。",
      "同じ服でも前だけイン、袖をまくる。それだけで別の顔になるわ。",
      "マンネリなら反対色を足して。新しい服より、新しい配色よ。",
      "いつものトップスをスカートへ。相手を替えれば、服はまた働くわ。",
      "黒バッグ一択を休んで。小物の色を替えるだけで季節が動くわ。",
      "定番コーデに柄を一滴。全身変えるから失敗するのよ。",
      "毎回同じは似合っている証拠。でも丈感まで同じでは、少し退屈ね。",
      "服を買う前に着方を変えて。ボタン、袖、裾にはまだ伸びしろがあるわ。",
      "鏡だけでなく写真で見て。同じに見える原因が、案外すぐ分かるわ。",
      "アクセを替えずにマンネリと言わないで。小さな変化を侮らないこと。",
      "いつもの二色へ白を少し。抜けができれば、見慣れた服も新鮮よ。",
      "上下を固定ペアにしないで。クローゼット内の交友関係を広げなさい。",
      "同じ服こそ髪型を替えて。顔まわりが変わると印象は大きく動くわ。",
    ],
    "自信を持って出かけたい": [
      "似合うかより姿勢よ。色を三つに絞ったら、胸を張って出かけなさい。",
      "自信は服から借りていいの。いちばん好きな一着を主役にして。",
      "周りの正解より、自分が鏡で笑えるか。それが今日の合格よ。",
      "不安な日は冒険より得意を選んで。似合う形は、ちゃんと味方になるわ。",
      "服は決まってる。あとは下を向かないこと、それだけよ。",
      "似合う一着はもう選べてる。鏡へ減点を探しに戻らなくていいわ。",
      "人の視線より、自分の機嫌よ。背筋を伸ばせば今日の服は完成。",
      "不安なら好きな色を顔の近くへ。表情までちゃんと明るくなるわ。",
      "自信のない日は着慣れた形へ。新しさより安心感が味方になるの。",
      "隠れる服より、きれいに立てる服を。姿勢まで含めてコーデよ。",
      "誰かの似合うを借りなくていいの。あなたの好きが、今日の正解よ。",
      "最後に必要なのはアクセじゃないわ。鏡へ向かって一度笑いなさい。",
      "少し派手かも、くらいでちょうどいい。堂々と着れば似合って見えるわ。",
      "服に遠慮しないで。あなたが着るから、その一着が完成するの。",
      "欠点探しはここまで。今日いちばん素敵なところを一つ見つけて出発よ。",
      "安心できる靴を履きなさい。足取りが軽ければ、表情まで変わるわ。",
      "迷いは玄関へ置いていって。今日のあなたには、その服で十分よ。",
    ],
  };
  const options = variations[coordinate.concern] || [
    "かわいいは足し算じゃないの。主役を一つ決めて、あとは潔く引きなさい。",
    "おしゃれは全部を語らないの。見せ場を一つ決めて、余白を残して。",
    "迷ったら色を減らして。まとまりのない豪華さより、潔い普通が勝つわ。",
    "鏡で最初に目に入る場所が主役。ほかは競わせず、きれいに支えて。",
    "色、形、素材を全部盛らないで。見せ場は一つあるから効くのよ。",
    "かわいいだけで終わらせないで。今日の予定に似合ってこそ完成よ。",
    "小物は穴埋めではないの。コーデの最後に、意思を一つ足しなさい。",
    "違和感をアクセで隠さないで。まず丈と重心を整えるのが先よ。",
    "似合う服より、きれいに着られる服。姿勢まで味方になる一着を選んで。",
    "高見えの近道は色数とサイズ感。値段の話は、そのあとよ。",
    "写真で強い服と、毎日着たい服は別。今日は目的から選びなさい。",
    "主役を褒めたいなら、脇役は静かに。全員に台詞はいらないわ。",
    "迷ったときは足もとを見て。コーデの性格は、靴が決めているわ。",
    "その服の長所を一つ言える？ 言えたなら、そこを隠さず見せなさい。",
    "おしゃれは我慢大会じゃないの。笑顔で過ごせることまでが完成よ。",
  ];
  if (!force && currentHanakoComment && currentHanakoCommentConcern === coordinate.concern) return currentHanakoComment;
  const mainCategory = coordinate.mainProduct?.category || coordinate.products?.[0]?.category || "";
  const score = buildCoordinateFashionScore(coordinate);
  const categoryOptions = {
    トップス: [
      "顔まわりが主役の日は、下半身を静かに。目線が上がれば勝ちよ。",
      "トップスを褒められたいなら、ボトムは支え役。張り合わないで。",
      "袖と襟に見せ場があるなら、アクセは小さく。欲張ると印象が散るわ。",
    ],
    ワンピース: [
      "ワンピが主役の日は、小物で説明しすぎない。余裕まで着こなしよ。",
      "一枚で決まる服ほど、靴とバッグで品を決めなさい。",
      "ワンピは楽だけど油断は禁物。丈と足もとで大人度が決まるわ。",
    ],
    スカート: [
      "揺れるスカートには、上半身をすっきり。甘さに軸を作りなさい。",
      "スカートの可愛さを守るなら、靴で少しだけ現実に戻して。",
      "ふわっと見せたい日は、色を増やさない。軽さは整理から生まれるわ。",
    ],
    パンツ: [
      "パンツで締めた日は、顔まわりに可愛げを一滴。強すぎず整うわ。",
      "直線があると甘さは大人になるの。パンツを味方にしなさい。",
      "動きやすいだけで終わらせないで。小物でちゃんときれいめに戻すのよ。",
    ],
    バッグ: [
      "バッグは脇役じゃないわ。色をつなぐ司会者として働かせなさい。",
      "小さめバッグの日は、服の面積を整えて。全身が軽く見えるわ。",
      "バッグで締めるなら、ほかの小物は静かに。仕上げ役は一人で十分よ。",
    ],
    シューズ: [
      "足もとは最後じゃないの。靴が決まると、コーデの性格まで決まるわ。",
      "歩ける可愛さを選びなさい。痛い靴では表情まで曇るのよ。",
      "靴の色を拾えば全身がつながる。足もとだけ浮かせないで。",
    ],
    アクセサリー: [
      "光らせる場所は一つ。小さなきらめきほど、品よく効くわ。",
      "アクセは飾りじゃなく視線誘導。顔まわりへそっと仕事をさせて。",
      "主役服が強い日は、アクセは囁くくらいでちょうどいいわ。",
    ],
  };
  const rankOptions = {
    S: ["これは主役がはっきりしてる。あとは堂々と歩けば完成よ。", "盛っているのに散らかっていないわ。今日は写真を残しなさい。"],
    A: ["かなり整ってるわ。最後は靴かバッグの色を一つ拾えばもっと強い。", "ちゃんと可愛い。あと一つ引けば、大人の余裕まで出るわ。"],
    B: ["方向性はいいわ。主役をもう一段だけ目立たせると化けるわよ。", "まとまりは合格。次は素材感をそろえて高見えを狙いなさい。"],
    C: ["悪くないけど、見せ場が少し多いわ。一つだけ主役に戻して。", "惜しいわ。色か形、どちらか一つを減らすと急に整うの。"],
    D: ["今日は足し算しすぎ。まず色を減らして、コーデを落ち着かせなさい。", "全部を頑張らないで。主役以外を普通に戻す勇気よ。"],
    E: ["組み直しましょう。主役、支え役、締め色を一つずつ決めるの。", "可愛い素材はあるわ。並べ方を変えれば、ちゃんと光るのよ。"],
  };
  const dynamicOptions = [
    ...(categoryOptions[mainCategory] || []),
    ...(rankOptions[score.rank] || []),
    `${score.rank}ランクなら、見せ場は十分。あとは${score.metrics.sort((a, b) => a.value - b.value)[0]?.label || "バランス"}を少し整えて。`,
    `ファッションパワー${score.power}点。今日は主役を信じて、余計な説明を減らしなさい。`,
  ];
  options.push(...dynamicOptions);
  const candidates = options.filter((comment) => !recentHanakoComments.includes(comment));
  currentHanakoComment = candidates[Math.floor(Math.random() * candidates.length)] || options[0];
  recentHanakoComments = [currentHanakoComment, ...recentHanakoComments].slice(0, 12);
  currentHanakoCommentConcern = coordinate.concern;
  return currentHanakoComment;
}

function drawTeacherHandwrittenPoint(ctx, product, index, x, y, coordinate, compact = false) {
  const label = teacherPointLabel(product, coordinate);
  const textX = x + (compact ? 150 : 188);
  const textY = y + (compact ? 142 : 164);
  ctx.save();
  ctx.strokeStyle = index === 0 ? "#b83f6b" : "#d786a3";
  ctx.fillStyle = index === 0 ? "#a43d64" : "#b65d7d";
  ctx.lineWidth = 2.2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(textX, textY + 7);
  ctx.quadraticCurveTo(textX + 85, textY + 14, textX + 190, textY + 5);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(textX - 8, textY - 4);
  ctx.quadraticCurveTo(textX - 28, textY - 16, x + (compact ? 122 : 154), y + (compact ? 118 : 145));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + (compact ? 122 : 154), y + (compact ? 118 : 145));
  ctx.lineTo(x + (compact ? 131 : 163), y + (compact ? 114 : 141));
  ctx.lineTo(x + (compact ? 128 : 160), y + (compact ? 124 : 151));
  ctx.fill();
  ctx.font = "700 18px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText(`${index === 0 ? "主役♡" : "POINT"} ${label}`, textX, textY);
  ctx.restore();
}

function teacherPointLabel(product, coordinate) {
  return getCoordinateHandwrittenPoint(product, coordinate).copy;
}

async function drawProductCard(ctx, product, x, y, compact = false) {
  const cardHeight = compact ? 170 : 240;
  const imageSize = compact ? 120 : 150;
  const imageOffset = compact ? 14 : 18;
  const textX = x + (compact ? 150 : 188);
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x, y, 440, cardHeight, 18);
  ctx.fill();
  ctx.strokeStyle = "#eadde1";
  ctx.stroke();
  await hydrateCoordinateProductImage(product);
  if (product.image) {
    const image = await loadCoordinateProductImage(product.image);
    if (image) drawCoverImage(ctx, image, x + imageOffset, y + imageOffset, imageSize, imageSize, 12);
    else drawProductImagePlaceholder(ctx, product.category, x + imageOffset, y + imageOffset, imageSize, imageSize);
  } else {
    drawProductImagePlaceholder(ctx, product.category, x + imageOffset, y + imageOffset, imageSize, imageSize);
  }
  ctx.fillStyle = "#2f292c";
  ctx.font = `${compact ? "700 22px" : "700 25px"} Yu Gothic UI, Meiryo, sans-serif`;
  wrapCanvasText(ctx, product.name, textX, y + (compact ? 36 : 45), compact ? 260 : 220, compact ? 27 : 32, 2);
  ctx.fillStyle = "#a43d64";
  ctx.font = `${compact ? "700 18px" : "700 21px"} Yu Gothic UI, Meiryo, sans-serif`;
  ctx.fillText(product.price || product.category, textX, y + (compact ? 105 : 130));
  if (!compact) {
    ctx.fillStyle = "#796e73";
    ctx.font = "20px Yu Gothic UI, Meiryo, sans-serif";
    wrapCanvasText(ctx, product.hook || createCoordinateHook(product), x + 18, y + 196, 390, 28, 1);
  }
}

async function hydrateCoordinateProductImage(product) {
  if (product.image || !product.url || !cloudSync.configured || !cloudSync.signedIn) return;
  if (!coordinateProductHydration.has(product.id)) {
    coordinateProductHydration.set(product.id, fetchRakutenProduct(product.url)
      .then((result) => {
        if (!result.image) return;
        product.image = result.image;
        saveState();
        renderProducts();
      })
      .catch(() => null)
      .finally(() => coordinateProductHydration.delete(product.id)));
  }
  await coordinateProductHydration.get(product.id);
}

function drawProductImagePlaceholder(ctx, category, x, y, width, height) {
  ctx.save();
  ctx.fillStyle = "#fff0f4";
  roundRect(ctx, x, y, width, height, 12);
  ctx.fill();
  ctx.strokeStyle = "#d889a5";
  ctx.lineWidth = 4;
  if (category === "バッグ") {
    roundRect(ctx, x + 35, y + 58, 80, 58, 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 75, y + 60, 24, Math.PI, 0);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x + 46, y + 52);
    ctx.lineTo(x + 75, y + 34);
    ctx.lineTo(x + 104, y + 52);
    ctx.lineTo(x + 118, y + 105);
    ctx.lineTo(x + 32, y + 105);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.fillStyle = "#a43d64";
  ctx.font = "700 16px Yu Gothic UI, Meiryo, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("画像未登録", x + width / 2, y + height - 14);
  ctx.restore();
}

async function loadCoordinateProductImage(src) {
  if (!src) return null;
  if (coordinateImageCache.has(src)) return coordinateImageCache.get(src);
  let image = await loadImage(src).catch(() => null);
  if (!image && cloudSync.configured && cloudSync.signedIn && /^https?:\/\//i.test(src)) {
    try {
      const dataUrl = await fetchRakutenImageDataUrl(src);
      image = await loadImage(dataUrl);
    } catch {
      image = null;
    }
  }
  if (image) coordinateImageCache.set(src, image);
  return image;
}

async function fetchRakutenImageDataUrl(imageUrl) {
  const token = await cloudSync.getAccessToken();
  const response = await fetch(`${cloudSync.url}/functions/v1/rakuten-product-import`, {
    method: "POST",
    headers: {
      apikey: cloudSync.key,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "商品画像を読み込めませんでした");
  }
  return blobToDataUrl(await response.blob());
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(blob);
  });
}

async function generateGeminiPrompt() {
  try {
    await ensureSelectedCoordinatePhotoUrl();
  } catch (error) {
    return showToast(error.message || "自分の写真URLを準備できませんでした");
  }
  const coordinate = getSelectedCoordinate();
  const originalProductPhotoMode = coordinate.imagePattern === "オリジナル商品写真で投稿";
  if (!coordinate.personPhotoUrl && !originalProductPhotoMode) return showToast("先に保存した自分の全身写真を選んでください");
  if (!coordinate.products.length) return showToast("コーデに使う商品を選んでください");
  if (!document.querySelector("#coordMainProduct")?.value) return showToast("必ず画像に使う主役商品を選んでください");
  const coordinateText = coordinateOutput.value.trim() || buildCoordinateText(coordinate);
  coordinateOutput.value = coordinateText;
  ensureCoordinateHandwrittenPoints(coordinate);
  await drawCoordinateBoard(coordinate, coordinateText);
  setCoordinatePrompts(coordinate);
  document.querySelector("#coordStatus").textContent = "画像ボード・プロンプト準備済み";
  showToast("参照画像ボード1枚を使うプロンプトを作りました");
}

function buildOutfitImagePrompt(coordinate) {
  const mainProduct = coordinate.mainProduct || coordinate.products[0];
  const stylingPlan = buildCoordinateAnalysis(coordinate);
  const brand = getCoordinateBrand(mainProduct);
  const originalProductPhotoMode = coordinate.imagePattern === "オリジナル商品写真で投稿";
  const coordinateLocationInstruction = buildCoordinateLocationInstruction(coordinate, originalProductPhotoMode);
  const maskLockInstruction = originalProductPhotoMode
    ? ""
    : `【最優先・マスク固定モード】
・参照画像ボードのPERSON欄がマスク着用なら、完成画像でも同じマスクを必ず着けたままにしてください
・服、髪型、ポーズを編集する前に、マスクを本人の顔の一部として固定してください
・マスクの色、形、大きさ、柄、ひも、顔を覆う範囲を変えないでください
・マスクを外す、薄くする、透明にする、別のマスクへ替える、口や鼻を描き足すことは禁止です
・マスクが残っていない画像は条件違反です。出力せず、同じマスクを復元してから完成させてください`;
  const qualityLockInstruction = `【出力フォーマットと品質の固定条件】
・完成画像は必ず縦3:4の1枚。1536×2048px相当以上の高解像度で出力する
・低解像度、ぼやけ、強い圧縮、ざらつき、白飛び、過度な美肌加工を避ける
・人物、主役商品、先生アイコン、吹き出し、手書きポイントの輪郭を鮮明にする
・商品は色、形、丈、柄、素材感を参照画像へ忠実に合わせ、別商品へ変えない
・指、手足、顔、服の重なり、バッグの持ち手、靴の左右を自然にする
・外周に約6%の安全余白を取り、文字や顔、商品を端で切らない
・画像内の文字を薄くしない。見出し、本文、吹き出し、手書きポイントは濃く、十分なコントラストで読みやすくする
・「STYLE EDIT」という文字は、見出し、ラベル、装飾、透かしのどこにも入れない
・特に最下部の文字は画像下端から8%以上離し、最後の句読点と閉じかぎ括弧まで完全に見せる
・主役コーデ約70%、解説要素約20%、呼吸できる余白約10%の情報量を保つ
・かわいさ、読みやすさ、商品確認のしやすさを同時に満たす、商用ファッション誌レベルへ仕上げる
・条件を満たさない途中案や低品質案は出力せず、完成画像だけを返す`;
  const items = coordinate.products.map((product) => `・${product.category}: ${product.name}
  ブランド: ${getCoordinateBrand(product) || "商品ページで確認"}
  推しポイント: ${product.hook || createCoordinateHook(product)}
  価格メモ: ${product.price || "未設定"}
  商品画像URL: ${product.image || "なし"}
  商品ページURL: ${product.url || "なし"}`).join("\n");
  const selectedProductManifest = coordinate.products.map((product, index) => `${index + 1}. ${product.category}「${product.name}」`).join("\n");
  const imageCopy = buildCoordinateImageCopy(coordinate);
  const fixedImageHeadline = imageCopy[0];
  const productPointNotes = buildHandwrittenProductPoints(coordinate);
  const imagePatternInstruction = getCoordinateImagePatternInstruction(coordinate.imagePattern, coordinate);
  const hanakoTeacher = coordinate.hanakoTeacher || currentHanakoTeacher;
  const hanakoTeacherReference = resolvePublicTeacherReference(hanakoTeacher);
  const hanakoTeacherComment = coordinate.hanakoComment || chooseHanakoTeacherComment(coordinate);
  const fashionScore = buildCoordinateFashionScore(coordinate);
  const fashionScoreInstruction = buildCoordinateFashionScorePrompt(fashionScore);
  const attachmentInstruction = originalProductPhotoMode
    ? `【添付画像の役割・最優先】
・添付された参照画像ボードに写る商品だけを使う
・商品画像URLはアクセスしない。添付画像を基準に作る
・添付画像にない商品や人物を、似た画像や想像で補わない`
    : `【添付画像の役割・最優先】
・添付は「コーデ参照画像ボード」1枚だけ。PERSON欄は本人、PRODUCT欄は選択商品、TEACHER欄はハナコ先生の基準画像
・本人の顔、髪、体型、マスクはPERSON欄を最優先する
・服と小物は各PRODUCT欄、先生アイコンはTEACHER欄を最優先する
・画像内の吹き出し文、手書きポイント、見出し、配置も同じ参照ボードから読み取る
・商品画像URLと先生画像URLにはアクセスしない。URLより添付した参照画像を必ず優先する
・参照画像ボードが届いていない場合は画像を生成せず、「参照画像を1枚添付してください」とだけ返す`;
  const hanakoTeacherInstruction = isHanakoTeacherPattern(coordinate.imagePattern)
    ? `【ハナコ先生の吹き出し解説・必須】
・添付した画像ボードに写っている「${hanakoTeacher.name}」を、完成画像へ小さな先生役として登場させる
・先生画像URLは補助参照: ${hanakoTeacherReference.url}
・ハナコ先生はコーデを着る本人とは別の、丸いアイコン風の解説キャラクター。人物を2人並べた写真にはしない
・アイコンの顔、髪型、髪色、服、目の色を参照画像から変えず、描き直して別人にしない
・完成コーデを画面の約68%で大きく見せ、ハナコ先生は左下の安全な余白へ約28〜30%の大きさで、顔と表情がはっきり分かるよう配置する
・ハナコ先生を右端へ置かない。以前の左側レイアウトと同じく、左端から約6〜8%の安全余白を残し、頭、髪、リボン、丸いアイコンの輪郭を一切切らない
・ハナコ先生と吹き出しは画像左下で縦並びにし、吹き出しを先生の真上へ、先生をその下へ配置する。横並びや左右配置にしない
・吹き出しのしっぽは下向きにしてハナコ先生へつなげ、先生の顔やリボンへ本文を重ねない
・ハナコ先生からコーデへ向かう、白地にくすみピンク線の吹き出しを1個だけ付ける
・画像内で吹き出しとして描いてよいのは、このハナコ先生用の1個だけ。先生の近く、アイコンの上、商品ポイント、背景へ小さな追加吹き出しを作らない
・吹き出しは服へ重ねず、先生がやさしく授業しているような読み順にする
・吹き出しとは別に、選択した商品の正しい実物だけへ手書き風の矢印、丸囲み、下線、短いメモを入れる
・手書きポイントは商品ごとに具体的にし、同じ文を繰り返さない。服の色、形、重心、着回し、小物の役割を解説する
・先生の吹き出しは短い辛口総評、手書きポイントは各商品の解説として役割を分ける
・手書き文字は、くすみピンクとこげ茶の細いペンで丁寧に書いたファッションノート風にする
・吹き出しの見出しは必ず「ハナコ先生の今日のひとこと」。アイコンの種類名や「ラベンダーの」は見出しへ入れない
・吹き出し本文はこの1文だけ: 「${hanakoTeacherComment}」
・吹き出し内へ上記の見出しと本文以外を書かない。愛称、肩書き、掛け声、造語、擬音、補足、飾り文字を勝手に追加しない
・「なるんバー」のように意味を説明できない語、日本語として成立しない語、入力にない語を生成しない
・吹き出し全体を画像の左右端から8%以上、下端から8%以上離した安全域に置く。画像の最下端へ接触させない
・吹き出しの内側余白は少なめでよい。左右と上下に最低限の余白を残し、空白だらけの大きなカードにしない
・本文は1行16〜22文字を目安に自然な位置で改行し、最大3行まで使ってよい
・見出しは少し小さめ、本文は見出しより太く濃くして、スマホでも読みやすい文字サイズにする
・見出し、本文、句読点、閉じかぎ括弧をすべて吹き出しの内側へ収め、文字の周囲に必要十分な内側余白を残す
・本文を省略、要約、途中切れ、三点リーダー化しない。入りきらない場合は、吹き出しを上へ移動または縦に広げ、それでも必要なら全文が読める範囲で文字を小さくする
・文字を服、先生アイコン、画像の外へはみ出させない。文章の最後の1文字まで見えることを生成前に確認する
・画像ボードの先生アイコンと上記のひとことをセットで完成画像へ必ず反映する`
    : "";
  const sourceInstruction = originalProductPhotoMode
    ? `画像を生成してください。これは商品写真のレイアウト編集依頼です。文章だけで回答せず、添付した参照画像ボード1枚を使って、新しい完成画像を1枚作ってください。

添付画像にない商品や人物を新しく描かないでください。商品の色、形、柄、素材、ロゴを変えず、添付画像への正確さを最優先してください。`
    : `画像を生成してください。これは画像生成・写真編集の依頼です。文章だけで回答せず、添付した参照画像ボード1枚を使って、新しい完成画像を1枚生成してください。

参照画像ボードのPERSON欄は私本人の写真で、画像生成に使う権利があります。楽天ROOMのコーディネートへ投稿するための、究極におしゃれでかわいい「着用イメージ画像」に編集してください。`;
  const personInstruction = originalProductPhotoMode
    ? `【人物について】
・このパターンでは人物や着用モデルを生成しない
・本人写真の髪型設定は使わず、参照画像ボードのPRODUCT欄にある商品だけでコーデの組み合わせを見せる`
    : `【女の子】
・参照画像ボードのPERSON欄と同じ女の子だと分かるよう、顔、髪型、髪色、体型、肌の雰囲気を一貫させる
・別人にしない。年齢を変えない。顔を大きく加工しない
・この依頼では女の子はマスク着用が必須。元写真と同じマスクを必ず着けたままにする
・マスクの色、形、大きさ、柄、ひもの位置、顔を覆う範囲を元写真から変えない
・マスクを外す、別のマスクへ交換する、透明にする、口や鼻を見せる加工をしない
・元写真でマスクを着けていない場合は、新しくマスクを追加しない
・ポーズは元写真を生かしつつ、手元や足元を自然でかわいくアレンジする
・選んだポーズは「${coordinate.pose}」。本人らしさとマスクを保ちながら、このポーズの雰囲気へ自然に寄せる
・指、手足、顔、服の重なりを不自然にしない
・過度な露出や不自然な体型変更はしない`;
  const hairInstruction = originalProductPhotoMode
    ? "この商品写真パターンでは髪型の指定は使わない。人物を追加しない。"
    : `${coordinate.hairStyle}
・顔、髪色、本人らしい雰囲気は変えず、髪型だけを自然にこの指定へ合わせる
・「元写真の髪型を保つ」の場合は、長さ、前髪、分け目、髪の流れを変えない
・髪が服や顔へ不自然に重ならないようにする`;
  const layoutInstruction = originalProductPhotoMode
    ? `・元の商品写真が3:4でない場合は、商品を切らずに背景と余白を自然に広げる
・添付した画像ボードの商品が主役。各商品の色、形、柄が分かる構図にする`
    : `・元写真が3:4でない場合は、人物を切らずに背景と余白を自然に広げる
・女の子とコーデが主役。全身が見え、服の形と組み合わせが伝わる構図`;
  const consistencyInstruction = originalProductPhotoMode
    ? "・完成画像は縦3:4の1枚にまとめ、同じ実物商品写真を描き直さず一貫して使う"
    : "・完成画像は縦3:4の1枚にまとめ、同じ女の子、同じ髪型、同じコーデを一貫させる";
  const brandCoordinationInstruction = originalProductPhotoMode
    ? `・主役商品は、添付した画像ボードにある商品写真を基準に使う
・下の「使用許可された商品一覧」にある商品だけを使う
・同じブランドでも、画像ボードと一覧にない商品は画像へ追加しない
・商品の色、形、柄、ロゴを変えず、違う商品や人物を生成しない`
    : `・下の「使用許可された商品一覧」にある選択商品だけでコーデを作る
・主役商品を別の商品へ置き換えず、選択したほかの商品も省略せず、すべて1点ずつ完成コーデへ反映する
・同じブランドでも、一覧にない商品、似た商品、色違い、形違い、AIが考えた代用品を絶対に足さない
・選択商品を別カテゴリへ変えない。トップスをワンピースへ、スカートをパンツへ、バッグを別形状へ変えない
・実在しない商品名、ロゴ、柄、装飾を作らない。商品画像で確認できない細部は足さず、見えない側へ自然に逃がす
・一覧の商品写真が不足している場合は、似た商品を生成して埋めない。不足している商品名を短く伝え、画像生成を開始しない`;
  const productDisplayInstruction = originalProductPhotoMode
    ? `・画像ボードの商品写真は切り抜き、傾き補正、明るさ調整、自然な影、背景整理だけを行う
・商品そのものを再生成、着せ替え、変形、色変更しない
・元写真の質感を保ち、本人が撮影した商品写真のコラージュとして仕上げる`
    : `・画像ボードの商品画像を最優先し、商品名、商品画像URL、商品ページURLは補助照合に使う
・商品にないロゴや柄、ブランド名を勝手に追加しない
・完全な実物写真だと断定する見せ方ではなく、自然な着用イメージにする
・自然光で明るく、服の細部が見やすい高画質にする`;
  const finalSubjectCheck = originalProductPhotoMode
    ? "・画像ボードの商品写真の色、形、柄、ロゴが変わっていない"
    : "・最初にマスクを確認する。元写真と同じマスクが同じ状態で残り、口と鼻が見えていない";
  const imageTextRestriction = originalProductPhotoMode
    ? "・画像内にサービス名、URL、値段、新しいブランドロゴを文字として追加しない。元の商品写真に写っているロゴは消したり変えたりしない"
    : "・画像内に「楽天ROOM」「楽天ルーム」「ROOM」、URL、値段、ブランドロゴを入れない";
  return `${sourceInstruction}

${attachmentInstruction}

${maskLockInstruction}

${qualityLockInstruction}

【画像サイズと構図】
・完成画像は必ず縦3:4。推奨サイズは1536×2048px
${layoutInstruction}

${coordinateLocationInstruction}

【利用上の区分】
・この生成画像はコーデ検討・SNS用の着用イメージとして作る
・実際に本人が着用して撮影した事実や、ROOMのオリジナル写真であるかのように見せない
・ROOMへ実投稿する際は、本人が実際に着用して撮影した全身写真を使い、その写真に写っている商品だけを登録する
・店舗の商品画像を保存・加工した画像を、本人撮影の商品写真として扱わない

【コーデの雰囲気】
${coordinate.style}
シーン: ${coordinate.occasion}
ポーズ: ${coordinate.pose}
全体は明るく、清潔感があり、大人ガーリーで甘めきれいめ。かわいいだけでなく、まねしたくなる洗練されたファッション投稿にする。

【スタイリストの設計図】
解決したい悩み: ${coordinate.concern}
一番優先すること: ${coordinate.priority}
解決方法: ${stylingPlan.solution}
シルエット: ${stylingPlan.silhouette}
色バランス: ${stylingPlan.colorPlan}
季節設計: ${stylingPlan.seasonPlan}
各アイテムの役割:
${stylingPlan.itemRoles.map((item) => `・${item.name}: ${item.role}`).join("\n")}
この設計を見た目で伝える。商品をただ並べず、主役・引き立て役・締め色の関係が一目で分かる完成コーデにする。

${fashionScoreInstruction}

【選んだ髪型】
${hairInstruction}

【選んだ画像パターン】
${coordinate.imagePattern}
${imagePatternInstruction}
${consistencyInstruction}

${hanakoTeacherInstruction}

【必ず使う主役商品】
商品名: ${mainProduct.name}
ブランド: ${brand || "商品ページと商品画像URLから確認"}
カテゴリ: ${mainProduct.category}
商品画像URL: ${mainProduct.image || "なし"}
商品ページURL: ${mainProduct.url || "なし"}

【選択した商品】
${items}

【使用許可された商品一覧・この商品以外は禁止】
選択数: ${coordinate.products.length}点
${selectedProductManifest}
・上記${coordinate.products.length}点をすべて使う。1点も省略しない、別商品へ置換しない、一覧外の商品を追加しない

【選択商品固定の絶対条件】
${brandCoordinationInstruction}

${personInstruction}

【服の見せ方】
${productDisplayInstruction}

【選択商品の見た目を固定・最優先】
・画像ボード内の各商品画像を「似た商品の参考」ではなく、完成画像で再現する同一商品の設計図として扱う
・商品ごとに一覧番号、商品名、カテゴリ、商品画像を対応させ、別番号の商品特徴を混ぜない
・生成前に商品ごとに、色、配色、形、丈、袖丈、袖の形、襟ぐり、首元、ウエスト位置、裾、柄、柄の大きさと位置、素材感、ギャザー、フリル、リボン、ボタン、持ち手、金具を目で照合する
・上記の特徴を省略、単純化、誇張、左右反転、別の色へ変更しない。無地を柄物にせず、柄物を無地にしない
・トップスを別の襟や袖へ変えない。スカートやパンツの丈と広がりを変えない。バッグの輪郭、持ち手、色、金具を別デザインへ変えない
・体へ自然に沿わせるためのしわと遠近だけを調整し、商品のデザインそのものは編集しない
・商品画像で確認できない部分を想像で華美に足さない。判別できない細部は目立たせず、確認できる特徴を優先する
・完成前に各商品を参照画像と一つずつ見比べ、色、輪郭、丈、袖、襟、柄、装飾のどれか一つでも違う場合は、同じ商品に見えるまで修正する
・正確に再現できない商品を、似た別商品で代用しない。その場合は画像を完成扱いにせず再生成する
・主役だけ合っていても合格にしない。選択した${coordinate.products.length}点すべてが、それぞれの参照商品と同じであることを必須にする

【日本語のデザイン】
ファッションの特徴を「なやみ → かいけつ → かわいくなる理由」の流れで、余白に短く入れる。
雑誌のようにおしゃれで、少し楽しく、思わず読みたくなる配置にする。
文字は大きすぎず、人物や服に重ねない。むずかしい漢字は使わず、読みやすい日本語にする。
次の文章は書き換えず、そのまま使う。語尾の変更、要約、言い換え、単語の追加をしない:
${imageCopy.map((line) => `・${line}`).join("\n")}
・上の3文は必ず全文が読める余白へ配置する。入りきらない場合は文字を小さくする、2行に分ける、または配置を変える。途中を「…」で省略しない
・画像内に「色数を抑…」「素材感…」のような途中切れの文を残さない。文末まで表示できない文字要素は入れない
・画像の一番上の見出しは必ず「${fixedImageHeadline}」と一字一句同じにする
・見出しの「解決」は必ずこの2文字で書く。「いけつ」「かいけつ」の一部欠け、別の漢字、似た字へ変えない
・一番上の見出しはコピー用の完成文であり、助詞を削除したり、語順を変えたり、新しい言葉を足したりしない

【商品の手書き風ポイント】
・服と小物は写真らしい質感のまま残し、選択した商品だけに手書き風の矢印、細い囲み線、下線、短い平文ラベルを添える。商品用のミニふきだしは作らない
・くすみピンク、こげ茶、白を中心にしたペン画風で、雑誌の手書きメモや上品なスクラップブックのように仕上げる
・小さなリボン、ハート、きらめき、レース線、マスキングテープ風のアクセントを少量だけ使う
・下の「商品別の対応表」を先に照合し、1商品につき注釈は最大1個、全体で選択商品数を超えないようにする
・画像へ表示する文字は「表示文」のかぎ括弧内だけにする。「トップスの近く」「バッグの近く」「ワンピの近く」「〜の近く」という位置説明は画像へ書かない
・矢印の先端は、対応表の「矢印の終点」に指定された商品の実物へ必ず触れさせる。人物の顔、腕、背景、別の商品を指さない
・トップスの説明をバッグへ、バッグの説明を服へ、アクセの説明を顔へ付け替えない。カテゴリと解説内容を必ず一致させる
・対象商品を画像内で確実に判別できない場合は、その注釈だけを省略する。別の商品へ流用して数を埋めない
・人物の顔や服の大事な部分へ文字やかざりを重ねない。余白を生かし、情報を詰め込みすぎない
・テンプレートを貼っただけに見せず、線の太さ、文字サイズ、囲み方に変化をつけ、丁寧に作り込んだ編集画像にする
・手書き風でも日本語ははっきり読めるようにし、誤字や文字化けを出さない
・商品ポイントの文字も、下の「表示文」を一字一句そのまま使う。入力にない掛け声、愛称、造語、擬音を追加しない

商品別の対応表（画像へ書くのは「表示文」だけ）:
${productPointNotes.map((line) => `・${line}`).join("\n")}

【文字のルール】
・日本語の誤字、文字化け、意味のない文字を出さない
・画像へ書いてよい文章は、このプロンプト内で表示文として明示した文章、指定した見出し、指定した吹き出し本文だけ
・指定されていない文章を新しく作らない。意味を説明できない単語、一般的な日本語辞書にない造語、途中で切れた語を出さない
・文字の生成に少しでも自信がない場合は、その文字要素を追加せず省略する。ただし指定した先生の見出しと本文は省略せず正確に書く
・上部見出し「${fixedImageHeadline}」を出力直前に一文字ずつ照合し、違う文字や欠けがあれば正しい完成文へ直す
・文字数を増やしすぎない。読みにくい場合は文章を減らす
${imageTextRestriction}
・英語だけの見出しにせず、かわいい日本語を中心にする

【最終チェック】
・縦3:4になっている
${finalSubjectCheck}
${originalProductPhotoMode ? "" : "・マスクが無い、変形した、口や鼻が見える場合は完成扱いにせず、元写真と同じマスクへ直してから出力する"}
・1536×2048px相当以上の縦3:4で、人物、商品、文字が鮮明になっている
・一番上の見出しが「${fixedImageHeadline}」と完全一致し、「解決」の2文字が正しく読める
${isHanakoTeacherPattern(coordinate.imagePattern) ? `・指定URLと同じハナコ先生アイコンがある
・見出しは「ハナコ先生の今日のひとこと」になっている
・吹き出し本文「${hanakoTeacherComment}」の最初から最後の閉じかぎ括弧まで、省略や欠けがなく最大3行で読める
・吹き出しは画像下端から8%以上離れ、余白が多すぎない。本文は太く濃く、スマホで読みやすい
・先生の吹き出しは1個だけで、先生付近に別の小さい吹き出しや飾り文がない
・画像内の全テキストを一文字ずつ読み直し、入力にない語、意味不明語、造語、文字化け、途中切れが一つでもあれば、その文字を削除または指定文へ修正してから出力する
・商品への手書きポイントは選択商品数以内で、互いに重ならず読みやすい` : ""}
・手書きポイントは選択した商品だけに付き、表示文の内容と矢印の対象カテゴリが一致している
・選択商品の色、形、丈、袖、襟、柄、素材、装飾、バッグの輪郭と持ち手が、各商品画像URLと一致している
・使用許可された${coordinate.products.length}点がすべて画像内にあり、未選択商品、似た代用品、色違い、形違いが一つもない
・「トップスの近く」「バッグの近く」「ワンピの近く」「〜の近く」という不要な位置説明が画像内にない
・バッグを指す矢印に、顔まわり・トップス・足もとの説明が付いていない
・コーデが主役で、商品が自然に組み合わされている
・悩み「${coordinate.concern}」への解決が、シルエットと色の両方で伝わる
・季節とシーンに合わない厚着、薄着、靴、小物になっていない
・主役以外の商品が主張しすぎず、コーデ全体に一つの視線の流れがある
・画像にない商品を、実際に着用した商品として説明していない
・余白の日本語が読みやすく、課題解決風でかわいい。途中で切れた文章や「…」で省略した文章がない
・画像内に楽天ROOMを示す文字が入っていない
・右下に半透明で小さなファッションランク、レーダーチャート、ファッションパワーのスコアカードがあり、コーデや商品を隠していない
・レーダーチャートの周囲に意味のない単独数字がなく、軸名と形だけで特徴が伝わる

以上の条件をすべて守り、文章による説明や紹介文は返さず、完成画像だけを生成してください。`;
}

function buildCoordinateFashionScorePrompt(fashionScore) {
  return `【右下スコアカード・必須】
・完成画像の右下へ、コーデや商品を隠さない小さな情報カードを1個だけ入れる
・カードは画像幅の20〜24%以内、高さは画像高さの13〜16%以内。余白を詰め、右下に軽く重なる透明ステッカーのように小さくまとめる
・カード背景は白または淡いピンクの半透明ベース。不透明な大きい白カードにしない
・角丸、細いピンク線、少量の小さなハートやリボンで上品に飾る。装飾は文字より目立たせない
・カード内に必ず次の3要素を入れる
  1. ファッションランク: 楽天ROOMのランクアイコン風の丸いバッジで「${fashionScore.rank}」を大きく表示する。横に小さなリボンラベルで「${fashionScore.rankLabel}」をかわいく入れる
  2. レーダーチャート: 5軸で表示する。軸名は ${fashionScore.metrics.map((metric) => metric.label).join(" / ")}。数値は内部評価として使い、チャート周囲へ単独の数字を散らさない
  3. ファッションパワー: 「${fashionScore.power}pt」と1回だけかわいく表示する
・レーダーチャートの評価値は ${fashionScore.metrics.map((metric) => `${metric.label}:${metric.value}`).join(" / ")} を使う。高すぎる満点感を出さず、少し辛口の自己判定に見せる
・この診断では80点台でも十分高評価。チャートを盛って90点台や満点のように見せない
・スコアカードの見出しは「FASHION SCORE」または「おしゃれ診断」にする
・右下カードは主役の服、顔、ハナコ先生の吹き出し、商品ポイントに重ねない。必要なら少し小さくしてもよい
・ランク、チャート、点数はこの指定から変えない。別の点数や別ランクを作らない
・レーダーチャートは「配色が強い」「抜け感が少し弱い」などが形で分かる納得感のあるバランスにする。正五角形の満点チャートにしない
・チャート外側に「95」「100」など意味不明な数字を単独表示しない。数字を書くのはファッションパワーの「${fashionScore.power}pt」だけ
・「神コーデ級」などのランクラベルは、小さなリボン帯、シール、ハート囲みのどれかでかわいくデザインし、ただの黒文字にしない
・レーダーチャートはピンク系の線と淡い塗りで、軸名は小さくても読める濃さにする`;
}

function buildCoordinateLocationInstruction(coordinate, originalProductPhotoMode) {
  if (originalProductPhotoMode) return `【場所】
・このパターンは本人撮影の商品写真が主役なので、新しい部屋、屋外、海外都市、ランドマークを生成しない`;
  if (coordinate.location === "overseas") return `【場所・海外都市】
・舞台は${coordinate.city}。背景に「${coordinate.landmark}」を、その都市だと自然に分かる大きさで少しだけ入れる
・ランドマークは背景全体の15〜25%を目安にし、女の子と選択商品より目立たせない。観光ポスターのように巨大化しない
・${coordinate.city}の実際の街並み、建築、光、季節感と矛盾しない構図にし、別都市の名所を混ぜない
・旅行中に自然に撮った上品なファッションスナップのように見せ、人物や商品と背景の光、遠近、影をなじませる`;
  if (coordinate.location === "my-room") return `【場所・自分のへや】
・舞台は明るく清潔でかわいい自分のへや。白、木の家具、小さな鏡、花や本を控えめに使う
・高級ホテルや巨大な邸宅にはせず、親しみやすく真似したくなる部屋にする`;
  if (coordinate.location === "stylish-cafe") return `【場所・おしゃれなカフェ】
・舞台は自然光の入る上品なカフェ。木、白、ガラスを使った落ち着く内装にする
・店名、企業ロゴ、メニュー価格、読めない看板文字は入れない`;
  return `【場所・おしゃれな屋外】
・舞台は緑と洗練された建物が調和する、おしゃれな屋外の小道やテラス
・特定できない看板や海外ランドマークは足さず、日常のお出かけスナップとして自然にする`;
}

function generateGeminiCaptionPrompt() {
  const coordinate = getSelectedCoordinate();
  if (!coordinate.products.length) return showToast("コーデに使う商品を選んでください");
  if (!document.querySelector("#coordMainProduct")?.value) return showToast("紹介する主役商品を選んでください");
  coordGeminiCaptionPrompt.value = adaptPromptToSelectedAi(buildCoordinateCaptionPrompt(coordinate));
  document.querySelector("#coordStatus").textContent = "紹介文プロンプト作成済み";
  showToast("コーデ紹介文のプロンプトを作りました");
}

function buildCoordinateCaptionPrompt(coordinate) {
  const mainProduct = coordinate.mainProduct || coordinate.products[0];
  const stylingPlan = buildCoordinateAnalysis(coordinate);
  const greeting = buildRandomFashionGreeting();
  const brand = getCoordinateBrand(mainProduct);
  const brandProducts = [];
  const items = coordinate.products.map((product) => `・${product.category}: ${product.name}
  ブランド: ${getCoordinateBrand(product) || "商品ページで確認"}
  推しポイント: ${product.hook || createCoordinateHook(product)}
  価格メモ: ${product.price || "未設定"}`).join("\n");
  const brandItems = brandProducts.length
    ? brandProducts.map((product) => `・${product.category}: ${product.name}\n  推しポイント: ${product.hook || createCoordinateHook(product)}`).join("\n")
    : "追加候補なし";
  const locationLabel = coordinate.location === "overseas"
    ? `${coordinate.city}（背景のランドマーク: ${coordinate.landmark}）`
    : { "my-room": "自分のへや", "stylish-outdoor": "おしゃれな屋外", "stylish-cafe": "おしゃれなカフェ" }[coordinate.location] || "おしゃれな屋外";
  const overseasEpisodeInstruction = coordinate.location === "overseas"
    ? `・本文の中に、選んだ海外都市「${coordinate.city}」のミニ情報をかわいく自然に入れる
・ミニ情報は「${coordinate.landmark}」、街の色や空気感、コーデとの相性を2〜3文でまとめる
・観光ガイドの丸写しにせず、ファッション投稿として「${coordinate.city}を歩くならこのバランスが似合いそう」と感じる一言にする
・実際に${coordinate.city}へ行った、そこで着た、撮影したとは断定しない。「${coordinate.city}を歩くなら」「${coordinate.landmark}を背景にした気分で」のような想像として自然に書く`
    : `・選んだ場所「${locationLabel}」がコーデの雰囲気とどう合うかを、本文へ短く1文だけ入れる`;
  const captionLength = "430〜470文字くらい、目安は約450文字";
  return `次の完成コーデを読者へ紹介する、短くてかわいい文章を1案作ってください。商品の一覧説明ではなく、コーデ画面で選択した商品だけをどう組み合わせたのかが伝わる文章にしてください。

雰囲気: ${coordinate.style}
シーン: ${coordinate.occasion}
髪型: ${coordinate.hairStyle}
ポーズ: ${coordinate.pose}
画像パターン: ${coordinate.imagePattern}
解決したい悩み: ${coordinate.concern}
一番優先すること: ${coordinate.priority}
色バランス: ${coordinate.colorMood}
季節: ${coordinate.season}
画像の場所: ${locationLabel}
主役商品: ${mainProduct.name}
主役ブランド: ${brand || "商品ページで確認"}

選んだ商品:
${items}

追加商品について:
選択されていない商品は紹介しない。似た商品や同ブランドの別商品を追加しない。

スタイリストの設計:
・解決方法: ${stylingPlan.solution}
・シルエット: ${stylingPlan.silhouette}
・色: ${stylingPlan.colorPlan}
・季節: ${stylingPlan.seasonPlan}
・買う前チェック: ${stylingPlan.checks.join(" / ")}

【紹介文の条件】
・最初の1行は必ず「${greeting}」と一字一句同じにする
・「おはファッション〜っ！」の文字は毎回固定し、その直後の絵文字だけを今回指定した組み合わせにする
・内部で冒頭3案と構成3案を考え、いちばん自然で保存したくなる完成稿だけを出す
・実際には内部で「共感から入る案」「結論から入る案」「小さな失敗を避ける案」を各4案作り、商品との一致度が最も高い1案を選ぶ
・冒頭は「${greeting}」の後、最初の100文字程度でコーデの結論をいったんまとめる
・最初の100文字程度には、誰向けか、主役商品、解決できる悩み、かわいく見える理由を短く入れる
・100文字前後で一度改行し、その後に着こなしの理由、場所の話、買う前チェック、保存したくなる締めへ自然につなげる
・${captionLength}で、短い文と空行を使い、スマホで読みやすくまとめる
${overseasEpisodeInstruction}
・話し手は礼儀正しく、ファッションが大好きな女子大生
・宣伝文を先に作らず、選んだシーンの具体的な一瞬、鏡の前の迷い、着た時に気になる点など、人が実際に考える順番から書く
・短い一文で気持ちを置き、その次の少し長い文で理由を説明する。全文を同じ長さ、同じ語尾にしない
・「かわいい」「高見え」「おすすめ」だけで終わらせず、丈、重心、色数、素材、小物のうち商品画像や情報で確認できる具体点へ言い換える
・同じ段落で「です」「ます」を3回以上続けない。接続詞を毎文入れず、自然な間を作る
・一か所だけ、礼儀正しい女子大生らしい本音や小さな迷いを入れる。ただし購入・着用していない体験は作らない
・ハナコ先生として、自信のあるファッション解説に、愛のある鋭いひと言、くすっとする面白さ、女子大生らしい共感を自然に入れる
・「よくある服のなやみ → このコーデでのかいけつ → かわいく見える理由」の順で書く
・悩み「${coordinate.concern}」に共感し、選んだ服の形・色・小物がどう解決するかを具体的に書く
・「かわいい」「高見え」だけで済ませず、シルエット、色数、重心、丈、素材、小物、着回しから今回本当に役立つものを2〜3個選んで説明する
・先生らしい実用アドバイスとして「なぜ似合うか」「選ぶときに見る場所」「手持ち服で再現する方法」のうち2つ以上を必ず入れる
・買う前に確認するポイントを1つ入れる。サイズ、丈、透け感、素材、洗濯表示、手持ち服との相性から商品に合うものを選ぶ
・抽象的なほめ言葉を続けず、読者が明日の服選びで実際に試せる内容にする
・読み終えた人が一つ行動できるよう、「手持ち服の何を見るか」「商品ページのどこを確認するか」を具体的に示す
・主役商品を必ず具体的に紹介し、選択した商品の組み合わせによる統一感にふれる
・商品名を並べるだけにせず、色、形、素材感、全体のバランスがどうかわいく見えるかを書く
・選んだシーンで着たくなる一言と、読んだ人が前向きになれる締めを入れる
・1文を短めにし、2〜4つの段落に分ける
・冒頭以外の絵文字も、文章になじむものを2〜4個選び、毎回同じ並びにせず、同じ絵文字を繰り返さない
・本文の最後は保存したくなる一言か、手持ち服を確認したくなる一言で締める
・その次の最終行に、内容と商品に合うハッシュタグを必ず4個だけ入れる
・ハッシュタグは「#楽天ROOM」を1個含め、残り3個はコーデの系統、悩み、着用シーンから具体的に選ぶ
・ハッシュタグは重複させず、絵文字や文章を同じ行へ混ぜない。5個以上にしない
・むずかしい漢字、上から目線、乱暴な言い方、わざとらしい若者言葉、誇大表現は使わない
・特定の人物や作風を示す言葉、読者への乱暴な呼びかけは絶対に書かない
・実際に買った、着た、使ったと確認できない内容は断定しない
・完成後に、意味の通らない見出し、同じ意味の繰り返し、根拠のない数字、不自然な若者言葉、AIらしい総まとめ表現がないか読み直し、あれば自然な日本語へ直す
・最後に商品カテゴリごとの整合性を確認し、バッグに顔まわり、靴に収納力、アクセサリーに着丈など、対象と説明が食い違う文を残さない
・「ご紹介します」「魅力が満載」「いかがでしたか」「ぜひチェック」「間違いなし」を使わず、本人の観察と役立つ助言で読ませる
・画像制作の指示や前置き、解説、見出しは書かない

完成した紹介文だけを出力してください。`;
}

function buildRandomFashionGreeting() {
  const emojiSets = [
    "🌸👗✨", "🎀🪞🌷", "🩷👠✨", "🌼👗🫧", "🎀👜🌸",
    "💐👗🩰", "🌷🪄🩷", "👒🌸✨", "🦢🎀🪞", "🍓👗🤍",
    "🌹👜✨", "🫧👠🎀",
  ];
  const previous = buildRandomFashionGreeting.previousEmoji || "";
  const candidates = emojiSets.filter((emojiSet) => emojiSet !== previous);
  const selected = candidates[Math.floor(Math.random() * candidates.length)] || emojiSets[0];
  buildRandomFashionGreeting.previousEmoji = selected;
  return `おはファッション〜っ！${selected}`;
}

function getCoordinateBrand(product) {
  return String(product?.details?.brand || product?.details?.shopName || "").trim();
}

function getCoordinateImagePatternInstruction(pattern, coordinate) {
  const patterns = {
    "全身1カット＋手書きポイント": "女の子の全身を大きく1カットで見せ、商品の周囲に手書きポイントを配置する。",
    "おしゃれ雑誌の表紙風": "女の子を中央に大きく配置し、上品な雑誌表紙のような余白、見出し、手書きポイントで編集する。",
    "3カットのコラージュ": "全身のメインカットを大きく、同じコーデの別ポーズと商品ディテールを小さく2カット添える。",
    "商品アップ入り編集": "全身のメインカットに、主役商品の素材・形と小物が分かるアップ画像を2〜3個添える。",
    "おでかけスナップ風": "選んだシーンに合う自然な屋外背景で、歩く・振り返るなどのかわいいスナップ写真風にする。",
    "淡色スタジオ撮影風": "白と淡いピンクの明るいスタジオで、やわらかな自然光と少ない小物を使い上品に撮影する。",
    "ハナコ先生の吹き出し解説": "完成コーデを大きく見せ、今回選ばれたハナコの丸い先生アイコンを以前と同じ左下の安全な余白へ、顔がはっきり見える約28〜30%の大きさで配置する。先生は左端から6〜8%離して輪郭を切らず、吹き出しは先生の真上へ縦並びで配置する。吹き出しを先生の左右へ置かず、下向きのしっぽで先生へつなぐ。先生の吹き出し1個で悩みの解決を短く総評する。商品ポイントは選択した商品だけに最大1個ずつ付け、表示文と矢印の対象を商品別の対応表どおりに一致させる。選択していない商品や判別できない商品へ注釈を足さない。上部10%は短い見出し、中央約66%は完成コーデ、下部約24%は先生解説として毎回同じ情報階層を保つ。ファッション誌の解説ページのように、かわいく高品質で読みやすく整理する。",
    "コレクション表紙用": `コレクションの表紙として、中央に完成コーデを大きく見せる。上部に「大人かわいい ${coordinate.occasion} コーデ」と短く読みやすい日本語を置き、小さな一覧表示でもテーマが伝わる構図にする。重要な文字と商品は端へ寄せず、中央寄りの安全な範囲へ置く。画像内にサービス名は入れない。`,
    "オリジナル商品写真で投稿": "本人が撮影して添付した商品写真を切り抜き、明るさと背景だけを自然に整え、フラットレイまたは上品な商品コラージュにする。商品そのものを描き直さず、色・形・柄・ロゴを変えない。添付されていない商品や人物を生成しない。",
  };
  return patterns[pattern] || patterns["ハナコ先生の吹き出し解説"];
}

function getSameBrandProducts(mainProduct) {
  const brand = getCoordinateBrand(mainProduct).toLocaleLowerCase("ja-JP");
  if (!brand) return [];
  return state.products
    .filter((product) => product.id !== mainProduct?.id
      && product.category !== "ホテル・旅行"
      && getCoordinateBrand(product).toLocaleLowerCase("ja-JP") === brand)
    .slice(0, 6);
}

function buildCoordinateImageCopy(coordinate) {
  const analysis = buildCoordinateAnalysis(coordinate);
  return [
    `「${coordinate.concern}」をかわいく解決♡`,
    buildShortCoordinateSolutionLine(coordinate, analysis),
    `${coordinate.occasion}×${coordinate.priority}に、ちょうどいい♡`,
  ];
}

function buildShortCoordinateSolutionLine(coordinate, analysis) {
  const text = `${coordinate.concern || ""} ${coordinate.priority || ""} ${analysis.solution || ""}`;
  if (/気温差|温度|寒暖|羽織|重ね/.test(text)) return "重ねて脱げるから温度調整しやすい";
  if (/色数|配色|まとまり/.test(text)) return "色数をしぼってすっきり見せる";
  if (/体型|バランス|重心|脚長|すっきり/.test(text)) return "重心を上げてすっきり見せる";
  if (/甘すぎ|幼く|大人|上品/.test(text)) return "甘さを一点にしぼって大人顔に";
  if (/高見え|素材|きれいめ/.test(text)) return "素材感をそろえて高見えに";
  if (/写真映え|映え|華や/.test(text)) return "見せ場を一つ作って写真映え";
  if (/頑張り|抜け感|こなれ/.test(text)) return "主役を決めて抜け感を残す";
  return "主役を決めて全体をきれいに整える";
}

function buildHandwrittenProductPoints(coordinate) {
  return coordinate.products
    .slice(0, 5)
    .map((product, index) => {
      const point = getCoordinateHandwrittenPoint(product, coordinate);
      if (!point) return `対象${index + 1}｜商品名: ${product.name}｜カテゴリ: ${product.category}｜注釈なし（対象を判別できる場合も文字を追加しない）`;
      return `対象${index + 1}${index === 0 ? "・主役" : ""}｜商品名: ${product.name}｜カテゴリ: ${product.category}｜表示文: 「${point.copy}」｜矢印の終点: ${point.target}`;
    });
}

function refreshCoordinateHandwrittenPoints(coordinate) {
  const previous = currentCoordinateHandwrittenPoints;
  const next = new Map();
  coordinate.products.slice(0, 5).forEach((product) => {
    next.set(product.id, chooseCoordinateHandwrittenPoint(product, coordinate, previous.get(product.id)?.copy));
  });
  currentCoordinateHandwrittenPoints = next;
}

function ensureCoordinateHandwrittenPoints(coordinate) {
  coordinate.products.slice(0, 5).forEach((product) => {
    if (!currentCoordinateHandwrittenPoints.has(product.id)) {
      currentCoordinateHandwrittenPoints.set(product.id, chooseCoordinateHandwrittenPoint(product, coordinate));
    }
  });
}

function getCoordinateHandwrittenPoint(product, coordinate) {
  if (!product) return null;
  ensureCoordinateHandwrittenPoints(coordinate || { products: [product] });
  return currentCoordinateHandwrittenPoints.get(product.id) || null;
}

function chooseCoordinateHandwrittenPoint(product, coordinate, previousCopy = "") {
  const text = `${product.name || ""} ${product.hook || ""} ${product.details?.color || ""} ${product.details?.material || ""}`;
  const contextual = [];
  if (/黒|ブラック|ネイビー|濃色/.test(text)) contextual.push("濃色で全体をきゅっと", "締め色で甘さを整える");
  if (/白|ホワイト|アイボリー|ベージュ|淡色/.test(text)) contextual.push("淡色でやさしくつなぐ", "明るい色で軽やかに");
  if (/赤|ピンク|ブルー|グリーン|イエロー|パープル/.test(text)) contextual.push("差し色はここにひとつ", "この色をコーデの主役に");
  if (/レース/.test(text)) contextual.push("レースは一か所で上品に", "繊細レースで華やぎ足し");
  if (/シアー|透け/.test(text)) contextual.push("透け感で重さをオフ", "シアー感で軽く見せる");
  if (/デニム/.test(text)) contextual.push("デニムで甘さをほどよく", "デニムで気負わず整える");
  if (/ニット|編み/.test(text)) contextual.push("編み地でやさしい立体感", "ニットの質感を主役に");
  if (/リボン/.test(text)) contextual.push("リボン主役で小物は静かに", "リボンへ視線を集めて");
  if (/フリル|ティアード/.test(text)) contextual.push("甘いディテールはここだけ", "揺れ感を一か所で効かせる");
  if (/ハイウエスト|脚長|ウエスト/.test(text)) contextual.push("高め重心で脚長バランス", "腰位置を上げてすっきり");
  if (/軽量|歩き|ストレッチ/.test(text)) contextual.push("動きやすさもかわいさの味方", "軽やかだから一日頼れる");

  const byCategory = {
    ワンピース: ["1まいでコーデが完成", "縦の流れですっきり見え", "主役ワンピは小物で引き算", "丈感を生かして上品に", "シルエットをきれいに見せる", "一枚で華やぎをつくる", "小物を静かにして主役顔", "全身の色数をすっきり"],
    トップス: ["顔まわりへ視線を集めて", "上半身を明るく見せる", "主役トップスで迷わない", "裾の入れ方で重心アップ", "首もとに抜け感をつくる", "ボトムは静かに受け止めて", "袖の表情をかわいく見せる", "トップスの形を主役に"],
    アウター: ["羽織りで縦ラインを追加", "重ねても軽く見せる", "前を開けてすっきり縦長", "コーデの輪郭をきれいに", "温度調整までおしゃれに", "肩まわりを端正に整える", "羽織るだけで印象を更新", "中の甘さをきれいに締める"],
    スカート: ["揺れ感をコーデの見せ場に", "高め重心ですらっと見せる", "トップスを受け止める主役丈", "広がりは上半身で引き算", "足もとまで流れをつなぐ", "やわらかな動きをひとさじ", "腰まわりをすっきり整える", "甘さは丈感で大人に寄せる"],
    パンツ: ["直線ラインで甘さを調整", "脚の流れをすっきり見せる", "きれいめパンツで大人顔", "トップスの甘さを受け止める", "センターラインを味方に", "足もとまで色をつなげる", "動きやすく端正にまとめる", "下半身をすっきり引き締め"],
    バッグ: ["バッグで配色をひとまとめ", "小物の色をここでつなぐ", "バッグでほどよい抜け感", "主役服を邪魔せず引き立てる", "サイズ感で全身を軽やかに", "手もとへ小さな見せ場を", "かっちり感を少しだけ足す", "コーデの仕上げ色を担当"],
    シューズ: ["足もとでコーデを引き締め", "靴の色で全身をつなぐ", "つま先まできれいめに", "軽い足もとで抜けをつくる", "歩きやすさまで抜かりなく", "靴で甘さの温度を調整", "足もとに小さな締め色", "全身の重心を靴で整える"],
    アクセサリー: ["顔まわりへ光をひとさじ", "小さなきらめきで上品に", "アクセは一点だけ効かせる", "主役服を邪魔しない輝き", "視線を上へ運ぶ仕上げ役", "余白にきらめきを添える", "甘さを上品にまとめる", "最後のひとさじで完成"],
  };
  const targetByCategory = {
    ワンピース: "ワンピース本体の身頃またはスカート部分",
    トップス: "上半身のトップス本体。バッグ、腕、顔ではない",
    アウター: "羽織っているアウター本体",
    スカート: "腰から下のスカート本体",
    パンツ: "脚を覆うパンツ本体",
    バッグ: "手または肩に持つバッグ本体。トップス、顔ではない",
    シューズ: "足に履いている靴本体",
    アクセサリー: "実際に着けているアクセサリー本体",
  };
  const base = byCategory[product.category] || ["全体をきれいにまとめる", "主役を引き立てる名脇役"];
  const concernSpecific = coordinate?.priority === "スタイルバランス"
    ? ["重心を整えてすっきり見え"]
    : coordinate?.priority === "高見え"
      ? ["素材感を生かして高見え"]
      : coordinate?.priority === "写真映え"
        ? ["写真で伝わる見せ場をここに"]
        : [];
  const options = [...new Set([...contextual, ...concernSpecific, ...base])];
  const candidates = options.filter((copy) => copy !== previousCopy);
  const copy = candidates[Math.floor(Math.random() * candidates.length)] || options[0];
  return { copy, target: targetByCategory[product.category] || "該当する商品の実物本体" };
}

function openGemini() {
  openGeminiDestination();
}

function shareCoordinateToGemini() {
  if (!coordinateBoardDataUrl) return showToast("先にコーデ文と画像ボードを作ってください");
  if (getSelectedCoordinatePhoto() && !coordinateBoardHasPerson) return showToast("本人写真が画像ボードに入っていません。写真を選び直して、もう一度コーデを作ってください");
  const coordinate = getSelectedCoordinate();
  setCoordinatePrompts(coordinate);
  const boardFile = dataUrlToFile(coordinateBoardDataUrl, "hanako-coordinate-reference.png");
  const files = [boardFile];
  if (!navigator.share || !navigator.canShare?.({ files })) {
    downloadReferenceFile(boardFile, "hanako-coordinate-reference.png");
    navigator.clipboard?.writeText(coordGeminiPrompt.value).catch(() => {});
    openGeminiDestination();
    return showToast(`参照画像を保存しました。${getSelectedAiName()}へ画像1枚を添付してください`);
  }
  const sharePromise = navigator.share({
    title: "Hanako Style Studio・コーデ作成",
    text: coordGeminiPrompt.value,
    files,
  });
  navigator.clipboard?.writeText(coordGeminiPrompt.value).catch(() => {});
  sharePromise
    .then(() => showToast(`${getSelectedAiName()}で入力欄を長押しし、コピー済みプロンプトを貼ってください`))
    .catch((error) => {
      if (error?.name !== "AbortError") showToast(error.message || `${getSelectedAiName()}へ共有できませんでした`);
    });
}

function downloadReferenceFile(file, fileName) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function dataUrlToFile(dataUrl, fileName) {
  const [header, payload = ""] = String(dataUrl || "").split(",");
  const mimeType = header.match(/data:([^;]+)/)?.[1] || "image/jpeg";
  const binary = header.includes(";base64") ? atob(payload) : decodeURIComponent(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], fileName, { type: mimeType });
}

function openGeminiDestination() {
  const userAgent = navigator.userAgent || "";
  const isAndroid = /Android/i.test(userAgent);
  const isIos = /iPhone|iPad|iPod/i.test(userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (selectedAiProvider === "chatgpt") {
    if (isAndroid) {
      location.href = "intent://chatgpt.com/#Intent;scheme=https;package=com.openai.chatgpt;S.browser_fallback_url=https%3A%2F%2Fchatgpt.com%2F;end";
      return;
    }
    if (isIos) {
      let appOpened = false;
      const markOpened = () => { if (document.hidden) appOpened = true; };
      document.addEventListener("visibilitychange", markOpened, { once: true });
      location.href = "chatgpt://";
      window.setTimeout(() => {
        document.removeEventListener("visibilitychange", markOpened);
        if (!appOpened && !document.hidden) location.href = "https://chatgpt.com/";
      }, 1200);
      return;
    }
    window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer");
    return;
  }

  if (isAndroid) {
    location.href = "intent://gemini.google.com/app#Intent;scheme=https;package=com.google.android.apps.bard;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.google.android.apps.bard;end";
    return;
  }

  if (isIos) {
    let appOpened = false;
    const markOpened = () => {
      if (document.hidden) appOpened = true;
    };
    document.addEventListener("visibilitychange", markOpened, { once: true });
    location.href = "gemini://";
    window.setTimeout(() => {
      document.removeEventListener("visibilitychange", markOpened);
      if (!appOpened && !document.hidden) {
        location.href = "https://apps.apple.com/jp/app/google-gemini/id6477489729";
      }
    }, 1400);
    return;
  }

  window.open("https://gemini.google.com/app", "_blank", "noopener,noreferrer");
}

async function previewGeneratedCoordinateImage(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const dataUrl = await readFileAsDataUrl(file);
  const result = document.querySelector("#coordAiResult");
  result.hidden = false;
  result.innerHTML = `<img src="${dataUrl}" alt="AIで作った着用イメージ"><a class="primary" download="hanako-ai-outfit.png" href="${dataUrl}">添付画像を保存</a>`;
  document.querySelector("#coordStatus").textContent = "AI画像添付済み";
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

function readOriginalFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let resolvedSrc = String(src || "");
    try {
      const url = new URL(resolvedSrc, document.baseURI);
      resolvedSrc = url.href;
      if (["http:", "https:"].includes(url.protocol) && url.origin !== location.origin) {
        image.crossOrigin = "anonymous";
      }
    } catch {
      // data URLや一時URLはそのまま読み込む。
    }
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = resolvedSrc;
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

function drawContainImage(ctx, image, x, y, width, height) {
  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawFashionHanakoLogoText(ctx, x, y, width, height) {
  ctx.save();
  ctx.fillStyle = "#4d3a31";
  ctx.font = "700 21px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText("ファッションハナコ", x + 2, y + 28);
  ctx.strokeStyle = "rgba(169, 148, 130, 0.42)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 42);
  ctx.lineTo(x + Math.min(width - 20, 250), y + 42);
  ctx.stroke();
  ctx.font = "800 25px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText("可愛さラボ", x + 2, y + 72);
  ctx.fillStyle = "#7b6658";
  ctx.font = "italic 13px Georgia, serif";
  ctx.fillText("Kawaisa Lab", x + 214, y + 72);
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
  populateRoomOverseasCities();
  const roomProductUrl = document.querySelector("#roomProductUrl");
  const roomImportButton = document.querySelector("#roomImportAndGenerate");
  const roomClearButton = document.querySelector("#roomClearProductUrl");
  const importAndGenerate = () => importProductForRoom(roomProductUrl, roomImportButton);
  roomImportButton?.addEventListener("click", importAndGenerate);
  roomClearButton?.addEventListener("click", () => {
    roomProductUrl.value = "";
    showRoomImportStatus("URLをクリアしました。次の商品URLを貼り付けられます。");
    roomProductUrl.focus();
  });
  roomProductUrl?.addEventListener("paste", () => window.setTimeout(importAndGenerate, 0));
  roomProductUrl?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    importAndGenerate();
  });
  roomProductSelect.addEventListener("change", () => {
    renderRoomProductPreview();
    roomPostOutput.value = "";
    updateRoomCharacterCount();
    applyRoomImageRecommendations(getSelectedRoomProduct());
    renderRoomImagePhotoPreview();
    markRoomImagePromptStale();
    markRoomCollectionStale();
  });
  roomPostOutput.addEventListener("input", updateRoomCharacterCount);
  document.querySelector("#generateRoomPost").addEventListener("click", generateRoomPost);
  document.querySelector("#copyRoomPost").addEventListener("click", () => copyRoomText(roomPostOutput.value));
  document.querySelector("#copyOpenRoomProduct").addEventListener("click", copyAndOpenRoomProduct);
  document.querySelector("#addRoomQueue").addEventListener("click", addCurrentRoomPostToQueue);
  document.querySelector("#downloadRoomExtension").addEventListener("click", downloadRoomExtension);
  document.querySelectorAll("[data-room-image-mode]").forEach((button) => {
    button.addEventListener("click", () => setRoomImageMode(button.dataset.roomImageMode));
  });
  document.querySelector("#roomImagePose")?.addEventListener("change", markRoomImagePromptStale);
  document.querySelector("#roomImageHairStyle")?.addEventListener("change", markRoomImagePromptStale);
  document.querySelector("#roomImageMood")?.addEventListener("change", markRoomImagePromptStale);
  document.querySelector("#roomImageLocation")?.addEventListener("change", () => {
    updateRoomCityVisibility();
    markRoomImagePromptStale();
  });
  document.querySelector("#roomImageCity")?.addEventListener("change", markRoomImagePromptStale);
  document.querySelector("#generateRoomImagePrompt")?.addEventListener("click", () => generateRoomImagePrompt(false));
  document.querySelector("#copyRoomImagePrompt")?.addEventListener("click", copyRoomImagePrompt);
  document.querySelector("#openRoomSelectedAi")?.addEventListener("click", openGeminiDestination);
  document.querySelector("#openRoomImageGemini")?.addEventListener("click", openRoomImageGemini);
  document.querySelector("#generateRoomCollectionSet")?.addEventListener("click", generateRoomCollectionSet);
  document.querySelector("#copyRoomCollectionTitle")?.addEventListener("click", () => copyText(document.querySelector("#roomCollectionTitle")?.value || ""));
  document.querySelector("#copyRoomCollectionBody")?.addEventListener("click", () => copyText(document.querySelector("#roomCollectionBody")?.value || ""));
  document.querySelector("#copyRoomCollectionCoverPrompt")?.addEventListener("click", () => copyText(document.querySelector("#roomCollectionCoverPrompt")?.value || ""));
  document.querySelector("#copyRoomCollectionAiPrompt")?.addEventListener("click", () => copyText(document.querySelector("#roomCollectionAiPrompt")?.value || ""));
  document.querySelector("#copyRoomCollectionAll")?.addEventListener("click", copyRoomCollectionAll);
  document.querySelector("#openRoomCollectionAi")?.addEventListener("click", openRoomCollectionAi);
  document.querySelector("#roomCollectionTheme")?.addEventListener("change", markRoomCollectionStale);
  document.querySelector("#roomCollectionTone")?.addEventListener("change", markRoomCollectionStale);
  document.querySelector("#roomImagePhotoPreview")?.addEventListener("click", (event) => {
    if (event.target.closest("#roomChoosePhoto")) {
      activateView("brief");
      window.setTimeout(() => document.querySelector("#homePhotoLibraryTitle")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  });
  applyRoomImageRecommendations(getSelectedRoomProduct());
  renderRoomImagePhotoPreview();
}

async function importProductForRoom(urlInput, button) {
  const url = urlInput?.value.trim();
  if (!url) {
    showRoomImportStatus("楽天ROOMまたは楽天市場の商品URLを入力してください", true);
    urlInput?.focus();
    return;
  }
  if (!cloudSync.configured) return showRoomImportStatus("先にクラウド同期を設定してください", true);
  if (!cloudSync.signedIn) return showRoomImportStatus("画面上部の「同期」からログインしてください", true);

  const originalLabel = button?.textContent || "投稿・画像を作る";
  if (button) {
    button.disabled = true;
    button.textContent = "読込中...";
  }
  showRoomImportStatus("商品情報を読み込んでいます...");
  try {
    const imported = normalizeCoordinateImportedProduct(await fetchRakutenProduct(url), url);
    if (isDefiniteTravelProduct(imported, url)) throw new Error("ROOM投稿では楽天市場のファッション商品URLを入力してください");
    let product = state.products.find((item) => item.url === url || item.url === imported.sourceUrl || item.url === imported.resolvedUrl);
    if (product) {
      Object.assign(product, {
        name: imported.name || product.name,
        url,
        image: imported.image || product.image,
        details: { ...(product.details || {}), ...(imported.details || {}) },
        category: imported.category || product.category,
        price: imported.price || product.price,
        hook: imported.hook || product.hook,
      });
    } else {
      product = {
        id: createId(),
        name: imported.name || "楽天の商品",
        url,
        image: imported.image || "",
        details: imported.details || {},
        category: imported.category || "その他",
        price: imported.price || "",
        hook: imported.hook || "毎日のコーデに取り入れやすいアイテム",
      };
      state.products.unshift(product);
    }
    saveState();
    renderProducts();
    renderProductOptions();
    renderRoomProductOptions();
    renderCoordinateOptions();
    renderAngleOptions();
    roomProductSelect.value = product.id;
    renderRoomProductPreview();
    applyRoomImageRecommendations(product);
    renderRoomImagePhotoPreview();
    generateRoomPost();
    await generateRoomImagePrompt(true);
    showRoomImportStatus(`「${product.name}」のROOM文と画像プロンプトを作りました`);
    showToast("URLからROOM投稿と画像プロンプトを作りました");
  } catch (error) {
    showRoomImportStatus(error.message || "商品情報を読み込めませんでした", true);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }
}

function showRoomImportStatus(message, isError = false) {
  const status = document.querySelector("#roomImportStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", isError);
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

function getRoomOverseasCities() {
  return [
    ["パリ", "エッフェル塔"], ["ロンドン", "ビッグ・ベン"], ["ニューヨーク", "ブルックリン橋"],
    ["ローマ", "コロッセオ"], ["ミラノ", "ドゥオーモ"], ["ベネチア", "運河とゴンドラ"],
    ["フィレンツェ", "サンタ・マリア・デル・フィオーレ大聖堂"], ["バルセロナ", "サグラダ・ファミリア"],
    ["マドリード", "マヨール広場"], ["リスボン", "黄色い路面電車"], ["アムステルダム", "運河沿いの街並み"],
    ["コペンハーゲン", "ニューハウン"], ["ウィーン", "シェーンブルン宮殿"], ["プラハ", "カレル橋"],
    ["ブダペスト", "国会議事堂"], ["アテネ", "アクロポリス"], ["イスタンブール", "ガラタ塔とボスポラス海峡"],
    ["ドバイ", "ブルジュ・ハリファ"], ["マラケシュ", "クトゥビーヤ・モスク"], ["シンガポール", "マリーナベイ"],
    ["ソウル", "Nソウルタワー"], ["台北", "台北101"], ["バンコク", "ワット・アルン"],
    ["ハノイ", "ホアンキエム湖"], ["ホーチミン", "中央郵便局"], ["シドニー", "オペラハウス"],
    ["メルボルン", "フリンダース・ストリート駅"], ["ホノルル", "ダイヤモンドヘッド"],
    ["ロサンゼルス", "ハリウッドサインとヤシ並木"], ["サンフランシスコ", "ゴールデンゲートブリッジ"],
    ["ブリュッセル", "グランプラス"], ["ストックホルム", "市庁舎と水辺の街並み"],
    ["オスロ", "オペラハウス"], ["ヘルシンキ", "ヘルシンキ大聖堂"],
    ["チューリッヒ", "リマト川と旧市街"], ["ジュネーブ", "大噴水"],
    ["ミュンヘン", "マリエン広場"], ["ベルリン", "ブランデンブルク門"],
    ["エディンバラ", "エディンバラ城"], ["ダブリン", "ハーフペニー橋"],
    ["ドゥブロヴニク", "城壁とアドリア海"], ["サントリーニ", "青いドームと白い街並み"],
    ["カイロ", "ギザのピラミッド"], ["ケープタウン", "テーブルマウンテン"],
    ["リオデジャネイロ", "コルコバードの丘"], ["ブエノスアイレス", "カミニート"],
    ["メキシコシティ", "ベジャス・アルテス宮殿"], ["バンクーバー", "カナダプレイスと山並み"],
    ["ケベックシティ", "シャトー・フロンテナック"], ["オークランド", "スカイタワー"],
    ["レイキャビク", "ハットルグリムス教会"], ["タリン", "塔の広場と旧市街"],
    ["リガ", "ブラックヘッド会館"], ["ビリニュス", "ゲディミナス塔"],
    ["ワルシャワ", "旧市街広場"], ["クラクフ", "ヴァヴェル城"],
    ["ザルツブルク", "ホーエンザルツブルク城"], ["インスブルック", "黄金の小屋根とアルプス"],
    ["ルツェルン", "カペル橋"], ["ベルン", "時計塔と旧市街"],
    ["リヨン", "フルヴィエール大聖堂"], ["ニース", "プロムナード・デ・ザングレ"],
    ["マルセイユ", "旧港"], ["ボルドー", "ブルス広場と水鏡"],
    ["セビリア", "スペイン広場"], ["グラナダ", "アルハンブラ宮殿"],
    ["バレンシア", "芸術科学都市"], ["ポルト", "ドン・ルイス1世橋"],
    ["ナポリ", "ナポリ湾とヴェスヴィオ山"], ["ボローニャ", "二本の塔"],
    ["スプリト", "ディオクレティアヌス宮殿"], ["リュブリャナ", "三本橋とリュブリャニツァ川"],
    ["ブラチスラバ", "ブラチスラバ城"], ["ソフィア", "アレクサンドル・ネフスキー大聖堂"],
    ["ブカレスト", "ルーマニア国立アテネ音楽堂"], ["ベオグラード", "要塞とドナウ川"],
    ["サラエボ", "ラテン橋"], ["スコピエ", "石橋"],
    ["トビリシ", "ナリカラ要塞と旧市街"], ["エレバン", "カスカードとアララト山"],
    ["ドーハ", "イスラム美術館と海岸線"], ["アブダビ", "シェイク・ザイード・グランド・モスク"],
    ["マスカット", "スルタン・カブース・グランド・モスク"], ["アンマン", "アンマン城塞"],
    ["ムンバイ", "インド門"], ["ジャイプール", "風の宮殿"],
    ["ニューデリー", "インド門と並木道"], ["クアラルンプール", "ペトロナスツインタワー"],
    ["ペナン", "ジョージタウンの街並み"], ["香港", "ビクトリア・ハーバー"],
    ["マカオ", "聖ポール天主堂跡"], ["上海", "外灘と浦東の街並み"],
    ["北京", "故宮の城門"], ["ウブド", "棚田と緑の小道"],
    ["クイーンズタウン", "ワカティプ湖とリマーカブルズ山脈"], ["トロント", "CNタワー"],
    ["モントリオール", "ノートルダム大聖堂と旧市街"], ["シカゴ", "クラウド・ゲートと高層街"],
    ["マイアミ", "サウスビーチのアールデコ街"], ["カルタヘナ", "カラフルな旧市街と時計塔"],
  ];
}

function populateRoomOverseasCities() {
  const select = document.querySelector("#roomImageCity");
  if (!select || select.options.length) return;
  getRoomOverseasCities().forEach(([city, landmark]) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = `${city}（${landmark}）`;
    option.dataset.landmark = landmark;
    select.appendChild(option);
  });
}

function updateRoomCityVisibility() {
  const isOverseas = document.querySelector("#roomImageLocation")?.value === "overseas";
  const field = document.querySelector("#roomImageCityField");
  if (field) field.hidden = !isOverseas;
}

function chooseRandomRoomOverseasCity() {
  return chooseBalancedOverseasCity("room");
}

function chooseBalancedOverseasCity(deckName) {
  const cities = getRoomOverseasCities().map(([city]) => city);
  const storageKey = `hanako-${deckName}-overseas-city-deck`;
  let deckState = { remaining: [], last: "" };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    const validCities = new Set(cities);
    const remaining = saved.total === cities.length && Array.isArray(saved.remaining)
      ? saved.remaining.filter((city, index, items) => validCities.has(city) && items.indexOf(city) === index)
      : [];
    deckState = { remaining, last: validCities.has(saved.last) ? saved.last : "" };
  } catch {
    deckState = { remaining: [], last: "" };
  }
  if (!deckState.remaining.length) {
    deckState.remaining = shuffleCityDeck([...cities]);
    if (deckState.remaining.length > 1 && deckState.remaining[0] === deckState.last) {
      [deckState.remaining[0], deckState.remaining[1]] = [deckState.remaining[1], deckState.remaining[0]];
    }
  }
  const selected = deckState.remaining.shift() || cities[0] || "パリ";
  deckState.last = selected;
  deckState.total = cities.length;
  try {
    localStorage.setItem(storageKey, JSON.stringify(deckState));
  } catch {
    // 保存できない環境でも、その回のランダム選択は続行する。
  }
  return selected;
}

function shuffleCityDeck(cities) {
  for (let index = cities.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [cities[index], cities[randomIndex]] = [cities[randomIndex], cities[index]];
  }
  return cities;
}

function setRoomImageMode(mode) {
  const value = mode === "collection" ? "collection" : "normal";
  const input = document.querySelector("#roomImageType");
  if (input) input.value = value;
  document.querySelectorAll("[data-room-image-mode]").forEach((button) => {
    const selected = button.dataset.roomImageMode === value;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  applyRoomImageRecommendations(getSelectedRoomProduct());
  markRoomImagePromptStale();
}

function applyRoomImageRecommendations(product) {
  if (!product) return;
  const mode = document.querySelector("#roomImageType")?.value || "normal";
  const pose = chooseRandomRoomImagePose(product, mode);
  const hairStyle = chooseRandomRoomImageHairStyle(pose);
  const mood = "ブランド広告のような洗練";
  const poseSelect = document.querySelector("#roomImagePose");
  const hairSelect = document.querySelector("#roomImageHairStyle");
  const moodSelect = document.querySelector("#roomImageMood");
  const locationSelect = document.querySelector("#roomImageLocation");
  const citySelect = document.querySelector("#roomImageCity");
  const location = mode === "collection" ? "my-room" : "overseas";
  const city = mode === "collection"
    ? citySelect?.value || "パリ"
    : chooseRandomRoomOverseasCity();
  if (poseSelect) poseSelect.value = pose;
  if (hairSelect) hairSelect.value = hairStyle;
  if (moodSelect) moodSelect.value = mood;
  if (locationSelect) locationSelect.value = location;
  if (citySelect) citySelect.value = city;
  updateRoomCityVisibility();
  const label = document.querySelector("#roomImageRecommendation");
  const locationLabel = location === "overseas" ? `海外・${city}` : "自分のへや";
  if (label) label.textContent = `${product.category}に合わせて「${pose}」×「${hairStyle}」×「${mood}」×「${locationLabel}」をランダム設定しました。`;
}

function chooseRandomRoomImagePose(product, mode = "normal") {
  const options = getSelectOptions("#roomImagePose");
  const category = product?.category || "";
  const preferred = mode === "collection"
    ? ["ブランド広告のような静かな正面立ち", "片手を軽く上げた雑誌風ポーズ", "横向きでシルエットを見せるポーズ", "ショーウィンドウ前の洗練スナップ"]
    : {
      バッグ: ["バッグを自然に持って振り向く", "商品へ目線を向けた斜め立ち", "カフェ前で片手を添える上品ポーズ"],
      シューズ: ["椅子に浅く座って足元を見せる", "階段や街角で重心をきれいに見せる立ち姿", "歩き出す瞬間の自然なスナップ"],
      アクセサリー: ["小物を胸元で見せる広告風ポーズ", "片手を髪に添えた大人ガーリーポーズ", "商品へ目線を向けた斜め立ち"],
      ワンピース: ["ブランド広告のような静かな正面立ち", "歩き出す瞬間の自然なスナップ", "スカートや裾をふわっと見せるポーズ"],
      スカート: ["スカートや裾をふわっと見せるポーズ", "片足を少し前に出したきれいめ立ち", "階段や街角で重心をきれいに見せる立ち姿"],
      パンツ: ["片足を少し前に出したきれいめ立ち", "横向きでシルエットを見せるポーズ", "歩き出す瞬間の自然なスナップ"],
      アウター: ["商品へ目線を向けた斜め立ち", "ショーウィンドウ前の洗練スナップ", "バッグを自然に持って振り向く"],
      トップス: ["片手を髪に添えた大人ガーリーポーズ", "商品へ目線を向けた斜め立ち", "小物を胸元で見せる広告風ポーズ"],
    }[category] || options;
  const pool = preferred.filter((pose) => options.includes(pose));
  return pickRandomOption(pool.length ? pool : options, "全身が見える自然な立ち姿");
}

function chooseRandomRoomImageHairStyle(pose = "") {
  const options = getSelectOptions("#roomImageHairStyle");
  const poseText = String(pose);
  const avoid = [];
  if (/髪に添え|胸元|小物/.test(poseText)) avoid.push("上品なおだんごヘア", "低めポニーテール");
  if (/振り向く|横向き|歩き出す/.test(poseText)) avoid.push("上品なおだんごヘア");
  if (/椅子|足元|階段/.test(poseText)) avoid.push("ゆるい三つ編みアレンジ");
  const pool = options.filter((hairStyle) => hairStyle
    && hairStyle !== "元写真の髪型を保つ"
    && !avoid.includes(hairStyle));
  return pickRandomOption(pool.length ? pool : options, "元写真の髪型を保つ");
}

function getSelectOptions(selector) {
  const select = document.querySelector(selector);
  return select ? [...select.options].map((option) => option.value || option.textContent).filter(Boolean) : [];
}

function pickRandomOption(options, fallback) {
  return options[Math.floor(Math.random() * options.length)] || fallback;
}

function buildRoomPoseHairNaturalInstruction(pose, hairStyle) {
  const notes = [
    `【ポーズと髪型の自然さ】`,
    `・指定ポーズ「${pose}」と髪型「${hairStyle}」を、実際の人物写真として自然に見える範囲で合わせる`,
    "・髪は重力、肩、首、手の位置に自然に沿わせる。髪だけが宙に浮いたり、服や手に溶け込んだりしない",
    "・手、指、髪、耳、マスクの境界をはっきり分ける。手が髪を貫通したり、指が増えたり、髪飾りのように変形しない",
    "・写真を見た人がAI生成だと気づくような過剰なツヤ、左右非対称すぎる髪量、不自然な毛束、硬いポーズを避ける",
  ];
  if (/髪に添え|胸元|小物/.test(pose)) {
    notes.push("・手を髪に添える場合は、指先を髪の表面へ軽く置くだけにし、髪を握り込ませない。まとめ髪なら顔まわりの後れ毛に軽く触れる程度にする");
  }
  if (/振り向く|横向き|歩き出す/.test(pose)) {
    notes.push("・動きのあるポーズでは、髪の流れを体の向きと風に合わせる。後頭部や肩の髪が急に切れたり、左右で別の髪型にならないようにする");
  }
  if (/椅子|足元|階段/.test(pose)) {
    notes.push("・座る、足元を見せる、階段のポーズでは、髪が顔と首に自然に落ちるようにし、足元や商品を隠す長い毛束を作らない");
  }
  if (/おだんご|ポニーテール|三つ編み|まとめ髪/.test(hairStyle)) {
    notes.push("・まとめ髪は後頭部の位置、結び目、後れ毛を自然にし、頭から浮いた飾りのように見せない");
  }
  return notes.join("\n");
}

function renderRoomImagePhotoPreview() {
  const target = document.querySelector("#roomImagePhotoPreview");
  if (!target) return;
  const photo = getSelectedCoordinatePhoto();
  if (!photo) {
    target.innerHTML = `<div><strong>本人写真が未選択です</strong><small>ホーム画面で全身写真を保存して選んでください。</small></div><button id="roomChoosePhoto" type="button">写真を選ぶ</button>`;
    return;
  }
  const src = getCoordinatePhotoDisplaySrc(photo);
  target.innerHTML = `${src ? `<img src="${escapeHtml(src)}" alt="今回使う本人写真">` : `<div class="coord-photo-thumb-empty">PHOTO</div>`}<div><strong>コーデと共通の本人写真</strong><small>${escapeHtml(photo.name || "選択中の写真")}を使います</small></div><button id="roomChoosePhoto" type="button">変更</button>`;
}

function markRoomImagePromptStale() {
  roomReferenceBoardDataUrl = "";
  roomReferenceBoardHasPerson = false;
  const status = document.querySelector("#roomImagePromptStatus");
  if (status) status.textContent = "設定を変更しました";
}

async function generateRoomImagePrompt(quiet = false) {
  const product = getSelectedRoomProduct();
  if (!product) return showToast("先に商品を選んでください");
  const warnings = [];
  let personPhotoUrl = "";
  let personPhotoSource = "";
  let boardReady = false;
  try {
    personPhotoUrl = await ensureSelectedCoordinatePhotoUrl();
    if (!personPhotoUrl) warnings.push("本人写真が未選択");
    personPhotoSource = await loadCoordinatePhotoPreview(getSelectedCoordinatePhoto());
  } catch {
    warnings.push("本人写真の更新待ち");
  }
  const mode = document.querySelector("#roomImageType")?.value || "normal";
  try {
    await drawRoomReferenceBoard(product, mode, personPhotoSource || personPhotoUrl);
    boardReady = Boolean(roomReferenceBoardDataUrl);
    if (getSelectedCoordinatePhoto() && !roomReferenceBoardHasPerson) warnings.push("本人写真をボードへ反映できませんでした");
  } catch {
    roomReferenceBoardDataUrl = "";
    roomReferenceBoardHasPerson = false;
    warnings.push("参照画像ボードを再作成してください");
  }
  if (!product.image) warnings.push("商品画像が未登録");
  const prompt = buildCurrentRoomImagePrompt(product, mode, personPhotoUrl);
  const output = document.querySelector("#roomImagePrompt");
  if (output) output.value = prompt;
  const status = document.querySelector("#roomImagePromptStatus");
  const baseStatus = mode === "collection" ? "コレクション表紙用" : "通常投稿用";
  if (status) status.textContent = warnings.length ? `${baseStatus}・画像要確認` : baseStatus;
  renderRoomImagePhotoPreview();
  if (!quiet) showToast(boardReady ? "ROOM画像プロンプトを作りました" : "プロンプトを作りました。参照画像を確認してください");
  return prompt;
}

function buildCurrentRoomImagePrompt(product = getSelectedRoomProduct(), mode = document.querySelector("#roomImageType")?.value || "normal", personPhotoUrl = "") {
  if (!product) return "";
  return adaptPromptToSelectedAi(buildRoomImagePrompt({
    product,
    personPhotoUrl,
    mode,
    pose: document.querySelector("#roomImagePose")?.value || "全身が見える自然な立ち姿",
    hairStyle: document.querySelector("#roomImageHairStyle")?.value || "元写真の髪型を保つ",
    mood: document.querySelector("#roomImageMood")?.value || "ブランド広告のような洗練",
    location: document.querySelector("#roomImageLocation")?.value || (mode === "collection" ? "my-room" : "overseas"),
    city: document.querySelector("#roomImageCity")?.value || "パリ",
  }));
}

function buildRoomImagePrompt({ product, personPhotoUrl, mode, pose, hairStyle, mood, location, city }) {
  const details = product.details || {};
  const brand = details.brand || "HANAKO SELECT";
  const oneLiner = buildRoomImageOneLiner(product);
  const collectionCopy = buildRoomCollectionCoverCopy(product, brand, oneLiner);
  const sameBrandProducts = state.products
    .filter((item) => item.id !== product.id && item.image && details.brand && item.details?.brand === details.brand)
    .slice(0, 4);
  const collectionItems = [product, ...sameBrandProducts]
    .map((item, index) => `${index + 1}. ${item.name} / ${item.category}\n   商品画像URL: ${item.image}\n   商品ページURL: ${item.url || "なし"}`)
    .join("\n");
  const overseasCities = getRoomOverseasCities();
  const cityOption = overseasCities.find(([name]) => name === city) || overseasCities[0];
  const poseHairInstruction = buildRoomPoseHairNaturalInstruction(pose, hairStyle);
  const signatureLogoInstruction = mode !== "collection"
    ? `【透明ミニロゴ画像・通常投稿だけ必須】
・参照画像ボードの「SIGNATURE LOGO」欄にあるロゴ画像を、完成画像の左上へとても小さく上品に入れる
・ロゴを新しくデザインし直さない。SIGNATURE LOGO欄を透明背景の画像素材として扱い、その見た目、配色、文字をできるだけそのまま小さく写す
・ロゴは余白なし、背景なし、検索窓なし、虫眼鏡なし。「検索」の文字は絶対に入れない
・文字は「ファッションハナコ」「可愛さラボ」を中心に、濃すぎないモカブラウン、こげ茶、ミルクベージュでさりげなく読める濃さにする
・画像幅の8〜12%くらいの小さめサイズで、透け感のある署名ロゴとして左上へ自然に置く
・派手なハート、大きな装飾、太い縁取り、濃いピンク、強い影、巨大なロゴ、白い囲み、ポップすぎる配色は禁止
・商品、人物、顔、手書き一言、海外都市の場所表記に重ねない。主役にならない
・文字化け、誤字、似た文字、別名は禁止。正確に書けない場合は、SIGNATURE LOGO欄の見た目をそのまま小さく写す
・コレクション表紙ではないので、この通常投稿画像には透明ミニロゴを入れる`
    : `【署名ロゴ】
・コレクション表紙には「ファッションハナコ 可愛さラボ」の署名ロゴを入れない`;
  const locationStampInstruction = location === "overseas" && mode !== "collection"
    ? `【右下ロケーション表記】
・画像の右下へ、場所の情報をさりげなく小さく入れる
・表記は「${cityOption[0]} mood」または「${cityOption[0]} / ${cityOption[1]}」のどちらか1つだけ
・濃いブラウンまたはくすみピンクの小さな文字で、ブランド広告の撮影地クレジットのように上品にする
・商品、人物、顔、手書き一言、表紙コピーに重ねない。読めるけれど主役にならないサイズにする
・場所表記以外の住所、国名の長文、観光案内、地図風の文字は入れない`
    : "";
  const outfitStylingInstruction = mode !== "collection"
    ? `【通常投稿の全身着せ替え・重要】
・選んだ商品を主役として必ず身につける。色、形、丈、柄、素材感、ロゴ、特徴はPRODUCT欄から変えない
・選んだ商品以外に本人が身につけている服、靴、バッグ、アクセサリーも、元写真のまま残さず、主役商品に合う全身コーデへ自然に着せ替える
・主役商品がスカートなら、トップスはできれば同じブランド「${brand}」または同ブランド風の色・素材・世界観に合うものを合わせる
・主役商品がトップスなら、ボトム、靴、バッグを同じブランド感または同系統のきれいめアイテムで統一する
・主役商品がバッグや靴やアクセサリーなら、服全体をその小物が引き立つ色数少なめのコーデに整える
・選んだ商品以外の補助アイテムは、実在商品だと断定できるロゴ、商品名、価格、ランキング、ブランド名を新しく入れない。あくまで統一感を出すための自然なスタイリングとして描く
・補助アイテムは主役商品より目立たせない。主役商品の可愛さと素材感が一番伝わる全身バランスにする
・本人の顔、髪色、体型、マスクはPERSON欄を保つが、服装全体は主役商品に合わせて上品に着せ替える
・全身で見た時に、色数は3色以内を目安にし、ブランド広告のように洗練された統一感を出す`
    : `【コレクション表紙の商品ルール】
・コレクション表紙では、下の使用できる商品一覧を中心に見せる。商品を水増しせず、ブランドの空気感を表紙デザインで表現する`;
  const locationInstruction = location === "overseas"
    ? `【場所・海外都市】
・舞台は${cityOption[0]}。背景に「${cityOption[1]}」を、その都市だと自然に分かる大きさで少しだけ入れる
・ランドマークは背景全体の15〜25%を目安にし、人物と商品より目立たせない。観光ポスターのように巨大化しない
・${cityOption[0]}の実際の街並み、建築、光、季節感と矛盾しない構図にする。別都市の名所を混ぜない
・人物は旅行中に自然に撮った上品なファッションスナップとして見せ、合成写真のような不自然さを避ける`
    : location === "my-room"
      ? `【場所・自分のへや】
・舞台は本人が暮らすような、明るく清潔でかわいい自分のへや
・白を基調に、木の家具、小さな鏡、花や本を控えめに置き、生活感は整える
・高級ホテルや巨大な邸宅にはせず、親しみやすく真似したくなる部屋にする`
      : location === "stylish-cafe"
        ? `【場所・おしゃれなカフェ】
・舞台は自然光の入る上品なカフェ。木、白、ガラスを使った落ち着く内装にする
・店名、企業ロゴ、メニュー価格、読めない看板文字は入れない`
        : `【場所・おしゃれな屋外】
・舞台は緑と洗練された建物が調和する、おしゃれな屋外の小道やテラス
・場所を特定する看板や海外ランドマークは入れず、日常のお出かけスナップとして自然にする`;
  const formatInstruction = mode === "collection"
    ? `【コレクション表紙】
・正方形1:1、1536×1536px以上。ブランドの空気感を生かした上質なファッション雑誌の表紙にする
・本人を大胆で自然な雑誌ポーズで見せ、商品はURLで確認できた同一商品だけを使う
・表紙の主テキストは次の6つだけ。一字一句固定し、言い換えや追加をしない
  1. 「ファッションハナコ」
  2. 「${collectionCopy.collectionTitle}」
  3. 「${oneLiner}」
  4. 「${collectionCopy.moodLine}」
  5. 「${collectionCopy.editLine}」
  6. 「${collectionCopy.categoryLabel}」
・2の「${collectionCopy.collectionTitle}」を表紙で一番大きく、最も目立つ主役見出しにする
・1の「ファッションハナコ」は小さな雑誌名・署名のように扱い、コレクション名より絶対に大きくしない
・3を主役コピー、4と5を小さな編集コピー、6を端正なカテゴリラベルとして強弱をつける
・${collectionCopy.designDirection}
・上記のブランド/商品イメージ判定を最優先し、ブランドの空気感と合わない配色、フォント、装飾、背景にしない
・たとえばミニマル系なら余白と直線、ロマンティック系なら低彩度ピンクと曲線、ラグジュアリー系なら光沢と余白、カジュアル系ならZINE風コラージュ、ナチュラル系なら紙質感と自然光を使う
・毎回、既視感のない新しい表紙にする。前回と同じテンプレート、同じ文字位置、同じ飾り、同じ余白比率、同じ写真配置にしない
・今回は必ず「大胆なデザインの見せ場」を1つ作る。例: 超大きなタイトルの一部を画面端で切る、商品写真を斜めに大きく置く、余白を片側へ極端に寄せる、縦書きタイトルを画面いっぱいに走らせる、商品を編集部のスクラップのように重ねる
・ただし大胆さは雑にしない。高級ファッション誌、海外ブランド広告、セレクトショップのルックブック、ファッションZINEのどれかを本気で編集したように、完成度の高い文字組みにする
・商品とブランドの雰囲気に合わせ、非対称レイアウト、縦書きアクセント、斜めの小見出し、細い罫線、余白多め、商品コラージュ、全面タイポグラフィ、切り抜き写真、紙面の重なりから自然に選んで変化を出す
・平凡な中央寄せ、同じ大きさの文字をただ並べる、淡い背景に小さな商品を置くだけ、テンプレート風のカード並べは禁止
・1枚の中で「大・中・小」の文字サイズ差をはっきり作り、コレクション名は遠目でも読めるくらい強く見せる
・文字は商品や顔へ重ねず、外周8%以上の安全余白へ置く。文字を均等に並べず、雑誌らしいリズムと余白を作る
・日本語は読みやすい明朝体または端正なゴシック体、英字は細身のセリフ体を基本にする
・売上数、レビュー数、価格、割引、効能などの数字は入れない
・コレクション表紙には、海外都市名、ランドマーク名、場所表記、撮影地クレジットを入れない
・同ブランド候補が1点だけなら商品を水増しせず、その1点を主役にした表紙へ仕上げる`
    : `【通常投稿画像】
・正方形1:1、1536×1536px以上。明るく自然で、商品と着用イメージが一目で分かる1枚にする
・本人が商品を自然に身につけ、商品の色、形、丈、柄、素材感をURL画像と一致させる
・画像内の文字は、読みやすい場所へ「${oneLiner}」を一字一句そのまま1回だけ入れる。言い換え、追記、造語は禁止
・一言と海外都市の小さな場所表記以外の見出し、価格、説明、吹き出し、ランキング、数字、ロゴを追加しない
・一言は、黒または濃いブラウンの手書きペンで丁寧に書いたような、自然でかわいい日本語にする
・手書き文字は崩しすぎず、一文字ずつはっきり読める太さにする。文字を薄く、細く、かすれさせない
・文字の近くに、細い手書き下線、小さなきらめき、短い曲線を1〜2個だけ添えてよい。ただし別の文字や吹き出しは足さない
・ファッションノートへ書き込んだような上品な手書き感にし、子どもっぽい丸文字や派手な縁取り文字にはしない
・一言は商品や顔に重ねず、背景との明暗差が十分にある余白へ配置する`;
  return `画像を生成してください。楽天ROOM投稿用ですが、画像内に「楽天ROOM」「ROOM」の文字は入れません。添付した参照画像ボード1枚を使い、完成画像を1枚だけ作ってください。

【添付した参照画像ボード・最優先】
・PERSON欄は本人、PRODUCT欄は使用できる商品の基準画像
・本人はPERSON欄と同じ顔、髪色、体型、肌の雰囲気を保ち、別人にしない
・髪型は下の「髪型」設定に自然に合わせる。ただし顔、髪色、本人らしい雰囲気は変えない
・髪型が「元写真の髪型を保つ」の場合は、長さ、前髪、分け目、髪の流れを変えない
・ポーズと髪型の組み合わせが不自然に見える場合は、顔と髪色を保ったまま、髪の流れ、手の位置、首の角度だけを自然に調整する
・AIで作ったような不自然な髪の固まり、浮いた毛束、手と髪の融合、顔に食い込む髪、左右で長さが破綻した髪を出さない
・PERSON欄でマスクを着けている場合は、色、形、柄、ひもを変えず必ず同じマスクを残す
・選んだ主役商品はPRODUCT欄の色、輪郭、丈、袖、襟、柄、装飾、バッグの持ち手、靴の形を変えない
・商品ページURLや画像URLへアクセスしない。添付した参照画像ボードだけを画像の基準にする
・参照画像ボードが届いていない場合は「参照画像を1枚添付してください」とだけ返す

【今回の設定】
商品名: ${product.name}
カテゴリ: ${product.category}
ブランド: ${brand}
色: ${details.color || "商品画像から確認"}
素材: ${details.material || "商品画像から確認"}
ポーズ: ${pose}
髪型: ${hairStyle}
雰囲気: ${mood}

${poseHairInstruction}

${locationInstruction}

${locationStampInstruction}

${signatureLogoInstruction}

${outfitStylingInstruction}

${formatInstruction}

【使用できる商品】
${collectionItems}

【品質確認】
・本人、商品、マスクが各URLと一致している
・手、指、足、服の重なりが自然
・日本語に誤字、造語、文字切れがない
・画像内の文字は薄くせず、背景と十分な明暗差がある濃い色で読みやすい
・「STYLE EDIT」の文字を画像内のどこにも入れていない
・未確認の人気、効果、使用体験、価格、数字を作っていない
・外周の白い安全余白や額縁は不要。写真は端まで広げてよい
・ただし顔、主役商品、手書き文字、左上の検索窓ロゴは切らず、読める位置に置く

条件を満たす完成画像だけを返し、説明文や別案は出さないでください。`;
}

async function drawRoomReferenceBoard(product, mode, selectedPersonSource = "") {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fffafb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2f2529";
  ctx.font = "700 34px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText("AI REFERENCE BOARD", 56, 62);
  ctx.fillStyle = "#9b4665";
  ctx.font = "700 22px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText(mode === "collection" ? "COLLECTION COVER" : "ROOM POST", 56, 98);

  const photo = getSelectedCoordinatePhoto();
  const personSource = photo
    ? selectedPersonSource || coordinatePhotoPreviewCache.get(photo.id) || photo.signedUrl || ""
    : "";
  const personImage = personSource ? await loadImage(personSource).catch(() => null) : null;
  roomReferenceBoardHasPerson = Boolean(personImage);
  ctx.fillStyle = "#fff";
  roundRect(ctx, 48, 130, 470, 790, 18);
  ctx.fill();
  if (personImage) drawCoverImage(ctx, personImage, 66, 184, 434, 708, 12);
  else drawPlaceholder(ctx, "PERSON", 66, 184, 434, 708);
  ctx.fillStyle = "#a43d64";
  ctx.font = "700 20px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText("PERSON / 本人の顔・髪・体型・マスク", 66, 166);

  const brand = product.details?.brand || "";
  const products = mode === "collection"
    ? [product, ...state.products.filter((item) => item.id !== product.id && item.image && brand && item.details?.brand === brand).slice(0, 3)]
    : [product];
  const columns = products.length === 1 ? 1 : 2;
  const cardWidth = products.length === 1 ? 760 : 372;
  const cardHeight = products.length === 1 ? 720 : 350;
  for (let index = 0; index < products.length; index += 1) {
    const item = products[index];
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = 566 + col * 388;
    const y = 130 + row * 382;
    ctx.fillStyle = "#fff";
    roundRect(ctx, x, y, cardWidth, cardHeight, 18);
    ctx.fill();
    const productImage = await loadCoordinateProductImage(item.image);
    const imageHeight = cardHeight - 92;
    if (productImage) drawCoverImage(ctx, productImage, x + 14, y + 42, cardWidth - 28, imageHeight - 12, 10);
    else drawPlaceholder(ctx, item.category, x + 14, y + 42, cardWidth - 28, imageHeight - 12);
    ctx.fillStyle = "#a43d64";
    ctx.font = "700 18px Yu Gothic UI, Meiryo, sans-serif";
    ctx.fillText(`PRODUCT ${index + 1} / ${item.category}`, x + 16, y + 29);
    ctx.fillStyle = "#392f33";
    ctx.font = "700 17px Yu Gothic UI, Meiryo, sans-serif";
    wrapCanvasText(ctx, trimText(item.name, 34), x + 16, y + cardHeight - 28, cardWidth - 32, 22, 2);
  }
  if (mode !== "collection") {
    await drawRoomSignatureLogoReference(ctx);
  }
  ctx.fillStyle = "#6d5b62";
  ctx.font = "700 18px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText(mode === "collection"
    ? "この1枚に写る本人と商品だけを使う / 想像で別商品を足さない"
    : "主役商品は固定 / 他の服や小物は統一感ある全身コーデへ着せ替えOK", 566, 952);
  roomReferenceBoardDataUrl = canvas.toDataURL("image/jpeg", 0.92);
  return roomReferenceBoardDataUrl;
}

async function drawRoomSignatureLogoReference(ctx) {
  const logoX = 566;
  const logoY = 850;
  const logoWidth = 250;
  const logoHeight = 58;
  ctx.save();
  ctx.fillStyle = "#6b584b";
  ctx.font = "700 16px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText("SIGNATURE LOGO / 透明・小さく左上へ", logoX, logoY - 10);
  const logo = await loadImage(ROOM_SIGNATURE_LOGO_PATH).catch(() => null);
  if (logo) {
    drawContainImage(ctx, logo, logoX, logoY, logoWidth, logoHeight);
  } else {
    drawFashionHanakoLogoText(ctx, logoX, logoY + 2, logoWidth, logoHeight);
  }
  ctx.restore();
}

function buildRoomImageOneLiner(product) {
  const text = `${product.name || ""} ${product.hook || ""} ${product.details?.material || ""} ${product.details?.color || ""}`;
  const categoryAliases = {
    ニット: "トップス", カーディガン: "アウター", オールインワン: "ワンピース", セットアップ: "ワンピース",
    デニム: "パンツ", "スーツ・フォーマル": "フォーマル", ブライダル: "フォーマル", マタニティ: "ワンピース",
    ヘアアクセサリー: "アクセサリー", 腕時計: "アクセサリー", "ストール・マフラー": "ファッション小物",
    ベルト: "ファッション小物", サングラス: "ファッション小物", 財布: "ファッション小物", 傘: "ファッション小物",
    レッグウェア: "ファッション小物", レインウェア: "アウター", スポーツウェア: "ルームウェア",
  };
  const category = categoryAliases[product.category] || product.category;
  const byCategory = {
    トップス: ["顔まわりが、ふわっと華やぐ。", "この一枚で、甘さが整う。", "袖の表情まで、ちゃんとかわいい。", "上半身に、ちょうどいい華やぎ。", "いつものボトムが、少し新鮮。", "着回せるのに、ちゃんと主役。", "鏡を見るたび、顔色まで明るい。", "甘さを足しても、きれいに着られる。", "デニムの日まで、ちゃんと可愛い。", "一枚で、朝の迷いを減らしてくれる。", "首元の抜け感まで、計算済み。", "シンプルなのに、印象はちゃんと残る。"],
    ワンピース: ["一枚で、今日のかわいいが決まる。", "揺れるたび、気分まで軽やか。", "迷う朝こそ、頼れる一枚。", "着るだけで、支度がきれいに整う。", "小物を替えて、何度でも新鮮。", "頑張りすぎず、ちゃんと華やか。", "予定がある日に、迷わず手が伸びる。", "一枚なのに、きちんと絵になる。", "甘さと大人っぽさのちょうど真ん中。", "写真の日にも、歩く日にも頼れる。", "さらっと着て、ちゃんと褒められそう。", "着替え時間まで、かわいく短縮。"],
    スカート: ["揺れ感ひとつで、いつもの服が新鮮。", "甘さは、きれいな丈感で楽しむ。", "歩くたび、かわいさが動き出す。", "トップスを選ばない、頼れる華やぎ。", "腰まわりはすっきり、気分は軽く。", "座っても歩いても、きれいが続く。", "ふわっと感で、気分まで上向き。", "主役にしても、甘すぎない。", "足もとを替えて、印象まで変わる。", "揺れるラインが、写真でもかわいい。", "淡色トップスと合わせたくなる。", "一枚で、いつもの服に物語が出る。"],
    パンツ: ["きれいめも、動きやすさも。", "甘いトップスを、大人っぽく。", "すっきり見えて、気負わない。", "脚のラインを、きれいに味方につける。", "楽なのに、きちんと見える。", "朝から夜まで、頼れる一本。", "通勤にも休日にも、ちゃんと使える。", "甘め服の日の、きれいな引き算。", "歩く予定の日こそ、可愛く頼れる。", "腰まわりが整うと、全身が変わる。", "きちんと見えして、気分は軽い。", "スニーカーでも、品よくまとまる。"],
    バッグ: ["持つだけで、コーデがきゅっと整う。", "小さなバッグが、今日の主役。", "甘めコーデの、きれいな締め役。", "必要なものと、かわいいをひとまとめ。", "服がシンプルな日ほど、出番です。", "持ち方ひとつで、印象を更新。", "色をつなぐだけで、全身がまとまる。", "小物で可愛いを足すなら、これ。", "荷物の日も、気分は軽く。", "コーデの最後に、ちゃんと効く。", "主張しすぎず、写真では映える。", "いつもの服が、少しよそ行き顔に。"],
    シューズ: ["足もとから、かわいさを更新。", "歩けるかわいいが、いちばん頼れる。", "最後に選ぶ靴で、全部が整う。", "いつもの服を、足もとで新しく。", "きれい見えと歩きやすさを両立。", "玄関で迷わない、頼れる一足。", "足もとが決まると、一日が軽い。", "甘め服を、ちゃんと大人に寄せる。", "歩く予定の日も、可愛さは置いていかない。", "全身の重心まで、きれいに整う。", "写真の下半分まで、ちゃんと可愛い。", "履くだけで、コーデが締まる。"],
    アクセサリー: ["小さなきらめきが、顔まわりの味方。", "ひとつ足すだけで、ちゃんと華やぐ。", "主役服を邪魔しない、上品な光。", "さりげないのに、印象に残る。", "シンプル服に、ひとさじの可愛さ。", "今日の気分を、小物で仕上げる。", "顔まわりに、ちいさな自信を。", "写真で分かる、上品なきらめき。", "甘め服にも、きれいめ服にも合う。", "最後のひと足しが、いちばん効く。", "派手すぎないのに、ちゃんと華やか。", "近くで見た時まで、ぬかりなく。"],
    アウター: ["羽織るだけで、全身がすっと整う。", "かわいさを残して、きちんと見せる。", "脱いだあとまで、ちゃんとかわいい。", "気温差の日も、おしゃれは軽やか。", "重ねても、すっきり見える。", "外に出たくなる、頼れる羽織り。", "一枚足すだけで、雰囲気が変わる。", "朝晩の肌寒さまで、かわいく対応。", "甘め服を、大人っぽくまとめてくれる。", "後ろ姿まで、ちゃんと整う。", "季節の変わり目に、まず頼りたい。", "羽織った瞬間、きちんと感が出る。"],
    フォーマル: ["特別な日に、上品な華やぎを。", "写真に残る日こそ、きれいに。", "きちんと感に、私らしい可愛さを。", "大切な一日を、服から整える。", "華やかだけど、品よく。", "迷わず選べる、お呼ばれの味方。"],
    ルームウェア: ["おうち時間にも、かわいいを。", "くつろぐ日こそ、気分よく。", "楽ちんと可愛いを、どちらも。", "眠る前まで、私らしく。", "おうちの自分にも、ときめきを。", "ゆるっと着て、きれいに見える。"],
    "水着・水際": ["水辺でも、私らしいかわいさを。", "隠したいところは、可愛くカバー。", "夏の一枚を、もっとお気に入りに。", "リゾート気分を、上品にまとう。", "水際コーデも、甘すぎずきれいに。", "写真に残したい、夏の主役。"],
    浴衣: ["夏の夜に、やさしい華やぎを。", "後ろ姿まで、ちゃんとかわいい。", "帯を結んで、夏の気分が完成。", "涼やかに、大人かわいく。", "花火の日を、もっと特別に。", "和の色で、いつもと違う私へ。"],
    インナー: ["見えないところから、きれいを支える。", "透け対策も、心地よさも。", "毎日の服を、内側から整える。", "薄手の服にも、頼れる一枚。", "肌になじんで、コーデを邪魔しない。", "着る日の安心を、ひとつ足す。"],
    ランジェリー: ["心地よさから、きれいを整える。", "服のシルエットを、内側から味方に。", "毎日に寄り添う、やさしい一枚。", "自分のために選ぶ、かわいい。", "響きにくく、気分は華やか。", "無理せず整う、私の定番。"],
    帽子: ["かぶるだけで、今日の顔が決まる。", "日差し対策も、かわいく。", "いつもの服に、こなれ感を。", "顔まわりへ、軽やかなアクセント。", "髪型に迷う日の、頼れる味方。", "お出かけ気分を、ひとつ足す。"],
    ファッション小物: ["小物ひとつで、いつもの服が変わる。", "実用的なのに、ちゃんとかわいい。", "さりげなく、今日の気分を足す。", "毎日使うものこそ、お気に入りを。", "コーデの最後に、きれいな答えを。", "持つたび、少しうれしくなる。"],
  };
  const options = [...(byCategory[category] || ["今日のかわいいに、ちょうどいい。", "いつもの私を、少しだけ更新。", "迷った日に、頼れるかわいさ。", "着るたび、好きが増えていく。"] )];
  if (/サテン|光沢/.test(text)) options.push("この光沢感が、ちょうど上品。", "光を味方に、さりげなく華やぐ。");
  if (/シアー|透け/.test(text)) options.push("透け感ひとつで、ぐっと軽やか。", "重ねるだけで、季節感をひとさじ。");
  if (/リボン|フリル|レース/.test(text)) options.push("甘いディテールは、品よく楽しむ。", "可愛いは、細部にちゃんと宿る。");
  if (/撥水|防水|雨/.test(text)) options.push("雨の日だって、かわいく軽やか。", "天気を気にせず、おしゃれを楽しむ。");
  if (/洗える|ウォッシャブル/.test(text)) options.push("たくさん着たいから、お手入れも気軽に。", "きれいを保ちやすい、頼れる一枚。");
  if (/通勤|オフィス|仕事/.test(text)) options.push("通勤の日にも、私らしい可愛さを。", "きちんと見えて、堅すぎない。");
  if (/旅行|トラベル|リゾート/.test(text)) options.push("旅先でも、写真に残したい可愛さ。", "荷物は軽く、気分は華やかに。");
  if (/クーポン|OFF|オフ|セール|値下げ|限定|SALE/i.test(text)) options.push("お得なうちに、可愛いを確保。", "見つけた今が、いちばん可愛いタイミング。", "この可愛さ、タイミングまで味方。", "気になるなら、なくなる前に見たい。");
  if (/綿|コットン|リネン|麻/.test(text)) options.push("肌ざわりまで、やさしく可愛い。", "毎日着たくなる、やさしい素材感。", "ナチュラルなのに、ちゃんときれい。");
  if (/ニット|リブ|もちもち|ふわふわ/.test(text)) options.push("ふわっと感まで、ちゃんと可愛い。", "やわらかさで、コーデがほどける。", "触れたくなる素材感が主役。");
  if (/パール|ビジュー|ラメ|キラ|ゴールド|シルバー/.test(text)) options.push("小さなきらめきで、気分が上がる。", "派手すぎない光が、上品に効く。", "きらっと感で、写真まで可愛い。");
  if (/白|ホワイト|アイボリー|オフホワイト|ベージュ|エクリュ/.test(text)) options.push("淡い色なのに、ぼやけず可愛い。", "白っぽコーデに、やさしくなじむ。", "明るい色で、表情までふわっと。");
  if (/黒|ブラック|ネイビー|チャコール|グレー/.test(text)) options.push("甘め服を、きれいに締める。", "濃色ひとつで、大人っぽく整う。", "可愛いだけじゃない、きちんと感。");
  if (/ピンク|ローズ|ラベンダー|ミント|ブルー|グリーン|イエロー/.test(text)) options.push("差し色ひとつで、気分が変わる。", "色で遊んでも、ちゃんと上品。", "いつもの服に、可愛い変化を。");
  if (/レビュー|高評価|ランキング|人気/.test(text)) options.push("気になる理由が、ちゃんとある。", "見た目だけじゃなく、選ばれる理由も。", "可愛いだけで終わらない安心感。");
  const universal = [
    "今日は、この可愛さに頼りたい。",
    "迷った日ほど、これが助けてくれる。",
    "大人っぽくて、ちゃんと甘い。",
    "可愛いのに、やりすぎない。",
    "写真に残したくなる、ちょうどよさ。",
    "手持ち服まで、少し新鮮に見える。",
    "派手じゃないのに、目に留まる。",
    "さりげなく盛れるって、こういうこと。",
    "きれいめの日の、頼れる可愛さ。",
    "明日の私が、また着たくなる。",
    "一目で好き、着てもっと好き。",
    "甘さも品も、ちゃんと両方。",
  ];
  options.push(...universal);
  const uniqueOptions = [...new Set(options.map((item) => item.trim()))];
  roomGenerationVariant += 1;
  return uniqueOptions[hashText(`${product.id || product.name} ${roomGenerationVariant}`) % uniqueOptions.length];
}

function buildRoomCollectionCoverCopy(product, brand, oneLiner) {
  const text = `${product.name || ""} ${product.hook || ""} ${product.category || ""} ${product.details?.material || ""} ${product.details?.color || ""}`;
  const brandDesign = buildRoomCollectionBrandDesign(product, brand, text);
  const themes = /黒|ブラック|ネイビー|モノトーン|シルバー/.test(text)
    ? [
      ["凛とした甘さを、ひとさじ。", "色数をしぼって、品よく。", "白・黒・余白を生かしたモード誌の文字組み"],
      ["静かな華やかさが、今の気分。", "シンプルな日ほど、形を味方に。", "黒と白を基調に、細い罫線と端正なセリフ体で構成"],
      ["可愛いを、少し辛口に。", "余裕は、引き算で作る。", "左寄せの大きなコレクション名、右側に商品写真、細い黒罫線でモードな表紙にする"],
      ["甘さを締める、黒の魔法。", "品よく目立つ、今日の主役。", "上下に大胆な余白を取り、中央に商品を一点強く置く高級ブランド広告風にする"],
      ["黒で整う、可愛いの輪郭。", "甘さを削って、印象を残す。", "巨大な黒文字を画面端まで走らせ、商品写真を斜めに重ねるモード広告風にする"],
      ["静かな強さを、クローゼットへ。", "余白まで、凛とさせる。", "白地に極太タイトルを縦横ミックスし、商品だけをスポットライトのように浮かせる"],
    ]
    : /ピンク|リボン|フリル|レース|ガーリー|花柄/.test(text)
      ? [
        ["やさしい甘さを、大人っぽく。", "ときめきは、細部に宿る。", "淡いピンク、白、細いリボンモチーフで上品なロマンティック誌にする"],
        ["可愛いを、きれいに着こなす。", "余白まで、私らしく。", "くすみピンクとアイボリーを使い、小さな花やリボンを控えめに添える"],
        ["今日の私に、少しの華やぎ。", "甘さは軽く、印象は上品に。", "ミルキーカラーと繊細な明朝体で、透明感のある表紙にする"],
        ["甘いだけじゃ、終わらない。", "大人っぽさを、ひとさじ。", "コレクション名を斜め気味に大きく置き、小さな手書き風リボン線を添えるZINE風にする"],
        ["可愛い余韻を、まとって。", "ふんわり見えて、ちゃんと上品。", "商品写真を丸みのある切り抜きで重ね、縦書きの小コピーを一点だけ添える"],
        ["甘さを主役に、紙面を踊らせる。", "ときめきは、大きく見せていい。", "コレクション名を大きなリボン帯のように横断させ、商品をコラージュで立体的に重ねる"],
        ["大人ガーリーを、表紙級に。", "可愛いの温度を、上品に上げる。", "淡い背景に大きな明朝タイトルを重ね、余白の一角だけ花びらのように大胆に使う"],
      ]
      : /サテン|光沢|パール|ゴールド|ジュエル/.test(text)
        ? [
          ["光をまとって、品よく華やぐ。", "特別感は、さりげなく。", "パールホワイトと淡いゴールド、細いセリフ体でラグジュアリーにする"],
          ["きらめきは、余白と楽しむ。", "上質さを、ひと目で。", "光沢のある白とシャンパンカラーで、ハイファッション誌のように構成"],
          ["光が似合う、きれいめ服。", "主張は静かに、印象は強く。", "中央に大きな商品、周囲に小さな光の余白を作るジュエリー広告風にする"],
          ["上品なきらめきだけ、残す。", "写真で伝わる、特別感。", "コレクション名を極太の明朝体で大きく置き、英字は細く小さく添える"],
          ["光沢で、視線を奪う。", "静かな高級感を、強く。", "商品写真を大きくクロップし、タイトルを細長く縦配置する海外ラグジュアリー広告風にする"],
          ["余白に、きらめきを置く。", "派手より、忘れられない一枚。", "白とシャンパンの面を大胆に分割し、商品を片側へ寄せたアートディレクションにする"],
        ]
        : /水着|水際|リゾート|マリン|ブルー|水色|白/.test(text)
          ? [
            ["風まで軽くなる、夏の装い。", "涼やかに、私らしく。", "白とアクアブルー、広い余白で爽やかなリゾート誌にする"],
            ["光と風をまとう、休日。", "夏の可愛いを、軽やかに。", "明るい空色と白を基調に、細い英字と抜け感のある文字組みにする"],
            ["夏の透明感を、味方に。", "軽く、涼しく、ちゃんと可愛い。", "白背景に水彩ブルーの細い帯を入れ、コレクション名を大きく横断させる"],
            ["リゾート気分を、上品に。", "肌見せより、バランス重視。", "写真を大きくトリミングし、余白に小さな波線とミニコピーを置く広告風にする"],
            ["夏を、表紙ごと着替える。", "光の余白で、可愛さを引き上げる。", "アクアブルーの大きな余白面と白いタイトルを大胆に重ねるリゾート広告風にする"],
            ["水際のかわいいを、品よく強く。", "涼しげなのに、印象は残る。", "商品写真を大きく斜めに置き、波線と細い英字を最小限に効かせる"],
          ]
          : /リネン|麻|コットン|綿|ベージュ|生成り|ナチュラル/.test(text)
            ? [
              ["自然体のまま、きれいに。", "素材の表情を、楽しむ。", "生成り、淡いグリーン、紙の質感を生かしたナチュラル誌にする"],
              ["頑張らない日の、上品服。", "心地よさまで、スタイルに。", "アイボリーと植物色を使い、静かで温かい文字組みにする"],
              ["やさしい素材で、整える。", "毎日に似合う、きれいめ感。", "クラフト紙のような背景に、商品写真を余白多めで置くセレクトショップ風にする"],
              ["静かな可愛さが、長く続く。", "素材感まで、私らしく。", "縦長のコレクション名を大きく入れ、植物線画を端にだけ添える"],
              ["素材感を、主役にする表紙。", "やさしいのに、ちゃんと印象的。", "紙面を大きく左右に分割し、片側に巨大タイトル、片側に商品を静かに置く"],
              ["日常服を、編集部っぽく。", "自然光まで、コレクションに。", "クラフト紙、白余白、切り抜き商品を大胆に重ねるセレクトショップZINE風にする"],
            ]
            : [
              ["今着たいを、ひとつに。", "毎日に寄り添う、きれいめ服。", "商品の色を主役に、白い余白と端正な文字組みで仕上げる"],
              ["私らしい可愛いを、更新。", "着る日が楽しみになる一着。", "商品色から2色だけを選び、雑誌らしい強弱のある文字組みにする"],
              ["いつもの日を、少し素敵に。", "選ぶ時間まで、ときめきに。", "明るい背景と繊細な罫線で、清潔感のあるファッション誌にする"],
              ["今日の主役を、きれいに選ぶ。", "可愛い理由が、ひと目で伝わる。", "大きなタイトルを中央に置き、商品写真を左右どちらかへ大胆に寄せる"],
              ["好きな服だけ、きちんと集める。", "見返すたび、気分が上がる。", "セレクトショップのカタログ風に、商品と余白をリズムよく配置する"],
              ["小さなときめきを、集めて。", "毎日使える、私の可愛い。", "タイトルを大きく縦横ミックスし、細い飾り罫で上品なZINE風にする"],
              ["可愛いを、編集する。", "選ぶ楽しさまで、表紙に。", "商品写真を大胆にクロップし、コレクション名を画面いっぱいに配置する雑誌特集風にする"],
              ["お気に入りだけで、強い一枚。", "甘さも品も、ひと目で伝える。", "大きな余白面、斜めの小見出し、重ねた商品写真でセレクトショップ広告風にする"],
            ];
  const selected = themes[hashText(`${product.id || product.name} collection ${roomGenerationVariant}`) % themes.length];
  return {
    collectionTitle: `${brand} Collection`,
    moodLine: selected[0],
    editLine: selected[1],
    categoryLabel: `${product.category || "FASHION"} COLLECTION`,
    designDirection: `${selected[2]}\n・ブランド/商品イメージ判定: ${brandDesign.profile}\n・表紙のデザイン方針: ${brandDesign.direction}\n・配色: ${brandDesign.palette}\n・文字組み: ${brandDesign.typography}\n・装飾: ${brandDesign.decoration}`,
    oneLiner,
  };
}

function buildRoomCollectionBrandDesign(product, brand, sourceText = "") {
  const text = `${brand || ""} ${sourceText || ""}`.toLocaleLowerCase("ja-JP");
  const category = product.category || "ファッション";
  const has = (pattern) => pattern.test(text);
  const profiles = [
    {
      match: has(/snidel|fray|mila owen|celford|lily brown|リリーブラウン|スナイデル|フレイ|セルフォード|リボン|フリル|レース|花柄|ガーリー/),
      profile: "大人ロマンティック / 甘めきれいめ",
      direction: "柔らかな余白と曲線的な写真トリミングを使い、コレクション名は大きく大胆に置いて女性誌の特集表紙のように見せる",
      palette: "くすみピンク、アイボリー、ローズブラウンを中心に、甘すぎない低彩度でまとめる",
      typography: "コレクション名は大きな明朝体で画面の主役にし、サブコピーは細いゴシック体で余白に流す",
      decoration: "小さなリボン、花びら、細い点線を少量だけ使い、子どもっぽい装飾は避ける",
    },
    {
      match: has(/uniqlo|gu|無印|muji|zara|hm|h&m|global work|グローバルワーク|シンプル|ベーシック|無地|白|黒|ネイビー|グレー/),
      profile: "ミニマル / ベーシック高見え",
      direction: "余白を広く取り、商品を端正に非対称配置し、巨大なタイトルと細い罫線でルックブック表紙にする",
      palette: "白、黒、グレー、ベージュを軸に、商品色を差し色として一点だけ使う",
      typography: "太すぎないゴシック体でコレクション名を大きく、英字は小さく整える",
      decoration: "装飾は細い罫線と小さな余白マーク程度に抑え、情報を盛りすぎない",
    },
    {
      match: has(/chanel|dior|celine|miumiu|miu miu|prada|loewe|hermes|fendi|gucci|パール|ゴールド|サテン|光沢|ビジュー|ジュエル/),
      profile: "ラグジュアリー / 上質モード",
      direction: "強い主役写真を大胆にクロップし、余白と細い文字だけで高級ブランド広告のように見せる",
      palette: "パールホワイト、シャンパン、黒、深いブラウンを使い、光沢感を上品に出す",
      typography: "大きな明朝体または細身セリフ体で、文字間をゆったり取る",
      decoration: "装飾は極小の光、細線、紙面の余白だけ。派手な星や大量のハートは禁止",
    },
    {
      match: has(/shein|wego|grl|韓国|ストリート|デニム|カーゴ|スニーカー|キャップ|スポーティ|カジュアル/),
      profile: "カジュアル / ストリートMIX",
      direction: "商品写真をコラージュ風に重ね、タイトルを大胆にずらし、紙面に動きのあるファッションZINE風にする",
      palette: "白、黒、デニムブルー、淡いピンクを使い、抜け感のある明るさにする",
      typography: "太めゴシックと手書き風の小文字を少し混ぜ、動きのある紙面にする",
      decoration: "マスキングテープ風、細い矢印、手書き線を少量使う。雑に見える切り貼りは禁止",
    },
    {
      match: has(/リネン|麻|コットン|綿|生成り|ナチュラル|カゴ|かご|麦わら|ベージュ|ブラウン|木|カフェ/),
      profile: "ナチュラル / やさしい日常服",
      direction: "紙の質感と自然光を感じる背景に、商品と大きなタイトルを大胆に余白配置したセレクトショップのカタログ表紙にする",
      palette: "アイボリー、生成り、淡いグリーン、木のブラウンを中心にする",
      typography: "やさしい明朝体と細いゴシック体を組み合わせ、読みやすく落ち着かせる",
      decoration: "植物線画、細い囲み線、余白を活かし、花や小物を増やしすぎない",
    },
    {
      match: has(/水着|水際|リゾート|マリン|サンダル|ブルー|水色|アクア|uv|紫外線/),
      profile: "リゾート / 透明感サマー",
      direction: "光と風を感じるリゾート誌の表紙にし、大きな余白面と大胆な写真配置で商品をきれいに見せる",
      palette: "白、アクアブルー、淡い砂色、透明感のある影色を使う",
      typography: "大きなタイトルは軽やかに、サブコピーは細く涼しげに配置する",
      decoration: "波線、光の粒、薄い布のような形を控えめに使い、海っぽさを上品に留める",
    },
  ];
  const selected = profiles.find((profile) => profile.match) || {
    profile: `${category}に合わせた上品なブランド広告風`,
    direction: "商品の色、素材、形を主役にして、表紙ごとに写真配置、文字位置、余白比率を大胆に変える",
    palette: "商品画像から主色を2色だけ拾い、白または淡い背景でまとめる",
    typography: "コレクション名を最も大きく、サブコピーは小さく端正に配置する",
    decoration: "細い罫線、余白、控えめな手書きアクセントだけを使い、既視感のあるテンプレ装飾を避ける",
  };
  return selected;
}

function markRoomCollectionStale() {
  const status = document.querySelector("#roomCollectionStatus");
  if (status) status.textContent = "再作成待ち";
}

function generateRoomCollectionSet() {
  const product = getSelectedRoomProduct();
  if (!product) return showToast("先に商品を選んでください");
  const draft = buildRoomCollectionSet(product);
  document.querySelector("#roomCollectionTitle").value = draft.title;
  document.querySelector("#roomCollectionBody").value = draft.body;
  document.querySelector("#roomCollectionCoverPrompt").value = draft.coverPrompt;
  document.querySelector("#roomCollectionAiPrompt").value = draft.aiPrompt;
  state.roomCollectionDrafts ||= [];
  state.roomCollectionDrafts.unshift(draft);
  state.roomCollectionDrafts = state.roomCollectionDrafts.slice(0, 50);
  const status = document.querySelector("#roomCollectionStatus");
  if (status) status.textContent = "作成済み";
  saveUserDecision("RoomCollectionDraft", draft.id, "generated", null, { title: draft.title, theme: draft.theme }, "new collection set");
  saveState();
  showToast("新規コレクション案を作りました");
  return draft;
}

function buildRoomCollectionSet(product) {
  const details = product.details || {};
  const brand = details.brand || "Hanako Select";
  const theme = document.querySelector("#roomCollectionTheme")?.value || "auto";
  const tone = document.querySelector("#roomCollectionTone")?.value || "editor";
  const themeInfo = resolveRoomCollectionTheme(product, theme);
  const oneLiner = buildRoomImageOneLiner(product);
  const coverCopy = buildRoomCollectionCoverCopy(product, brand, oneLiner);
  const relatedProducts = getRoomCollectionRelatedProducts(product, themeInfo);
  const title = buildRoomCollectionTitle(product, brand, themeInfo);
  const body = buildRoomCollectionBody(product, brand, title, themeInfo, tone, relatedProducts);
  const coverPrompt = buildRoomCollectionStandaloneCoverPrompt(product, brand, title, body, coverCopy, themeInfo, relatedProducts);
  const aiPrompt = buildRoomCollectionAiMasterPrompt(product, brand, title, body, coverPrompt, themeInfo, tone, relatedProducts);
  return {
    id: createId(),
    productId: product.id,
    productName: product.name,
    theme: themeInfo.id,
    tone,
    title,
    body,
    coverPrompt,
    aiPrompt,
    relatedProductIds: relatedProducts.map((item) => item.id),
    createdAt: new Date().toISOString(),
  };
}

function resolveRoomCollectionTheme(product, selectedTheme = "auto") {
  const text = `${product.name || ""} ${product.category || ""} ${product.hook || ""} ${product.details?.material || ""} ${product.details?.color || ""}`;
  const auto = /カーディガン|羽織|冷房|UV|シアー|薄手/.test(text)
    ? "cooling"
    : /旅行|トラベル|リゾート|水着|サンダル|軽い|洗える/.test(text)
      ? "travel"
      : /通勤|オフィス|ブラウス|パンツ|ジャケット|きれいめ/.test(text)
        ? "office"
        : /デート|女子会|ワンピース|レース|リボン|フリル/.test(text)
          ? "date"
          : Number(product.price) > 0 && Number(product.price) <= 3000
            ? "under3000"
            : "sameBrand";
  const id = selectedTheme === "auto" ? auto : selectedTheme;
  const map = {
    travel: { id, label: "旅行・お出かけ", titleSeed: "旅先でも可愛い", promise: "写真映えと着回しやすさを両立", audience: "週末のお出かけや旅行で失敗したくない人" },
    office: { id, label: "通勤・きれいめ", titleSeed: "きれいめ通勤", promise: "きちんと感を残しながら甘さを整える", audience: "大学・通勤・きれいめ予定をラクに整えたい人" },
    date: { id, label: "デート・女子会", titleSeed: "褒められガーリー", promise: "甘さを上品に見せて写真にも残しやすい", audience: "デートや女子会で可愛く見せたい人" },
    wave: { id, label: "骨格ウェーブ", titleSeed: "骨格ウェーブ優勝", promise: "重心を上げて、華奢見えとバランスを作る", audience: "上半身や腰位置の見え方を整えたい人" },
    cooling: { id, label: "冷房対策・気温差", titleSeed: "気温差に負けない", promise: "脱ぎ着しやすく、温度調整も可愛く見せる", audience: "朝晩や冷房の気温差に悩む人" },
    under3000: { id, label: "3000円以下", titleSeed: "プチプラ高見え", promise: "価格は軽く、見た目はきれいめに整える", audience: "失敗しにくいプチプラ服を探す人" },
    sameBrand: { id, label: "同ブランドまとめ", titleSeed: "ブランド買い足し候補", promise: "同じ世界観でコーデを組みやすくする", audience: "好きなブランドでまとめて選びたい人" },
  };
  return map[id] || map.sameBrand;
}

function getRoomCollectionRelatedProducts(product, themeInfo) {
  const brand = product.details?.brand || "";
  const category = product.category || "";
  const price = Number(product.price) || 0;
  const scored = (state.products || [])
    .filter((item) => item.id !== product.id)
    .map((item) => {
      let score = 0;
      if (brand && item.details?.brand === brand) score += 42;
      if (item.category === category) score += 18;
      if (themeInfo.id === "under3000" && Number(item.price) > 0 && Number(item.price) <= 3000) score += 25;
      if (themeInfo.id === "cooling" && /カーディガン|羽織|シアー|薄手|UV|冷房/.test(`${item.name} ${item.hook}`)) score += 25;
      if (themeInfo.id === "travel" && /旅行|洗える|軽い|サンダル|バッグ|ワンピ|リネン/.test(`${item.name} ${item.hook} ${item.category}`)) score += 22;
      if (themeInfo.id === "office" && /通勤|ブラウス|パンツ|ジャケット|きれいめ|バッグ/.test(`${item.name} ${item.hook} ${item.category}`)) score += 22;
      if (themeInfo.id === "date" && /ワンピ|レース|リボン|フリル|スカート|パール/.test(`${item.name} ${item.hook} ${item.category}`)) score += 22;
      if (themeInfo.id === "wave" && /ショート|ハイウエスト|リボン|フリル|カーデ|スカート/.test(`${item.name} ${item.hook} ${item.category}`)) score += 22;
      if (price && Number(item.price)) score += Math.max(0, 10 - Math.abs(Number(item.price) - price) / 1000);
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((entry) => entry.item);
  return [product, ...scored].slice(0, 6);
}

function buildRoomCollectionTitle(product, brand, themeInfo) {
  const category = product.category || "ファッション";
  const titleOptions = [
    `${themeInfo.titleSeed} Collection`,
    `${themeInfo.titleSeed} ${category}`,
    `${brand} ${themeInfo.label}`,
    `${themeInfo.label} 可愛さラボ`,
    `${themeInfo.titleSeed} まとめ`,
  ];
  return titleOptions[hashText(`${product.id || product.name}:${themeInfo.id}:title`) % titleOptions.length].replace(/\s+/g, " ").trim();
}

function buildRoomCollectionBody(product, brand, title, themeInfo, tone, relatedProducts) {
  const countLine = relatedProducts.length >= 4 ? `まずは${relatedProducts.length}点から、雰囲気が近いものだけを厳選。` : "最初は少数精鋭で、似合う理由が伝わるものだけを追加。";
  const toneLine = {
    editor: "雑誌の小さな特集みたいに、見返すだけで次のコーデが決まる場所にします。",
    friendly: "礼儀正しく、でもちゃんと本音で、毎日の可愛い選びを少しラクにします。",
    sharp: "可愛いだけで盛りすぎず、着回しやすさと高見えをズバッと見ます。",
    luxury: "ブランド広告のように、余白と統一感まで大事にして選びます。",
  }[tone] || "見返すだけで、今日の可愛いが決まる場所にします。";
  return cleanRoomMultilineText(`${title}

${themeInfo.audience}へ。
${themeInfo.promise}アイテムを集めるコレクションです。

${countLine}
${toneLine}

PR/広告を含みます。気になる商品は、在庫・カラー・サイズ・クーポンを確認してから選んでください。`);
}

function buildRoomCollectionStandaloneCoverPrompt(product, brand, title, body, coverCopy, themeInfo, relatedProducts) {
  const products = relatedProducts.map((item, index) => `${index + 1}. ${item.name}
カテゴリ: ${item.category || "ファッション"}
ブランド: ${item.details?.brand || brand}
価格: ${item.price || "未取得"}
画像URL: ${item.image || "未登録"}
商品URL: ${item.url || "未登録"}`).join("\n\n");
  return adaptPromptToSelectedAi(`楽天ROOMの新規コレクション表紙画像を1枚作ってください。

【目的】
このコレクションへ入りたくなる、センスが良くて保存したくなる表紙にする。

【コレクション件名】
${title}

【本文の方向性】
${body}

【表紙に入れるテキスト】
・一番大きく: 「${title}」
・小さく: 「${coverCopy.moodLine}」
・小さく: 「${coverCopy.editLine}」
・カテゴリ: 「${coverCopy.categoryLabel}」
・「楽天ROOM」「ROOM」「STYLE EDIT」は入れない

【デザイン方針】
・正方形1:1、1536×1536px以上
・ブランドや商品の雰囲気に合わせた、毎回違うファッション雑誌の表紙風
・コレクション名を一番大きく、遠目でも読める主役見出しにする
・商品画像をコラージュ、切り抜き、雑誌紙面、ブランド広告風のどれかで大胆に使う
・商品が少ない場合は水増しせず、1〜2点を大きく見せる
・価格、レビュー数、ランキング、売上数、効能の数字は入れない
・外周の白い安全余白や額縁は不要。画面端までデザインしてよい
・文字は切らず、日本語の誤字、意味不明な言葉、造語、文字化けを絶対に入れない
・淡すぎる文字は禁止。読める濃さで上品にする

【使ってよい商品】
${products}

【禁止】
・未登録の商品を勝手に足さない
・商品URLや画像URLが読めない場合、読めない商品は想像で補完せず、読み取れる商品と上記の商品名だけで構成する
・ブランドロゴを勝手に作らない
・サービス名、広告っぽい過剰な売り文句、ウォーターマークを入れない

完成画像だけを返してください。説明文や別案は不要です。`);
}

function buildRoomCollectionAiMasterPrompt(product, brand, title, body, coverPrompt, themeInfo, tone, relatedProducts) {
  const products = relatedProducts.map((item, index) => `${index + 1}. ${item.name} / ${item.category || ""} / ${item.price || ""}円
商品URL: ${item.url || "未登録"}
画像URL: ${item.image || "未登録"}`).join("\n");
  return adaptPromptToSelectedAi(`あなたは楽天ROOMでレディースファッションを売るための編集者です。
以下の商品情報をもとに、新規コレクションを作るための3点を完成させてください。

1. コレクション件名
2. コレクション本文
3. コレクション表紙画像プロンプト

【今回の方向性】
${themeInfo.label}

【本文トーン】
${tone}

【初期案】
件名:
${title}

本文:
${body}

表紙画像プロンプト:
${coverPrompt}

【商品情報】
メイン商品: ${product.name}
ブランド: ${brand}
カテゴリ: ${product.category || ""}
${products}

【仕上げ条件】
・件名は短く、楽天ROOMのコレクション名として使いやすくする
・本文は150〜260文字程度。読みやすく、可愛く、でも売るための理由が伝わるようにする
・PR/広告を含むことが自然に伝わる表現にする
・表紙画像プロンプトは、生成AIへそのまま貼れる完成形にする
・商品を水増ししない。選んだ商品と同系統の商品だけで見せる
・表紙に「楽天ROOM」「ROOM」「STYLE EDIT」は入れない
・意味不明な日本語、造語、文字化け、切れた文字を入れない
・価格、割引、レビュー数は、取得できていない場合は書かない

出力は次の形式だけ:
【件名】
...

【本文】
...

【表紙画像プロンプト】
...`);
}

async function copyRoomCollectionAll() {
  const title = document.querySelector("#roomCollectionTitle")?.value || "";
  const body = document.querySelector("#roomCollectionBody")?.value || "";
  const coverPrompt = document.querySelector("#roomCollectionCoverPrompt")?.value || "";
  const aiPrompt = document.querySelector("#roomCollectionAiPrompt")?.value || "";
  const text = `【件名】\n${title}\n\n【本文】\n${body}\n\n【表紙画像プロンプト】\n${coverPrompt}\n\n【AIへ渡すまとめプロンプト】\n${aiPrompt}`.trim();
  if (!title && !body && !coverPrompt && !aiPrompt) return showToast("先に新規コレクション案を作ってください");
  await copyText(text);
}

async function openRoomCollectionAi() {
  let prompt = document.querySelector("#roomCollectionAiPrompt")?.value?.trim() || "";
  if (!prompt) {
    const draft = generateRoomCollectionSet();
    prompt = draft?.aiPrompt || "";
  }
  if (!prompt) return;
  await copyText(prompt, document.querySelector("#roomCollectionAiPrompt"));
  openGeminiDestination();
  showToast(`${getSelectedAiName()}へ貼り付けるプロンプトをコピーしました`);
}

async function copyRoomImagePrompt() {
  const output = document.querySelector("#roomImagePrompt");
  const product = getSelectedRoomProduct();
  if (!product) return showToast("先に商品を選んでください");
  const prompt = buildCurrentRoomImagePrompt(product);
  if (output) output.value = prompt;
  const copied = await copyText(prompt, output);
  if (copied) {
    const status = document.querySelector("#roomImagePromptStatus");
    if (status) status.textContent = "コピー済み";
  }
}

async function openRoomImageGemini() {
  const prompt = document.querySelector("#roomImagePrompt")?.value.trim();
  const selectedPhoto = getSelectedCoordinatePhoto();
  if (!prompt || !roomReferenceBoardDataUrl || (selectedPhoto && !roomReferenceBoardHasPerson)) {
    const prepared = await generateRoomImagePrompt(true);
    if (selectedPhoto && !roomReferenceBoardHasPerson) {
      showToast("本人写真を参照画像へ入れられませんでした。ホームで写真を選び直してください");
      return;
    }
    if (prepared && roomReferenceBoardDataUrl) {
      showToast("参照画像を準備しました。もう一度このボタンを押してください");
    }
    return;
  }
  const boardFile = dataUrlToFile(roomReferenceBoardDataUrl, "hanako-room-reference.jpg");
  const files = [boardFile];
  if (navigator.share && navigator.canShare?.({ files })) {
    try {
      void copyText(prompt);
      await navigator.share({
        title: "Hanako Style Studio・ROOM画像",
        text: prompt,
        files,
      });
      showToast(`${getSelectedAiName()}でコピー済みプロンプトを貼ってください`);
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  await copyText(prompt);
  downloadReferenceFile(boardFile, "hanako-room-reference.jpg");
  openGeminiDestination();
  showToast(`参照画像を保存し、プロンプトをコピーしました。${getSelectedAiName()}へ画像1枚を添付してください`);
}

function generateRoomPost() {
  const product = getSelectedRoomProduct();
  if (!product) return showToast("先に商品を登録してください");
  if (!window.RoomReviewGenerator?.generateFromInfo) return showToast("ROOM生成エンジンを読み込めませんでした");
  const info = {
    title: product.name,
    description: [
      product.hook,
      product.price,
      product.details?.color,
      product.details?.material,
      product.details?.description,
      product.details?.coupon,
      product.details?.sale,
    ].filter(Boolean).join("。"),
    shopName: product.details?.brand || "",
    variationSeed: ++roomGenerationVariant,
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
  markSocialGeminiPromptStale();
  generateBothSocialGeminiPrompts(true);
  const learnedLabel = context.learnedPattern.sampleSize >= 2 ? "実績から最適化" : "新規テスト";
  document.querySelector("#outputMeta").textContent = `${activePlatform} / 18構成から自動選抜 / ${viralPatternLabels[context.viralPattern]} / ${learnedLabel} / ${context.ownershipVoice.status}`;
  renderChecks(lastGenerated);
  rememberGeneration(lastGenerated);
  const teacherIncluded = document.querySelector("#snsIncludeHanakoTeacher")?.checked;
  showToast(isVariation
    ? `切り口を変えて別案と${teacherIncluded ? "先生入り" : ""}画像指示を作りました`
    : `投稿文と${teacherIncluded ? "先生入り" : ""}画像指示を作りました`);
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
  markSocialGeminiPromptStale();
  generateBothSocialGeminiPrompts(true);
  document.querySelector("#outputMeta").textContent = `${activePlatform} / 3つの共感アプローチを比較 / 購入状況に合う表現`;
  renderChecks(lastGenerated);
  const teacherIncluded = document.querySelector("#snsIncludeHanakoTeacher")?.checked;
  showToast(`3案と${teacherIncluded ? "先生入り" : ""}画像の指示をまとめて作りました`);
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
    style: categoryStyles[resolveCategoryStyleKey(product.category)] || categoryStyles.トップス,
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

function generateSocialGeminiImagePrompt(quiet = false) {
  const data = getSocialGeminiPromptData();
  if (!data) return false;
  if (data.includeHanakoTeacher) {
    data.hanakoTeacher = resolveSocialHanakoTeacher(true);
    data.hanakoComment = chooseSocialHanakoComment(data, true);
    updateSocialHanakoTeacherPreview();
  }
  snsGeminiPrompt.value = adaptPromptToSelectedAi(buildSocialGeminiImagePrompt(data));
  socialGeminiPromptNeedsRefresh = false;
  setSocialGeminiMode("image");
  setSocialGeminiStatus(`${activePlatform}画像用`);
  if (!quiet) showToast(`${activePlatform}の画像プロンプトを作りました`);
  renderSocialGeminiProgress();
  void prepareSocialReferenceBoard(data);
  return true;
}

function generateBothSocialGeminiPrompts(quiet = false) {
  const data = getSocialGeminiPromptData();
  if (!data) return false;
  if (data.includeHanakoTeacher) {
    data.hanakoTeacher = resolveSocialHanakoTeacher(true);
    data.hanakoComment = chooseSocialHanakoComment(data, true);
    updateSocialHanakoTeacherPreview();
  }
  snsGeminiPrompt.value = adaptPromptToSelectedAi(buildSocialGeminiImagePrompt(data));
  snsGeminiCopyPrompt.value = adaptPromptToSelectedAi(buildSocialGeminiCopyPrompt(data));
  socialGeminiPromptNeedsRefresh = false;
  setSocialGeminiStatus(`${activePlatform}の画像・投稿文用`);
  if (!quiet) showToast(`${activePlatform}の2つのプロンプトを作りました`);
  renderSocialGeminiProgress();
  void prepareSocialReferenceBoard(data);
  return true;
}

function generateSocialGeminiCopyPrompt(quiet = false) {
  const data = getSocialGeminiPromptData();
  if (!data) return false;
  snsGeminiCopyPrompt.value = adaptPromptToSelectedAi(buildSocialGeminiCopyPrompt(data));
  socialGeminiPromptNeedsRefresh = false;
  setSocialGeminiMode("copy");
  setSocialGeminiStatus(`${activePlatform}投稿文用`);
  if (!quiet) showToast(`${activePlatform}の投稿文プロンプトを作りました`);
  renderSocialGeminiProgress();
  return true;
}

function sendSocialGeminiToGemini(mode) {
  const generated = generateBothSocialGeminiPrompts(true);
  if (generated) copyAndOpenSocialGemini(mode);
}

async function shareSocialReferenceToGemini() {
  const prompt = snsGeminiPrompt.value.trim();
  if (!prompt || socialGeminiPromptNeedsRefresh || !socialReferenceBoardDataUrl) {
    const generated = generateBothSocialGeminiPrompts(true);
    if (!generated) return;
    const prepared = await prepareSocialReferenceBoard();
    if (prepared) showToast("参照画像を準備しました。もう一度このボタンを押してください");
    return;
  }
  const boardFile = dataUrlToFile(socialReferenceBoardDataUrl, `hanako-${activePlatform.toLowerCase()}-reference.jpg`);
  const files = [boardFile];
  if (navigator.share && navigator.canShare?.({ files })) {
    try {
      void copyText(prompt);
      await navigator.share({
        title: `Hanako Style Studio・${activePlatform}画像`,
        text: prompt,
        files,
      });
      showToast(`${getSelectedAiName()}でコピー済みプロンプトを貼ってください`);
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  await copyText(prompt);
  downloadReferenceFile(boardFile, `hanako-${activePlatform.toLowerCase()}-reference.jpg`);
  openGeminiDestination();
  showToast(`参照画像を保存し、プロンプトをコピーしました。${getSelectedAiName()}へ画像1枚を添付してください`);
}

async function prepareSocialReferenceBoard(existingData = null) {
  const data = existingData || getSocialGeminiPromptData();
  if (!data) return false;
  if (!data.context.product.image) {
    showToast("この商品には参照できる商品画像がありません");
    return false;
  }
  const photo = getSelectedCoordinatePhoto();
  if (!photo) {
    showToast("コーデ画面で本人写真を保存して選んでください");
    return false;
  }
  try {
    await ensureSelectedCoordinatePhotoUrl();
    await loadCoordinatePhotoPreview(photo);
    data.hanakoTeacher = currentSocialHanakoTeacher;
    data.hanakoComment = currentSocialHanakoComment;
    await drawSocialReferenceBoard(data);
    return true;
  } catch (error) {
    showToast(error.message || "SNS参照画像を作れませんでした");
    return false;
  }
}

async function drawSocialReferenceBoard(data) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fffafb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2f2529";
  ctx.font = "700 34px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText(`${activePlatform.toUpperCase()} REFERENCE BOARD`, 54, 60);
  ctx.fillStyle = "#9b4665";
  ctx.font = "700 20px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText("この1枚に写る本人・商品・先生だけを使う", 54, 94);

  const photo = getSelectedCoordinatePhoto();
  const personSource = photo ? (coordinatePhotoPreviewCache.get(photo.id) || coordinatePhotoDataUrl) : "";
  const personImage = personSource ? await loadImage(personSource).catch(() => null) : null;
  ctx.fillStyle = "#fff";
  roundRect(ctx, 44, 122, 390, 750, 18);
  ctx.fill();
  if (personImage) drawCoverImage(ctx, personImage, 60, 172, 358, 674, 12);
  else drawPlaceholder(ctx, "PERSON", 60, 172, 358, 674);
  ctx.fillStyle = "#a43d64";
  ctx.font = "700 18px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText("PERSON / 本人", 62, 154);

  const products = [data.context.product, ...data.context.products.filter((item) => item.id !== data.context.product.id)]
    .filter((item, index, items) => item?.image && items.findIndex((other) => other.id === item.id) === index)
    .slice(0, 4);
  const cardWidth = 350;
  const cardHeight = 330;
  for (let index = 0; index < products.length; index += 1) {
    const item = products[index];
    const x = 470 + (index % 2) * 370;
    const y = 122 + Math.floor(index / 2) * 356;
    ctx.fillStyle = "#fff";
    roundRect(ctx, x, y, cardWidth, cardHeight, 16);
    ctx.fill();
    const productImage = await loadCoordinateProductImage(item.image);
    if (productImage) drawCoverImage(ctx, productImage, x + 12, y + 40, cardWidth - 24, 238, 9);
    else drawPlaceholder(ctx, item.category, x + 12, y + 40, cardWidth - 24, 238);
    ctx.fillStyle = "#a43d64";
    ctx.font = "700 17px Yu Gothic UI, Meiryo, sans-serif";
    ctx.fillText(`PRODUCT ${index + 1} / ${item.category}`, x + 14, y + 27);
    ctx.fillStyle = "#392f33";
    ctx.font = "700 15px Yu Gothic UI, Meiryo, sans-serif";
    wrapCanvasText(ctx, trimText(item.name, 34), x + 14, y + 300, cardWidth - 28, 20, 2);
  }

  if (data.includeHanakoTeacher !== false) {
    const teacher = data.hanakoTeacher || currentSocialHanakoTeacher;
    const teacherImage = await loadImage(teacher.avatar).catch(() => null);
    ctx.fillStyle = "#fff";
    roundRect(ctx, 1210, 122, 150, 210, 16);
    ctx.fill();
    if (teacherImage) drawCoverImage(ctx, teacherImage, 1224, 160, 122, 122, 61);
    else drawPlaceholder(ctx, "先生", 1224, 160, 122, 122);
    ctx.fillStyle = "#a43d64";
    ctx.font = "700 16px Yu Gothic UI, Meiryo, sans-serif";
    ctx.fillText("TEACHER", 1244, 148);
    ctx.fillStyle = "#392f33";
    ctx.font = "700 13px Yu Gothic UI, Meiryo, sans-serif";
    wrapCanvasText(ctx, data.hanakoComment || "ハナコ先生", 1222, 306, 126, 17, 2);
  }
  ctx.fillStyle = "#6d5b62";
  ctx.font = "700 18px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText("PERSON・PRODUCT・TEACHERを別人・別商品へ置き換えない", 470, 930);
  socialReferenceBoardDataUrl = canvas.toDataURL("image/jpeg", 0.92);
  return socialReferenceBoardDataUrl;
}

function getSocialGeminiPromptData() {
  const product = state.products.find((item) => item.id === selectedProduct.value) || state.products[0];
  if (!product) {
    showToast("先に商品を登録してください");
    return null;
  }
  const context = buildEditorialContext(product);
  const selectedLabel = (selector) => {
    const select = document.querySelector(selector);
    return select?.selectedOptions?.[0]?.textContent?.trim() || "自動";
  };
  return {
    context,
    currentDraft: postOutput.value.trim().slice(0, 6000),
    labels: {
      audience: selectedLabel("#audienceSelect"),
      goal: selectedLabel("#goalSelect"),
      optimization: selectedLabel("#optimizationSelect"),
      emotion: selectedLabel("#emotionSelect"),
      hook: hookTypeLabels[context.hookType] || selectedLabel("#hookSelect"),
      ownership: context.ownershipVoice.status || selectedLabel("#ownershipSelect"),
      viralPattern: viralPatternLabels[context.viralPattern] || selectedLabel("#viralPatternSelect"),
      season: selectedLabel("#seasonSelect"),
      tone: selectedLabel("#toneSelect"),
      fashionOccasion: selectedLabel("#fashionOccasionSelect"),
      fashionPriority: selectedLabel("#fashionPrioritySelect"),
      fashionConcern: selectedLabel("#fashionConcernSelect"),
      travelCompanion: selectedLabel("#travelCompanionSelect"),
      travelPriority: selectedLabel("#travelPrioritySelect"),
    },
    includeHanakoTeacher: document.querySelector("#snsIncludeHanakoTeacher")?.checked !== false,
    hanakoTeacher: currentSocialHanakoTeacher,
    hanakoComment: currentSocialHanakoComment,
  };
}

function buildSocialGeminiImagePrompt({ context: c, labels, currentDraft, includeHanakoTeacher, hanakoTeacher, hanakoComment }) {
  const product = c.product;
  const details = product.details || {};
  const imageHeadline = buildSocialImageHeadline(c, labels);
  const imagePoints = buildSocialImagePoints(c, labels);
  const supportingProducts = c.products
    .slice(1)
    .filter((item) => (item.category === "ホテル・旅行") === c.isTravel)
    .slice(0, 3)
    .map((item) => `・${item.name} / ${item.category} / ${item.price || "価格未設定"}\n  画像URL: ${item.image || "なし"}`)
    .join("\n") || "なし";
  const visualByPlatform = {
    Instagram: `縦4:5（1080×1350px）の保存したくなる投稿画像を1枚作る。主役商品を大きく見せ、指定済みの表紙見出し、短いポイント3つ、手書き風の矢印や囲みを上品に配置する。`,
    Threads: `縦4:5（1080×1350px）の自然なライフスタイル画像を1枚作る。日常の一場面らしい親しみと共感を優先し、文字は短いひと言と手書きポイント2つまでにする。`,
    X: `横16:9（1600×900px）の一目で内容が分かる情報画像を1枚作る。比較・ランキング・速報・チェック項目が3秒で読める構成にし、見出しは短く強くする。`,
  }[c.platform];
  const topicInstruction = c.isTravel
    ? `参照画像ボードのPRODUCT欄にある宿泊施設の写真を主役にし、確認できる魅力だけを整理する。写真にない設備や景色を作らない。`
    : `参照画像ボードのPRODUCT欄にある商品を主役にし、色・形・素材感を変えず、${labels.fashionOccasion}で使うイメージが自然に伝わるようにする。`;
  const hanakoInstruction = includeHanakoTeacher ? `【ハナコ先生の吹き出し・必須】
・参照画像ボードのTEACHER欄にある「${hanakoTeacher.name}」を、丸いアイコンとして完成画像へ入れる
・TEACHER欄の顔、髪型、髪色、服、目の色、表情を変えず、別人に描き直さない
・先生は商品やモデルとは別の解説キャラクター。画像の左下に、外周から6%以上離して全体の18〜22%の大きさで置く
・先生の真上に、白地とくすみピンク線の吹き出しを1個だけ置き、下向きのしっぽで先生へつなぐ
・吹き出しの見出しは必ず「ハナコ先生のズバッとひとこと」
・吹き出し本文は必ずこの1文だけ: 「${hanakoComment}」
・見出しと本文を一字一句変えない。造語、誤字、文字化け、追加の掛け声、別の吹き出しを作らない
・吹き出しと先生を商品、人物、重要な文字へ重ねず、本文の最後まで枠内へ収める
・${c.platform === "X" ? "横長画像でも先生と吹き出しを左下の安全域へまとめ、比較情報を隠さない" : "縦長画像の下端から8%以上離し、先生と吹き出しを縦に並べる"}` : `【ハナコ先生】
・今回は先生アイコンと吹き出しを入れない`;
  return `画像を生成してください。これは${c.platform}投稿用の画像生成依頼です。文章だけで回答せず、添付した参照画像ボード1枚を使って完成画像を1枚生成してください。

【参照画像ボード・最優先】
・PERSON欄は本人、PRODUCT欄は使用できる商品、TEACHER欄はハナコ先生の基準画像
・商品画像URLや先生画像URLへアクセスしない。添付した参照画像だけを画像の基準にする
・PERSON、PRODUCT、TEACHERを別人、別商品、別キャラクターへ置き換えない
・参照画像が届いていない場合は「参照画像を1枚添付してください」とだけ返し、画像を生成しない

【投稿先】
${c.platform}

【画像の構成】
${visualByPlatform}
${topicInstruction}

${hanakoInstruction}

【画像内へ書く日本語・一字一句固定】
一番上の見出し: 「${imageHeadline}」
ポイント1: 「${imagePoints[0]}」
ポイント2: 「${imagePoints[1]}」
ポイント3: 「${imagePoints[2]}」
・上の4文は意味と文法を確認済みの完成文。言い換え、要約、語順変更、単語追加、数字追加をしない
・投稿文や企画名から別の見出しを新しく作らない。「予定別」「4パターン」「ランキング」など、上の固定文にない言葉や数字を追加しない
・実際に複数の着回し画像を見せていないのに「○パターン」「○選」と書かない
・見出しと3ポイント以外の説明文を勝手に増やさない。ハナコ先生を入れる場合だけ、指定された先生見出しと本文を追加してよい
・生成後に画像内の日本語を一文字ずつ読み直し、意味不明、文法誤り、文字欠け、造語があれば固定文へ修正してから出力する

【今回の企画】
切り口: ${c.angle}
反応を生む構成: ${labels.viralPattern}
届けたい相手: ${labels.audience}
投稿の目的: ${labels.goal}
成果の最適化: ${labels.optimization}
寄り添う気持ち: ${labels.emotion}
冒頭のつかみ: ${labels.hook}
季節: ${c.seasonLabel}
今回だけの情報: ${c.brief || "なし"}

【画像とそろえる投稿内容】
${currentDraft ? currentDraft.slice(0, 1200) : "投稿文はまだ未作成。上の企画から画像を作る"}

【主役】
商品・施設名: ${product.name}
カテゴリ: ${product.category}
価格メモ: ${product.price || "未設定"}
ブランド: ${details.brand || "未設定"}
色: ${details.color || "未設定"}
素材: ${details.material || "未設定"}
推しポイント: ${product.hook || "商品情報から自然に整理"}
画像URL: ${product.image || "なし"}
商品ページURL: ${product.url || "なし"}

【比較・ランキング企画で使える候補】
${supportingProducts}
企画が比較・ランキングでない場合は無理に使わない。画像が添付されていない候補を実物そっくりに描かない。

【デザイン】
・おしゃれ研究家ハナコらしい、大人ガーリーで甘めきれいめな世界観
・明るく清潔感があり、商品が見やすい。ピンク一色にせず白、黒、淡いピンクをバランスよく使う
・文字は読みやすい自然な日本語。誤字、文字化け、意味のない文字を出さない
・商品名を長く載せず、見出しは上で指定した完成文だけを使い、説明は指定した3ポイントだけにする
・商品や人物の大切な部分へ文字を重ねない
・文字を薄くしない。見出しと3ポイント、先生の吹き出しは濃く、背景と十分なコントラストを付ける
・「STYLE EDIT」という文字は、見出し、ラベル、装飾、透かしのどこにも入れない
・サービス名、URL、値段、ブランドロゴを新しく画像内へ追加しない
・確認できない効果、使用感、売上、人気、順位を作らない
・実物の商品や施設を別物へ変えない

完成画像だけを生成し、説明文や投稿文は返さないでください。`;
}

function resolvePublicTeacherReference(teacher) {
  const fallback = hanakoTeacherGuides[0];
  const selected = teacher?.avatar && !/^(?:data:|blob:)/i.test(teacher.avatar) ? teacher : fallback;
  const publicBase = "https://hdwatana-commits.github.io/hanako-ops/";
  const url = /^https?:\/\//i.test(selected.avatar)
    ? selected.avatar
    : new URL(String(selected.avatar || fallback.avatar).replace(/^\.\//, ""), publicBase).href;
  return { teacher: selected, url };
}

function buildSocialImageHeadline(context, labels) {
  if (context.isTravel) {
    const companion = labels.travelCompanion && !/自動|選択/.test(labels.travelCompanion) ? labels.travelCompanion : "旅の日";
    return trimText(`${companion}に合う宿選び`, 18);
  }
  const category = context.product.category || "アイテム";
  const priority = labels.fashionPriority || "";
  const headlineByPriority = [
    [/着回し/, [`着回しやすい${category}の選び方`, `${category}を3倍着回すコツ`, `予定が変わっても頼れる${category}`]],
    [/高見え/, [`高見えする${category}の選び方`, `${category}を上品に見せるコツ`, `大人っぽく整う${category}選び`]],
    [/スタイル|バランス/, [`すっきり見える${category}選び`, `重心が整う${category}の選び方`, `${category}で全身バランスを整える`]],
    [/動きやすさ/, [`一日頼れる${category}の選び方`, `動けて可愛い${category}選び`, `長い一日も頼れる${category}`]],
    [/写真映え/, [`写真に映える${category}の選び方`, `写真で埋もれない${category}選び`, `顔まわりまで整う${category}`]],
  ];
  const candidates = headlineByPriority.find(([pattern]) => pattern.test(priority))?.[1] || [
    `大人かわいい${category}の選び方`,
    `${category}で甘さを上品に整える`,
    `手持ち服になじむ${category}選び`,
  ];
  return trimText(pickFresh(candidates, context.seed + generationVariant), 20);
}

function buildSocialImagePoints(context, labels) {
  if (context.isTravel) return [
    "立地と移動時間を確認",
    "部屋タイプと条件を確認",
    "料金と空室は予約前に確認",
  ];
  const category = context.product.category || "商品";
  const categoryPoints = {
    バッグ: ["手持ち服との色相性を確認", "大きさと持ち手を確認", "素材と収納力を確認"],
    トップス: ["顔まわりの色を確認", "袖と首もとの形を確認", "手持ちボトムとの相性を確認"],
    ワンピース: ["丈とウエスト位置を確認", "透け感と裏地を確認", "手持ちの靴との相性を確認"],
    アウター: ["肩幅と着丈を確認", "重ね着できる余裕を確認", "手持ち服との色相性を確認"],
    スカート: ["丈と広がり方を確認", "ウエスト位置を確認", "手持ちトップスとの相性を確認"],
    パンツ: ["股下と腰まわりを確認", "生地の落ち感を確認", "手持ちの靴との相性を確認"],
    シューズ: ["足幅とヒール高を確認", "歩きやすさを確認", "バッグとの色相性を確認"],
    アクセサリー: ["大きさと重さを確認", "金具の色をそろえる", "主役服とのバランスを確認"],
  };
  const basePoints = categoryPoints[category] || ["色と形を確認", "サイズと素材を確認", "手持ち服との相性を確認"];
  const alternatePoints = {
    バッグ: ["服から一色拾って合わせる", "荷物を入れた時の形を見る", "肩掛けした時の長さを見る"],
    トップス: ["首もとの抜けを確かめる", "インとアウトを比べる", "袖のボリュームを一か所に"],
    ワンピース: ["重心が上がる位置を探す", "羽織りを重ねても形を保つ", "靴まで含めて丈を見る"],
    スカート: ["トップスとの面積差を作る", "歩いた時の広がりを見る", "靴と裾の間を重くしない"],
    パンツ: ["腰位置をぼかさない", "裾と靴のつながりを見る", "上半身に小さな抜けを作る"],
    シューズ: ["服の甘さを足もとで整える", "長く歩く日の幅を確認", "ボトムと色をつなげる"],
  };
  const points = (context.seed + generationVariant) % 2 && alternatePoints[category]
    ? [...alternatePoints[category]]
    : [...basePoints];
  if (/写真/.test(labels.fashionPriority || "")) {
    points[2] = category === "アクセサリー" ? "写真で見える位置を確認" : "光の下で色味を確認";
  }
  if (/動き/.test(labels.fashionPriority || "")) {
    points[2] = category === "シューズ"
      ? "一日歩ける履き心地を確認"
      : category === "バッグ"
        ? "一日持てる重さを確認"
        : "動きやすいゆとりを確認";
  }
  return points;
}

function bindSocialHanakoTeacher() {
  const select = document.querySelector("#snsHanakoTeacher");
  const coverflow = document.querySelector("#snsTeacherCoverflow");
  if (!select || !coverflow) return;
  select.innerHTML = "";
  const options = getSocialHanakoTeacherItems();
  options.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    select.appendChild(option);
  });
  select.value = socialHanakoTeacherMode;
  select.addEventListener("change", () => {
    socialHanakoTeacherMode = select.value;
    resolveSocialHanakoTeacher(true);
    currentSocialHanakoComment = "";
    updateSocialHanakoTeacherPreview();
    markSocialGeminiPromptStale();
  });
  coverflow.innerHTML = options.map((item) => `
    <button class="teacher-coverflow-card" type="button" role="option" aria-selected="false" data-sns-teacher-mode="${item.id}" title="${item.name}">
      <span class="teacher-coverflow-image-wrap">
        <img src="${item.avatar}" alt="">
        ${item.badge ? `<small>${item.badge}</small>` : ""}
      </span>
      <strong>${item.shortName}</strong>
    </button>`).join("");
  coverflow.addEventListener("click", (event) => {
    const card = event.target.closest("[data-sns-teacher-mode]");
    if (card) activateSocialHanakoTeacher(card.dataset.snsTeacherMode, true, card.dataset.snsTeacherMode === "random");
  });
  coverflow.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    stepSocialHanakoTeacher(event.key === "ArrowRight" ? 1 : -1);
  });
  coverflow.addEventListener("scroll", () => {
    window.requestAnimationFrame(paintSocialHanakoTeacherCoverflow);
    window.clearTimeout(socialHanakoCoverflowScrollTimer);
    socialHanakoCoverflowScrollTimer = window.setTimeout(selectCenteredSocialHanakoTeacher, 140);
  }, { passive: true });
  document.querySelector("#snsTeacherCoverflowPrev")?.addEventListener("click", () => stepSocialHanakoTeacher(-1));
  document.querySelector("#snsTeacherCoverflowNext")?.addEventListener("click", () => stepSocialHanakoTeacher(1));
  window.addEventListener("resize", paintSocialHanakoTeacherCoverflow, { passive: true });
  document.querySelector("#rerollSnsHanakoTeacher")?.addEventListener("click", () => {
    activateSocialHanakoTeacher("random", true, true);
  });
  document.querySelector("#snsIncludeHanakoTeacher")?.addEventListener("change", () => {
    updateSocialHanakoTeacherPreview();
    markSocialGeminiPromptStale();
  });
  resolveSocialHanakoTeacher(false);
  updateSocialHanakoTeacherPreview();
  syncSocialHanakoTeacherCoverflow(true);
}

function getSocialHanakoTeacherItems() {
  return getHanakoTeacherCoverflowItems().map((item) => item.id === "random"
    ? { ...item, avatar: currentSocialHanakoTeacher.avatar }
    : item);
}

function activateSocialHanakoTeacher(mode, scrollSelected = true, forceRandom = false) {
  const validModes = new Set(getSocialHanakoTeacherItems().map((item) => item.id));
  socialHanakoTeacherMode = validModes.has(mode) ? mode : "random";
  const select = document.querySelector("#snsHanakoTeacher");
  if (select) select.value = socialHanakoTeacherMode;
  resolveSocialHanakoTeacher(forceRandom);
  currentSocialHanakoComment = "";
  updateSocialHanakoTeacherPreview();
  syncSocialHanakoTeacherCoverflow(scrollSelected);
  markSocialGeminiPromptStale();
}

function stepSocialHanakoTeacher(direction) {
  const items = getSocialHanakoTeacherItems();
  const currentIndex = Math.max(0, items.findIndex((item) => item.id === socialHanakoTeacherMode));
  const nextIndex = Math.min(items.length - 1, Math.max(0, currentIndex + direction));
  activateSocialHanakoTeacher(items[nextIndex].id, true, items[nextIndex].id === "random");
}

function selectCenteredSocialHanakoTeacher() {
  if (Date.now() < socialHanakoCoverflowIgnoreUntil) return;
  const coverflow = document.querySelector("#snsTeacherCoverflow");
  if (!coverflow) return;
  const center = coverflow.getBoundingClientRect().left + coverflow.clientWidth / 2;
  const cards = [...coverflow.querySelectorAll("[data-sns-teacher-mode]")];
  const nearest = cards.reduce((best, card) => {
    const rect = card.getBoundingClientRect();
    const distance = Math.abs(rect.left + rect.width / 2 - center);
    return !best || distance < best.distance ? { card, distance } : best;
  }, null);
  const mode = nearest?.card.dataset.snsTeacherMode;
  if (mode && mode !== socialHanakoTeacherMode) activateSocialHanakoTeacher(mode, false, mode === "random");
}

function syncSocialHanakoTeacherCoverflow(scrollSelected = false) {
  const coverflow = document.querySelector("#snsTeacherCoverflow");
  if (!coverflow) return;
  const randomImage = coverflow.querySelector('[data-sns-teacher-mode="random"] img');
  const appearanceImage = coverflow.querySelector('[data-sns-teacher-mode="appearance"] img');
  const appearanceItem = getSocialHanakoTeacherItems().find((item) => item.id === "appearance");
  if (randomImage) randomImage.src = currentSocialHanakoTeacher.avatar;
  if (appearanceImage && appearanceItem) appearanceImage.src = appearanceItem.avatar;
  coverflow.querySelectorAll("[data-sns-teacher-mode]").forEach((card) => {
    const selected = card.dataset.snsTeacherMode === socialHanakoTeacherMode;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-selected", String(selected));
  });
  if (scrollSelected) {
    const selectedCard = coverflow.querySelector(`[data-sns-teacher-mode="${socialHanakoTeacherMode}"]`);
    if (selectedCard) {
      socialHanakoCoverflowIgnoreUntil = Date.now() + 550;
      selectedCard.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }
  window.requestAnimationFrame(paintSocialHanakoTeacherCoverflow);
}

function paintSocialHanakoTeacherCoverflow() {
  const coverflow = document.querySelector("#snsTeacherCoverflow");
  if (!coverflow) return;
  const bounds = coverflow.getBoundingClientRect();
  const center = bounds.left + bounds.width / 2;
  coverflow.querySelectorAll("[data-sns-teacher-mode]").forEach((card) => {
    const rect = card.getBoundingClientRect();
    const offset = Math.max(-2.2, Math.min(2.2, (rect.left + rect.width / 2 - center) / Math.max(82, rect.width)));
    const distance = Math.abs(offset);
    card.style.setProperty("--cover-rotate", `${offset * -24}deg`);
    card.style.setProperty("--cover-scale", String(Math.max(0.72, 1 - distance * 0.16)));
    card.style.setProperty("--cover-opacity", String(Math.max(0.48, 1 - distance * 0.22)));
    card.style.setProperty("--cover-z", String(Math.round(20 - distance * 5)));
  });
}

function resolveSocialHanakoTeacher(forceRandom = false) {
  if (socialHanakoTeacherMode === "appearance") {
    const appearanceItem = getHanakoTeacherCoverflowItems().find((item) => item.id === "appearance");
    currentSocialHanakoTeacher = {
      id: "appearance",
      name: "アプリと同じハナコ先生",
      avatar: appearanceItem?.avatar || hanakoTeacherGuides[0].avatar,
      tone: "選んだアプリアイコンでSNS投稿を解説",
    };
  } else if (socialHanakoTeacherMode === "random") {
    if (forceRandom || !currentSocialHanakoTeacher) {
      const candidates = hanakoTeacherGuides.filter((guide) => guide.id !== currentSocialHanakoTeacher?.id);
      currentSocialHanakoTeacher = candidates[Math.floor(Math.random() * candidates.length)] || hanakoTeacherGuides[0];
    }
  } else {
    currentSocialHanakoTeacher = hanakoTeacherGuides.find((guide) => guide.id === socialHanakoTeacherMode) || hanakoTeacherGuides[0];
  }
  return currentSocialHanakoTeacher;
}

function chooseSocialHanakoComment(data, force = false) {
  if (!force && currentSocialHanakoComment) return currentSocialHanakoComment;
  const product = data.context.product;
  const labels = data.labels || {};
  const productText = `${product.name || ""} ${product.hook || ""} ${product.details?.color || ""} ${product.details?.material || ""}`;
  const categoryComments = {
    トップス: ["主役トップスの日は、小物を静かに。", "顔まわりの見せ場は、一つで十分よ。", "トップスが華やかなら、色数はしぼって。", "裾の入れ方で、重心はちゃんと変わるわ。", "甘いトップスには、直線を一つ足して。", "首もとを見せると、全身まで軽くなる。", "袖が主役なら、アクセは少し休ませて。", "ボトムは競わせず、きれいに支えて。"],
    ワンピース: ["一枚で決まる日は、小物で欲張らない。", "ワンピが主役。あとは軽く整えれば十分。", "丈と靴のつながりまで見て、完成よ。", "甘いワンピほど、バッグは端正に。", "ウエスト位置が、全身の印象を決めるわ。", "柄ワンピの日は、色を増やしすぎない。", "羽織りは隠すためじゃなく、縦線づくり。", "一枚の強さを、小物で邪魔しないで。"],
    アウター: ["羽織りは、前を開けると縦長になるわ。", "アウターが主役なら、中は静かに。", "重ね着の日ほど、色数は少なくして。", "肩の位置が合うだけで、高見えするわ。", "長い羽織りには、小さなバッグが効く。", "防寒だけで終わらせない。輪郭も整えて。", "中の甘さを、羽織りでほどよく締めて。", "脱いだ後まで考えて、コーデは完成よ。"],
    スカート: ["揺れ感を生かして、上半身はすっきり。", "甘いスカートほど、足もとは大人に。", "腰位置をぼかさない。それだけで整うわ。", "広がる形なら、トップスは短めが正解。", "丈の終わりと靴の色を、きれいにつないで。", "柄スカートの日は、上を無地で休ませて。", "ふんわり感は一か所。それで十分かわいい。", "スカートの動きを、バッグで止めないで。"],
    パンツ: ["直線を一本入れると、甘さが整うわ。", "パンツの落ち感を、トップスで隠さないで。", "足もとまで色をつなぐと、すらっと見える。", "腰位置を上げれば、脚の印象は変わるわ。", "太めパンツには、上半身の抜けが必要。", "甘いトップスを、大人に戻す名脇役よ。", "丈が合わないと全部惜しい。靴まで確認して。", "きれいな縦線は、アクセより効くわ。"],
    バッグ: ["バッグは穴埋めじゃない。配色の仕上げよ。", "主役服を邪魔しないサイズ感が正解。", "小物の色は、全身から一色拾いなさい。", "丸いバッグなら、服に直線を残して。", "かっちりバッグで、甘さを大人に戻して。", "バッグの大きさで、全身の重心は変わる。", "差し色は一つ。バッグなら失敗しにくい。", "持ち手まで見て。そこに高見えが出るわ。"],
    シューズ: ["コーデの性格は、最後に靴が決めるわ。", "足もとが軽いと、全身までこなれて見える。", "歩けない靴では、かわいさも続かないわ。", "靴の色をつなげると、脚がすっきり見える。", "甘い服には、少し端正な靴を合わせて。", "重い足もとは、コーデまで沈ませるわ。", "つま先の形で、大人っぽさを調整して。", "迷ったらバッグより、先に靴を決めて。"],
    アクセサリー: ["きらめきは一か所。全部盛りはお休み。", "顔まわりに光を足して、視線を上へ。", "主役服の日は、アクセは名脇役でいて。", "大ぶりを選ぶなら、ほかは静かに。", "首もとが華やかなら、耳元は引き算。", "小さな光ほど、上品に効くのよ。", "アクセは足し算じゃなく、視線の案内役。", "服の金具と色をそろえると、まとまるわ。"],
    "ホテル・旅行": ["映えより先に、移動と立地を確認して。", "旅は予定を詰めすぎないほうが、おしゃれよ。", "写真の印象だけで決めず、条件も見てね。", "朝食より先に、キャンセル条件も確認して。", "駅近の価値は、帰り道に分かるものよ。", "安さだけで選ぶと、移動で疲れるわ。", "眺望は部屋タイプまで見て、初めて確実。", "旅のかわいさは、無理のない予定から。"],
  };
  const common = ["かわいいは足し算じゃない。主役を決めて。", "見せ場は一つ。余白までがおしゃれよ。", "迷ったら色を減らす。それが近道。", "全部を語らない。ひとつ伝われば強いわ。", "似合う理由を一つ言えたら、もう十分。", "主役と脇役、両方を目立たせないで。"];
  const contextual = [];
  if (data.context.platform === "Instagram") contextual.push("保存したくなるのは、まねできる一工夫よ。", "表紙は欲張らない。答えを一つ見せて。");
  if (data.context.platform === "Threads") contextual.push("うまい話より、朝の本音がいちばん届くわ。", "完璧より共感。小さな失敗も味方よ。");
  if (data.context.platform === "X") contextual.push("結論は先に。役立つ理由を一つ添えて。", "三秒で伝わらないなら、情報を減らして。");
  if (/保存/.test(labels.goal || "")) contextual.push("保存されるのは、明日まねできる投稿よ。");
  if (/返信|コメント/.test(labels.goal || "")) contextual.push("答えやすい二択なら、会話が始まるわ。");
  if (/クリック|ROOM|購入/.test(`${labels.goal || ""} ${labels.optimization || ""}`)) contextual.push("売る前に、選ぶ理由を一つ渡しなさい。");
  if (/体型|バランス/.test(labels.fashionConcern || "")) contextual.push("隠すより重心。視線を上へ運んで。");
  if (/甘すぎ|子ども/.test(labels.fashionConcern || "")) contextual.push("甘さは一か所。直線を一つ足して。");
  if (/気温|雨|汗/.test(labels.fashionConcern || "")) contextual.push("我慢はおしゃれじゃない。天気も味方に。");
  if (/着回し/.test(labels.fashionPriority || "")) contextual.push("三通り浮かぶ服なら、出番は増えるわ。");
  if (/高見え/.test(labels.fashionPriority || "")) contextual.push("高見えは値段より、色数とサイズ感よ。");
  if (/写真/.test(labels.fashionPriority || "")) contextual.push("写真では、見せ場を一つに絞りなさい。");
  if (/黒|ブラック|ネイビー/.test(productText)) contextual.push("濃色は重くしない。どこかに白を残して。");
  if (/白|アイボリー|ベージュ|淡色/.test(productText)) contextual.push("淡色の日こそ、輪郭を一つ締めて。");
  if (/リボン|フリル|レース/.test(productText)) contextual.push("甘い要素は主役だけ。小物は静かに。");
  const options = [...new Set([...contextual, ...(categoryComments[product.category] || common), ...common])];
  const candidates = options.filter((comment) => !recentSocialHanakoComments.includes(comment));
  currentSocialHanakoComment = candidates[Math.floor(Math.random() * candidates.length)] || options[0];
  recentSocialHanakoComments = [currentSocialHanakoComment, ...recentSocialHanakoComments].slice(0, 12);
  return currentSocialHanakoComment;
}

function updateSocialHanakoTeacherPreview() {
  const enabled = document.querySelector("#snsIncludeHanakoTeacher")?.checked !== false;
  const preview = document.querySelector("#snsHanakoTeacherPreview");
  if (preview) preview.classList.toggle("disabled", !enabled);
  const avatar = document.querySelector("#snsHanakoTeacherAvatar");
  const name = document.querySelector("#snsHanakoTeacherName");
  const comment = document.querySelector("#snsHanakoTeacherComment");
  if (avatar) avatar.src = currentSocialHanakoTeacher.avatar;
  if (name) name.textContent = currentSocialHanakoTeacher.name;
  if (comment) comment.textContent = enabled ? (currentSocialHanakoComment || "商品に合うひとことを自動で作ります") : "今回は画像へ表示しません";
}

function downloadSocialHanakoTeacher() {
  const link = document.createElement("a");
  link.href = currentSocialHanakoTeacher.avatar;
  link.download = `${currentSocialHanakoTeacher.id || "hanako-teacher"}.png`;
  link.click();
}

function buildSocialGeminiCopyPrompt({ context: c, labels, currentDraft }) {
  const product = c.product;
  const details = product.details || {};
  const supportingProducts = c.products
    .slice(1)
    .filter((item) => (item.category === "ホテル・旅行") === c.isTravel)
    .slice(0, 3)
    .map((item) => `・${item.name} / ${item.category} / ${item.price || "価格未設定"}`)
    .join("\n") || "なし";
  const platformInstruction = {
    Instagram: `保存したくなるInstagram投稿にする。12〜18文字の表紙見出し、7枚以内のスライド構成、完成キャプションを作る。キャプション冒頭2行で悩みと読む理由を示し、共感、解決、具体的な選び方、正直な確認点、保存CTAの順にする。1段落は1〜3文、ハッシュタグは関連性の高いものを5〜8個。絵文字は表紙・各見出し・保存CTAの目印として6〜12個使い、本文の全行には付けない。`,
    Threads: `自然なThreads投稿にする。礼儀正しい女子大生の具体的な朝・大学・カフェなどの一場面から入り、観察、本音、小さな気づきをつなぐ。80〜180文字程度、短い段落、売り込みは最後の1行だけ。誰でも答えられる曖昧な質問ではなく、A/Bや具体的な経験を聞く。絵文字は感情・問い・保存の目印として2〜4個、ハッシュタグは0〜2個。`,
    X: `役に立つX投稿を1本作る。120〜240文字以内で結論を先に置き、比較、ランキング、速報、着回し、買う前チェックのどれか一つに絞る。数字またはA/B、具体的な確認点を入れ、1行を短くする。絵文字は冒頭・比較軸・CTAの視線誘導として2〜5個、URLや導線より本文の情報価値を優先し、ハッシュタグは0〜2個。`,
  }[c.platform];
  return `あなたは「おしゃれ研究家ハナコ」。礼儀正しく、ファッションが大好きな女子大生です。次の選択内容をすべて参考に、${c.platform}で共感され、保存・返信・クリックにつながりやすい完成投稿文を1案作ってください。

【${c.platform}の書き方】
${platformInstruction}

【企画】
切り口: ${c.angle}
届けたい相手: ${labels.audience}
目的: ${labels.goal}
最適化: ${labels.optimization}
寄り添う悩み: ${labels.emotion}
冒頭のつかみ: ${labels.hook}
反応を生む構成: ${labels.viralPattern}
季節: ${c.seasonLabel}
文体: ${labels.tone}
商品との関係: ${labels.ownership}
今回だけ入れたい情報: ${c.brief || "なし"}

【商品・施設情報】
名前: ${product.name}
カテゴリ: ${product.category}
価格メモ: ${product.price || "未設定"}
ブランド: ${details.brand || "未設定"}
色: ${details.color || "未設定"}
素材: ${details.material || "未設定"}
推しポイント: ${product.hook || "未設定"}
着ていく場面: ${c.isTravel ? labels.travelCompanion : labels.fashionOccasion}
重視すること: ${c.isTravel ? labels.travelPriority : labels.fashionPriority}
気になるポイント: ${c.isTravel ? "料金・空室・条件は最新情報を確認" : labels.fashionConcern}

比較・ランキング企画で使える候補:
${supportingProducts}

【アプリで作った下書き】
${currentDraft || "下書きなし。上の情報から新しく作る"}

【作成方法】
・内部で冒頭フックを30案、構成を12案考え、媒体と目的に最も合う1案を選ぶ
・選んだ理由や検討過程、別案は出力しない
・第1校正で、商品情報にない使用感・効果・数字・人気・体験をすべて削る
・第2校正で、意味の通らない言葉、AIらしい総括、同じ語尾、抽象的なほめ言葉、場面と商品の不一致を直す
・第3校正で、媒体の文字量、冒頭の停止力、具体性、共感、信頼、CTA、広告表記、過去によくある表現との重複を確認する
・各校正で弱い場合は内部で書き直し、自然に声に出して読める完成稿だけを返す

【文章の絶対条件】
・下書きの良い部分は生かすが、そのまま言い換えるだけにしない
・広告文から始めず、読者が実際に経験する朝、鏡、玄関、移動、授業、仕事、カフェなど、今回の条件に合う具体的な一瞬から始める。ただし無関係な場面は作らない
・短い文、理由を説明する中くらいの文、余韻を残す一文を混ぜ、全文を同じ長さにしない
・同じ語尾を3文以上続けない。「おすすめです」「ぴったりです」「要チェック」を便利な結論として使わない
・「〜をご紹介します」「いかがでしたか」「ぜひチェックしてみてください」「魅力が満載」「間違いなし」など、AIや広告に見えやすい定型文を使わない
・読者の気持ちを勝手に断定せず、「私はこう見た」「ここは確認したい」のように観察と判断を分ける
・商品カテゴリと説明対象を一致させる。バッグへ顔まわり、靴へ収納力など、別カテゴリの説明を結びつけない
・同じ商品でも前回と違う場面、比較軸、言葉のリズムを選び、同じ冒頭やCTAを繰り返さない
・抽象的な「かわいい」「高見え」を使う場合は、直後に色、形、丈、素材、小物、サイズなど確認できる理由を添える
・一投稿に見せ場は一つ。悩み、商品情報、CTAを全部同じ強さで叫ばず、読む順番に強弱をつける
・最初の1〜2行で「自分のことかも」と思える具体的な場面か悩みを示す
・商品名より先に、読者が止まる情景・違和感・結論のどれかを置く
・悩み → 気づき → この商品が候補になる理由 → 次の行動、の流れにする
・くすっとする面白さと愛のある鋭いひと言を少しだけ入れる
・面白さは大げさな比喩や流行語ではなく、服選びで本当に起こる小さな迷いや観察から作る
・商品ページで確認できた事実と、話し手の感想・予想を混同しない
・同じ意味の言葉、同じCTA、同じ商品名を何度も繰り返さない
・絵文字には「感情」「情報の区切り」「次の行動」の役割を持たせ、飾りとして連続させない
・同じ絵文字を繰り返さず、1行に絵文字を2個以上並べない
・広告表記、URL、ハッシュタグの行には絵文字を付けない
・上から目線、乱暴な呼びかけ、煽り、誇大表現、不自然な若者言葉を使わない
・購入や使用を確認できない場合は、使ったように断定しない
・価格、在庫、サイズ、効果、人気、順位を作らない
・根拠のない数字、「○選」「○パターン」、意味の曖昧な見出しを作らない。数を書く場合は、実際に本文で同じ数の項目を示す
・完成後に声に出して読んだつもりで、助詞抜け、語順の不自然さ、意味不明語、同じ意味の反復を直す
・「バズる」「AIが作成」「プロンプト」という言葉を投稿文に書かない
・商用投稿として「${c.disclosure}」を自然に入れる
・リンク導線は次を使う:
${c.roomLine}

前置き、解説、採点を付けず、完成した${c.platform}投稿文だけを出力してください。`;
}

function setSocialGeminiStatus(message) {
  const target = document.querySelector("#snsGeminiStatus");
  if (target) target.textContent = message;
}

function setSocialGeminiMode() {}

function copyAndOpenSocialGemini(mode = "image") {
  const prompt = (mode === "copy" ? snsGeminiCopyPrompt : snsGeminiPrompt)?.value.trim();
  if (!prompt) return showToast("先にプロンプトを作ってください");
  socialGeminiAwaitingReturn = true;
  copyText(prompt);
  openGeminiDestination();
  renderSocialGeminiProgress();
}

function handleSocialGeminiReturn() {
  if (!socialGeminiAwaitingReturn) return;
  socialGeminiAwaitingReturn = false;
  const details = document.querySelector("#snsGeminiResultDetails");
  if (details) details.open = true;
  setSocialGeminiStatus("結果を貼り付け");
  renderSocialGeminiProgress();
}

async function previewSocialGeminiImage(event) {
  const file = event.target.files?.[0];
  const preview = document.querySelector("#snsGeneratedImagePreview");
  const downloadButton = document.querySelector("#downloadSocialGeminiImage");
  if (!file) {
    socialGeminiGeneratedImageDataUrl = "";
    preview.hidden = true;
    preview.innerHTML = "";
    downloadButton.disabled = true;
    return;
  }
  socialGeminiGeneratedImageDataUrl = await readOriginalFileAsDataUrl(file);
  socialGeminiGeneratedImageExtension = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
  preview.hidden = false;
  preview.innerHTML = `<img src="${socialGeminiGeneratedImageDataUrl}" alt="AIで作った${escapeHtml(activePlatform)}投稿画像">`;
  downloadButton.disabled = false;
  document.querySelector("#snsGeminiResultDetails").open = true;
  setSocialGeminiStatus("完成画像あり");
  renderSocialGeminiProgress();
  showToast("完成画像を読み込みました");
}

function applySocialGeminiCopy() {
  const result = document.querySelector("#snsGeminiResult")?.value.trim();
  if (!result) return showToast("AIの完成投稿文を貼り付けてください");
  postOutput.value = result;
  lastGenerated = result;
  document.querySelector("#outputMeta").textContent = `${activePlatform} / ${getSelectedAiName()}仕上げを反映`;
  renderChecks(result);
  rememberGeneration(result);
  setSocialGeminiStatus("完成文を反映済み");
  renderSocialGeminiProgress();
  postOutput.scrollIntoView({ behavior: "smooth", block: "center" });
  showToast("完成投稿文へ反映しました");
}

function downloadSocialGeminiImage() {
  if (!socialGeminiGeneratedImageDataUrl) return showToast("先に完成画像を添付してください");
  const link = document.createElement("a");
  link.href = socialGeminiGeneratedImageDataUrl;
  link.download = `hanako-${activePlatform.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.${socialGeminiGeneratedImageExtension}`;
  link.click();
}

function markSocialGeminiPromptStale(event) {
  if (event?.target?.closest?.(".sns-gemini-tools")) return;
  socialReferenceBoardDataUrl = "";
  if (snsGeminiPrompt?.value.trim() || snsGeminiCopyPrompt?.value.trim()) {
    socialGeminiPromptNeedsRefresh = true;
    setSocialGeminiStatus("条件変更あり");
    renderSocialGeminiProgress();
  }
}

function renderSocialGeminiProgress() {
  const product = state.products.find((item) => item.id === selectedProduct?.value) || state.products[0];
  const hasProduct = Boolean(product);
  const hasPrompt = Boolean(snsGeminiPrompt?.value.trim() && snsGeminiCopyPrompt?.value.trim()) && !socialGeminiPromptNeedsRefresh;
  const hasReturnedResult = Boolean(socialGeminiGeneratedImageDataUrl || document.querySelector("#snsGeminiResult")?.value.trim());
  const steps = {
    product: hasProduct,
    create: hasPrompt,
    return: hasReturnedResult,
  };
  document.querySelectorAll("[data-sns-step]").forEach((step) => {
    const key = step.dataset.snsStep;
    step.classList.toggle("complete", steps[key]);
    step.classList.remove("current");
  });
  const currentKey = !hasProduct ? "product" : !hasPrompt ? "create" : !hasReturnedResult ? "return" : "return";
  document.querySelector(`[data-sns-step="${currentKey}"]`)?.classList.add("current");
  const next = document.querySelector("#snsGeminiNextAction");
  if (!next) return;
  next.textContent = !hasProduct
    ? "先に紹介する商品を選んでください"
    : socialGeminiPromptNeedsRefresh
      ? "条件が変わりました。画像か投稿文をもう一度作ってください"
      : !hasPrompt
        ? `画像か投稿文を選ぶと、コピーして${getSelectedAiName()}が開きます`
        : !hasReturnedResult
          ? `${getSelectedAiName()}で作成後、この画面へ戻って結果を貼り付けます`
          : "結果を確認して、完成稿への反映または画像保存を進めてください";
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

function resolveCategoryStyleKey(category) {
  if (["ニット"].includes(category)) return "トップス";
  if (["カーディガン", "レインウェア"].includes(category)) return "アウター";
  if (["オールインワン", "セットアップ", "スーツ・フォーマル", "ブライダル", "ルームウェア", "水着・水際", "浴衣", "マタニティ", "スポーツウェア"].includes(category)) return "ワンピース";
  if (["デニム"].includes(category)) return "パンツ";
  if (["ヘアアクセサリー", "帽子", "腕時計", "ストール・マフラー", "ベルト", "サングラス", "レッグウェア", "傘", "財布", "ファッション小物"].includes(category)) return "アクセサリー";
  if (["インナー", "ランジェリー"].includes(category)) return "トップス";
  return category;
}

function generatePremiumCopy(context) {
  const candidates = buildEditorialCandidateContexts(context)
    .map((candidateContext) => ({
      context: candidateContext,
      text: generatePremiumCopyCandidate(candidateContext),
    }));
  const uniqueCandidates = [...new Map(candidates.map((candidate) => [candidate.text, candidate])).values()];
  return uniqueCandidates
    .map(({ text, context: candidateContext }, index) => ({
      text,
      score: scorePlatformCopy(text, candidateContext) + index * 0.001,
    }))
    .sort((a, b) => b.score - a.score)[0].text;
}

function buildEditorialCandidateContexts(context) {
  const hookTypes = ["scene", "confession", "specific", "contrarian", "question", "whisper"];
  const platformPatterns = {
    X: ["comparison", "checklist", "mistake", "ranking", "costperwear", "beforeafter"],
    Threads: ["microstory", "commentreply", "unpopular", "beforeafter", "mistake", "comparison"],
    Instagram: ["checklist", "beforeafter", "ranking", "comparison", "mistake", "costperwear"],
  };
  const goalPatterns = {
    save: ["checklist", "comparison", "ranking", "beforeafter"],
    room: ["comparison", "costperwear", "mistake", "checklist"],
    reply: ["microstory", "commentreply", "unpopular", "comparison"],
    follow: ["microstory", "beforeafter", "ranking", "checklist"],
  };
  const learned = context.learnedPattern?.sampleSize >= 2 ? [context.learnedPattern.pattern] : [];
  const patterns = [...new Set([
    context.viralPattern,
    ...learned,
    ...(goalPatterns[context.goal] || []),
    ...(platformPatterns[context.platform] || platformPatterns.X),
  ])];
  return Array.from({ length: 72 }, (_, index) => ({
    ...context,
    hookType: hookTypes[index % hookTypes.length],
    viralPattern: patterns[index % patterns.length],
    seed: context.seed + index * 7919,
    candidateIndex: index,
  }));
}

function generatePremiumCopyCandidate(context) {
  let result;
  const isThreadsSet = context.platform === "Threads" && ["1日5本セット", "骨格ウェーブ目線"].includes(context.angle);
  if (context.product.category === "ホテル・旅行") result = generateTravelCopy(context);
  else if (context.platform === "Instagram") result = generatePremiumInstagram(context);
  else if (context.platform === "Threads") result = generatePremiumThreads(context);
  else result = generatePremiumX(context);
  if (!context.isTravel && !isThreadsSet) result = enrichFashionCopy(result, context);
  if (!isThreadsSet) result = applyViralPattern(result, context);
  if (!isThreadsSet) result = weaveEmpathy(result, context);
  if (context.platform === "Instagram") result += originalContentDirections(context);
  if (context.platform === "X" && result.length > 240) result = buildCompactXCopy(context);
  if (context.platform === "Threads" && result.length > 320 && !["1日5本セット", "骨格ウェーブ目線"].includes(context.angle)) result = buildCompactThreadsCopy(context);
  result = decorateSocialCopy(result, context);
  if (context.platform === "X" && result.length > 240) result = decorateSocialCopy(buildCompactXCopy(context), context);
  return polishHumanCopy(cleanGeneratedCopy(result), context);
}

function scorePlatformCopy(text, context) {
  let score = 0;
  const firstLine = text.trim().split("\n").find(Boolean) || "";
  const hashtags = (text.match(/#[^\s#]+/g) || []).length;
  const ctas = (text.match(/保存|ROOM|楽天トラベル|教えて|どちら|コメント|フォロー|見返/g) || []).length;
  const emojiCount = countSocialEmoji(text);
  const readableLines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const longLines = readableLines.filter((line) => line.length > 70).length;
  if (firstLine.length >= 8 && firstLine.length <= 34) score += 14;
  if (firstLine.length > 0 && firstLine.length <= 24) score += 5;
  if (/サイズ|素材|着丈|ウエスト|価格|レビュー|アクセス|客室|食事|コーデ|比較|チェック/.test(text)) score += 13;
  if (/迷|不安|正直|気持ち|安心|自信|悩|あるある|わかる/.test(text)) score += 11;
  if (/確認|個人差|変わる|購入前|最新|気になる/.test(text)) score += 9;
  if (/通学|大学|通勤|デート|カフェ|休日|旅行|推し活|イベント/.test(text)) score += 9;
  if (/保存|ROOM|教えて|どちら|コメント|フォロー|見返/.test(text)) score += 10;
  if (!/絶対|100%|最安|誰でも|優勝|爆売れ|買わないと損/.test(text)) score += 10;
  const cannedPhrases = (text.match(/ご紹介します|魅力が満載|いかがでしたか|ぜひチェック|間違いなし|要チェック/g) || []).length;
  score -= cannedPhrases * 11;
  const categoryMismatch = {
    バッグ: /顔まわり|着丈|袖丈|足幅/,
    シューズ: /収納力|持ち手|顔まわり|袖/,
    アクセサリー: /着丈|股下|収納力|歩きやすさ/,
    トップス: /収納力|持ち手|足幅/,
  }[context.product.category];
  if (categoryMismatch?.test(text)) score -= 18;
  if (/PR|広告|アフィリエイト/.test(text)) score += 6;
  if (text.includes(shortName(context.product.name).slice(0, 10))) score += 7;
  if (/正直|ただし|気になる点|確認したい/.test(text) && /サイズ|素材|着丈|価格|レビュー|アクセス|客室/.test(text)) score += 7;
  if (ctas === 1 || ctas === 2) score += 6;
  if (ctas >= 5) score -= 8;
  if (longLines === 0) score += 8;
  else score -= longLines * 4;
  if (context.goal === "save" && /保存|見返|チェック|比較/.test(text)) score += 8;
  if (context.goal === "reply" && /ですか|ますか|どちら|教えて|A｜|B｜/.test(text)) score += 8;
  if (context.goal === "room" && /ROOM|楽天トラベル/.test(text)) score += 8;
  if (context.goal === "follow" && /また見|フォロー|研究/.test(text)) score += 8;
  if (context.platform === "Instagram") {
    if (/【表紙】/.test(text) && /【キャプション】/.test(text)) score += 16;
    if ((text.match(/【\d+枚目/g) || []).length >= 4 || /リール設計/.test(text)) score += 8;
    if (/保存/.test(text) && /選び方|チェック|比較|まとめ/.test(text)) score += 8;
    if ((text.match(/【\d+枚目/g) || []).length > 7) score -= 8;
    if (emojiCount >= 5 && emojiCount <= 12) score += 10;
    if (emojiCount > 16) score -= (emojiCount - 16) * 3;
  }
  if (context.platform === "Threads") {
    if (/ですか|ますか|よね|かも|気がします/.test(text)) score += 10;
    if (/今日|朝|帰り|授業|カフェ|鏡|クローゼット|電車/.test(text)) score += 9;
    if (/私は|私も|つい|ふと|最近/.test(text)) score += 7;
    if (!/おすすめです。おすすめ|今すぐチェック/.test(text)) score += 6;
    if (/同じ人いますか[？?]?$/.test(text.trim())) score -= 7;
    if (text.length >= 100 && text.length <= 260) score += 15;
    if (text.length > 360) score -= 20;
    if (emojiCount >= 2 && emojiCount <= 4) score += 10;
    if (!["1日5本セット", "骨格ウェーブ目線"].includes(context.angle) && emojiCount > 6) score -= (emojiCount - 6) * 4;
  }
  if (context.platform === "X") {
    if (text.length >= 45 && text.length <= 180) score += 28;
    else if (text.length <= 240) score += 22;
    else if (text.length <= 280) score -= 5;
    else score -= 40;
    if (/\n・|\n1\.|A｜|B｜/.test(text)) score += 8;
    if (hashtags <= 2) score += 6;
    else score -= (hashtags - 2) * 5;
    if (/保存|比較|確認|どちら/.test(text)) score += 5;
    if (emojiCount >= 2 && emojiCount <= 5) score += 10;
    if (emojiCount > 6) score -= (emojiCount - 6) * 5;
  }
  score -= repeatedLinePenalty(text);
  score += scoreHumanLanguage(text, context);
  return score;
}

function scoreHumanLanguage(text, context) {
  let score = 0;
  const lines = String(text || "").split("\n").map((line) => line.trim()).filter(Boolean);
  const prose = lines.filter((line) => !/^(?:【|#|※|https?:|[・●✓]|\d+[.．])/.test(line));
  const sentenceLengths = prose.flatMap((line) => line.split(/[。！？!?]/).map((part) => part.trim()).filter(Boolean).map((part) => part.length));
  const hasShort = sentenceLengths.some((length) => length >= 4 && length <= 16);
  const hasMedium = sentenceLengths.some((length) => length >= 17 && length <= 38);
  const hasLong = sentenceLengths.some((length) => length >= 39 && length <= 62);
  if (hasShort && hasMedium) score += 10;
  if (hasMedium && hasLong) score += 5;
  if (sentenceLengths.length >= 3 && new Set(sentenceLengths).size >= Math.min(4, sentenceLengths.length)) score += 6;

  const concreteSignals = (text.match(/朝|鏡|玄関|電車|授業|講義|通学|通勤|帰り|カフェ|雨|気温|丈|袖|襟|素材|色|重さ|収納|サイズ|足幅|立地|駅|客室|朝食|キャンセル/g) || []).length;
  score += Math.min(14, concreteSignals * 2);
  if (/私は|正直|迷|気にな|つい|でも|ただ|だから|実は/.test(text)) score += 8;
  if (/理由|なぜ|ので|から|ため/.test(text)) score += 5;
  if (/一方で|ただし|とはいえ|気になる点|確認したい/.test(text)) score += 6;

  const genericPhrases = (text.match(/おすすめです|ぴったりです|魅力的です|素敵です|要チェック|チェックしてみて|間違いなし|大活躍|マストバイ/g) || []).length;
  score -= genericPhrases * 7;
  const hype = (text.match(/絶対|神アイテム|優勝|爆売れ|買わないと損|人生変わる|最強|完璧/g) || []).length;
  score -= hype * 12;

  const endings = prose
    .flatMap((line) => line.split(/(?<=[。！？!?])/))
    .map((sentence) => sentence.trim().match(/(です|ます|でした|ました|かも|よね|だと思う|ください|しよう)[。！？!?]?$/)?.[1])
    .filter(Boolean);
  const endingCounts = endings.reduce((counts, ending) => ({ ...counts, [ending]: (counts[ending] || 0) + 1 }), {});
  const repeatedEnding = Math.max(0, ...Object.values(endingCounts)) - 2;
  score -= Math.max(0, repeatedEnding) * 4;

  const recent = (state.generatorHistory || []).filter((item) => !item.platform || item.platform === context.platform).slice(0, 12);
  const currentOpening = prose[0] || lines[0] || "";
  const maxOpeningSimilarity = recent.reduce((max, item) => Math.max(max, characterSimilarity(currentOpening, item.opening || "")), 0);
  score -= Math.round(maxOpeningSimilarity * 24);
  const currentExcerpt = String(text || "").slice(0, 500);
  const maxBodySimilarity = recent.reduce((max, item) => Math.max(max, characterSimilarity(currentExcerpt, item.excerpt || item.opening || "")), 0);
  score -= Math.round(maxBodySimilarity * 18);
  return score;
}

function characterSimilarity(left, right) {
  const grams = (value) => {
    const normalized = String(value || "").replace(/[\s。、！？!?「」『』（）()【】#]/g, "");
    const result = new Set();
    for (let index = 0; index <= normalized.length - 3; index += 1) result.add(normalized.slice(index, index + 3));
    return result;
  };
  const a = grams(left);
  const b = grams(right);
  if (!a.size || !b.size) return 0;
  let shared = 0;
  a.forEach((value) => { if (b.has(value)) shared += 1; });
  return shared / Math.max(a.size, b.size);
}

function repeatedLinePenalty(text) {
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length >= 12 && !line.startsWith("【"));
  const seen = new Set();
  let repeats = 0;
  lines.forEach((line) => {
    const key = line.replace(/[。、！？!?]/g, "").slice(0, 32);
    if (seen.has(key)) repeats += 1;
    seen.add(key);
  });
  return repeats * 7;
}

function cleanGeneratedCopy(text) {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  const result = [];
  let previous = "";
  let disclosureSeen = false;
  lines.forEach((line) => {
    const trimmed = line.trim();
    const isDisclosure = /^※.*(?:アフィリエイト|広告|PR)/i.test(trimmed);
    if (isDisclosure && disclosureSeen) return;
    if (isDisclosure) disclosureSeen = true;
    if (trimmed && trimmed === previous && !trimmed.startsWith("【")) return;
    result.push(line.replace(/[ \t]+$/g, ""));
    if (trimmed) previous = trimmed;
  });
  return result.join("\n").replace(/\n{4,}/g, "\n\n\n").trim();
}

function polishHumanCopy(text, context) {
  let result = String(text || "")
    .replace(/おすすめです。おすすめです。/g, "候補に入れたいです。")
    .replace(/ぴったりです。ぴったりです。/g, "合わせやすそうです。")
    .replace(/ぜひぜひ/g, "よかったら")
    .replace(/絶対に間違いない/g, "選ぶ理由が分かりやすい")
    .replace(/誰でも似合う/g, "合わせ方を選びにくい")
    .replace(/これ一択/g, "有力候補")
    .replace(/([。！？])\1+/g, "$1")
    .replace(/([^\n]{4,18})。\n\1。/g, "$1。")
    .replace(/[ \t]+\n/g, "\n");

  const unsupportedExperience = /(買ってよかった|着てみた|使ってみた|愛用中|リピートした|届きました)/;
  if (context.ownershipVoice?.status !== "購入済み") {
    result = result
      .replace(unsupportedExperience, "商品情報を見て気になった")
      .replace(/実際に着ると/g, "着用写真を見ると")
      .replace(/使ってみると/g, "商品情報では");
  }
  return cleanGeneratedCopy(result);
}

function countSocialEmoji(text) {
  return (String(text || "").match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length;
}

function socialProductEmoji(product) {
  if (product?.category === "ホテル・旅行") return "🏨";
  const value = `${product?.category || ""} ${product?.name || ""}`;
  if (/バッグ|鞄|ポーチ/.test(value)) return "👜";
  if (/靴|パンプス|サンダル|スニーカー/.test(value)) return "👠";
  if (/ブラウス|トップス|ニット|シャツ/.test(value)) return "👚";
  return "👗";
}

function decorateSocialCopy(text, context) {
  const lines = String(text || "").split("\n");
  const productEmoji = socialProductEmoji(context.product);
  let firstContentDecorated = false;
  let questionDecorated = false;
  let actionDecorated = false;
  const isThreadsSet = context.platform === "Threads" && ["1日5本セット", "骨格ウェーブ目線"].includes(context.angle);

  return lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || /^※|^#|https?:\/\//i.test(trimmed)) return line;

    if (context.platform === "Instagram") {
      if (/^【表紙】/.test(trimmed)) return line.replace("【表紙】", "【表紙】🎀");
      if (/^【(?:2枚目｜)?選定基準】/.test(trimmed)) return `${line} 🔍`;
      if (/^【3枚目｜1位】/.test(trimmed)) return line.replace("】", "】🥇");
      if (/^【4枚目｜2位】/.test(trimmed)) return line.replace("】", "】🥈");
      if (/^【5枚目｜3位】/.test(trimmed)) return line.replace("】", "】🥉");
      if (/^【\d+枚目｜.*(?:気になる|確認|選び方)/.test(trimmed)) return line.replace("】", "】🔎");
      if (/^【\d+枚目｜CTA】/.test(trimmed) || /^【7枚目】/.test(trimmed)) return line.replace("】", "】📌");
      const slideMatch = trimmed.match(/^【(\d+)枚目/);
      if (slideMatch) {
        const slideEmoji = ["✨", productEmoji, "🔍", "📝", "🎀", "📌"][Math.max(0, Number(slideMatch[1]) - 2) % 6];
        return line.replace("】", `】${slideEmoji}`);
      }
      if (/^【キャプション】/.test(trimmed)) return line.replace("】", "】🌸");
      if (/^【今回の選び方】/.test(trimmed)) return line.replace("】", "】📝");
      if (/^【商品ページで確認できた情報】/.test(trimmed)) return line.replace("】", "】🔍");
      if (/^【オリジナル素材メモ】/.test(trimmed)) return line.replace("】", "】📷");
      return line;
    }

    if (context.platform === "Threads" && /^【朝/.test(trimmed)) return `${line} ☀️`;
    if (context.platform === "Threads" && /^【昼/.test(trimmed)) return `${line} ${productEmoji}`;
    if (context.platform === "Threads" && /^【夕方/.test(trimmed)) return `${line} 🔍`;
    if (context.platform === "Threads" && /^【夜/.test(trimmed)) return `${line} 💭`;
    if (context.platform === "Threads" && /^【ROOM/.test(trimmed)) return `${line} 🛍️`;
    if (isThreadsSet) return line;

    if (!firstContentDecorated) {
      firstContentDecorated = true;
      return `${productEmoji} ${line}`;
    }
    if (!questionDecorated && /[？?]$/.test(trimmed)) {
      questionDecorated = true;
      return `💭 ${line}`;
    }
    if (!actionDecorated && /保存|ROOM|楽天トラベル|プロフィール/.test(trimmed)) {
      actionDecorated = true;
      return `${/保存/.test(trimmed) ? "📌" : "🛍️"} ${line}`;
    }
    if (context.platform === "X" && /^A｜/.test(trimmed)) return `🩷 ${line}`;
    if (context.platform === "X" && /^B｜/.test(trimmed)) return `🤍 ${line}`;
    if (context.platform === "X" && /^1[.．]/.test(trimmed)) return `🥇 ${line}`;
    if (context.platform === "X" && /^2[.．]/.test(trimmed)) return `🥈 ${line}`;
    if (context.platform === "X" && /^3[.．]/.test(trimmed)) return `🥉 ${line}`;
    return line;
  }).join("\n");
}

function buildCompactXCopy(c) {
  const p = c.product;
  const disclosure = c.disclosure;
  const roomCta = c.product.category === "ホテル・旅行"
    ? "最新料金・空室はプロフィールの楽天トラベル候補から確認。"
    : "サイズ・在庫はプロフィールの楽天ROOMから確認。";
  if (c.angle === "2商品比較") {
    const second = c.products[1] || p;
    return `迷ったら、この2つを比較。\n\nA｜${trimText(shortName(p.name), 24)}\n${trimText(naturalHook(p.hook), 34)}\n\nB｜${trimText(shortName(second.name), 24)}\n${trimText(naturalHook(second.hook), 34)}\n\n華やかさならA、着回しならB。どちらが好みですか？\n${disclosure}\n${roomCta}`;
  }
  if (["ランキング", "予算別3選"].includes(c.angle)) {
    const items = c.products.slice(0, 3);
    return `${c.seasonLabel}の大人可愛い候補3選。\n\n${items.map((item, index) => `${index + 1}. ${trimText(shortName(item.name), 22)}`).join("\n")}\n\n基準は着回し・確認しやすさ・手持ち服との相性。保存して比較用に。\n${disclosure}\n${roomCta}`;
  }
  const title = c.angle === "セール速報"
    ? `セールでも、可愛いだけで決めない。`
    : c.angle === "買う前チェック"
      ? `${p.category}を買う前の3確認。`
      : c.isTravel
        ? `${c.travelCompanionLabel}の宿選び、この3点。`
        : `${c.fashionOccasionLabel}で使うなら、この3点。`;
  return `${title}\n\n${trimText(shortName(p.name), 30)}\n・${trimText(naturalHook(p.hook), 38)}\n・${trimText(c.style.checks[0], 34)}\n・手持ち服で3コーデ作れるか\n\n${trimText(goalCta(c, "X"), 48)}\n${disclosure}\n${roomCta}`;
}

function buildCompactThreadsCopy(c) {
  const p = c.product;
  const scenes = c.isTravel
    ? [
        "旅行の予定を立てる夜、写真より先に駅からの道を見てしまいます。",
        "旅先では、可愛い部屋と移動のラクさの間でいつも迷います。",
        "予約ボタンの前で、朝食とキャンセル条件だけはもう一度確認。",
      ]
    : [
        "朝、鏡の前で『可愛いけれど大学には頑張りすぎ？』と一度止まります。",
        "授業だけの日ほど、きちんと見えて気負わない服が難しいです。",
        "帰りにカフェへ寄る日は、朝から少しだけ可愛いを足したくなります。",
      ];
  const scene = scenes[c.candidateIndex % scenes.length];
  const fact = c.isTravel
    ? `${shortName(p.name)}は、${trimText(naturalHook(p.hook), 48)}`
    : `${shortName(p.name)}は、${trimText(naturalHook(p.hook), 48)}`;
  const check = c.isTravel
    ? `私は${trimText(c.style.checks[0], 34)}を確認してから候補に残します。`
    : `私は${trimText(c.style.checks[0], 34)}と、手持ち服で3コーデ作れるかを確認します。`;
  const question = c.isTravel
    ? "宿選びは、アクセスと部屋の可愛さならどちらを先に見ますか？"
    : `${c.style.pairings[0]}と${c.style.pairings[1]}なら、どちらに合わせたいですか？`;
  const goalLine = c.goal === "room"
    ? c.roomLine
    : c.goal === "save"
      ? "あとで比べたい方は、そっと保存しておいてください。"
      : "皆さんの選び方も聞いてみたいです。";
  return `${scene}\n\n${fact}\n${check}\n\n${question}\n${goalLine}\n${c.disclosure}`;
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
    excerpt: String(text || "").replace(/\s+/g, " ").slice(0, 500),
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

async function copyText(text, visibleFallback = null) {
  const value = String(text || "");
  if (!value.trim()) return showToast("コピーする内容がありません");
  let copied = false;
  if (visibleFallback && typeof visibleFallback.select === "function") {
    try {
      visibleFallback.focus({ preventScroll: true });
      visibleFallback.select();
      visibleFallback.setSelectionRange?.(0, value.length);
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
  }
  if (!copied && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      copied = true;
    } catch {
      copied = false;
    }
  }
  if (!copied) {
    const helper = document.createElement("textarea");
    helper.value = value;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.left = "-9999px";
    helper.style.top = "0";
    helper.style.fontSize = "16px";
    document.body.appendChild(helper);
    helper.focus({ preventScroll: true });
    helper.select();
    helper.setSelectionRange(0, value.length);
    copied = document.execCommand("copy");
    helper.remove();
  }
  showToast(copied ? "コピーしました" : "コピーできませんでした。文章を長押ししてコピーしてください");
  return copied;
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
      const imported = normalizeState(JSON.parse(reader.result));
      Object.keys(state).forEach((key) => delete state[key]);
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

  let reloadingForUpdate = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadingForUpdate) return;
    reloadingForUpdate = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js", { updateViaCache: "none" })
      .then((registration) => {
        registration.update();
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") registration.update();
        });
        window.setInterval(() => registration.update(), 5 * 60 * 1000);
      })
      .catch(() => {
        // PWA登録はHTTPS配信時だけ成功すればよいので、ローカル表示では静かに無視する。
      });
  });
}

async function checkPublishedAppVersion() {
  if (APP_VERSION === "開発版") return;
  try {
    const response = await fetch(`./version.json?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const latest = String((await response.json()).version || "");
    const button = document.querySelector("#forceAppUpdate");
    if (button && latest && latest !== APP_VERSION) button.textContent = `v${latest}へ更新`;
    if (latest && latest !== APP_VERSION) {
      const attemptKey = `hanako-update-attempt-${latest}`;
      if (!sessionStorage.getItem(attemptKey)) {
        sessionStorage.setItem(attemptKey, "1");
        forceAppUpdate();
      }
    }
  } catch {
    // オフライン時は現在の版をそのまま使う。
  }
}

function forceAppUpdate() {
  const updateUrl = new URL("./update.html", location.href);
  updateUrl.searchParams.set("v", APP_VERSION === "開発版" ? Date.now() : APP_VERSION);
  updateUrl.searchParams.set("t", Date.now());
  location.replace(updateUrl.href);
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
