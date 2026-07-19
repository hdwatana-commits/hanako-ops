(function () {
  "use strict";

  const DAY_MS = 24 * 60 * 60 * 1000;
  const IMAGE_SCORE_FIELDS = [
    "highLooking",
    "snsAppeal",
    "seasonFit",
    "adultCute",
    "koreanMood",
    "naturalMood",
    "feminine",
    "travelFit",
    "dateFit",
    "officeFit",
    "roomFit",
  ];

  const THEMES = [
    { id: "travel", label: "旅行", scene: "海外旅行", background: "海外の街並み", copyType: "旅先でも着回せる" },
    { id: "office", label: "通勤", scene: "通勤", background: "明るいカフェ前", copyType: "きれいめ通勤" },
    { id: "date", label: "デート", scene: "デート", background: "ホテルラウンジ", copyType: "上品に可愛い" },
    { id: "cafe", label: "カフェ", scene: "友達とカフェ", background: "白い窓辺", copyType: "高見えカフェ" },
    { id: "weekend", label: "週末", scene: "休日ショッピング", background: "おしゃれな路地", copyType: "楽なのに可愛い" },
    { id: "weather", label: "気温差", scene: "冷房対策", background: "駅前テラス", copyType: "温度調整できる" },
    { id: "wave", label: "骨格ウェーブ", scene: "スタイルアップ", background: "明るい室内", copyType: "重心アップ" },
  ];

  const HAIRSTYLES = ["外ハネボブ", "ゆる巻きミディアム", "低めポニーテール", "ハーフアップ", "ふんわり三つ編み", "シースルーバング"];
  const POSES = ["軽く歩く", "バッグを持って振り向く", "鏡前で整える", "片手を腰に添える", "カフェ前で微笑む", "スカートの揺れを見せる"];

  function buildAgentRun(context = {}) {
    const products = (context.selectionItems?.length ? context.selectionItems : context.products || []).filter(Boolean);
    const evaluated = products.map((product) => evaluateProduct(product, context));
    const ranked = evaluated.sort((a, b) => b.aiTotalScore - a.aiTotalScore).slice(0, 30);
    const plans = ranked.map((evaluation, index) => buildPostPlan(evaluation.product, evaluation, context, index));
    const reposts = proposeReposts(context.products || [], context.posts || [], context.salesResults || []);
    const salesInsight = buildSalesInsight(context.performanceAggregates || [], context.scoreAdjustments || []);
    const schedule = buildSchedule(plans, context.calendar || []);
    return {
      id: stableHash(`phase3:${dateKey(new Date())}:${products.length}`),
      generatedAt: new Date().toISOString(),
      evaluations: ranked,
      plans,
      reposts,
      salesInsight,
      collectionSuggestions: proposeNewCollections(ranked, context.collections || [], context),
      weeklyReport: buildAiReport(salesInsight, reposts, plans, context),
      schedule,
      tasks: buildTasks(plans, reposts, salesInsight, context),
    };
  }

  function evaluateProduct(product, context = {}) {
    const text = normalizeText([product.name, product.category, product.hook, product.details?.brand, product.details?.material, product.details?.color].join(" "));
    const hasImage = Boolean(product.image || product.mainImageUrl);
    const price = number(product.price);
    const base = product.salePotentialScore || product.ops?.salePotentialScore || 62;
    const scores = {
      highLooking: clamp(55 + keyword(text, ["高見え", "上品", "きれいめ", "レース", "サテン", "パール"]) * 8 + (price >= 2500 && price <= 7999 ? 10 : 0), 0, 100),
      snsAppeal: clamp(48 + (hasImage ? 18 : -8) + keyword(text, ["フリル", "リボン", "花柄", "映え", "主役", "ワンピ"]) * 8, 0, 100),
      seasonFit: clamp(54 + keyword(text, ["冷感", "UV", "リネン", "半袖", "サンダル", "カーデ", "羽織"]) * 7, 0, 100),
      adultCute: clamp(52 + keyword(text, ["大人", "可愛い", "ガーリー", "甘め", "淡色", "リボン"]) * 8, 0, 100),
      koreanMood: clamp(45 + keyword(text, ["韓国", "シアー", "クロップド", "ミニ", "淡色"]) * 9, 0, 100),
      naturalMood: clamp(45 + keyword(text, ["ナチュラル", "綿", "リネン", "ゆったり", "ベージュ", "生成"]) * 9, 0, 100),
      feminine: clamp(50 + keyword(text, ["フリル", "レース", "花柄", "スカート", "ワンピ", "パール"]) * 8, 0, 100),
      travelFit: clamp(46 + keyword(text, ["シワ", "洗える", "軽い", "旅行", "歩きやすい", "UV"]) * 9, 0, 100),
      dateFit: clamp(50 + keyword(text, ["ワンピ", "レース", "華奢", "上品", "淡色", "揺れ"]) * 8, 0, 100),
      officeFit: clamp(48 + keyword(text, ["通勤", "オフィス", "ブラウス", "パンツ", "ジャケット", "きれいめ"]) * 8, 0, 100),
      roomFit: clamp(base * 0.55 + (hasImage ? 18 : 0) + keyword(text, ["ランキング", "クーポン", "レビュー", "高見え", "洗える"]) * 5, 0, 100),
    };
    const aiTotalScore = Math.round(IMAGE_SCORE_FIELDS.reduce((sum, field) => sum + scores[field], 0) / IMAGE_SCORE_FIELDS.length);
    return {
      id: product.id,
      product,
      scores,
      aiTotalScore,
      rank: aiTotalScore >= 86 ? "S" : aiTotalScore >= 76 ? "A" : aiTotalScore >= 66 ? "B" : "C",
      reasons: buildEvaluationReasons(product, scores, hasImage),
      evidence: {
        productName: product.name,
        category: product.category,
        imageUrl: product.image || product.mainImageUrl || "",
        salePotentialScore: product.salePotentialScore || product.ops?.salePotentialScore || null,
        operationPriorityScore: product.operationPriorityScore || product.ops?.operationPriorityScore || null,
      },
      visionPrompt: buildVisionPrompt(product),
      createdAt: new Date().toISOString(),
    };
  }

  function buildPostPlan(product, evaluation, context = {}, index = 0) {
    const theme = chooseTheme(product, evaluation, index);
    const coordinate = buildCoordinate(product, evaluation, context, theme, index);
    const imagePrompt = buildImagePrompt(product, evaluation, coordinate, theme);
    const copyBundle = buildCopyBundle(product, evaluation, coordinate, theme);
    const collectionCandidates = buildCollectionCandidates(product, evaluation, context.collections || [], theme);
    return {
      id: stableHash(`ai-plan:${product.id}:${dateKey(new Date())}`),
      productId: product.id,
      productName: product.name,
      aiRank: evaluation.rank,
      aiTotalScore: evaluation.aiTotalScore,
      status: "needs_approval",
      theme,
      coordinate,
      imageJob: {
        id: stableHash(`image:${product.id}:${theme.id}:${dateKey(new Date())}`),
        status: "waiting",
        provider: context.aiProvider || "Gemini / ChatGPT",
        prompt: imagePrompt,
        editableFields: ["background", "scene"],
      },
      copyBundle,
      collectionCandidates,
      repostDecision: judgeRepost(product, context.posts || [], context.salesResults || []),
      reasons: [
        ...evaluation.reasons.slice(0, 4),
        `テーマ「${theme.label}」で投稿の偏りを避けます`,
        `ROOM本文・SNS本文・画像指示を一括生成済みです`,
      ],
      evidence: evaluation.evidence,
      createdAt: new Date().toISOString(),
    };
  }

  function buildCoordinate(product, evaluation, context, theme, index) {
    const category = product.category || "";
    const pool = (context.products || []).filter((item) => item.id !== product.id);
    const top = category.includes("トップス") ? null : findByCategory(pool, ["トップス", "ブラウス", "カーディガン"]);
    const bottom = /スカート|パンツ|ボトム/.test(category) ? null : findByCategory(pool, ["スカート", "パンツ", "デニム"]);
    const bag = category.includes("バッグ") ? null : findByCategory(pool, ["バッグ"]);
    const shoes = /靴|シューズ|サンダル|パンプス/.test(category) ? null : findByCategory(pool, ["シューズ", "パンプス", "サンダル"]);
    const accessory = findByCategory(pool, ["アクセサリー", "ヘアアクセサリー", "ピアス", "ネックレス"]);
    return {
      mainProduct: summarizeProduct(product),
      top: top ? summarizeProduct(top) : category.includes("トップス") ? null : suggestVirtualItem("トップス", product),
      bottom: bottom ? summarizeProduct(bottom) : /スカート|パンツ|ボトム|ワンピ/.test(category) ? null : suggestVirtualItem("ボトム", product),
      bag: bag ? summarizeProduct(bag) : suggestVirtualItem("バッグ", product),
      shoes: shoes ? summarizeProduct(shoes) : suggestVirtualItem("靴", product),
      accessory: accessory ? summarizeProduct(accessory) : suggestVirtualItem("アクセ", product),
      background: theme.background,
      scene: theme.scene,
      pose: POSES[index % POSES.length],
      hairstyle: HAIRSTYLES[(index + 2) % HAIRSTYLES.length],
      speechBubble: buildTeacherComment(product, evaluation, theme),
      handwrittenPoints: buildHandwrittenPoints(product, evaluation, theme),
    };
  }

  function buildImagePrompt(product, evaluation, coordinate, theme) {
    const selectedItems = [coordinate.mainProduct, coordinate.top, coordinate.bottom, coordinate.bag, coordinate.shoes, coordinate.accessory].filter(Boolean);
    return `楽天ROOMとSNS投稿用の3:4ファッション画像を作成してください。

目的:
・選んだ商品を主役にして、売れそうに見える着用/投稿画像にする
・AIっぽさを出さず、自然なファッション投稿にする
・商品画像URLがある場合は形、色、素材感、柄を最優先で再現する

主役商品:
${product.name}
カテゴリ: ${product.category || "未分類"}
価格: ${product.price || "価格未設定"}
商品URL: ${product.url || "未設定"}
商品画像URL: ${product.image || product.mainImageUrl || "未設定"}

コーデ使用アイテム:
${selectedItems.map((item, i) => `${i + 1}. ${item.role}: ${item.name}${item.url ? ` / ${item.url}` : ""}${item.image ? ` / 画像: ${item.image}` : ""}`).join("\n")}

構成:
・背景: ${coordinate.background}
・シーン: ${coordinate.scene}
・ポーズ: ${coordinate.pose}
・髪型: ${coordinate.hairstyle}
・ハナコ先生の吹き出し: ${coordinate.speechBubble}
・手書きポイント: ${coordinate.handwrittenPoints.join(" / ")}
・右下に小さく、半透明のファッションランク ${evaluation.rank} とファッションパワー ${evaluation.aiTotalScore}pt を表示

禁止:
・未選択商品を勝手に追加しない
・商品名と関係ないコメントを書かない
・意味不明な日本語を入れない
・文字を切らない
・STYLE EDITなど不要な英字ロゴを入れない
・ウォーターマークや余白指定は入れない

品質:
・雑誌の1ページのように洗練
・可愛いけれど子どもっぽくしない
・日本語は短く自然に
・商品の魅力が一目で伝わる`;
  }

  function buildCopyBundle(product, evaluation, coordinate, theme) {
    const benefit = firstReason(evaluation) || "毎日の服選びが少し楽になります";
    const room = `PR\n${product.name}\n\n${benefit}。\n${coordinate.speechBubble}\n\n${theme.scene}にも合わせやすくて、可愛いだけで終わらない一枚です。\n気になる方はROOMでチェックしてみてください。`;
    const instagram = `おはファッション〜っ！🌸👗✨\n\n今日は「${theme.label}」に使いやすい${product.category || "アイテム"}を主役にしました。\n\n${benefit}。\n合わせるなら、色数を抑えて小物で締めると一気に大人っぽく見えます。\n\n保存して、次のお買い物メモにどうぞ。\n\n#楽天ROOM #大人可愛い #きれいめコーデ #ファッションハナコ`;
    const threads = [
      `今日の可愛い発掘。${product.name}、${theme.scene}にちょうどいいです。${benefit}。`,
      `${product.category || "このアイテム"}は、主役を決めて小物を引き算すると急に高見えします。`,
      `迷った日は「可愛いけど使える」ものを選ぶのが正解です。${coordinate.speechBubble}`,
    ];
    const x = `【今日の可愛い発掘】\n${product.name}\n${benefit}。\n${theme.scene}にも使いやすいので、ROOM候補入りです。✨\n#楽天ROOM #大人可愛い`;
    return {
      room: trimByLength(room, 420),
      instagram: trimByLength(instagram, 900),
      threads: threads.map((item) => trimByLength(item, 160)),
      x: trimByLength(x, 140),
      reasons: ["媒体ごとの文字数に自動調整", "ROOMは購入前の不安を減らす構成", "SNSは保存・共感・短文接触を分離"],
    };
  }

  function buildCollectionCandidates(product, evaluation, collections, theme) {
    const existing = (collections || []).slice(0, 3).map((collection, index) => ({
      collectionId: collection.collectionId || collection.id,
      name: collection.name,
      score: clamp(evaluation.aiTotalScore - index * 4, 0, 100),
      reason: "既存ルールとAI評価が一致",
      type: "existing",
    }));
    const generated = proposeCollectionName(product, theme);
    return [
      ...existing,
      {
        collectionId: stableHash(`ai-collection:${generated}`),
        name: generated,
        score: clamp(evaluation.aiTotalScore - 2, 0, 100),
        reason: "同テーマの商品をまとめると回遊が増えそう",
        type: "new_suggestion",
      },
    ].slice(0, 4);
  }

  function proposeNewCollections(evaluations, collections, context) {
    const existingNames = new Set((collections || []).map((item) => item.name));
    const candidates = new Map();
    evaluations.forEach((evaluation) => {
      const theme = chooseTheme(evaluation.product, evaluation, 0);
      const name = proposeCollectionName(evaluation.product, theme);
      if (existingNames.has(name)) return;
      if (!candidates.has(name)) candidates.set(name, { id: stableHash(name), name, products: [], score: 0, reason: "" });
      const item = candidates.get(name);
      item.products.push(evaluation.product.id);
      item.score += evaluation.aiTotalScore;
      item.reason = `${theme.label}テーマの商品が複数あり、まとめるとROOM内回遊を作れます`;
    });
    return [...candidates.values()]
      .map((item) => ({ ...item, score: Math.round(item.score / Math.max(1, item.products.length)) }))
      .filter((item) => item.products.length >= 2 || item.score >= 84)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }

  function judgeRepost(product, posts = [], salesResults = []) {
    const relatedPosts = posts.filter((post) => post.productId === product.id || post.canonicalProductId === product.ops?.canonicalProductId);
    const relatedSales = salesResults.filter((sale) => sale.productId === product.id || sale.productCode === product.ops?.itemCode);
    const lastPost = relatedPosts.sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0))[0];
    if (!lastPost) return { status: "new", shouldRepost: false, reason: "過去投稿がないため新規投稿候補" };
    const days = Math.floor((Date.now() - new Date(lastPost.postedAt).getTime()) / DAY_MS);
    const hadSales = relatedSales.length || Number(lastPost.sales || lastPost.orders || 0) > 0;
    if (hadSales && days >= 30) return { status: "recommended", shouldRepost: true, reason: "過去に成果があり、再投稿期間も空いています" };
    if (days >= 60) return { status: "possible", shouldRepost: true, reason: "前回投稿から60日以上経過しています" };
    return { status: "wait", shouldRepost: false, reason: `前回投稿から${days}日なので新鮮さ不足です` };
  }

  function proposeReposts(products, posts, salesResults) {
    return products
      .map((product) => ({ productId: product.id, productName: product.name, ...judgeRepost(product, posts, salesResults) }))
      .filter((item) => item.shouldRepost)
      .slice(0, 12);
  }

  function buildSalesInsight(aggregates = [], adjustments = []) {
    const reliable = aggregates.filter((item) => Number(item.sampleSize || 0) >= 5);
    const top = [...reliable].sort((a, b) => Number(b.conversionRate || 0) - Number(a.conversionRate || 0)).slice(0, 8);
    return {
      topBrands: top.filter((item) => item.dimension === "brand").slice(0, 3),
      topCategories: top.filter((item) => item.dimension === "category").slice(0, 3),
      topPriceRanges: top.filter((item) => item.dimension === "priceRange").slice(0, 3),
      recommendations: top.slice(0, 5).map((item) => `${item.dimensionValue}は成果率が高めです。次回候補で少し優先してください。`),
      scoreAdjustments: adjustments.filter((item) => item.isEnabled !== false && Number(item.adjustmentValue)).slice(0, 8),
      evidenceCount: reliable.length,
      createdAt: new Date().toISOString(),
    };
  }

  function buildAiReport(salesInsight, reposts, plans, context) {
    return {
      id: stableHash(`ai-report:${dateKey(new Date())}`),
      facts: [
        `AI投稿候補を${plans.length}件作成しました。`,
        `再投稿候補は${reposts.length}件です。`,
        `成果分析に使えるセグメントは${salesInsight.evidenceCount}件です。`,
      ],
      assumptions: [
        salesInsight.recommendations[0] || "成果CSVが増えるほど、売れ筋判断の精度が上がります。",
        "画像・コピー・コレクションを同時に作ることで、投稿準備時間を短縮できる可能性があります。",
      ],
      actions: [
        "Sランク候補を承認して画像生成待ちへ送る",
        "判断待ち受信箱の高優先度だけ確認する",
        "CSV取込後にAIレポートを再生成する",
      ],
      createdAt: new Date().toISOString(),
    };
  }

  function buildSchedule(plans, calendar = []) {
    const usedDates = new Set((calendar || []).filter((item) => !item.done).map((item) => item.date));
    const rows = [];
    let dayOffset = 1;
    plans.slice(0, 7).forEach((plan, index) => {
      let date = dateKey(new Date(Date.now() + dayOffset * DAY_MS));
      while (usedDates.has(date)) {
        dayOffset += 1;
        date = dateKey(new Date(Date.now() + dayOffset * DAY_MS));
      }
      rows.push({
        id: stableHash(`ai-schedule:${plan.id}:${date}`),
        date,
        theme: THEMES[index % THEMES.length].label,
        productId: plan.productId,
        productName: plan.productName,
        platform: index % 3 === 0 ? "Instagram" : index % 3 === 1 ? "Threads" : "X",
        reason: "曜日テーマと商品カテゴリの偏りを避けて配置",
        status: "suggested",
      });
      dayOffset += 1;
    });
    return rows;
  }

  function buildTasks(plans, reposts, salesInsight, context) {
    return [
      { id: "sellable", label: "売れる商品候補", count: plans.filter((item) => item.aiRank === "S" || item.aiRank === "A").length, action: "承認して投稿準備へ" },
      { id: "image", label: "画像生成待ち", count: plans.filter((item) => item.imageJob.status === "waiting").length, action: "AI画像プロンプトを確認" },
      { id: "schedule", label: "投稿予約", count: plans.slice(0, 7).length, action: "AIスケジュールを承認" },
      { id: "brand", label: "売上急上昇候補", count: salesInsight.recommendations.length, action: "次回候補へ反映" },
      { id: "decision", label: "判断待ち", count: (context.decisionInboxItems || []).filter((item) => item.status !== "resolved").length, action: "曖昧なものだけ確認" },
      { id: "repost", label: "再投稿候補", count: reposts.length, action: "季節・成果理由を確認" },
    ];
  }

  function answerAssistant(question, context = {}) {
    const q = normalizeText(question);
    const run = context.latestRun || buildAgentRun(context);
    if (!q) return "聞きたいことを入力してください。例: 今日は何を投稿する？";
    if (/今日|投稿|おすすめ/.test(q)) {
      return run.plans.slice(0, 3).map((plan, index) => `${index + 1}. ${plan.productName}。${plan.theme.label}テーマで、AIスコア${plan.aiTotalScore}点です。理由: ${plan.reasons[0]}`).join("\n");
    }
    if (/売れ|伸び|ブランド/.test(q)) {
      return run.salesInsight.recommendations.length ? run.salesInsight.recommendations.join("\n") : "まだ成果データが少ないです。CSVを入れるとブランド・価格帯・カテゴリ別に見ます。";
    }
    if (/同じ|重複|再投稿/.test(q)) {
      return run.reposts.length ? run.reposts.slice(0, 5).map((item) => `${item.productName}: ${item.reason}`).join("\n") : "今すぐ強く再投稿したい商品は少なめです。新規候補を優先しましょう。";
    }
    if (/旅行|旅/.test(q)) {
      const travel = run.plans.filter((plan) => plan.theme.id === "travel" || /旅行/.test(plan.copyBundle.room));
      return (travel.length ? travel : run.plans).slice(0, 3).map((plan) => `${plan.productName}: ${plan.coordinate.background}で、${plan.coordinate.pose}構図がおすすめです。`).join("\n");
    }
    if (/骨格|ウェーブ/.test(q)) {
      return run.plans.slice(0, 3).map((plan) => `${plan.productName}: 重心を上げる小物合わせで、${plan.coordinate.speechBubble}`).join("\n");
    }
    return "今のおすすめは、AI候補を承認して画像生成待ちへ送ることです。具体的には「今日は何を投稿する？」と聞くと上位3件を出します。";
  }

  function chooseTheme(product, evaluation, index) {
    if (evaluation.scores.travelFit >= 75) return THEMES[0];
    if (evaluation.scores.officeFit >= 75) return THEMES[1];
    if (evaluation.scores.dateFit >= 75) return THEMES[2];
    return THEMES[index % THEMES.length];
  }

  function buildVisionPrompt(product) {
    return `この商品画像だけを見て、以下を0〜100点で評価し、理由をJSONで返してください。
項目: 高見え, SNS映え, 季節感, 大人可愛い, 韓国系, ナチュラル, フェミニン, 旅行向き, デート向き, 通勤向き, ROOM向き。
商品名: ${product.name}
カテゴリ: ${product.category || "未分類"}
画像URL: ${product.image || product.mainImageUrl || "未設定"}
返答は scores, reasons, evidence の3項目だけにしてください。`;
  }

  function buildEvaluationReasons(product, scores, hasImage) {
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 4);
    return [
      hasImage ? "商品画像があるため、画像生成・投稿訴求に使いやすい" : "商品画像がないため、画像生成前に確認が必要",
      ...sorted.map(([field, score]) => `${labelFor(field)}が${score}点で強みになりそう`),
    ];
  }

  function buildTeacherComment(product, evaluation, theme) {
    const comments = [
      "可愛いだけで終わらせないで。使う場面まで決めたら勝ちです。",
      "主役は一つ。あとは引き算したほうが高く見えます。",
      "迷ったら色を減らして。普通っぽいのに品が出ます。",
      `${theme.label}なら、可愛さより「ちゃんと使える」を先に見せて。`,
      "盛るより整える。大人可愛いはそこからです。",
    ];
    return comments[evaluation.aiTotalScore % comments.length];
  }

  function buildHandwrittenPoints(product, evaluation, theme) {
    const points = ["主役を先に決める", "色数は3色以内", "小物で締める", "素材感を見せる", "予定に合う可愛さ"];
    if (evaluation.scores.travelFit >= 75) points.push("旅行でも崩れにくい");
    if (evaluation.scores.officeFit >= 75) points.push("通勤にも浮かない");
    if (evaluation.scores.dateFit >= 75) points.push("近くで見ても上品");
    return points.slice(0, 4);
  }

  function proposeCollectionName(product, theme) {
    const price = number(product.price);
    if (price && price < 3000) return "3000円以下の可愛い発掘";
    if (/冷|UV|カーデ|羽織/.test(product.name || "")) return "冷房対策きれいめ服";
    if (theme.id === "travel") return "夏旅行コーデ";
    if (theme.id === "wave") return "骨格ウェーブ優勝";
    return `${theme.label}で可愛い服`;
  }

  function findByCategory(products, categories) {
    return products.find((item) => categories.some((category) => String(item.category || "").includes(category)));
  }

  function suggestVirtualItem(role, product) {
    const brand = product.details?.brand || "同系統ブランド";
    return { role, name: `${brand}で合わせたい${role}`, url: "", image: "", virtual: true };
  }

  function summarizeProduct(product) {
    return { role: product.category || "主役", name: product.name, url: product.url || "", image: product.image || "", price: product.price || "" };
  }

  function firstReason(evaluation) {
    return (evaluation.reasons || []).find((reason) => !/画像がない/.test(reason));
  }

  function trimByLength(text, length) {
    const value = String(text || "");
    return value.length <= length ? value : `${value.slice(0, length - 1)}…`;
  }

  function number(value) {
    return Number(String(value || "").replace(/[^\d.-]/g, "") || 0);
  }

  function keyword(text, words) {
    return words.reduce((sum, word) => sum + (text.includes(normalizeText(word)) ? 1 : 0), 0);
  }

  function normalizeText(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, "");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Math.round(value)));
  }

  function dateKey(date) {
    return new Date(date).toISOString().slice(0, 10);
  }

  function stableHash(value) {
    let hash = 2166136261;
    const text = String(value || "");
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `h${(hash >>> 0).toString(36)}`;
  }

  function labelFor(field) {
    return {
      highLooking: "高見え",
      snsAppeal: "SNS映え",
      seasonFit: "季節感",
      adultCute: "大人可愛い",
      koreanMood: "韓国系",
      naturalMood: "ナチュラル",
      feminine: "フェミニン",
      travelFit: "旅行向き",
      dateFit: "デート向き",
      officeFit: "通勤向き",
      roomFit: "ROOM向き",
    }[field] || field;
  }

  window.HanakoPhase3Engine = {
    IMAGE_SCORE_FIELDS,
    THEMES,
    buildAgentRun,
    evaluateProduct,
    buildPostPlan,
    buildCoordinate,
    buildImagePrompt,
    buildCopyBundle,
    proposeNewCollections,
    judgeRepost,
    proposeReposts,
    buildSalesInsight,
    buildAiReport,
    buildSchedule,
    answerAssistant,
    stableHash,
  };
})();
