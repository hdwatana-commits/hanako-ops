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
state.appearance ||= { avatarTheme: "original" };

const avatarThemes = {
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
};
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
const checklist = document.querySelector("#checklist");
const calendarList = document.querySelector("#calendarList");
const metricList = document.querySelector("#metricList");
const metricSummary = document.querySelector("#metricSummary");
const roomProductSelect = document.querySelector("#roomProductSelect");
const roomPostOutput = document.querySelector("#roomPostOutput");
const roomQueue = document.querySelector("#roomQueue");
const coordinateOutput = document.querySelector("#coordinateOutput");
const coordGeminiPrompt = document.querySelector("#coordGeminiPrompt");
const coordBoard = document.querySelector("#coordBoard");
const toast = document.querySelector("#toast");
let deferredInstallPrompt = null;
let coordinatePhotoDataUrl = "";
let coordinateBoardDataUrl = "";
const coordinateImageCache = new Map();
const coordinateProductHydration = new Map();
let currentHanakoComment = "";
let currentHanakoCommentConcern = "";
let socialGeminiGeneratedImageDataUrl = "";
let socialGeminiGeneratedImageExtension = "png";
let socialGeminiAwaitingReturn = false;
let socialGeminiPromptNeedsRefresh = false;
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

queueMicrotask(initialize);

function initialize() {
  profileText.value = state.profile || defaultProfile;
  document.querySelector('input[name="date"]').valueAsDate = new Date();
  applyAppearance();
  bindAppearancePicker();
  registerPwa();
  bindNavigation();
  bindForms();
  bindActions();
  bindCloudSync();
  renderProducts();
  renderProductOptions();
  restoreGeneratorPreferences();
  renderRoomProductOptions();
  renderCoordinateOptions();
  renderRoomQueue();
  renderCalendar();
  renderMetrics();
  renderLearningHint();
  renderChecks("");
  renderHome();
}

function bindAppearancePicker() {
  document.querySelectorAll("[data-avatar-theme]").forEach((button) => {
    button.addEventListener("click", () => {
      const themeName = button.dataset.avatarTheme;
      if (!avatarThemes[themeName]) return;
      state.appearance = { ...state.appearance, avatarTheme: themeName };
      applyAppearance();
      saveState();
      showToast(`${avatarThemes[themeName].label}に着替えました`);
    });
  });
}

function applyAppearance() {
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

  const manifestLink = document.querySelector("#appManifestLink");
  const favicon = document.querySelector("#appFavicon");
  const appleTouchIcon = document.querySelector("#appleTouchIcon");
  if (manifestLink) manifestLink.href = theme.manifest;
  if (favicon) favicon.href = theme.icon;
  if (appleTouchIcon) appleTouchIcon.href = theme.icon;

  if (hanakoTeacherMode === "appearance") {
    currentHanakoTeacher = hanakoTeacherGuides.find((guide) => guide.id === themeName) || hanakoTeacherGuides[0];
    updateHanakoTeacherPreview();
    if (coordinateOutput?.value.trim() && isHanakoTeacherPattern()) {
      const coordinate = getSelectedCoordinate();
      drawCoordinateBoard(coordinate, coordinateOutput.value);
    }
  }
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
  document.querySelector("#homeNextActionButton")?.addEventListener("click", (event) => {
    activateView(event.currentTarget.dataset.target || "products");
  });
  document.querySelector("#homeBuildPlan")?.addEventListener("click", addHomeSmartPlan);
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
  document.querySelector("#generateSocialGeminiImage")?.addEventListener("click", () => generateSocialGeminiImagePrompt());
  document.querySelector("#generateSocialGeminiCopy")?.addEventListener("click", () => generateSocialGeminiCopyPrompt());
  document.querySelector("#sendSocialGeminiImage")?.addEventListener("click", () => sendSocialGeminiToGemini("image"));
  document.querySelector("#sendSocialGeminiCopy")?.addEventListener("click", () => sendSocialGeminiToGemini("copy"));
  document.querySelector("#goToSocialGemini")?.addEventListener("click", () => {
    renderSocialGeminiProgress();
    document.querySelector("#snsGeminiTools")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelector("#copySocialGeminiPrompt")?.addEventListener("click", () => copyText(snsGeminiPrompt?.value || ""));
  document.querySelector("#openSocialGemini")?.addEventListener("click", copyAndOpenSocialGemini);
  document.querySelector("#snsGeneratedImage")?.addEventListener("change", previewSocialGeminiImage);
  document.querySelector("#snsGeminiResult")?.addEventListener("input", renderSocialGeminiProgress);
  document.querySelector("#applySocialGeminiCopy")?.addEventListener("click", applySocialGeminiCopy);
  document.querySelector("#downloadSocialGeminiImage")?.addEventListener("click", downloadSocialGeminiImage);
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
  hasMeaningfulLocalData = true;
  localStorage.setItem("hanako-room-ops", JSON.stringify(state));
  profileText.value = state.profile || defaultProfile;
  state.appearance ||= { avatarTheme: "original" };
  applyAppearance();
  renderProducts();
  renderProductOptions();
  restoreGeneratorPreferences();
  renderRoomProductOptions();
  renderCoordinateOptions();
  renderRoomQueue();
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
    target.innerHTML = `<p class="muted">商品を登録すると、Geminiへ渡す画像と商品情報がここに表示されます。</p>`;
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
  document.querySelector("#coordPhoto")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    coordinatePhotoDataUrl = file ? await readFileAsDataUrl(file) : "";
    showToast(coordinatePhotoDataUrl ? "写真を読み込みました" : "写真を解除しました");
    if (coordinateOutput.value.trim()) drawCoordinateBoard(getSelectedCoordinate(), coordinateOutput.value);
  });
  document.querySelector("#coordMainProduct")?.addEventListener("change", (event) => {
    const product = state.products.find((item) => item.id === event.currentTarget.value);
    if (product) applyRecommendedCoordinateDefaults(product);
  });
  document.querySelector("#coordImagePattern")?.addEventListener("change", (event) => {
    if (isHanakoTeacherPattern(event.currentTarget.value)) applySelectedHanakoTeacher();
    else updateHanakoTeacherPreview();
    if (coordinateOutput.value.trim()) {
      const coordinate = getSelectedCoordinate();
      coordGeminiPrompt.value = buildOutfitImagePrompt(coordinate);
      drawCoordinateBoard(coordinate, coordinateOutput.value);
    }
  });
  document.querySelector("#rerollHanakoTeacher")?.addEventListener("click", () => {
    activateHanakoTeacherMode("random", true, true);
  });
  document.querySelector("#autoCoordinate")?.addEventListener("click", () => autoSelectCoordinateItems(true, true));
  document.querySelector("#generateCoordinate")?.addEventListener("click", generateCoordinate);
  document.querySelector("#generateGeminiPrompt")?.addEventListener("click", generateGeminiPrompt);
  document.querySelector("#generateGeminiCaptionPrompt")?.addEventListener("click", generateGeminiCaptionPrompt);
  document.querySelector("#copyCoordinateText")?.addEventListener("click", () => copyText(coordinateOutput.value));
  document.querySelector("#copyGeminiPrompt")?.addEventListener("click", () => copyText(coordGeminiPrompt.value));
  document.querySelector("#openGemini")?.addEventListener("click", openGemini);
  document.querySelector("#downloadCoordinateBoard")?.addEventListener("click", downloadCoordinateBoard);
  document.querySelector("#coordGeneratedImage")?.addEventListener("change", previewGeneratedCoordinateImage);
  bindHanakoTeacherSelector();
  updateHanakoTeacherPreview();
}

function isHanakoTeacherPattern(pattern = document.querySelector("#coordImagePattern")?.value) {
  return pattern === "ハナコ先生の吹き出し解説";
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
  const appearanceGuide = hanakoTeacherGuides.find((guide) => guide.id === appearanceId) || hanakoTeacherGuides[0];
  return [
    { id: "random", name: "毎回ランダム", shortName: "おまかせ", avatar: currentHanakoTeacher.avatar, badge: "↻" },
    { id: "appearance", name: "選んだアプリアイコン", shortName: "アプリと同じ", avatar: appearanceGuide.avatar, badge: "同じ" },
    ...hanakoTeacherGuides.map((guide) => ({ ...guide, shortName: guide.name.replace(/の?ハナコ$/, "") })),
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
    coordGeminiPrompt.value = buildOutfitImagePrompt(coordinate);
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
  const appearanceGuide = hanakoTeacherGuides.find((guide) => guide.id === appearanceId) || hanakoTeacherGuides[0];
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
    } else {
      product = {
        id: createId(),
        name: imported.name || "楽天ROOMの商品",
        url,
        image: imported.image || "",
        details: imported.details || {},
        category: imported.category || "その他",
        price: imported.price || "",
        hook: imported.hook || "コーデの雰囲気を整えやすい",
      };
      state.products.unshift(product);
    }
    saveState();
    renderProducts();
    renderProductOptions();
    renderRoomProductOptions();
    renderCoordinateOptions();
    renderAngleOptions();
    selectCoordinateProduct(product);
    showCoordinateImportStatus(`「${product.name}」をコーデに追加しました`);
    showToast("商品を読み込み、コーデに追加しました");
  } catch (error) {
    showCoordinateImportStatus(error.message || "商品情報を読み込めませんでした", true);
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

function normalizeCoordinateImportedProduct(imported, originalUrl) {
  const product = { ...imported, details: { ...(imported?.details || {}) } };
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
  if (/コート|ジャケット|ブルゾン|カーディガン|ボレロ|アウター|パーカー/.test(text)) return "アウター";
  if (/ワンピ|ドレス|チュニック/.test(text)) return "ワンピース";
  if (/スカート/.test(text)) return "スカート";
  if (/パンツ|ズボン|デニム|ジーンズ|スラックス|キュロット/.test(text)) return "パンツ";
  if (/バッグ|鞄|トート|ショルダー|リュック|ポーチ/.test(text)) return "バッグ";
  if (/パンプス|サンダル|スニーカー|ブーツ|シューズ|ローファー|靴/.test(text)) return "シューズ";
  if (/ピアス|イヤリング|ネックレス|リング|アクセサリ|ブレスレット|バングル|ヘアクリップ/.test(text)) return "アクセサリー";
  if (/ブラウス|シャツ|ニット|セーター|カットソー|Tシャツ|トップス|ベスト|キャミソール/.test(text)) return "トップス";
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
  };
  const selector = selectors[product.category];
  const select = selector ? document.querySelector(selector) : null;
  const mainSelect = document.querySelector("#coordMainProduct");
  if (mainSelect && [...mainSelect.options].some((option) => option.value === product.id)) mainSelect.value = product.id;
  if (!select || ![...select.options].some((option) => option.value === product.id)) {
    showCoordinateImportStatus("商品を登録しました。下の商品欄から選んでください");
    return;
  }
  if (product.category === "ワンピース") {
    document.querySelector("#coordTop").value = "";
    document.querySelector("#coordBottom").value = "";
  } else if (["トップス", "アウター", "スカート", "パンツ"].includes(product.category)) {
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
  const mainProduct = byId("#coordMainProduct");
  const onepiece = byId("#coordOnepiece");
  const pieces = [
    mainProduct,
    onepiece,
    onepiece ? null : byId("#coordTop"),
    onepiece ? null : byId("#coordBottom"),
    byId("#coordBag"),
    byId("#coordShoes"),
    byId("#coordAccessory"),
  ].filter((product, index, products) => product && products.findIndex((item) => item?.id === product.id) === index);
  return {
    style: document.querySelector("#coordStyle")?.value || "大人ガーリー",
    occasion: document.querySelector("#coordOccasion")?.value || "友達とカフェ",
    hairStyle: document.querySelector("#coordHairStyle")?.value || "元写真の髪型を保つ",
    imagePattern: document.querySelector("#coordImagePattern")?.value || "ハナコ先生の吹き出し解説",
    concern: document.querySelector("#coordConcern")?.value || "朝、服が決まらない",
    priority: document.querySelector("#coordPriority")?.value || "着回しやすさ",
    colorMood: document.querySelector("#coordColorMood")?.value || "商品から自動で整える",
    season: document.querySelector("#coordSeason")?.value || "今の季節",
    hanakoTeacher: currentHanakoTeacher,
    hanakoComment: currentHanakoComment,
    products: pieces,
    mainProduct: mainProduct || pieces[0] || null,
  };
}

function autoSelectCoordinateItems(generateAfter = true, notify = true) {
  const fashionProducts = state.products.filter((product) => product.category !== "ホテル・旅行");
  if (!fashionProducts.length) return showToast("先にファッション商品を登録してください");
  const mainSelect = document.querySelector("#coordMainProduct");
  const main = state.products.find((product) => product.id === mainSelect?.value) || fashionProducts[0];
  if (mainSelect && [...mainSelect.options].some((option) => option.value === main.id)) mainSelect.value = main.id;

  const selectedIds = new Set([main.id]);
  const setChoice = (selector, categories, forceMain = false) => {
    const select = document.querySelector(selector);
    if (!select) return;
    const candidate = forceMain
      ? main
      : chooseCoordinateCompanion(categories, main, selectedIds);
    const value = candidate && [...select.options].some((option) => option.value === candidate.id) ? candidate.id : "";
    select.value = value;
    if (value) selectedIds.add(value);
  };

  const isOnepiece = main.category === "ワンピース";
  setChoice("#coordOnepiece", ["ワンピース"], isOnepiece);
  if (isOnepiece) {
    document.querySelector("#coordTop").value = "";
    document.querySelector("#coordBottom").value = "";
  } else {
    setChoice("#coordTop", ["トップス", "アウター"], ["トップス", "アウター"].includes(main.category));
    setChoice("#coordBottom", ["スカート", "パンツ"], ["スカート", "パンツ"].includes(main.category));
  }
  setChoice("#coordBag", ["バッグ"], main.category === "バッグ");
  setChoice("#coordShoes", ["シューズ"], main.category === "シューズ");
  setChoice("#coordAccessory", ["アクセサリー"], main.category === "アクセサリー");
  if (notify) showToast("主役に合う商品とおすすめ設定を自動で選びました");
  if (generateAfter) generateCoordinate();
}

function applyRecommendedCoordinateDefaults(product, notify = true) {
  if (!product || product.category === "ホテル・旅行") return;
  const text = `${product.name || ""} ${product.hook || ""} ${product.details?.color || ""} ${product.details?.material || ""}`;
  const setSelect = (id, value) => {
    const select = document.querySelector(`#${id}`);
    if (select && [...select.options].some((option) => option.value === value)) select.value = value;
  };
  const style = /骨格|細見え|華奢|ウエスト|脚長/.test(text)
    ? "骨格ウェーブ意識"
    : /淡色|アイボリー|ベージュ|オフホワイト|くすみ/.test(text)
      ? "淡色フェミニン"
      : /通勤|オフィス|ジャケット|上品/.test(text)
        ? "甘めきれいめ"
        : "大人ガーリー";
  const occasion = /通勤|オフィス|仕事|ジャケット/.test(text)
    ? "きれいめ通勤"
    : /旅行|トラベル/.test(text)
      ? "旅行"
      : /デート|お呼ばれ/.test(text)
        ? "デート"
        : /大学|通学|スクール/.test(text)
          ? "大学・通学"
          : ["バッグ", "シューズ", "アクセサリー"].includes(product.category)
            ? "休日ショッピング"
            : "友達とカフェ";
  const concern = /骨格|細見え|華奢|ウエスト|脚長|体型/.test(text)
    ? "全身のバランスを整えたい"
    : /透け|汗|雨|撥水|半袖|ノースリーブ|シアー/.test(text)
      ? "気温差に対応したい"
      : /着回し|万能|2way|3way/.test(text)
        ? "いつも同じ組み合わせになる"
        : /映え|写真|リボン|フリル|レース|甘め/.test(text)
          ? "甘すぎ・子どもっぽく見せたくない"
          : "朝、服が決まらない";
  const priority = /骨格|細見え|華奢|ウエスト|脚長|体型/.test(text)
    ? "スタイルバランス"
    : /高見え|上品|きれいめ|素材感/.test(text)
      ? "高見え"
      : /軽量|歩き|ストレッチ|スニーカー|通学/.test(text)
        ? "動きやすさ"
        : /映え|写真/.test(text)
          ? "写真映え"
          : "着回しやすさ";
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
  setSelect("coordMainProduct", product.id);
  autoSelectCoordinateItems(false, false);
  if (notify) showToast(`${product.name}に合うコーデ設定を自動で選びました`);
}

function chooseCoordinateCompanion(categories, main, selectedIds) {
  const mainBrand = getCoordinateBrand(main).toLocaleLowerCase("ja-JP");
  return state.products
    .filter((product) => categories.includes(product.category) && !selectedIds.has(product.id))
    .map((product) => {
      const sameBrand = mainBrand && getCoordinateBrand(product).toLocaleLowerCase("ja-JP") === mainBrand;
      const hasDetails = Boolean(product.details?.color || product.details?.material);
      const hasImage = Boolean(product.image);
      return { product, score: (sameBrand ? 8 : 0) + (hasDetails ? 3 : 0) + (hasImage ? 2 : 0) };
    })
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, "ja"))[0]?.product || null;
}

async function generateCoordinate() {
  let coordinate = getSelectedCoordinate();
  if (!coordinate.products.length) return showToast("コーデに使う商品を選んでください");
  if (isHanakoTeacherPattern(coordinate.imagePattern)) {
    applySelectedHanakoTeacher();
    coordinate = getSelectedCoordinate();
    coordinate.hanakoComment = chooseHanakoTeacherComment(coordinate, true);
  }
  const analysis = buildCoordinateAnalysis(coordinate);
  const text = buildCoordinateText(coordinate);
  coordinateOutput.value = text;
  coordGeminiPrompt.value = buildOutfitImagePrompt(coordinate);
  document.querySelector("#coordStatus").textContent = analysis.roomReady ? "投稿条件を確認済み" : "要確認：商品を追加";
  await drawCoordinateBoard(coordinate, text);
  showToast(analysis.roomReady ? "コーデ文と画像ボードを作りました" : "コーデを作りました。ROOM投稿には商品を2点以上選んでください");
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
  const apparelCategories = new Set(["ワンピース", "トップス", "アウター", "スカート", "パンツ"]);
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

async function drawCoordinateBoard(coordinate, text) {
  const canvas = coordBoard;
  if (!canvas) return;
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
    await drawProductCard(ctx, product, x, y);
    if (isHanakoTeacherPattern(coordinate.imagePattern)) drawTeacherHandwrittenPoint(ctx, product, index, x, y);
  }

  if (isHanakoTeacherPattern(coordinate.imagePattern)) {
    await drawHanakoTeacherPanel(ctx, coordinate, analysis);
  } else {
    ctx.fillStyle = "#2f292c";
    ctx.font = "700 30px Yu Gothic UI, Meiryo, sans-serif";
    ctx.fillText("WHY IT WORKS", 72, 1220);
    ctx.font = "24px Yu Gothic UI, Meiryo, sans-serif";
    ctx.fillStyle = "#6c555e";
    wrapCanvasText(ctx, `${analysis.solution} 色は${analysis.colorPlan}`, 72, 1260, 930, 34, 2);
  }
  coordinateBoardDataUrl = canvas.toDataURL("image/png");
}

async function drawHanakoTeacherPanel(ctx, coordinate, analysis) {
  const guide = coordinate.hanakoTeacher || currentHanakoTeacher;
  const comment = coordinate.hanakoComment || chooseHanakoTeacherComment(coordinate);
  let avatar = await loadImage(guide.avatar).catch(() => null);
  if (!avatar) avatar = await loadImage("icons/hanako-avatar.jpg").catch(() => null);
  const avatarX = 34;
  const avatarY = 1082;
  const avatarSize = 210;
  const bubbleX = 280;
  const bubbleY = 1112;
  const bubbleWidth = 730;
  const bubbleHeight = 184;

  ctx.save();
  ctx.fillStyle = "#fff";
  roundRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, 24);
  ctx.fill();
  ctx.strokeStyle = "#e4b9c8";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bubbleX, bubbleY + 76);
  ctx.lineTo(bubbleX - 28, bubbleY + 96);
  ctx.lineTo(bubbleX, bubbleY + 112);
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.strokeStyle = "#e4b9c8";
  ctx.stroke();

  ctx.fillStyle = "#a43d64";
  ctx.font = "700 24px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText("ハナコ先生のズバッとひとこと", bubbleX + 28, bubbleY + 42);
  ctx.fillStyle = "#4d3d43";
  ctx.font = "700 24px Yu Gothic UI, Meiryo, sans-serif";
  wrapCanvasText(ctx, `「${comment}」`, bubbleX + 28, bubbleY + 86, bubbleWidth - 56, 34, 2);

  ctx.fillStyle = "#f4cad7";
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2);
  ctx.fill();
  if (avatar) drawCoverImage(ctx, avatar, avatarX, avatarY, avatarSize, avatarSize, avatarSize / 2);
  else drawPlaceholder(ctx, "ハナコ", avatarX, avatarY, avatarSize, avatarSize);
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
    ],
    "甘すぎて幼く見えそう": [
      "甘さは一か所で十分。リボンもフリルも全部盛りでは、服に着られるわよ。",
      "かわいいを重ねすぎないで。黒か直線を一つ入れれば、大人に戻れるわ。",
      "ピンクが悪いんじゃないの。形まで甘くするから、幼く見えるのよ。",
      "フリルを選んだなら小物は静かに。全員センターではまとまらないわ。",
      "甘め服ほど姿勢と靴が大事。足もとを締めれば、ちゃんと大人よ。",
    ],
    "頑張りすぎて見えたくない": [
      "盛る場所は一つで十分。主役が二人いたら、コーデは迷子よ。",
      "気合いは見せるものじゃないの。色数を減らして、余裕を着なさい。",
      "全部新品みたいな顔をさせないで。抜け感は、いつもの一着で作るの。",
      "アクセも柄も主張中。ひとつ黙らせたら、急におしゃれになるわ。",
      "完璧より自然体。鏡を見て最初に気になる一つを、潔く外して。",
    ],
    "体型やバランスが気になる": [
      "隠すだけでは重くなるわ。縦ラインを作って、堂々とすっきり見せて。",
      "体型より重心を見て。腰の位置を少し上げれば、印象は変わるわ。",
      "ゆるい服を重ねるほど細くは見えないの。どこか一か所、形を出して。",
      "気になる場所を見張りすぎ。顔まわりを明るくして、視線を上へ。",
      "サイズを隠すより比率を整えて。上短め、下すっきりが近道よ。",
    ],
    "可愛いけれど予算も大事": [
      "安いから買うは卒業。三回着たいか、それだけで選びなさい。",
      "値札より出番を見て。一回しか着ない服が、いちばん高いのよ。",
      "似た服があるなら今日は見送り。かわいいと必要は、別のお話よ。",
      "予算がある日は主役へ集中。小物まで全部買う必要はないわ。",
      "セールの魔法に負けないで。定価でも欲しいか、そこで答えが出るわ。",
    ],
    "気温・雨・汗にも対応したい": [
      "我慢はおしゃれじゃないの。脱ぎ着できない服は、今日はお留守番よ。",
      "天気を無視した服は美しくないわ。羽織り一枚までがコーデよ。",
      "汗じみを心配して笑えないなら、その色は今日は選ばないで。",
      "雨の日に繊細すぎる靴はお休み。足もとが決まれば気分も崩れないわ。",
      "気温差には薄手を重ねて。根性で着る服なんて、おしゃれじゃないの。",
    ],
    "いつも同じコーデになる": [
      "全部変えなくていいの。小物を一つ替えるだけで、昨日とは別人よ。",
      "同じ服でも配色は変えられるわ。いつもの黒を、今日は淡色にして。",
      "マンネリの犯人は服じゃなく組み合わせ。上下を一度、別居させなさい。",
      "新しい服を買う前に靴を替えて。印象の半分は足もとが決めるわ。",
      "定番は悪くないの。襟元、袖、バッグのどれか一つだけ遊んで。",
    ],
    "自信を持って出かけたい": [
      "似合うかより姿勢よ。色を三つに絞ったら、胸を張って出かけなさい。",
      "自信は服から借りていいの。いちばん好きな一着を主役にして。",
      "周りの正解より、自分が鏡で笑えるか。それが今日の合格よ。",
      "不安な日は冒険より得意を選んで。似合う形は、ちゃんと味方になるわ。",
      "服は決まってる。あとは下を向かないこと、それだけよ。",
    ],
  };
  const options = variations[coordinate.concern] || [
    "かわいいは足し算じゃないの。主役を一つ決めて、あとは潔く引きなさい。",
    "おしゃれは全部を語らないの。見せ場を一つ決めて、余白を残して。",
    "迷ったら色を減らして。まとまりのない豪華さより、潔い普通が勝つわ。",
  ];
  if (!force && currentHanakoComment && currentHanakoCommentConcern === coordinate.concern) return currentHanakoComment;
  const candidates = options.filter((comment) => comment !== currentHanakoComment);
  currentHanakoComment = candidates[Math.floor(Math.random() * candidates.length)] || options[0];
  currentHanakoCommentConcern = coordinate.concern;
  return currentHanakoComment;
}

function drawTeacherHandwrittenPoint(ctx, product, index, x, y) {
  const label = teacherPointLabel(product);
  const textX = x + 188;
  const textY = y + 164;
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
  ctx.quadraticCurveTo(textX - 28, textY - 16, x + 154, y + 145);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 154, y + 145);
  ctx.lineTo(x + 163, y + 141);
  ctx.lineTo(x + 160, y + 151);
  ctx.fill();
  ctx.font = "700 18px Yu Gothic UI, Meiryo, sans-serif";
  ctx.fillText(`${index === 0 ? "主役♡" : "POINT"} ${label}`, textX, textY);
  ctx.restore();
}

function teacherPointLabel(product) {
  return {
    ワンピース: "縦ラインですっきり",
    トップス: "顔まわりを明るく",
    アウター: "重ねても軽やか",
    スカート: "揺れ感がかわいい",
    パンツ: "甘さをすっきり調整",
    バッグ: "小さめで抜け感",
    シューズ: "足もとの色をそろえる",
    アクセサリー: "きらめきをひとさじ",
  }[product?.category] || "全体をきれいにまとめる";
}

async function drawProductCard(ctx, product, x, y) {
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x, y, 440, 240, 18);
  ctx.fill();
  ctx.strokeStyle = "#eadde1";
  ctx.stroke();
  await hydrateCoordinateProductImage(product);
  if (product.image) {
    const image = await loadCoordinateProductImage(product.image);
    if (image) drawCoverImage(ctx, image, x + 18, y + 18, 150, 150, 12);
    else drawProductImagePlaceholder(ctx, product.category, x + 18, y + 18, 150, 150);
  } else {
    drawProductImagePlaceholder(ctx, product.category, x + 18, y + 18, 150, 150);
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
  const coordinate = getSelectedCoordinate();
  const originalProductPhotoMode = coordinate.imagePattern === "オリジナル商品写真で投稿";
  if (!coordinatePhotoDataUrl && !originalProductPhotoMode) return showToast("先に自分の全身写真を選んでください");
  if (!coordinate.products.length) return showToast("コーデに使う商品を選んでください");
  if (!document.querySelector("#coordMainProduct")?.value) return showToast("必ず画像に使う主役商品を選んでください");
  const coordinateText = coordinateOutput.value.trim() || buildCoordinateText(coordinate);
  coordinateOutput.value = coordinateText;
  await drawCoordinateBoard(coordinate, coordinateText);
  coordGeminiPrompt.value = buildOutfitImagePrompt(coordinate);
  document.querySelector("#coordStatus").textContent = "画像ボード・プロンプト準備済み";
  showToast("本人写真と保存した画像ボードを一緒にGeminiへ添付してください");
}

function buildOutfitImagePrompt(coordinate) {
  const mainProduct = coordinate.mainProduct || coordinate.products[0];
  const stylingPlan = buildCoordinateAnalysis(coordinate);
  const brand = getCoordinateBrand(mainProduct);
  const originalProductPhotoMode = coordinate.imagePattern === "オリジナル商品写真で投稿";
  const maskLockInstruction = originalProductPhotoMode
    ? ""
    : `【最優先・マスク固定モード】
・添付した本人写真の人物はマスク着用です。完成画像でも、元写真と同じマスクを必ず着けたままにしてください
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
・特に最下部の文字は画像下端から8%以上離し、最後の句読点と閉じかぎ括弧まで完全に見せる
・主役コーデ約70%、解説要素約20%、呼吸できる余白約10%の情報量を保つ
・かわいさ、読みやすさ、商品確認のしやすさを同時に満たす、商用ファッション誌レベルへ仕上げる
・条件を満たさない途中案や低品質案は出力せず、完成画像だけを返す`;
  const brandProducts = getSameBrandProducts(mainProduct);
  const items = coordinate.products.map((product) => `・${product.category}: ${product.name}
  ブランド: ${getCoordinateBrand(product) || "商品ページで確認"}
  推しポイント: ${product.hook || createCoordinateHook(product)}
  価格メモ: ${product.price || "未設定"}
  商品画像URL: ${product.image || "なし"}
  商品ページURL: ${product.url || "なし"}`).join("\n");
  const brandItems = brandProducts.length
    ? brandProducts.map((product) => `・${product.category}: ${product.name}\n  商品画像URL: ${product.image || "なし"}\n  商品ページURL: ${product.url || "なし"}`).join("\n")
    : "未登録です。添付された同じブランドの商品画像を使ってください。";
  const imageCopy = buildCoordinateImageCopy(coordinate);
  const productPointNotes = buildHandwrittenProductPoints(coordinate);
  const imagePatternInstruction = getCoordinateImagePatternInstruction(coordinate.imagePattern, coordinate);
  const hanakoTeacher = coordinate.hanakoTeacher || currentHanakoTeacher;
  const hanakoTeacherComment = coordinate.hanakoComment || chooseHanakoTeacherComment(coordinate);
  const attachmentInstruction = originalProductPhotoMode
    ? `【添付画像の役割】
・添付した商品写真だけを素材として使う。画像ボードがある場合は、配置と文字の参考にだけ使う
・画像ボード内の商品画像を実物写真として再利用せず、必ず添付された元の商品写真を使う`
    : `【添付画像の役割・最優先】
・「本人の全身写真」: 顔、髪、体型、肌、ポーズ、マスクを保つための本人基準画像
・「コーデ画像ボード」: 選ぶ商品、配置、手書きポイント、ハナコ先生のアイコン、吹き出しの見出しと本文を保つためのデザイン基準画像
・「商品画像」: 服と小物の色、形、丈、柄、素材感を正確に反映するための商品基準画像
・本人写真と画像ボードは別の役割として両方使う。どちらか一方を無視しない
・画像ボード右上の小さな本人写真を拡大して使わず、別添付の元の全身写真を人物の基準にする
・画像ボード自体をそのまま完成画像にせず、本人写真へ選択商品を自然に着せた新しい縦3:4画像を生成する`;
  const hanakoTeacherInstruction = isHanakoTeacherPattern(coordinate.imagePattern)
    ? `【ハナコ先生の吹き出し解説・必須】
・添付した画像ボードに写っている「${hanakoTeacher.name}」を、完成画像にも小さな先生役として登場させる
・ハナコ先生はコーデを着る本人とは別の、丸いアイコン風の解説キャラクター。人物を2人並べた写真にはしない
・アイコンの顔、髪型、髪色、服、目の色を参照画像から変えず、描き直して別人にしない
・完成コーデを画面の約68%で大きく見せ、ハナコ先生は左下の安全な余白へ約28〜30%の大きさで、顔と表情がはっきり分かるよう配置する
・ハナコ先生を右端へ置かない。左端から約3%の余白まで寄せ、頭、髪、リボン、丸いアイコンの輪郭を一切切らない
・ハナコ先生からコーデへ向かう、白地にくすみピンク線の吹き出しを1個だけ付ける
・吹き出しは服へ重ねず、先生がやさしく授業しているような読み順にする
・吹き出しとは別に、主役商品と小物の近くへ手書き風の矢印、丸囲み、下線、短いメモを合計3〜5個入れる
・手書きポイントは商品ごとに具体的にし、同じ文を繰り返さない。服の色、形、重心、着回し、小物の役割を解説する
・先生の吹き出しは短い辛口総評、手書きポイントは各商品の解説として役割を分ける
・手書き文字は、くすみピンクとこげ茶の細いペンで丁寧に書いたファッションノート風にする
・吹き出しの見出しは必ず「ハナコ先生のズバッとひとこと」。アイコンの種類名や「ラベンダーの」は見出しへ入れない
・吹き出し本文はこの1文だけ: 「${hanakoTeacherComment}」
・吹き出し全体を画像の左右端から8%以上、下端から8%以上離した安全域に置く。画像の最下端へ接触させない
・本文は1行14〜18文字を目安に自然な位置で改行し、最大3行まで使ってよい
・見出し、本文、句読点、閉じかぎ括弧をすべて吹き出しの内側へ収め、上下左右に十分な内側余白を残す
・本文を省略、要約、途中切れ、三点リーダー化しない。入りきらない場合は、吹き出しを上へ移動または縦に広げ、それでも必要なら全文が読める範囲で文字を小さくする
・文字を服、先生アイコン、画像の外へはみ出させない。文章の最後の1文字まで見えることを生成前に確認する
・画像ボードにある先生アイコンと上記のひとことをセットで読み取り、完成画像へ必ず反映する
・先生アイコン参考URL: ${new URL(hanakoTeacher.avatar, window.location.href).href}`
    : "";
  const sourceInstruction = originalProductPhotoMode
    ? `画像を生成してください。これは商品写真のレイアウト編集依頼です。文章だけで回答せず、私が撮影して添付した実物の商品写真だけを使って、新しい完成画像を1枚作ってください。

添付していない商品や人物を新しく描かないでください。商品の色、形、柄、素材、ロゴを変えず、実物写真としての正確さを最優先してください。`
    : `画像を生成してください。これは画像生成・写真編集の依頼です。文章だけで回答せず、添付した本人の全身写真を使って、新しい完成画像を1枚生成してください。

添付写真は私本人の写真で、画像生成に使う権利があります。楽天ROOMのコーディネートへ投稿するための、究極におしゃれでかわいい「着用イメージ画像」に編集してください。`;
  const personInstruction = originalProductPhotoMode
    ? `【人物について】
・このパターンでは人物や着用モデルを生成しない
・本人写真の髪型設定は使わず、添付した商品写真だけでコーデの組み合わせを見せる`
    : `【女の子】
・添付写真と同じ女の子だと分かるよう、顔、髪型、髪色、体型、肌の雰囲気を一貫させる
・別人にしない。年齢を変えない。顔を大きく加工しない
・この依頼では女の子はマスク着用が必須。元写真と同じマスクを必ず着けたままにする
・マスクの色、形、大きさ、柄、ひもの位置、顔を覆う範囲を元写真から変えない
・マスクを外す、別のマスクへ交換する、透明にする、口や鼻を見せる加工をしない
・元写真でマスクを着けていない場合は、新しくマスクを追加しない
・ポーズは元写真を生かしつつ、手元や足元を自然でかわいくアレンジする
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
・添付した実物商品が主役。各商品の色、形、柄が分かる構図にする`
    : `・元写真が3:4でない場合は、人物を切らずに背景と余白を自然に広げる
・女の子とコーデが主役。全身が見え、服の形と組み合わせが伝わる構図`;
  const consistencyInstruction = originalProductPhotoMode
    ? "・完成画像は縦3:4の1枚にまとめ、同じ実物商品写真を描き直さず一貫して使う"
    : "・完成画像は縦3:4の1枚にまとめ、同じ女の子、同じ髪型、同じコーデを一貫させる";
  const brandCoordinationInstruction = originalProductPhotoMode
    ? `・主役商品は、添付された本人撮影の商品写真をそのまま使う
・同じブランドの商品も、本人が撮影して添付した写真だけを使う
・URLや追加候補にあっても、写真が添付されていない商品は画像へ追加しない
・商品の色、形、柄、ロゴを変えず、違う商品や人物を生成しない`
    : `・主役商品は別の商品へ置き換えず、色、形、丈、素材感が分かるよう必ずコーデに使う
・主役商品のブランド「${brand || "商品ページで確認できる同じブランド"}」の商品を複数使い、服・バッグ・くつ・アクセを合計3〜5点でまとめる
・添付された同じブランドの商品画像と、上の選択商品を最優先で使う
・同じブランドの商品画像または追加候補が2点以上ある場合は、主役商品と自然に合うものを選び、主役以外に最低2点を完成コーデへ反映する
・違うブランドの商品を勝手に足さない。実在しない商品名、ロゴ、柄を作らない
・商品ページや画像で確認できない細部は、断定せずシンプルに整える`;
  const productDisplayInstruction = originalProductPhotoMode
    ? `・添付した商品写真は切り抜き、傾き補正、明るさ調整、自然な影、背景整理だけを行う
・商品そのものを再生成、着せ替え、変形、色変更しない
・元写真の質感を保ち、本人が撮影した商品写真のコラージュとして仕上げる`
    : `・商品名、商品画像URL、商品ページURLを参考に、選んだ服と小物の色、形、素材感、丈感をできるだけ自然に反映する
・商品にないロゴや柄、ブランド名を勝手に追加しない
・完全な実物写真だと断定する見せ方ではなく、自然な着用イメージにする
・自然光で明るく、服の細部が見やすい高画質にする`;
  const finalSubjectCheck = originalProductPhotoMode
    ? "・添付した商品写真の色、形、柄、ロゴが変わっていない"
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
・右下の端は、背景から自然につながる完全な白にする
・右下の白い部分には、文字、服、小物、かざり、影を置かない

【利用上の区分】
・この生成画像はコーデ検討・SNS用の着用イメージとして作る
・実際に本人が着用して撮影した事実や、ROOMのオリジナル写真であるかのように見せない
・ROOMへ実投稿する際は、本人が実際に着用して撮影した全身写真を使い、その写真に写っている商品だけを登録する
・店舗の商品画像を保存・加工した画像を、本人撮影の商品写真として扱わない

【コーデの雰囲気】
${coordinate.style}
シーン: ${coordinate.occasion}
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

【選んだ髪型】
${hairInstruction}

【選んだ画像パターン】
${coordinate.imagePattern}
${imagePatternInstruction}
${consistencyInstruction}

${hanakoTeacherInstruction}

【必ず使う主役商品】
商品名: ${mainProduct.name}
ブランド: ${brand || "商品ページと添付画像から確認"}
カテゴリ: ${mainProduct.category}
商品画像URL: ${mainProduct.image || "なし"}
商品ページURL: ${mainProduct.url || "なし"}

【選択した商品】
${items}

【登録済みの同じブランドの追加候補】
${brandItems}

【ブランドコーデの絶対条件】
${brandCoordinationInstruction}

${personInstruction}

【服の見せ方】
${productDisplayInstruction}

【日本語のデザイン】
ファッションの特徴を「なやみ → かいけつ → かわいくなる理由」の流れで、余白に短く入れる。
雑誌のようにおしゃれで、少し楽しく、思わず読みたくなる配置にする。
文字は大きすぎず、人物や服に重ねない。むずかしい漢字は使わず、読みやすい日本語にする。
次の文章を基本に、意味を変えず自然に整えて使う:
${imageCopy.map((line) => `・${line}`).join("\n")}

【商品の手書き風ポイント】
・服と小物は写真らしい質感のまま残し、それぞれの近くに手書き風の矢印、細い囲み線、下線、ミニふきだしを添える
・くすみピンク、こげ茶、白を中心にしたペン画風で、雑誌の手書きメモや上品なスクラップブックのように仕上げる
・小さなリボン、ハート、きらめき、レース線、マスキングテープ風のアクセントを少量だけ使う
・各アイテムへの矢印は正しい服や小物を指し、短いポイントを3〜5個だけ配置する
・人物の顔や服の大事な部分へ文字やかざりを重ねない。余白を生かし、情報を詰め込みすぎない
・テンプレートを貼っただけに見せず、線の太さ、文字サイズ、囲み方に変化をつけ、丁寧に作り込んだ編集画像にする
・手書き風でも日本語ははっきり読めるようにし、誤字や文字化けを出さない

入れるポイント候補:
${productPointNotes.map((line) => `・${line}`).join("\n")}

【文字のルール】
・日本語の誤字、文字化け、意味のない文字を出さない
・文字数を増やしすぎない。読みにくい場合は文章を減らす
${imageTextRestriction}
・英語だけの見出しにせず、かわいい日本語を中心にする

【最終チェック】
・縦3:4になっている
${finalSubjectCheck}
${originalProductPhotoMode ? "" : "・マスクが無い、変形した、口や鼻が見える場合は完成扱いにせず、元写真と同じマスクへ直してから出力する"}
・1536×2048px相当以上の縦3:4で、人物、商品、文字が鮮明になっている
${isHanakoTeacherPattern(coordinate.imagePattern) ? `・画像ボードと同じハナコ先生アイコンがある
・見出しは「ハナコ先生のズバッとひとこと」になっている
・吹き出し本文「${hanakoTeacherComment}」の最初から最後の閉じかぎ括弧まで、省略や欠けがなく最大3行で読める
・吹き出しは画像下端から8%以上離れ、本文の全周に内側余白がある
・先生の吹き出しは1個、商品への手書きポイントは3〜5個あり、互いに重ならず読みやすい` : ""}
・コーデが主役で、商品が自然に組み合わされている
・悩み「${coordinate.concern}」への解決が、シルエットと色の両方で伝わる
・季節とシーンに合わない厚着、薄着、靴、小物になっていない
・主役以外の商品が主張しすぎず、コーデ全体に一つの視線の流れがある
・画像にない商品を、実際に着用した商品として説明していない
・余白の日本語が読みやすく、課題解決風でかわいい
・右下の端が自然な完全な白になっている
・画像内に楽天ROOMを示す文字が入っていない

以上の条件をすべて守り、文章による説明や紹介文は返さず、完成画像だけを生成してください。`;
}

function generateGeminiCaptionPrompt() {
  const coordinate = getSelectedCoordinate();
  if (!coordinate.products.length) return showToast("コーデに使う商品を選んでください");
  if (!document.querySelector("#coordMainProduct")?.value) return showToast("紹介する主役商品を選んでください");
  coordGeminiPrompt.value = buildCoordinateCaptionPrompt(coordinate);
  document.querySelector("#coordStatus").textContent = "紹介文プロンプト作成済み";
  showToast("コーデ紹介文のプロンプトを作りました");
}

function buildCoordinateCaptionPrompt(coordinate) {
  const mainProduct = coordinate.mainProduct || coordinate.products[0];
  const stylingPlan = buildCoordinateAnalysis(coordinate);
  const greeting = buildRandomFashionGreeting();
  const brand = getCoordinateBrand(mainProduct);
  const brandProducts = getSameBrandProducts(mainProduct);
  const items = coordinate.products.map((product) => `・${product.category}: ${product.name}
  ブランド: ${getCoordinateBrand(product) || "商品ページで確認"}
  推しポイント: ${product.hook || createCoordinateHook(product)}
  価格メモ: ${product.price || "未設定"}`).join("\n");
  const brandItems = brandProducts.length
    ? brandProducts.map((product) => `・${product.category}: ${product.name}\n  推しポイント: ${product.hook || createCoordinateHook(product)}`).join("\n")
    : "追加候補なし";
  return `次の完成コーデを読者へ紹介する、短くてかわいい文章を1案作ってください。商品の一覧説明ではなく、主役商品と同じブランドのアイテムをどう組み合わせたコーデなのかが伝わる文章にしてください。

雰囲気: ${coordinate.style}
シーン: ${coordinate.occasion}
髪型: ${coordinate.hairStyle}
画像パターン: ${coordinate.imagePattern}
解決したい悩み: ${coordinate.concern}
一番優先すること: ${coordinate.priority}
色バランス: ${coordinate.colorMood}
季節: ${coordinate.season}
主役商品: ${mainProduct.name}
主役ブランド: ${brand || "商品ページで確認"}

選んだ商品:
${items}

同じブランドの追加候補:
${brandItems}

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
・240〜380文字くらいで、短い文と空行を使い、スマホで読みやすくまとめる
・話し手は礼儀正しく、ファッションが大好きな女子大生
・ハナコ先生として、自信のあるファッション解説に、愛のある鋭いひと言、くすっとする面白さ、女子大生らしい共感を自然に入れる
・「よくある服のなやみ → このコーデでのかいけつ → かわいく見える理由」の順で書く
・悩み「${coordinate.concern}」に共感し、選んだ服の形・色・小物がどう解決するかを具体的に書く
・「かわいい」「高見え」だけで済ませず、シルエット、色数、重心、丈、素材、小物、着回しから今回本当に役立つものを2〜3個選んで説明する
・先生らしい実用アドバイスとして「なぜ似合うか」「選ぶときに見る場所」「手持ち服で再現する方法」のうち2つ以上を必ず入れる
・買う前に確認するポイントを1つ入れる。サイズ、丈、透け感、素材、洗濯表示、手持ち服との相性から商品に合うものを選ぶ
・抽象的なほめ言葉を続けず、読者が明日の服選びで実際に試せる内容にする
・主役商品を必ず具体的に紹介し、同じブランドの商品を複数合わせた統一感にもふれる
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
    "ハナコ先生の吹き出し解説": "完成コーデを大きく見せ、今回選ばれたハナコの丸い先生アイコンを左下の安全な余白へ、顔がはっきり見える約28〜30%の大きさで配置する。先生は左端から約3%の余白まで寄せて輪郭を切らず、吹き出しは先生の右側へ置く。先生の吹き出し1個で悩みの解決を短く総評し、主役商品と小物の近くには別途、手書き風の矢印・丸囲み・下線・短いメモを3〜5個入れる。上部10%は短い見出し、中央約68%は完成コーデ、下部約22%は先生解説として毎回同じ情報階層を保つ。ファッション誌の解説ページのように、かわいく高品質で読みやすく整理する。",
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
  const main = coordinate.products[0];
  const analysis = buildCoordinateAnalysis(coordinate);
  const categoryLine = {
    ワンピース: "1まいで、ちゃんとかわいい♡",
    トップス: "顔まわりが、ぱっと明るく♡",
    アウター: "はおるだけで、きれいにまとまる",
    スカート: "ふわっと感で、やさしい印象に",
    パンツ: "甘めトップスを、すっきり見せ♡",
    バッグ: "小さめバッグで、ぬけ感をプラス",
    シューズ: "足もとをそろえると、大人っぽい",
    アクセサリー: "きらっと小ものが、ちょうどいい",
  }[main?.category] || "色をそろえて、大人かわいく♡";
  return [
    `${coordinate.concern}を、かわいくかいけつ♡`,
    trimText(analysis.solution, 30),
    categoryLine,
    `${coordinate.occasion}×${coordinate.priority}に、ちょうどいい♡`,
  ];
}

function buildHandwrittenProductPoints(coordinate) {
  const pointByCategory = {
    ワンピース: "ワンピの近く: 『1まいで、ちゃんとかわいい♡』",
    トップス: "トップスの近く: 『顔まわり、ぱっと明るく♡』",
    アウター: "はおりの近く: 『さっと重ねて、きれい見え』",
    スカート: "スカートの近く: 『ふわっと感が、ちょうどいい』",
    パンツ: "パンツの近く: 『すっきり見えで、甘さを調整』",
    バッグ: "バッグの近く: 『小さめで、ぬけ感をプラス』",
    シューズ: "足もとの近く: 『色をそろえて、大人っぽく』",
    アクセサリー: "アクセの近く: 『きらっと感を、ひとさじ♡』",
  };
  return coordinate.products
    .slice(0, 5)
    .map((product, index) => `${index === 0 ? "主役♡ " : ""}${pointByCategory[product.category] || "小ものの近く: 『コーデが、きゅっとまとまる』"}`);
}

function openGemini() {
  openGeminiDestination();
}

function openGeminiDestination() {
  const userAgent = navigator.userAgent || "";
  const isAndroid = /Android/i.test(userAgent);
  const isIos = /iPhone|iPad|iPod/i.test(userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

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
  result.innerHTML = `<img src="${dataUrl}" alt="Geminiで作った着用イメージ"><a class="primary" download="hanako-gemini-outfit.png" href="${dataUrl}">添付画像を保存</a>`;
  document.querySelector("#coordStatus").textContent = "Gemini画像添付済み";
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
  markSocialGeminiPromptStale();
  const learnedLabel = context.learnedPattern.sampleSize >= 2 ? "実績から最適化" : "新規テスト";
  document.querySelector("#outputMeta").textContent = `${activePlatform} / 18構成から自動選抜 / ${viralPatternLabels[context.viralPattern]} / ${learnedLabel} / ${context.ownershipVoice.status}`;
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
  markSocialGeminiPromptStale();
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

function generateSocialGeminiImagePrompt(quiet = false) {
  const data = getSocialGeminiPromptData();
  if (!data) return false;
  snsGeminiPrompt.value = buildSocialGeminiImagePrompt(data);
  socialGeminiPromptNeedsRefresh = false;
  setSocialGeminiMode("image");
  setSocialGeminiStatus(`${activePlatform}画像用`);
  if (!quiet) showToast(`${activePlatform}の画像プロンプトを作りました`);
  renderSocialGeminiProgress();
  return true;
}

function generateSocialGeminiCopyPrompt(quiet = false) {
  const data = getSocialGeminiPromptData();
  if (!data) return false;
  snsGeminiPrompt.value = buildSocialGeminiCopyPrompt(data);
  socialGeminiPromptNeedsRefresh = false;
  setSocialGeminiMode("copy");
  setSocialGeminiStatus(`${activePlatform}投稿文用`);
  if (!quiet) showToast(`${activePlatform}の投稿文プロンプトを作りました`);
  renderSocialGeminiProgress();
  return true;
}

function sendSocialGeminiToGemini(mode) {
  const generated = mode === "image"
    ? generateSocialGeminiImagePrompt(true)
    : generateSocialGeminiCopyPrompt(true);
  if (generated) copyAndOpenSocialGemini();
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
  };
}

function buildSocialGeminiImagePrompt({ context: c, labels, currentDraft }) {
  const product = c.product;
  const details = product.details || {};
  const supportingProducts = c.products
    .slice(1)
    .filter((item) => (item.category === "ホテル・旅行") === c.isTravel)
    .slice(0, 3)
    .map((item) => `・${item.name} / ${item.category} / ${item.price || "価格未設定"}\n  画像URL: ${item.image || "なし"}`)
    .join("\n") || "なし";
  const visualByPlatform = {
    Instagram: `縦4:5（1080×1350px）の保存したくなる投稿画像を1枚作る。主役商品を大きく見せ、表紙見出し、短いポイント3つ、手書き風の矢印や囲みを上品に配置する。`,
    Threads: `縦4:5（1080×1350px）の自然なライフスタイル画像を1枚作る。日常の一場面らしい親しみと共感を優先し、文字は短いひと言と手書きポイント2つまでにする。`,
    X: `横16:9（1600×900px）の一目で内容が分かる情報画像を1枚作る。比較・ランキング・速報・チェック項目が3秒で読める構成にし、見出しは短く強くする。`,
  }[c.platform];
  const topicInstruction = c.isTravel
    ? `添付した宿泊施設の写真を主役にし、客室・眺望・アクセスなど確認できる魅力を整理する。写真にない設備や景色を作らない。`
    : `添付した商品画像を主役にし、色・形・素材感を変えず、${labels.fashionOccasion}で使うイメージが自然に伝わるようにする。`;
  return `画像を生成してください。これは${c.platform}投稿用の画像生成依頼です。文章だけで回答せず、添付した商品画像または施設画像を使って完成画像を1枚生成してください。

【投稿先】
${c.platform}

【画像の構成】
${visualByPlatform}
${topicInstruction}

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
・商品名を長く載せず、見出しは12〜18文字、説明は短くする
・商品や人物の大切な部分へ文字を重ねない
・サービス名、URL、値段、ブランドロゴを新しく画像内へ追加しない
・確認できない効果、使用感、売上、人気、順位を作らない
・実物の商品や施設を別物へ変えない

完成画像だけを生成し、説明文や投稿文は返さないでください。`;
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
・内部で冒頭フックを18案、構成を6案考え、媒体と目的に最も合う1案を選ぶ
・選んだ理由や検討過程、別案は出力しない
・完成後に、媒体の文字量、具体性、共感、信頼、CTA、広告表記、重複の少なさを自己確認する
・弱い場合は内部で書き直し、合格した完成稿だけを返す

【文章の絶対条件】
・下書きの良い部分は生かすが、そのまま言い換えるだけにしない
・最初の1〜2行で「自分のことかも」と思える具体的な場面か悩みを示す
・商品名より先に、読者が止まる情景・違和感・結論のどれかを置く
・悩み → 気づき → この商品が候補になる理由 → 次の行動、の流れにする
・くすっとする面白さと愛のある鋭いひと言を少しだけ入れる
・商品ページで確認できた事実と、話し手の感想・予想を混同しない
・同じ意味の言葉、同じCTA、同じ商品名を何度も繰り返さない
・絵文字には「感情」「情報の区切り」「次の行動」の役割を持たせ、飾りとして連続させない
・同じ絵文字を繰り返さず、1行に絵文字を2個以上並べない
・広告表記、URL、ハッシュタグの行には絵文字を付けない
・上から目線、乱暴な呼びかけ、煽り、誇大表現、不自然な若者言葉を使わない
・購入や使用を確認できない場合は、使ったように断定しない
・価格、在庫、サイズ、効果、人気、順位を作らない
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

function setSocialGeminiMode(mode) {
  document.querySelector("#generateSocialGeminiImage")?.classList.toggle("active", mode === "image");
  document.querySelector("#generateSocialGeminiCopy")?.classList.toggle("active", mode === "copy");
}

function copyAndOpenSocialGemini() {
  const prompt = snsGeminiPrompt?.value.trim();
  if (!prompt) return showToast("先に画像か投稿文のプロンプトを作ってください");
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
  preview.innerHTML = `<img src="${socialGeminiGeneratedImageDataUrl}" alt="Geminiで作った${escapeHtml(activePlatform)}投稿画像">`;
  downloadButton.disabled = false;
  document.querySelector("#snsGeminiResultDetails").open = true;
  setSocialGeminiStatus("完成画像あり");
  renderSocialGeminiProgress();
  showToast("完成画像を読み込みました");
}

function applySocialGeminiCopy() {
  const result = document.querySelector("#snsGeminiResult")?.value.trim();
  if (!result) return showToast("Geminiの完成投稿文を貼り付けてください");
  postOutput.value = result;
  lastGenerated = result;
  document.querySelector("#outputMeta").textContent = `${activePlatform} / Gemini仕上げを反映`;
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
  if (snsGeminiPrompt?.value.trim()) {
    socialGeminiPromptNeedsRefresh = true;
    setSocialGeminiStatus("条件変更あり");
    renderSocialGeminiProgress();
  }
}

function renderSocialGeminiProgress() {
  const product = state.products.find((item) => item.id === selectedProduct?.value) || state.products[0];
  const hasProduct = Boolean(product);
  const hasPrompt = Boolean(snsGeminiPrompt?.value.trim()) && !socialGeminiPromptNeedsRefresh;
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
        ? "画像か投稿文を選ぶと、コピーしてGeminiが開きます"
        : !hasReturnedResult
          ? "Geminiで作成後、この画面へ戻って結果を貼り付けます"
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
  return Array.from({ length: 18 }, (_, index) => ({
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
  return cleanGeneratedCopy(result);
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
  return score;
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

  let reloadingForUpdate = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadingForUpdate) return;
    reloadingForUpdate = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js", { updateViaCache: "none" })
      .then((registration) => registration.update())
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
