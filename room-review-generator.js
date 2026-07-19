(function () {
  "use strict";

  const MAX_POST_CHARS = 480;
function generatePostText({ name, shopName, genreName, features, targetTags, catchcopy, variationSeed = 0 }) {
  const brand = inferBrand(name, shopName);
  const category = resolveProductCategory(name, genreName, catchcopy);
  const resolvedFeatures = refineFeaturesForCategory(category, features);
  const featureA = resolvedFeatures[0] || "きれいめデザイン";
  const featureB = resolvedFeatures[1] || "着回し力";
  const productLabel = `${brand ? `${brand}の` : ""}${name}`;
  const seed = `${name} ${catchcopy} ${featureA} ${featureB} variation-${variationSeed}`;
  const copySeed = buildReviewCopySeed(category, seed);
  const openingEmojiSeed = nextOpeningEmojiSeed(copySeed);
  const worry = inferWorry(category, resolvedFeatures, copySeed);
  const openingLine = applyOpeningEmoji(inferOpeningLine(category, worry, copySeed, featureA, featureB), category, openingEmojiSeed);
  const lead = inferLead(category, featureA, featureB, copySeed);
  const detail = inferDetail(category, featureA, featureB, copySeed);
  const salesLine = inferSalesLine(category, featureA, featureB, copySeed);
  const clickLine = inferClickLine(category, featureA, featureB, copySeed);
  const trustLine = inferTrustLine(category, featureA, featureB, copySeed);
  const finalPushLine = inferFinalPushLine(category, copySeed);
  const humanLine = inferReaderEmpathyLine(category, featureA, featureB, copySeed);
  const focusedCategory = isFocusedCategory(category) || category.includes("ランジェリー");
  const buyerLine = pickByHash(focusedCategory ? [salesLine, clickLine] : [salesLine, clickLine, trustLine, finalPushLine], `${copySeed} buyer`);
  const points = inferPoints(category, resolvedFeatures, copySeed)
    .map((point) => convertCheckPointToBenefit(point, category, copySeed));
  const coords = inferCoords(category, resolvedFeatures, copySeed);
  const tags = targetTags.slice(0, 12);
  const usageHeading = isNonFashionCategory(category) ? "💫おすすめの楽しみ方" : "💫コーデ＆使い方";

  const post = `${openingLine}

${lead}
${detail}
${humanLine}
${buyerLine}

✔ポイント
・${decoratePoint(points[0], 0, category, seed)}
・${decoratePoint(points[1], 1, category, seed)}
・${decoratePoint(points[2], 2, category, seed)}

${usageHeading}
${coordEmoji(category, seed, 0)}${coords[0]}${endingEmoji(category, seed, "coord-1")}
${coordEmoji(category, seed, 1)}${coords[1]}${endingEmoji(category, seed, "coord-2")}

🍀━━━━━━━━━━━━🍀
🐾 #ファッションハナコ
🍀━━━━━━━━━━━━🍀

${tags.join(" ")}`;

  return trimToLimit(diversifyPostEmojis(polishPostText(fitPostText(post, {
    name,
    productLabel,
    category,
    featureA,
    featureB,
    worry,
    openingLine,
    tags,
    seed: copySeed,
    lead,
    detail,
    humanLine,
    buyerLine,
    points,
    coords,
  })), category, seed), MAX_POST_CHARS);
}

function polishPostText(text) {
  const replacements = [
    [/体型カバーしやすい/g, "体型をきれいに見せやすい"],
    [/体型カバーしながら/g, "体のラインを整えながら"],
    [/体型カバーに/g, "体のラインを整える着こなしに"],
    [/体型カバーと/g, "体型をきれいに見せる工夫と"],
    [/体型カバーも/g, "体型をきれいに見せる工夫も"],
    [/二の腕カバーに期待/g, "二の腕が華奢に見えるデザインに期待"],
    [/二の腕カバーしやすい/g, "二の腕が華奢に見えやすい"],
    [/腰まわりをカバーしやすい/g, "腰まわりをすっきり見せやすい"],
    [/下半身をカバーしやすい/g, "下半身をすっきり見せやすい"],
    [/体型カバー/g, "体型をきれいに見せる"],
    [/二の腕カバー/g, "二の腕が華奢に見える"],
    [/腰まわりをカバー/g, "腰まわりをすっきり見せる"],
    [/下半身をカバー/g, "下半身をすっきり見せる"],
    [/体型をきれいに見せるはしたい/g, "体型はきれいに見せたい"],
    [/カバーしやすい/g, "きれいに見せやすい"],
    [/隠しながら/g, "きれいに見せながら"],
    [/隠せる/g, "きれいに見せられる"],
    [/使いやすく毎日使いしやすい/g, "使いやすく毎日頼れます"],
    [/使いやすくデイリーに使いやすい/g, "使いやすくデイリーに頼れます"],
    [/雰囲気が出て雰囲気を変えやすい/g, "雰囲気が出て着回しやすい"],
    [/頼れますです/g, "頼れます"],
    [/活躍しますです/g, "活躍します"],
    [/収納力なら、コーデ全体がきれいめに整います/g, "収納力がありつつ、コーデ全体もきれいめに整います"],
    [/軽量デザインなら、コーデ全体がきれいめに整います/g, "軽量デザインで持ちやすく、コーデ全体もきれいめに整います"],
    [/ショルダー仕様なら、コーデ全体がきれいめに整います/g, "ショルダー仕様で使いやすく、コーデ全体もきれいめに整います"],
    [/スニーカーで外すと、女性らしさが増して/g, "スニーカーで外すと、抜け感が出て"],
    [/顔まわりに足すだけで、褒められるきらめきを足せます/g, "顔まわりに足すだけで、褒められるきらめきが出ます"],
    [/毎日使えるプチプラでも高見えアクセ/g, "毎日使える高見えアクセ"],
    [/プチプラでも高見えアクセ/g, "高見えアクセ"],
    [/プチプラでも高見え感/g, "高見え感"],
    [/プチプラでも高見えする/g, "高見えする"],
    [/プチプラでも高見えを/g, "高見えを"],
    [/持つだけでプチプラでも高見え/g, "持つだけで高見え"],
    [/着るだけでプチプラでも高見え/g, "着るだけで高見え"],
    [/プチプラでも高見え💫/g, "高見え💫"],
    [/セットアップ対応ならセットでも/g, "セットアップなら上下でも"],
    [/セットアップ対応で上下に/g, "セットアップで上下に"],
    [/柔らかニット素材の柔らかな表情/g, "柔らかニット素材の表情"],
    [/上品な腕時計の上品な存在感/g, "上品な腕時計で"],
    [/オールインワンが縦ライン/g, "オールインワンの縦ライン"],
    [/きちんとスーツできちんと感/g, "きちんと感のあるスーツで"],
    [/大人デニム素材で/g, "大人っぽいデニムで"],
    [/毎日使いやすい小物なら、デイリーに使いやすい/g, "毎日使いやすく、自然と出番が増えそうな"],
    [/シンプルトップスでも、デートにも休日にも使いやすい/g, "シンプルトップスを合わせるだけで、デートにも休日にも使いやすい"],
    [/です！([✨💖🎀👗💫🤍🫶♡🌿])/g, "です$1"],
    [/ます！([✨💖🎀👗💫🤍🫶♡🌿])/g, "ます$1"],
  ];
  const source = String(text || "");
  const tagIndex = source.lastIndexOf("\n\n#");
  const tagBlock = tagIndex === -1 ? "" : source.slice(tagIndex);
  let next = tagIndex === -1 ? source : source.slice(0, tagIndex);
  for (const [pattern, replacement] of replacements) {
    next = next.replace(pattern, replacement);
  }
  next = next
    .replace(/！！+/g, "！")
    .replace(/です！([🔍◎])/g, "です$1")
    .replace(/ます！([🔍◎])/g, "ます$1");
  return `${next}${tagBlock}`;
}

let openingEmojiRotation = 0;
const OPENING_EMOJI_SOURCE = "(?:☁️|👗|🎀|👜|👟|💍|🧢|🕶️|🌂|🧸|🍰|🍫|☕|🍵|🥤|🍽️|🍚|🥣|🍳|🧴|💄|✨|🏠|🧺|🌿|🐾|🎁|📝|🎮|🔌|💫)";
const OPENING_EMOJI_PATTERN = new RegExp(`^${OPENING_EMOJI_SOURCE}`, "u");

function nextOpeningEmojiSeed(seed) {
  openingEmojiRotation = (openingEmojiRotation + 1) % 997;
  return `${seed} opening emoji ${openingEmojiRotation}`;
}

function openingEmojiForCategory(category, seed) {
  const text = String(category || "");
  const groups = [
    [/ワンピ|トップス|パンツ|スカート|カーディガン|アウター|セットアップ|オールインワン|デニム|ニット|スーツ|レッグウェア|水際ファッション|フォーマル|ルームウェア|浴衣|マタニティ|インナー|ランジェリー|スポーツウェア|レインウェア|ブライダル/, ["👗", "🎀", "✨", "💫"]],
    [/バッグ|財布|ファッション小物/, ["👜", "🎀", "✨"]],
    [/シューズ/, ["👟", "✨", "💫"]],
    [/アクセサリー|腕時計|ヘアアクセサリー|ベルト/, ["💍", "✨", "🎀"]],
    [/帽子|サングラス|手袋|アームカバー|傘|ストール/, ["🧢", "🕶️", "🌂", "✨"]],
    [/スイーツ/, ["🍰", "🍫", "🎁", "✨"]],
    [/食品/, ["🍽️", "🍚", "🥣", "✨"]],
    [/飲料/, ["☕", "🍵", "🥤", "✨"]],
    [/キッチン用品/, ["🍳", "🥣", "✨"]],
    [/日用品|収納|インテリア/, ["🏠", "🧺", "🌿", "✨"]],
    [/コスメ|スキンケア|美容家電/, ["💄", "🧴", "✨"]],
    [/家電/, ["🔌", "🏠", "✨"]],
    [/ベビー・キッズ|おもちゃ/, ["🧸", "🎁", "✨"]],
    [/ペット用品/, ["🐾", "🌿", "✨"]],
    [/健康|スポーツ・アウトドア/, ["🌿", "✨", "💫"]],
    [/文房具/, ["📝", "✨", "🎀"]],
  ];
  const matched = groups.find(([pattern]) => pattern.test(text));
  return pickByHash(matched ? matched[1] : ["✨", "💫", "🎀", "☁️"], `${seed} opening emoji`);
}

function openingEmojiFromLine(line, fallback = "☁️") {
  const match = String(line || "").match(OPENING_EMOJI_PATTERN);
  return match ? match[0] : fallback;
}

function removeOpeningEmoji(line) {
  return String(line || "").replace(OPENING_EMOJI_PATTERN, "");
}

function applyOpeningEmoji(line, category, seed) {
  return `${openingEmojiForCategory(category, seed)}${removeOpeningEmoji(line)}`;
}

function fitPostText(post, parts) {
  if (countChars(post) <= MAX_POST_CHARS && countChars(post) >= 360) return post;

  if (countChars(post) < 360) {
    const fuller = insertBeforeSection(
      post,
      "✔ポイント",
      `${inferWarmExtraLine(parts.category, parts.featureA, parts.featureB, parts.seed)}\n\n`
    );
    if (countChars(fuller) <= MAX_POST_CHARS) return fuller;
  }

  const shortWorry = truncateText(parts.worry, 58);
  const fallbackOpeningEmoji = openingEmojiFromLine(parts.openingLine, openingEmojiForCategory(parts.category, parts.seed));
  const shortOpeningLine = parts.openingLine && parts.openingLine.includes("今")
    ? truncateSaleOpeningLine(parts.openingLine)
    : `${fallbackOpeningEmoji}“${shortWorry}”を解決♡`;
  const shortTags = parts.tags.slice(0, 6);
  const post2 = `${shortOpeningLine}

${parts.lead}
${parts.detail}
${parts.humanLine}
${parts.buyerLine}

✔ポイント
・${decoratePoint(parts.points[0], 0, parts.category, parts.seed)}
・${decoratePoint(parts.points[1], 1, parts.category, parts.seed)}
・${decoratePoint(parts.points[2], 2, parts.category, parts.seed)}

💫コーデ＆使い方
${coordEmoji(parts.category, parts.seed, 0)}${parts.coords[0]}${endingEmoji(parts.category, parts.seed, "short-coord-1")}
${coordEmoji(parts.category, parts.seed, 1)}${parts.coords[1]}${endingEmoji(parts.category, parts.seed, "short-coord-2")}

🍀━━━━━━━━━━━━🍀
🐾 #ファッションハナコ
🍀━━━━━━━━━━━━🍀

${shortTags.join(" ")}`;
  if (countChars(post2) <= MAX_POST_CHARS) return post2;

  const compactOpeningLine = parts.openingLine && parts.openingLine.includes("今")
    ? truncateSaleOpeningLine(parts.openingLine, 46)
    : `${fallbackOpeningEmoji}“${truncateText(parts.worry, 42)}”を解決♡`;
  const post3 = `${compactOpeningLine}

${truncateText(parts.lead, 58)}
${truncateText(parts.humanLine, 56)}
${truncateText(parts.buyerLine, 58)}

✔ポイント
・${decoratePoint(parts.points[0], 0, parts.category, parts.seed)}
・${decoratePoint(parts.points[1], 1, parts.category, parts.seed)}
・${decoratePoint(parts.points[2], 2, parts.category, parts.seed)}

💫コーデ＆使い方
${coordEmoji(parts.category, parts.seed, 0)}${parts.coords[0]}${endingEmoji(parts.category, parts.seed, "compact-coord-1")}
${coordEmoji(parts.category, parts.seed, 1)}${parts.coords[1]}${endingEmoji(parts.category, parts.seed, "compact-coord-2")}

🍀━━━━━━━━━━━━🍀
🐾 #ファッションハナコ
🍀━━━━━━━━━━━━🍀

${shortTags.slice(0, 5).join(" ")}`;

  if (countChars(post3) <= MAX_POST_CHARS && countChars(post3) >= 340) return post3;

  return trimToLimit(post3, MAX_POST_CHARS);
}

function inferOpeningLine(category, worry, seed, featureA = "", featureB = "") {
  const sale = inferSaleSignal(seed);
  const item = inferSaleItemLabel(category, seed);
  const concern = summarizeConcernForSale(worry, category);
  const feature = truncateText(cleanText(featureA) || cleanText(featureB) || "使いやすさ", 18);
  const nonFashion = isNonFashionCategory(category);
  const accessoryOpening = /サングラス|帽子|財布|ファッション小物|腕時計|ストール|ベルト|手袋|アームカバー|傘|ヘアアクセサリー/.test(String(category || ""));
  const curiosityChoices = nonFashion ? [
    `☁️“${item}選びで迷っている人へ。${feature}、ここは見逃せない…”♡`,
    `☁️“便利そうで終わらない？${feature}なら中身まで確認したい…”♡`,
    `☁️“${concern}…でも${feature}なら、選ぶ候補が変わるかも”♡`,
    `☁️“これ本当に使う？と迷ったら、${feature}をまず見てほしい…”♡`,
    `☁️“毎日の小さな不満、${feature}で変わるなら詳しく見たい…”♡`,
    `☁️“${item}は結局どれがいい？${feature}が選ぶヒントになりそう”♡`,
    `☁️“買ってから後悔したくない${item}。気になる答えは${feature}…”♡`,
    `☁️“今の暮らしに合う？${feature}まで分かると判断しやすい”♡`,
  ] : accessoryOpening ? [
    `☁️“かけた時の印象、${feature}ならレビューまで見たい…”♡`,
    `☁️“小物で失敗したくない人へ。${feature}が選ぶ決め手になりそう”♡`,
    `☁️“顔まわりが変わるかも。秘密は${feature}…”♡`,
    `☁️“買ってから使わないを避けたい。${feature}なら出番が増えそう”♡`,
    `☁️“写真で気になった人へ。${feature}は実物感まで見たい…”♡`,
    `☁️“普段使いで浮かない？${feature}なら合わせやすそう”♡`,
    `☁️“${concern}…その迷い、${feature}で変わるかも”♡`,
    `☁️“手持ち服に合う？${feature}なら小物選びの答えが見つかりそう”♡`,
  ] : [
    `☁️“可愛いだけじゃない。${feature}まで叶うなら詳しく見たい…”♡`,
    `☁️“${concern}なら見て。${feature}が選ぶ決め手になりそう”♡`,
    `☁️“いつものコーデが変わるかも。秘密は${feature}…”♡`,
    `☁️“買ってから着ないを避けたい。${feature}なら出番が増えそう”♡`,
    `☁️“写真で気になった人へ。${feature}はレビューまで見たい…”♡`,
    `☁️“これ、着た時の印象が気になる。${feature}に注目です”♡`,
    `☁️“${concern}…その迷い、${feature}で変わるかも”♡`,
    `☁️“手持ち服に合う？${feature}ならコーデの答えが見つかりそう”♡`,
  ];

  if (!sale) {
    return pickByHash(
      dedupeText(curiosityChoices).filter((line) => countChars(line) <= 64),
      `${seed} curiosity opening`
    );
  }

  if (sale.type === "coupon") {
    const couponDiscount = sale.amount
      ? (/%$/.test(sale.amount) ? `${sale.amount}OFF` : `${sale.amount}円OFF`)
      : "";
    const couponText = sale.amount
      ? `今なら${couponDiscount}クーポン配布中！なくなる前に急いで✨`
      : `今ならクーポン配布中！${feature}が気になる方は終了前にチェック✨`;
    const couponChoices = sale.amount ? [
      `☁️“${couponText}”♡`,
      `☁️“${couponDiscount}は見逃せない！${feature}も今すぐチェック✨”♡`,
      `☁️“迷っていた${item}、今なら${couponDiscount}！終了前に見ておきたい”♡`,
    ] : [
      `☁️“${couponText}”♡`,
      `☁️“迷っていた${item}にクーポン！${feature}まで今すぐ見たい✨”♡`,
      `☁️“クーポンが使える今、${feature}なら候補から外せない…”♡`,
    ];
    return pickByHash(
      couponChoices.filter((line) => countChars(line) <= 64),
      `${seed} coupon opening`
    );
  }

  const saleScene = inferSaleScene(seed);
  const choices = [
    `☁️“${feature}が気になる${item}、${sale.label}の今に中身を見たい…”♡`,
    `☁️“迷っていた${item}が${sale.label}。${feature}まで確認したい…”♡`,
    `☁️“${sale.label}でも、お得なだけで選ばない。${feature}ならレビューも見たくなる”♡`,
    `☁️“${sale.label}を逃す前に、${feature}が本当に合うか見ておきたい”♡`,
    ...curiosityChoices,
    `☁️“${concern}…でも${sale.label}中なら試しやすいかも”を解決♡`,
    `☁️“${concern}なら、${sale.label}の今こそ候補に入れたい…”♡`,
    `☁️“${item}選びで${concern}。${sale.label}なら今チェックしたい…”♡`,
    `☁️“${saleScene}に使える${item}が欲しいけど、${concern}…”♡`,
    `☁️“${concern}。でも損もしたくない…${sale.label}中に見たい…”♡`,
    `☁️“${sale.label}が出てる今、${concern}ならレビューまで見たい…”♡`,
    `☁️“可愛いけど${concern}…そんな${item}こそ${sale.label}中に確認”♡`,
    `☁️“${concern}なら、お得な今に${item}を比べておきたい…”♡`,
    `☁️“${sale.label}対象の${item}、${concern}なら早めに確認したい…”♡`,
    `☁️“${saleScene}用の${item}が欲しい。${concern}なら今が見どき…”♡`,
  ];
  const highIntentChoiceCount = 4;

  if (sale.type === "coupon") {
    choices.push(
      `☁️“${concern}…そんな迷いもクーポン対象なら一気に試しやすい”♡`,
      `☁️“クーポンがある今、気になってた${item}は候補から外せない…”♡`,
      `☁️“クーポン対象の${item}、${concern}ならレビューまで確認したい…”♡`,
      `☁️“${concern}。クーポンがある今ならじっくり比べたい…”♡`,
      `☁️“通常価格で迷う${item}こそ、クーポン中にチェックしておきたい…”♡`
    );
  }
  if (sale.type === "point") {
    choices.push(
      `☁️“${concern}。ポイントも狙える今なら候補に入れたい…”♡`,
      `☁️“ポイントアップ中の${item}、${concern}なら比較しておきたい…”♡`,
      `☁️“買い回り中の${item}選び、${concern}ならレビューも見たい…”♡`,
      `☁️“ポイント還元がある今、${concern}なら候補入り…”♡`,
      `☁️“${concern}なら、ポイント中にレビュー比較したい…”♡`
    );
  }
  if (sale.type === "discount") {
    choices.push(
      `☁️“${sale.label}の${item}、${concern}なら今こそ比べたい…”♡`,
      `☁️“値下げ中の今、${concern}なら${item}を見ておきたい…”♡`,
      `☁️“割引が出てるうちに、${concern}ならレビューまで確認したい…”♡`,
      `☁️“${item}選びで${concern}。セールなら試すきっかけになる…”♡`,
      `☁️“お得な今だから、普段選ばない可愛い${item}にも挑戦しやすい…”♡`,
      `☁️“${sale.label}中の${item}、${concern}なら早めに比較したい…”♡`
    );
  }
  if (sale.type === "limited") {
    choices.push(
      `☁️“${sale.label}は後回しにすると逃しがち。${concern}なら今見たい”♡`,
      `☁️“在庫がある今こそ、${concern}なら${item}を探したい…”♡`,
      `☁️“${sale.label}の${item}、${concern}なら早めに動きたい…”♡`,
      `☁️“後で見たら終わってた…を避けたい${sale.label}の${item}です”♡`,
      `☁️“限定感がある今、${concern}ならレビューだけでも見たい…”♡`,
      `☁️“${concern}が気になるなら、売り切れ前にサイズ確認したい…”♡`
    );
  }
  if (sale.type === "shipping") {
    choices.push(
      `☁️“送料無料の${item}、${concern}なら試しやすい…”♡`,
      `☁️“送料込みで見られる今、${concern}なら${item}も候補入り…”♡`,
      `☁️“送料で迷う${item}こそ、${concern}なら今チェックしたい…”♡`,
      `☁️“${saleScene}用に欲しい${item}、送料無料なら選ぶ決め手になる…”♡`
    );
  }

  return pickByHash(
    dedupeText(choices.slice(0, highIntentChoiceCount)).filter((line) => countChars(line) <= 64),
    `${seed} sale opening`
  );
}

function inferSaleItemLabel(category, seed) {
  const text = String(seed || "");
  const nonFashion = getNonFashionProfile(category);
  if (nonFashion) return nonFashion.label;
  if (category.includes("シューズ")) {
    if (/サンダル/.test(text)) return "サンダル";
    if (/パンプス/.test(text)) return "パンプス";
    if (/スニーカー/.test(text)) return "スニーカー";
    if (/ローファー/.test(text)) return "ローファー";
    if (/ブーツ/.test(text)) return "ブーツ";
    return "シューズ";
  }
  if (category.includes("バッグ")) return "バッグ";
  if (category.includes("ランジェリー")) return "ランジェリー";
  if (category.includes("インナー")) return "インナー";
  if (category.includes("ワンピース")) return "ワンピ";
  if (category.includes("カーディガン")) return "カーデ";
  if (category.includes("傘")) return "傘";
  return inferWorryProfile(category).item || "アイテム";
}

function summarizeConcernForSale(worry, category = "") {
  const source = String(worry || "");
  if (isNonFashionCategory(category)) {
    return truncateText(source.replace(/[…。]+$/g, ""), 28);
  }
  if (category.includes("シューズ")) return "歩きやすさやサイズ感が気になる";
  if (category.includes("バッグ")) return "荷物の収まりや持ちやすさが気になる";
  if (category.includes("ランジェリー") || category.includes("インナー")) return "ラクさときれい見えを両方選びたい";
  if (category.includes("傘")) return "重さや開閉のしやすさが気になる";
  if (category.includes("帽子")) return "顔まわりになじむサイズ感か気になる";
  if (category.includes("アクセサリー")) return "大人にも派手すぎず高見えするか気になる";
  if (category.includes("財布")) return "収納と使いやすさを両方選びたい";
  if (category.includes("水際")) return "露出を抑えながら可愛く着られるか気になる";
  const mapped = [
    [/足が痛|歩き|靴|サンダル|パンプス|ローファー|スニーカー/, "歩きやすさやサイズ感が気になる"],
    [/荷物|収納|バッグ|ポーチ|ショルダー|トート/, "荷物が入るか気になる"],
    [/傘|日傘|雨|遮光|晴雨/, "重さや使いやすさが気になる"],
    [/ノンワイヤー|ブラ|下着|インナー|シームレス|脇高|補正/, "ラクさときれい見えを両方欲しい"],
    [/ワンピ|1枚|丈感|シルエット|甘すぎ|部屋着/, "1枚で手抜きに見えないか気になる"],
    [/二の腕|体型|腰まわり|細見え|痩せ見え/, "体型をきれいに見せたい"],
    [/シアー|透け|肌見せ/, "透け感が強すぎないか気になる"],
    [/フリル|リボン|レース|チュール|甘め/, "大人にも甘すぎないか気になる"],
    [/通勤|オフィス|仕事|きちんと/, "通勤にも浮かずに使いたい"],
    [/冷感|UV|紫外線|日焼け|暑い|冷房/, "季節対策もおしゃれも欲しい"],
  ].find(([pattern]) => pattern.test(source));
  if (mapped) return mapped[1];

  return `${inferWorryProfile(category).item || "アイテム"}選びで失敗したくない`;
}

function inferSaleScene(seed) {
  const text = String(seed || "");
  if (/通勤|オフィス|仕事|ビジネス/.test(text)) return "通勤";
  if (/旅行|トラベル|リゾート|旅先/.test(text)) return "旅行";
  if (/デート|女子会|食事|お呼ばれ/.test(text)) return "お出かけ";
  if (/水着|ラッシュ|海|プール|水際/.test(text)) return "水際";
  if (/雨|レイン|撥水|防水/.test(text)) return "雨の日";
  if (/冷感|UV|日焼け|遮光|日傘/.test(text)) return "夏";
  return "毎日使い";
}

function inferSaleSignal(seed) {
  const text = String(seed || "");
  const yenCoupon = text.match(/(?:クーポン[^\d]{0,16})?([1-9]\d{0,2}(?:,\d{3})+|[1-9]\d{0,5})\s*円\s*(?:OFF|オフ|引き|割引)?[^\n]{0,12}クーポン|クーポン[^\d]{0,16}([1-9]\d{0,2}(?:,\d{3})+|[1-9]\d{0,5})\s*円\s*(?:OFF|オフ|引き|割引)?/i);
  if (yenCoupon) {
    const amount = String(yenCoupon[1] || yenCoupon[2] || "").replace(/,/g, "");
    return { type: "coupon", label: `${Number(amount).toLocaleString("ja-JP")}円OFFクーポン`, amount: Number(amount).toLocaleString("ja-JP") };
  }
  const percentCoupon = text.match(/([1-9]\d?)\s*%\s*(?:OFF|オフ|割引)?[^\n]{0,12}クーポン|クーポン[^\d]{0,16}([1-9]\d?)\s*%\s*(?:OFF|オフ|割引)?/i);
  if (percentCoupon) {
    const amount = `${percentCoupon[1] || percentCoupon[2]}%`;
    return { type: "coupon", label: `${amount}OFFクーポン`, amount: `${amount}` };
  }
  const percent = text.match(/([1-9]\d?)\s?%[ 　]*(OFF|オフ|割引|還元)/i);
  const points = text.match(/(ポイント|P)[ 　]*([2-9]|[1-9]\d)倍/i);
  if (/半額|50\s?%[ 　]*(OFF|オフ|割引)/i.test(text)) return { type: "discount", label: "半額級セール" };
  if (percent) return { type: "discount", label: `${percent[1]}%OFF` };
  if (/タイムセール|TIME SALE|Time Sale/i.test(text)) return { type: "limited", label: "タイムセール" };
  if (/スーパーSALE|スーパーセール|楽天スーパーSALE/i.test(text)) return { type: "limited", label: "楽天スーパーSALE" };
  if (/お買い物マラソン|買い回り|買いまわり/i.test(text)) return { type: "point", label: "買い回り期間" };
  if (/クーポン|coupon/i.test(text)) return { type: "coupon", label: "クーポン" };
  if (points) return { type: "point", label: `ポイント${points[2]}倍` };
  if (/ポイントアップ|ポイント還元|ポイントバック|DEAL|ディール/i.test(text)) return { type: "point", label: "ポイントアップ" };
  if (/SALE|セール|値下げ|値引き|特価|目玉|バーゲン|アウトレット/i.test(text)) return { type: "discount", label: "セール価格" };
  if (/期間限定|数量限定|在庫限り|残りわずか|ラスト|先着|早割/i.test(text)) return { type: "limited", label: "期間限定" };
  if (/送料無料|送料込|送料込み|メール便無料/i.test(text)) return { type: "shipping", label: "送料無料" };
  return null;
}

function truncateSaleOpeningLine(line, max = 56) {
  if (countChars(line) <= max) return line;
  const emoji = openingEmojiFromLine(line);
  const inner = removeOpeningEmoji(line).replace(/^“/, "").replace(/”♡$/, "");
  return `${emoji}“${truncateText(inner, Math.max(24, max - 5))}”♡`;
}

function inferWorry(category, features, seed) {
  const nonFashion = getNonFashionProfile(category);
  if (nonFashion) return pickByHash(nonFashion.worries, `${seed} non-fashion worry`);
  const featureText = features.join(" ");
  const featureWorries = [];

  if (featureText.includes("体型カバー")) {
    featureWorries.push(
      "体型カバーしたいけど、隠してます感が出る服は避けたい…",
      "ラクに着たいのに、腰まわりだけ悪目立ちする服はもう選びたくない…",
      "ゆるっと着たいけど、全身が大きく見えるのは避けたい…"
    );
  }
  if (featureText.includes("シアー")) {
    featureWorries.push(
      "透け感アイテムって可愛いけど、安っぽく見えたり着こなしが難しそう…",
      "軽やかに見せたいのに、肌見せが強すぎると大人には難しそう…",
      "涼しげに着たいけど、だらしなく見えないかちょっと不安…"
    );
  }
  if (featureText.includes("プリーツ")) {
    featureWorries.push(
      "プリーツは可愛いけど、広がって腰まわりが大きく見えそう…",
      "揺れ感は欲しいけど、甘すぎて子どもっぽくなるのは避けたい…",
      "華やかに見せたいのに、ボリュームが出すぎると太見えしそう…"
    );
  }
  if (featureText.includes("センタープレス") || featureText.includes("テーパード")) {
    featureWorries.push(
      "パンツで楽したいけど、脚のラインやきちんと感は妥協したくない…",
      "細見えパンツが欲しいけど、窮屈で疲れるものは続かなそう…",
      "オフィスにも使いたいのに、地味すぎるパンツは気分が上がらない…"
    );
  }
  if (/フレア|Aライン|マーメイド/.test(featureText)) {
    featureWorries.push(
      "女性らしいシルエットは好きだけど、腰まわりが広がって見えるのは避けたい…",
      "華やかに見せたいのに、甘すぎたり気合いが入りすぎて見えるのは不安…",
      "きれいなラインの服が欲しいけど、歩きにくいものは結局選ばなくなりそう…"
    );
  }
  if (/二の腕カバー|パフ|ドルマン|五分袖/.test(featureText)) {
    featureWorries.push(
      "二の腕は隠したいけど、袖が重たく見える服は避けたい…",
      "腕まわりをカバーしたいのに、全体まで大きく見えるのは困る…",
      "涼しく着たいけど、肌見せしすぎるトップスはちょっと不安…"
    );
  }
  if (/着映え柄|華やか柄|大人可愛い柄|きちんと柄/.test(featureText)) {
    featureWorries.push(
      "柄ものは可愛いけど、派手すぎて着回しにくいものは避けたい…",
      "いつもの服を変えたいけど、柄選びで子どもっぽく見えるのは不安…",
      "写真映えは欲しいけど、普段にも浮かずに着られる柄がいい…"
    );
  }
  if (/楽ちんウエスト|ストレッチ|柔らかニット/.test(featureText)) {
    featureWorries.push(
      "ラクな服が欲しいけど、だらしなく見えるのは避けたい…",
      "着心地は重視したいけど、きちんと感までなくなるのは困る…",
      "長時間着る日こそ、ラクさもきれい見えも両方欲しい…"
    );
  }
  if (/ロング丈|マキシ丈/.test(featureText)) {
    featureWorries.push(
      "ロング丈は好きだけど、重たく見えたり低身長だとバランスが難しそう…",
      "大人っぽく着たいのに、丈感で野暮ったく見えるのは避けたい…",
      "体型カバーはしたいけど、全体がのっぺり見える服は不安…"
    );
  }
  if (/涼しげ|接触冷感|UV|軽量/.test(featureText)) {
    featureWorries.push(
      "暑い日もおしゃれしたいけど、汗ばむ服や重たい服は選びたくない…",
      "機能性は欲しいけど、スポーティーすぎて普段服に合わないのは困る…",
      "夏に使える服が欲しいけど、安っぽく見えるものは避けたい…"
    );
  }
  if (/収納力|ショルダー|トート|ミニバッグ/.test(featureText)) {
    featureWorries.push(
      "バッグは可愛さで選びたいけど、荷物が入らないと結局出番が減りそう…",
      "毎日使いたいのに、安っぽく見えるバッグは避けたい…",
      "小さめバッグが好きだけど、最低限の荷物が入るか気になる…"
    );
  }
  if (/パンプス|サンダル|スニーカー|ローファー/.test(featureText)) {
    featureWorries.push(
      "靴は可愛さで選びたいけど、痛くて歩けないものは避けたい…",
      "足元で垢抜けたいけど、手持ち服に合わせにくい靴は困る…",
      "きれいめに見せたいのに、疲れやすい靴だと結局履かなくなりそう…"
    );
  }
  if (/シームレス|ラインレス/.test(featureText)) {
    featureWorries.push(
      "薄手の服を着たいのに、下着の段差やラインが出るのは避けたい…",
      "響きにくい下着が欲しいけど、安定感までちゃんとあるか気になる…",
      "淡色トップスの日も、透けやラインを気にせず過ごしたい…"
    );
  }
  if (/ノンワイヤー|ワイヤレス|楽ちんブラ/.test(featureText)) {
    featureWorries.push(
      "ノンワイヤーは楽そうだけど、きれいに整うか少し不安…",
      "締め付けにくい下着が欲しいけど、ズレやすいものは避けたい…",
      "ラクなブラを選びたいけど、シルエットまで妥協したくない…"
    );
  }
  if (/脇高|補正|ガードル|バストサポート/.test(featureText)) {
    featureWorries.push(
      "シルエットは整えたいけど、苦しい補正系は続かなそう…",
      "脇や背中まわりをすっきり見せたいけど、締め付けすぎるのは不安…",
      "服をきれいに着たいのに、下着の段差でラインが崩れるのは避けたい…"
    );
  }
  if (/ナイトブラ/.test(featureText)) {
    featureWorries.push(
      "ナイトブラを試したいけど、寝る時に苦しくないか気になる…",
      "おうち時間用のブラも、ラクさだけじゃなくホールド感まで欲しい…",
      "夜用ブラは気になるけど、サイズ選びで失敗したくない…"
    );
  }
  if (/サニタリー|吸水/.test(featureText)) {
    featureWorries.push(
      "サニタリー用は安心感が大事だけど、可愛さまで妥協したくない…",
      "毎月使うものだから、防水感も肌あたりもちゃんと確認したい…",
      "吸水タイプは便利そうだけど、フィット感や響きにくさも気になる…"
    );
  }

  const categoryWorries = {
    ワンピース: [
      "ワンピ1枚で出かけたいけど、手抜き感や体型のラインが気になりそう…",
      "楽ちんワンピって便利だけど、部屋着っぽく見えたらどうしよう…",
      "忙しい朝に頼れる服が欲しいけど、ちゃんとおしゃれ見えも欲しい…",
      "1枚で決めたい日に限って、無難すぎるワンピだと気分が上がらない…",
      "写真に残る日こそ、シルエットがぼやける服は避けたい…",
      "可愛いワンピを選びたいけど、甘すぎて若作りに見えるのは不安…",
      "ラクなのにちゃんと女っぽく見える服、意外と見つからない…",
      "お出かけ用の服が欲しいのに、頑張りすぎ感は出したくない…",
      "体型カバーもしたいけど、着るだけで気分が上がる可愛さも欲しい…",
      "ワンピは便利だけど、毎回同じ雰囲気に見えるのは避けたい…",
      "大人っぽく着たいのに、地味すぎるワンピだと写真で沈みそう…",
      "休日に着たいけど、近所着っぽくならないワンピを選びたい…",
    ],
    パンツ: [
      "楽なパンツを選ぶと、下半身のラインや部屋着っぽさが気になりそう…",
      "動きやすさを優先すると、きちんと感がなくなりそう…",
      "脚をすっきり見せたいけど、細身すぎるパンツは窮屈そう…",
      "パンツコーデが便利すぎて、いつも同じ印象になりがち…",
      "座ったり歩いたりする日は、見た目もラクさも両方欲しい…",
      "通勤パンツって真面目すぎて、休日に着ると浮きそう…",
      "下半身はカバーしたいけど、すっきり見えるパンツを選びたい…",
      "ワイドパンツは楽だけど、重たく見えるとバランスが取りにくい…",
      "細見えは欲しいけど、ピタピタすぎるパンツは避けたい…",
      "きれいめパンツが欲しいけど、仕事着感が強すぎるのは困る…",
    ],
    トップス: [
      "合わせやすいトップスほど、地味見えして写真映えしなさそう…",
      "いつものボトムに合わせたいけど、普通すぎるトップスは避けたい…",
      "顔まわりを明るく見せたいのに、シンプルすぎると寂しく見えそう…",
      "トップス1枚で出かける日、手抜き感が出ないか気になる…",
      "着回し重視で選ぶと、結局ときめきが足りなさそう…",
      "大人可愛い服が欲しいけど、甘すぎるデザインは少し照れる…",
      "二の腕や胸元は気になるけど、重たく見えるトップスは避けたい…",
      "1枚で映えるトップスが欲しいけど、派手すぎるものは使いにくそう…",
      "ブラウスは好きだけど、通勤感が強すぎると休日に着づらそう…",
      "Tシャツ感覚で着たいけど、カジュアルすぎる服は避けたい…",
    ],
    カーディガン: [
      "羽織るだけだと生活感が出て、せっかくのコーデがぼやけそう…",
      "冷房対策の羽織りって便利だけど、地味で老け見えしそう…",
      "さっと羽織れる服が欲しいけど、カジュアルすぎるのは避けたい…",
      "薄手の羽織りって頼れるけど、安っぽく見えないか気になりそう…",
      "朝晩の温度差に備えたいけど、荷物になる羽織りは避けたい…",
      "羽織りは便利だけど、肩まわりが大きく見えるものは避けたい…",
      "日よけや冷房対策はしたいけど、おしゃれ感まで捨てたくない…",
      "ワンピに羽織りたいけど、丈感が合わないとバランスが崩れそう…",
    ],
    スカート: [
      "華やかなスカートを選びたいけど、甘すぎたり腰まわりが気になりそう…",
      "女性らしく見せたいのに、子どもっぽくなるのは避けたい…",
      "揺れるシルエットは可愛いけど、広がりすぎて太見えしそう…",
      "きれいめに履きたいけど、トップス合わせで毎回悩みそう…",
      "デートにも使いたいけど、頑張りすぎて見えるのは避けたい…",
      "スカートは好きだけど、腰張りやお腹まわりが目立つのは不安…",
      "ロングスカートは楽だけど、重たく見えるものは避けたい…",
      "大人可愛く履きたいけど、甘さが強すぎると照れそう…",
      "揺れ感は欲しいけど、広がりすぎて太見えするのは困る…",
    ],
    アウター: [
      "羽織った瞬間に着膨れして、全体のバランスが崩れそう…",
      "アウターを着ると、せっかくの中のコーデが隠れて地味見えしそう…",
      "軽く羽織りたいけど、カジュアルすぎて大人感がなくなりそう…",
      "季節の変わり目に使える服が欲しいけど、着回しにくいと困りそう…",
    ],
    バッグ: [
      "可愛いバッグが欲しいけど、荷物が入らないと結局使わなくなりそう…",
      "プチプラバッグって便利だけど、安っぽく見えるのは避けたい…",
      "通勤にも休日にも使いたいのに、服を選ぶバッグだと出番が減りそう…",
      "小さめバッグは可愛いけど、必要なものが入るか不安…",
    ],
    シューズ: [
      "可愛い靴を選びたいけど、歩きにくいと結局履かなくなりそう…",
      "きれいめに見せたいのに、足が痛くなる靴は避けたい…",
      "楽な靴って便利だけど、カジュアルすぎて服に合わなそう…",
      "足元でコーデを垢抜けさせたいけど、派手すぎる靴は不安…",
    ],
    アクセサリー: [
      "アクセを足したいけど、安っぽく見えたり肌に合うか不安…",
      "シンプル服を華やかにしたいのに、どのアクセを選べばいいか迷う…",
      "顔まわりを明るく見せたいけど、派手すぎるアクセは避けたい…",
      "毎日使えるアクセが欲しいけど、すぐ変色するものは選びたくない…",
    ],
    水際ファッション: [
      "水際コーデって可愛くしたいけど、露出や体型カバーが気になりそう…",
      "プールや海で着たいけど、写真に残るから手抜き感は出したくない…",
      "ラッシュガードは便利だけど、スポーティーすぎると気分が上がらない…",
      "リゾート感は欲しいけど、大人が着やすいデザインを選びたい…",
    ],
    フォーマル: [
      "卒入園や行事服って必要だけど、普段使えないと少しもったいない…",
      "きちんと見せたいけど、堅すぎて老け見えする服は避けたい…",
      "セレモニー服は失敗したくないから、高見え感と着回しを両方見たい…",
      "写真に残る日だから、無難すぎず上品に見える服を選びたい…",
    ],
    ランジェリー: [
      "薄手トップスの日に、下着のラインが響くのは避けたい…",
      "ノンワイヤーは楽そうだけど、きれいに整うか少し不安…",
      "脇高や補正タイプが気になるけど、締め付けが強いものは続かなそう…",
      "可愛い下着を選びたいけど、派手すぎず普段使いしやすいものがいい…",
      "ナイトブラは試したいけど、苦しくないホールド感か気になる…",
      "シームレスは便利だけど、安定感や透けにくさもちゃんと欲しい…",
      "サニタリー用も、安心感だけじゃなく可愛さまで妥協したくない…",
      "毎日身につけるものだから、肌あたりと気分が上がるデザインを両方選びたい…",
      "ブラショーツセットは可愛いけど、レースがチクチクしないか心配…",
      "補正インナーは気になるけど、苦しくて結局使わなくなるのは避けたい…",
      "白や淡色の服の日に、透けや段差を気にせず過ごしたい…",
      "おうち時間も外出の日も、ラクなのに整って見える下着が欲しい…",
    ],
    インナー: [
      "ラクなインナーが欲しいけど、ラインが響いたり安定感がないのは不安…",
      "カップ付きは便利だけど、部屋着っぽく見えるものは避けたい…",
      "薄着の季節に使いたいけど、透けや肩ひも問題が気になりそう…",
      "毎日使うものこそ、着心地ときれい見えの両方が欲しい…",
    ],
    帽子: [
      "日差し対策したいけど、帽子だけ浮いて見えるのは避けたい…",
      "キャップやハットを使いたいけど、カジュアルすぎると大人服に合わなそう…",
      "小顔見えは欲しいけど、顔まわりが重たく見える帽子は選びたくない…",
      "旅行用に帽子が欲しいけど、荷物になるものは避けたい…",
    ],
    財布: [
      "毎日使う財布こそ可愛くしたいけど、収納力がないと困りそう…",
      "ミニ財布は可愛いけど、カードや小銭が入らないと使いにくそう…",
      "大人っぽい財布が欲しいけど、地味すぎるデザインは気分が上がらない…",
      "バッグを小さくしたいけど、財布の使いやすさは妥協したくない…",
    ],
    ファッション小物: [
      "小物で垢抜けたいけど、何を足せばおしゃれに見えるか迷う…",
      "ベーシック服が多いから、小物で印象を変えたい…",
      "季節感を出したいけど、派手すぎる小物は使いこなせなさそう…",
      "プチプラ小物でも安っぽく見えないものを選びたい…",
    ],
    ルームウェア: [
      "家では楽に過ごしたいけど、急な宅配や近所には出られる可愛さも欲しい…",
      "ルームウェアって便利だけど、生活感が出すぎるものは気分が下がりそう…",
      "おうち時間も可愛くいたいけど、締め付ける服は着たくない…",
      "リラックス服でもだらしなく見えないものを選びたい…",
    ],
    浴衣: [
      "浴衣は可愛いけど、着付けや小物合わせで失敗しそう…",
      "夏イベントで写真に残るから、安っぽく見える浴衣は避けたい…",
      "大人可愛い浴衣を着たいけど、派手すぎる柄は少し不安…",
      "浴衣セットを選びたいけど、帯や下駄まで合うか迷いそう…",
    ],
    マタニティ: [
      "楽に着たいけど、マタニティ感が強すぎる服は避けたい…",
      "体型が変わる時期でも、ちゃんと可愛く見える服が欲しい…",
      "締め付けは避けたいけど、だらしなく見える服は選びたくない…",
      "産前産後も使える服なら、できるだけ長く着回したい…",
    ],
    スポーツウェア: [
      "運動用でも、スポーティーすぎて普段に使えない服は避けたい…",
      "ヨガやジムで動きやすくても、体のラインが出すぎるのは気になる…",
      "汗をかく日も快適に過ごしたいけど、可愛さまで妥協したくない…",
      "ワンマイルにも使える、すっきり見えるスポーツ服が欲しい…",
      "運動を始めたいけど、まずは気分が上がるウェアを選びたい…",
    ],
    レッグウェア: [
      "レギンスは便利だけど、脚のラインが強調されすぎるのは不安…",
      "着圧は気になるけど、苦しくて続かないものは避けたい…",
      "靴下やタイツでも、コーデから浮かずにきれいに見せたい…",
      "冷え対策はしたいけど、足元が重たく見えるのは困る…",
      "毎日使うものだから、肌あたりと耐久性もちゃんと見たい…",
    ],
    レインウェア: [
      "雨の日もおしゃれしたいけど、いかにも雨具っぽいものは避けたい…",
      "濡れにくさは欲しいけど、蒸れたり重たかったりするのは困る…",
      "通勤にも使える、きれいめな雨の日アイテムが欲しい…",
      "折りたたんで持ち歩きたいけど、シワだらけになるのは避けたい…",
      "雨の日でも普段のコーデを崩さず過ごしたい…",
    ],
    ブライダル: [
      "結婚式や二次会で華やかに見せたいけど、頑張りすぎ感は出したくない…",
      "お呼ばれ服は写真に残るから、安っぽく見えるものは避けたい…",
      "体型をきれいに見せながら、上品なドレスアップを楽しみたい…",
      "一度きりではなく、食事会にも使えるお呼ばれ服を選びたい…",
      "マナーを守りつつ、自分らしい可愛さも出したい…",
    ],
    ヘアアクセサリー: [
      "髪をまとめたいけど、生活感が出るヘアアクセは避けたい…",
      "簡単なアレンジでも、手抜きに見えず華やかに仕上げたい…",
      "大人が使っても甘すぎないリボンやクリップを選びたい…",
      "髪が多くてもしっかり留まり、頭が痛くなりにくいものが欲しい…",
      "服を買い足さずに、顔まわりの印象を変えたい…",
    ],
    セットアップ: [
      "セットアップは便利だけど、かっちりしすぎて普段使いしにくいのは困る…",
      "上下で着るだけで決まって、単品でも着回せる服が欲しい…",
      "コーデを考える時間は減らしたいけど、手抜きには見せたくない…",
      "楽に着られて、通勤にもお出かけにも使えるセットが欲しい…",
      "上下のサイズ感が合うか不安だから、シルエットをきれいに見せたい…",
    ],
    オールインワン: [
      "1枚で楽に決めたいけど、作業着っぽく見えるのは避けたい…",
      "オールインワンは可愛いけど、腰まわりが膨らんで見えないか心配…",
      "体型を拾いすぎず、縦ラインをきれいに見せたい…",
      "着脱のしやすさも欲しいけど、大人っぽさは妥協したくない…",
      "インナーを変えて長く着回せる1着を選びたい…",
    ],
    デニム: [
      "デニムは毎日使いたいけど、脚のラインがきれいに見えないものは避けたい…",
      "楽なデニムが欲しいけど、部屋着っぽく見えるのは困る…",
      "カジュアルすぎず、大人のきれいめ服にも合うデニムを選びたい…",
      "硬くて動きにくいデニムは苦手だけど、形はきれいに見せたい…",
      "定番だからこそ、穿くだけで今っぽく見える一本が欲しい…",
    ],
    ニット: [
      "ニットは好きだけど、着膨れしたり体のラインを拾いすぎるのは気になる…",
      "肌触りのいいニットが欲しいけど、チクチクするものは避けたい…",
      "シンプルなニットでも、地味に見えず顔まわりを明るく見せたい…",
      "毛玉になりにくく、きれいな状態で長く着られるものを選びたい…",
      "暖かさは欲しいけど、重たく見えない大人ニットが欲しい…",
    ],
    スーツ: [
      "スーツはきちんと見せたいけど、堅くて古い印象になるのは避けたい…",
      "仕事で使えて、単品でも普段の服に着回せるスーツが欲しい…",
      "動きやすさも欲しいけど、シルエットはすっきり見せたい…",
      "長時間着ても疲れにくく、写真でもきれいに見える一着を選びたい…",
      "自宅で扱いやすく、忙しい朝にも迷わず着られるスーツが欲しい…",
    ],
    腕時計: [
      "腕時計で上品さを足したいけど、仕事用すぎるデザインは避けたい…",
      "アクセ感覚で使えて、時間も見やすい腕時計が欲しい…",
      "華奢に見せたいけど、文字盤が小さすぎて使いにくいのは困る…",
      "毎日使うから、服やアクセを選ばずなじむ色を選びたい…",
      "高見えする腕時計が欲しいけど、重くて疲れるものは避けたい…",
    ],
    ストール: [
      "冷房や朝晩の冷えに備えたいけど、荷物になる羽織りは増やしたくない…",
      "ストールを使いたいけど、巻き方が難しく見えるものは避けたい…",
      "防寒だけでなく、顔まわりを明るく見せる色を選びたい…",
      "シンプル服に季節感を足しながら、上品にまとめたい…",
      "肌に触れるものだから、チクチクしにくい素材を選びたい…",
    ],
    ベルト: [
      "ゆるい服をすっきり見せたいけど、ベルトだけ浮くのは避けたい…",
      "ウエストマークしたいけど、締め付けが気になるものは使いにくそう…",
      "ワンピやパンツに合わせやすい、細見えベルトが欲しい…",
      "小物で印象を変えたいけど、派手なデザインは使いこなせなさそう…",
      "毎日使えて、金具まで安っぽく見えないベルトを選びたい…",
    ],
    サングラス: [
      "日差し対策はしたいけど、サングラスだけ浮いて見えるのは避けたい…",
      "顔になじむ形を選びたいけど、試着できないとサイズ感が不安…",
      "大人っぽく見せたいけど、強い印象になりすぎるものは使いにくそう…",
      "旅行や運転に使えて、普段の服にも自然に合うものが欲しい…",
      "紫外線対策をしながら、顔まわりまでおしゃれに見せたい…",
    ],
    手袋: [
      "手元の冷えは防ぎたいけど、厚くて動かしにくい手袋は困る…",
      "防寒小物でも、通勤服から浮かず上品に見せたい…",
      "スマホを使うたび外すのは面倒だから、操作しやすさも欲しい…",
      "暖かさは欲しいけど、手元が大きく見えるものは避けたい…",
      "毎日使うから、肌触りと丈夫さを両方確認したい…",
    ],
    アームカバー: [
      "紫外線対策はしたいけど、スポーティーすぎるアームカバーは合わせにくそう…",
      "腕を隠したいけど、暑くて蒸れるものは続かなそう…",
      "冷房対策にも使えて、きれいめ服になじむものが欲しい…",
      "長時間つけてもずれにくく、締め付けすぎないものを選びたい…",
      "日焼け対策をしながら、手元まで自然にきれいに見せたい…",
    ],
    傘: [
      "日差しや雨は防ぎたいけど、重くて持ち歩かなくなる傘は避けたい…",
      "毎日バッグに入れたいから、軽さと丈夫さを両方選びたい…",
      "日傘もコーデの一部として、大人っぽい色や形を選びたい…",
      "遮光性は欲しいけど、開閉しにくいものは使いづらそう…",
      "急な雨にも日差しにも対応できる、頼れる一本が欲しい…",
    ],
  };

  const key = Object.prototype.hasOwnProperty.call(categoryWorries, category)
    ? category
    : Object.keys(categoryWorries).find((label) => category.includes(label));
  const contextualWorries = buildContextualWorries(category, featureText, seed);
  const categoryChoices = key ? categoryWorries[key] : categoryWorries.トップス;
  if (category.includes("ランジェリー") && featureWorries.length) {
    return pickByHash(dedupeText([...contextualWorries, ...featureWorries, ...categoryChoices]), `${seed} lingerie worry v2`);
  }
  if (/バッグ|シューズ|アクセサリー|財布|帽子|インナー|ルームウェア|浴衣|マタニティ|フォーマル|スポーツウェア|レッグウェア|レインウェア|ブライダル|ヘアアクセサリー|セットアップ|オールインワン|デニム|ニット|スーツ|腕時計|ストール|ベルト|サングラス|手袋|アームカバー|傘/.test(category) && key) {
    return pickByHash(dedupeText([...contextualWorries, ...featureWorries, ...categoryChoices]), `${seed} category worry v2`);
  }
  const choices = dedupeText([...contextualWorries, ...featureWorries, ...categoryChoices]);
  return pickByHash(choices, `${seed} worry v2`);
}

function buildContextualWorries(category, featureText, seed) {
  const text = `${category} ${featureText} ${seed}`;
  const profile = inferWorryProfile(category);
  const signals = inferWorrySignals(text, category);
  const choices = [];
  const baseConcerns = profile.concerns;
  const baseWants = profile.wants;
  const baseScenes = profile.scenes;

  baseConcerns.forEach((concern, index) => {
    choices.push(
      `${profile.item}は欲しいけど、${concern}のは避けたい…`,
      `${baseScenes[index % baseScenes.length]}に使いたいのに、${concern}と出番が減りそう…`,
      `${profile.item}選びで、${concern}か不安…`
    );
  });

  baseWants.forEach((want, index) => {
    choices.push(
      `${want}けど、無理して見える${profile.item}は選びたくない…`,
      `${baseScenes[index % baseScenes.length]}も${want}、ちゃんと今っぽく見せたい…`,
      `${want}のに、いつも同じ印象になるのは避けたい…`
    );
  });

  signals.forEach((signal, index) => {
    const scene = baseScenes[index % baseScenes.length];
    choices.push(
      `${signal.good}は魅力だけど、${signal.risk}のは避けたい…`,
      `${signal.good}に惹かれるけど、${profile.item}として${signal.risk}と困る…`,
      `${scene}こそ${signal.want}、${signal.risk}のは避けたい…`,
      `${signal.want}けど、${signal.risk}か気になる…`,
      `${signal.good}で選びたいけど、${profile.item}全体がちぐはぐに見えるのは避けたい…`
    );
  });

  for (let i = 0; i < signals.length; i += 1) {
    const first = signals[i];
    const second = signals[(i + 1) % signals.length];
    if (!second || first === second) continue;
    choices.push(
      `${first.good}も欲しいけど、${second.risk}のは避けたい…`,
      `${first.want}けど、${second.risk}のは困る…`,
      `${profile.item}で${first.good}を楽しみつつ、${second.want}…`
    );
  }

  return dedupeText(choices)
    .map((value) => value.replace(/、、/g, "、").replace(/けどけど/g, "けど"))
    .filter((value) => countChars(value) <= 86);
}

function inferWorryProfile(category) {
  const profiles = [
    {
      test: /ワンピ/,
      item: "ワンピ",
      concerns: ["手抜き感や部屋着感が出る", "シルエットがぼやけて見える", "甘すぎて幼く見える", "1枚だと物足りなく見える", "丈感でバランスが崩れる", "写真で地味に見える"],
      wants: ["1枚で楽に決めたい", "大人可愛く着たい", "体のラインをきれいに見せたい", "予定がある日にぱっと華やぎたい"],
      scenes: ["忙しい朝", "デートや女子会", "旅行やお出かけ", "写真に残る日"],
    },
    {
      test: /トップス|ブラウス|シャツ|Tシャツ|カットソー/,
      item: "トップス",
      concerns: ["顔まわりが寂しく見える", "普通すぎて手抜きに見える", "甘さだけが浮く", "二の腕や胸元が気になる", "手持ちボトムに合わせにくい", "通勤感が強くなりすぎる"],
      wants: ["いつものボトムを新鮮に見せたい", "1枚で着映えしたい", "顔まわりを明るく見せたい", "着回しやすさも欲しい"],
      scenes: ["トップス1枚で出かける日", "オンラインや写真に写る日", "通勤にも休日にも", "買い足し服を選ぶ時"],
    },
    {
      test: /パンツ|デニム/,
      item: "パンツ",
      concerns: ["脚のラインを拾う", "腰まわりがもたつく", "部屋着っぽく見える", "仕事着感が強すぎる", "動きにくくて疲れる", "下半身だけ重たく見える"],
      wants: ["楽に穿きたい", "脚をすっきり見せたい", "オンオフ使いたい", "きれいめにもカジュアルにも寄せたい"],
      scenes: ["座る時間が長い日", "通勤や学校行事", "たくさん歩く日", "ワンツーコーデの日"],
    },
    {
      test: /スカート/,
      item: "スカート",
      concerns: ["腰まわりが広がる", "甘くなりすぎる", "トップス合わせで悩む", "歩いた時にラインが崩れる", "ロング丈が重たく見える", "きれいめ感が足りない"],
      wants: ["女性らしく見せたい", "揺れ感で華やぎたい", "大人可愛くまとめたい", "シンプルトップスでも映えたい"],
      scenes: ["デートや女子会", "休日のお出かけ", "写真に残る日", "季節感を足したい日"],
    },
    {
      test: /カーデ|アウター|ジャケット|コート|ブルゾン|ジレ|ベスト/,
      item: "羽織り",
      concerns: ["肩まわりが大きく見える", "生活感が出る", "中のコーデが隠れて地味になる", "季節感だけ浮く", "荷物になって使わなくなる", "カジュアルに寄りすぎる"],
      wants: ["さっと羽織って整えたい", "冷房や朝晩の温度差に備えたい", "軽く着られて高見えも欲しい", "ワンピにもパンツにも合わせたい"],
      scenes: ["季節の変わり目", "冷房が気になる日", "通勤やお出かけ", "旅行先での羽織り"],
    },
    {
      test: /バッグ|財布/,
      item: "バッグ小物",
      concerns: ["荷物が入らない", "安っぽく見える", "服を選んで出番が減る", "大きく見えてコーデが重くなる", "収納が使いにくい", "持った時に子どもっぽく見える"],
      wants: ["可愛さも使いやすさも欲しい", "毎日持てる高見え感が欲しい", "小物でコーデを更新したい", "必要なものをすっきり持ちたい"],
      scenes: ["通勤にも休日にも", "旅行やお出かけ", "荷物が多い日", "シンプル服の日"],
    },
    {
      test: /シューズ|パンプス|サンダル|スニーカー|ローファー|ブーツ/,
      item: "靴",
      concerns: ["足が痛くなる", "手持ち服に合わせにくい", "カジュアルすぎる", "足元だけ浮く", "サイズ選びで失敗する", "長時間歩くと疲れる"],
      wants: ["足元から垢抜けたい", "可愛さと歩きやすさを両立したい", "パンツにもスカートにも合わせたい", "きれいめに見せたい"],
      scenes: ["たくさん歩く日", "通勤やお出かけ", "旅行や買い物", "足元を更新したい時"],
    },
    {
      test: /アクセサリー|腕時計|ヘアアクセサリー|ベルト|サングラス/,
      item: "小物",
      concerns: ["安っぽく見える", "主張が強すぎる", "肌や服になじまない", "顔まわりだけ浮く", "毎日使いしにくい", "サイズ感で失敗する"],
      wants: ["シンプル服を華やかにしたい", "さりげなく高見えさせたい", "大人っぽく印象を変えたい", "毎日使えるお気に入りにしたい"],
      scenes: ["シンプル服の日", "写真を撮る日", "プレゼント選び", "いつものコーデを変えたい時"],
    },
    {
      test: /ランジェリー|インナー|レッグウェア/,
      item: "インナー",
      concerns: ["ラインや段差が響く", "締め付けが苦しい", "ホールド感が足りない", "肌あたりが気になる", "淡色服で透ける", "ラクさだけでシルエットが崩れる"],
      wants: ["ラクに整えたい", "服をきれいに着たい", "毎日快適に過ごしたい", "響きにくさも安心感も欲しい"],
      scenes: ["薄手トップスの日", "おうち時間", "長時間過ごす日", "きれいめ服を着る日"],
    },
    {
      test: /傘|日傘|雨傘|晴雨/,
      item: "傘",
      concerns: ["重くて持ち歩かなくなる", "開閉しにくくて面倒に感じる", "日傘だけコーデから浮く", "機能だけで可愛さが足りない", "バッグに入れるとかさばる", "急な雨に頼りない"],
      wants: ["日差しも雨もスマートに対策したい", "毎日バッグに入れやすく選びたい", "傘まで大人っぽく見せたい", "軽さと高見えを両方欲しい"],
      scenes: ["通勤や送迎の日", "旅行やお出かけ", "日差しが強い日", "急な雨が心配な日"],
    },
    {
      test: /レインウェア|レインコート|撥水|防水/,
      item: "雨の日アイテム",
      concerns: ["雨具っぽさが強く出る", "蒸れて快適に着られない", "普段の服に合わせにくい", "重くて持ち歩かなくなる", "シワや生活感が出る", "きれいめ感が消える"],
      wants: ["雨の日も普段のコーデを崩したくない", "濡れにくさと可愛さを両方選びたい", "通勤にも休日にも自然に使いたい", "天気が悪い日も気分を下げたくない"],
      scenes: ["雨の日の通勤", "旅行やレジャー", "送迎や買い物", "天気が変わりやすい日"],
    },
    {
      test: /水際|水着|ラッシュ|スイム|ビーチ|プール/,
      item: "水際アイテム",
      concerns: ["露出や体型が気になる", "スポーティーすぎて写真で浮く", "リゾート感だけ強くなる", "サイズ感で失敗する", "濡れた後の着心地が不安", "普段の旅行服に合わせにくい"],
      wants: ["体型をきれいに見せながら楽しみたい", "写真でも可愛く残したい", "日差し対策もしながらおしゃれしたい", "大人が着やすい水際コーデにしたい"],
      scenes: ["プールや海の日", "旅行やリゾート", "子どもと水遊びの日", "写真を撮るレジャーの日"],
    },
    {
      test: /アームカバー|手袋|帽子|ストール/,
      item: "季節小物",
      concerns: ["機能アイテム感が強い", "コーデから浮く", "重くて持ち歩かなくなる", "蒸れたり暑く感じる", "写真で生活感が出る", "サイズ感が合わない"],
      wants: ["対策しながら可愛く見せたい", "普段服になじませたい", "旅行にも持っていきたい", "実用性と高見えを両方選びたい"],
      scenes: ["日差しや雨が気になる日", "旅行やレジャー", "通勤や送迎", "季節の変わり目"],
    },
    {
      test: /フォーマル|スーツ|ブライダル|セレモニー|卒入園|セットアップ/,
      item: "きちんと服",
      concerns: ["堅すぎて老け見えする", "一度きりで終わる", "写真で地味に見える", "サイズ感で失敗する", "普段に着回しにくい", "頑張りすぎ感が出る"],
      wants: ["上品に見せたい", "行事後も着回したい", "きちんと感と今っぽさを両立したい", "写真に残っても安心したい"],
      scenes: ["卒入園や学校行事", "結婚式や食事会", "仕事で人に会う日", "写真に残る日"],
    },
    {
      test: /ルームウェア|マタニティ|スポーツウェア|オールインワン|浴衣|ニット/,
      item: "アイテム",
      concerns: ["生活感が出る", "体のラインを拾う", "動きにくくて疲れる", "着回しにくい", "子どもっぽく見える", "季節感だけで終わる"],
      wants: ["ラクなのに可愛く見せたい", "気分が上がるものを選びたい", "長く使える一着にしたい", "写真でもきれいに見せたい"],
      scenes: ["休日やおうち時間", "イベントの日", "旅行やお出かけ", "長時間着る日"],
    },
  ];
  return profiles.find((profile) => profile.test.test(category)) || {
    item: "アイテム",
    concerns: ["安っぽく見える", "手持ち服に合わせにくい", "出番が少なくなる", "サイズ感で失敗する", "今っぽさが足りない", "頑張りすぎて見える"],
    wants: ["大人可愛く取り入れたい", "普段使いしやすく選びたい", "高見えも着回しも欲しい", "自分らしく垢抜けたい"],
    scenes: ["毎日のコーデ", "お出かけの日", "人に会う日", "買い足しを考える時"],
  };
}

function inferWorrySignals(text, category = "") {
  if (String(category).includes("バッグ")) {
    const bagSignalDefs = [
      { test: /シアー|メッシュ|クリア|透明/, good: "軽やかな素材感", risk: "中身が見えすぎる", want: "季節感を出しつつ上品に持ちたい" },
      { test: /フリル|ラッフル|リボン|レース|チュール/, good: "大人可愛いディテール", risk: "甘さが強く服から浮く", want: "持つだけでコーデを華やげたい" },
      { test: /軽量|軽い/, good: "持ち歩きやすい軽さ", risk: "素材が頼りなく見える", want: "長時間でも疲れにくいものを選びたい" },
      { test: /収納|大容量|A4|ポケット|マチ/, good: "頼れる収納力", risk: "大きく見えてコーデが重くなる", want: "荷物をすっきりまとめたい" },
      { test: /ショルダー|斜めがけ|2WAY|3WAY/, good: "持ち方を変えられる使いやすさ", risk: "ストラップが服に合わせにくい", want: "通勤にも休日にも使いたい" },
      { test: /撥水|防水|雨/, good: "雨の日にも頼れる機能", risk: "実用品っぽく見える", want: "天気を気にせず可愛く持ちたい" },
      { test: /デニム|ツイード|サテン|レザー|本革|合皮|ナイロン|キャンバス/, good: "表情のある素材感", risk: "質感が安っぽく見える", want: "小物まで高見えさせたい" },
      { test: /ミニ|コンパクト/, good: "すっきり持てるサイズ感", risk: "必要な荷物が入らない", want: "小さくても使いやすいものを選びたい" },
      { test: /トート|ハンドバッグ|ボストン/, good: "荷物を出し入れしやすい形", risk: "持った時に大きく見える", want: "実用的でもきれいめに持ちたい" },
    ];
    const bagMatches = bagSignalDefs.filter((signal) => signal.test.test(text));
    if (bagMatches.length) return bagMatches.slice(0, 6);
    return [
      { good: "高見えするデザイン", risk: "素材感が安っぽく見える", want: "毎日の服を小物で格上げしたい" },
      { good: "使いやすそうなサイズ感", risk: "普段の荷物が収まらない", want: "可愛さも収納力も妥協したくない" },
      { good: "合わせやすい雰囲気", risk: "服を選んで出番が減る", want: "通勤にも休日にも使いたい" },
    ];
  }

  const signalDefs = [
    { test: /シアー|透け|オーガンジー/, good: "透け感の軽さ", risk: "肌見せが強く見える", want: "涼しげに垢抜けたい" },
    { test: /フリル|ラッフル|リボン|レース|チュール/, good: "甘めディテール", risk: "可愛すぎて浮く", want: "大人可愛く華やぎたい" },
    { test: /プリーツ|ギャザー|ティアード/, good: "揺れ感のあるデザイン", risk: "広がって太見えする", want: "動くたびきれいに見せたい" },
    { test: /センタープレス|テーパード|ストレート/, good: "縦ラインのきれいさ", risk: "窮屈で疲れる", want: "脚をすっきり見せたい" },
    { test: /ワイド|ゆったり|オーバーサイズ|ドルマン/, good: "ゆるっとした着心地", risk: "全身が大きく見える", want: "ラクでもすっきり見せたい" },
    { test: /フレア|Aライン|マーメイド|ペプラム/, good: "女性らしいシルエット", risk: "腰まわりが強調される", want: "ラインをきれいに整えたい" },
    { test: /ロング|マキシ|ミモレ/, good: "長め丈の大人っぽさ", risk: "重たく野暮ったく見える", want: "丈感までバランスよく見せたい" },
    { test: /ミニ|ショート丈|クロップド/, good: "軽やかな丈感", risk: "子どもっぽく見える", want: "抜け感を大人っぽく出したい" },
    { test: /ストレッチ|伸縮|楽ちん|ラク|柔らか|とろみ/, good: "ラクな着心地", risk: "だらしなく見える", want: "快適さときれい見えを両立したい" },
    { test: /接触冷感|冷感|吸汗|速乾|涼しげ|リネン/, good: "涼しく着られる機能", risk: "カジュアルすぎる", want: "暑い日もきれいめを保ちたい" },
    { test: /UV|遮光|日焼け|紫外線|晴雨/, good: "紫外線対策できるところ", risk: "機能だけの見た目になる", want: "日差し対策もおしゃれに見せたい" },
    { test: /撥水|防水|レイン|雨/, good: "雨の日に頼れる機能", risk: "雨具っぽく見える", want: "天気が悪い日も可愛くいたい" },
    { test: /洗える|ウォッシャブル|自宅で洗える/, good: "気軽に洗えるところ", risk: "素材が安っぽく見える", want: "清潔感も高見えも両方欲しい" },
    { test: /軽量|軽い|コンパクト|折りたたみ/, good: "持ち歩きやすさ", risk: "頼りなく見える", want: "毎日ストレスなく使いたい" },
    { test: /収納|大容量|トート|ショルダー|ポケット|ミニバッグ/, good: "収納力や持ちやすさ", risk: "見た目が重くなる", want: "荷物もおしゃれも妥協したくない" },
    { test: /パンプス|ヒール|ミュール|サンダル/, good: "女っぽい足元", risk: "足が痛くなる", want: "歩きやすくきれいめに見せたい" },
    { test: /スニーカー|ローファー|ブーツ/, good: "歩きやすい足元", risk: "カジュアルに寄りすぎる", want: "楽でも大人っぽくまとめたい" },
    { test: /金属アレルギー|サージカル|ステンレス/, good: "素材に配慮された安心感", risk: "デザインが物足りない", want: "肌に合いやすく高見えも欲しい" },
    { test: /シームレス|ラインレス|響きにくい/, good: "響きにくい仕様", risk: "安定感が足りない", want: "薄手服の日も安心したい" },
    { test: /ノンワイヤー|ワイヤレス|楽ブラ|カップ付き/, good: "締め付けにくいラクさ", risk: "シルエットが崩れる", want: "ラクでもきれいに整えたい" },
    { test: /脇高|補正|ガードル|着圧|バストサポート/, good: "整えるサポート感", risk: "苦しくて続かない", want: "無理なくすっきり見せたい" },
    { test: /ナイトブラ|夜用|おやすみ/, good: "夜も使いやすい安心感", risk: "寝る時に窮屈に感じる", want: "リラックスしながら整えたい" },
    { test: /サニタリー|吸水|防水布/, good: "デリケートな日の安心感", risk: "可愛さを妥協する", want: "安心感も気分が上がる見た目も欲しい" },
    { test: /水着|ラッシュガード|スイム|ビーチ|プール/, good: "水際で使えるデザイン", risk: "露出や体型が気になる", want: "写真でも自信を持ちたい" },
    { test: /セレモニー|卒入園|入学|卒業|フォーマル|冠婚葬祭/, good: "きちんと感", risk: "堅く老けて見える", want: "上品なのに今っぽく見せたい" },
    { test: /セットアップ|上下セット|2点セット|3点セット/, good: "セットで決まる手軽さ", risk: "着回しが限られる", want: "単品でも使えるものを選びたい" },
    { test: /デニム|ツイード|サテン|ジョーゼット|ニット/, good: "素材の表情", risk: "季節感や質感だけが浮く", want: "素材感まで高見えさせたい" },
    { test: /低身長|小柄|高身長|丈が選べる/, good: "体型に合わせやすいサイズ感", risk: "丈感で失敗する", want: "自分の身長にきれいになじませたい" },
    { test: /骨格ウェーブ|骨格ストレート|骨格ナチュラル|細見え|痩せ見え/, good: "スタイルアップ感", risk: "気になる部分が強調される", want: "自分の体型をきれいに見せたい" },
    { test: /スマホ対応|タッチパネル|手袋/, good: "使いやすい機能", risk: "見た目が実用品っぽい", want: "便利さもおしゃれ感も欲しい" },
  ];
  const matched = signalDefs.filter((signal) => signal.test.test(text));
  if (matched.length) return matched.slice(0, 8);
  return [
    { good: "デザインの可愛さ", risk: "普段の服に合わせにくい", want: "自然に垢抜けたい" },
    { good: "高見えする雰囲気", risk: "頑張りすぎて見える", want: "大人っぽく取り入れたい" },
    { good: "使いやすそうなところ", risk: "結局出番が少なくなる", want: "買ってよかったと思えるものを選びたい" },
  ];
}

function dedupeText(values) {
  return Array.from(new Set(values.filter(Boolean).map((value) => cleanText(value))));
}

function buildReviewVariationLines(category, featureA, featureB, seed) {
  const text = `${category} ${featureA} ${featureB} ${seed}`;
  const profile = inferWorryProfile(category);
  const signals = inferWorrySignals(text, category);
  const lines = { leads: [], details: [], sales: [], clicks: [], trusts: [], humans: [] };
  const scene = pickByHash(profile.scenes || ["お出かけの日"], `${seed} scene`);
  const item = profile.item || "アイテム";
  const want = pickByHash(profile.wants || ["大人可愛く取り入れたい"], `${seed} want`);
  const concern = pickByHash(profile.concerns || ["合わせにくい"], `${seed} concern`);
  const featurePair = `${featureA}×${featureB}`;
  const sceneForMo = /にも$/.test(scene) ? scene : `${scene}にも`;
  const bagIncompatibleLine = /着る|着用|丈|身長|透け|細見え|体型|脚|二の腕|腰|袖|胸元|肌見せ|生地感|シルエット|着回し/;

  const pushAll = (bucket, values) => {
    lines[bucket].push(...values.filter((value) => {
      if (countChars(value) > 76) return false;
      return !category.includes("バッグ") || !bagIncompatibleLine.test(value);
    }));
  };

  pushAll("leads", [
    `${featurePair}の組み合わせで、${sceneForMo}浮かずに大人可愛くまとまります✨`,
    `${featureA}が効いているので、いつもの${item}コーデに新鮮さを足せます💖`,
    `${featureB}まで考えられていて、見た目だけでなく使いやすさも狙えるのが魅力です🎀`,
    `${want}日に、頑張りすぎず雰囲気を変えられるタイプです✨`,
    `${concern}不安をやわらげながら、ちゃんと今っぽく見せてくれます💫`,
    `派手に盛らなくても、${featureA}の表情で自然に目を引くコーデになります💖`,
    `${featureB}のおかげで、買った後の出番まで想像しやすいのがうれしいです✨`,
    `${scene}に着たい時、1点足すだけでコーデの完成度が上がります👗`,
    `甘さと実用感のバランスがよく、毎日の服に無理なくなじみます🫶`,
    `${item}選びで重視したい「可愛い」と「使える」が両方入っています💖`,
  ]);

  pushAll("details", [
    `手持ちのベーシック服にも合わせやすく、色や小物を変えるだけで印象を調整できます✨`,
    `${scene}はもちろん、少しきれいめに見せたい日にも頼りやすいです💖`,
    `レビューを見る時は、写真の雰囲気だけでなくサイズ感や素材感まで確認したいです🔍`,
    `${featureA}が主張しすぎないので、初めて取り入れる人でも使いやすそうです🎀`,
    `${featureB}があることで、見た目の可愛さだけで終わらないところが強いです✨`,
    `いつものコーデが少し垢抜けるので、鏡を見るのが楽しくなりそうです💖`,
    `きれいめにもカジュアルにも寄せやすく、予定に合わせて表情を変えられます🫶`,
    `写真に残る日にも、普段の日にも使えるちょうどいい華やかさがあります✨`,
    `買い足しでも浮きにくく、今ある服と組み合わせやすいのが助かります🎀`,
    `細かいディテールまで見ると、価格以上に高見えしやすいポイントが見つかります💫`,
  ]);

  pushAll("sales", [
    `${scene}用に探している人は、在庫やカラーがあるうちに候補へ入れておきたいです✨`,
    `出番が想像しやすい${item}は、買ってから眠りにくいのがうれしいところです💖`,
    `${want}人には、商品ページで着用写真まで見たくなるアイテムです🔍`,
    `トレンド感だけでなく着回しやすさもあるので、長く使う前提で選びやすいです🎀`,
    `迷った時は、レビューのサイズ感と人気カラーを先に見ておくと安心です✨`,
    `手持ち服に合わせやすいなら、コーデに悩む日の時短アイテムになります💖`,
    `高見え・細見え・着回しのどれかを重視する人にも刺さりやすいバランスです✨`,
    `「可愛いけど使うかな？」で迷う人ほど、シーン別写真をチェックしたいです🔍`,
    `褒められ感を狙いたい日にも、普段に着回したい日にも候補に入ります🫶`,
    `値段だけでなく、使える場面の多さまで見ると満足度が上がりそうです💖`,
  ]);

  pushAll("clicks", [
    `${featureA}の見え方は写真で印象が変わるので、商品ページで細部まで見たいです🔍`,
    `${featureB}の使いやすさはレビューが参考になるので、購入前に確認したいです◎`,
    `カラーで雰囲気が変わるタイプなら、在庫があるうちに見比べたいです✨`,
    `${scene}で使うなら、着用写真とサイズ感レビューを先にチェックしたいです💖`,
    `素材感や丈感で印象が変わるので、画像だけでなく口コミまで見たいです🔍`,
    `人気色から動きやすいので、気になる色は早めに候補へ入れておきたいです✨`,
  ]);

  pushAll("trusts", [
    `実際の着用感まで見られると、自分の手持ち服にも合わせやすいか想像しやすいです◎`,
    `レビューで丈・透け感・生地感を確認しておくと、届いた時のギャップを減らせます🔍`,
    `毎日使いしたいなら、可愛さだけでなくお手入れや耐久性も見ておきたいです✨`,
    `サイズ選びに迷う商品ほど、身長別レビューがかなり参考になります💖`,
    `色違いまで欲しくなるタイプか、商品ページで雰囲気を見比べたいです🎀`,
    `初めてのショップでも、レビュー数や写真があると選びやすくなります◎`,
  ]);

  pushAll("humans", [
    `${scene}に着るものって、可愛いだけじゃなく一日気分よく過ごせるかも大事ですよね✨`,
    `${concern}のが気になる方ほど、写真とレビューで細かく見て選びたくなりますよね🔍`,
    `${want}けど、無理して見えるものは避けたい日にちょうどよさそうです💖`,
    `手持ち服にすっと馴染む${item}があると、朝のコーデ選びが少しラクになりますよね🫶`,
    `買うならちゃんと使えるものを選びたい方に、こういうバランスは気になります✨`,
    `鏡を見た時に「今日いい感じ」と思える服や小物って、やっぱり出番が増えますよね💖`,
  ]);

  signals.forEach((signal, index) => {
    const signalScene = profile.scenes[index % profile.scenes.length] || scene;
    pushAll("leads", [
      `${signal.good}があるので、${signalScene}にも自然に映える雰囲気です✨`,
      `${signal.want}日に、${featureA}がさりげなく効いてくれます💖`,
      `${signal.risk}心配を減らしながら、今っぽい見え方に寄せられます🎀`,
      `${signal.good}で選びつつ、普段のコーデにもなじみやすいのが魅力です✨`,
    ]);
    pushAll("details", [
      `${signal.good}は写真で印象が変わりやすいので、商品ページで近くの画像まで見たいです🔍`,
      `${signal.want}人には、${featureB}の使いやすさもかなり大事なポイントです💖`,
      `${signal.risk}のが不安な時も、レビューで着用感を確認できると選びやすいです◎`,
      `${signalScene}で使うなら、見た目と快適さの両方をチェックしたいです✨`,
    ]);
    pushAll("sales", [
      `${signal.want}人は、在庫があるうちにカラーとサイズを見ておきたいです✨`,
      `${signal.good}に惹かれたら、レビュー写真まで見て候補に入れたいアイテムです💖`,
      `${/気になる$/.test(signal.risk) ? `${signal.risk}人ほど` : `${signal.risk}のを避けたい人ほど`}、商品ページの着用感チェックが大事です🔍`,
      `${signalScene}の予定があるなら、早めに比較しておきたいタイプです🎀`,
    ]);
    pushAll("humans", [
      `${signal.want}けど、${signal.risk}のは避けたい…という人に刺さりそうです💖`,
      `${signal.good}があるだけで、いつもの服選びが少し楽しくなりますよね✨`,
      `${signalScene}に使うなら、見た目だけじゃなく使いやすさも欲しいですよね🫶`,
    ]);
  });

  Object.keys(lines).forEach((key) => {
    lines[key] = dedupeText(lines[key]);
  });
  return lines;
}

function isReviewLineCompatible(line, category, seed) {
  const value = String(line || "");
  const source = String(seed || "");
  const evidenceRules = [
    [/接触冷感|ひんやり|冷感機能/, /接触冷感|ひんやり|冷感/],
    [/UVカット|紫外線対策|UV対策/, /UV|紫外線|日焼け対策/],
    [/撥水|防水/, /撥水|防水/],
    [/洗える|洗濯機|自宅で洗え|ウォッシャブル/, /洗える|洗濯機|自宅で洗え|ウォッシャブル/],
    [/軽量|軽さ|軽いバッグ|軽い傘/, /軽量|超軽量|軽い|\d+g/],
    [/大容量|A4|収納力/, /大容量|A4|収納|ポケット|マチ/],
    [/金属アレルギー対応|ニッケルフリー|サージカルステンレス/, /金属アレルギー|ニッケルフリー|サージカルステンレス/],
    [/シームレス|響きにくい|ラインレス/, /シームレス|響きにくい|ひびきにくい|ラインレス|縫い目なし/],
    [/ノンワイヤー|ワイヤレス/, /ノンワイヤー|ワイヤレス/],
    [/カップ付き/, /カップ付き|ブラトップ/],
    [/着圧|補正サポート/, /着圧|補正|ガードル|シェイパー/],
    [/ストレッチ|伸縮/, /ストレッチ|伸縮/],
    [/シワになりにく|防シワ|ノーアイロン/, /シワになりにく|防シワ|形態安定|ノーアイロン/],
    [/毛玉になりにく|毛玉防止/, /毛玉になりにく|毛玉防止|ピリング防止/],
    [/完全遮光|遮光率|遮光機能/, /完全遮光|遮光率|遮光/],
    [/吸汗|速乾/, /吸汗|速乾/],
    [/2WAY|3WAY/, /2WAY|3WAY/],
    [/歩きやす|痛くない|疲れにく/, /歩きやす|痛くない|疲れにく|クッション|軽量|幅広|甲高|外反母趾/],
  ];
  if (evidenceRules.some(([claim, evidence]) => claim.test(value) && !evidence.test(source))) return false;

  const figureClaim = /体型カバー|細見え|痩せ見え|美脚|脚長見え|華奢見え|小顔見え/;
  const figureEvidence = /体型カバー|細見え|痩せ見え|美脚|脚長|華奢見え|小顔|Iライン|Aライン|縦ライン|センタープレス|テーパード|ハイウエスト|ペプラム|フレア|マーメイド|ドレープ|タック|ギャザー|補正|着圧/;
  if (figureClaim.test(value) && !figureEvidence.test(source)) return false;
  if (/UV対策|軽量デザイン|撥水加工|接触冷感素材|収納力/.test(value) && /主張しすぎない/.test(value)) return false;

  const categoryForbidden = [
    [/バッグ/, /背中|後ろ姿|二の腕|脚のライン|丈感|着丈|袖丈|胸元|肌見せ|体型カバー|細見え|着用感|身長別|ホールド感/],
    [/シューズ/, /収納力|A4|顔まわり|二の腕|袖丈|着丈|体型カバー|下着|バスト|羽織る|冷房対策/],
    [/アクセサリー|腕時計/, /歩きやす|収納力|A4|体型カバー|丈感|着丈|袖丈|冷房対策|ホールド感/],
    [/財布/, /体型カバー|細見え|歩きやす|袖丈|着丈|冷房対策|ホールド感/],
    [/傘/, /着回し|着用感|着用写真|着るもの|身長別|丈感|体型カバー|細見え|袖丈|着丈|ホールド感/],
    [/帽子|サングラス|手袋|アームカバー|ストール|ベルト/, /収納力|歩きやす|バスト|ホールド感|下着のライン/],
  ];
  return !categoryForbidden.some(([pattern, forbidden]) => pattern.test(category) && forbidden.test(value));
}

function pickCompatibleReviewLine(choices, category, seed, salt) {
  const deduped = dedupeText(choices);
  const compatible = deduped.filter((line) => isReviewLineCompatible(line, category, seed));
  return pickByHash(compatible.length ? compatible : deduped, `${seed} ${salt}`);
}

function buildEvidenceBackedConversionLines(category, featureA, featureB, seed) {
  const source = String(seed || "");
  const profiles = [
    [/バッグ/, ["普段の荷物が収まるか", "持った時に大きく見えないか", "手持ち服になじむ色か"], ["毎日のコーデを小物から整えたい", "通勤にも休日にも持ちたい", "可愛さと実用感を両立したい"]],
    [/シューズ/, ["普段サイズとの違い", "足幅や甲のフィット感", "手持ちのボトムに合うか"], ["足元から印象を変えたい", "長く出番が続く一足を選びたい", "きれいめにも休日にも合わせたい"]],
    [/ランジェリー|インナー/, ["サイズ表とフィット感", "肌あたりや締め付け感", "服に合わせた時の見え方"], ["毎日無理なく使いたい", "服をきれいに着たい", "気分が上がるインナーを選びたい"]],
    [/ワンピ/, ["身長別の丈感", "ウエスト位置と落ち感", "裏地や透け感"], ["忙しい朝も一枚で決めたい", "写真に残る日も自信を持ちたい", "小物を変えて長く着たい"]],
    [/トップス/, ["首元と袖の見え方", "インとアウト両方の丈感", "手持ちボトムとの相性"], ["顔まわりを明るく見せたい", "いつものボトムを新鮮にしたい", "一枚で着映えさせたい"]],
    [/パンツ|デニム/, ["ウエストとヒップのゆとり", "身長別の丈感", "座った時の動きやすさ"], ["脚のラインをきれいに見せたい", "オンオフ着回したい", "ラクさときちんと感を両立したい"]],
    [/スカート/, ["ウエストと広がり方", "裏地や透け感", "手持ちトップスとのバランス"], ["歩くたび華やぐコーデにしたい", "甘すぎず女性らしく見せたい", "普段にも予定の日にも使いたい"]],
    [/カーデ|アウター|ニット/, ["着丈と袖のゆとり", "生地の厚みと重さ", "手持ち服へ重ねた時のバランス"], ["羽織るだけで印象を整えたい", "季節の変わり目にも使いたい", "着膨れせず大人っぽく見せたい"]],
    [/アクセサリー/, ["着用した時の大きさ", "素材とお手入れ方法", "実物のツヤや色味"], ["シンプル服を華やげたい", "顔まわりに上品なツヤを足したい", "毎日使える高見え小物を選びたい"]],
    [/財布/, ["カードと小銭の収納", "開閉のしやすさ", "バッグに入れた時の厚み"], ["会計をスムーズにしたい", "毎日使う小物で気分を上げたい", "小さくても使いやすく選びたい"]],
    [/帽子|サングラス/, ["顔まわりとのバランス", "サイズ調整の方法", "実物の色味"], ["日差し対策をおしゃれになじませたい", "シンプルコーデを垢抜けさせたい", "旅行にも普段にも使いたい"]],
    [/傘|レインウェア/, ["重さと持ち歩きやすさ", "開閉や着脱のしやすさ", "雨の日の服になじむ色か"], ["天気が悪い日も気分よく出かけたい", "通勤や旅行に備えたい", "機能小物も大人っぽく選びたい"]],
    [/ルームウェア/, ["肌触りとゆとり", "洗濯後の扱いやすさ", "近所にも出やすい見え方"], ["家でも気分よく過ごしたい", "ラクさと可愛さを両立したい", "旅行や帰省にも持っていきたい"]],
    [/フォーマル|ブライダル|スーツ/, ["長時間着た時のサイズ感", "写真で見た時の上品さ", "行事後も使えるか"], ["写真に残る日を上品に迎えたい", "きちんと感と今っぽさを両立したい", "一度きりで終わらせず着回したい"]],
    [/水際/, ["着丈とフィット感", "濡れた後の扱いやすさ", "手持ちの水着との合わせやすさ"], ["水際でも大人可愛く過ごしたい", "写真に残るレジャーを楽しみたい", "露出を調整しながらおしゃれしたい"]],
  ];
  const matched = profiles.find(([pattern]) => pattern.test(category));
  const checks = matched ? matched[1] : ["サイズや仕様", "実物の色味", "レビューでの使用感"];
  const goals = matched ? matched[2] : ["毎日使いやすいものを選びたい", "手持ちのものになじませたい", "買ってから長く使いたい"];
  const supportedBenefits = [
    [/2WAY|3WAY/, "使い方を変えられる仕様"],
    [/軽量|超軽量|軽い|\d+g/, "持ち歩きやすい軽さ"],
    [/大容量|A4|収納|ポケット|マチ/, "荷物をまとめやすい設計"],
    [/接触冷感|ひんやり|冷感/, "暑い日にうれしい冷感機能"],
    [/UV|紫外線/, "紫外線対策できる機能"],
    [/撥水|防水/, "天気が気になる日に頼れる機能"],
    [/洗える|ウォッシャブル|洗濯機/, "お手入れしやすい仕様"],
    [/ストレッチ|伸縮/, "動きに合わせやすい伸縮性"],
    [/ノンワイヤー|ワイヤレス/, "締め付けを抑えやすい設計"],
    [/シームレス|響きにくい|ラインレス/, "服に響きにくい仕様"],
    [/金属アレルギー|ニッケルフリー|サージカルステンレス/, "素材に配慮された仕様"],
    [/フリル|ラッフル|リボン|チュール|レース/, "大人可愛いディテール"],
    [/プリーツ|ギャザー|ティアード/, "動くたび表情が出るデザイン"],
    [/センタープレス|テーパード|Iライン|ハイウエスト/, "すっきり見えを狙えるライン"],
  ].filter(([pattern]) => pattern.test(source)).map(([, benefit]) => benefit);
  const benefits = dedupeText([...supportedBenefits, featureA, featureB]).slice(0, 5);
  const scenes = inferProductSpecificCoords(category, seed).slice(0, 3);
  if (!scenes.length) scenes.push(...inferWorryProfile(category).scenes.slice(0, 3));
  const lines = { leads: [], details: [], sales: [], clicks: [], humans: [] };

  benefits.forEach((benefit, index) => {
    const goal = goals[index % goals.length];
    const check = checks[index % checks.length];
    const scene = scenes[index % scenes.length];
    lines.leads.push(
      `${benefit}があるので、${goal}日に選びやすいです✨`,
      `ぱっと見の可愛さだけでなく、${benefit}まで考えられているのが魅力です💖`,
      `${goal}人に、${benefit}がさりげなく効いてくれます🎀`,
      `手持ちコーデへ取り入れた時、${benefit}が自然な洒落感につながります✨`
    );
    lines.details.push(
      `${check}は写真だけで差が出やすいので、商品ページでしっかり見たいです🔍`,
      `「${scene}」を想定するなら、${check}まで確認すると使う姿を想像しやすいです◎`,
      `${benefit}に惹かれたら、実物に近いレビュー写真まで見て選びたいです💖`,
      `色違いで印象が変わるので、${check}と一緒にカラーも比べたいです✨`
    );
    lines.sales.push(
      `「可愛い」で終わらず、${goal}人の買い足し候補に入りやすいアイテムです💖`,
      `${check}まで納得できれば、届いた後の出番も想像しやすいです✨`,
      `「${scene}」を考えているなら、カラーとレビューを比べたいです🔍`,
      `${benefit}を重視する人ほど、商品ページで細部まで見たくなります🎀`
    );
    lines.clicks.push(
      `${check}を画像とレビューで見比べたいです🔍`,
      `${benefit}の実物感を、購入者写真で確認したいです◎`
    );
    lines.humans.push(
      `${goal}けど、買ったあと本当に使うかまで考えて選びたいですよね🫶`,
      `「${scene}」で使うなら、見た目だけでなく${check}も大切ですよね✨`,
      `毎日手に取るものほど、${benefit}のような小さな使いやすさがうれしいですよね💖`
    );
  });

  const sale = inferSaleSignal(seed);
  if (sale) {
    lines.sales.push(
      `${sale.label}の今は、${checks[0]}とカラーを落ち着いて比べるチャンスです✨`,
      `お得さだけで決めず、${checks[1]}まで確認して選びたいです🔍`,
      `${sale.label}対象なら、普段は迷う色もレビュー写真まで見たくなります💖`
    );
  }
  Object.keys(lines).forEach((key) => {
    lines[key] = dedupeText(lines[key]).filter((line) => isReviewLineCompatible(line, category, seed));
  });
  return lines;
}

function inferLead(category, featureA, featureB, seed) {
  const nonFashion = getNonFashionProfile(category);
  if (nonFashion) return pickByHash(nonFashion.leads, `${seed} non-fashion lead`);
  const featureText = `${featureA} ${featureB}`;
  const signals = inferProductSignals(seed);
  const categoryCopy = inferCategoryCopy(category, featureA, featureB);
  const variation = buildReviewVariationLines(category, featureA, featureB, seed);
  const conversion = buildEvidenceBackedConversionLines(category, featureA, featureB, seed);
  const choices = [
    `${featureA}がほどよい華やかさを足して、着るだけで大人可愛い印象に整えてくれます✨`,
    `${featureA}の表情が効いていて、シンプルなのに手抜きに見えないのが魅力です💖`,
    `${featureA}と${featureB}のバランスがよく、いつものコーデを自然に高見えさせてくれます✨`,
    `気になる部分をふわっとごまかしながら、${featureB}で今っぽい抜け感も出せます🎀`,
    `派手すぎないのにちゃんと印象に残るので、いつもの服に合わせるだけで垢抜けた雰囲気になります✨`,
    `大人っぽさの中にほんのり可愛さがあって、頑張りすぎないおしゃれを楽しみたい日にぴったりです💖`,
    `着た瞬間にコーデの完成度が上がるような、きれいめ派さんにうれしい存在感があります👗`,
    `さりげないデザイン性があるので、シンプル派でも取り入れやすく、写真でも地味見えしにくいです✨`,
  ];
  if (category.includes("アウター") && /マウンテンパーカー|パーカー|撥水|防水/.test(seed)) {
    return pickByHash([
      `雨や風が気になる日にも羽織りやすく、普段の服へ自然になじみます✨`,
      `機能性がありながらスポーティーになりすぎず、大人カジュアルにまとまります💖`,
      `軽く羽織れて動きやすく、天気が変わりやすい日にも頼れそうです🎀`,
    ], `${seed} functional outer lead`);
  }
  if (category.includes("アウター") && /デニムジャケット|Gジャン|ジージャン/.test(seed)) {
    return pickByHash([
      `羽織るだけで程よいカジュアル感が加わり、いつもの服が新鮮に見えます✨`,
      `ワンピにもパンツにも合わせやすく、大人の休日コーデに頼れる一着です💖`,
      `デニムの表情がコーデにこなれ感を足し、季節の変わり目にも使いやすいです🎀`,
    ], `${seed} denim outer lead`);
  }
  if (category.includes("ランジェリー") && signals.leads.length) {
    return pickCompatibleReviewLine([...signals.leads, ...variation.leads, ...conversion.leads], category, seed, "lingerie lead");
  }

  if (category.includes("ワンピ")) {
    choices.push(
      `1枚でコーデがまとまるのに、${featureA}のおかげで無難に終わらないのがうれしいポイントです👗`,
      `忙しい朝でもさらっと着るだけで華やぐので、予定がある日の味方になってくれます💖`,
      `体のラインをきれいに見せつつ、${featureB}で抜け感も出せる大人ワンピです✨`
    );
  }
  if (category.includes("パンツ")) {
    choices.push(
      `${featureA}が縦ラインをきれいに見せてくれて、パンツ派さんの細見えコーデに頼れます✨`,
      `ラクに動けるのにきちんと感も残るので、通勤にも休日にも使いやすいパンツです💖`,
      `${featureB}が効いていて、脚まわりをすっきり見せたい日にも選びやすいです👗`
    );
  }
  if (category.includes("カーデ")) {
    choices.push(
      `羽織るだけでコーデに奥行きが出るので、冷房対策もおしゃれに見せられます✨`,
      `${featureA}の軽さがあって、重たくならずに大人の抜け感を足してくれます💖`,
      `バッグに入れておきたくなる便利さなのに、生活感が出にくいのが魅力です🎀`
    );
  }
  if (category.includes("トップス")) {
    choices.push(
      `顔まわりをぱっと明るく見せてくれるので、いつものボトム合わせでも新鮮に見えます✨`,
      `トップス1枚の日でも寂しく見えにくく、きれいめな存在感を足してくれます💖`,
      `${featureA}のニュアンスで、シンプルなパンツやスカートもぐっと今っぽくまとまります🎀`
    );
  }
  if (category.includes("スカート")) {
    choices.push(
      `${featureA}が動くたびに表情を出して、女性らしい華やかさを自然に足してくれます✨`,
      `甘すぎず大人っぽく着られるので、きれいめ派のスカートコーデに合わせやすいです💖`,
      `腰まわりをすっきり見せながら、コーデ全体にやわらかい雰囲気を作ってくれます🎀`
    );
  }
  if (category.includes("バッグ")) {
    choices.push(
      `持つだけでコーデがきれいめに寄るので、シンプル服の日にも高見え感を足せます✨`,
      `大人っぽい雰囲気がありつつ、普段使いしやすいバランスなのが魅力です💖`,
      `${featureA}が効いていて、通勤にも休日にも合わせやすいバッグです🎀`
    );
  }
  if (category.includes("シューズ")) {
    choices.push(
      `足元にきれいめ感が出るので、いつものコーデもぐっと垢抜けて見えます✨`,
      `楽さと女っぽさを両立したい日に選びやすく、デイリーにも使いやすいです💖`,
      `${featureA}の雰囲気で、パンツにもスカートにも合わせやすい足元になります🎀`
    );
  }
  if (category.includes("アクセサリー")) {
    choices.push(
      `顔まわりにさりげない華やかさが出て、シンプル服でも手抜きに見えにくいです✨`,
      `主張しすぎないのに印象が変わるので、大人の毎日アクセに使いやすいです💖`,
      `${featureA}の高見え感で、いつものコーデにきれいめなツヤを足してくれます🎀`
    );
  }
  if (category.includes("水際")) {
    choices.push(
      `体型カバーしながら水際コーデを可愛く見せられるので、写真を撮る日にも頼れます✨`,
      `露出を抑えたい大人にも取り入れやすく、リゾート感と安心感を両方狙えます💖`,
      `プールや海だけでなく、旅行先の羽織りとしても使いやすい雰囲気です🎀`
    );
  }
  if (category.includes("フォーマル")) {
    choices.push(
      `きちんと感がありつつ堅すぎないので、行事の日も上品にまとまります✨`,
      `写真に残る日にも選びやすく、シンプルなのに高見えする雰囲気があります💖`,
      `セレモニー後も着回しやすいデザインなら、買って終わりになりにくいです🎀`
    );
  }
  if (category.includes("インナー")) {
    choices.push(
      `ラクに着られるのにラインを整えやすく、薄着の季節にも頼れます✨`,
      `カップ付きでもだらしなく見えにくく、1枚あると毎日の支度がラクになります💖`,
      `肌あたりや安定感を重視したい人にも、レビューを見て選びやすいアイテムです🎀`
    );
  }

  if (/シアー|透け/.test(featureText)) {
    choices.push(`透け感が強すぎないので、大人でも挑戦しやすく、コーデに軽やかさを足してくれます✨`);
  }
  if (/洗える|ウォッシャブル/.test(featureText)) {
    choices.push(`可愛いだけでなくお手入れしやすいので、気兼ねなくデイリーに使えるのも助かります💖`);
  }
  if (/接触冷感|UV|冷感/.test(featureText)) {
    choices.push(`暑い日や日差しが気になる日にも使いやすく、見た目も快適さも欲張れます✨`);
  }
  choices.push(...signals.leads);
  choices.push(...categoryCopy.leads);
  choices.push(...variation.leads);
  choices.push(...conversion.leads);

  if (isFocusedCategory(category) && categoryCopy.leads.length) {
    return pickCompatibleReviewLine([...categoryCopy.leads, ...variation.leads, ...signals.leads, ...conversion.leads], category, seed, "category lead");
  }
  if (/ワンピ|トップス|パンツ|スカート|カーデ/.test(category) && categoryCopy.leads.length) {
    return pickCompatibleReviewLine([...categoryCopy.leads, ...variation.leads, ...signals.leads, ...conversion.leads], category, seed, "focused lead");
  }

  return pickCompatibleReviewLine(choices, category, seed, "lead");
}

function inferDetail(category, featureA, featureB, seed) {
  const nonFashion = getNonFashionProfile(category);
  if (nonFashion) return pickByHash(nonFashion.details, `${seed} non-fashion detail`);
  const signals = inferProductSignals(seed);
  const categoryCopy = inferCategoryCopy(category, featureA, featureB);
  const variation = buildReviewVariationLines(category, featureA, featureB, seed);
  const conversion = buildEvidenceBackedConversionLines(category, featureA, featureB, seed);
  const choices = [
    `通勤にも休日にも使いやすく、1枚あるとコーデに迷う日も頼れます👗`,
    `きれいめ小物とも相性がよく、頑張りすぎない洒落感を作りやすいです✨`,
    `さらっと合わせるだけで細見えと着回しを狙えるので、デイリー使いにもぴったりです💫`,
    `大人っぽさと可愛さのちょうどいいところを押さえてくれるので、写真映えも期待できます💖`,
    `手持ちのベーシック服に足すだけで雰囲気が変わるので、買い足しアイテムとしても優秀です✨`,
    `高見え感があるので、プチプラでもきちんと見せたい日のお守りアイテムになりそうです💖`,
    `合わせ方次第で甘めにもきれいめにも振れるので、着回しの幅が広がります🎀`,
    `派手すぎない華やかさで、普段使いからちょっとしたお出かけまで自然に使えます✨`,
  ];
  if (category.includes("シューズ")) {
    if (/パンプス|ミュール|バレエシューズ/.test(seed)) {
      return pickByHash([
        `パンツにもスカートにも合わせやすく、通勤から食事まで使いやすいです✨`,
        `ヒールの高さやクッション性は、長時間の日を考えて確認したいです🔍`,
        `足幅やかかとのフィット感までレビューで見ておくと安心です◎`,
      ], `${seed} pumps detail`);
    }
    if (/スニーカー/.test(seed)) {
      return pickByHash([
        `ワンピやスカートの外しにも使えて、大人カジュアルにまとめやすいです✨`,
        `重さやクッション性を確認すると、たくさん歩く日にも選びやすいです🔍`,
        `きれいめ服にもなじむ色なら、通勤から休日まで出番が増えそうです💖`,
      ], `${seed} sneaker detail`);
    }
    if (/ブーツ|ローファー/.test(seed)) {
      return pickByHash([
        `パンツにもスカートにも合わせやすく、足元から季節感を足せます✨`,
        `筒まわりや甲のフィット感は、着用レビューで確認しておきたいです🔍`,
        `きちんと感があるので、通勤服にも休日コーデにも合わせやすいです💖`,
      ], `${seed} covered shoes detail`);
    }
  }

  if (category.includes("ワンピ")) {
    choices.push(
      `ヒールで上品に、フラットサンダルで抜け感を出しても可愛く、シーンに合わせて表情を変えられます💫`,
      `アクセやバッグを変えるだけで印象が変わるので、旅行やデートにも持っていきたくなります👗`,
      `1枚で主役になるのに小物合わせで調整しやすく、忙しい日でもコーデが決まりやすいです✨`
    );
  }
  if (category.includes("パンツ")) {
    choices.push(
      `ブラウス合わせで上品に、Tシャツ合わせで抜け感を出してもまとまりやすいです✨`,
      `座る時間が長い日にも使いやすく、見た目のきれいさとラクさの両方を狙えます💖`,
      `オンオフ兼用しやすいので、クローゼットにあると出番が増えそうです💫`
    );
  }
  if (category.includes("カーデ")) {
    choices.push(
      `ワンピにもパンツにも羽織りやすく、季節の変わり目や冷房対策にも活躍します✨`,
      `薄手でもコーデの印象を整えてくれるので、バッグに入れておくと安心です💖`,
      `肩掛けするだけでもこなれ感が出るので、シンプルコーデの仕上げにも使えます🎀`
    );
  }
  if (category.includes("トップス")) {
    choices.push(
      `デニムでカジュアルに、スカートでフェミニンにと、手持ち服との相性もよさそうです✨`,
      `インしてもアウトでもバランスが取りやすく、朝のコーデ決めがラクになります💖`,
      `アクセを足すだけで華やぐので、オンライン映えや写真映えも狙えます💫`
    );
  }
  if (category.includes("スカート")) {
    choices.push(
      `コンパクトトップスで上品に、ゆるニットで抜け感を出しても可愛いです✨`,
      `歩くたびに揺れる雰囲気が出るので、シンプルなトップスでもちゃんと華やぎます💖`,
      `デートにも休日にも使いやすく、大人フェミニンな気分の日にぴったりです🎀`
    );
  }
  if (category.includes("バッグ")) {
    choices.push(
      `きれいめにもカジュアルにも持ちやすく、荷物量に合わせて出番が増えそうです✨`,
      `小物で印象を変えたい日に使いやすく、手持ち服の雰囲気を自然に更新できます💖`,
      `カラー違いで印象が変わるタイプなら、商品ページで実物写真まで見たいです🎀`
    );
  }
  if (category.includes("シューズ")) {
    choices.push(
      `長時間歩く日にも使うなら、レビューで履き心地やサイズ感を確認して選びたいです✨`,
      `足元を変えるだけで雰囲気が変わるので、いつもの服のマンネリ対策にもなります💖`,
      `きれいめ小物と合わせると、プチプラ服もぐっと高見えしやすいです🎀`
    );
  }
  if (category.includes("アクセサリー")) {
    choices.push(
      `Tシャツやニットに足すだけでも華やぐので、忙しい日の時短おしゃれに使えます✨`,
      `デイリーにもお出かけにも使いやすく、プレゼント候補としても見たくなります💖`,
      `金属アレルギー対応なら、素材表記やレビューも確認して選びたいです🎀`
    );
  }
  if (category.includes("水際")) {
    choices.push(
      `水着の上に重ねたり、リゾートコーデに合わせたりと使い方の幅が広いです✨`,
      `日差し対策や冷房対策にも使えるタイプなら、旅行バッグに入れておきたくなります💖`,
      `水際アイテムはサイズ感が大事なので、着用写真を見て選ぶと安心です🎀`
    );
  }
  if (category.includes("フォーマル")) {
    choices.push(
      `パンプスやパール小物を合わせるだけで、卒入園や学校行事にも使いやすいです✨`,
      `ジャケットを変えれば印象も調整しやすく、行事後の着回しにも期待できます💖`,
      `フォーマル服はサイズ感が大事なので、レビューで丈や生地感を確認したいです🎀`
    );
  }
  if (category.includes("インナー")) {
    choices.push(
      `シャツやシアートップスの下にも使いやすく、透け対策にも頼れます✨`,
      `おうち時間からワンマイルまで使えるなら、コスパの良さも感じやすいです💖`,
      `毎日使うものだからこそ、レビューでホールド感や肌あたりを見ておきたいです🎀`
    );
  }
  if (category.includes("ランジェリー")) {
    return pickCompatibleReviewLine([...signals.details, ...categoryCopy.details, ...variation.details, ...conversion.details], category, seed, "lingerie detail");
  }
  if (isFocusedCategory(category) && categoryCopy.details.length) {
    return pickCompatibleReviewLine([...categoryCopy.details, ...variation.details, ...signals.details, ...conversion.details], category, seed, "category detail");
  }
  if (signals.details.length) {
    return pickCompatibleReviewLine([...signals.details, ...variation.details, ...conversion.details], category, seed, "product detail");
  }
  if (/ワンピ|トップス|パンツ|スカート|カーデ/.test(category) && categoryCopy.details.length) {
    return pickCompatibleReviewLine([...categoryCopy.details, ...variation.details, ...signals.details, ...conversion.details], category, seed, "focused detail");
  }
  choices.push(...signals.details);
  choices.push(...categoryCopy.details);
  choices.push(...variation.details);
  choices.push(...conversion.details);

  return pickCompatibleReviewLine(choices, category, seed, "detail");
}

function inferSalesLine(category, featureA, featureB, seed) {
  const nonFashion = getNonFashionProfile(category);
  if (nonFashion) return pickByHash(nonFashion.sales, `${seed} non-fashion sales`);
  const signals = inferProductSignals(seed);
  const categoryCopy = inferCategoryCopy(category, featureA, featureB);
  const variation = buildReviewVariationLines(category, featureA, featureB, seed);
  const conversion = buildEvidenceBackedConversionLines(category, featureA, featureB, seed);
  const choices = [
    `レビューで見比べる時も、細見え・高見え・着回しの3つが揃っていると選びやすいです✨`,
    `「何着よう？」の日に手が伸びるタイプなので、ワードローブにあると出番が増えそうです💖`,
    `トレンド感はありつつ派手すぎないので、長く使える大人可愛い1枚を探している人に刺さります🎀`,
    `プチプラでも安っぽく見せたくない日に、コーデ全体をきれいめに引き上げてくれます✨`,
    `写真に残る日や人に会う日にも選びやすく、褒められコーデを狙いたい時に頼れます💖`,
    `着回し前提で選んでも地味になりにくく、手持ち服が今っぽく見えるのがうれしいところです✨`,
  ];
  if (category.includes("ランジェリー") && signals.sales.length) {
    return pickCompatibleReviewLine([...signals.sales, ...variation.sales, ...conversion.sales], category, seed, "lingerie sales");
  }
  if (category.includes("アウター") && categoryCopy.sales.length) {
    return pickCompatibleReviewLine([...categoryCopy.sales, ...variation.sales, ...conversion.sales], category, seed, "outer sales");
  }
  if (isFocusedCategory(category) && categoryCopy.sales.length) {
    return pickCompatibleReviewLine([...categoryCopy.sales, ...variation.sales, ...signals.sales, ...conversion.sales], category, seed, "category sales");
  }

  if (category.includes("ワンピ")) {
    choices.push(
      `1枚で完成するのに小物で雰囲気を変えられるので、旅行やデート用にもチェックしたいワンピです👗`,
      `コーデを考える時間を減らしつつ可愛く見せたい日に、かなり使える主役ワンピです💖`,
      `「楽なのにちゃんと可愛い」を叶えたい人には、候補に入れておきたいアイテムです✨`
    );
  }
  if (category.includes("パンツ")) {
    choices.push(
      `脚のラインをきれいに見せたい日や、通勤にも使えるパンツを探している人にぴったりです✨`,
      `ラクさだけでなく美脚見えも欲しい人には、かなり頼れる候補になりそうです💖`,
      `トップスを変えるだけでオンオフ使えるので、コスパ重視でも選びやすいです🎀`
    );
  }
  if (category.includes("カーデ")) {
    choices.push(
      `冷房対策や日差し対策に使えて、見た目まで可愛い羽織りは1枚あると本当に便利です✨`,
      `ワンピにもパンツにも合わせやすいので、季節の変わり目に持っておきたいタイプです💖`
    );
  }
  if (category.includes("トップス")) {
    choices.push(
      `いつものボトムに合わせるだけで印象が変わるので、買い足しトップスとして優秀です✨`,
      `顔まわりの印象を上げたい日や、写真映えを狙いたい日に使いやすいトップスです💖`
    );
  }
  if (category.includes("スカート")) {
    choices.push(
      `シンプルトップスでも華やかに見えるので、少ない服で着回したい人にも向いています✨`,
      `デートや女子会にも使いやすく、大人フェミニンを作りたい日に頼れます💖`
    );
  }
  if (category.includes("バッグ")) {
    choices.push(
      `バッグは毎日目に入るので、高見え感と使いやすさの両方で選びたいアイテムです✨`,
      `荷物が入るか、肩掛けできるかまで見ておくとデイリー使いしやすいです💖`,
      `服より気軽に雰囲気を変えられるので、コーデの更新アイテムとして優秀です🎀`
    );
  }
  if (category.includes("シューズ")) {
    choices.push(
      `靴は履き心地で出番が変わるので、可愛さだけでなくレビュー確認までしたいです✨`,
      `足元が整うと全身の印象まで上がるので、垢抜け狙いの人にぴったりです💖`,
      `オンオフ使えるデザインなら、1足あるだけでコーデ幅がかなり広がります🎀`
    );
  }
  if (category.includes("アクセサリー")) {
    choices.push(
      `アクセは小さくても印象を変えやすいので、シンプル服の買い足しにぴったりです✨`,
      `高見えするデザインなら、普段コーデもお出かけコーデも一気に華やぎます💖`,
      `素材やサイズ感を見ながら選べると、毎日使いしやすいお気に入りになりそうです🎀`
    );
  }
  if (category.includes("水際")) {
    choices.push(
      `体型カバーと写真映えを両方狙える水際アイテムは、シーズン前に見ておきたいです✨`,
      `旅行やプール予定がある人は、サイズと在庫があるうちに候補へ入れたいです💖`
    );
  }
  if (category.includes("フォーマル")) {
    choices.push(
      `行事服は急に必要になるので、高見えするものを早めに候補へ入れておきたいです✨`,
      `卒入園だけで終わらず着回せるなら、価格以上に満足感が出やすいです💖`
    );
  }
  if (category.includes("インナー")) {
    choices.push(
      `毎日使うインナーこそ、ラクさときれい見えの両方で選ぶと満足度が高そうです✨`,
      `薄着の季節は特に出番が増えるので、透けにくさや着心地レビューを見たいです💖`
    );
  }

  if (/UV|接触冷感|冷感/.test(`${featureA} ${featureB}`)) {
    choices.push(`可愛いだけでなく季節の悩みにも寄り添ってくれるので、実用派さんにもおすすめです✨`);
  }
  if (/洗える|撥水/.test(`${featureA} ${featureB}`)) {
    choices.push(`お手入れしやすさまで考えると、デイリーに使う服としてかなり現実的です💖`);
  }
  choices.push(...signals.sales);
  choices.push(...categoryCopy.sales);
  choices.push(...variation.sales);
  choices.push(...conversion.sales);

  return pickCompatibleReviewLine(choices, category, seed, "sales");
}

function inferCategoryCopy(category, featureA, featureB) {
  const copy = { leads: [], details: [], sales: [], clicks: [], trusts: [], coords: [], points: [] };
  const add = (key, entries) => copy[key].push(...entries);

  if (category.includes("アウター")) {
    add("leads", [
      `羽織った時のシルエットが重たく見えにくく、いつものコーデを大人っぽく整えてくれます✨`,
      `${featureA}で季節感を足しながら、着膨れしにくいバランスを狙えるのが魅力です💖`,
      `さっと羽織るだけで外出感が出るので、近場のお出かけにも使いやすいです🎀`,
    ]);
    add("details", [
      `パンツにもワンピにも合わせやすく、朝晩の温度差がある日にも頼れます✨`,
      `中の服を選びにくいデザインなら、手持ち服との着回しもしやすいです💖`,
      `軽めに羽織れるタイプは、季節の変わり目に出番が増えそうです🎀`,
    ]);
    add("sales", [
      `アウターは印象を左右するので、高見えするものを早めに候補へ入れておきたいです✨`,
      `着回しやすい羽織りは毎年使えるので、レビューで生地感まで見たいです💖`,
    ]);
    add("clicks", [`袖丈や着丈で印象が変わるので、着用写真を見て選びたいです🔍`]);
    add("trusts", [`羽織りものは長く使うので、重さや厚みのレビューもチェックしたいです◎`]);
    add("coords", ["ワンピに羽織って上品なお出かけに", "デニム合わせで大人カジュアルに"]);
    add("points", ["着膨れしにくい", "季節の変わり目に便利"]);
  }

  if (category.includes("帽子")) {
    add("leads", [
      `日差し対策しながらコーデの完成度も上げてくれる、実用派にうれしい小物です✨`,
      `かぶるだけで目線が上がって、シンプルコーデもこなれて見えます💖`,
      `${featureA}が効いていて、カジュアルすぎず大人っぽく取り入れやすいです🎀`,
    ]);
    add("details", [
      `旅行や公園コーデにも使いやすく、髪型が決まらない日の味方にもなります✨`,
      `顔まわりの印象が変わるので、カラー選びまで楽しめそうです💖`,
      `折りたたみやサイズ調整ができるタイプなら、デイリー使いしやすいです🎀`,
    ]);
    add("sales", [
      `帽子はシーズン前に売れやすいので、気になる色は早めに見ておきたいです✨`,
      `日よけも小顔見えも欲しい人には、候補に入れておきたいアイテムです💖`,
    ]);
    add("clicks", [`つばの広さや深さで雰囲気が変わるので、着用写真を確認したいです🔍`]);
    add("trusts", [`帽子はサイズ感が大事なので、レビューでフィット感も見たいです◎`]);
    add("coords", ["ワンピに合わせてリゾート感をプラス", "Tシャツコーデの垢抜け小物に"]);
    add("points", ["日差し対策に便利", "小顔見えを狙える"]);
  }

  if (category.includes("財布")) {
    add("leads", [
      `毎日使うものだからこそ、可愛さと使いやすさを両方満たしてくれるのがうれしいです✨`,
      `${featureA}の高見え感があって、バッグから出すたびに気分が上がりそうです💖`,
      `コンパクトでも必要なものをまとめやすいと、小さめバッグの日にも頼れます🎀`,
    ]);
    add("details", [
      `カード収納や小銭入れの使いやすさまで見ると、失敗しにくいです✨`,
      `きれいめバッグにも合わせやすく、大人っぽい小物として長く使えそうです💖`,
      `ギフト候補にも見やすいので、カラー違いまでチェックしたくなります🎀`,
    ]);
    add("sales", [
      `財布は使う頻度が高いので、見た目だけでなく収納力レビューまで確認したいです✨`,
      `ミニバッグ派さんは、サイズ感とカード枚数を商品ページで見ておきたいです💖`,
    ]);
    add("clicks", [`カード枚数や厚みが気になるので、商品ページの収納写真を見たいです🔍`]);
    add("trusts", [`毎日使うものはレビュー数や素材感まで確認できると安心です◎`]);
    add("coords", ["小さめバッグの日の持ち歩きに", "通勤バッグの中身も可愛く"]);
    add("points", ["収納力を確認したい", "毎日使いやすい"]);
  }

  if (category.includes("ファッション小物")) {
    add("leads", [
      `小物を足すだけで、手持ち服の印象を自然に変えてくれるのが魅力です✨`,
      `シンプルコーデにプラスするだけで、こなれ感と季節感が出せます💖`,
      `${featureA}が効いていて、プチプラ服も高見えしやすくなります🎀`,
    ]);
    add("details", [
      `バッグや靴と色を合わせると、全体がまとまって見えます✨`,
      `服を買い足さなくても雰囲気を変えられるので、コスパよく垢抜けを狙えます💖`,
      `プレゼントや自分用の買い足しにも見やすいアイテムです🎀`,
    ]);
    add("sales", [
      `小物は売り切れると同じ雰囲気のものを探しにくいので、気になった時が見どきです✨`,
      `いつもの服が新鮮に見えるので、マンネリ対策にぴったりです💖`,
    ]);
    add("clicks", [`色味やサイズで印象が変わるので、着用写真を見ておきたいです🔍`]);
    add("trusts", [`小物は素材感で高見え度が変わるので、レビュー写真も参考になります◎`]);
    add("coords", ["シンプルコーデの差し色に", "バッグや靴と色合わせして統一感を"]);
    add("points", ["こなれ感を足せる", "手持ち服が新鮮に"]);
  }

  if (category.includes("ランジェリー")) {
    add("leads", [
      `肌に直接触れるものだから、${featureA}でラクさもきれい見えも狙えるのがうれしいです✨💖`,
      `薄手服の日も響きにくく、下着のラインを気にせず過ごしやすいのが魅力です🎀✨`,
      `${featureA}と${featureB}のバランスがよく、毎日使いしやすいのに気分も上がります💖`,
      `締め付け感を抑えたい日にも選びやすく、ラクなのにシルエットを整えやすいです✨`,
      `見えない部分まで可愛く整えると、いつものコーデにも自信が出そうです🎀💖`,
      `上品レースやきれいなカラーなら、普段使いでも特別感を楽しめます✨`,
      `脇高や補正タイプは、きれいめ服の日のライン作りにも頼れます💖`,
      `ナイトケア系はおうち時間に取り入れやすく、ラクさとホールド感の両方を見たいです🌙✨`,
    ]);
    add("details", [
      `ノンワイヤーやワイヤレス系は、長時間つける日もストレスを減らしやすいのが助かります💖`,
      `シームレスならニットやTシャツにも合わせやすく、後ろ姿まで気にしやすい日に便利です✨`,
      `ブラショーツセットは上下でそろうので、朝の支度もちょっと気分が上がります🎀`,
      `脇高やサポート感のあるタイプは、ワンピやパンツの日のシルエット作りにも使いやすいです✨`,
      `サニタリー系は安心感に加えて、見た目の可愛さまであると毎月の気分が少しラクになります💖`,
      `肌あたりや伸び感、レースの柔らかさはレビューで確認して選びたいです🔍`,
      `淡色服に合わせるなら、透けにくさや段差の出にくさまで見ておくと安心です◎`,
      `洗い替えや色違いでそろえやすい価格なら、デイリー用にも取り入れやすいです✨`,
    ]);
    add("sales", [
      `下着はサイズ感で満足度が変わるので、レビューのフィット感まで見て候補に入れたいです🔍`,
      `毎日使うものほど、ラクさ・可愛さ・響きにくさのバランスで選ぶと出番が増えそうです💖`,
      `きれいめ服をよく着る人は、ラインが出にくいタイプを早めにチェックしておきたいです✨`,
      `洗い替え用にも選びやすいので、気に入った形は色違いまで見たくなります🎀`,
      `ナイトブラや補正系はレビューの着用感がかなり参考になるので、商品ページで確認したいです◎`,
    ]);
    add("clicks", [
      `サイズ表とレビューの着用感を見比べて、自分に合うものを選びたいです🔍`,
      `薄手服に合わせるなら、響きにくさや透けにくさも商品ページで確認したいです◎`,
      `ホールド感や締め付け具合は人によって違うので、レビュー写真まで見たいです✨`,
      `洗い替えを考えるなら、カラー展開やセット内容もチェックしておきたいです💖`,
    ]);
    add("trusts", [
      `肌に触れるものだから、素材感や締め付け感のレビューは大事です◎`,
      `毎日使うものは洗い替えや色違いまで見ておくと便利です♡`,
      `サイズ選びが大事なアイテムなので、レビューの身長や体型コメントも参考になります🔍`,
      `レースや縫い目の肌あたりは、実際の口コミを見てから選ぶと安心です◎`,
    ]);
    add("coords", [
      "薄手トップスの日の響き対策に",
      "ナイトケアやおうち時間に",
      "きれいめ服の日のシルエット作りに",
      "淡色コーデの日の透け対策に",
      "旅行用の洗い替えインナーに",
      "ワンピやタイトめ服のライン対策に",
    ]);
    add("points", [
      "響きにくい",
      "ラクな着け心地",
      "シルエットを整えやすい",
      "肌あたりを確認したい",
      "洗い替えにも便利",
      "サイズ感を見て選びたい",
      "淡色服にも合わせやすい",
      "ナイトケアにも使いやすい",
    ]);
  }

  if (category.includes("ルームウェア")) {
    add("leads", [
      `リラックス感はあるのにだらしなく見えにくく、おうち時間も可愛く過ごせます✨`,
      `締め付け感を抑えながら、急な来客にも慌てにくいきれい見えが魅力です💖`,
      `${featureA}で楽ちんなのに、生活感が出すぎないバランスがうれしいです🎀`,
    ]);
    add("details", [
      `ワンマイルにも使えるデザインなら、部屋着感を抑えて着回せます✨`,
      `肌あたりや伸び感のレビューを見ておくと、毎日使いしやすいか分かりやすいです💖`,
      `旅行や帰省用にも持っていきやすく、可愛いリラックス服として活躍しそうです🎀`,
    ]);
    add("sales", [
      `毎日着るものほど、可愛さと着心地で選ぶと満足度が高そうです✨`,
      `おうち時間の気分を上げたい人は、候補に入れておきたいアイテムです💖`,
    ]);
    add("clicks", [`生地の厚みや透け感が気になるので、レビューで確認したいです🔍`]);
    add("trusts", [`ルームウェアは洗濯後の質感も大事なので、レビューを見たいです◎`]);
    add("coords", ["おうち時間を可愛く快適に", "旅行や帰省のリラックス服に"]);
    add("points", ["楽ちんな着心地", "生活感が出にくい"]);
  }

  if (category.includes("浴衣")) {
    add("leads", [
      `夏イベントで写真映えしやすく、大人可愛い雰囲気を一気に作れます✨`,
      `柄の華やかさがありつつ、大人っぽく着られるバランスが魅力です💖`,
      `帯や小物まで合うセットなら、コーデに迷わず夏のお出かけを楽しめます🎀`,
    ]);
    add("details", [
      `花火大会や夏祭りだけでなく、旅先の写真にも映えそうです✨`,
      `柄の出方や帯の色で印象が変わるので、商品ページの写真を見比べたいです💖`,
      `下駄や小物付きなら、届いてすぐ雰囲気を作りやすいです🎀`,
    ]);
    add("sales", [
      `浴衣はシーズン前に動くので、気になる柄は早めにチェックしたいです✨`,
      `写真に残るイベント用なら、安っぽく見えないデザインを選びたいです💖`,
    ]);
    add("clicks", [`浴衣は柄の出方が大事なので、着用写真をしっかり見たいです🔍`]);
    add("trusts", [`セット内容とサイズ感を確認しておくと、当日も安心です◎`]);
    add("coords", ["花火大会や夏祭りに", "かごバッグや淡色小物合わせに"]);
    add("points", ["夏イベントに映える", "セット内容を確認したい"]);
  }

  if (category.includes("マタニティ")) {
    add("leads", [
      `締め付けにくいのにきれいめに見えて、体型変化の時期にも頼れます✨`,
      `ラクさと可愛さを両立しやすく、産前産後も長く使えそうです💖`,
      `${featureA}で自然にカバーしつつ、だらしなく見えにくいのがうれしいです🎀`,
    ]);
    add("details", [
      `通院やちょっとしたお出かけにも使いやすく、毎日の服選びがラクになります✨`,
      `授乳やウエストまわりの仕様は、商品ページで確認しておきたいです💖`,
      `体調に合わせて着やすいか、レビューで生地感や伸び感を見たいです🎀`,
    ]);
    add("sales", [
      `一時期だけで終わらず長く使えるデザインなら、かなり選びやすいです✨`,
      `マタニティ服でも可愛くいたい人には、候補に入れておきたいアイテムです💖`,
    ]);
    add("clicks", [`ウエストや授乳仕様は大事なので、商品ページで詳細を見たいです🔍`]);
    add("trusts", [`サイズ変化がある時期だからこそ、レビューの着用感が参考になります◎`]);
    add("coords", ["通院や産前産後のお出かけに", "フラットシューズ合わせで楽ちんに"]);
    add("points", ["締め付けにくい", "産前産後も使いやすい"]);
  }

  if (category.includes("ワンピ")) {
    add("leads", [
      `1枚でコーデが決まりやすく、${featureA}のおかげで手抜きに見えにくいのが魅力です👗✨`,
      `${featureA}が効いていて、シンプルでもちゃんと着映えする大人ワンピです💖`,
      `忙しい朝でもさらっと着るだけで雰囲気が作れるので、お出かけ前の味方になってくれます🎀`,
      `${featureB}で抜け感も出せて、頑張りすぎないのにきれいめにまとまります✨`,
      `体型を拾いすぎず、女性らしいラインも残せるバランスがうれしいです💖`,
    ]);
    add("details", [
      `ヒールで上品に、フラットシューズで軽やかにと小物で印象を変えやすいです✨`,
      `羽織りやアクセを足すだけで雰囲気が変わるので、旅行やデートにも使いやすいです💖`,
      `丈感やシルエットをレビューで見ておくと、自分に合う着こなしが想像しやすいです🔍`,
      `1枚で主役になるタイプなら、コーデを考える時間を減らしながら可愛く見せられます🎀`,
      `大人可愛い雰囲気がありつつ、普段にも浮きにくいデザインだと出番が増えそうです✨`,
    ]);
    add("sales", [
      `ワンピは写真に残りやすいので、着映えと細見えの両方で選びたいです👗`,
      `1枚で完成する服は、忙しい日や旅行前に候補へ入れておくとかなり頼れます💖`,
      `レビューで丈感や生地感まで見ておくと、届いた時の失敗を減らせそうです🔍`,
    ]);
    add("clicks", [
      `身長別の丈感や透け感が気になるので、着用写真をしっかり見たいです🔍`,
      `カラーで雰囲気が変わるので、商品ページで色違いまで比べたいです💖`,
    ]);
    add("coords", ["ヒール合わせで上品なお出かけに", "カーデやジャケットを羽織ってきれいめに", "サンダル合わせで休日コーデに"]);
    add("points", ["1枚でコーデ完成", "写真映えしやすい", "小物で着回せる", "丈感を確認したい"]);
  }

  if (category.includes("トップス")) {
    add("leads", [
      `いつものボトムに合わせるだけで、${featureA}がコーデをぐっと新鮮に見せてくれます✨`,
      `顔まわりに華やかさが出るので、シンプルなパンツやスカートも手抜きに見えにくいです💖`,
      `${featureA}で着映えしつつ、${featureB}ならデイリーにも取り入れやすいです🎀`,
      `1枚で印象が変わるトップスは、忙しい日のコーデ作りにかなり頼れます✨`,
      `甘さを足しすぎず大人可愛くまとまるので、普段服にも合わせやすいです💖`,
    ]);
    add("details", [
      `デニムでカジュアルに、きれいめパンツで通勤風にも振れるのが使いやすいです✨`,
      `袖や襟元のデザインで印象が変わるので、着用写真を見て選びたいです🔍`,
      `インしてもアウトでもバランスが取りやすいと、朝のコーデ決めがラクになります💖`,
      `アクセなしでも寂しく見えにくいトップスなら、時短で洒落見えを狙えます🎀`,
      `薄手アウターの中に入れても映えるので、季節の変わり目にも活躍しそうです✨`,
    ]);
    add("sales", [
      `トップスは印象を変えやすいので、買い足しでコーデの鮮度を上げたい人にぴったりです✨`,
      `手持ちボトムに合わせるだけで雰囲気が変わるので、着回し重視でも選びやすいです💖`,
      `顔まわりが映えるトップスは、写真やオンラインでも頼れます🎀`,
    ]);
    add("clicks", [
      `袖丈や首元の開きで印象が変わるので、商品ページで着用写真を見たいです🔍`,
      `透け感や生地の厚みはレビューで確認しておくと安心です◎`,
    ]);
    add("coords", ["デニム合わせで大人カジュアルに", "きれいめパンツで通勤にも", "スカート合わせでフェミニンに"]);
    add("points", ["顔まわりが華やぐ", "手持ちボトムに合わせやすい", "1枚で着映える", "袖まわりを確認したい"]);
  }

  if (category.includes("パンツ")) {
    add("leads", [
      `${featureA}で脚のラインをすっきり見せやすく、ラクさときちんと感を両立しやすいです✨`,
      `動きやすいのにだらしなく見えにくく、通勤にも休日にも使えるバランスが魅力です💖`,
      `${featureB}が効いていて、パンツ派さんの細見えコーデに頼れます🎀`,
      `腰まわりを自然にカバーしつつ、全体をきれいめに整えてくれます✨`,
      `トップスを変えるだけで雰囲気が変わるので、着回し力も期待できます💖`,
    ]);
    add("details", [
      `ブラウス合わせで上品に、Tシャツ合わせで抜け感を出してもまとまりやすいです✨`,
      `ウエストやヒップまわりのサイズ感はレビューで確認して選びたいです🔍`,
      `座る時間が長い日にも使うなら、伸び感や生地の厚みまで見ておくと安心です💖`,
      `センタープレスや落ち感のある素材なら、脚長見えも狙いやすいです🎀`,
      `オンオフ兼用しやすいパンツは、クローゼットにあると出番が増えそうです✨`,
    ]);
    add("sales", [
      `パンツはサイズ感が大事なので、レビューで丈やウエスト感まで見たいです🔍`,
      `美脚見えとラクさが両方あるパンツは、デイリー用にかなり頼れます💖`,
      `仕事にも休日にも使えるなら、コスパ重視でも候補に入れやすいです✨`,
    ]);
    add("clicks", [
      `丈感やウエストの伸び感が気になるので、身長別レビューを見たいです🔍`,
      `生地の落ち感で細見え度が変わるので、着用写真を確認したいです◎`,
    ]);
    add("coords", ["ブラウス合わせでオフィスにも", "Tシャツ合わせで大人カジュアルに", "ヒールで美脚見えコーデに"]);
    add("points", ["脚をすっきり見せやすい", "オンオフ使いやすい", "ウエスト感を確認したい", "美脚見えを狙える"]);
  }

  if (category.includes("スカート")) {
    add("leads", [
      `${featureA}で女性らしさを足しながら、甘すぎず大人っぽくまとまるのが魅力です✨`,
      `揺れ感やラインがきれいで、シンプルなトップスでも着映えしやすいです💖`,
      `${featureB}が効いていて、腰まわりを自然にカバーしながら華やかに見せてくれます🎀`,
      `デートにも休日にも使いやすく、大人フェミニンな気分の日にぴったりです✨`,
      `派手すぎない華やかさがあるので、普段服にも取り入れやすいです💖`,
    ]);
    add("details", [
      `コンパクトトップスで上品に、ゆるニットで抜け感を出しても可愛いです✨`,
      `広がり方や丈感で印象が変わるので、着用写真を見て選びたいです🔍`,
      `ウエストまわりがすっきり見えるタイプなら、スタイルアップも狙えます💖`,
      `歩くたびに動きが出るデザインは、写真でも華やかに見えやすいです🎀`,
      `甘めトップスにもシンプルトップスにも合わせやすいと、着回しの幅が広がります✨`,
    ]);
    add("sales", [
      `スカートはシルエットで印象が変わるので、腰まわりや丈感のレビューを見たいです🔍`,
      `1枚で女性らしさが出るので、マンネリしがちなコーデの更新にぴったりです💖`,
      `きれいめにもカジュアルにも振れるスカートは、色違いまでチェックしたくなります✨`,
    ]);
    add("clicks", [
      `広がり方や裏地の有無が気になるので、商品ページで確認したいです🔍`,
      `身長別の丈感で印象が変わるので、レビュー写真を見たいです◎`,
    ]);
    add("coords", ["コンパクトトップスでバランスよく", "ゆるニット合わせで抜け感を", "ヒール合わせでデートにも"]);
    add("points", ["腰まわりをカバーしやすい", "揺れ感が華やか", "丈感を確認したい", "大人フェミニンに"]);
  }

  if (category.includes("カーデ")) {
    add("leads", [
      `さっと羽織るだけで、いつものコーデに抜け感ときれいめ感を足してくれます✨`,
      `${featureA}で軽やかに見えて、冷房対策や日よけにも使いやすいのが魅力です💖`,
      `ワンピにもパンツにも合わせやすく、季節の変わり目に頼れる羽織りです🎀`,
      `生活感が出にくいデザインなら、羽織るだけでお出かけ感を作れます✨`,
      `肩掛けしても可愛く、シンプルコーデの仕上げにも使いやすいです💖`,
    ]);
    add("details", [
      `薄手ならバッグにも入れやすく、朝晩の温度差がある日にも便利です✨`,
      `丈感でバランスが変わるので、ワンピやパンツとの着用写真を見たいです🔍`,
      `ノースリーブやキャミワンピに重ねると、露出を抑えつつ大人っぽくまとまります💖`,
      `カラー次第で印象が変わるので、手持ち服に合う色を選びやすいです🎀`,
      `冷房対策だけで終わらない、ちゃんと可愛い羽織りは出番が増えそうです✨`,
    ]);
    add("sales", [
      `羽織りは毎年使いやすいので、生地感や丈感までレビューで見たいです🔍`,
      `冷房対策もおしゃれ見えも欲しい人には、早めに候補へ入れておきたいです💖`,
      `ワンピにもパンツにも合うカーデは、季節の変わり目にかなり頼れます✨`,
    ]);
    add("clicks", [
      `袖丈や着丈で印象が変わるので、着用写真を見て選びたいです🔍`,
      `薄さや透け感はレビューで確認しておくと使う場面が想像しやすいです◎`,
    ]);
    add("coords", ["ノースリーブに羽織って冷房対策に", "ワンピ合わせで上品に", "肩掛けでこなれ感を"]);
    add("points", ["冷房対策に便利", "羽織るだけで垢抜け", "丈感を確認したい", "ワンピにも合わせやすい"]);
  }

  addExpandedFashionCopy(copy, category, featureA, featureB);
  if (isFocusedCategory(category)) {
    addPeripheralFashionCopy(copy, category, featureA, featureB);
    addSpecializedCategoryCopy(copy, category, featureA, featureB);
    return copy;
  }

  addCombinatorialFashionCopy(copy, category, featureA, featureB);
  addPeripheralFashionCopy(copy, category, featureA, featureB);
  addBenefitDrivenFashionCopy(copy, category, featureA, featureB);
  return copy;
}

function addBenefitDrivenFashionCopy(copy, category, featureA, featureB) {
  const add = (key, entries) => copy[key].push(...entries.filter(Boolean));
  const make = (subjects, benefits, finishes, limit = 80) => {
    const out = [];
    for (const subject of subjects) {
      for (const benefit of benefits) {
        const finish = finishes[(out.length + subject.length + benefit.length) % finishes.length];
        out.push(`${subject}${benefit}${finish}`);
        if (out.length >= limit) return out;
      }
    }
    return out;
  };

  const confidenceLines = [
    `鏡を見るたびに「今日いい感じ」と思える服は、結局よく着ます💖`,
    `褒められたい日にも、自分の気分を上げたい日にも選びやすいです✨`,
    `写真に残る日でも安心して選べる可愛さがあります🎀`,
    `手持ち服に合わせても埋もれにくく、コーデの主役になります👗`,
    `迷った朝に頼れるアイテムがあると、支度がぐっとラクになります✨`,
    `派手すぎないのにちゃんと印象が変わるので、普段使いしやすいです💖`,
    `「なんか今日きれい」と思わせてくれるバランスが魅力です🎀`,
    `買ったあとに着回すイメージまでしやすいところが強いです🔍`,
  ];
  const shoppingChecks = [
    `レビューでは実物の色味と生地感をしっかり見ておきたいです🔍`,
    `サイズ感で印象が変わるので、着用写真まで確認したいです◎`,
    `人気カラーは動きやすいので、気になる色は早めに候補へ入れたいです💖`,
    `手持ち服との合わせやすさまで考えると、失敗しにくいです✨`,
    `安っぽく見えないか、レビュー写真で質感を確認したいです🔍`,
    `季節をまたいで使えるかも見ておくと、出番が増えます🎀`,
  ];

  if (category.includes("ワンピ")) {
    add("leads", make(
      [
        `${featureA}が主役になって、`,
        `${featureB}で抜け感を作りながら、`,
        `1枚で完成するのに、`,
        `さらっと着るだけで、`,
        `甘さを抑えながら、`,
        `小物を足すだけで、`,
        `体型をきれいに見せながら、`,
        `写真に残る日でも、`,
      ],
      [
        `褒められる大人ワンピに仕上がります`,
        `鏡を見るのが楽しくなる雰囲気を作れます`,
        `手抜きに見えない着映えを叶えます`,
        `デートにも休日にも使える華やかさが出ます`,
        `上品さと可愛さを両立できます`,
        `忙しい朝のコーデ悩みを減らします`,
        `シルエットがぼやけにくくなります`,
        `大人の抜け感コーデが完成します`,
      ],
      [`👗✨`, `💖`, `🎀`, `✨`, `💫`],
      100
    ));
    add("details", [
      ...confidenceLines,
      ...shoppingChecks,
      `ウエスト位置や丈感が合うと、スタイルアップ感がぐっと高まります✨`,
      `羽織りを足せば季節の変わり目にも使えて、ワンシーズンで終わりません💖`,
      `アクセを控えめにしても映えるので、時短できれいにまとまります🎀`,
      `旅行にも持っていきやすいワンピは、荷物を減らしたい日にも頼れます👗`,
      `淡色小物で可愛く、黒小物で大人っぽく寄せられます✨`,
      `1枚で雰囲気が出るので、予定がある日の服選びがラクになります💖`,
    ]);
    add("sales", [
      `ワンピは第一印象を作るので、褒められ感まで狙えるものを選びたいです👗`,
      `1枚で完成する服は、忙しい朝にも旅行にも強い味方になります✨`,
      `写真に残る予定があるなら、シルエットと丈感をしっかり見たいです🔍`,
      `可愛いだけでなく着回せるワンピは、買ってからの満足度が高いです💖`,
      `体型をきれいに見せるデザインなら、自信を持って出かけられます🎀`,
    ]);
  }

  if (category.includes("トップス")) {
    add("leads", make(
      [
        `${featureA}が顔まわりを明るく見せて、`,
        `${featureB}で、`,
        `いつものボトムに合わせるだけで、`,
        `1枚で着ても、`,
        `ジャケットの中に入れても、`,
        `甘さを出しすぎず、`,
        `二の腕が華奢に見える雰囲気で、`,
        `シンプルコーデの日でも、`,
      ],
      [
        `褒められる着映えトップスになります`,
        `手持ち服を一気に新鮮に見せます`,
        `写真でも寂しく見えない華やかさを足せます`,
        `大人可愛い印象を自然に作れます`,
        `通勤にも休日にも使える万能感が出ます`,
        `朝のコーデ悩みを減らします`,
        `鏡を見るのが楽しくなる一枚になります`,
        `プチプラでも高見えする雰囲気を叶えます`,
      ],
      [`✨`, `💖`, `🎀`, `💫`, `👗`],
      100
    ));
    add("details", [
      ...confidenceLines,
      ...shoppingChecks,
      `袖のデザインがきれいだと、腕まわりまで華奢に見せます✨`,
      `ボトムインしてもアウトでも決まる丈なら、着回し力が上がります💖`,
      `顔まわりに華やかさが出ると、オンラインや写真でも映えます🎀`,
      `デニム合わせでもきれいめに見えるトップスは、休日にも頼れます✨`,
      `通勤パンツに合わせれば、きちんと感のある大人コーデになります💖`,
      `洗える素材なら、気にせずデイリーに着られます◎`,
    ]);
    add("sales", [
      `トップスは顔まわりの印象を変えるので、着映え重視で選びたいです✨`,
      `手持ちボトムを活かせる一枚は、コスパよく垢抜けできます💖`,
      `二の腕が華奢に見えるデザインは、薄着の季節にかなり頼れます🎀`,
      `写真に残る日にも、普段の買い足しにも使えるトップスは強いです🔍`,
      `甘すぎない大人トップスは、30代コーデに取り入れやすいです✨`,
    ]);
  }

  if (category.includes("パンツ")) {
    add("leads", make(
      [
        `${featureA}で、`,
        `${featureB}が効いて、`,
        `脚のラインをきれいに見せながら、`,
        `ラクにはけるのに、`,
        `腰まわりをすっきり見せて、`,
        `ブラウスを合わせるだけで、`,
        `シンプルトップスでも、`,
        `通勤にも休日にも、`,
      ],
      [
        `美脚見えを叶えます`,
        `きちんと感のある大人パンツになります`,
        `細見えコーデが完成します`,
        `オンオフ使える万能パンツになります`,
        `鏡を見るのが楽しくなるシルエットを作れます`,
        `脚長バランスを狙えます`,
        `カジュアルすぎない抜け感が出ます`,
        `毎日頼れるきれいめコーデになります`,
      ],
      [`✨`, `💖`, `🎀`, `👗`, `💫`],
      100
    ));
    add("details", [
      ...confidenceLines,
      ...shoppingChecks,
      `センタープレスがあると、シンプルトップスでもきちんと感が出ます✨`,
      `ストレッチ入りなら、座る時間が長い日も快適に過ごせます💖`,
      `丈感が合うと脚長見えするので、身長別レビューは要チェックです🔍`,
      `ワイドなら余裕感を、テーパードならすっきり感を作れます🎀`,
      `通勤にも休日にも使えるパンツは、クローゼットの稼働率が上がります✨`,
      `ヒールでもスニーカーでも合わせやすい形は、出番が増えます💖`,
    ]);
    add("sales", [
      `美脚見えするパンツは、毎日のコーデを底上げします✨`,
      `ラクさときちんと感を両立できるパンツは、30代コーデに欠かせません💖`,
      `腰まわりがすっきり見えると、トップス選びまでラクになります🎀`,
      `通勤にも休日にも使える一本は、買ってからの出番が多いです🔍`,
      `丈感とウエスト感だけは、レビューでしっかり確認したいです◎`,
    ]);
  }

  if (category.includes("スカート")) {
    add("leads", make(
      [
        `${featureA}が揺れて、`,
        `${featureB}で、`,
        `腰まわりをすっきり見せながら、`,
        `シンプルトップスに合わせるだけで、`,
        `甘すぎない雰囲気で、`,
        `歩くたびに、`,
        `ロング丈でも、`,
        `デートにも休日にも、`,
      ],
      [
        `褒められる大人フェミニンが完成します`,
        `写真映えする華やかさを作れます`,
        `女性らしい印象を自然に足せます`,
        `マンネリコーデを更新できます`,
        `鏡を見るのが楽しくなる揺れ感が出ます`,
        `大人可愛いコーデになります`,
        `上品な抜け感を叶えます`,
        `手持ちトップスが新鮮に見えます`,
      ],
      [`✨`, `💖`, `🎀`, `💫`, `👗`],
      100
    ));
    add("details", [
      ...confidenceLines,
      ...shoppingChecks,
      `コンパクトトップスを合わせると、全体のバランスがきれいに整います✨`,
      `ゆるニット合わせなら、抜け感のある大人フェミニンになります💖`,
      `広がり方や裏地の有無で印象が変わるので、商品ページで見たいです🔍`,
      `スニーカーで外しても可愛く、休日にも使えます🎀`,
      `ヒールや小さめバッグで、食事や女子会にも寄せられます✨`,
      `柄や素材に表情があると、無地トップスだけでも決まります💖`,
    ]);
    add("sales", [
      `スカートは揺れ感で印象が変わるので、着用写真を見て選びたいです✨`,
      `腰まわりがすっきり見えるスカートは、トップスインも楽しめます💖`,
      `甘すぎない大人フェミニンは、30代コーデに取り入れやすいです🎀`,
      `手持ちトップスを新鮮に見せたい時にも、華やかスカートは便利です🔍`,
      `裏地や透け感まで確認しておくと、届いてから安心です◎`,
    ]);
  }

  if (category.includes("カーデ") || category.includes("アウター")) {
    add("leads", make(
      [
        `${featureA}で、`,
        `${featureB}なら、`,
        `羽織るだけで、`,
        `冷房対策しながら、`,
        `ワンピに重ねるだけで、`,
        `肩掛けするだけで、`,
        `季節の変わり目でも、`,
        `シンプル服に足すだけで、`,
      ],
      [
        `こなれ感を作れます`,
        `きれいめな印象に整います`,
        `手持ち服が新鮮に見えます`,
        `生活感のない羽織りコーデになります`,
        `大人っぽい抜け感が出ます`,
        `温度調整もおしゃれ見えも叶えます`,
        `褒められる重ね着が完成します`,
        `鏡を見るのが楽しくなる雰囲気になります`,
      ],
      [`✨`, `💖`, `🎀`, `🌿`, `💫`],
      100
    ));
    add("details", [
      ...confidenceLines,
      ...shoppingChecks,
      `ノースリーブに重ねると、肌見せを抑えながら上品にまとまります✨`,
      `キャミワンピに羽織れば、季節の変わり目にも使えます💖`,
      `丈感が合うと、全体のバランスがぐっときれいに見えます🔍`,
      `薄手ならバッグに入れやすく、冷房対策にも便利です🌿`,
      `ジレやベスト系なら、シンプルコーデが一気に今っぽくなります🎀`,
      `ジャケット系なら、通勤にも休日にもきちんと感を足せます✨`,
    ]);
    add("sales", [
      `羽織りは使う期間が長いので、着回しやすいものを選びたいです✨`,
      `冷房対策だけでなく、おしゃれ見えまで叶う羽織りは強いです💖`,
      `手持ち服を新鮮に見せるなら、重ねるアイテムを変えるのが近道です🎀`,
      `丈感と生地感はレビューで確認して、バランスよく選びたいです🔍`,
      `季節の変わり目に頼れる一枚は、毎年出番が増えます🌿`,
    ]);
  }

  if (category.includes("バッグ")) {
    add("leads", make(
      [`${featureA}で、`, `${featureB}なら、`, `持つだけで、`, `シンプル服に合わせるだけで、`, `毎日使うバッグでも、`, `小さめでも、`, `通勤にも休日にも、`, `コーデの仕上げに、`],
      [`プチプラでも高見えする印象を作れます`, `荷物をすっきり持てます`, `コーデ全体がきれいめに整います`, `鏡を見るのが楽しくなる小物使いが叶います`, `実用感と可愛さを両立できます`, `大人っぽい抜け感を足せます`, `手持ち服が新鮮に見えます`, `毎日持ちたくなるバランスになります`],
      [`👜✨`, `💖`, `🎀`, `✨`, `💫`],
      80
    ));
    add("details", [
      ...shoppingChecks,
      `財布やスマホ、ポーチが入るかは収納写真で確認したいです🔍`,
      `軽いバッグなら長時間のお出かけにも使いやすいです✨`,
      `ショルダー付きなら両手が空いて、旅行や子ども連れにも便利です💖`,
      `きれいめワンピにもデニムにも合わせやすい形は出番が増えます🎀`,
      `素材感でプチプラでも高見え度が変わるので、レビュー写真が大事です◎`,
      `小物で色を足すと、ベーシック服も一気に垢抜けます✨`,
    ]);
    add("sales", [
      `バッグは毎日使うものだから、収納力とプチプラでも高見え感を両方見たいです👜`,
      `持つだけでコーデが整うバッグは、シンプル服が多い人に頼れます✨`,
      `人気カラーは動きやすいので、在庫があるうちに見ておきたいです💖`,
      `実用感のある可愛いバッグは、通勤にも休日にも使いやすいです🎀`,
    ]);
  }

  if (category.includes("シューズ")) {
    add("leads", make(
      [`${featureA}で、`, `${featureB}なら、`, `足元を変えるだけで、`, `歩きやすさを見ながら、`, `きれいめ服にも、`, `休日コーデにも、`, `パンツにもスカートにも、`, `毎日履く靴でも、`],
      [`全身がすっきり整います`, `垢抜けた印象を作れます`, `褒められる足元になります`, `きれいめ感を足せます`, `疲れにくさと可愛さを両方狙えます`, `脚長見えを叶えます`, `大人っぽい抜け感が出ます`, `コーデの完成度が上がります`],
      [`👠✨`, `💖`, `🎀`, `✨`, `💫`],
      80
    ));
    add("details", [
      ...shoppingChecks,
      `靴はサイズ感が大事なので、普段サイズとの比較レビューを見たいです🔍`,
      `クッション性や幅のゆとりがあると、長時間のお出かけにも頼れます✨`,
      `ヒールの高さや重さは、商品ページで確認しておきたいです◎`,
      `パンツにもスカートにも合う靴は、買ったあと出番が増えます💖`,
      `足元が整うと、プチプラ服でも高見えしやすくなります🎀`,
      `ローファーやパンプス系は、通勤コーデをきれいめにまとめます✨`,
    ]);
    add("sales", [
      `靴は可愛くても痛いと履かなくなるので、レビュー確認が大事です🔍`,
      `足元から垢抜ける靴は、いつもの服を新鮮に見せます✨`,
      `歩きやすくてきれいめに見える靴は、毎日頼れます💖`,
      `人気サイズは売り切れやすいので、気になるサイズは早めに見たいです🎀`,
    ]);
  }

  if (category.includes("アクセサリー")) {
    add("leads", make(
      [`${featureA}で、`, `${featureB}なら、`, `顔まわりに足すだけで、`, `シンプル服の日でも、`, `小ぶりでも、`, `毎日使うアクセでも、`, `写真に残る日にも、`, `プレゼント候補にも、`],
      [`ぱっと華やかに見えます`, `プチプラでも高見えします`, `鏡を見るのが楽しくなります`, `褒められるきらめきを足せます`, `大人っぽいツヤ感が出ます`, `コーデの完成度が上がります`, `顔まわりが明るく整います`, `上品な印象を作れます`],
      [`💍✨`, `💖`, `🎀`, `✨`, `💫`],
      80
    ));
    add("details", [
      ...shoppingChecks,
      `Tシャツやニットに足すだけで、手抜き感を抑えます✨`,
      `ワンピやブラウスに合わせると、食事や女子会にも使いやすいです💖`,
      `素材表記や金属アレルギー対応は商品ページで確認したいです🔍`,
      `小ぶりなら毎日、大ぶりならコーデの主役として使えます🎀`,
      `実物のツヤ感や色味はレビュー写真がかなり参考になります◎`,
      `シンプル服が多い人ほど、アクセで雰囲気を変えやすいです✨`,
    ]);
    add("sales", [
      `アクセは小さいのに印象を変えるので、マンネリ対策に強いです✨`,
      `顔まわりが明るく見える小物は、写真にも映えます💖`,
      `素材感まで確認できると、毎日使いしやすいです🔍`,
      `プチプラでも高見えアクセは、ギフトにも自分用にも見やすいです🎀`,
    ]);
  }

  if (category.includes("水際") || category.includes("フォーマル") || category.includes("ルームウェア") || category.includes("浴衣") || category.includes("マタニティ") || category.includes("インナー") || category.includes("帽子") || category.includes("財布") || category.includes("ファッション小物")) {
    add("leads", make(
      [`${featureA}で、`, `${featureB}なら、`, `毎日使うものでも、`, `写真に残る日にも、`, `予定がある日でも、`, `実用感を見ながら、`, `可愛さを残しつつ、`, `手持ち服に足すだけで、`],
      [`気分が上がる印象を作れます`, `使いやすさと可愛さを両立できます`, `大人っぽくまとまります`, `プチプラでも高見えを狙えます`, `鏡を見るのが楽しくなります`, `失敗しにくい選び方ができます`, `レビューで確認しながら選びやすいです`, `普段のコーデを更新できます`],
      [`✨`, `💖`, `🎀`, `💫`, `◎`],
      80
    ));
    add("details", [
      ...shoppingChecks,
      `使うシーンがはっきりしているアイテムほど、レビューの実用感が参考になります🔍`,
      `見た目だけでなく、素材やサイズ感まで確認すると選びやすいです◎`,
      `カラーで雰囲気が変わるので、手持ち服や小物と合わせて考えたいです💖`,
      `毎日使うものは、可愛さと扱いやすさの両方が大事です✨`,
      `写真に残る予定があるなら、安っぽく見えないかも見ておきたいです🎀`,
    ]);
    add("sales", [
      `使う場面が想像しやすいアイテムは、買ったあとも活躍します✨`,
      `レビューでサイズや素材を見ておくと、満足度が上がります🔍`,
      `可愛さと実用感が両方あるものは、デイリーに選びやすいです💖`,
      `季節ものは動きが早いので、気になる時にチェックしておきたいです🎀`,
    ]);
  }
}

function addPeripheralFashionCopy(copy, category, featureA, featureB) {
  const add = (key, entries) => copy[key].push(...entries.filter(Boolean));
  const combine = (starts, middles, ends, limit = 50) => {
    const out = [];
    for (const start of starts) {
      for (const middle of middles) {
        const end = ends[(out.length + start.length + middle.length) % ends.length];
        out.push(`${start}${middle}${end}`);
        if (out.length >= limit) return out;
      }
    }
    return out;
  };

  if (category.includes("水際")) {
    add("leads", combine(
      [`${featureA}で、`, `${featureB}なら、`, `水際コーデでも、`, `写真に残る夏のお出かけでも、`, `露出を抑えながら、`, `リゾート感を出しつつ、`],
      [`体型カバーしやすい`, `大人可愛い雰囲気が作れる`, `スポーティーすぎず着やすい`, `水着の上に重ねやすい`, `日差し対策も狙える`, `旅先でも浮きにくい`],
      [`アイテムです🌴✨`, `のが魅力です💖`, `のがうれしいです🎀`, `バランスが頼れます✨`],
      45
    ));
    add("details", [
      `プールや海だけでなく、旅行先の羽織りとしても使いやすいです🌴`,
      `水着の上に重ねるだけで、写真に残る日も安心感が出ます💖`,
      `ラッシュガード系は着丈や袖丈で印象が変わるので、着用写真を確認したいです🔍`,
      `体型カバーしながら可愛く見えるデザインなら、大人女子にも取り入れやすいです✨`,
      `日差しや冷房対策にも使えるタイプなら、旅行バッグに入れておくと便利です🎀`,
      `濡れたあとや乾きやすさのレビューも見ておくと、当日使いやすいか分かりやすいです◎`,
    ]);
    add("sales", [
      `水際アイテムはシーズン前に動きやすいので、気になる色は早めに見たいです✨`,
      `旅行やプール予定がある人は、サイズと在庫があるうちに候補へ入れたいです💖`,
      `写真に残る夏イベント用なら、体型カバーと可愛さを両方見たいです🔍`,
    ]);
    add("clicks", [`着丈や袖丈、防透け感は商品ページで確認したいです🔍`, `水着との重ね方が分かる着用写真を見たいです◎`]);
    add("coords", ["水着の上に重ねて体型カバーに", "プールや海の写真映えに", "旅行先の羽織りとして", "ショートパンツ合わせで軽やかに"]);
    add("points", ["水際で体型カバー", "写真映えしやすい", "日差し対策にも", "旅行にも便利", "着丈を確認したい"]);
  }

  if (category.includes("フォーマル")) {
    add("leads", combine(
      [`${featureA}で、`, `${featureB}なら、`, `卒入園や学校行事でも、`, `きちんと見せたい日にも、`, `写真に残る日でも、`, `行事服に迷う日でも、`],
      [`上品にまとまりやすい`, `堅すぎず大人っぽく見える`, `高見え感を出しやすい`, `普段にも着回しやすい`, `きれいめな印象が作れる`, `安心して選びやすい`],
      [`フォーマルアイテムです✨`, `のが魅力です💖`, `のがうれしいです🎀`, `バランスが頼れます◎`],
      45
    ));
    add("details", [
      `ジャケットやパール小物を合わせると、卒入園にも使いやすいです✨`,
      `行事後も単品で使えるデザインなら、もったいなさを感じにくいです💖`,
      `丈感や生地の厚みで印象が変わるので、レビュー写真を見たいです🔍`,
      `きちんと感がありつつ堅すぎないと、学校行事や食事会にも使いやすいです🎀`,
      `黒小物で締めると上品に、淡色小物ならやわらかい雰囲気になります✨`,
      `座った時の丈感やシワ感も、行事服では確認しておきたいポイントです◎`,
    ]);
    add("sales", [
      `フォーマル服は必要な時期が集中するので、サイズがあるうちに見たいです🔍`,
      `行事にも普段にも使えるデザインなら、かなり選びやすいです💖`,
      `写真に残る日用なら、安っぽく見えにくい生地感まで確認したいです✨`,
    ]);
    add("clicks", [`丈感や生地の厚みをレビューで確認したいです🔍`, `手持ちジャケットに合うか、カラーも見比べたいです◎`]);
    add("coords", ["パール小物で学校行事に", "ジャケット合わせで卒入園に", "パンプスできちんと感を", "単品使いで食事会にも"]);
    add("points", ["行事にも使いやすい", "上品に高見え", "普段使いも狙える", "丈感を確認したい", "写真に残る日にも"]);
  }

  if (category.includes("ルームウェア")) {
    add("leads", combine(
      [`${featureA}で、`, `${featureB}なら、`, `おうち時間でも、`, `リラックスしたい日にも、`, `急な宅配や近所にも、`, `旅行や帰省先でも、`],
      [`だらしなく見えにくい`, `可愛く過ごしやすい`, `締め付け感を抑えやすい`, `生活感が出すぎにくい`, `着心地よく使いやすい`, `気分が上がる`],
      [`ルームウェアです✨`, `のが魅力です💖`, `のがうれしいです🎀`, `バランスです◎`],
      45
    ));
    add("details", [
      `ワンマイルにも使えるデザインなら、部屋着感を抑えて着回せます✨`,
      `肌あたりや伸び感のレビューを見ておくと、毎日使いしやすいか分かりやすいです💖`,
      `旅行や帰省用にも持っていきやすく、可愛いリラックス服として活躍しそうです🎀`,
      `洗濯後の質感や毛玉のできにくさも、レビューで確認したいです🔍`,
      `上下セットならコーデを考えずに済んで、おうち時間の気分も上がります✨`,
      `薄すぎない生地なら、急な来客にも慌てにくいです◎`,
    ]);
    add("sales", [`毎日着るものほど、可愛さと着心地で選ぶと満足度が高そうです✨`, `おうち時間の気分を上げたい人は、候補に入れておきたいです💖`, `洗い替え用に色違いも見たくなるアイテムです🎀`]);
    add("clicks", [`生地の厚みや透け感が気になるので、レビューで確認したいです🔍`, `洗濯後の質感やサイズ感も見ておきたいです◎`]);
    add("coords", ["おうち時間を可愛く快適に", "旅行や帰省のリラックス服に", "ワンマイルにも", "ナイトケア時間にも"]);
    add("points", ["楽ちんな着心地", "生活感が出にくい", "洗い替えにも", "肌あたりを確認", "旅行にも便利"]);
  }

  if (category.includes("浴衣")) {
    add("leads", combine(
      [`${featureA}で、`, `${featureB}なら、`, `夏祭りや花火大会でも、`, `写真に残るイベントでも、`, `大人可愛く着たい日にも、`, `浴衣セットを選ぶ時でも、`],
      [`華やかに見えやすい`, `派手すぎず着やすい`, `上品な雰囲気が出る`, `小物合わせに迷いにくい`, `写真映えを狙いやすい`, `季節感がしっかり出る`],
      [`浴衣です✨`, `のが魅力です💖`, `のがうれしいです🎀`, `雰囲気です◎`],
      45
    ));
    add("details", [
      `帯や下駄までセットなら、届いてすぐ雰囲気を作りやすいです✨`,
      `柄の出方や色味で印象が変わるので、着用写真を見比べたいです🔍`,
      `大人っぽい柄なら、写真に残る日も安っぽく見えにくいです💖`,
      `かごバッグや淡色小物を合わせると、夏らしくまとまります🎀`,
      `作り帯やセット内容が分かると、着付けに慣れていない人も選びやすいです◎`,
      `花火大会や夏祭りだけでなく、旅先の写真にも映えそうです✨`,
    ]);
    add("sales", [`浴衣はシーズン前に動くので、気になる柄は早めにチェックしたいです✨`, `写真に残るイベント用なら、安っぽく見えないデザインを選びたいです💖`, `セット内容まで見ておくと、当日慌てにくいです🔍`]);
    add("clicks", [`柄の出方とセット内容を商品ページで確認したいです🔍`, `帯や下駄の色まで合うか見ておきたいです◎`]);
    add("coords", ["花火大会や夏祭りに", "かごバッグ合わせで夏らしく", "淡色小物で大人可愛く", "旅先の写真映えに"]);
    add("points", ["夏イベントに映える", "セット内容を確認", "柄の出方が大事", "写真映えしやすい", "大人可愛く着られる"]);
  }

  if (category.includes("マタニティ")) {
    add("leads", combine(
      [`${featureA}で、`, `${featureB}なら、`, `体型が変わる時期でも、`, `産前産後にも、`, `通院やお出かけにも、`, `締め付けを抑えながら、`],
      [`ラクに着やすい`, `可愛さを残しやすい`, `だらしなく見えにくい`, `長く使いやすい`, `きれいめにまとまりやすい`, `毎日の服選びがラクになる`],
      [`マタニティアイテムです✨`, `のが魅力です💖`, `のがうれしいです🎀`, `バランスです◎`],
      45
    ));
    add("details", [
      `通院やちょっとしたお出かけにも使いやすく、毎日の服選びがラクになります✨`,
      `授乳やウエストまわりの仕様は、商品ページで確認しておきたいです💖`,
      `体調に合わせて着やすいか、レビューで生地感や伸び感を見たいです🎀`,
      `産前産後で長く使えるデザインなら、コスパも感じやすいです◎`,
      `締め付けにくいのにきれいめに見えると、写真に残る日にも選びやすいです✨`,
      `洗える素材なら、毎日使いしやすくて助かります💖`,
    ]);
    add("sales", [`一時期だけで終わらず長く使えるデザインなら、かなり選びやすいです✨`, `マタニティ服でも可愛くいたい人には、候補に入れておきたいです💖`, `サイズ変化がある時期だからこそ、レビューの着用感が参考になります🔍`]);
    add("clicks", [`ウエストや授乳仕様は商品ページで確認したいです🔍`, `伸び感や締め付け感はレビューで見ておきたいです◎`]);
    add("coords", ["通院や産前産後のお出かけに", "フラットシューズ合わせで楽ちんに", "カーデを羽織ってきれいめに", "ワンマイルにも"]);
    add("points", ["締め付けにくい", "産前産後も使いやすい", "伸び感を確認", "通院にも便利", "きれいめに見える"]);
  }

  if (category.includes("インナー")) {
    add("leads", combine(
      [`${featureA}で、`, `${featureB}なら、`, `薄手トップスの日にも、`, `毎日使うインナーでも、`, `透けが気になる季節にも、`, `ラクに着たい日にも、`],
      [`響きにくく使いやすい`, `安心感が出やすい`, `きれい見えを狙える`, `デイリーに取り入れやすい`, `重ね着しやすい`, `着心地よく使える`],
      [`インナーです✨`, `のが魅力です💖`, `のがうれしいです🎀`, `バランスです◎`],
      45
    ));
    add("details", [
      `シャツやシアートップスの下にも使いやすく、透け対策にも頼れます✨`,
      `おうち時間からワンマイルまで使えるなら、コスパの良さも感じやすいです💖`,
      `毎日使うものだからこそ、レビューでホールド感や肌あたりを見ておきたいです🎀`,
      `肩ひもや胸元の見え方は、着用写真で確認しておくと安心です🔍`,
      `洗い替えしやすい価格やカラー展開なら、色違いも見たくなります✨`,
      `カップ付きなら、旅行や暑い日のインナーとしても使いやすいです◎`,
    ]);
    add("sales", [`毎日使うインナーこそ、ラクさときれい見えの両方で選ぶと満足度が高そうです✨`, `透け対策や重ね着用に、色違いで持っておくと便利です💖`, `肌に触れるものなので、素材感レビューまで見たいです🔍`]);
    add("clicks", [`透け感や肩ひもの見え方を商品ページで確認したいです🔍`, `カップのホールド感や肌あたりはレビューで見たいです◎`]);
    add("coords", ["シアートップスの透け対策に", "シャツのインナーに", "旅行の楽ちんインナーに", "ワンマイルにも"]);
    add("points", ["透け対策に便利", "毎日使いやすい", "肌あたりを確認", "洗い替えにも", "重ね着しやすい"]);
  }

  if (category.includes("帽子") || category.includes("財布") || category.includes("ファッション小物")) {
    add("leads", combine(
      [`${featureA}で、`, `${featureB}なら、`, `いつもの服に足すだけで、`, `小物で印象を変えたい日にも、`, `季節感を足したい時にも、`, `バッグの中や身につける小物まで、`],
      [`コーデがぐっと新鮮に見える`, `高見え感を足しやすい`, `大人っぽくまとまる`, `実用感も可愛さも狙える`, `気分が上がる`, `デイリーに使いやすい`],
      [`小物です✨`, `のが魅力です💖`, `のがうれしいです🎀`, `バランスです◎`],
      60
    ));
    add("details", [
      `服を買い足さなくても雰囲気を変えられるので、コスパよく垢抜けを狙えます✨`,
      `バッグや靴と色を合わせると、全体がまとまって見えます💖`,
      `サイズ感や素材感で高見え度が変わるので、レビュー写真も見たいです🔍`,
      `毎日使うものなら、見た目だけでなく使いやすさまで確認したいです◎`,
      `プレゼントや自分用の買い足しにも見やすいアイテムです🎀`,
      `旅行や通勤にも使うなら、軽さや収納力もチェックしておきたいです✨`,
    ]);
    add("sales", [`小物はコーデの印象を変えやすいので、マンネリ対策に便利です✨`, `毎日使える小物ほど、可愛さと実用感で選ぶと満足度が高そうです💖`, `素材感やサイズ感はレビュー写真まで見ておきたいです🔍`]);
    add("clicks", [`サイズ感や素材感をレビュー写真で確認したいです🔍`, `手持ち服やバッグに合う色か見比べたいです◎`]);
    add("coords", ["シンプルコーデの差し色に", "バッグや靴と色合わせして", "旅行や通勤にも", "プレゼント候補にも"]);
    add("points", ["小物で垢抜け", "毎日使いやすい", "素材感を確認", "高見えを狙える", "ギフトにも"]);
  }

  if (category.includes("スポーツウェア")) {
    add("leads", [
      `${featureA}で動きやすさを備えながら、街にもなじむスポーツコーデにまとまります✨`,
      `${featureB}なら体のラインを拾いすぎず、ヨガやジムにも取り入れやすそうです💖`,
      `汗をかく日も快適に過ごしやすく、着るたび気分が上がるデザインがうれしいです🎀`,
    ]);
    add("details", [
      `ストレッチ性や吸汗速乾性は、実際の着用レビューで確認しておきたいです🔍`,
      `パーカーやスニーカーを合わせれば、ワンマイルにも自然になじみます✨`,
      `レギンスは透け感や股上、トップスは着丈まで見ておくと安心です◎`,
    ]);
    add("sales", [`運動を続けるきっかけになるような、着るのが楽しみになるウェアです💖`, `ジムだけでなく普段にも使えると、自然と出番が増えそうです✨`]);
    add("clicks", [`サイズ感や透け感を着用レビューで確認したいです🔍`, `動きやすさやストレッチ感も商品ページで見ておきたいです◎`]);
    add("coords", ["ヨガやジムコーデに", "スニーカー合わせのワンマイルに", "公園や散歩の日にも"]);
    add("points", ["動きやすい", "吸汗速乾性を確認", "体のラインを拾いにくい", "普段にも使いやすい", "ストレッチ感"]);
  }

  if (category.includes("レッグウェア")) {
    add("leads", [
      `${featureA}で脚のラインをすっきり整えながら、毎日のコーデにもなじみます✨`,
      `${featureB}なら締め付け感が苦手な日にも試しやすそうです💖`,
      `足元の冷えや透け感が気になる季節に、さりげなく頼れる1足です🎀`,
    ]);
    add("details", [
      `着圧タイプは強さや丈感に好みが出るので、サイズ表とレビューを見て選びたいです🔍`,
      `パンプスやスニーカーに合わせやすい色なら、通勤から休日まで活躍しそうです✨`,
      `肌あたりやウエストの締め付け感まで確認しておくと、長時間の日も安心です◎`,
    ]);
    add("sales", [`毎日使うものだからこそ、すっきり見えと心地よさのバランスで選びたいです💖`, `洗い替え用に色違いもそろえたくなる使いやすさです✨`]);
    add("clicks", [`着圧の強さや丈感をレビューで確認したいです🔍`, `透け感や肌あたりも商品ページで見ておきたいです◎`]);
    add("coords", ["きれいめ通勤コーデに", "ワンピやスカートの足元に", "冷えが気になる日の重ね着に"]);
    add("points", ["脚をすっきり見せる", "締め付け感を確認", "冷え対策にも", "肌あたりを確認", "毎日使いやすい"]);
  }

  if (category.includes("レインウェア")) {
    add("leads", [
      `${featureA}で雨をしのぎながら、いつもの服にもすっきりなじみます✨`,
      `${featureB}なら急な雨の日も慌てず、おしゃれを楽しめそうです💖`,
      `雨具っぽく見えにくいデザインで、通勤にも取り入れやすいのがうれしいです🎀`,
    ]);
    add("details", [
      `撥水と防水では使い心地が違うため、仕様や耐水性を商品ページで確認したいです🔍`,
      `軽くたためるタイプなら、旅行や梅雨時の持ち歩きにも便利です✨`,
      `蒸れにくさやフードの見え方までレビューで見ておくと安心です◎`,
    ]);
    add("sales", [`雨の日も服選びを妥協せずにすむ、頼れるお出かけアイテムです💖`, `玄関やバッグに用意しておくと、急な天気の変化にも使えそうです✨`]);
    add("clicks", [`撥水・防水の仕様を商品ページで確認したいです🔍`, `重さや収納サイズはレビュー写真で見ておきたいです◎`]);
    add("coords", ["雨の日の通勤コーデに", "旅行や梅雨時の持ち歩きに", "きれいめ服の雨対策に"]);
    add("points", ["撥水性を確認", "雨の日もきれいめ", "持ち歩きやすい", "通勤にも便利", "蒸れにくさを確認"]);
  }

  if (category.includes("ブライダル")) {
    add("leads", [
      `${featureA}で上品さを保ちながら、写真にも華やかに映えます✨`,
      `${featureB}なら頑張りすぎて見えず、お呼ばれらしい特別感を楽しめそうです💖`,
      `結婚式や二次会で褒められたい日に、自信を持って選びやすい1着です🎀`,
    ]);
    add("details", [
      `座った時の丈感や透け感は、着用写真とレビューで確認しておきたいです🔍`,
      `小ぶりのバッグや華奢なアクセを合わせると、品よくまとまります✨`,
      `会場までの移動も考えて、シワになりにくさや羽織りとの相性も見たいです◎`,
    ]);
    add("sales", [`写真に残る日だからこそ、上品さと自分らしい華やかさの両方で選びたいです💖`, `結婚式だけでなく食事会にも着回せると、満足度が高そうです✨`]);
    add("clicks", [`丈感や透け感を着用写真で確認したいです🔍`, `会場の雰囲気に合う色や素材か見比べたいです◎`]);
    add("coords", ["結婚式や披露宴のお呼ばれに", "二次会や食事会に", "華奢アクセとミニバッグを合わせて"]);
    add("points", ["お呼ばれに上品", "写真映えを狙える", "丈感を確認", "食事会にも着回せる", "華やかに高見え"]);
  }

  if (category.includes("ヘアアクセサリー")) {
    add("leads", [
      `${featureA}でまとめ髪を簡単に整えながら、顔まわりまで華やぎます✨`,
      `${featureB}なら甘くなりすぎず、大人のヘアアレンジにもなじみそうです💖`,
      `忙しい朝でもさっと留めるだけで、手をかけたように見えるのがうれしいです🎀`,
    ]);
    add("details", [
      `毛量に合うサイズやホールド力は、レビューで確認しておきたいです🔍`,
      `シンプルな服の日にも、後ろ姿へさりげない華やかさを足せます✨`,
      `金具の見え方や重さまで確認すると、長時間つける日も選びやすいです◎`,
    ]);
    add("sales", [`髪型が決まらない日にも頼れて、鏡を見るのが少し楽しくなる小物です💖`, `服を買い足さなくても印象を変えられるので、気軽な垢抜けに使えそうです✨`]);
    add("clicks", [`毛量に合うサイズやホールド力を確認したいです🔍`, `重さや金具の見え方もレビュー写真で見たいです◎`]);
    add("coords", ["低めまとめ髪のアクセントに", "ハーフアップを大人可愛く", "通勤やお出かけの簡単アレンジに"]);
    add("points", ["顔まわりが華やぐ", "簡単まとめ髪", "ホールド力を確認", "大人可愛い", "後ろ姿まで垢抜け"]);
  }
}

function addSpecializedCategoryCopy(copy, category, featureA, featureB) {
  const add = (key, entries) => copy[key].push(...entries.filter(Boolean));
  const definitions = {
    セットアップ: {
      leads: [`${featureA}で上下に統一感が出て、忙しい朝もきれいめにまとまります✨`, `${featureB}ならセットでも単品でも使えて、着回しの幅が広がりそうです💖`, `合わせるだけでコーデが完成するのに、頑張りすぎて見えないバランスが魅力です🎀`],
      details: [`上下それぞれを手持ち服に合わせられると、着こなしの数がぐっと増えます✨`, `トップスとボトムのサイズ感は、身長別の着用写真で確認しておきたいです🔍`, `小物や靴を変えるだけで、通勤から休日まで雰囲気を調整しやすいです◎`],
      sales: [`コーデを考える時間を減らしながら、単品使いまで楽しめるのがうれしいです💖`, `セットで高見えしつつ別々にも着られると、出番が増えそうです✨`],
      clicks: [`上下それぞれの丈感やサイズ感を着用レビューで確認したいです🔍`, `単品コーデの写真まで見ると、手持ち服との相性を想像しやすいです◎`],
      coords: ["セットで通勤や食事会に", "トップスだけデニムに合わせて", "ボトムをブラウスと合わせて"],
      points: ["上下で高見え", "単品でも着回せる", "朝の時短コーデ", "サイズ感を確認", "オンオフ使いやすい"],
    },
    オールインワン: {
      leads: [`${featureA}の縦ラインで、1枚でも大人っぽいシルエットにまとまります✨`, `${featureB}なら体のラインを拾いすぎず、楽な着心地も期待できそうです💖`, `さらっと着るだけでコーデが決まり、忙しい日にも頼れる1着です🎀`],
      details: [`インナーを変えると季節をまたいで使いやすく、着回しの幅も広がります✨`, `股下やウエスト位置で印象が変わるので、身長別レビューを見ておきたいです🔍`, `着脱のしやすさやポケットの有無まで確認すると、普段使いしやすいです◎`],
      sales: [`楽なのに手抜きに見えにくく、1枚で雰囲気を作れるのがうれしいです💖`, `インナーや羽織りを替えながら長く使えると、満足度が高そうです✨`],
      clicks: [`股下やウエスト位置を着用写真で確認したいです🔍`, `着脱方法やポケットの仕様も商品ページで見ておきたいです◎`],
      coords: ["シアートップスを重ねて", "ジャケット合わせで通勤に", "サンダルで休日のお出かけに"],
      points: ["1枚でコーデ完成", "縦ラインですっきり", "インナーで着回せる", "丈感を確認", "楽なのにきれい見え"],
    },
    デニム: {
      leads: [`${featureA}で脚のラインをすっきり整えながら、大人カジュアルにまとまります✨`, `${featureB}なら窮屈感を抑えつつ、きれいなシルエットを楽しめそうです💖`, `定番デニムなのに穿くだけで今っぽく見え、いつものトップスも新鮮になります🎀`],
      details: [`股上やわたり幅、裾の落ち方で印象が変わるので、身長別レビューが参考になります🔍`, `ブラウスやジャケットを合わせると、カジュアルすぎず大人っぽく着回せます✨`, `色落ちや生地の硬さまで確認すると、届いた後のイメージ違いを減らせます◎`],
      sales: [`週に何度も穿くデニムだからこそ、楽さと脚の見え方の両方で選びたいです💖`, `手持ちトップスが今っぽく見える一本なら、自然と出番が増えそうです✨`],
      clicks: [`股上や丈感を身長別レビューで確認したいです🔍`, `生地の硬さや色落ち具合もレビュー写真で見ておきたいです◎`],
      coords: ["ブラウスで大人きれいめに", "ジャケット合わせで通勤寄りに", "スニーカーで休日コーデに"],
      points: ["脚をすっきり見せる", "大人カジュアルに", "股上と丈感を確認", "トップスを選びにくい", "毎日穿きやすい"],
    },
    ニット: {
      leads: [`${featureA}の表情で、顔まわりをやさしく明るく見せてくれます✨`, `${featureB}なら着膨れを抑えながら、女性らしいシルエットになじみそうです💖`, `シンプルでも素材感に表情があり、1枚で寂しく見えにくいニットです🎀`],
      details: [`首元や袖の形で印象が変わるので、着用写真を見ながら選びたいです🔍`, `スカートにもパンツにも合わせやすく、オンオフの着回しに便利です✨`, `チクチク感や毛玉のできやすさは、素材表示とレビューで確認しておくと安心です◎`],
      sales: [`肌触りがよく着回しやすいニットは、色違いまで欲しくなりそうです💖`, `定番だからこそ、着た時のシルエットがきれいな一枚を選びたいです✨`],
      clicks: [`肌触りや厚みはレビューでわかると安心です🔍`, `首元の抜け感と袖丈で華奢見えしやすいのが魅力です◎`],
      coords: ["きれいめパンツで通勤に", "フレアスカートで女性らしく", "デニムで大人カジュアルに"],
      points: ["顔まわりが明るい", "着膨れしにくい", "肌触りを確認", "オンオフ着回せる", "1枚で着映える"],
    },
    スーツ: {
      leads: [`${featureA}なら、今っぽいすっきりシルエットにまとまります✨`, `${featureB}なら長時間の日も動きやすく、仕事に取り入れやすそうです💖`, `堅くなりすぎないデザインで、信頼感と女性らしさを両立しやすい一着です🎀`],
      details: [`ジャケットの肩幅やパンツ丈は、身長別の着用写真で確認しておきたいです🔍`, `インナーや靴を変えると、面接から通勤まで雰囲気を調整できます✨`, `シワになりにくさや洗濯表示まで確認すると、忙しい日にも扱いやすいです◎`],
      sales: [`きちんと見せたい日に迷わず選べるスーツがあると、朝の支度も楽になります💖`, `単品でも着回せるデザインなら、仕事以外にも出番が増えそうです✨`],
      clicks: [`肩幅やパンツ丈をサイズ表とレビューで確認したいです🔍`, `洗濯方法やシワのなりにくさも商品ページで見ておきたいです◎`],
      coords: ["ブラウス合わせで通勤に", "華奢アクセで会食にも", "ジャケットだけデニムに合わせて"],
      points: ["きちんと高見え", "すっきりシルエット", "単品でも着回せる", "サイズ感を確認", "仕事に使いやすい"],
    },
    腕時計: {
      leads: [`${featureA}で、手元をさりげなく華やかに見せてくれます✨`, `${featureB}ならアクセ感覚で使えて、毎日の服にもなじみそうです💖`, `時間を確認する仕草まできれいに見える、大人の手元にちょうどいい腕時計です🎀`],
      details: [`文字盤の大きさやベルト幅で印象が変わるので、着用写真を見て選びたいです🔍`, `アクセやバッグの金具と色を合わせると、コーデ全体がまとまります✨`, `重さやベルト調整の方法、防水性能まで確認しておくと安心です◎`],
      sales: [`毎日目に入るものだから、実用性だけでなく気分が上がるデザインを選びたいです💖`, `通勤にも休日にもなじむ一本なら、長く愛用できそうです✨`],
      clicks: [`文字盤サイズや重さを商品ページで確認したいです🔍`, `ベルト調整や防水性能もレビューで見ておきたいです◎`],
      coords: ["通勤コーデの上品な手元に", "ブレスレットと重ね付けして", "休日のシンプル服のアクセントに"],
      points: ["手元が上品に見える", "アクセ感覚で使える", "文字盤サイズを確認", "オンオフ使いやすい", "ギフトにも選びやすい"],
    },
    ストール: {
      leads: [`${featureA}をさっと巻くだけで、顔まわりが明るく華やぎます✨`, `${featureB}なら持ち歩きやすく、冷房や朝晩の冷えにも頼れそうです💖`, `防寒だけでなくコーデの差し色にもなり、シンプル服が新鮮に見えます🎀`],
      details: [`肩に掛けたり首元へ巻いたり、気温や服に合わせて使い方を変えられます✨`, `肌触りや厚み、実物の色味はレビューで確認しておきたいです🔍`, `バッグに入るサイズなら、旅行や通勤の温度調整にも便利です◎`],
      sales: [`服を買い足さずに季節感と華やかさを足せるのがうれしいです💖`, `冷房対策から旅行まで使える一枚は、バッグに入れておくと頼れそうです✨`],
      clicks: [`肌触りや厚みをレビューで確認したいです🔍`, `巻いた時のボリュームや実物の色味を見ておきたいです◎`],
      coords: ["ワンピの肩掛けに", "通勤バッグへ入れて冷房対策に", "コートの差し色に"],
      points: ["顔まわりが華やぐ", "冷房対策にも", "持ち歩きやすい", "肌触りを確認", "コーデの差し色に"],
    },
    ベルト: {
      leads: [`${featureA}でウエスト位置が上がって見え、いつもの服をすっきり整えます✨`, `${featureB}なら主張しすぎず、ワンピやパンツにも自然になじみそうです💖`, `ひとつ足すだけでメリハリが生まれ、シンプルコーデも手をかけた印象になります🎀`],
      details: [`穴の位置や全長は、合わせたい服を考えながら確認しておきたいです🔍`, `ワンピのウエストマークにも、パンツの引き締めにも使えます✨`, `金具の色やベルト幅まで手持ち小物と合わせると、コーデがまとまりやすいです◎`],
      sales: [`服を買い足さなくてもシルエットを変えられるので、着回しの幅が広がります💖`, `ワンピやゆるトップスをすっきり見せたい日に頼れそうです✨`],
      clicks: [`全長や対応ウエストを商品ページで確認したいです🔍`, `金具の色味やベルト幅をレビュー写真で見ておきたいです◎`],
      coords: ["ワンピのウエストマークに", "ワイドパンツをすっきり見せて", "ジャケットの上からアクセントに"],
      points: ["ウエスト位置が高く見える", "服の印象を変えやすい", "サイズを確認", "ワンピにも使える", "金具まで高見え"],
    },
    サングラス: {
      leads: [`${featureA}で目元を自然に引き締めながら、顔まわりまで洒落た印象に整えます✨`, `${featureB}なら日差しの強い日にも頼れて、普段の服へ取り入れやすそうです💖`, `かけるだけでコーデに大人っぽい抜け感が出るサングラスです🎀`],
      details: [`フレーム幅やレンズの濃さで印象が変わるので、着用写真を見て選びたいです🔍`, `旅行や運転、屋外のお出かけまで使う場面を想像しやすいです✨`, `UVカット率や重さ、鼻あての仕様まで確認しておくと安心です◎`],
      sales: [`日差し対策をしながら、いつものコーデまで新鮮に見せられるのがうれしいです💖`, `顔になじむ一本なら、旅行だけでなく普段にも出番が増えそうです✨`],
      clicks: [`フレーム幅やレンズカラーを着用写真で確認したいです🔍`, `UVカット率や重さも商品ページで見ておきたいです◎`],
      coords: ["旅行やドライブコーデに", "シンプルTシャツのアクセントに", "きれいめワンピの外しに"],
      points: ["顔まわりが引き締まる", "紫外線対策に", "フレーム幅を確認", "普段にも使いやすい", "旅行にも便利"],
    },
    手袋: {
      leads: [`${featureA}で手元を暖かく包みながら、冬のコーデにも上品になじみます✨`, `${featureB}なら通勤やお出かけにも使いやすく、毎日手に取りやすそうです💖`, `防寒小物でも生活感が出にくく、手元まできれいに見えるのが魅力です🎀`],
      details: [`指の長さや手囲いでフィット感が変わるので、サイズ表を確認したいです🔍`, `スマホ対応なら、移動中や待ち時間にも外す手間を減らせます✨`, `裏地の肌触りや厚みまでレビューで見ておくと安心です◎`],
      sales: [`毎日使う防寒小物だから、暖かさと手元の見え方を両方選びたいです💖`, `通勤服にもなじむ手袋なら、寒い日の出番が増えそうです✨`],
      clicks: [`手囲いや指の長さをサイズ表で確認したいです🔍`, `スマホ操作や裏地の肌触りもレビューで見ておきたいです◎`],
      coords: ["冬の通勤コーデに", "コートと色を合わせて", "旅行や屋外のお出かけに"],
      points: ["手元を暖かく", "通勤にも上品", "サイズ感を確認", "スマホ対応を確認", "肌触りも大切"],
    },
    アームカバー: {
      leads: [`${featureA}をしながら、腕まわりをすっきり自然に見せてくれます✨`, `${featureB}なら暑い日も取り入れやすく、長時間のお出かけにも使えそうです💖`, `機能小物でもスポーティーになりすぎず、きれいめ服へ合わせやすいです🎀`],
      details: [`長さや二の腕側のフィット感は、着用写真とレビューで確認したいです🔍`, `日差しの強い日だけでなく、冷房が気になる室内にも使えます✨`, `接触冷感や吸汗速乾など、素材の機能を商品ページで見ておくと安心です◎`],
      sales: [`日焼けや冷房を気にしすぎず、夏のおしゃれを楽しめるのがうれしいです💖`, `バッグに入れておける軽さなら、毎日頼れそうです✨`],
      clicks: [`長さやずれにくさをレビューで確認したいです🔍`, `UVカット率や冷感素材の仕様も見ておきたいです◎`],
      coords: ["半袖の日の紫外線対策に", "通勤や自転車移動に", "室内の冷房対策に"],
      points: ["紫外線対策に", "腕を自然にカバー", "ずれにくさを確認", "冷房対策にも", "蒸れにくさを確認"],
    },
    傘: {
      leads: [`${featureA}で持ち歩きの負担を抑えながら、雨や日差しにしっかり備えられます✨`, `${featureB}なら天気が変わりやすい日にも頼れて、バッグへ入れておきやすそうです💖`, `毎日持つものだからこそ、機能だけでなく大人っぽい見た目もうれしい傘です🎀`],
      details: [`重さや収納時の長さは、毎日持ち歩くなら特に確認したいです🔍`, `晴雨兼用なら、急な雨と強い日差しの両方へ備えられます✨`, `遮光率や撥水性、骨の丈夫さまで商品ページで見ておくと安心です◎`],
      sales: [`軽くて頼れる一本がバッグにあると、天気予報が微妙な日も安心です💖`, `服になじむ色や形なら、日傘を使う習慣も続けやすそうです✨`],
      clicks: [`重量と収納時サイズを商品ページで確認したいです🔍`, `遮光率や撥水性、開閉方法もレビューで見ておきたいです◎`],
      coords: ["毎日の通勤バッグに", "旅行やテーマパークに", "きれいめ服になじむ日差し対策に"],
      points: ["持ち歩きやすい", "雨と日差しに対応", "重さを確認", "遮光率を確認", "大人服になじむ"],
    },
  };
  const key = Object.keys(definitions).find((label) => category.includes(label));
  if (!key) return;
  const definition = definitions[key];
  Object.keys(definition).forEach((field) => add(field, definition[field]));
}

function addCombinatorialFashionCopy(copy, category, featureA, featureB) {
  const add = (key, entries) => copy[key].push(...entries.filter(Boolean));
  const combine = (starts, middles, ends, limit = 80) => {
    const out = [];
    for (const start of starts) {
      for (const middle of middles) {
        const end = ends[(out.length + start.length + middle.length) % ends.length];
        out.push(`${start}${middle}${end}`);
        if (out.length >= limit) return out;
      }
    }
    return out;
  };

  const commonClickChecks = [
    `色味は写真で印象が変わるので、レビュー画像まで確認したいです🔍`,
    `サイズ感で満足度が変わるので、着用レビューを見て選びたいです◎`,
    `生地の厚みや透け感は、商品ページでしっかり見ておきたいです✨`,
    `手持ち服に合うか、カラー展開まで比べて選びたいです💖`,
    `実際の着用感が気になるので、レビューの写真がかなり参考になります🔍`,
  ];

  const commonSalesAngles = [
    `こういう使いやすいアイテムは、色やサイズがあるうちに候補へ入れておきたいです✨`,
    `普段コーデを少し更新したい人には、かなりチェックしやすいアイテムです💖`,
    `手持ち服に合わせやすいものは、買ったあとも出番が増えやすいです🎀`,
    `レビューで失敗しやすいポイントまで見ておくと、安心して選びやすいです🔍`,
    `可愛さだけでなく実用感もあると、デイリーに使いやすいです✨`,
    `30代のきれいめカジュアルに取り入れやすい雰囲気です💖`,
  ];

  if (category.includes("ワンピ")) {
    add("leads", combine(
      [
        `${featureA}がほどよく効いて、`,
        `${featureB}で抜け感を出しながら、`,
        `1枚で着るだけでも、`,
        `小物合わせを変えるだけで、`,
        `体のラインを拾いすぎず、`,
        `シンプルに見えても、`,
        `忙しい朝に選んでも、`,
        `大人可愛い雰囲気を出しつつ、`,
      ],
      [
        `手抜きに見えにくい`,
        `写真に残る日にも選びやすい`,
        `きれいめ感を残しやすい`,
        `お出かけ感が自然に出る`,
        `体型カバーも着映えも狙える`,
        `甘すぎず大人っぽくまとまる`,
        `コーデがすぐ完成する`,
        `普段にもデートにも使いやすい`,
      ],
      [
        `ワンピです👗✨`,
        `のがうれしいです💖`,
        `のが魅力です🎀`,
        `バランスが頼れます✨`,
        `雰囲気にまとまります💖`,
      ],
      90
    ));
    add("details", combine(
      [
        `ヒールを合わせると、`,
        `フラットシューズなら、`,
        `カーデを羽織れば、`,
        `ジャケットを重ねると、`,
        `淡色小物を合わせると、`,
        `黒小物で締めると、`,
      ],
      [
        `上品なお出かけ感が出て`,
        `頑張りすぎない休日感が出て`,
        `季節の変わり目にも使いやすく`,
        `通勤寄りにも調整しやすく`,
        `やわらかい大人可愛い印象になり`,
        `すっきり大人っぽく見えて`,
      ],
      [
        `着回しの幅が広がります✨`,
        `手持ち服とも合わせやすいです💖`,
        `シーンを選びにくいです🎀`,
        `買ったあとも出番が増えそうです◎`,
      ],
      45
    ));
    add("coords", ["淡色バッグで柔らかく", "黒小物で大人っぽく", "ショート丈羽織りでバランスよく", "フラット靴で旅行にも", "華奢アクセで女子会にも", "ジャケットで通勤寄りに"]);
    add("points", ["1枚で時短コーデ", "小物で雰囲気チェンジ", "デートにも休日にも", "丈感レビューを見たい", "体型カバーも狙える", "写真映えしやすい"]);
    add("sales", commonSalesAngles);
    add("clicks", commonClickChecks);
  }

  if (category.includes("トップス")) {
    add("leads", combine(
      [
        `${featureA}が効いていて、`,
        `${featureB}なら、`,
        `いつものボトムに合わせるだけで、`,
        `顔まわりに表情が出て、`,
        `1枚で着ても、`,
        `羽織りの中に入れても、`,
        `甘さを抑えながら、`,
        `シンプルボトムの日でも、`,
      ],
      [
        `地味見えしにくい`,
        `手持ち服が新鮮に見える`,
        `大人可愛い雰囲気が足せる`,
        `写真でも寂しく見えにくい`,
        `通勤にも休日にも寄せやすい`,
        `二の腕や腰まわりを自然にカバーしやすい`,
        `時短で洒落感が出る`,
        `着回しの幅が広がる`,
      ],
      [
        `トップスです✨`,
        `のが魅力です💖`,
        `のがうれしいです🎀`,
        `バランスです✨`,
        `印象にまとまります💖`,
      ],
      90
    ));
    add("details", combine(
      [
        `デニムに合わせると、`,
        `きれいめパンツなら、`,
        `フレアスカートと合わせると、`,
        `ジャンスカのインナーにすると、`,
        `ジャケットの中に入れると、`,
      ],
      [
        `抜け感のある大人カジュアルになり`,
        `通勤にも使いやすく`,
        `女性らしい雰囲気が出て`,
        `顔まわりが明るく見えて`,
        `きちんと感を足せて`,
      ],
      [
        `着回しやすいです✨`,
        `手持ち服に合わせやすいです💖`,
        `雰囲気を変えやすいです🎀`,
        `出番が増えそうです◎`,
      ],
      35
    ));
    add("coords", ["デニムで抜け感を", "きれいめパンツで通勤に", "フレアスカートで甘めに", "ジャンスカのインナーに", "ジャケット合わせできちんと"]);
    add("points", ["顔まわりが映える", "手持ちボトムが新鮮に", "二の腕カバーに期待", "1枚で着映え", "通勤にも休日にも"]);
    add("sales", commonSalesAngles);
    add("clicks", commonClickChecks);
  }

  if (category.includes("パンツ")) {
    add("leads", combine(
      [
        `${featureA}で、`,
        `${featureB}のおかげで、`,
        `脚のラインを拾いすぎず、`,
        `ラクにはけるのに、`,
        `トップスを変えるだけで、`,
        `通勤の日にも休日にも、`,
        `腰まわりを自然に整えながら、`,
        `シンプルに見えても、`,
      ],
      [
        `すっきり見えを狙える`,
        `きちんと感を残しやすい`,
        `美脚見えしやすい`,
        `大人っぽくまとまる`,
        `着回しが効きやすい`,
        `スタイルアップを狙いやすい`,
        `頑張りすぎないきれいめ感が出る`,
        `毎日コーデに取り入れやすい`,
      ],
      [
        `パンツです✨`,
        `のが魅力です💖`,
        `のがうれしいです🎀`,
        `バランスが頼れます✨`,
        `印象になります💖`,
      ],
      90
    ));
    add("details", combine(
      [
        `ブラウス合わせなら、`,
        `Tシャツ合わせでも、`,
        `ヒールを合わせると、`,
        `スニーカーで外すと、`,
        `ジレを重ねると、`,
      ],
      [
        `通勤にも使いやすく`,
        `きれいめカジュアルにまとまり`,
        `脚長見えを狙いやすく`,
        `休日にも使いやすく`,
        `今っぽいバランスになり`,
      ],
      [
        `着回しの幅が広がります✨`,
        `手持ちトップスに合わせやすいです💖`,
        `雰囲気を変えやすいです🎀`,
        `毎日使いしやすいです◎`,
      ],
      35
    ));
    add("coords", ["ブラウスで通勤に", "Tシャツで休日に", "ジレ合わせで今っぽく", "ヒールで脚長見え", "スニーカーで抜け感を"]);
    add("points", ["美脚見えを狙える", "丈感レビューを見たい", "腰まわりをカバー", "オンオフ使える", "ラクなのにきれいめ"]);
    add("sales", commonSalesAngles);
    add("clicks", commonClickChecks);
  }

  if (category.includes("スカート")) {
    add("leads", combine(
      [
        `${featureA}が動きを出して、`,
        `${featureB}で、`,
        `シンプルトップスでも、`,
        `甘さを抑えながら、`,
        `腰まわりを自然にカバーしつつ、`,
        `歩くたびに表情が出て、`,
        `ロング丈でも重たく見えにくく、`,
        `普段コーデに足すだけで、`,
      ],
      [
        `女性らしくまとまる`,
        `大人フェミニンに見える`,
        `写真映えを狙いやすい`,
        `着回ししやすい`,
        `上品な華やかさが出る`,
        `マンネリ感を変えやすい`,
        `デートにも休日にも使いやすい`,
        `こなれた印象になる`,
      ],
      [
        `スカートです✨`,
        `のが魅力です💖`,
        `のがうれしいです🎀`,
        `雰囲気にまとまります✨`,
        `バランスです💖`,
      ],
      90
    ));
    add("details", combine(
      [
        `コンパクトトップスなら、`,
        `ゆるニットを合わせると、`,
        `スニーカーで外すと、`,
        `ヒールと合わせると、`,
        `ジャケットを羽織ると、`,
      ],
      [
        `バランスよく見えて`,
        `抜け感が出て`,
        `大人カジュアルになり`,
        `女性らしさが増して`,
        `きれいめにまとまり`,
      ],
      [
        `着回しやすいです✨`,
        `雰囲気を変えやすいです💖`,
        `普段にも使いやすいです🎀`,
        `お出かけにも頼れます◎`,
      ],
      35
    ));
    add("coords", ["コンパクトトップスで上品に", "ゆるニットで抜け感を", "スニーカーで外して", "ヒールでデートにも", "ジャケットで通勤寄りに"]);
    add("points", ["揺れ感が華やか", "腰まわりをカバー", "甘すぎず使える", "丈感を確認したい", "トップスを選びにくい"]);
    add("sales", commonSalesAngles);
    add("clicks", commonClickChecks);
  }

  if (category.includes("カーデ") || category.includes("アウター")) {
    add("leads", combine(
      [
        `${featureA}で、`,
        `${featureB}なら、`,
        `羽織るだけで、`,
        `ワンピにもパンツにも合わせやすく、`,
        `冷房対策をしながら、`,
        `季節の変わり目にも、`,
        `シンプル服に重ねるだけで、`,
        `肩掛けしても、`,
      ],
      [
        `コーデに奥行きが出る`,
        `生活感が出にくい`,
        `きれいめ感を足せる`,
        `着回しやすい`,
        `こなれ感が出る`,
        `大人っぽくまとまる`,
        `温度調整しやすい`,
        `手持ち服が新鮮に見える`,
      ],
      [
        `羽織りです✨`,
        `のが魅力です💖`,
        `のがうれしいです🎀`,
        `バランスです✨`,
        `印象になります💖`,
      ],
      90
    ));
    add("details", combine(
      [
        `ノースリーブに重ねると、`,
        `キャミワンピに羽織れば、`,
        `デニム合わせなら、`,
        `通勤パンツと合わせると、`,
        `肩掛けにすると、`,
      ],
      [
        `露出を抑えながら`,
        `上品なお出かけ感が出て`,
        `大人カジュアルにまとまり`,
        `きちんと感を足せて`,
        `こなれた雰囲気になり`,
      ],
      [
        `使いやすいです✨`,
        `着回しの幅が広がります💖`,
        `季節の変わり目に頼れます🎀`,
        `手持ち服に合わせやすいです◎`,
      ],
      35
    ));
    add("coords", ["キャミワンピに羽織って", "デニムで大人カジュアルに", "通勤パンツに合わせて", "肩掛けでこなれ感を", "ノースリーブの冷房対策に"]);
    add("points", ["羽織るだけで垢抜け", "冷房対策にも", "丈感を確認したい", "手持ち服に合う", "季節の変わり目に"]);
    add("sales", commonSalesAngles);
    add("clicks", commonClickChecks);
  }

  if (category.includes("バッグ") || category.includes("シューズ") || category.includes("アクセサリー")) {
    add("sales", [
      `小物はコーデ全体の印象を変えやすいので、気になる時にチェックしておきたいです✨`,
      `服を買い足さなくても雰囲気を変えられるので、マンネリ対策にも便利です💖`,
      `レビュー写真で実物感を見ておくと、届いた時のイメージ違いを減らせます🔍`,
      `デイリーに使える小物は、見た目だけでなく使いやすさまで確認したいです🎀`,
      `シンプル服が多い人ほど、小物で高見え感を足せると便利です✨`,
    ]);
    add("clicks", [
      `サイズ感や実物の色味は、レビュー写真まで見ておきたいです🔍`,
      `毎日使うなら、重さや素材感も確認して選びたいです◎`,
      `手持ち服に合わせやすいか、カラー展開を見比べたいです💖`,
      `使うシーンを想像しながら、商品ページの写真を確認したいです✨`,
    ]);
  }
}

function addExpandedFashionCopy(copy, category, featureA, featureB) {
  const add = (key, entries) => copy[key].push(...entries);

  if (category.includes("ワンピ")) {
    add("leads", [
      `${featureA}が目を引いて、1枚でも寂しく見えにくい大人ワンピです👗✨`,
      `${featureB}のおかげで、ラクに着てもきれいめ感を残しやすいです💖`,
      `着るだけで雰囲気がまとまりやすく、予定がある日の服選びがかなりラクになります🎀`,
      `甘さと大人っぽさのバランスがよく、普段のお出かけにも取り入れやすいです✨`,
      `シンプルな小物を合わせるだけでも、ちゃんと洒落見えするのがうれしいです💖`,
      `体のラインを拾いすぎず、でも女性らしさは残せる絶妙な雰囲気です👗`,
      `1枚で主役感があるので、コーデを考える時間を短くしたい日に頼れます✨`,
      `${featureA}が効いていて、いつものワンピより少し特別感を出せます🎀`,
    ]);
    add("details", [
      `カーデやジャケットを重ねると季節をまたいで使いやすく、着回しの幅も広がります✨`,
      `バッグや靴を変えるだけで、デートにも休日にも寄せやすいのが便利です💖`,
      `身長によって印象が変わるので、レビューの丈感を見て選ぶと安心です🔍`,
      `ウエスト位置や落ち感がきれいだと、写真でもすっきり見えやすいです🎀`,
      `忙しい朝でも“ちゃんと選んだ感”が出るので、1枚持っておくと助かります✨`,
      `淡色小物で柔らかく、黒小物で大人っぽくと雰囲気を変えやすいです💖`,
      `旅行や帰省にも持っていきやすいデザインなら、荷物を減らしたい日にも頼れます👗`,
      `透け感や裏地の有無は、商品ページでしっかり確認しておきたいです🔍`,
    ]);
    add("sales", [
      `ワンピは売り切れると同じ雰囲気を探しにくいので、気になる色は早めに見たいです💖`,
      `着るだけで完成する服は、忙しい30代の味方になってくれます✨`,
      `1枚で写真映えまで狙えるなら、イベント前にも候補へ入れたいです🎀`,
      `レビューで生地感や丈感を見ておくと、届いた時のイメージ違いを減らせます🔍`,
      `普段使いもお出かけもできるワンピは、コスパ重視でも選びやすいです👗`,
      `手持ちの羽織りと合わせやすい色なら、かなり出番が増えそうです💖`,
    ]);
    add("clicks", [
      `低身長さんや高身長さんのレビューで丈感を確認したいです🔍`,
      `裏地や透け感、ウエスト位置は商品ページで見ておきたいです◎`,
      `カラー別の雰囲気が違うので、着用写真を比べて選びたいです💖`,
      `洗濯できるか、シワになりにくいかも確認しておくと安心です✨`,
    ]);
    add("coords", [
      "黒小物合わせで大人っぽいお出かけに",
      "淡色バッグでやわらかい休日コーデに",
      "ショート丈カーデを羽織ってバランスよく",
      "フラットシューズで旅行にも楽ちんに",
      "パール小物で女子会や食事にも",
    ]);
    add("points", ["1枚で着映える", "丈感を見て選びたい", "小物で印象チェンジ", "写真映えしやすい", "忙しい朝に頼れる"]);
  }

  if (category.includes("トップス")) {
    add("leads", [
      `${featureA}が効いていて、手持ちボトムに合わせるだけで印象が変わります✨`,
      `顔まわりが寂しく見えにくく、1枚で着映えしやすいトップスです💖`,
      `${featureB}なら甘さを抑えながら、大人可愛い雰囲気を足せます🎀`,
      `シンプルなパンツ合わせでも地味見えしにくいのがうれしいです✨`,
      `忙しい朝にぱっと選んでも、ちゃんと洒落感が出せそうです💖`,
      `二の腕や腰まわりを自然にカバーしながら、重たく見えにくいバランスです✨`,
      `オンにも休日にも寄せやすく、着回し重視の人にも見やすいです🎀`,
      `アクセなしでも華やぐので、時短コーデにも頼れます💖`,
    ]);
    add("details", [
      `デニム合わせで抜け感を、きれいめパンツ合わせで通勤感を作れます✨`,
      `スカートに合わせるとフェミニンに寄せられて、雰囲気を変えやすいです💖`,
      `袖の長さや首元の開きで印象が変わるので、着用写真を確認したいです🔍`,
      `インしてもアウトでも使いやすい丈なら、手持ち服に合わせやすいです🎀`,
      `生地の厚みや透け感は、季節に合わせてレビューで見ておきたいです✨`,
      `ジャケットの中に入れても映えるデザインなら、仕事の日にも使えます💖`,
      `甘めデザインでも色味が落ち着いていると、大人でも取り入れやすいです◎`,
      `洗えるタイプならデイリーに着やすく、出番も増えそうです✨`,
    ]);
    add("sales", [
      `トップスはコーデの印象を変えやすいので、買い足し候補にぴったりです✨`,
      `手持ちボトムを活かせるトップスは、コスパよく垢抜けを狙えます💖`,
      `顔まわりが映える服は、写真を撮る予定の日にも頼れます🎀`,
      `色違いで雰囲気が変わるタイプなら、レビュー写真まで見たいです🔍`,
      `1枚で着映えるトップスは、季節の変わり目にもかなり便利です✨`,
      `二の腕カバー系は人気が出やすいので、気になるサイズは早めに見たいです💖`,
    ]);
    add("clicks", [
      `首元の抜け感と袖丈で、華奢見えしやすいかが大事です✨`,
      `透け感やインナーの必要性はレビューで見ておきたいです◎`,
      `ボトムインした時の丈感も商品ページで確認したいです✨`,
      `洗濯後のシワ感や生地感もレビューが参考になります💖`,
    ]);
    add("coords", [
      "センタープレスパンツで通勤にも",
      "デニム合わせで大人カジュアルに",
      "フレアスカートでフェミニンに",
      "ジャンスカのインナーにも",
      "ジャケットの中に入れてきれいめに",
    ]);
    add("points", ["1枚で着映える", "手持ちボトムに合う", "顔まわりが華やぐ", "絶妙な袖丈で華奢に見える", "買い足しに便利"]);
  }

  if (category.includes("パンツ")) {
    add("leads", [
      `${featureA}で脚のラインをきれいに見せやすく、毎日コーデに頼れます✨`,
      `ラクにはけるのにきちんと感が出やすく、オンオフ使えるのが魅力です💖`,
      `${featureB}なら腰まわりを自然に整えつつ、すっきり見えを狙えます🎀`,
      `パンツ派さんが気になる細見えと動きやすさを両方見たいアイテムです✨`,
      `トップスを変えるだけで印象を変えやすく、着回し力も高そうです💖`,
      `きれいめに見えるのに窮屈すぎないパンツは、結局出番が増えます✨`,
      `通勤にも休日にも浮きにくい、ちょうどいい大人パンツです🎀`,
      `脚長見えを狙いたい日にも、シンプルトップス合わせでまとまりやすいです💖`,
    ]);
    add("details", [
      `ブラウス合わせで上品に、ロゴT合わせで休日っぽくも着回せます✨`,
      `ウエストやヒップのサイズ感は、レビューを見て選ぶと失敗しにくいです🔍`,
      `落ち感のある生地なら、脚のラインを拾いすぎずきれいに見えやすいです💖`,
      `丈感で印象が変わるので、身長別レビューはかなり参考になります◎`,
      `ストレッチがあるタイプなら、長時間座る日にも使いやすそうです🎀`,
      `センタープレス入りなら、シンプルトップスでもきちんと感を出しやすいです✨`,
      `ワイドなら体型カバー、テーパードならすっきり見えを狙いやすいです💖`,
      `靴を変えるだけで通勤にも休日にも振れるのが便利です👠`,
    ]);
    add("sales", [
      `パンツはサイズ選びが大事なので、レビューの丈感まで見ておきたいです🔍`,
      `美脚見えパンツは一本あると、朝のコーデがかなり組みやすくなります✨`,
      `オンオフ使えるパンツは、クローゼットの稼働率を上げてくれます💖`,
      `人気カラーは動きやすいので、在庫があるうちにチェックしたいです🎀`,
      `ラクさときれい見えが両方あるパンツは、30代コーデにかなり頼れます✨`,
      `通勤服を更新したい人にも、休日のきれいめカジュアルにも使いやすいです💖`,
    ]);
    add("clicks", [
      `身長別の丈感とウエストの伸び感をレビューで見たいです🔍`,
      `ヒップまわりのゆとりや生地の厚みも確認したいです◎`,
      `透け感や下着ラインが出にくいかも商品ページで見たいです✨`,
      `靴合わせの写真があると、着回しイメージがしやすいです💖`,
    ]);
    add("coords", [
      "ブラウス合わせでオフィスに",
      "ロゴTで大人カジュアルに",
      "ヒールで脚長見えを狙って",
      "スニーカーで休日にも",
      "ジレ合わせで今っぽく",
    ]);
    add("points", ["美脚見えを狙える", "丈感を確認したい", "オンオフ使える", "腰まわりをカバー", "ラクなのにきれいめ"]);
  }

  if (category.includes("スカート")) {
    add("leads", [
      `${featureA}で動きが出て、シンプルトップスでも女性らしくまとまります✨`,
      `${featureB}なら腰まわりを自然にカバーしつつ、華やかさも足せます💖`,
      `甘すぎない大人フェミニン感があり、普段にもお出かけにも使いやすいです🎀`,
      `歩くたびに雰囲気が出るスカートは、写真映えも狙えそうです✨`,
      `きれいめにもカジュアルにも振れるので、着回しの幅が広がります💖`,
      `トップス次第で印象を変えやすく、マンネリしがちなコーデの更新にぴったりです🎀`,
      `ロング丈でも重たく見えにくいデザインなら、大人っぽく取り入れやすいです✨`,
      `デートにも休日にも使える華やかさで、気分を上げたい日に選びたいです💖`,
    ]);
    add("details", [
      `コンパクトトップスを合わせると、全体のバランスが取りやすいです✨`,
      `ゆるニット合わせなら、抜け感のある大人フェミニンにまとまります💖`,
      `ウエスト位置や広がり方で印象が変わるので、着用写真を見たいです🔍`,
      `裏地や透け感は季節問わず大事なので、商品ページで確認したいです◎`,
      `スニーカー合わせでカジュアルに外しても可愛く使えます🎀`,
      `ヒールや小さめバッグを合わせると、食事や女子会にも寄せやすいです✨`,
      `柄や素材に表情があると、無地トップスでもコーデが決まりやすいです💖`,
      `腰張りが気になる人は、落ち感やフレアの出方をレビューで見たいです🔍`,
    ]);
    add("sales", [
      `スカートはシルエットで印象が変わるので、着用写真をしっかり見たいです🔍`,
      `華やかスカートは1枚あると、手持ちトップスの雰囲気まで変えてくれます✨`,
      `甘すぎないデザインなら、30代の大人可愛いコーデに使いやすいです💖`,
      `季節をまたいで使えそうな素材なら、かなり出番が増えそうです🎀`,
      `デートや女子会用にも、普段使いにも振れるスカートは候補に入れたいです✨`,
      `カラーで印象が変わるので、気になる色はレビュー写真まで比べたいです💖`,
    ]);
    add("clicks", [
      `ウエストの伸び感や丈感をレビューで確認したいです🔍`,
      `裏地の有無と透け感は商品ページで見ておきたいです◎`,
      `広がり方や落ち感は着用写真でチェックしたいです✨`,
      `手持ちトップスに合う色か、カラー展開も比べたいです💖`,
    ]);
    add("coords", [
      "コンパクトトップスでバランスよく",
      "ゆるニットで抜け感を出して",
      "スニーカーで大人カジュアルに",
      "小さめバッグでデートにも",
      "ジャケット合わせできれいめに",
    ]);
    add("points", ["揺れ感が華やか", "腰まわりをカバー", "甘すぎず使いやすい", "裏地を確認したい", "手持ちトップスに合う"]);
  }

  if (category.includes("カーデ") || category.includes("アウター")) {
    add("leads", [
      `羽織るだけで全体の印象が整って、いつもの服もぐっとこなれて見えます✨`,
      `${featureA}で軽やかさを足しながら、冷房対策や季節の変わり目にも使いやすいです💖`,
      `${featureB}なら重たく見えにくく、ワンピにもパンツにも合わせやすいです🎀`,
      `生活感が出にくい羽織りは、近場のお出かけにも頼れます✨`,
      `肩掛けや前開けで雰囲気を変えられるので、着回し力も期待できます💖`,
      `シンプル服に重ねるだけで、きちんと感と抜け感の両方を足せます🎀`,
      `朝晩の温度差がある日も、可愛く調整できるのがうれしいです✨`,
      `薄手でも安っぽく見えにくいデザインなら、長く使えそうです💖`,
    ]);
    add("details", [
      `ノースリーブやキャミワンピに重ねると、露出を抑えながら大人っぽくまとまります✨`,
      `パンツ合わせならすっきり、ワンピ合わせなら上品に寄せやすいです💖`,
      `丈感でバランスが大きく変わるので、着用写真を見て選びたいです🔍`,
      `バッグに入れやすい薄手タイプなら、冷房対策にもかなり便利です◎`,
      `袖のゆとりや肩まわりの落ち感は、レビューで確認しておくと安心です🎀`,
      `カラーを変えるだけで印象が変わるので、手持ち服に合う色を選びたいです✨`,
      `ジレやベスト系なら、シンプルコーデに重ねるだけで今っぽく見えます💖`,
      `ジャケット系なら、通勤にも休日にもきちんと感を足せます◎`,
    ]);
    add("sales", [
      `羽織りは使う期間が長いので、生地感や丈感までレビューで見たいです🔍`,
      `冷房対策もおしゃれ見えも叶う羽織りは、季節前に候補へ入れたいです✨`,
      `ワンピにもパンツにも合うなら、着回し力重視でも選びやすいです💖`,
      `薄手の羽織りは人気カラーから動きやすいので、早めにチェックしたいです🎀`,
      `シンプル服を更新したい人にも、重ねるだけで雰囲気が変わるので便利です✨`,
      `通勤にも休日にも使える羽織りは、1枚あるとかなり頼れます💖`,
    ]);
    add("clicks", [
      `丈感と袖のゆとりは着用写真で確認したいです🔍`,
      `透け感や生地の厚みはレビューで見ておきたいです◎`,
      `手持ちワンピに合う丈か、商品ページで比べたいです💖`,
      `洗濯後のシワ感や型崩れも確認しておくと安心です✨`,
    ]);
    add("coords", [
      "キャミワンピに羽織って上品に",
      "デニム合わせで大人カジュアルに",
      "肩掛けでこなれ感を足して",
      "通勤パンツに合わせてきれいめに",
      "ノースリーブの冷房対策に",
    ]);
    add("points", ["羽織るだけで垢抜け", "冷房対策にも便利", "丈感を確認したい", "手持ち服に合わせやすい", "季節の変わり目に"]);
  }

  if (category.includes("バッグ")) {
    add("leads", [
      `${featureA}があって、見た目の可愛さと実用感を両方狙えるバッグです👜✨`,
      `持つだけでコーデの印象が変わり、シンプル服も高見えしやすいです💖`,
      `${featureB}なら通勤にも休日にも合わせやすく、出番が増えそうです🎀`,
      `小物で雰囲気を変えたい日に、かなり頼れる存在感があります✨`,
      `可愛いだけでなく荷物の収まりまで見たい人にぴったりです💖`,
      `淡色コーデにもきれいめコーデにもなじみやすい雰囲気です👜`,
    ]);
    add("details", [
      `財布やスマホ、ポーチが入るかは商品ページの収納写真で確認したいです🔍`,
      `ショルダー付きなら両手が空いて、旅行や子ども連れのお出かけにも便利です✨`,
      `きれいめワンピにもデニムにも合わせやすい形だと、かなり使いやすいです💖`,
      `素材感で高見え度が変わるので、レビュー写真まで見て選びたいです◎`,
      `軽いバッグなら長時間のお出かけにも持ちやすく、デイリーに使えます🎀`,
      `カラー次第で印象が変わるので、手持ち服に合わせて選びたいです✨`,
    ]);
    add("sales", [
      `バッグは毎日使うものだから、可愛さだけでなく収納力も見ておきたいです🔍`,
      `高見えバッグはコーデ全体の印象を上げてくれるので、候補に入れたいです💖`,
      `人気カラーは早めに動きやすいので、気になる色はチェックしておきたいです✨`,
      `小さめでも必要なものが入るバッグは、休日コーデにかなり便利です🎀`,
    ]);
    add("clicks", [
      `収納写真とサイズ表を見て、普段の荷物が入るか確認したいです🔍`,
      `重さやショルダーの長さもレビューで見ておくと安心です◎`,
      `実物の色味はレビュー写真も参考にしたいです💖`,
    ]);
    add("coords", ["ワンピに合わせて上品に", "デニムコーデの高見え小物に", "通勤コーデのきれいめバッグに", "淡色コーデの締め役に"]);
    add("points", ["収納力を確認したい", "持つだけで高見え", "軽さも見たい", "色違いも気になる", "休日にも通勤にも"]);
  }

  if (category.includes("シューズ")) {
    add("leads", [
      `${featureA}で足元からコーデを整えて、全体をすっきり見せやすいです👠✨`,
      `可愛いだけでなく歩きやすさも期待できると、出番が増えます💖`,
      `${featureB}ならきれいめ服にもカジュアル服にも合わせやすいです🎀`,
      `足元を変えるだけで、いつもの服まで新鮮に見せてくれます✨`,
      `楽に履けて洒落見えする靴は、休日のお出かけにも通勤にも頼れます💖`,
      `シンプルコーデの仕上げに使いやすい、ちょうどいい存在感があります👠`,
    ]);
    add("details", [
      `パンツにもスカートにも合わせやすい形なら、着回し力がかなり高いです✨`,
      `サイズ感や幅のレビューは、靴選びで特に見ておきたいポイントです🔍`,
      `クッション性やヒールの高さを確認すると、長時間のお出かけにも選びやすいです💖`,
      `足元に抜け感が出るデザインなら、春夏コーデにも軽やかに合います🎀`,
      `ローファーやパンプス系なら、通勤服をきれいめにまとめやすいです✨`,
      `スニーカー系なら、ワンピやスカートの外しにも使えて便利です💖`,
    ]);
    add("sales", [
      `靴はサイズ選びが大事なので、レビューで普段サイズとの比較を見たいです🔍`,
      `歩きやすくて可愛い靴は、結局いちばん手に取りやすいです✨`,
      `足元が整うと全身の高見え感も変わるので、候補に入れたいです💖`,
      `人気サイズは売り切れやすいので、気になる色とサイズは早めに見たいです🎀`,
    ]);
    add("clicks", [
      `普段サイズで合うか、幅広さんのレビューも見たいです🔍`,
      `ヒールの高さや重さは商品ページで確認したいです◎`,
      `着用写真でパンツにもスカートにも合うか見たいです💖`,
    ]);
    add("coords", ["パンツ合わせで足元すっきり", "ワンピの外しに", "通勤コーデをきれいめに", "休日のお出かけに"]);
    add("points", ["歩きやすさを確認", "足元から垢抜け", "サイズ感が大事", "きれいめにも使える", "パンツにもスカートにも"]);
  }

  if (category.includes("アクセサリー")) {
    add("leads", [
      `${featureA}で顔まわりがぱっと華やぎ、シンプル服も寂しく見えにくいです💍✨`,
      `小さめでも存在感があり、いつものコーデを自然に高見えさせてくれます💖`,
      `${featureB}ならデイリーにもお出かけにも使いやすい雰囲気です🎀`,
      `服を買い足さなくても印象を変えられる、頼れる小物です✨`,
      `派手すぎない華やかさで、30代のきれいめコーデにも合わせやすいです💖`,
      `顔まわりにツヤ感が出ると、写真の印象まで明るく見えます💍`,
    ]);
    add("details", [
      `Tシャツやニットに足すだけでも、手抜き感を抑えやすいです✨`,
      `ワンピやブラウスに合わせると、食事や女子会にも使いやすいです💖`,
      `金属アレルギー対応や素材表記は、商品ページで確認しておきたいです🔍`,
      `小ぶりなら毎日使いやすく、大ぶりならコーデの主役になってくれます🎀`,
      `カラーや質感で高見え度が変わるので、レビュー写真も参考になります✨`,
      `プレゼント候補にも見やすく、自分用にも色違いで欲しくなりそうです💖`,
    ]);
    add("sales", [
      `アクセは小さいのに印象を変えてくれるので、コーデのマンネリ対策に便利です✨`,
      `デイリーに使える高見え小物は、見つけた時にチェックしておきたいです💖`,
      `素材や変色しにくさのレビューを見て選ぶと、長く使いやすいです🔍`,
      `シンプル服が多い人ほど、アクセで雰囲気を足せると便利です🎀`,
    ]);
    add("clicks", [
      `サイズ感や着用写真で、顔まわりの印象を確認したいです🔍`,
      `素材表記や金属アレルギー対応の有無を見ておきたいです◎`,
      `実物のツヤ感や色味はレビュー写真も参考になります💖`,
    ]);
    add("coords", ["シンプルニットの華やか足しに", "ワンピの仕上げに", "通勤服の高見え小物に", "女子会や食事コーデに"]);
    add("points", ["顔まわりが華やぐ", "高見え小物に", "素材を確認したい", "毎日使いやすい", "ギフトにも見やすい"]);
  }
}

function inferProductSignals(seed) {
  const text = String(seed || "");
  const signals = { leads: [], details: [], sales: [] };

  const add = (condition, lead, detail, sales) => {
    if (!condition) return;
    if (lead) signals.leads.push(lead);
    if (detail) signals.details.push(detail);
    if (sales) signals.sales.push(sales);
  };

  add(
    /ノンワイヤー|ワイヤレス|楽ブラ|締め付け|締めつけ|ブラレット/.test(text),
    `ノンワイヤー系はラクに過ごしたい日にも選びやすく、締め付け感を抑えたい人にうれしいです💖✨`,
    `ワイヤーなしでも整いやすいかは大事なので、ホールド感やズレにくさのレビューまで見たいです🔍`,
    `デイリー用の下着を探している人は、ラクさときれい見えのバランスで候補に入れたいです🎀`
  );
  add(
    /シームレス|響きにくい|ひびきにくい|透けにくい|ラインレス|縫い目なし/.test(text),
    `シームレス系は服に響きにくく、薄手トップスやタイトめ服の日にも頼れます✨💖`,
    `段差が出にくいタイプなら、後ろ姿や横から見たラインまで気にしやすい日に便利です◎`,
    `淡色服やきれいめ服が多い人は、1枚持っておくと出番が増えそうです🎀`
  );
  add(
    /脇高|補正|ガードル|着圧|骨盤|ボディシェイパー|シェイプ/.test(text),
    `脇高や補正タイプは、気になるラインを整えながら服のシルエットをきれいに見せやすいです✨`,
    `締め付けすぎないか、長時間でも使いやすいかはレビューでしっかり確認したいです🔍`,
    `ワンピやパンツをすっきり着たい人には、候補に入れておきたいサポート系アイテムです💖`
  );
  add(
    /ナイトブラ|育乳|バストケア|ホールド|おやすみブラ|夜用ブラ/.test(text),
    `ナイトブラ系はおうち時間に取り入れやすく、寝ている間のラクさとホールド感を両方見たいです🌙✨`,
    `苦しくないか、ズレにくいか、肌あたりはどうかなど、実際の着用レビューが参考になります💖`,
    `ナイトケアを始めたい人は、サイズ展開や洗い替えカラーまでチェックしておきたいです🎀`
  );
  add(
    /ブラショーツ|上下セット|ブラセット|ショーツセット|レース|ランジェリー/.test(text),
    `ブラショーツセットは上下でそろう可愛さがあり、見えない部分まで気分を上げてくれます🎀💖`,
    `レースやカラーの上品さがあると、普段使いでも特別感を楽しみやすいです✨`,
    `可愛さだけでなく、肌あたりや伸び感までレビューで見て選びたいアイテムです🔍`
  );
  add(
    /サニタリー|吸水|生理|防水布|羽根つき|羽根付き/.test(text),
    `サニタリー系は安心感が大事だけど、可愛さもあると毎月の気分が少し軽くなります💖`,
    `防水布やフィット感、締め付けにくさまで確認できるとデイリーに使いやすいです◎`,
    `洗い替え用にも必要になりやすいので、セット内容やカラー展開まで見たいです✨`
  );

  add(
    /通勤|オフィス|仕事|きちんと|上品|ブラウス|ジャケット/.test(text),
    `きちんと感があるので、仕事の日でも浮かずに女性らしさを足せるのが魅力です✨`,
    `ジャケットやきれいめバッグとも合わせやすく、オンの日のコーデにも使いやすいです💖`,
    `通勤服を更新したい人には、着回しやすさまで含めてチェックしておきたいアイテムです✨`
  );
  add(
    /デート|女子会|お呼ばれ|食事|お出かけ|華やか/.test(text),
    `ぱっと見で華やかさが出るので、デートや女子会の日にも気分を上げてくれます💖`,
    `アクセや小さめバッグを足すだけで、きれいめなお出かけコーデにまとまります✨`,
    `写真を撮る予定がある日にも選びやすく、褒められ感を狙えるところが強いです🎀`
  );
  add(
    /旅行|トラベル|リゾート|旅先|旅行用/.test(text),
    `楽に着られるのに手抜きに見えにくく、旅行や長時間のお出かけにも頼れます✨`,
    `荷物を増やしたくない日でも着回しやすく、旅先コーデにも使いやすいです👗`,
    `旅行用に可愛い服を探している人は、シワ感や着回しレビューを見ておきたいです💖`
  );
  add(
    /淡色|ベージュ|アイボリー|エクリュ|白|ホワイト|ピンク|ライトグレー/.test(text),
    `淡色らしいやわらかさがあって、着るだけで女性らしい雰囲気に寄せてくれます🎀`,
    `ベーシックカラーの小物とも相性がよく、淡色コーデ好きさんにも合わせやすいです✨`,
    `色味で印象が変わるので、商品ページで実物カラーを確認したくなります💖`
  );
  add(
    /接触冷感|冷感|ひんやり|UV|紫外線|日焼け/.test(text),
    `暑い日でも可愛さを諦めたくない時に、機能性まで頼れるのがうれしいです✨`,
    `日差しや冷房が気になる季節にも使いやすく、見た目以上に実用的です💖`,
    `夏用アイテムは早めに動くので、カラーと在庫を先に見ておきたいです🔍`
  );
  add(
    /撥水|防水|雨|レイン/.test(text),
    `天気が不安な日にも使いやすく、可愛いだけで終わらない実用感があります✨`,
    `雨の日コーデでも重たく見えにくく、きれいめ感をキープしやすいです💖`,
    `撥水系は欲しい時に探すと遅いので、気になるうちに候補へ入れておきたいです◎`
  );
  add(
    /洗える|ウォッシャブル|洗濯機|自宅で洗える/.test(text),
    `自宅で洗えるタイプなら、可愛くても気を使いすぎず普段から着やすいです💖`,
    `汗ばむ季節にも気兼ねなく使いやすく、デイリー服として頼れます✨`,
    `お手入れのしやすさまで見ると、出番が増える服としてかなり優秀です◎`
  );
  add(
    /セットアップ|上下セット|2点セット|3点セット/.test(text),
    `セットで着るだけでコーデが完成するので、忙しい朝にもかなり助かります✨`,
    `別々にも着回せるタイプなら、手持ち服との組み合わせまで楽しめます💖`,
    `単品使いできるかも商品ページで見ると、コスパの良さが判断しやすいです🔍`
  );
  add(
    /レース|フリル|ラッフル|リボン|チュール|フェミニン/.test(text),
    `甘めディテールが効いていても大人っぽくまとまり、可愛げを自然に足せます🎀`,
    `シンプルな小物を合わせると甘さがほどよく引き算されて、上品に着られます✨`,
    `大人ガーリーが好きな人は、ディテール写真まで見たくなる可愛さです💖`
  );
  add(
    /ストレッチ|伸び|ウエストゴム|ゴム|リラックス/.test(text),
    `ラクな着心地を期待できるのに、見た目がきれいめに寄るのがうれしいです✨`,
    `座ったり歩いたりする日にも使いやすく、我慢しないおしゃれが叶いそうです💖`,
    `サイズ感レビューを見ながら選ぶと、より失敗しにくいアイテムです🔍`
  );
  add(
    /骨格ウェーブ|ハイウエスト|フレア|Aライン|ウエストマーク/.test(text),
    `腰位置を高く見せたい人にも合わせやすく、骨格ウェーブさんのきれいめコーデに頼れます✨`,
    `トップスインや短め羽織りと合わせると、全体のバランスが取りやすいです💖`,
    `スタイルアップ重視なら、着用写真でウエスト位置を見ておきたいです🔍`
  );
  add(
    /二の腕|パフ|ドルマン|五分袖|フレンチスリーブ|袖/.test(text),
    `二の腕まわりをさりげなくカバーしながら、女性らしい華やかさも出せます✨`,
    `羽織りなしでも着やすいデザインなら、暑い日のお出かけにも頼れます💖`,
    `袖の長さやボリューム感は、商品ページの着用写真で確認したいです🔍`
  );
  add(
    /大容量|収納|ポケット|A4|ショルダーバッグ|トートバッグ/.test(text),
    `見た目の可愛さだけでなく、荷物をすっきり持てる実用感も魅力です✨`,
    `通勤や旅行にも使うなら、収納力や重さまでチェックして選びたいです💖`,
    `バッグ系はサイズ感で使いやすさが変わるので、商品写真をしっかり見たいです🔍`
  );
  add(
    /ローヒール|厚底|クッション|幅広|歩きやすい|痛くない/.test(text),
    `歩きやすさに期待できるので、可愛いだけで終わらない足元コーデが作れます✨`,
    `長時間のお出かけにも使うなら、クッション性や幅感のレビューを見たいです💖`,
    `靴はサイズ選びが大事なので、普段サイズとの比較レビューが参考になります🔍`
  );
  add(
    /金属アレルギー|サージカルステンレス|ニッケルフリー|変色|錆びにくい/.test(text),
    `肌に触れるアクセだからこそ、素材まで確認して選べると安心です✨`,
    `毎日使いやすいシンプルさがあれば、手持ち服に自然に馴染みます💖`,
    `素材表記やレビューを見て、長く使えるかチェックしたいアイテムです🔍`
  );
  add(
    /ボーダー|ロゴ|プリント|柄|花柄|ドット|チェック/.test(text),
    `柄の存在感があるので、シンプルなボトムに合わせるだけでコーデが決まります✨`,
    `派手すぎない柄なら大人でも取り入れやすく、写真映えも狙えます💖`,
    `柄物は色の出方で印象が変わるので、着用写真を見比べたいです🔍`
  );
  add(
    /タイト|マーメイド|Iライン|ナロー|スリット/.test(text),
    `縦ラインをきれいに見せやすく、女っぽい細見えコーデに寄せられます✨`,
    `タイトすぎないシルエットなら、上品さと動きやすさの両方を狙えます💖`,
    `ラインが出るアイテムは、レビューでサイズ感を確認しておきたいです🔍`
  );
  add(
    /オーバーサイズ|ビッグシルエット|ゆったり|ゆる/.test(text),
    `ゆるっと感があるのに、だらしなく見えにくいバランスがうれしいです✨`,
    `細身ボトムと合わせるとメリハリが出て、大人の抜け感コーデにまとまります💖`,
    `オーバーサイズは着丈が大事なので、身長別レビューを見たいです🔍`
  );

  return signals;
}

function inferClickLine(category, featureA, featureB, seed) {
  const text = String(seed || "");
  const sale = inferSaleSignal(seed);
  if (sale && sale.type === "coupon") {
    const couponDiscount = sale.amount
      ? (/%$/.test(sale.amount) ? `${sale.amount}OFF` : `${sale.amount}円OFF`)
      : "";
    return couponDiscount
      ? `${couponDiscount}クーポン配布中！なくなる前に商品ページをチェックしたいです✨`
      : `今ならクーポン配布中！終了前に商品ページをチェックしたいです✨`;
  }
  const nonFashion = getNonFashionProfile(category);
  if (nonFashion) return pickByHash(nonFashion.clicks, `${seed} non-fashion click`);
  const categoryCopy = inferCategoryCopy(category, featureA, featureB);
  const variation = buildReviewVariationLines(category, featureA, featureB, seed);
  const conversion = buildEvidenceBackedConversionLines(category, featureA, featureB, seed);
  const choices = [
    `色味やサイズ感で印象が変わるタイプなので、商品ページで写真とレビューを見比べて選びたいです🔍`,
    `人気カラーは早めに動くこともあるので、気になる色があるうちにチェックしておきたいです✨`,
    `実際のレビューで丈感や生地感を確認すると、自分に合うかイメージしやすいです💖`,
    `手持ち服に合う色を選べば出番が増えそうなので、カラバリまで見ておきたいアイテムです🎀`,
    `お得な情報があるうちに、商品ページで今の条件をチェックしたいです✨`,
    `着用写真を見ると雰囲気がつかみやすいので、購入前にシルエットをチェックしたいです👗`,
  ];
  if (isFocusedCategory(category) && categoryCopy.clicks.length) {
    return pickCompatibleReviewLine([...categoryCopy.clicks, ...variation.clicks, ...conversion.clicks], category, seed, "category click");
  }

  if (category.includes("ワンピ")) {
    choices.push(
      `ワンピは丈感で印象が変わるので、身長別レビューや着用写真を見て選ぶのがおすすめです👗`,
      `1枚で着るアイテムだからこそ、透け感やシルエットは商品ページでしっかり確認したいです✨`
    );
  }
  if (category.includes("パンツ")) {
    choices.push(
      `パンツは丈感とウエスト感が大事なので、レビューでサイズ選びをチェックしておきたいです✨`,
      `美脚見えを狙うなら、着用写真でラインを確認してから選ぶと失敗しにくいです💖`
    );
  }
  if (category.includes("カーデ")) {
    choices.push(
      `羽織りは色で雰囲気が変わるので、手持ちのワンピやトップスに合うカラーを見ておきたいです✨`
    );
  }
  if (/淡色|ベージュ|アイボリー|白|ホワイト|ピンク/.test(text)) {
    choices.push(`淡色系は写真と実物の色味が気になるので、レビュー画像まで見て選びたいです🔍`);
  }
  if (/接触冷感|UV|撥水|洗える|ウォッシャブル/.test(text)) {
    choices.push(`機能付きアイテムは使い心地レビューを見ると、買う前の安心感が違います◎`);
  }
  if (/セットアップ|2点セット|上下セット/.test(text)) {
    choices.push(`セットでも単品でも使えるか、商品ページの着回し写真を見ておきたいです✨`);
  }
  choices.push(...categoryCopy.clicks);
  choices.push(...variation.clicks);
  choices.push(...conversion.clicks);

  return pickCompatibleReviewLine(choices, category, seed, "click");
}

function inferTrustLine(category, featureA, featureB, seed) {
  const nonFashion = getNonFashionProfile(category);
  if (nonFashion) return pickByHash(nonFashion.trusts, `${seed} non-fashion trust`);
  const text = String(seed || "");
  const categoryCopy = inferCategoryCopy(category, featureA, featureB);
  const variation = buildReviewVariationLines(category, featureA, featureB, seed);
  const conversion = buildEvidenceBackedConversionLines(category, featureA, featureB, seed);
  const choices = [
    `レビュー数や評価も見ながら選べると、初めてのお店でも安心感があります◎`,
    `迷った時はレビューの写真やサイズ感まで見ると、失敗しにくそうです◎`,
    `普段使いしやすいデザインなので、色違いまでチェックしたくなります♡`,
    `季節の変わり目にも使いやすく、今から長く着回せそうです◎`,
    `きれいめ派さんの買い足し候補に入れておきたいアイテムです♡`,
  ];

  if (category.includes("ワンピ")) {
    choices.push(`ワンピは丈感が大事なので、レビューで身長別の雰囲気も見たいです◎`);
  }
  if (category.includes("パンツ")) {
    choices.push(`パンツはサイズ感が命なので、レビュー確認してから選びたいです◎`);
  }
  if (category.includes("カーデ")) {
    choices.push(`羽織りは使う季節が長いので、1枚あるとかなり便利です♡`);
  }
  if (/通勤|オフィス|仕事/.test(text)) {
    choices.push(`オンオフ使える服は、結局いちばん出番が多くなりそうです◎`);
  }
  if (/旅行|トラベル|リゾート/.test(text)) {
    choices.push(`旅行用に選ぶなら、軽さやシワ感のレビューも見ておきたいです◎`);
  }
  if (/レース|フリル|ラッフル|リボン/.test(text)) {
    choices.push(`甘めディテール好きさんには、細部の写真まで刺さりそうです♡`);
  }
  choices.push(...categoryCopy.trusts);
  choices.push(...variation.trusts);
  choices.push(...conversion.details);

  return pickCompatibleReviewLine(choices, category, seed, "trust");
}

function inferFinalPushLine(category, seed) {
  const nonFashion = getNonFashionProfile(category);
  if (nonFashion) return pickByHash(nonFashion.pushes, `${seed} non-fashion final`);
  const choices = [
    `気になる方は、在庫とカラーを早めに見ておきたいです✨🛒`,
    `お気に入り登録して比較しておくのもおすすめです💖🔍`,
    `売り切れ前に候補へ入れておきたい可愛さです♡✨`,
    `迷ったらレビューと着用写真を先にチェックです🔍💫`,
  ];
  if (category.includes("ワンピ")) choices.push(`褒められワンピを探している方は要チェックです👗💖`);
  if (category.includes("パンツ")) choices.push(`美脚見えパンツを探している方は要チェックです✨🫶`);
  if (category.includes("カーデ")) choices.push(`冷房対策にも使える羽織りを探している方に◎🌿✨`);
  return pickCompatibleReviewLine(choices, category, seed, "final");
}

function inferWarmExtraLine(category, featureA, featureB, seed) {
  const peripheralExtras = [];
  if (category.includes("水際")) {
    peripheralExtras.push(
      `夏の予定があるなら、体型カバーと写真映えの両方で見ておきたいです🌴✨`,
      `水際アイテムは写真に残りやすいので、可愛さまで妥協したくないです💖`,
      `旅行やプール前に、サイズと在庫を早めに確認しておきたいアイテムです🔍`
    );
  }
  if (category.includes("フォーマル")) {
    peripheralExtras.push(
      `行事服は写真に残るので、上品さとサイズ感をしっかり確認したいです✨`,
      `卒入園や学校行事に使うなら、生地感までレビューで見ておきたいです🔍`,
      `行事後も着回せるデザインだと、買ってよかった感が出やすいです💖`
    );
  }
  if (category.includes("ルームウェア")) {
    peripheralExtras.push(
      `おうち時間用こそ、着心地と気分が上がる可愛さを両方見たいです💖`,
      `洗い替えや旅行用にも使いやすいか、レビューで確認したいです🔍`,
      `生活感が出にくいルームウェアは、毎日手に取りやすいです✨`
    );
  }
  if (category.includes("浴衣")) {
    peripheralExtras.push(
      `夏イベント用なら、柄の出方とセット内容まで見ておくと安心です🎐✨`,
      `帯や下駄まで合うセットなら、当日の準備がぐっとラクになります💖`,
      `写真に残る日だから、安っぽく見えない柄かしっかり確認したいです🔍`
    );
  }
  if (category.includes("マタニティ")) {
    peripheralExtras.push(
      `体型が変わる時期だからこそ、ラクさと可愛さの両方で選びたいです💖`,
      `産前産後で長く使えるか、仕様とレビューを見ておきたいです🔍`,
      `通院にもお出かけにも使えるデザインだと、毎日の服選びがラクになります✨`
    );
  }
  if (category.includes("インナー")) {
    peripheralExtras.push(
      `毎日使うインナーは、肌あたりと透けにくさまで確認して選びたいです✨`,
      `シアーや薄手トップスの下に使うなら、見え方までレビューで見たいです🔍`,
      `洗い替え用にも選びやすいインナーは、色違いまでチェックしたくなります💖`
    );
  }
  if (category.includes("帽子") || category.includes("財布") || category.includes("ファッション小物")) {
    peripheralExtras.push(
      `小物は毎日目に入るので、実用感と可愛さの両方があると満足度が高そうです🎀`,
      `サイズ感や素材感は、レビュー写真まで確認して選びたいです🔍`,
      `いつもの服に足すだけで印象が変わる小物は、かなり頼れます✨`
    );
  }
  if (peripheralExtras.length) return pickCompatibleReviewLine(peripheralExtras, category, seed, "peripheral warm extra");

  const choices = [
    `レビューを見ながら色違いまで比較したくなる、使いやすさ重視の人にも刺さるアイテムです🔍💖`,
    `手持ち服に合わせるイメージがしやすくて、買ったあともちゃんと活躍してくれそうです🫶✨`,
    `派手すぎないのに気分が上がるので、普段のコーデを少し更新したい時にちょうどいいです🎀`,
    `${featureA}と${featureB}のバランスがよく、見た目も使いやすさも欲張れるのがうれしいです💫`,
  ];
  if (category.includes("ワンピ")) choices.push(`1枚で雰囲気が作れるので、忙しい朝や旅行コーデにも頼れそうです👗✨`);
  if (category.includes("パンツ")) choices.push(`脚のラインをきれいに見せたい日にも、ラクに過ごしたい日にも選びやすそうです💖`);
  if (category.includes("バッグ")) choices.push(`小物で高見え感を足せるので、シンプル服の日ほど出番が増えそうです👜✨`);
  if (category.includes("シューズ")) choices.push(`足元から印象が変わるので、サイズ感レビューまでしっかり見たくなります👠🔍`);
  return pickCompatibleReviewLine(choices, category, seed, "warm extra");
}

function insertBeforeSection(text, sectionLabel, insertion) {
  const index = text.indexOf(sectionLabel);
  if (index === -1) return `${text}\n${insertion}`;
  return `${text.slice(0, index)}${insertion}${text.slice(index)}`;
}

function trimToLimit(text, limit) {
  if (countChars(text) <= limit) return text;
  const lines = String(text || "").split(/\r?\n/);
  const removablePatterns = [
    /^✨.+/,
    /^・.+/,
    /^💫コーデ/,
    /^✔ポイント/,
  ];
  let next = lines.slice();
  for (const pattern of removablePatterns) {
    const index = next.findLastIndex((line) => pattern.test(line));
    if (index !== -1) {
      next.splice(index, 1);
      const joined = next.join("\n").replace(/\n{3,}/g, "\n\n").trim();
      if (countChars(joined) <= limit) return joined;
    }
  }
  while (countChars(next.join("\n")) > limit && next.length > 8) {
    next.splice(Math.max(2, next.length - 7), 1);
  }
  return next.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function inferHumanLine(category, featureA, featureB, seed) {
  const focusedHumanLines = {
    スポーツウェア: [
      `お気に入りのウェアだと、少し億劫な運動の日も前向きになれそうです🫶✨`,
      `動きやすさだけでなく、鏡を見た時に気分が上がるデザインなのがうれしいです💖`,
    ],
    レッグウェア: [
      `毎日使うものだから、すっきり見えと無理のない着け心地を両方大切にしたいです🫶`,
      `足元が整うと、いつものワンピやスカートもきれいに見えそうです✨`,
    ],
    レインウェア: [
      `雨の日でも好きな服で出かけられると、朝の気分まで少し変わりますよね🌿✨`,
      `いかにも雨具に見えないデザインなら、玄関に置いておいても手が伸びそうです💖`,
    ],
    ブライダル: [
      `写真に残る日だからこそ、上品さの中に自分らしい華やかさも欲しいです💖`,
      `会場で鏡を見た時に、これを選んでよかったと思えそうな1着です✨`,
    ],
    ヘアアクセサリー: [
      `髪型が決まらない朝も、ひとつ留めるだけで気持ちまで整いそうです🫶✨`,
      `後ろ姿まで可愛くまとまると、いつもの服でも少し新鮮に見えます💖`,
    ],
    セットアップ: [`上下で迷わず決まるのに、別々にも使えると得した気分になります🫶✨`, `忙しい朝ほど、着るだけできちんと見えるセットが頼れそうです💖`],
    オールインワン: [`1枚でコーデが決まると、予定のある朝も気持ちに余裕ができそうです🫶✨`, `楽なのに鏡を見た時のシルエットがきれいだとうれしいですよね💖`],
    デニム: [`穿いた瞬間に脚の見え方がしっくりくるデニムは、つい何度も選びたくなります✨`, `定番トップスまで新鮮に見える一本なら、毎日の服選びが楽になりそうです💖`],
    ニット: [`肌触りがよくてシルエットまできれいだと、寒い朝も自然と手が伸びそうです🫶`, `顔まわりが明るく見えるニットは、鏡を見た時の気分まで上げてくれます✨`],
    スーツ: [`きちんと見える服がしっくり決まると、大事な日も少し自信を持てそうです✨`, `長時間の日にも無理なく着られるスーツなら、仕事へ向かう朝も頼れます💖`],
    腕時計: [`お気に入りの時計が手元にあると、時間を確認するたび少し気分が上がります✨`, `服にもアクセにも自然になじむ一本は、毎朝迷わず選べそうです💖`],
    ストール: [`好きな色を顔まわりに足すだけで、いつもの服も少し新鮮に見えます✨`, `バッグに一枚あると、冷房が気になる日も安心して過ごせそうです💖`],
    ベルト: [`いつものワンピがすっきり見えると、手持ち服をもう一度楽しめそうです✨`, `小さな小物ひとつでシルエットが変わると、コーデを考えるのも楽しくなります💖`],
    サングラス: [`日差しを気にせず外を歩けて、顔まわりまでしっくり決まるとうれしいですよね✨`, `かけた時に強く見えすぎない一本なら、普段にも自然と手が伸びそうです💖`],
    手袋: [`寒い朝も手元が暖かく整うと、外へ出る気持ちが少し軽くなりそうです✨`, `毎日使うものだから、暖かさだけでなくスマホの使いやすさも大切ですよね💖`],
    アームカバー: [`日差しを気にしすぎず出かけられると、夏のおしゃれももっと楽しめそうです✨`, `つけていることを忘れるくらい軽くて快適だと、毎日続けやすいですよね💖`],
    傘: [`バッグに軽い傘が一本あるだけで、天気が読めない日も少し安心できますよね✨`, `毎日持つものだから、開くたび気分が上がる色や形を選びたくなります💖`],
  };
  const focusedKey = Object.keys(focusedHumanLines).find((key) => category.includes(key));
  if (focusedKey) return pickByHash(focusedHumanLines[focusedKey], `${seed} focused human`);

  const choices = [
    `こういう“ちゃんと可愛いのに使いやすい”感じ、結局いちばん出番が増えますよね🫶✨`,
    `派手すぎないのに印象が変わるので、見つけた時ちょっとテンション上がるタイプです💖✨`,
    `大人っぽく見せたい日にも、可愛さを少し残したい日にも使いやすそうです🎀🤍`,
    `これ、手持ち服に合わせるだけで雰囲気が変わるのでかなり頼れそうです✨🛒`,
    `レビューや着用写真を見ながら、自分に合う色を選ぶ時間まで楽しいやつです🔍💫`,
    `${featureA}と${featureB}の組み合わせがちょうどよくて、普段コーデにすっと馴染みそうです💖`,
  ];

  if (category.includes("ワンピ")) {
    choices.push(
      `1枚でここまで雰囲気が出るなら、朝のコーデ迷子の日にかなり助かりそうです👗✨`,
      `ワンピってラクしたい日に着るのに、ちゃんと華やぐのが理想ですよね💖🫶`,
      `小物を変えるだけで印象を変えられそうで、旅行にも持って行きたくなります👜✨`
    );
  }
  if (category.includes("パンツ")) {
    choices.push(
      `パンツはラクさだけじゃなく、脚がきれいに見えるかが大事ですよね✨💖`,
      `きれいめパンツが1本あると、通勤も休日も一気にコーデが組みやすくなります👗✨`,
      `トップスを選びにくそうで、手持ち服との相性もかなり良さそうです🫶`
    );
  }
  if (category.includes("トップス")) {
    choices.push(
      `トップスが可愛いと、いつものパンツやスカートまで新鮮に見えますよね✨`,
      `顔まわりがぱっと明るくなる服って、写真を撮る日にもかなり頼れます💖`,
      `1枚で着映えるトップスは、朝のコーデ迷子を減らしてくれそうです🎀`
    );
  }
  if (category.includes("スカート")) {
    choices.push(
      `スカートは揺れ感がきれいだと、それだけで女性らしさが出ますよね💖`,
      `腰まわりを拾いにくくて華やぐスカートは、結局かなり使えます✨`,
      `甘すぎない大人フェミニン感があると、普段にもデートにも合わせやすそうです🎀`
    );
  }
  if (category.includes("カーデ")) {
    choices.push(
      `羽織りは“ただの冷房対策”に見えない可愛さがあると出番が増えますよね🌿✨`,
      `ワンピにもパンツにも羽織れるカーデは、季節の変わり目に本当に頼れます💖`,
      `肩掛けするだけでも雰囲気が出るので、シンプル服の日にも使いやすそうです🎀`
    );
  }
  if (category.includes("アウター")) {
    choices.push(
      `アウターで全体の印象が決まるから、着膨れしにくさは大事ですよね✨`,
      `軽く羽織れてきれいめに見えるアウターは、季節の変わり目に頼れます💖`,
      `中のコーデを邪魔しにくい羽織りは、手持ち服にも合わせやすそうです🎀`
    );
  }
  if (category.includes("バッグ")) {
    choices.push(
      `バッグって持つだけで全体の印象が変わるので、高見え感はかなり大事です👜✨`,
      `小物で雰囲気を変えたい時に、こういう合わせやすいバッグは本当に使えます💖`,
      `荷物が入って可愛いなら、結局毎日手に取りたくなるタイプです🫶`
    );
  }
  if (category.includes("シューズ")) {
    choices.push(
      `靴は可愛くても歩きにくいと出番が減るので、レビュー確認したくなりますよね👠🔍`,
      `足元が整うだけで全身が高見えするので、こういう1足は持っておきたいです✨`,
      `パンツにもスカートにも合いそうな靴って、想像以上に頼れます💖`
    );
  }
  if (category.includes("アクセサリー")) {
    choices.push(
      `アクセは小さいのに印象を変えてくれるので、シンプル服の日ほど頼れます💍✨`,
      `顔まわりが少し華やぐだけで、写真の雰囲気まで変わりますよね💖`,
      `毎日使える高見えアクセは、見つけた時にチェックしておきたいです🔍✨`
    );
  }
  if (category.includes("水際")) {
    return pickByHash([
      `水際アイテムは写真に残りやすいから、体型カバーと可愛さどっちも欲しいです🌴✨`,
      `旅行前に慌てて探すより、可愛いものを早めに候補に入れておきたいですよね💖`,
      `露出を抑えつつ洒落見えするタイプは、大人女子にかなりありがたいです🫶`,
      `プールや海の写真って意外と残るので、ちゃんと可愛いものを選びたいです🌴`,
      `日差し対策もできて可愛いなら、夏のお出かけにかなり頼れそうです✨`
    ], `${seed} water human`);
  }
  if (category.includes("フォーマル")) {
    return pickByHash([
      `行事服は失敗したくないから、きちんと感と高見え感を両方見たいですよね✨`,
      `写真に残る日こそ、無難すぎず上品に見えるものを選びたいです💖`,
      `行事後にも着回せるデザインだと、買ってよかった感が出やすいです🎀`,
      `パール小物やパンプスを合わせるだけでまとまる服は助かります◎`,
      `サイズ感だけはレビューで確認して、きれいに着られるものを選びたいです🔍`
    ], `${seed} formal human`);
  }
  if (category.includes("ルームウェア")) {
    return pickByHash([
      `おうち時間の服が可愛いと、それだけで少し気分が上がりますよね💖`,
      `ラクなのに生活感が出にくいルームウェアは、結局出番が増えます✨`,
      `急な宅配や近所にも出やすい可愛さがあると安心です🎀`,
      `肌あたりがよくて洗いやすいものは、毎日使いしやすいです◎`,
      `旅行や帰省にも持っていけるデザインだと便利ですよね👜`
    ], `${seed} roomwear human`);
  }
  if (category.includes("浴衣")) {
    return pickByHash([
      `浴衣は写真に残るから、柄の可愛さと大人っぽさのバランスが大事ですよね🎐✨`,
      `帯や下駄まで合うセットだと、当日の準備がかなりラクになります💖`,
      `夏祭りや花火大会に着るなら、安っぽく見えにくい柄を選びたいです🎀`,
      `大人可愛い浴衣は、旅先の写真にも映えそうです✨`,
      `セット内容まで確認しておくと、届いてから慌てにくいです🔍`
    ], `${seed} yukata human`);
  }
  if (category.includes("マタニティ")) {
    return pickByHash([
      `体型が変わる時期でも、可愛い服を選べると気分が違いますよね💖`,
      `締め付けにくくてきれいめに見える服は、通院にもお出かけにも頼れます✨`,
      `産前産後で長く使えるデザインだと、かなり選びやすいです🎀`,
      `ラクさだけじゃなく、写真に残っても可愛い服を選びたいです◎`,
      `サイズ変化がある時期だからこそ、レビューの着用感は見ておきたいです🔍`
    ], `${seed} maternity human`);
  }
  if (category.includes("インナー")) {
    return pickByHash([
      `毎日使うインナーこそ、ラクさときれい見えを両方大事にしたいです✨`,
      `シアーや薄手トップスの日に頼れるインナーは、持っておくと便利です💖`,
      `肌に触れるものだから、素材感やフィット感のレビューは見たいですよね🔍`,
      `透け対策にも重ね着にも使えるなら、色違いで欲しくなります🎀`,
      `カップ付き系はラクだけど、ホールド感まで確認して選びたいです◎`
    ], `${seed} inner human`);
  }
  if (category.includes("財布")) {
    return pickByHash([
      `カードや小銭が無理なく収まると、会計のたびに小さな使いやすさを感じられそうです✨`,
      `バッグから出すたび気分が上がって、必要なものもきちんと入る財布が理想ですよね💖`,
      `見た目だけでなく中の使いやすさまで自分に合うと、長く愛用できそうです🎀`,
      `小さめバッグの日にも持ちやすく、会計でもたつきにくい形か確認したいです🔍`,
    ], `${seed} wallet human`);
  }
  if (category.includes("帽子") || category.includes("ファッション小物")) {
    return pickByHash([
      `小物って小さいのに、コーデ全体の印象をかなり変えてくれますよね✨`,
      `毎日使うものほど、可愛さと使いやすさを両方見たいです💖`,
      `手持ち服に合わせやすい小物は、買ったあとも出番が増えそうです🎀`,
      `素材感やサイズ感は、レビュー写真まで確認して選びたいです🔍`,
      `プレゼント候補にも自分用にも見やすいアイテムです◎`
    ], `${seed} goods human`);
  }
  if (category.includes("ランジェリー")) {
    return pickByHash([
      `毎日身につけるものだから、ラクさと可愛さどっちも妥協したくないですよね💖✨`,
      `服に響きにくい下着があると、薄手トップスの日もかなり安心です🎀`,
      `見えない部分が整うと、いつものコーデにも少し自信が出ますよね✨`,
      `サイズ感だけはレビューで確認して、自分に合うものを選びたいタイプです🔍💖`,
      `レースやカラーが可愛いと、普段の日でも気分がちょっと上がります🫶`,
      `締め付けにくくて整いやすい下着は、結局出番が増えそうです💫`
    ], `${seed} lingerie human`);
  }

  return pickCompatibleReviewLine(choices, category, seed, "human");
}

function inferReaderEmpathyLine(category, featureA, featureB, seed) {
  const nonFashion = getNonFashionProfile(category);
  if (nonFashion) return pickByHash(nonFashion.humans, `${seed} non-fashion empathy`);
  const text = String(seed || "");
  const variation = buildReviewVariationLines(category, featureA, featureB, seed);
  const conversion = buildEvidenceBackedConversionLines(category, featureA, featureB, seed);
  if (/サングラス|手袋|アームカバー|傘|帽子|財布|ストール|ベルト|腕時計|ヘアアクセサリー/.test(category)) {
    return pickCompatibleReviewLine([...variation.humans, ...conversion.humans, inferHumanLine(category, featureA, featureB, seed)], category, seed, "peripheral human");
  }
  const choices = [];
  const add = (pattern, lines) => {
    if (pattern.test(text)) choices.push(...lines);
  };

  add(/低身長|小柄|Sサイズ|ショート丈|短め丈/, [
    `丈が余りやすい小柄さんなら、身長別写真でバランスを想像しながら選べるとうれしいですよね🔍`,
    `小柄でも服に着られて見えないか気になる方は、着丈とウエスト位置まで見ておきたいです✨`,
  ]);
  add(/高身長|長身|トールサイズ/, [
    `丈が足りなくなりやすい高身長さんなら、しっかり長さが出るか着用写真を見たくなりますよね🔍`,
    `長め丈をきれいに楽しみたい方は、身長別レビューがあると選びやすそうです✨`,
  ]);
  add(/大きいサイズ|ゆったり|体型カバー|オーバーサイズ|ビッグシルエット/, [
    `体のラインは拾いたくないけれど、ただ大きく見える服も避けたい方に、このバランスは気になりますよね🫶`,
    `ゆったり着たい日も、肩や丈の落ち方がきれいだと安心して選べそうです💖`,
  ]);
  add(/通勤|オフィス|仕事|ビジネス/, [
    `朝は時間をかけられなくても、職場できちんと見せたい方にちょうどよさそうです✨`,
    `座る時間が長い仕事の日にも使うなら、シワ感や窮屈さまで確認したいですよね🔍`,
  ]);
  add(/ママ|公園|送迎|子ども|育児|学校行事/, [
    `動きやすさは欲しいけれど、送迎や買い物で生活感を出しすぎたくない日に頼れそうです🫶✨`,
    `子どもと一緒の日にも使うなら、汚れを気にしすぎず動けるかまで見て選びたいですよね💖`,
  ]);
  add(/旅行|トラベル|リゾート|旅先|旅行用/, [
    `旅行では荷物を増やしたくないから、着回せて写真にもきれいに残るものがうれしいですよね✨`,
    `移動の長い日にも使うなら、ラクさとシワの目立ちにくさを両方確かめたいです🫶`,
  ]);
  add(/洗える|ウォッシャブル|洗濯機|速乾|吸汗速乾/, [
    `気軽に洗える服なら、汗や汚れを気にしすぎず普段からたくさん着られそうです💖`,
    `お手入れの手間を減らしたい方には、可愛さだけでなく洗いやすさも大事ですよね✨`,
  ]);
  add(/敏感肌|綿100|コットン|オーガニック|チクチク|肌触り|低刺激/, [
    `肌に触れる時間が長いものだから、見た目だけでなく刺激の少なさまで気になりますよね🌿`,
    `肌が敏感な方も、刺激を気にしすぎず心地よく過ごせる素材だとうれしいですよね🌿`,
  ]);
  add(/幅広|甲高|外反母趾|クッション|歩きやすい|痛くない/, [
    `靴は可愛くても痛いと履かなくなるから、幅やクッションの感想まで知りたいですよね🔍`,
    `たくさん歩く日にも使いたい方なら、普段サイズとの比較レビューが頼りになりそうです✨`,
  ]);
  add(/金属アレルギー|ニッケルフリー|サージカルステンレス/, [
    `肌への負担が気になる方ほど、デザインだけでなく素材表記まで納得して選びたいですよね🌿`,
    `毎日身につけたいからこそ、自分の肌に合う素材か確認できると安心です🔍`,
  ]);
  add(/授乳|産前|産後|マタニティ|妊婦/, [
    `体型が変わる時期も、ラクさだけでなく自分らしく見える服を選びたいですよね🫶`,
    `産前産後まで使うなら、締め付け感や開き方を生活の場面まで想像して見たいです🔍`,
  ]);
  add(/結婚式|披露宴|二次会|お呼ばれ|セレモニー|卒入園|卒業|入学/, [
    `写真に残る日だから、周りになじみながらも自分らしく華やげるものを選びたいですよね💖`,
    `長く座る時間や移動もある日なら、見た目だけでなく過ごしやすさも気になります✨`,
  ]);
  add(/デート|女子会|食事会|記念日/, [
    `少し特別な日は、頑張りすぎて見えずに「今日いい感じ」と思える服がうれしいですよね💖`,
    `鏡を見た時に気分が上がって、写真にも自然に映えるものを選びたくなります✨`,
  ]);
  add(/冷房|UV|紫外線|日焼け|接触冷感|ひんやり/, [
    `暑さや冷房を我慢せず、見た目もきれいに整えたい日にこういう機能が頼れそうです🌿`,
    `季節の小さなストレスを減らしながら、おしゃれも楽しめるとうれしいですよね✨`,
  ]);
  add(/撥水|防水|レイン|雨/, [
    `天気が怪しい日も、濡れる心配ばかりせず好きなコーデで出かけたいですよね☁️`,
    `雨対策はしたいけれど、いかにも機能アイテムに見せたくない方に気になるデザインです✨`,
  ]);
  add(/ノンワイヤー|シームレス|脇高|補正|ナイトブラ|ランジェリー|ブラジャー/, [
    `毎日身につけるものだから、整って見えることと無理なく過ごせることを両方大切にしたいですよね🫶`,
    `見えない部分でも、自分に合う着け心地だと一日の気分が少し変わりそうです💖`,
  ]);
  add(/骨格ストレート|ストレート体型|Vネック|Iライン|ジャストサイズ/, [
    `上半身をすっきり見せたい骨格ストレートさんなら、首元と生地の厚みが気になりますよね✨`,
    `装飾を増やしすぎず、縦のラインが整う服だときれいに着やすそうです💖`,
  ]);
  add(/骨格ナチュラル|ナチュラル体型|ドロップショルダー|ワイドシルエット/, [
    `ゆったりした服が得意でも、だらしなく見えない落ち感は大切にしたいですよね🫶`,
    `骨格を拾いすぎないシルエットなら、肩の力を抜いたおしゃれを楽しめそうです✨`,
  ]);
  add(/骨格ウェーブ|ハイウエスト|フィットアンドフレア|プリーツ/, [
    `腰位置を高く見せたい方なら、ウエストの切り替え位置まで確認したくなりますよね🔍`,
    `上半身をコンパクトに見せながら、やわらかなシルエットを楽しめそうです💖`,
  ]);
  add(/イエベ春|スプリング|コーラル|アイボリー|黄み/, [
    `顔色を明るく見せたい方は、黄みを含んだやわらかな色か実物写真で確かめたいですよね✨`,
    `手持ちのベージュやゴールド小物になじむ色なら、コーデも組みやすそうです💖`,
  ]);
  add(/ブルベ夏|サマー|ラベンダー|くすみカラー|青みピンク/, [
    `やわらかな青みカラーが好きな方なら、顔まわりで色が強く出すぎないか見たいですよね✨`,
    `シルバー小物や淡いグレーになじむ色なら、上品にまとめやすそうです💖`,
  ]);
  add(/40代|50代|ミセス|大人世代|アラフォー|アラフィフ/, [
    `大人世代が着ても若作りに見えず、地味にもならないバランスがうれしいですよね✨`,
    `体型の変化を隠すだけでなく、今の自分をきれいに見せる服を選びたいです💖`,
  ]);
  add(/ぽっちゃり|プラスサイズ|3L|4L|5L|LLサイズ/, [
    `ゆとりは欲しいけれど、全体が大きく見えない切り替えや落ち感を選びたいですよね🫶`,
    `サイズが入るだけでなく、着た時に自分らしくきれいに見えるかが大切です✨`,
  ]);
  add(/産後|お腹まわり|腰まわり|ヒップカバー/, [
    `気になる部分を隠すことだけに寄せず、全体のバランスをきれいに見せたいですよね💖`,
    `体型が少し変わった時にも、無理なく今の自分になじむ服だとうれしいです🫶`,
  ]);
  add(/汗染み|汗じみ|防臭|抗菌|吸湿|通気性/, [
    `汗をかく日も人目を気にしすぎず、さらっと過ごせる服があると安心ですよね🌿`,
    `暑い日の外出に使うなら、見た目だけでなく汗や蒸れへの配慮も大切です✨`,
  ]);
  add(/静電気|帯電防止|毛玉防止|ピリング防止/, [
    `冬服は可愛くても静電気や毛玉が気になるから、長くきれいに着られるか見たいですよね🔍`,
    `お手入れの小さなストレスが少ない服ほど、普段から手に取りやすそうです✨`,
  ]);
  add(/防シワ|シワになりにくい|形態安定|ノーアイロン/, [
    `忙しい朝にアイロンの手間を減らせると、きれいめ服ももっと普段使いしやすいですよね✨`,
    `座り時間や移動が長い日も、シワを気にしすぎず過ごせるとうれしいです💖`,
  ]);

  choices.push(...variation.humans);
  choices.push(...conversion.humans);
  if (!choices.length) return inferHumanLine(category, featureA, featureB, seed);
  return pickCompatibleReviewLine(choices, category, seed, "reader empathy");
}

function emojiPaletteFor(category) {
  const palettes = [
    [/バッグ|財布/, ["👜", "🤎", "✨", "🛍️", "🤍", "💫"]],
    [/シューズ|レッグウェア/, ["👠", "👟", "🩰", "✨", "🤍", "💫"]],
    [/ヘアアクセサリー/, ["🎀", "🌸", "🪞", "✨", "🤍", "💗"]],
    [/アクセサリー|腕時計/, ["💍", "⌚", "💎", "✨", "🤍", "🌙"]],
    [/水際|浴衣/, ["🌴", "🌊", "👒", "🎐", "🫧", "✨"]],
    [/スポーツウェア/, ["🧘", "🏃", "🌿", "💪", "✨", "🫶"]],
    [/レインウェア|傘/, ["☔", "🌧️", "🌂", "🫧", "✨", "🤍"]],
    [/フォーマル|ブライダル|スーツ/, ["🥂", "💐", "🕊️", "✨", "🤍", "💎"]],
    [/ランジェリー|インナー|ルームウェア/, ["🫧", "🌙", "🪞", "🤍", "💗", "✨"]],
    [/マタニティ/, ["🌿", "🫶", "🤍", "🌸", "✨", "💗"]],
    [/帽子|サングラス|アームカバー/, ["👒", "🕶️", "☀️", "🌿", "✨", "🤍"]],
    [/ストール|手袋|ニット/, ["🧶", "🧣", "❄️", "🤍", "✨", "☕"]],
    [/ベルト/, ["🤎", "✨", "🪞", "🤍", "💫", "🖤"]],
    [/デニム/, ["👖", "💙", "✨", "👟", "🤍", "🫶"]],
    [/ワンピ|トップス|パンツ|スカート|カーデ|アウター|セットアップ|オールインワン/, ["👗", "🪞", "✨", "💗", "🤍", "🌿", "🫶", "💫"]],
  ];
  return (palettes.find(([pattern]) => pattern.test(String(category || ""))) || [null, ["✨", "💖", "🎀", "🤍", "🌿", "🫶", "💫"]])[1];
}

function endingEmoji(category, seed, slot) {
  return pickByHash(emojiPaletteFor(category), `${seed} emoji ${slot}`);
}

function coordEmoji(category, seed, index) {
  const starters = /シューズ|レッグウェア/.test(category)
    ? ["👠", "👟", "✨", "🩰"]
    : /バッグ|財布/.test(category)
      ? ["👜", "🛍️", "✨", "🤎"]
      : /水際|浴衣|傘|レイン/.test(category)
        ? ["🌴", "☔", "🎐", "✨"]
        : ["✨", "🪞", "💫", "🌿", "🫶"];
  return pickByHash(starters, `${seed} coord starter ${index}`);
}

function decoratePoint(point, index, category = "", seed = "") {
  const suffix = endingEmoji(category, seed, `point-${index}-${countChars(point)}`);
  return /[✨💖🎀👗💫🤍🫶♡◎👜🛍️👠👟🩰💍⌚💎🌙🌸🪞💗🌴🌊👒🎐🫧🧘🏃🌿💪☔🌧️🌂🥂💐🕊️🕶️☀️🧶🧣❄️☕🤎🖤👖💙]$/u.test(point) ? point : `${point}${suffix}`;
}

function diversifyPostEmojis(text, category, seed) {
  const protectedLinePrefixes = new RegExp(`^(?:${OPENING_EMOJI_SOURCE}“|✔|💫コーデ|🍀|🐾|#|・)`, "u");
  let lineIndex = 0;
  return String(text || "").split("\n").map((line) => {
    if (!line || protectedLinePrefixes.test(line)) return line;
    const nextEmoji = endingEmoji(category, seed, `body-${lineIndex++}`);
    return line.replace(/[✨💖🎀👗💫🤍🫶♡🌿💍👜👠🌴🎐🫧🌙💗☔💎]$/u, nextEmoji);
  }).join("\n");
}

function safePointFallbacks(category) {
  const groups = [
    [/バッグ/, ["商品写真でサイズ感を確認", "手持ち服に合わせやすい", "コーデの高見え小物に"]],
    [/シューズ/, ["サイズ感を確認したい", "足元から印象を変えやすい", "手持ち服との相性を確認"]],
    [/ランジェリー|インナー/, ["サイズ表を確認したい", "毎日使いやすいデザイン", "着け心地レビューを確認"]],
    [/アクセサリー|腕時計/, ["素材表記を確認したい", "シンプル服のアクセントに", "サイズ感を写真で確認"]],
    [/財布/, ["カード収納を確認したい", "毎日使いやすいデザイン", "実物の色味を見たい"]],
    [/傘|帽子|サングラス|手袋|アームカバー|ストール|ベルト/, ["サイズや仕様を確認したい", "普段の服になじみやすい", "実物の色味を見たい"]],
    [/ワンピ|トップス|パンツ|スカート|カーデ|アウター|セットアップ|オールインワン|デニム|ニット|スーツ/, ["サイズ感を確認したい", "手持ち服に合わせやすい", "着用写真を見て選びたい"]],
  ];
  return (groups.find(([pattern]) => pattern.test(category)) || [null, ["商品写真を確認したい", "使う場面を想像しやすい", "レビューも参考にしたい"]])[1];
}

function convertCheckPointToBenefit(point, category, seed) {
  const source = cleanText(point);
  const replacements = [
    [/商品写真でサイズ感を確認/g, "荷物がすっきり収まるサイズ感"],
    [/股上と丈感を確認/g, "脚長見えしやすい股上と丈感"],
    [/袖丈(?:を)?確認したい|袖丈(?:を)?確認|袖丈レビューを見たい/g, "絶妙な袖丈で華奢見え"],
    [/着丈(?:を)?確認したい|着丈(?:を)?確認/g, "すっきり見える絶妙な着丈"],
    [/丈感レビューを見たい|丈感(?:を)?確認したい|丈感(?:を)?確認|丈感を見て選びたい/g, "バランスよく見える丈感"],
    [/サイズ感レビューを見たい|サイズ感(?:を)?確認したい|サイズ感(?:を)?確認/g, "きれいに決まりやすいサイズ感"],
    [/歩きやすさ(?:を)?確認/g, "長時間も歩きやすい"],
    [/スマホ対応(?:を)?確認/g, "着けたままスマホ操作しやすい"],
    [/素材表記(?:を)?確認したい/g, "上品に見える素材感"],
    [/着用写真を見て選びたい/g, "着た時のきれいなシルエット"],
  ];
  let benefit = source;
  replacements.forEach(([pattern, replacement]) => {
    benefit = benefit.replace(pattern, replacement);
  });
  if (/確認したい|確認$|レビューを見たい|見て選びたい/.test(benefit)) {
    const fallback = [
      "毎日使いやすいデザイン",
      "届いた日から活躍しやすい",
      "大人っぽく高見えしやすい",
    ];
    return pickByHash(fallback, `${category} ${seed} ${source} benefit fallback`);
  }
  return benefit;
}

function inferPoints(category, features, seed) {
  const nonFashion = getNonFashionProfile(category);
  if (nonFashion) return uniquePick(nonFashion.points, `${seed} non-fashion points`, 3);
  const categoryCopy = inferCategoryCopy(category, features[0] || "", features[1] || "");
  if (category.includes("ランジェリー") || /ワンピ|トップス|パンツ|スカート|カーデ|アウター|バッグ|シューズ|アクセサリー|水際|フォーマル|ルームウェア|浴衣|マタニティ|インナー|帽子|財布|ファッション小物|スポーツウェア|レッグウェア|レインウェア|ブライダル|ヘアアクセサリー|セットアップ|オールインワン|デニム|ニット|スーツ|腕時計|ストール|ベルト|サングラス|手袋|アームカバー|傘/.test(category)) {
    const compatiblePoints = categoryCopy.points.filter((point) => isReviewLineCompatible(point, category, seed));
    return uniquePick([...compatiblePoints, ...safePointFallbacks(category)], seed, 3);
  }
  const pool = [
    "細見えしやすいシルエット",
    "高見えするデザイン",
    "着回し力が高い",
    "大人可愛い印象に",
    "通勤にも休日にも使える",
    "体型カバーしやすい",
    "写真映えしやすい",
    "こなれ感が出せる",
  ];
  if (features.join(" ").includes("UV")) pool.unshift("UV対策にも便利");
  if (features.join(" ").includes("洗える")) pool.unshift("自宅で洗えて扱いやすい");
  if (category.includes("パンツ")) pool.unshift("脚をすっきり見せやすい");
  if (category.includes("ワンピ")) pool.unshift("1枚でコーデが完成");
  if (category.includes("バッグ")) pool.unshift("コーデが高見えしやすい", "収納力もチェックしたい");
  if (category.includes("シューズ")) pool.unshift("足元から垢抜ける", "歩きやすさも期待");
  if (category.includes("アクセサリー")) pool.unshift("顔まわりが華やぐ", "高見え小物に");
  if (category.includes("水際")) pool.unshift("体型カバーしやすい", "水際コーデに便利");
  if (category.includes("フォーマル")) pool.unshift("行事にも使いやすい", "上品に高見え");
  if (category.includes("ランジェリー")) pool.unshift("響きにくい", "ラクな着け心地", "シルエットを整えやすい", "サイズ感を確認したい");
  if (category.includes("インナー")) pool.unshift("透け対策にも便利", "毎日使いやすい");
  pool.unshift(...categoryCopy.points);
  return uniquePick([...pool.filter((point) => isReviewLineCompatible(point, category, seed)), ...safePointFallbacks(category)], seed, 3);
}

function inferProductSpecificCoords(category, seed) {
  const text = String(seed || "");
  const has = (pattern) => pattern.test(text);

  if (category.includes("バッグ")) {
    if (has(/リュック|バックパック/)) return ["両手を空けたい旅行や通勤に", "スニーカー合わせの大人カジュアルに", "荷物が多い日のきれいめリュックとして", "公園やレジャーのお出かけに"];
    if (has(/かご|カゴ|ラフィア|ペーパー/)) return ["ワンピに合わせて夏のお出かけに", "デニムコーデへ季節感を足して", "リゾートや旅行の軽やかな小物に", "サンダルと合わせた休日コーデに"];
    if (has(/ミニバッグ|ミニバック|スマホショルダー|スマホポーチ|サコッシュ/)) return ["ワンピに合わせた身軽なお出かけに", "旅行先の貴重品バッグとして", "デニムコーデの小さなアクセントに", "食事や女子会のミニバッグに"];
    if (has(/A4|大容量|通勤|トート|ビジネス/)) return ["通勤コーデのきれいめバッグに", "A4や荷物が多い日の持ち歩きに", "ジャケットスタイルの高見え小物に", "仕事帰りのお出かけにも"];
    if (has(/ショルダー|斜めがけ|2WAY|3WAY/)) return ["ワンピに斜めがけして軽やかに", "両手を空けたい旅行や買い物に", "デニムコーデの高見え小物に", "通勤にも休日にも持ち方を変えて"];
  }

  if (category.includes("シューズ")) {
    if (has(/レイン|防水|撥水|雨|長靴/)) return ["雨の日の通勤やお出かけに", "撥水ボトムと合わせた梅雨コーデに", "旅行先の急な雨対策に", "きれいめ服を崩さない雨の日の足元に"];
    if (has(/サンダル|ミュール|サボ|クロッグ/)) return ["ワンピに合わせて軽やかな足元に", "ワイドパンツの抜け感づくりに", "リゾートや夏のお出かけに", "デニムコーデを女性らしく仕上げて"];
    if (has(/スニーカー|スリッポン/)) return ["ワンピやスカートの外しに", "デニムで大人カジュアルに", "旅行やたくさん歩く日に", "きれいめパンツへ抜け感を足して"];
    if (has(/パンプス|ヒール|バレエシューズ|メリージェーン/)) return ["通勤パンツをきれいめに仕上げて", "ワンピやスカートで上品なお出かけに", "お呼ばれや食事会の足元に", "デニムへ女性らしさを足して"];
    if (has(/ローファー|オックスフォード|モカシン/)) return ["パンツ合わせのきれいめ通勤に", "ソックス合わせで大人可愛く", "スカートをトラッドに仕上げて", "デニムコーデを品よく整えて"];
    if (has(/ブーツ/)) return ["ロングスカートで大人っぽく", "ワンピの秋冬コーデに", "細身パンツをすっきりまとめて", "タイツ合わせの防寒コーデに"];
  }

  if (category.includes("ランジェリー")) {
    if (has(/ナイトブラ|おやすみ|夜用|育乳/)) return ["就寝中のバストケアに", "おうち時間のリラックスインナーに", "旅行用のナイトインナーに", "洗い替えをそろえたい毎日の夜ケアに"];
    if (has(/サニタリー|吸水ショーツ|生理用/)) return ["デリケートな日の安心インナーに", "仕事や外出が長い日の備えに", "旅行中の予備ショーツとして", "就寝時の漏れ対策にも"];
    if (has(/ガードル|補正|ボディシェイパー|ウエストニッパー|骨盤/)) return ["ワンピの日のラインづくりに", "パンツスタイルをすっきり見せたい日に", "フォーマル服の補正インナーに", "薄手服の日の段差対策に"];
    if (has(/ストラップレス|チューブトップブラ|ヌーブラ|シリコンブラ/)) return ["オフショルや肩見せトップスのインナーに", "ドレスや背中開き服の下に", "夏の肌見せコーデの下着対策に", "旅行やイベント用の見せないインナーに"];
    if (has(/シームレス|ラインレス|響きにくい/)) return ["薄手トップスの日の響き対策に", "タイトなワンピやパンツの日に", "淡色コーデの下着ライン対策に", "毎日のきれいめ服のインナーに"];
  }

  if (category.includes("トップス")) {
    if (has(/ブラウス|シャツ/)) return ["きれいめパンツで通勤に", "デニムで大人カジュアルに", "ジャケットのインナーに", "フレアスカートで女性らしく"];
    if (has(/Tシャツ|カットソー|ロゴT/)) return ["デニムで定番の大人カジュアルに", "きれいめパンツで上品に外して", "スカート合わせで女性らしく", "ジャケットのインナーに"];
    if (has(/ニット|セーター/)) return ["きれいめパンツで通勤に", "ロングスカートで女性らしく", "デニムで休日の大人カジュアルに", "シャツを重ねたレイヤードに"];
    if (has(/ベスト|ジレ/)) return ["シャツに重ねてきれいめに", "ワンピへ重ねて縦ラインを強調", "Tシャツ合わせで大人カジュアルに", "通勤パンツのレイヤードに"];
  }

  if (category.includes("パンツ")) {
    if (has(/デニム|ジーンズ/)) return ["ブラウスで大人きれいめに", "Tシャツで休日カジュアルに", "ジャケット合わせで通勤寄りに", "ヒールで女性らしさを足して"];
    if (has(/ワイド|ガウチョ|バギー/)) return ["コンパクトトップスでバランスよく", "短丈カーデで脚長見えを狙って", "ブラウス合わせで通勤に", "スニーカーで抜け感を足して"];
    if (has(/テーパード|センタープレス|スラックス/)) return ["ブラウス合わせでオフィスに", "ロゴTで大人カジュアルに", "ジレ合わせで今っぽく", "パンプスできれいめに仕上げて"];
  }

  if (category.includes("スカート")) {
    if (has(/チュール|フリル|ティアード/)) return ["シンプルニットで甘さを調整して", "ロゴTで大人カジュアルに", "ジャケット合わせできれいめに", "スニーカーで軽やかに外して"];
    if (has(/タイト|ナロー|Iライン/)) return ["ゆるニットでメリハリをつけて", "ブラウス合わせで通勤に", "短丈トップスでバランスよく", "スニーカーで大人カジュアルに"];
    if (has(/フレア|プリーツ|マーメイド/)) return ["コンパクトトップスで上品に", "ゆるニットで抜け感を出して", "パンプスで女性らしいお出かけに", "ジャケット合わせで通勤寄りに"];
  }

  if (category.includes("ワンピース")) {
    if (has(/シャツワンピ/)) return ["1枚でベルトを合わせてきれいめに", "前を開けてパンツコーデの羽織りに", "スニーカーで大人カジュアルに", "パンプスで通勤寄りに"];
    if (has(/キャミワンピ|ジャンスカ/)) return ["シアートップスを重ねて", "Tシャツ合わせで休日に", "ブラウスで大人可愛く", "カーデを羽織って季節の変わり目に"];
    if (has(/ニットワンピ/)) return ["ロングブーツで秋冬のお出かけに", "ショート丈アウターでバランスよく", "華奢アクセで女性らしく", "スニーカーで抜け感を足して"];
  }

  if (category.includes("アクセサリー")) {
    if (has(/ピアス|イヤリング|イヤーカフ/)) return ["まとめ髪の日の顔まわりに", "シンプルニットの華やか足しに", "ワンピで食事や女子会に", "通勤服のさりげない高見え小物に"];
    if (has(/ネックレス|ペンダント|チョーカー/)) return ["無地トップスの首元に", "ワンピの仕上げに", "シャツの襟元からのぞかせて", "ジャケットコーデの華やか足しに"];
    if (has(/リング|指輪|ブレスレット|バングル/)) return ["通勤コーデの上品な手元に", "腕時計と重ねて華やかに", "ネイルと色を合わせて", "食事会や女子会の手元のアクセントに"];
  }

  return [];
}

function inferCoords(category, features, seed) {
  const nonFashion = getNonFashionProfile(category);
  if (nonFashion) return uniquePick(nonFashion.coords, `${seed} non-fashion coords`, 2);
  const categoryCopy = inferCategoryCopy(category, features[0] || "", features[1] || "");
  const productSpecificCoords = inferProductSpecificCoords(category, seed);
  if (productSpecificCoords.length >= 2) {
    return uniquePick(productSpecificCoords, `${seed} product specific coord`, 2);
  }
  if (category.includes("ランジェリー")) {
    const lingerieCoords = [
      "薄手トップスの日の響き対策に",
      "ナイトケアやおうち時間に",
      "きれいめ服の日のシルエット作りに",
      "淡色コーデの日の透け対策に",
      "旅行用の洗い替えインナーに",
      "ワンピやタイトめ服のライン対策に",
    ];
    return uniquePick([...categoryCopy.coords, ...lingerieCoords], `${seed} coord`, 2);
  }
  if (isFocusedCategory(category)) {
    return uniquePick(categoryCopy.coords, `${seed} category coord`, 2);
  }
  const common = [
    "ヒール合わせで上品なお出かけコーデに",
    "サンダルやミニバッグで軽やかな休日コーデに",
    "ジャケットを羽織って通勤にもきれいめに",
    "アクセを足してデートや女子会にも華やかに",
    "スニーカー合わせで抜け感のある大人カジュアルに",
  ];
  if (category.includes("パンツ")) common.unshift("ブラウス合わせでオフィスにも好印象に");
  if (category.includes("カーデ")) common.unshift("ノースリーブやワンピに羽織って冷房対策に");
  if (category.includes("スカート")) common.unshift("コンパクトトップス合わせでバランスよく");
  if (category.includes("バッグ")) common.unshift("ワンピや通勤コーデの高見え小物に", "淡色コーデの引き締め役にも");
  if (category.includes("シューズ")) common.unshift("パンツにもスカートにも合わせて足元から垢抜け", "通勤や休日のお出かけに");
  if (category.includes("アクセサリー")) common.unshift("シンプル服に足して顔まわりを華やかに", "デートや女子会の仕上げに");
  if (category.includes("水際")) common.unshift("水着の上に重ねて体型カバーに", "旅行やプールの写真映えコーデに");
  if (category.includes("フォーマル")) common.unshift("卒入園や学校行事に", "ジャケットやパール小物合わせに");
  if (category.includes("ランジェリー")) common.unshift("薄手トップスの日の響き対策に", "ナイトケアやおうち時間に", "きれいめ服の日のシルエット作りに");
  if (category.includes("インナー")) common.unshift("シアートップスやシャツの透け対策に", "おうち時間やワンマイルにも");
  common.unshift(...categoryCopy.coords);
  return uniquePick(common, `${seed} coord`, 2);
}

function inferFeatures(text) {
  const pairs = [
    ["ラッフル", "ラッフルデザイン"],
    ["フリル", "フリルデザイン"],
    ["プリーツ", "プリーツ切替"],
    ["シアー", "シアー素材"],
    ["UV", "UV対策"],
    ["接触冷感", "接触冷感素材"],
    ["リネン", "涼しげリネン素材"],
    ["ニット", "柔らかニット素材"],
    ["サマーニット", "涼しげニット素材"],
    ["デニム", "大人デニム素材"],
    ["ツイード", "高見えツイード素材"],
    ["チュール", "軽やかチュール素材"],
    ["ジョーゼット", "落ち感ジョーゼット素材"],
    ["サテン", "つや感サテン素材"],
    ["とろみ", "落ち感とろみ素材"],
    ["ストレッチ", "ストレッチ素材"],
    ["センタープレス", "センタープレス"],
    ["テーパード", "美脚テーパード"],
    ["ワイド", "体型カバーワイドシルエット"],
    ["ロング", "ロング丈"],
    ["マキシ", "マキシ丈"],
    ["Aライン", "Aラインシルエット"],
    ["2WAY", "2WAY仕様"],
    ["セットアップ", "セットアップ対応"],
    ["オールインワン", "オールインワン"],
    ["サロペット", "サロペットデザイン"],
    ["ジャンスカ", "ジャンスカデザイン"],
    ["キャミワンピ", "キャミワンピデザイン"],
    ["シャツワンピ", "シャツワンピデザイン"],
    ["ジレ", "きれいめジレ"],
    ["ベスト", "レイヤードベスト"],
    ["ジャケット", "きちんとジャケット"],
    ["ブルゾン", "軽羽織りブルゾン"],
    ["撥水", "撥水加工"],
    ["洗える", "自宅で洗える素材"],
    ["軽量", "軽量デザイン"],
    ["大容量", "収納力"],
    ["ショルダー", "ショルダー仕様"],
    ["トート", "トートデザイン"],
    ["パンプス", "きれいめパンプス"],
    ["サンダル", "抜け感サンダル"],
    ["スニーカー", "大人スニーカー"],
    ["ローファー", "きちんとローファー"],
    ["ピアス", "華やかアクセ"],
    ["ネックレス", "華やかアクセ"],
    ["金属アレルギー", "金属アレルギー対応"],
    ["サージカルステンレス", "サージカルステンレス"],
    ["ラッシュガード", "水際体型カバー"],
    ["水着", "水際デザイン"],
    ["セレモニー", "セレモニー対応"],
    ["卒入園", "卒入園対応"],
    ["ノンワイヤー", "ノンワイヤー"],
    ["ワイヤレス", "ワイヤレス"],
    ["楽ブラ", "楽ちんブラ"],
    ["脇高", "脇高設計"],
    ["シームレス", "響きにくいシームレス"],
    ["ラインレス", "響きにくいラインレス"],
    ["補正", "補正サポート"],
    ["ガードル", "補正ガードル"],
    ["ナイトブラ", "ナイトブラ"],
    ["ブラショーツ", "上下セット"],
    ["ブラセット", "上下セット"],
    ["ショーツ", "デイリーショーツ"],
    ["サニタリー", "サニタリー対応"],
    ["吸水", "吸水対応"],
    ["綿", "コットン素材"],
    ["谷間", "バストメイク"],
    ["盛れる", "バストメイク"],
    ["育乳", "バストサポート"],
    ["カップ付き", "カップ付き"],
    ["ブラトップ", "カップ付き"],
    ["ウエストゴム", "楽ちんウエスト"],
    ["ハイウエスト", "ハイウエスト"],
    ["フレア", "フレアシルエット"],
    ["マーメイド", "マーメイドシルエット"],
    ["Iライン", "Iラインシルエット"],
    ["スリット", "抜け感スリット"],
    ["パフ", "二の腕カバーパフ袖"],
    ["ボリューム袖", "二の腕カバー袖"],
    ["バルーン袖", "二の腕カバー袖"],
    ["フレンチスリーブ", "華奢見え袖"],
    ["ノースリーブ", "抜け感ノースリーブ"],
    ["Vネック", "すっきりVネック"],
    ["ペプラム", "腰まわりカバーペプラム"],
    ["リボン", "大人可愛いリボン"],
    ["五分袖", "二の腕カバー袖"],
    ["ドルマン", "二の腕カバードルマン"],
    ["ボーダー", "着映え柄"],
    ["花柄", "華やか柄"],
    ["ドット", "大人可愛い柄"],
    ["チェック", "きちんと柄"],
    ["帽子", "日差し対策"],
    ["キャップ", "こなれキャップ"],
    ["ハット", "小顔見えハット"],
    ["財布", "毎日使いやすい小物"],
    ["ミニ財布", "ミニバッグ対応"],
    ["ストール", "季節感小物"],
    ["ベルト", "ウエストマーク"],
    ["浴衣", "夏イベント映え"],
    ["マタニティ", "産前産後対応"],
    ["吸汗速乾", "吸汗速乾素材"],
    ["速乾", "乾きやすい素材"],
    ["ヨガ", "動きやすいヨガ仕様"],
    ["フィットネス", "動きやすいスポーツ仕様"],
    ["着圧", "着圧サポート"],
    ["レギンス", "すっきりレギンス"],
    ["タイツ", "デイリータイツ"],
    ["裏起毛", "あたたか裏起毛"],
    ["レイン", "雨の日対応"],
    ["防水", "防水仕様"],
    ["ポンチョ", "軽量ポンチョ"],
    ["お呼ばれ", "お呼ばれ対応"],
    ["結婚式", "ブライダル対応"],
    ["ヘアクリップ", "まとめ髪クリップ"],
    ["バレッタ", "華やかバレッタ"],
    ["シュシュ", "大人可愛いシュシュ"],
    ["カチューシャ", "顔まわり華やか"],
    ["セットアップ", "着回せるセットアップ"],
    ["オールインワン", "1枚で決まるオールインワン"],
    ["サロペット", "着回せるサロペット"],
    ["デニム", "大人デニム"],
    ["ジーンズ", "美脚ジーンズ"],
    ["セーター", "柔らかニット"],
    ["スーツ", "きちんと感のある仕立て"],
    ["腕時計", "上品な腕時計"],
    ["ストール", "華やかストール"],
    ["マフラー", "あたたかマフラー"],
    ["ベルト", "ウエストマークベルト"],
    ["サングラス", "顔になじむサングラス"],
    ["偏光", "偏光レンズ"],
    ["スマホ対応", "スマホ対応"],
    ["アームカバー", "紫外線対策アームカバー"],
    ["遮光", "高遮光仕様"],
    ["晴雨兼用", "晴雨兼用"],
    ["折りたたみ傘", "持ち歩ける折りたたみ傘"],
    ["汗染み防止", "汗染み防止素材"],
    ["防シワ", "シワになりにくい素材"],
    ["静電気防止", "静電気を抑える素材"],
    ["個包装", "配りやすい個包装"],
    ["小分け", "使いやすい小分け"],
    ["訳あり", "お得な訳あり"],
    ["国産", "国産素材"],
    ["無添加", "無添加タイプ"],
    ["低糖質", "低糖質"],
    ["糖質オフ", "糖質オフ"],
    ["グルテンフリー", "グルテンフリー"],
    ["冷凍", "冷凍ストック"],
    ["常温保存", "常温保存しやすい"],
    ["レンジ", "レンジ調理OK"],
    ["時短", "時短に便利"],
    ["大容量", "たっぷり容量"],
    ["ラベルレス", "ラベルレスで捨てやすい"],
    ["カフェインレス", "カフェインレス"],
    ["デカフェ", "デカフェ"],
    ["強炭酸", "強炭酸"],
    ["食洗機", "食洗機対応"],
    ["電子レンジ対応", "電子レンジ対応"],
    ["レンジ対応", "レンジ対応"],
    ["IH対応", "IH対応"],
    ["取っ手が取れる", "収納しやすい取っ手着脱"],
    ["焦げ付きにくい", "焦げ付きにくい加工"],
    ["詰め替え", "詰め替えしやすい"],
    ["まとめ買い", "まとめ買い向き"],
    ["敏感肌", "敏感肌にも選びやすい"],
    ["保湿", "保湿ケア"],
    ["毛穴", "毛穴ケア"],
    ["くすみ", "くすみケア"],
    ["ウォータープルーフ", "ウォータープルーフ"],
    ["石けんオフ", "石けんオフ"],
    ["コードレス", "コードレスで使いやすい"],
    ["静音", "静音設計"],
    ["コンパクト", "コンパクト設計"],
    ["省エネ", "省エネ設計"],
    ["USB充電", "USB充電"],
    ["折りたたみ", "折りたたみ収納"],
    ["省スペース", "省スペース設計"],
    ["積み重ね", "積み重ねOK"],
    ["引き出し", "出し入れしやすい引き出し"],
    ["滑り止め", "滑り止め付き"],
    ["洗える", "洗えて清潔"],
    ["撥水", "撥水加工"],
    ["防水", "防水仕様"],
    ["軽量", "軽量で扱いやすい"],
    ["安全設計", "安全設計"],
    ["名入れ", "名入れ対応"],
    ["知育", "知育にも使いやすい"],
  ];
  const inferredCategory = inferCategory(text);
const found = pairs.filter(([needle]) => text.includes(needle)).map(([, label]) => label)
    .filter((label) => {
      if (!/バッグ|財布|収納/.test(inferredCategory) && /収納力|ショルダー仕様|トートデザイン|ミニバッグ対応/.test(label)) return false;
      if (inferredCategory.includes("パンツ") && /デイリーショーツ|上下セット|カップ付き|バストメイク|脇高|補正|ナイトブラ/.test(label)) return false;
      return true;
    });
  const defaults = isNonFashionCategory(inferredCategory) ? [] : ["きれいめシルエット", "着回し力"];
  return [...new Set([...found, ...defaults])].slice(0, 4);
}

function buildTags(name, genreName, features, catchcopy = "", shopName = "") {
  const text = `${name} ${genreName} ${features.join(" ")} ${catchcopy} ${shopName}`;
  const category = resolveProductCategory(name, genreName, catchcopy);
  const nonFashion = getNonFashionProfile(category);
  if (nonFashion) {
    return dedupeText([
      ...saleTagsFor(text),
      `#${category.replace(/[・\s]/g, "")}`,
      ...nonFashion.tags,
      ...nonFashionSeoTagsFor(category, text),
      "#楽天ROOM",
      "#買ってよかった",
      "#便利グッズ",
      "#楽天購入品",
      "#暮らしを楽しむ",
    ]).slice(0, 12);
  }
  const tags = new Set();
  preferredTagsFor(text).forEach((tag) => tags.add(tag));
  ["#レディースファッション", "#30代ファッション", "#大人可愛い", "#きれいめ", "#高見え", "#着回しコーデ"].forEach((tag) => tags.add(tag));
  const brand = inferBrand(name, shopName);
  const brandTag = brand ? toHashTag(brand) : "";
  if (brandTag) tags.add(brandTag);
  saleTagsFor(text).forEach((tag) => tags.add(tag));
  if (category) tags.add(`#${category}`);
  seoTagsFor(category, text).forEach((tag) => tags.add(tag));
  return prioritizeTags(Array.from(tags), brand).slice(0, 12);
}

function saleTagsFor(text) {
  const tags = [];
  if (/楽天スーパーSALE|スーパーSALE|スーパーセール/i.test(text)) tags.push("#楽天スーパーSALE");
  if (/お買い物マラソン|買い回り|買いまわり/i.test(text)) tags.push("#お買い物マラソン");
  if (/タイムセール|TIME SALE|Time Sale/i.test(text)) tags.push("#タイムセール");
  if (/クーポン|coupon/i.test(text)) tags.push("#クーポン");
  if (/半額|50\s?%[ 　]*(OFF|オフ|割引)/i.test(text)) tags.push("#半額");
  if (/[1-9]\d?\s?%[ 　]*(OFF|オフ|割引)/i.test(text)) tags.push("#セール");
  if (/SALE|セール|値下げ|値引き|特価|バーゲン|アウトレット/i.test(text)) tags.push("#セール");
  if (/(ポイント|P)[ 　]*([2-9]|[1-9]\d)倍|ポイントアップ|ポイント還元|ポイントバック|DEAL|ディール/i.test(text)) tags.push("#ポイントアップ");
  if (/送料無料|送料込|送料込み|メール便無料/i.test(text)) tags.push("#送料無料");
  if (/期間限定|数量限定|在庫限り|残りわずか|先着|早割/i.test(text)) tags.push("#期間限定");
  return dedupeText(tags).slice(0, 3);
}

function prioritizeTags(tags, brand) {
  const brandTag = brand ? toHashTag(brand) : "";
  const saleTags = tags.filter((tag) => /^#(楽天スーパーSALE|お買い物マラソン|タイムセール|クーポン|半額|セール|ポイントアップ|送料無料|期間限定)$/.test(tag));
  const priority = [
    brandTag,
    ...saleTags,
    "#レディースファッション",
    "#30代ファッション",
    "#大人可愛い",
    "#きれいめ",
    "#楽天ROOM",
  ].filter(Boolean);
  return dedupeText([...priority, ...tags]);
}

function toHashTag(value) {
  const body = String(value || "")
    .replace(/[&＆]/g, "and")
    .replace(/[.\s・:：'’`´-]/g, "")
    .replace(/[^\p{Letter}\p{Number}_ぁ-んァ-ヶー一-龠々]/gu, "");
  return body ? `#${body}` : "";
}

function seoTagsFor(category, text) {
  const tags = [];
  if (/ワンピ/.test(category)) tags.push("#ワンピースコーデ", "#褒められワンピ", "#1枚で決まる", "#きれいめワンピ");
  if (/トップス/.test(category)) tags.push("#着映えトップス", "#大人トップス", "#着回しトップス", "#二の腕カバー");
  if (/パンツ/.test(category)) tags.push("#美脚パンツ", "#細見えパンツ", "#脚長効果", "#きれいめパンツ");
  if (/スカート/.test(category)) tags.push("#大人フェミニン", "#スカートコーデ", "#華奢見え", "#上品コーデ");
  if (/カーデ|アウター/.test(category)) tags.push("#羽織り", "#冷房対策", "#体型カバー", "#季節の変わり目");
  if (/バッグ/.test(category)) tags.push("#高見えバッグ", "#きれいめバッグ", "#収納力", "#通勤バッグ");
  if (/シューズ/.test(category)) tags.push("#きれいめシューズ", "#歩きやすい", "#痛くない靴", "#足元コーデ");
  if (/アクセサリー/.test(category)) tags.push("#高見えアクセ", "#華奢見え", "#金属アレルギー対応", "#大人アクセ");
  if (/ランジェリー|インナー/.test(category)) tags.push("#響きにくい", "#インナー", "#カップ付き", "#着心地重視");
  if (/水際/.test(category)) tags.push("#水際ファッション", "#リゾートコーデ", "#体型カバー水着", "#UV対策");
  if (/フォーマル/.test(category)) tags.push("#セレモニーコーデ", "#卒入園", "#オケージョン", "#きちんとコーデ");
  if (/ルームウェア/.test(category)) tags.push("#ルームウェア", "#おうち時間", "#リラックスウェア", "#大人可愛い部屋着");
  if (/浴衣/.test(category)) tags.push("#浴衣コーデ", "#夏祭り", "#花火大会", "#浴衣セット");
  if (/マタニティ/.test(category)) tags.push("#マタニティコーデ", "#産前産後", "#授乳服", "#楽ちんコーデ");
  if (/スポーツウェア/.test(category)) tags.push("#ヨガウェア", "#ジムウェア", "#吸汗速乾", "#動きやすい");
  if (/レッグウェア/.test(category)) tags.push("#レギンス", "#着圧", "#美脚見え", "#冷え対策");
  if (/レインウェア/.test(category)) tags.push("#雨の日コーデ", "#撥水", "#梅雨対策", "#レインウェア");
  if (/ブライダル/.test(category)) tags.push("#お呼ばれコーデ", "#結婚式コーデ", "#パーティードレス", "#上品ドレス");
  if (/ヘアアクセサリー/.test(category)) tags.push("#ヘアアレンジ", "#大人ヘアアクセ", "#まとめ髪", "#垢抜けヘア");
  if (/セットアップ/.test(category)) tags.push("#セットアップコーデ", "#着回しコーデ", "#時短コーデ", "#高見えコーデ");
  if (/オールインワン/.test(category)) tags.push("#オールインワンコーデ", "#楽ちんコーデ", "#体型カバー", "#大人カジュアル");
  if (/デニム/.test(category)) tags.push("#デニムコーデ", "#大人カジュアル", "#美脚デニム", "#こなれ感");
  if (/ニット/.test(category)) tags.push("#ニットコーデ", "#着映えニット", "#着膨れしない", "#大人ニット");
  if (/スーツ/.test(category)) tags.push("#通勤コーデ", "#きちんとコーデ", "#オフィスコーデ", "#セレモニー");
  if (/腕時計/.test(category)) tags.push("#腕時計", "#手元コーデ", "#高見え小物", "#大人小物");
  if (/ストール/.test(category)) tags.push("#ストールコーデ", "#冷房対策", "#紫外線対策", "#季節小物");
  if (/ベルト/.test(category)) tags.push("#ベルトコーデ", "#ウエストマーク", "#細見え", "#高見え小物");
  if (/サングラス/.test(category)) tags.push("#サングラス", "#紫外線対策", "#ブルーライトカット", "#アイウェア");
  if (/手袋/.test(category)) tags.push("#手袋", "#冬小物", "#冷え対策", "#スマホ対応");
  if (/アームカバー/.test(category)) tags.push("#アームカバー", "#UVカット", "#紫外線対策", "#冷感");
  if (/傘/.test(category)) tags.push("#晴雨兼用", "#日傘", "#遮光", "#雨の日グッズ");
  if (/接触冷感|冷感|UV|洗える|撥水/.test(text)) tags.push("#機能服");
  if (/淡色|ベージュ|アイボリー|白|エクリュ/.test(text)) tags.push("#淡色女子");
  if (/通勤|オフィス|仕事/.test(text)) tags.push("#オフィスカジュアル");
  if (/デート|女子会|お呼ばれ/.test(text)) tags.push("#デートコーデ");
  if (/骨格ウェーブ/.test(text)) tags.push("#骨格ウェーブ");
  if (/シアー|透け感/.test(text)) tags.push("#シアー", "#抜け感");
  if (/洗える|ウォッシャブル/.test(text)) tags.push("#洗える");
  if (/接触冷感|冷感/.test(text)) tags.push("#接触冷感");
  if (/撥水/.test(text)) tags.push("#撥水");
  if (/UV|紫外線/.test(text)) tags.push("#UVカット");
  if (/旅行|トラベル/.test(text)) tags.push("#旅行コーデ");
  if (/体型カバー/.test(text)) tags.push("#体型カバー");
  if (/高見え|上品/.test(text)) tags.push("#高見え");
  if (/クーポン|SALE|セール|送料無料|ポイント/.test(text)) tags.push("#お得情報");
  return tags;
}

function nonFashionSeoTagsFor(category, text) {
  const tags = [];
  if (/食品/.test(category)) tags.push("#お取り寄せ", "#時短ごはん", "#ストック食品", "#おうちごはん", "#ご褒美グルメ");
  if (/スイーツ/.test(category)) tags.push("#お取り寄せスイーツ", "#手土産", "#ご褒美スイーツ", "#個包装", "#ギフト");
  if (/飲料/.test(category)) tags.push("#ドリンク", "#まとめ買い", "#ストック", "#ラベルレス", "#おうちカフェ");
  if (/キッチン用品/.test(category)) tags.push("#キッチン用品", "#時短家事", "#便利グッズ", "#食洗機対応", "#買ってよかった");
  if (/日用品/.test(category)) tags.push("#日用品", "#まとめ買い", "#家事ラク", "#消耗品", "#ストック");
  if (/コスメ/.test(category)) tags.push("#コスメ", "#垢抜けメイク", "#時短メイク", "#プチプラコスメ", "#崩れにくい");
  if (/スキンケア/.test(category)) tags.push("#スキンケア", "#保湿ケア", "#毛穴ケア", "#敏感肌", "#毎日ケア");
  if (/家電/.test(category)) tags.push("#家電", "#便利家電", "#時短家電", "#コードレス", "#暮らしを整える");
  if (/美容家電/.test(category)) tags.push("#美容家電", "#おうち美容", "#セルフケア", "#時短美容", "#美活");
  if (/インテリア/.test(category)) tags.push("#インテリア", "#おしゃれインテリア", "#部屋作り", "#韓国インテリア", "#模様替え");
  if (/収納/.test(category)) tags.push("#収納", "#整理整頓", "#片付け", "#省スペース", "#クローゼット収納");
  if (/ベビー・キッズ/.test(category)) tags.push("#ベビー用品", "#キッズ用品", "#育児グッズ", "#入園準備", "#ママにおすすめ");
  if (/ペット用品/.test(category)) tags.push("#ペット用品", "#犬のいる暮らし", "#猫のいる暮らし", "#ペットグッズ", "#お世話グッズ");
  if (/健康/.test(category)) tags.push("#健康習慣", "#サプリ", "#セルフケア", "#プロテイン", "#毎日続けたい");
  if (/スポーツ・アウトドア/.test(category)) tags.push("#アウトドア", "#キャンプ用品", "#スポーツ用品", "#旅行グッズ", "#防災グッズ");
  if (/文房具/.test(category)) tags.push("#文房具", "#手帳時間", "#デスク周り", "#仕事道具", "#勉強垢");
  if (/おもちゃ/.test(category)) tags.push("#おもちゃ", "#知育玩具", "#プレゼント", "#親子時間", "#室内遊び");
  if (/個包装|小分け/.test(text)) tags.push("#個包装", "#配りやすい");
  if (/訳あり/.test(text)) tags.push("#訳あり", "#お得");
  if (/国産/.test(text)) tags.push("#国産");
  if (/冷凍/.test(text)) tags.push("#冷凍ストック");
  if (/時短/.test(text)) tags.push("#時短");
  if (/クーポン|SALE|セール|送料無料|ポイント/.test(text)) tags.push("#お得情報");
  return tags;
}

function preferredTagsFor(text) {
  const category = inferCategory(text);
  const rules = [
    ["#骨格ウェーブ", /骨格ウェーブ|ウェーブ|ハイウエスト|ウエスト|フレア|Aライン|プリーツ/],
    ["#高見え", /高見え|上品|きれいめ|大人|オフィス|通勤|ジャケット|ブラウス/],
    ["#褒められワンピ", /ワンピ|ドレス/],
    ["#二の腕カバー", /二の腕|袖|フレンチスリーブ|ドルマン|パフ|半袖|五分袖/],
    ["#痩せ見え", /痩せ見え|細見え|着痩せ|美シルエット|体型カバー|ワイド|ロング|縦ライン/],
    ["#カップ付き", /カップ付き|ブラトップ|カップイン|インナー付き/],
    ["#ノンワイヤー", /ノンワイヤー|ワイヤレス|楽ブラ|ブラレット/],
    ["#ナイトブラ", /ナイトブラ|おやすみブラ|夜用ブラ|育乳|バストケア/],
    ["#シームレス", /シームレス|ラインレス|縫い目なし|響きにくい|ひびきにくい/],
    ["#補正下着", /補正下着|補正|ボディシェイパー|シェイプ|着圧/],
    ["#ガードル", /ガードル|骨盤|ヒップアップ|補正ショーツ/],
    ["#サニタリーショーツ", /サニタリー|吸水|生理|防水布|羽根つき|羽根付き/],
    ["#脇高ブラ", /脇高|脇肉|脇すっきり/],
    ["#ブラショーツセット", /ブラショーツ|ブラセット|ショーツセット|上下セット/],
    ["#ランジェリー", /ランジェリー|ブラジャー|ブラショーツ|ショーツ|下着|レースブラ/],
    ["#響きにくい", /響きにくい|ひびきにくい|シームレス|ラインレス|透けにくい/],
    ["#バストケア", /バストケア|育乳|ナイトブラ|ホールド|バストメイク/],
    ["#シアー", /シアー|透け|チュール|オーガンジー/],
    ["#抜け感", /抜け感|スリット|Vネック|オープン|ゆる|リラックス|落ち感/],
    ["#大人ガーリー", /ガーリー|フリル|ラッフル|リボン|レース|チュール|フェミニン/],
    ["#セットアップ", /セットアップ|上下セット|2点セット|3点セット/],
    ["#接触冷感", /接触冷感|冷感|ひんやり|クール/],
    ["#きれいめ", /きれいめ|上品|通勤|オフィス|大人|ブラウス|センタープレス/],
    ["#垢抜け", /垢抜け|こなれ|トレンド|今っぽ|洒落|アシメ|アシンメトリー/],
    ["#淡色コーデ", /淡色|ベージュ|アイボリー|ホワイト|白|エクリュ|ライトグレー|ピンク/],
    ["#神アイテム", /ランキング|高評価|レビュー|万能|楽ちん|売れ|人気/],
    ["#水際ファッション", /水着|ラッシュガード|ビーチ|プール|海|水際|リゾート/],
    ["#洗える", /洗える|ウォッシャブル|自宅で洗える|洗濯機/],
    ["#撥水", /撥水|防水|レイン|雨/],
    ["#冷房対策", /冷房|羽織|カーデ|カーディガン|UV|薄手/],
    ["#美脚見え", /美脚|センタープレス|テーパード|脚長|パンツ|スラックス/],
    ["#旅行コーデ", /旅行|トラベル|シワ|しわ|軽量|リゾート/],
    ["#オフィスカジュアル", /通勤|オフィス|仕事|きちんと|ジャケット|ブラウス|センタープレス|ジレ/],
    ["#デートコーデ", /デート|女子会|お呼ばれ|ワンピ|スカート|華やか|レース|チュール/],
    ["#ママコーデ", /楽ちん|洗える|公園|送り迎え|体型カバー|ワンマイル|スニーカー/],
    ["#着痩せ", /着痩せ|細見え|体型カバー|Iライン|縦ライン|ペプラム|落ち感/],
    ["#華奢見え", /華奢|フレンチスリーブ|Vネック|抜け感|二の腕|ノースリーブ/],
    ["#チュール", /チュール|シアー|透け|オーガンジー/],
    ["#デニムコーデ", /デニム|ジーンズ|Gジャン/],
    ["#ジレコーデ", /ジレ|ベスト|レイヤード/],
    ["#大人可愛い", /大人可愛い|大人|可愛い|フェミニン|ガーリー|きれいめ/],
    ["#金属アレルギー対応", /金属アレルギー|サージカルステンレス|ニッケルフリー|アクセサリー|ピアス|ネックレス/],
    ["#UVカット", /UV|紫外線|日焼け|日よけ|遮蔽/],
    ["#卒入園", /卒入園|卒園|入園|卒業|入学|セレモニー|フォーマル/],
    ["#ヨガウェア", /ヨガ|ピラティス|フィットネス|ジムウェア|トレーニング/],
    ["#レギンス", /レギンス|トレンカ|タイツ/],
    ["#着圧", /着圧|むくみ対策/],
    ["#雨の日コーデ", /レインコート|レインウェア|雨具|レインブーツ|レインパンプス/],
    ["#お呼ばれコーデ", /結婚式|二次会|披露宴|お呼ばれ|ゲストドレス/],
    ["#ヘアアレンジ", /ヘアクリップ|バレッタ|シュシュ|カチューシャ|ヘアゴム|髪飾り/],
    ["#セットアップコーデ", /セットアップ|上下セット|ツーピース/],
    ["#オールインワンコーデ", /オールインワン|サロペット|ジャンプスーツ|コンビネゾン/],
    ["#ニットコーデ", /ニット|セーター|リブトップス/],
    ["#通勤コーデ", /スーツ|ビジネス|通勤|オフィス/],
    ["#手元コーデ", /腕時計|ウォッチ|リストウォッチ/],
    ["#ストールコーデ", /ストール|マフラー|スカーフ|ショール/],
    ["#ウエストマーク", /ベルト|サッシュベルト|ウエストベルト/],
    ["#紫外線対策", /サングラス|日傘|UV|紫外線|遮光/],
    ["#冬小物", /手袋|グローブ|マフラー/],
    ["#アームカバー", /アームカバー|UV手袋|日焼け防止手袋/],
    ["#晴雨兼用", /晴雨兼用|日傘|雨傘|折りたたみ傘/],
    ["#汗染み対策", /汗染み|汗じみ|防臭|吸湿|通気性/],
    ["#骨格ストレート", /骨格ストレート|ストレート体型/],
    ["#骨格ナチュラル", /骨格ナチュラル|ナチュラル体型/],
  ];
  return rules
    .filter(([, pattern]) => pattern.test(text))
    .map(([tag]) => tag)
    .filter((tag) => {
      if (category.includes("パンツ") && /^#(ランジェリー|ブラショーツセット|サニタリーショーツ|ガードル|補正下着|脇高ブラ|バストケア)$/.test(tag)) return false;
      if (tag === "#冬小物" && !/手袋|ストール|ファッション小物/.test(category)) return false;
      return true;
    });
}

function scoreItem({ reviewCount, reviewAverage, itemPrice, name, catchcopy, context }) {
  let score = 0;
  score += Math.min(35, Math.log10(reviewCount + 1) * 12);
  score += Math.max(0, reviewAverage - 3.5) * 18;
  if (itemPrice >= 2500 && itemPrice <= 12000) score += 18;
  if (itemPrice >= 1200 && itemPrice < 2500) score += 8;
  if (/送料無料|メール便|クーポン|ランキング|高評価|レビュー|売れ|人気|入賞/.test(`${name} ${catchcopy}`)) score += 14;
  if (/洗える|体型カバー|細見え|着痩せ|痩せ見え|美脚|UV|接触冷感|冷感|撥水|防水|吸汗速乾|着圧|軽量|ストレッチ/.test(`${name} ${catchcopy}`)) score += 16;
  if (/高見え|華奢見え|二の腕|脚長|小顔|褒められ|着映え|垢抜け|大人可愛い/.test(`${name} ${catchcopy}`)) score += 14;
  if (/ノンワイヤー|シームレス|脇高|ナイトブラ|補正|ガードル|サニタリー|ブラショーツ/.test(`${name} ${catchcopy}`)) score += 12;
  if (/30代|大人|きれいめ|通勤|オフィス|上品|フェミニン|韓国|淡色|デート|女子会/.test(`${name} ${catchcopy} ${context.keyword}`)) score += 13;
  if (/ワンピ|ブラウス|パンツ|スカート|カーデ|バッグ|パンプス|アクセサリー|ヨガ|レギンス|レイン|お呼ばれ|ヘアクリップ/.test(`${name} ${catchcopy}`)) score += 8;
  if (/訳あり|福袋|中古|キッズ|メンズ/.test(name)) score -= 30;
  return Math.max(0, Math.round(score));
}

function createNonFashionProfile(label, worries, benefits, details, points, coords, tags) {
  return {
    label,
    worries,
    leads: benefits.map((line, index) => `${line}${["✨", "💖", "🌿"][index % 3]}`),
    details: details.map((line, index) => `${line}${["◎", "✨", "💫"][index % 3]}`),
    sales: [
      `${label}は毎日の使いやすさが大切だから、仕様とレビューを比べて選びたいです✨`,
      `暮らしに取り入れやすい${label}なら、無理なく長く活躍してくれそうです💖`,
      `使う場面が想像できる${label}は、買ってから出番が増えやすいのが魅力です🌿`,
    ],
    clicks: [
      `容量・サイズ・使い方など、気になる仕様は商品ページで詳しく確認したいです🔍`,
      `実際に使った方の写真やレビューを見ると、自分に合うか想像しやすいです✨`,
      `セット内容やバリエーションまで比べて、いちばん使いやすいタイプを選びたいです💖`,
    ],
    trusts: [
      `毎日使うものだから、評価だけでなく具体的な使用感まで確認できると安心です◎`,
      `素材やお手入れ方法まで見ておくと、届いてからの使い方をイメージしやすいです◎`,
      `口コミのよかった点と気になる点を両方見ると、納得して選びやすいです🔍`,
    ],
    pushes: [
      `気になる方は、在庫と内容を早めにチェックしておきたいです✨`,
      `暮らしに合うか、商品ページの詳しい写真で確認してみてください🔍`,
      `比較候補に入れて、レビューまで見ておきたい${label}です💖`,
    ],
    humans: [
      `便利そうでも本当に使い続けられるか迷うから、リアルな使用感が分かるとうれしいですよね🫶`,
      `せっかく選ぶなら、見た目だけでなく扱いやすさにも納得できるものがいいですよね✨`,
      `毎日の小さな負担を減らせるものなら、暮らしに取り入れたくなりますよね🌿`,
    ],
    points,
    coords,
    tags,
  };
}

const NON_FASHION_PROFILES = {
  食品: createNonFashionProfile("食品", [
    "忙しい日は手軽に食べたいけど、味や満足感も妥協したくない…",
    "お取り寄せは気になるけど、量や食べ切りやすさが分からない…",
    "家族みんなで楽しめて、ストックにも便利なものを選びたい…",
  ], [
    "手軽さとおいしさを両立しやすく、忙しい日の食卓を頼もしく支えてくれます",
    "自宅にいながら特別感のある味を楽しめて、いつもの食事が少し華やぎます",
    "ストックしておくと、献立に迷った日やもう一品ほしい時にも頼れます",
  ], [
    "内容量や保存方法を確認しておけば、家族構成や食べるペースに合わせやすいです",
    "温め方やアレンジ例まで見ると、届いた後の楽しみ方が広がります",
    "個包装や小分けタイプなら、必要な分だけ使いやすいのもうれしいポイントです",
  ], ["手軽に楽しめる", "食卓の満足感アップ", "ストックにも便利", "アレンジしやすい", "家族で楽しみやすい"],
  ["忙しい日のごはんやもう一品に", "休日のご褒美ランチに", "家族や友人との食卓に", "冷蔵庫・冷凍庫の頼れるストックに"],
  ["#お取り寄せグルメ", "#時短ごはん", "#おうちごはん", "#楽天グルメ", "#ストック食品"]),
  スイーツ: createNonFashionProfile("スイーツ", [
    "自分へのご褒美が欲しいけど、甘すぎたり量が多すぎるのは困る…",
    "お取り寄せスイーツは見た目だけでなく、味にも満足したい…",
    "手土産にしたいけど、きちんと感と喜ばれる可愛さの両方が欲しい…",
  ], [
    "箱を開けた瞬間に気分が上がる華やかさで、おうち時間を特別にしてくれます",
    "ティータイムにちょうどいいご褒美感があり、忙しい日の気分転換にもぴったりです",
    "見た目にも映えるので、自宅用はもちろん手土産や贈り物にも選びやすいです",
  ], [
    "個数や賞味期限を確認すると、食べる人数や贈るタイミングに合わせやすいです",
    "冷凍・常温など保存方法まで見ておけば、好きな時に楽しみやすいです",
    "味の種類が選べるタイプなら、家族や友人とシェアする時間も盛り上がります",
  ], ["ご褒美感たっぷり", "見た目も華やか", "手土産にも選びやすい", "シェアして楽しめる", "おうちカフェにぴったり"],
  ["午後のご褒美ティータイムに", "来客時のお茶菓子に", "誕生日や記念日のデザートに", "大切な方への手土産に"],
  ["#お取り寄せスイーツ", "#ご褒美スイーツ", "#おうちカフェ", "#手土産", "#スイーツ好き"]),
  飲料: createNonFashionProfile("ドリンク", [
    "毎日飲むものだから、おいしさも続けやすさも大切にしたい…",
    "重い飲み物は買い物が大変。自宅にまとめて届けてほしい…",
    "気分転換できる飲み物が欲しいけど、種類が多くて迷う…",
  ], [
    "毎日の水分補給やほっとひと息つきたい時間に、気軽に取り入れられます",
    "まとめて届くタイプなら重い買い物の負担を減らし、ストック切れも防ぎやすいです",
    "味や香りを楽しめる一杯があると、おうち時間の満足感も自然に高まります",
  ], [
    "容量や本数を見比べると、飲む頻度や収納スペースに合うセットを選びやすいです",
    "カフェインや甘さ、原材料まで確認すれば、生活スタイルに合わせやすいです",
    "個包装や飲み切りサイズなら、職場や外出先にも持って行きやすいです",
  ], ["毎日続けやすい", "まとめ買いに便利", "気分転換にぴったり", "持ち運びやすい", "ストックしやすい"],
  ["朝の一杯や仕事の合間に", "家族の毎日の水分補給に", "来客時のおもてなしに", "外出や職場への持ち歩きに"],
  ["#ドリンク", "#水分補給", "#まとめ買い", "#おうちカフェ", "#ストック"]),
  キッチン用品: createNonFashionProfile("キッチン用品", [
    "料理を少しでもラクにしたいけど、使わなくなる道具は増やしたくない…",
    "キッチンが狭いから、出しっぱなしでも邪魔になりにくいものが欲しい…",
    "便利グッズは気になるけど、お手入れが面倒だと続かなそう…",
  ], [
    "毎日の調理や後片付けをスムーズにして、キッチンに立つ負担を軽くしてくれます",
    "使いやすさとすっきりした見た目を両立し、料理時間を心地よく整えてくれます",
    "ひとつで複数の使い方ができるタイプなら、道具を増やしすぎず効率も上げられます",
  ], [
    "サイズや対応熱源を確認すると、自宅のキッチンで使えるか判断しやすいです",
    "食洗機対応や分解して洗えるタイプなら、使用後のお手入れもラクになります",
    "収納方法までイメージして選ぶと、使いたい時にさっと取り出せます",
  ], ["調理を時短できる", "お手入れしやすい", "省スペースで使える", "見た目もすっきり", "毎日活躍しやすい"],
  ["毎日の下ごしらえや調理に", "作り置きやお弁当作りに", "休日のパン・お菓子作りに", "新生活のキッチン準備に"],
  ["#キッチン用品", "#時短家事", "#便利グッズ", "#料理好き", "#新生活"]),
  日用品: createNonFashionProfile("日用品", [
    "毎日使う消耗品は、品質もコスパもどちらも妥協したくない…",
    "かさばる日用品を買いに行くのが大変。まとめて届けてほしい…",
    "家事をラクにしたいけど、使い方が複雑なものは続かなそう…",
  ], [
    "毎日の家事や身支度に取り入れやすく、小さな手間を減らしてくれます",
    "まとめてストックできるタイプなら、買い忘れを減らして家事の余裕につながります",
    "使いやすさに配慮されたアイテムは、家族みんなで無理なく続けやすいです",
  ], [
    "容量や使用回数を比べると、交換頻度やコスパをイメージしやすいです",
    "香りや素材、使用できる場所まで確認すると暮らしに合うものを選べます",
    "収納スペースに収まるサイズか見ておけば、まとめ買いでもすっきり保管できます",
  ], ["毎日の家事がラクに", "まとめ買いに便利", "家族で使いやすい", "ストック切れを防げる", "扱いやすい設計"],
  ["毎日の掃除や洗濯に", "洗面所やバスルームで", "家族分のストックに", "新生活のまとめ買いに"],
  ["#日用品", "#家事ラク", "#まとめ買い", "#暮らしを整える", "#便利アイテム"]),
  コスメ: createNonFashionProfile("コスメ", [
    "気になるコスメは多いけど、自分の肌や好みに合うか不安…",
    "きれいに仕上げたいけど、忙しい朝に手間はかけられない…",
    "トレンド感は欲しいけど、大人でも使いやすい色を選びたい…",
  ], [
    "いつものメイクに取り入れるだけで、顔まわりを明るく今っぽい印象へ導いてくれます",
    "使いやすさと仕上がりの美しさを両立し、忙しい日のメイクにも頼れます",
    "大人の肌になじみやすい質感なら、頑張りすぎず自然な垢抜け感を楽しめます",
  ], [
    "色味や質感は、公式写真だけでなくレビュー画像まで見ると選びやすいです",
    "肌質やパーソナルカラーが近い方の口コミは、仕上がりを想像する参考になります",
    "使用順や落とし方まで確認すると、毎日のメイクに無理なく取り入れられます",
  ], ["垢抜けメイクに", "時短でもきれい", "大人も使いやすい", "持ち歩きにも便利", "気分が上がるデザイン"],
  ["毎日のナチュラルメイクに", "仕事の日のきちんとメイクに", "デートやお出かけメイクに", "旅行用コスメの見直しに"],
  ["#コスメ", "#垢抜けメイク", "#大人メイク", "#時短メイク", "#美容好き"]),
  スキンケア: createNonFashionProfile("スキンケア", [
    "乾燥やゆらぎが気になるけど、何を重ねればいいか分からない…",
    "毎日続けたいから、心地よさと手軽さのどちらも譲れない…",
    "口コミで人気でも、自分の肌に合うか慎重に選びたい…",
  ], [
    "毎日のケアに取り入れやすく、うるおいを守りながら健やかな肌印象を目指せます",
    "シンプルなステップで使えるアイテムなら、忙しい日もお手入れを続けやすいです",
    "心地よい使用感のケアは、自分をいたわる時間まで楽しみに変えてくれます",
  ], [
    "成分や使用方法、推奨される肌タイプまで確認して自分に合うか見極めたいです",
    "香りやテクスチャーの口コミを見ると、毎日続けやすい使用感か想像できます",
    "初めて使う場合は少量から試し、肌の様子を見ながら取り入れると安心です",
  ], ["毎日続けやすい", "うるおいケアに", "シンプルに使える", "心地よい使用感", "自分時間が充実"],
  ["朝晩のデイリーケアに", "乾燥が気になる季節の保湿に", "旅行やお泊まりのケアに", "自分へのご褒美美容に"],
  ["#スキンケア", "#保湿ケア", "#美容好き", "#自分磨き", "#おうち美容"]),
  家電: createNonFashionProfile("家電", [
    "便利な家電が欲しいけど、操作が難しかったり場所を取るのは困る…",
    "買っても使わなくならないよう、生活に本当に合うものを選びたい…",
    "機能が多すぎて違いが分からない。必要な機能を見極めたい…",
  ], [
    "毎日の家事や身支度を効率よく整え、時間にも気持ちにも余裕を作ってくれます",
    "分かりやすい操作と暮らしになじむサイズ感なら、家族みんなで使いやすいです",
    "必要な機能がしっかり揃った一台は、日々の小さなストレスを減らしてくれます",
  ], [
    "本体サイズ・消費電力・設置条件を確認すると、自宅で使えるか判断しやすいです",
    "お手入れ方法や交換部品まで見ておけば、購入後も長く使い続けやすいです",
    "音の大きさや操作感は、実際に使った方のレビューが参考になります",
  ], ["家事や身支度を時短", "操作が分かりやすい", "暮らしになじむ", "お手入れしやすい", "毎日使いやすい"],
  ["忙しい朝の時短に", "毎日の家事負担の軽減に", "在宅時間を快適に", "新生活の家電選びに"],
  ["#家電", "#時短家電", "#便利家電", "#暮らしを整える", "#新生活"]),
  美容家電: createNonFashionProfile("美容家電", [
    "サロン級のケアは気になるけど、家で無理なく続けられるか不安…",
    "美容家電が欲しいけど、操作やお手入れが複雑だと使わなくなりそう…",
    "短い時間でも、毎日のケアを少し丁寧にしたい…",
  ], [
    "自宅で好きな時間に使えて、いつもの美容時間を手軽にアップデートできます",
    "短時間で使いやすいタイプなら、忙しい日も無理なくセルフケアを続けられます",
    "使うたび気分が上がるデザインで、自分をいたわる習慣づくりにも役立ちます",
  ], [
    "使用できる部位や頻度、充電方法を確認すると生活に取り入れやすいです",
    "お手入れの手順や付属品まで見ておけば、購入後の負担を想像できます",
    "美容機器は説明書に従い、肌や髪の状態を見ながら無理なく使いたいです",
  ], ["おうち美容が充実", "短時間で使いやすい", "セルフケアを習慣化", "気分が上がる", "自分へのご褒美に"],
  ["夜のリラックスタイムに", "忙しい朝の身支度に", "週末のスペシャルケアに", "自分へのご褒美美容に"],
  ["#美容家電", "#おうち美容", "#セルフケア", "#自分磨き", "#美容好き"]),
  インテリア: createNonFashionProfile("インテリア", [
    "部屋をおしゃれにしたいけど、圧迫感が出たり今の家具から浮くのは避けたい…",
    "ネットで家具を選びたいけど、サイズ感や色味の違いが心配…",
    "生活感を抑えながら、毎日快適に使えるものが欲しい…",
  ], [
    "置くだけで空間の印象を整え、いつもの部屋を心地よくアップデートしてくれます",
    "見た目と使いやすさのバランスがよく、生活感を自然に抑えてくれます",
    "部屋になじむ色や素材を選べば、長く愛用しやすい落ち着いた空間を作れます",
  ], [
    "幅・奥行き・高さを設置場所と照らし合わせると、圧迫感や動線を確認できます",
    "素材や色味はレビュー写真まで見ると、手持ちの家具との相性を想像しやすいです",
    "組み立て方法やお手入れのしやすさも、長く使うために確認したいポイントです",
  ], ["部屋がすっきり見える", "暮らしになじむデザイン", "使いやすさも両立", "空間を手軽に模様替え", "長く愛用しやすい"],
  ["リビングの模様替えに", "寝室のリラックス空間に", "ワークスペースを整える時に", "新生活のお部屋作りに"],
  ["#インテリア", "#部屋づくり", "#暮らしを整える", "#模様替え", "#新生活"]),
  収納: createNonFashionProfile("収納アイテム", [
    "片付けてもすぐ散らかる。無理なく戻せる収納に変えたい…",
    "収納スペースが少ないから、デッドスペースまで上手に使いたい…",
    "すっきり見せたいけど、中身が分からなくなる収納は使いにくい…",
  ], [
    "散らかりやすい物の定位置を作り、片付けやすくすっきりした空間へ整えてくれます",
    "限られたスペースを効率よく使えて、毎日の探し物や出し入れを減らせます",
    "見せる収納にもなじむデザインなら、生活感を抑えながら使いやすさも保てます",
  ], [
    "収納したい物と設置場所を測っておくと、届いてからのサイズ違いを防げます",
    "積み重ねや仕切り調整ができるタイプなら、物が増えても使い方を変えられます",
    "中身の見え方や取り出し口まで確認すると、家族も戻しやすい収納になります",
  ], ["散らかりを防ぎやすい", "省スペースを活用", "出し入れしやすい", "生活感を抑えられる", "収納を調整しやすい"],
  ["クローゼットの整理に", "洗面所やキッチン収納に", "デスクまわりの片付けに", "新生活の収納づくりに"],
  ["#収納", "#整理整頓", "#片付け", "#暮らしを整える", "#省スペース"]),
  ベビー・キッズ: createNonFashionProfile("ベビー・キッズ用品", [
    "子どもが使うものだから、安全性も使いやすさも丁寧に選びたい…",
    "成長が早いから、今だけでなく少し長く使えるものが欲しい…",
    "親の負担を減らしながら、子どもも心地よく使えるものを探したい…",
  ], [
    "子どもの使いやすさに配慮され、毎日の育児やお出かけをやさしく支えてくれます",
    "成長に合わせて使い方を変えられるタイプなら、長く活躍してくれます",
    "親子どちらにも扱いやすい工夫が、忙しい育児の小さな負担を軽くしてくれます",
  ], [
    "対象年齢・サイズ・素材を確認し、子どもの成長段階に合うものを選びたいです",
    "洗い方やお手入れ方法まで見ておくと、汚れやすい時期にも使いやすいです",
    "安全上の注意や使用方法を確認して、必ず保護者の見守りのもとで使いたいです",
  ], ["親子で使いやすい", "成長に合わせやすい", "お手入れしやすい", "育児の負担を軽減", "毎日活躍しやすい"],
  ["毎日の育児やお世話に", "保育園・幼稚園の準備に", "家族でのお出かけに", "出産祝いや誕生日ギフトに"],
  ["#ベビー用品", "#キッズ用品", "#子育て", "#育児便利グッズ", "#出産祝い"]),
  ペット用品: createNonFashionProfile("ペット用品", [
    "大切な家族に使うものだから、快適さと安全性をしっかり選びたい…",
    "便利そうでも、うちの子が気に入って使ってくれるか心配…",
    "毎日のお世話を少しラクにしながら、清潔も保ちたい…",
  ], [
    "ペットの心地よさに配慮しながら、毎日のお世話をスムーズにしてくれます",
    "暮らしになじむ使いやすさで、飼い主さんの負担もやさしく減らせます",
    "体格や性格に合うものを選べば、ペットとの毎日をより快適に整えられます",
  ], [
    "対応する種類・体重・サイズを確認し、ゆとりや使用環境に合うものを選びたいです",
    "洗いやすさや交換部品まで見ておくと、清潔な状態を保ちやすいです",
    "初めて使う時は様子を見ながら慣らし、誤飲や事故がないよう見守りたいです",
  ], ["毎日のお世話がラクに", "ペットの快適さに配慮", "清潔を保ちやすい", "暮らしになじむ", "サイズを選びやすい"],
  ["毎日のごはんやケアに", "お散歩やお出かけに", "お留守番を快適に", "誕生日のプレゼントに"],
  ["#ペット用品", "#犬のいる暮らし", "#猫のいる暮らし", "#ペットと暮らす", "#便利グッズ"]),
  健康: createNonFashionProfile("健康アイテム", [
    "健康習慣を始めたいけど、面倒だと三日坊主になりそう…",
    "毎日使うものだから、無理なく続けられるかを大切にしたい…",
    "体に関わるものは、内容や使い方をきちんと確認して選びたい…",
  ], [
    "普段の生活に無理なく取り入れやすく、健やかな毎日を意識するきっかけになります",
    "続けやすさに配慮されたアイテムなら、自分のペースで健康習慣を整えられます",
    "忙しい日も手軽に使えることで、セルフケアを習慣にしやすくなります",
  ], [
    "使用方法や対象者、注意事項を確認し、自分の体調や生活に合うか判断したいです",
    "食品やサプリは原材料・栄養成分・摂取目安まで確認すると選びやすいです",
    "治療中・服薬中・妊娠中の場合は、必要に応じて医師や専門家へ相談したいです",
  ], ["健康習慣を始めやすい", "毎日続けやすい", "手軽に取り入れられる", "セルフケアに便利", "生活リズムを整えやすい"],
  ["朝晩の健康習慣に", "仕事や家事の合間のケアに", "運動後のセルフケアに", "家族の健康管理に"],
  ["#健康習慣", "#セルフケア", "#健康管理", "#ウェルネス", "#毎日続けたい"]),
  スポーツ・アウトドア: createNonFashionProfile("スポーツ・アウトドア用品", [
    "運動を始めたいけど、初心者でも扱いやすいものを選びたい…",
    "外で使うものだから、持ち運びや耐久性もしっかり確認したい…",
    "機能性は欲しいけど、準備や片付けが大変だと出番が減りそう…",
  ], [
    "使いやすい道具があると、運動や外遊びを始めるハードルをぐっと下げてくれます",
    "持ち運びや設営に配慮されたタイプなら、思い立った時に気軽に楽しめます",
    "必要な機能を備えたアイテムは、アクティブな時間をより快適に支えてくれます",
  ], [
    "サイズ・重量・耐荷重などを確認すると、使う人や場所に合うか判断しやすいです",
    "収納方法やお手入れまで見ておけば、使用後の片付けもイメージできます",
    "安全上の注意を確認し、用途やレベルに合った使い方をしたいです",
  ], ["初心者も使いやすい", "持ち運びに便利", "外時間が快適に", "準備しやすい", "運動習慣を応援"],
  ["おうちトレーニングに", "キャンプやピクニックに", "家族との外遊びに", "旅行やレジャーの準備に"],
  ["#スポーツ用品", "#アウトドア", "#おうちトレーニング", "#キャンプ用品", "#外遊び"]),
  文房具: createNonFashionProfile("文房具", [
    "仕事や勉強をはかどらせたいけど、使いにくい文具は増やしたくない…",
    "毎日使うものだから、機能性だけでなく気分が上がるデザインも欲しい…",
    "デスクまわりを整えて、探し物や小さなストレスを減らしたい…",
  ], [
    "使うたび気分が上がるデザインで、仕事や勉強の時間を心地よく整えてくれます",
    "手になじむ使いやすさが、書く・まとめる作業をスムーズにしてくれます",
    "デスク上をすっきり保てるアイテムなら、集中しやすい環境づくりにも役立ちます",
  ], [
    "サイズや用紙規格、替芯などの対応品を確認すると長く使いやすいです",
    "収納量や持ち運びやすさまで見ると、仕事用・学校用を選び分けられます",
    "色やデザインのバリエーションがあれば、用途別に揃えるのも楽しめます",
  ], ["仕事や勉強がはかどる", "毎日使いやすい", "デスクが整う", "持ち運びに便利", "気分が上がるデザイン"],
  ["仕事や在宅ワークに", "勉強や資格学習に", "手帳・ノート時間に", "入学・就職のギフトに"],
  ["#文房具", "#文具好き", "#手帳時間", "#デスク周り", "#勉強垢"]),
  おもちゃ: createNonFashionProfile("おもちゃ", [
    "子どもが夢中になれて、遊び方が広がるおもちゃを選びたい…",
    "プレゼントしたいけど、年齢に合うか、長く遊べるか迷う…",
    "楽しいだけでなく、親子で安心して遊べるものが欲しい…",
  ], [
    "遊びながら好奇心や想像力を刺激し、親子の楽しい時間を作ってくれます",
    "成長に合わせて遊び方を広げられるタイプなら、飽きにくく長く楽しめます",
    "ひとり遊びにも家族時間にも使えて、おうち時間を豊かにしてくれます",
  ], [
    "対象年齢や部品の大きさ、遊ぶためのスペースを確認して選びたいです",
    "片付け方や収納サイズまで見ておくと、遊んだ後も扱いやすいです",
    "安全上の注意を守り、年齢に応じて保護者が見守りながら楽しみたいです",
  ], ["夢中になって遊べる", "想像力を育みやすい", "親子時間が充実", "長く楽しみやすい", "ギフトに選びやすい"],
  ["雨の日のおうち遊びに", "家族で過ごす休日に", "誕生日や季節のプレゼントに", "帰省や旅行のお供に"],
  ["#おもちゃ", "#知育玩具", "#おうち遊び", "#子どものいる暮らし", "#誕生日プレゼント"]),
};

function getNonFashionProfile(category) {
  return NON_FASHION_PROFILES[String(category || "")] || null;
}

function isNonFashionCategory(category) {
  return Boolean(getNonFashionProfile(category));
}

function resolveProductCategory(name, genreName, catchcopy) {
  const nameCategory = inferCategory(name);
  if (nameCategory !== "レディースファッション") return nameCategory;
  return inferCategory(`${genreName || ""} ${catchcopy || ""}`);
}

function inferApparelCategorySignal(text) {
  const value = String(text || "");
  if (/水着|ラッシュガード|ビキニ|タンキニ|スイムウェア|水陸両用|ビーチウェア|リゾートワンピ/.test(value)) return "水際ファッション";
  if (/ルームウェア|パジャマ|ナイトウェア|ワンマイルウェア|ホームウェア/.test(value)) return "ルームウェア";
  if (/ブラジャー|ブラトップ|ランジェリー|インナー|キャミソール|タンクトップ|ペチコート|補正下着/.test(value)) return "インナー";
  if (/セットアップ|上下セット|2点セット|3点セット|コーデセット/.test(value)) return "セットアップ";
  if (/オールインワン|サロペット|ジャンプスーツ|コンビネゾン/.test(value)) return "オールインワン";
  if (/ワンピース|ワンピ|ドレス|ジャンスカ|キャミワンピ|シャツワンピ|ニットワンピ|ロングワンピ/.test(value)) return "ワンピース";
  if (/スカート|フレアスカート|タイトスカート|プリーツスカート|チュールスカート|キュロット/.test(value)) return "スカート";
  if (/デニム|ジーンズ|パンツ|スラックス|ワイドパンツ|テーパードパンツ|カーゴパンツ|レギパン|ガウチョ/.test(value)) return "パンツ";
  if (/カーディガン|カーデ|羽織り|ボレロ/.test(value)) return "カーディガン";
  if (/ジャケット|コート|ブルゾン|ジレ|ベスト|トレンチ|パーカー|ダウン|アウター/.test(value)) return "アウター";
  if (/ブラウス|シャツ|トップス|カットソー|Tシャツ|ニット|セーター|プルオーバー|チュニック|ベアトップ|ビスチェ/.test(value)) return "トップス";
  if (/レディースファッション|婦人服|服|衣服|洋服|きれいめ|大人可愛い|着回し|細見え|体型カバー|袖丈|着丈|丈感|骨格ウェーブ/.test(value)) return "レディースファッション";
  return "";
}

function isClothingReviewCategory(category) {
  return /レディースファッション|ワンピース|トップス|パンツ|スカート|カーディガン|アウター|ランジェリー|インナー|水際ファッション|フォーマル|ルームウェア|浴衣|マタニティ|スポーツウェア|レッグウェア|レインウェア|ブライダル|セットアップ|オールインワン|デニム|ニット|スーツ/.test(String(category || ""));
}

function inferFashionAccessoryCategorySignal(text) {
  const value = String(text || "");
  if (/サングラス|アイウェア|UVメガネ|伊達メガネ|だてメガネ|ブルーライトカット|PCメガネ|老眼鏡|リーディンググラス|メガネ(?!ケース)|眼鏡(?!ケース)/.test(value)) return "サングラス";
  if (/サングラスケース|メガネケース|眼鏡ケース/.test(value)) return "ファッション小物";
  return "";
}

function inferRakutenFashionCategorySignal(text) {
  const value = String(text || "");
  const isFashionStore = /Rakuten Fashion|RakutenFashion|journalstandard|JOURNAL STANDARD|ジャーナル\s*スタンダード|relume|レリューム|ベイクルーズ|BAYCREW/i.test(value);
  if (!isFashionStore) return "";
  if (/ワンピース|ワンピ|ドレス|ジャンスカ|オールインワン|ロンパース/.test(value)) return "ワンピース";
  if (/Tシャツ|Ｔシャツ|カットソー|トップス|シャツ|ブラウス|ニット|ポロシャツ|タンクトップ|ノースリーブ|スウェット|トレーナー|フーディー|パーカー|ベスト|ジレ/.test(value)) return "トップス";
  if (/パンツ|ショーツ|ショートパンツ|デニム|ジーンズ|スラックス|イージーパンツ|ハーフパンツ/.test(value)) return "パンツ";
  if (/スカート/.test(value)) return "スカート";
  if (/ジャケット|アウター|ブルゾン|コート|ブレザー|ジャンパー|カーディガン/.test(value)) return /カーディガン/.test(value) ? "カーディガン" : "アウター";
  if (/バッグ|トート|ショルダー|リュック|ポーチ/.test(value)) return "バッグ";
  if (/シューズ|靴|サンダル|スニーカー|ローファー|パンプス|ブーツ/.test(value)) return "シューズ";
  if (/アクセサリー|リング|指輪|ネックレス|ピアス|イヤリング|ブレスレット/.test(value)) return "アクセサリー";
  if (/ファッション雑貨|帽子|キャップ|ハット|サングラス|傘|ストール|ベルト|腕時計|財布/.test(value)) return inferFashionAccessoryCategorySignal(value) || "ファッション小物";
  return "";
}

function buildReviewCopySeed(category, seed) {
  let text = String(seed || "");
  if (isClothingReviewCategory(category)) return removeStorageContextForClothing(text);
  if (isNonFashionCategory(category)) return removeFashionContextForNonFashion(text);
  return text;
}

function removeStorageContextForClothing(text) {
  return String(text || "")
    .replace(/収納ボックス|収納ケース|衣装ケース|引き出し収納|収納用品|整理棚|収納袋|圧縮袋|ハンガーラック|突っ張り棚/g, " ")
    .replace(/収納力|収納写真|収納サイズ|収納スペース|収納しやすい|収納できる|収納付き|収納/g, " ")
    .replace(/大容量|A4|ポケット|マチ|荷物|ショルダー|トート|持ちやすさ|バッグ/g, " ");
}

function removeFashionContextForNonFashion(text) {
  return String(text || "")
    .replace(/きれいめシルエット|着回し力|細見え|痩せ見え|高見えコーデ|大人可愛いシルエット|二の腕|袖丈|着丈|丈感|骨格ウェーブ|ワンピース|ワンピ|トップス|スカート|パンツ|ニット|カーディガン|アウター|コーデ/g, " ")
    .replace(/顔まわり|華奢見え|体型カバー|抜け感|着回し|レディースファッション|30代ファッション/g, " ");
}

function isFashionFeatureNoise(feature) {
  return /きれいめシルエット|着回し力|細見え|痩せ見え|華奢見え|二の腕|袖丈|着丈|丈感|体型カバー|ワンピ|トップス|スカート|パンツ|ニット|カーディガン|アウター|コーデ|顔まわり|ウエストマーク|バストメイク|補正|脇高|シルエット/.test(String(feature || ""));
}

function isFocusedCategory(category) {
  return /バッグ|シューズ|アクセサリー|水際ファッション|フォーマル|ルームウェア|浴衣|マタニティ|インナー|帽子|財布|ファッション小物|スポーツウェア|レッグウェア|レインウェア|ブライダル|ヘアアクセサリー|セットアップ|オールインワン|デニム|ニット|スーツ|腕時計|ストール|ベルト|サングラス|手袋|アームカバー|傘/.test(String(category || ""));
}

function refineFeaturesForCategory(category, features) {
  const defaults = {
    ワンピース: ["1枚で決まるデザイン", "大人可愛いシルエット"],
    トップス: ["顔まわりが華やぐデザイン", "着回しやすいトップス"],
    パンツ: ["すっきり見えるライン", "動きやすい穿き心地"],
    スカート: ["女性らしいシルエット", "着回しやすい丈感"],
    カーディガン: ["さっと羽織れる軽さ", "冷房対策にも便利"],
    アウター: ["羽織るだけで整うデザイン", "季節の変わり目に便利"],
    バッグ: ["持つだけで高見え", "コーデになじむデザイン"],
    シューズ: ["足元から垢抜けるデザイン", "合わせやすいデザイン"],
    アクセサリー: ["顔まわりが華やぐデザイン", "高見えする素材感"],
    ランジェリー: ["毎日選びやすいデザイン", "着け心地を確認したい"],
    インナー: ["薄手服にも合わせやすい", "毎日使いやすい着心地"],
    水際ファッション: ["水際で映えるデザイン", "日差し対策にも便利"],
    フォーマル: ["行事に使えるきちんと感", "上品に見えるデザイン"],
    ブライダル: ["お呼ばれに映える華やかさ", "上品なドレスアップ"],
    ルームウェア: ["おうち時間に使いやすい", "生活感が出にくい可愛さ"],
    浴衣: ["夏イベントに映える柄", "セットで合わせやすい"],
    マタニティ: ["締め付けにくい着心地", "産前産後も使いやすい"],
    帽子: ["顔まわりになじむ形", "日差し対策にも便利"],
    財布: ["毎日使いやすい収納力", "バッグになじむサイズ感"],
    ファッション小物: ["コーデの印象を変える小物", "普段使いしやすいデザイン"],
    スポーツウェア: ["動きやすい設計", "普段にもなじむデザイン"],
    レッグウェア: ["脚をすっきり見せる", "毎日使いやすい履き心地"],
    レインウェア: ["雨の日に頼れる機能", "普段服になじむデザイン"],
    ヘアアクセサリー: ["まとめ髪が華やぐデザイン", "簡単に印象を変えられる"],
    セットアップ: ["統一感のあるセット", "単品でも着回せる"],
    オールインワン: ["縦ラインシルエット", "1枚で決まるデザイン"],
    デニム: ["大人デニム", "すっきりシルエット"],
    ニット: ["柔らかなニット素材", "着膨れしにくいシルエット"],
    スーツ: ["きちんと感のある仕立て", "動きやすい設計"],
    腕時計: ["上品な文字盤", "手元になじむデザイン"],
    ストール: ["柔らかな素材感", "持ち歩きやすい軽さ"],
    ベルト: ["ウエストマーク", "高見えする金具"],
    サングラス: ["顔になじむフレーム", "紫外線対策"],
    手袋: ["暖かな素材", "手元になじむデザイン"],
    アームカバー: ["紫外線対策", "蒸れにくい着け心地"],
    傘: ["持ち歩きやすい軽さ", "雨や日差しへの対策"],
    食品: ["手軽に楽しめるおいしさ", "ストックにも便利"],
    スイーツ: ["ご褒美感のある味わい", "見た目も華やか"],
    飲料: ["毎日続けやすい", "ストックしやすい"],
    キッチン用品: ["調理を助ける使いやすさ", "お手入れしやすい"],
    日用品: ["毎日の家事に便利", "扱いやすい設計"],
    コスメ: ["大人も使いやすい仕上がり", "メイクになじむ質感"],
    スキンケア: ["毎日続けやすい使用感", "うるおいケアに便利"],
    家電: ["暮らしを助ける機能", "分かりやすい操作"],
    美容家電: ["おうち美容に便利", "続けやすい使い心地"],
    インテリア: ["空間になじむデザイン", "暮らしやすい設計"],
    収納: ["すっきり片付く", "出し入れしやすい"],
    "ベビー・キッズ": ["親子で使いやすい", "成長に合わせやすい"],
    ペット用品: ["ペットの快適さに配慮", "毎日のお世話に便利"],
    健康: ["健康習慣に取り入れやすい", "毎日続けやすい"],
    "スポーツ・アウトドア": ["初心者も使いやすい", "持ち運びに便利"],
    文房具: ["仕事や勉強に便利", "毎日使いやすい"],
    おもちゃ: ["夢中になって遊べる", "親子で楽しみやすい"],
  };
  const key = Object.keys(defaults).find((label) => category.includes(label));
  if (!key) return Array.isArray(features) ? features : [];
  const excluded = {
    バッグ: /体型|背中|後ろ姿|肌見せ|二の腕|華奢見え袖|パフ袖|ボリューム袖|フレンチスリーブ|ノースリーブ|ドルマン|ウエスト|腰まわり|美脚|脚|パンツ|スカート|ワンピ|トップス|インナー|バスト|谷間|脇高|補正|ガードル|着圧|丈|シルエット|サンダル|パンプス|スニーカー|ローファー/,
    腕時計: /ウエストマーク|ベルトコーデ|細見えベルト/,
    ストール: /ウエストマーク|ベルト/,
    ベルト: /腕時計|文字盤/,
  }[key];
  const source = (Array.isArray(features) ? features : []).filter((feature) => {
    if (/きれいめシルエット|着回し力/.test(feature)) return false;
    if (isClothingReviewCategory(category) && /収納力|たっぷり容量|大容量|荷物|A4|ポケット|マチ|ショルダー仕様|トートデザイン|持ちやすさ|まとめやすい|個包装|小分け|レンジ調理|食洗機|IH対応|詰め替え|コードレス|静音設計/.test(feature)) return false;
    if (isNonFashionCategory(category) && isFashionFeatureNoise(feature)) return false;
    if (isNonFashionCategory(category) && !/収納|バッグ|財布/.test(category) && /収納力|ショルダー仕様|トートデザイン|ミニバッグ対応|ウエストマーク|華やかアクセ/.test(feature)) return false;
    return !excluded || !excluded.test(feature);
  });
  return [...new Set([...source, ...defaults[key]])].slice(0, 4);
}

function inferCategory(text) {
  const value = String(text || "");
  const rakutenFashionCategory = inferRakutenFashionCategorySignal(value);
  const apparelCategory = inferApparelCategorySignal(value);
  const accessoryCategory = inferFashionAccessoryCategorySignal(value);
  if (rakutenFashionCategory) return rakutenFashionCategory;

  // 非ファッション商品は、固有の商品語を優先してジャンルを分ける。
  if (/美顔器|フェイススチーマー|ヘアアイロン|ドライヤー|脱毛器|光美容器|美容ローラー|電動頭皮ブラシ|ヘッドスパ|電動シェーバー/.test(value)) return "美容家電";
  if (/化粧水|乳液|美容液|フェイスクリーム|クレンジング|洗顔|フェイスマスク|パック|日焼け止め|導入液|オールインワンジェル|スキンケア/.test(value)) return "スキンケア";
  if (/ファンデーション|リップ|口紅|アイシャドウ|マスカラ|アイライナー|チーク|コンシーラー|化粧下地|フェイスパウダー|メイクブラシ|コスメ|化粧品|ネイル/.test(value)) return "コスメ";
  if (/ケーキ|クッキー|チョコレート|チョコ|プリン|ゼリー|アイスクリーム|アイス|大福|羊羹|ようかん|どら焼き|フィナンシェ|マカロン|焼き菓子|和菓子|洋菓子|スイーツ|お菓子/.test(value)) return "スイーツ";
  if (/コーヒー|珈琲|紅茶|お茶|緑茶|ほうじ茶|ジュース|炭酸水|ミネラルウォーター|水\s|飲料|ドリンク|ワイン|ビール|日本酒|焼酎/.test(value)) return "飲料";
  if (/フライパン|鍋|包丁|まな板|ボウル|ざる|保存容器|水筒|タンブラー|マグカップ|食器|カトラリー|キッチンツール|調理器具|弁当箱/.test(value)) return "キッチン用品";
  if (/収納ボックス|収納ケース|衣装ケース|ラック|シェルフ|ハンガーラック|突っ張り棚|引き出し収納|圧縮袋|収納袋|収納用品|整理棚/.test(value)) {
    return apparelCategory || accessoryCategory || "収納";
  }
  if (/ソファ|テーブル|チェア|椅子|デスク|ベッド|マットレス|寝具|布団|枕|ラグ|カーペット|カーテン|照明|インテリア|家具|クッション/.test(value)) return "インテリア";
  if (/掃除機|洗濯機|冷蔵庫|電子レンジ|炊飯器|トースター|電気ケトル|空気清浄機|加湿器|除湿機|扇風機|サーキュレーター|イヤホン|スピーカー|家電/.test(value)) return "家電";
  if (/おむつ|オムツ|抱っこ紐|ベビーカー|チャイルドシート|ベビー用品|キッズ用品|離乳食|哺乳瓶|おしりふき|入園準備|ランドセル/.test(value)) return "ベビー・キッズ";
  if (/ドッグフード|キャットフード|ペットフード|犬用|猫用|ペットシーツ|猫砂|首輪|リード|キャットタワー|ペット用品/.test(value)) return "ペット用品";
  if (/プロテイン|サプリメント|サプリ|青汁|健康食品|健康器具|体温計|血圧計|マッサージ器|ストレッチ用品/.test(value)) return "健康";
  if (/テント|タープテント|ヘキサタープ|スクリーンタープ|ワンタッチタープ|寝袋|シュラフ|キャンプ|アウトドア|バーベキュー|BBQ|クーラーボックス|トレーニング器具|ダンベル|ヨガマット|スポーツ用品/.test(value)) return "スポーツ・アウトドア";
  if (/ボールペン|万年筆|シャープペン|筆箱|ペンケース|ノート|手帳|付箋|スタンプ|シール|文房具|文具|デスク用品/.test(value)) return "文房具";
  if (/積み木|ブロック|ぬいぐるみ|パズル|知育玩具|ボードゲーム|カードゲーム|おもちゃ|玩具|ラジコン|人形|ドール/.test(value)) return "おもちゃ";
  if (/ティッシュ|トイレットペーパー|洗剤|柔軟剤|漂白剤|スポンジ|ゴミ袋|掃除用品|洗濯用品|バス用品|タオル|歯ブラシ|日用品/.test(value)) return "日用品";
  if (/牛肉|豚肉|鶏肉|ハンバーグ|餃子|うなぎ|蟹|カニ|海鮮|魚介|米|食パン|菓子パン|パンセット|パン詰め合わせ|ベーカリー|麺|ラーメン|うどん|そば|カレー|惣菜|冷凍食品|レトルト|食品|グルメ/.test(value)) return "食品";

  // 商品そのものを示す語を、用途・着用シーンを示す語より優先する。
  if (/マタニティ|授乳口|授乳服|産前産後|妊婦服/.test(value)) return "マタニティ";
  if (/浴衣|ゆかた|浴衣セット|作り帯|兵児帯|帯飾り|下駄|甚平/.test(value)) return "浴衣";
  if (/ヘアクリップ|バレッタ|シュシュ|カチューシャ|ヘアゴム|ヘアアクセ|髪飾り|バンスクリップ|ヘアピン|ヘアカフ|ポニーフック|ヘアバンド|ターバン|コーム|かんざし|リボンクリップ|リボンバレッタ/.test(value)) return "ヘアアクセサリー";
  if (/ブラジャー|ブラショーツ|ブラセット|ショーツ|ランジェリー|下着|ナイトブラ|ノンワイヤー|ワイヤレス|脇高|補正下着|ガードル|サニタリー|シームレスブラ|育乳ブラ|レースブラ|おやすみブラ|ボディシェイパー|ブラレット|ヌーブラ|シリコンブラ|チューブトップブラ|ストラップレスブラ|谷間メイク|バストアップ|Tバック|タンガ|ヒップハンガー|ボディスーツ|ウエストニッパー|コルセット|骨盤ショーツ|補正ブラ|吸水ショーツ|サニタリーショーツ/.test(value)) return "ランジェリー";
  if (/カップ付きインナー|ブラトップ|カップ付きキャミ|カップ付きタンク|ペチコート|ペチパンツ|ペチワンピ|インナーキャミ|インナータンク|見せインナー|汗取りインナー|冷感インナー|あったかインナー|腹巻|ハラマキ|シェイパー|スリップ/.test(value)) return "インナー";
  if (/腕時計|ウォッチ|リストウォッチ|スマートウォッチ|ソーラーウォッチ|防水時計|レディース時計|時計ベルト|替えベルト/.test(value)) return "腕時計";
  if (/パンプス|サンダル|スニーカー|ローファー|ブーツ|シューズ|ミュール|バレエシューズ|フラットシューズ|靴|厚底|スリッポン|モカシン|オペラシューズ|オックスフォード|ドライビングシューズ|グルカサンダル|スポーツサンダル|ビーチサンダル|サボ|クロッグ|ショートブーツ|ロングブーツ|ムートンブーツ|レースアップシューズ|メリージェーン|ローヒール|ハイヒール|ウェッジソール|バックストラップ|ストラップサンダル/.test(value)) return "シューズ";
  if (/バッグ|トート|ショルダーバッグ|ハンドバッグ|リュック|ポーチ|クラッチ|ミニバッグ|ボストンバッグ|ボディバッグ|ウエストバッグ|サコッシュ|スマホショルダー|スマホポーチ|マザーズバッグ|エコバッグ|かごバッグ|カゴバッグ|巾着バッグ|バニティバッグ|バケツバッグ|A4バッグ|通勤バッグ|旅行バッグ|バックパック|メッセンジャーバッグ|サブバッグ|バッグインバッグ|ショルダーバック|ハンドバック|トートバック|ミニバック|ボストンバック|ボディバック|ウエストバック|マザーズバック|エコバック|かごバック|カゴバック|巾着バック|バニティバック|バケツバック|通勤バック|旅行バック|サブバック|バックインバック|かばん|鞄/.test(value)) return "バッグ";
  if (/財布|ミニ財布|長財布|ウォレット|カードケース|キーケース|コインケース|小銭入れ|名刺入れ|パスケース|定期入れ|キーリング|キーホルダー|スマートキーケース|フラグメントケース|マルチケース/.test(value)) return "財布";
  if (/帽子|キャップ|ハット|バケットハット|麦わら|サンバイザー|ベレー|ベレー帽|キャスケット|ニット帽|ワッチ|中折れハット|つば広|UV帽子|日よけ帽子|ハンチング/.test(value)) return "帽子";
  if (/レインコート|レインウェア|レインポンチョ|雨具|レインパンプス|レインブーツ|レインシューズ|レインスニーカー|撥水パーカー|撥水コート|防水ジャケット|ポンチョ|カッパ|合羽/.test(value)) return "レインウェア";
  if (/ベルト|サッシュベルト|ウエストベルト|細ベルト|太ベルト|ゴムベルト|メッシュベルト|レザーベルト|チェーンベルト/.test(value)) return "ベルト";
  if (/ピアス|イヤリング|ネックレス|指輪|リング|ブレスレット|アンクレット|ブローチ|サージカルステンレス|金属アレルギー対応|イヤーカフ|イヤカフ|チョーカー|ペンダント|バングル|チェーン|パールアクセ|淡水パール|ジュエリー|チャーム|ラリエット|ネックカフ|カフリング|トゥリング/.test(value)) return "アクセサリー";
  if (/サングラス|アイウェア|UVメガネ|伊達メガネ|だてメガネ|ブルーライトカット|PCメガネ|老眼鏡|リーディンググラス|メガネ(?!ケース)|眼鏡(?!ケース)/.test(value)) return "サングラス";
  if (/サングラスケース|メガネケース|眼鏡ケース|マスク|ファッションマスク|付け襟|つけ襟|アームウォーマー|レッグウォーマー|ネックウォーマー|イヤーマフ|インソール|靴紐|シューケア|バッグチャーム|スカーフリング/.test(value)) return "ファッション小物";
  if (/アームカバー|UV手袋|日焼け防止手袋|UVカット手袋|指穴アーム|冷感アーム|アームスリーブ/.test(value)) return "アームカバー";
  if (/手袋|グローブ|スマホ対応手袋|ミトン|ハンドウォーマー|フィンガーレス/.test(value)) return "手袋";
  if (/日傘|雨傘|晴雨兼用傘|折りたたみ傘|長傘|アンブレラ|折傘|折り畳み傘|完全遮光傘|遮光傘|ジャンプ傘|ビニール傘/.test(value)) return "傘";
  if (/ストール|マフラー|スカーフ|ショール|ティペット|ネックカバー|大判ストール|カシミヤストール|冷房対策ストール/.test(value)) return "ストール";
  if (/ファッション小物|雑貨/.test(value)) return "ファッション小物";

  if (/ヨガウェア|フィットネスウェア|トレーニングウェア|スポーツウェア|ランニングウェア|ジムウェア|ピラティスウェア|スポーツブラ|テニスウェア|ゴルフウェア|ダンスウェア|バレエウェア|ウォーキングウェア|スイムトレンカ|スポーツレギンス|ラッシュレギンス/.test(value)) return "スポーツウェア";
  if (/(ヨガ|フィットネス|トレーニング|ランニング|ジム|ピラティス).*(レギンス|パンツ|トップス|パーカー|セットアップ)/.test(value)) return "スポーツウェア";
  if (/レギンス|タイツ|ストッキング|靴下|ソックス|トレンカ|着圧ソックス|着圧レギンス|ハイソックス|フットカバー|カバーソックス|ルーズソックス|ニーハイ|レッグウォーマー|アームウォーマー|トゥレス|五本指ソックス/.test(value)) return "レッグウェア";
  if (/水着|ラッシュガード|ビキニ|タンキニ|スイムウェア|水陸両用|ワンピース水着|フィットネス水着|セパレート水着|水着セット|スイムショーツ|ボードショーツ|サーフパンツ|ビーチウェア|リゾートワンピ|ラッシュパーカー|ラッシュトレンカ/.test(value)) return "水際ファッション";
  if (/ルームウェア|パジャマ|部屋着|ナイトウェア|ワンマイルウェア|ホームウェア|リラックスウェア|ガウン|バスローブ|寝巻き|ネグリジェ|ルームワンピ|ルームパンツ/.test(value)) return "ルームウェア";
  if (/作り帯/.test(value)) return "ファッション小物";

  if (/(パーティー|ゲスト|お呼ばれ|結婚式|二次会|披露宴|ブライダル|同窓会|謝恩会).*(ドレス|ワンピ|セットアップ|パンツドレス|ボレロ|ショール)|(?:ドレス|ワンピ|セットアップ|パンツドレス|ボレロ|ショール).*(パーティー|ゲスト|お呼ばれ|結婚式|二次会|披露宴|ブライダル|同窓会|謝恩会)/.test(value)) return "ブライダル";
  if (/(卒入園|卒園|入園|卒業|入学|セレモニー|フォーマル|オケージョン|学校行事|七五三|参観日|面接|喪服|礼服|ブラックフォーマル).*(スーツ|ワンピ|セットアップ|ジャケット|パンツ|スカート|ブラウス)|(?:スーツ|ワンピ|セットアップ|ジャケット|パンツ|スカート|ブラウス).*(卒入園|卒園|入園|卒業|入学|セレモニー|フォーマル|オケージョン|学校行事|七五三|参観日|面接|喪服|礼服|ブラックフォーマル)/.test(value)) return "フォーマル";

  if (/セットアップ|上下セット|2点セット|3点セット|ツーピース|コーデセット|ニットアップ|スウェットセット|ルームセット|ジャケットセット|スカートセット|パンツセット/.test(value)) return "セットアップ";
  if (/オールインワン|サロペット|ジャンプスーツ|コンビネゾン|ロンパース|つなぎ|オーバーオール|キャミサロペット/.test(value)) return "オールインワン";
  if (/パンツスーツ|スカートスーツ|ビジネススーツ|レディーススーツ|スーツセット|セットスーツ|リクルートスーツ|洗えるスーツ|ノーカラースーツ/.test(value)) return "スーツ";
  if (/ワンピ|キャミワンピ|シャツワンピ|ジャンスカ|ドレス|ニットワンピ|カットソーワンピ|ティアードワンピ|マーメイドワンピ|ロングワンピ|ミニワンピ|チュニックワンピ|ワンピース/.test(value)) return "ワンピース";
  if (/デニムジャケット|デニムコート|Gジャン|ジージャン|ニットジャケット|ニットベスト|ダウン|中綿|MA-1|ライダース|モッズコート|チェスターコート|ノーカラーコート|トレンチコート|ボアジャケット|フリース|ケープ|ポンチョ|シャツジャケット|キルティング|マウンテンパーカー|ウインドブレーカー/.test(value)) return "アウター";
  if (/デニムスカート|ニットスカート|フレアスカート|タイトスカート|マーメイドスカート|プリーツスカート|チュールスカート|ナロースカート|ロングスカート|ミニスカート|スカパン|キュロットスカート/.test(value)) return "スカート";
  if (/デニムシャツ|デニムブラウス|ニットトップス|ニットプルオーバー|ニットカーデ/.test(value)) return /カーデ/.test(value) ? "カーディガン" : "トップス";
  if (/デニムパンツ|ジーンズ|ジーパン|ストレートデニム|スキニーデニム|ワイドデニム|フレアデニム|デニムサロペット/.test(value)) return "デニム";
  if (/ニット|セーター|リブトップス|リブニット|サマーニット|ニットベスト|ニットポロ|カシミヤニット|モヘアニット/.test(value)) return "ニット";
  if (/パンツ|デニム|ジーンズ|スラックス|テーパード|ワイドパンツ|ショートパンツ|カーゴパンツ|イージーパンツ|レギパン|スキニー|ガウチョ|キュロット|ジョガーパンツ|ストレートパンツ|フレアパンツ|リブパンツ|ハーフパンツ|ペインターパンツ|チノパン|サテンパンツ/.test(value)) return "パンツ";
  if (/ブラウス|シャツ|トップス|カットソー|Tシャツ|ロンT|ニット|プルオーバー|チュニック|ペプラム|キャミソール|タンクトップ|タンク|ノースリーブ|ベアトップ|チューブトップ|ボレロ|ビスチェ|ジレ|ベスト|スウェット|トレーナー|パーカー|ポロシャツ|シアートップス|メロウトップス|ボディスーツ/.test(value)) return "トップス";
  if (/カーデ|カーディガン|羽織り|羽織|ボレロカーデ|シアーカーデ/.test(value)) return "カーディガン";
  if (/スカート|フレアスカート|タイトスカート|マーメイドスカート|プリーツ|チュールスカート|ナロースカート|スカパン|キュロット/.test(value)) return "スカート";
  if (/ジャケット|コート|ブルゾン|ジレ|ベスト|トレンチ|パーカー|羽織り|羽織|ダウン|中綿|ケープ|ポンチョ|アノラック/.test(value)) return "アウター";
  if (/インナー/.test(value)) return "インナー";
  if (/アクセサリー/.test(value)) return "アクセサリー";
  return "レディースファッション";
}

function inferBrand(name, shopName) {
  const source = `${name || ""} ${shopName || ""}`;
  const normalized = normalizeBrandText(source);
  const brands = [
    ["SNIDEL", "スナイデル"],
    ["FRAY I.D", "フレイアイディー", "フレイid", "frayid"],
    ["Mila Owen", "ミラオーウェン"],
    ["LILY BROWN", "リリーブラウン"],
    ["gelato pique", "ジェラートピケ", "ジェラピケ"],
    ["CELFORD", "セルフォード"],
    ["FURFUR", "ファーファー"],
    ["emmi", "エミ"],
    ["styling/", "スタイリング"],
    ["RESEXXY", "リゼクシー"],
    ["rienda", "リエンダ"],
    ["ROYAL PARTY", "ロイヤルパーティー"],
    ["Darich", "ダーリッチ"],
    ["eimy istoire", "エイミーイストワール"],
    ["MERCURYDUO", "マーキュリーデュオ"],
    ["MURUA", "ムルーア"],
    ["EMODA", "エモダ"],
    ["LAGUNAMOON", "ラグナムーン"],
    ["GYDA", "ジェイダ"],
    ["Ungrid", "アングリッド"],
    ["dazzlin", "ダズリン"],
    ["jouetie", "ジュエティ"],
    ["EVRIS", "エヴリス"],
    ["merry jenny", "メリージェニー"],
    ["COCODEAL", "ココディール"],
    ["Noela", "ノエラ"],
    ["PROPORTION BODY DRESSING", "プロポーションボディドレッシング"],
    ["Apuweiser-riche", "アプワイザーリッシェ"],
    ["JUSGLITTY", "ジャスグリッティー"],
    ["Mystrada", "マイストラーダ"],
    ["Rirandture", "リランドチュール"],
    ["Arpege story", "アルページュストーリー"],
    ["tocco closet", "トッコクローゼット"],
    ["31 Sons de mode", "トランテアンソンドゥモード"],
    ["WILLSELECTION", "ウィルセレクション"],
    ["And Couture", "アンドクチュール"],
    ["LAISSE PASSE", "レッセパッセ"],
    ["Debut de Fiore", "デビュードフィオレ"],
    ["MISCH MASCH", "ミッシュマッシュ"],
    ["NATURAL BEAUTY BASIC", "ナチュラルビューティーベーシック"],
    ["FREE'S MART", "フリーズマート"],
    ["JILL by JILL STUART", "ジルバイジルスチュアート"],
    ["JILL STUART", "ジルスチュアート"],
    ["ROPE PICNIC", "ロペピクニック"],
    ["ROPE", "ロペ"],
    ["VIS", "ビス"],
    ["ADAM ET ROPE", "アダムエロペ"],
    ["URBAN RESEARCH", "アーバンリサーチ"],
    ["KBF", "ケービーエフ"],
    ["SENSE OF PLACE", "センスオブプレイス"],
    ["ROSSO", "ロッソ"],
    ["Sonny Label", "サニーレーベル"],
    ["nano universe", "ナノユニバース"],
    ["UNITED ARROWS", "ユナイテッドアローズ"],
    ["green label relaxing", "グリーンレーベルリラクシング"],
    ["BEAUTY&YOUTH", "ビューティアンドユース"],
    ["SHIPS", "シップス"],
    ["BEAMS", "ビームス"],
    ["Ray BEAMS", "レイビームス"],
    ["Demi-Luxe BEAMS", "デミルクスビームス"],
    ["TOMORROWLAND", "トゥモローランド"],
    ["MACPHEE", "マカフィー"],
    ["BALLSEY", "ボールジィ"],
    ["IENA", "イエナ"],
    ["SLOBE IENA", "スローブイエナ"],
    ["Spick & Span", "スピックアンドスパン"],
    ["NOBLE", "ノーブル"],
    ["FRAMeWORK", "フレームワーク"],
    ["JOURNAL STANDARD", "ジャーナルスタンダード"],
    ["Plage", "プラージュ"],
    ["Deuxieme Classe", "ドゥーズィエムクラス"],
    ["Whim Gazette", "ウィムガゼット"],
    ["GALLARDAGALANTE", "ガリャルダガランテ"],
    ["COLLAGE GALLARDAGALANTE", "コラージュガリャルダガランテ"],
    ["mystic", "ミスティック"],
    ["Kastane", "カスタネ"],
    ["Chico", "チコ"],
    ["Discoat", "ディスコート"],
    ["CIAOPANIC TYPY", "チャオパニックティピー"],
    ["LOWRYS FARM", "ローリーズファーム"],
    ["GLOBAL WORK", "グローバルワーク"],
    ["JEANASIS", "ジーナシス"],
    ["niko and", "ニコアンド"],
    ["studio CLIP", "スタディオクリップ"],
    ["apart by lowrys", "アパートバイローリーズ"],
    ["LEPSIM", "レプシィム"],
    ["Heather", "ヘザー"],
    ["PAGEBOY", "ページボーイ"],
    ["HARE", "ハレ"],
    ["RAGEBLUE", "レイジブルー"],
    ["earth music&ecology", "アースミュージックアンドエコロジー"],
    ["AMERICAN HOLIC", "アメリカンホリック"],
    ["Green Parks", "グリーンパークス"],
    ["CRAFT STANDARD BOUTIQUE", "クラフトスタンダードブティック"],
    ["YECCA VECCA", "イェッカヴェッカ"],
    ["coen", "コーエン"],
    ["SHOO LA RUE", "シューラルー"],
    ["index", "インデックス"],
    ["OPAQUE.CLIP", "オペークドットクリップ"],
    ["UNTITLED", "アンタイトル"],
    ["INDIVI", "インディヴィ"],
    ["grove", "グローブ"],
    ["Couture Brooch", "クチュールブローチ"],
    ["THE SHOP TK", "ザショップティーケー"],
    ["Honeys", "ハニーズ"],
    ["GRL", "グレイル"],
    ["coca", "コカ"],
    ["classicalelf", "クラシカルエルフ"],
    ["神戸レタス", "KOBE LETTUCE"],
    ["Pierrot", "ピエロ"],
    ["Re:EDIT", "リエディ"],
    ["and Me", "アンドミー"],
    ["titivate", "ティティベイト"],
    ["uricca", "ユリッカ"],
    ["osharewalker", "オシャレウォーカー"],
    ["Dark Angel", "ダークエンジェル"],
    ["SAISON DE PAPILLON", "セゾンドパピヨン"],
    ["aquagarage", "アクアガレージ"],
    ["for/c", "フォーシー"],
    ["antiqua", "アンティカ"],
    ["osharewalker", "オシャレウォーカー"],
    ["UNIQLO", "ユニクロ"],
    ["GU", "ジーユー"],
    ["しまむら"],
    ["ZARA", "ザラ"],
    ["H&M", "エイチアンドエム"],
    ["TITTY&CO.", "ティティーアンドコー"],
    ["NICE CLAUP", "ナイスクラップ"],
    ["OLIVE des OLIVE", "オリーブデオリーブ"],
    ["MAJESTIC LEGON", "マジェスティックレゴン"],
    ["RETRO GIRL", "レトロガール"],
    ["one after another NICE CLAUP", "ワンアフターアナザーナイスクラップ"],
    ["axes femme", "アクシーズファム"],
    ["Ank Rouge", "アンクルージュ"],
    ["EATME", "イートミー"],
    ["RANDA", "ランダ"],
    ["DIANA", "ダイアナ"],
    ["ORiental TRaffic", "オリエンタルトラフィック"],
    ["AmiAmi", "アミアミ"],
    ["SESTO", "セスト"],
    ["welleg", "ウェレッグ"],
    ["CHARLES & KEITH", "チャールズアンドキース"],
    ["Samantha Thavasa", "サマンサタバサ"],
    ["Samantha Vega", "サマンサベガ"],
    ["Jewelna Rose", "ジュエルナローズ"],
    ["russet", "ラシット"],
    ["TOPKAPI", "トプカピ"],
    ["Legato Largo", "レガートラルゴ"],
    ["anello", "アネロ"],
    ["ROOTOTE", "ルートート"],
    ["Wacoal", "ワコール"],
    ["Wing", "ウイング"],
    ["Triumph", "トリンプ"],
    ["AMOSTYLE", "アモスタイル"],
    ["PEACH JOHN", "ピーチジョン"],
    ["tu-hacci", "ツーハッチ"],
    ["BRADELIS New York", "ブラデリスニューヨーク"],
    ["aimerfeel", "エメフィール"],
    ["Risa Magli", "リサマリ"],
    ["une nana cool", "ウンナナクール"],
  ];
  const matched = brands.find(([canonical, ...aliases]) => {
    return [canonical, ...aliases].some((alias) => source.includes(alias) || normalized.includes(normalizeBrandText(alias)));
  });
  return matched ? matched[0] : "";
}

function normalizeBrandText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[&＆]/g, "and")
    .replace(/[.\s・:：'’`´/_-]/g, "")
    .replace(/[^\p{Letter}\p{Number}ぁ-んァ-ヶー一-龠々]/gu, "");
}

function pickByHash(choices, seed) {
  const list = choices.filter(Boolean);
  const value = Array.from(String(seed || "")).reduce((sum, char) => sum + char.codePointAt(0), 0);
  return list[value % list.length];
}

function uniquePick(choices, seed, count) {
  const result = [];
  let offset = 0;
  while (result.length < count && result.length < choices.length) {
    const picked = pickByHash(choices, `${seed} ${offset}`);
    if (!result.includes(picked)) result.push(picked);
    offset += 1;
  }
  return result;
}

function normalizeImageUrl(url) {
  return String(url || "").replace(/\?_ex=\d+x\d+$/, "");
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function dedupeBy(items, getKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function countChars(text) {
  return String(text || "").length;
}

function truncateText(text, maxLength) {
  const chars = Array.from(String(text || ""));
  return chars.length <= maxLength ? chars.join("") : `${chars.slice(0, maxLength - 1).join("")}…`;
}

  function generateFromInfo(info) {
    const name = cleanText(info && info.title) || "\u5546\u54c1";
    const catchcopy = cleanText(info && info.description);
    const shopName = cleanText(info && info.shopName);
    const genreName = inferCategory(`${name} ${catchcopy}`);
    const features = inferFeatures(`${name} ${catchcopy} ${genreName}`);
    const targetTags = buildTags(name, genreName, features);
    return generatePostText({ name, shopName, genreName, features, targetTags, catchcopy, variationSeed: info && info.variationSeed });
  }

  window.RoomReviewGenerator = {
    generateFromInfo,
    generatePostText,
    inferFeatures,
    buildTags,
    inferCategory,
  };
})();
