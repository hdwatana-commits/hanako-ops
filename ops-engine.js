(function () {
  "use strict";

  const DAY_MS = 24 * 60 * 60 * 1000;
  const PROMO_WORDS = [
    "SALE", "セール", "新色", "追加", "再入荷", "予約", "WEB限定", "送料無料", "ポイント", "クーポン",
    "ランキング", "期間限定", "限定", "即納", "メール便", "半額", "割引", "％OFF", "%OFF",
  ];
  const SIZE_WORDS = ["XS", "S", "M", "L", "XL", "XXL", "FREE", "フリー", "小さいサイズ", "大きいサイズ"];
  const COLOR_WORDS = ["黒", "ブラック", "白", "ホワイト", "アイボリー", "ベージュ", "ピンク", "ネイビー", "ブルー", "グレー", "ブラウン", "モカ", "レッド", "グリーン"];

  const SCORE_WEIGHTS = {
    ranking: 20,
    review: 10,
    season: 15,
    price: 10,
    image: 10,
    hanakoFit: 15,
    coordinateEase: 5,
    collectionFit: 5,
    trend: 5,
    ownPerformance: 5,
  };

  const DEFAULT_COLLECTIONS = [
    rule("adult-girly", "大人ガーリー", { taste: ["大人可愛い", "甘め", "きれいめ"], scene: ["通勤", "カフェ", "デート"] }),
    rule("sweet-clean", "甘めきれいめ", { taste: ["甘め", "きれいめ"], category: ["トップス", "ワンピース", "スカート", "バッグ"] }),
    rule("clean-pants", "大人のきれいめパンツ", { category: ["パンツ", "デニム"], taste: ["きれいめ", "大人可愛い"] }),
    rule("travel-easy", "旅行に使える楽ちん服", { scene: ["旅行"], function: ["シワになりにくい", "歩きやすい", "洗える"] }),
    rule("office-cute", "通勤も可愛い", { scene: ["通勤"], category: ["トップス", "パンツ", "スカート", "バッグ", "シューズ"] }),
    rule("high-looking", "プチプラ高見え", { priceRange: ["低価格", "買いやすい"], taste: ["高見え", "きれいめ"] }),
  ];

  function rule(id, name, preferred = {}) {
    return {
      id,
      collectionId: id,
      name,
      automationMode: "confirm",
      required: {},
      preferred,
      excluded: { category: ["ホテル・旅行"] },
      maxBrandRatio: 0.3,
      maxCategoryRatio: 0.4,
      maxColorRatio: 0.35,
    };
  }

  function buildDailySelection({ products = [], posts = [], metrics = [], collections = DEFAULT_COLLECTIONS, today = new Date(), sourceFailed = false } = {}) {
    const sourceProducts = products.filter((item) => item && !item.deletedAt && item.category !== "ホテル・旅行");
    const normalized = sourceProducts.map((product) => enrichProduct(product));
    const grouped = groupDuplicateProducts(normalized);
    const scored = grouped.map((group) => {
      const product = chooseRepresentative(group);
      const duplicateSummary = summarizeDuplicateGroup(group, product);
      const repost = evaluateRepostWindow(product, posts, today);
      const recommendedCollections = recommendCollections(product, collections).slice(0, 3);
      const saleScore = scoreSalePotential(product, { metrics, repost, recommendedCollections, today });
      const operationScore = scoreOperationPriority(product, { saleScore, repost, recommendedCollections, duplicateSummary });
      const rank = rankByOperation(operationScore.total);
      return {
        ...product,
        rank,
        salePotentialScore: saleScore.total,
        salePotentialBreakdown: saleScore,
        operationPriorityScore: operationScore.total,
        operationPriorityBreakdown: operationScore,
        repost,
        duplicateSummary,
        recommendedCollections,
        missingItems: findMissingItems(product),
        decision: product.opsDecision || "pending",
        pipelineStatus: product.pipelineStatus || "候補",
      };
    });

    const top200 = diversify(scored.sort(sortSelectionItem), 200);
    const visibleItems = diversify(top200.filter((item) => item.rank === "S" && !["再投稿不可"].includes(item.repost.status)), 30);
    const fallbackVisible = visibleItems.length ? visibleItems : diversify(top200.slice(0, 30), 30);
    return {
      id: stableSelectionId(today),
      selectionDate: toDateKey(today),
      sourceCount: sourceProducts.length,
      candidateCount: top200.length,
      visibleCount: fallbackVisible.length,
      items: top200,
      visibleItems: fallbackVisible,
      job: {
        status: sourceFailed ? "fallback" : "ok",
        sourceFailed: Boolean(sourceFailed),
        generatedAt: new Date().toISOString(),
      },
      kpis: buildEfficiencyKpis(sourceProducts.length, top200.length, fallbackVisible.length),
    };
  }

  function enrichProduct(product) {
    const details = product.details || {};
    const normalizedUrl = normalizeUrl(product.url || product.sourceUrl || "");
    const normalizedProductName = normalizeProductName(product.name || "");
    const brand = clean(details.brand || details.shopName || product.brand || "");
    const shopCode = clean(details.shopCode || getShopCodeFromUrl(normalizedUrl));
    const itemCode = clean(details.itemCode || details.itemId || getItemCodeFromUrl(normalizedUrl));
    const modelNumber = clean(details.modelNumber || findModelNumber(product.name));
    const janCode = clean(details.janCode || details.jan || "");
    const color = normalizeColor(details.color || findColor(product.name));
    const size = clean(details.size || findSize(product.name));
    const canonicalProductId = createCanonicalProductId({ shopCode, itemCode, janCode, brand, modelNumber, normalizedProductName, product });
    const productFamilyId = createProductFamilyId({ brand, modelNumber, normalizedProductName, itemCode, category: product.category });
    return {
      ...product,
      source: product.source || details.source || "manual",
      shopCode,
      itemCode,
      productUrl: product.url || "",
      normalizedUrl,
      canonicalProductId,
      productFamilyId,
      brand,
      normalizedProductName,
      modelNumber,
      janCode,
      color,
      size,
      mainImageUrl: product.image || details.image || "",
      imageHash: details.imageHash || normalizeImageUrl(product.image || ""),
      tags: inferTags(product),
      canonicalConfidence: confidenceForCanonical({ shopCode, itemCode, janCode, brand, modelNumber, normalizedProductName }),
    };
  }

  function createCanonicalProductId(input) {
    if (input.shopCode && input.itemCode) return `rakuten:${input.shopCode}:${baseItemCode(input.itemCode)}`;
    if (input.itemCode) return `rakuten:item:${baseItemCode(input.itemCode)}`;
    if (input.janCode) return `jan:${input.janCode}`;
    if (input.brand && input.modelNumber) return `model:${slug(input.brand)}:${slug(input.modelNumber)}`;
    if (input.brand && input.normalizedProductName) return `name:${slug(input.brand)}:${slug(input.normalizedProductName)}`;
    return `name:unknown:${slug(input.normalizedProductName || input.product?.name || input.product?.id || "product")}`;
  }

  function createProductFamilyId({ brand, modelNumber, normalizedProductName, itemCode, category }) {
    const baseCode = baseItemCode(itemCode || modelNumber || "");
    if (brand && baseCode) return `family:${slug(brand)}:${slug(baseCode)}`;
    return `family:${slug(brand || category || "unknown")}:${slug(removeColorAndSize(normalizedProductName || ""))}`;
  }

  function groupDuplicateProducts(products) {
    const map = new Map();
    products.forEach((product) => {
      const key = product.canonicalProductId || product.productFamilyId;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(product);
    });
    const groups = [...map.values()];
    products.forEach((product) => {
      if (groups.some((group) => group.includes(product))) return;
      groups.push([product]);
    });
    return groups;
  }

  function chooseRepresentative(group) {
    return [...group].sort((a, b) => productCompleteness(b) - productCompleteness(a))[0];
  }

  function summarizeDuplicateGroup(group, representative) {
    const variants = group.filter((item) => item.id !== representative.id);
    const colors = new Set(group.map((item) => item.color).filter(Boolean));
    const sizes = new Set(group.map((item) => item.size).filter(Boolean));
    const type = !variants.length ? "none" : colors.size > 1 ? "color_variant" : sizes.size > 1 ? "size_variant" : "exact";
    return {
      type,
      variantCount: variants.length,
      confidence: type === "none" ? 100 : representative.canonicalConfidence,
      groupedProductIds: group.map((item) => item.id),
    };
  }

  function evaluateRepostWindow(product, posts = [], today = new Date()) {
    const matches = posts
      .filter((post) => post && (post.canonicalProductId === product.canonicalProductId || post.productId === product.id || post.productId === product.canonicalProductId))
      .filter((post) => post.postedAt)
      .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
    if (!matches.length) return { status: "投稿可能", lastPostedAt: "", repostableAt: "", daysSinceLastPost: null, reason: "過去投稿なし" };
    const last = matches[0];
    const days = Math.floor((startOfDay(today) - startOfDay(new Date(last.postedAt))) / DAY_MS);
    const hadSales = matches.some((post) => Number(post.sales || post.orders || post.rewardAmount || 0) > 0);
    const windowDays = sameColor(product, last) ? 60 : 30;
    const repostableAt = new Date(startOfDay(new Date(last.postedAt)).getTime() + windowDays * DAY_MS);
    if (days < windowDays) {
      const nearRepostable = hadSales && days >= Math.floor(windowDays * 0.75);
      return { status: nearRepostable ? "再投稿注意" : "再投稿不可", lastPostedAt: last.postedAt, repostableAt: repostableAt.toISOString(), daysSinceLastPost: days, reason: `${windowDays}日ルール内` };
    }
    return { status: hadSales ? "再投稿推奨" : "投稿可能", lastPostedAt: last.postedAt, repostableAt: repostableAt.toISOString(), daysSinceLastPost: days, reason: hadSales ? "過去売上あり" : "再投稿期間を経過" };
  }

  function scoreSalePotential(product, context) {
    const factors = [];
    addFactor(factors, "ranking", SCORE_WEIGHTS.ranking, scoreRanking(product), "ランキング・人気・レビュー量");
    addFactor(factors, "review", SCORE_WEIGHTS.review, scoreReview(product), "レビュー信頼性");
    addFactor(factors, "season", SCORE_WEIGHTS.season, scoreSeason(product, context.today), "季節・気温適合");
    addFactor(factors, "price", SCORE_WEIGHTS.price, scorePrice(product), "購入しやすい価格帯");
    addFactor(factors, "image", SCORE_WEIGHTS.image, product.mainImageUrl ? 0.9 : null, "画像の訴求力");
    addFactor(factors, "hanakoFit", SCORE_WEIGHTS.hanakoFit, scoreHanakoFit(product), "ファッションハナコ相性");
    addFactor(factors, "coordinateEase", SCORE_WEIGHTS.coordinateEase, scoreCoordinateEase(product), "コーデ提案しやすさ");
    addFactor(factors, "collectionFit", SCORE_WEIGHTS.collectionFit, context.recommendedCollections.length ? context.recommendedCollections[0].score / 100 : null, "コレクション適合");
    addFactor(factors, "trend", SCORE_WEIGHTS.trend, scoreTrend(product), "新着・再入荷・急上昇性");
    addFactor(factors, "ownPerformance", SCORE_WEIGHTS.ownPerformance, scoreOwnPerformance(product, context.metrics), "自アカウント実績類似");
    return normalizeFactors(factors);
  }

  function scoreOperationPriority(product, { saleScore, repost, recommendedCollections, duplicateSummary }) {
    const factors = [];
    addFactor(factors, "sale", 30, saleScore.total / 100, "売れやすさ");
    addFactor(factors, "easy", 15, productCompleteness(product) / 100, "投稿準備の簡単さ");
    addFactor(factors, "imageReady", 10, product.mainImageUrl ? 1 : 0.2, "画像利用しやすさ");
    addFactor(factors, "infoReady", 10, infoReadiness(product), "商品情報の充足度");
    addFactor(factors, "collectionConfidence", 10, recommendedCollections[0]?.score ? recommendedCollections[0].score / 100 : 0.2, "分類確信度");
    addFactor(factors, "duplicateLowRisk", 10, repost.status === "再投稿不可" ? 0 : duplicateSummary.type === "none" ? 1 : 0.7, "重複リスクの低さ");
    addFactor(factors, "urgency", 10, scoreTrend(product), "今すぐ投稿する必要性");
    addFactor(factors, "readyNow", 5, findMissingItems(product).length ? 0.4 : 1, "すぐ投稿できる");
    return normalizeFactors(factors);
  }

  function recommendCollections(product, collections = DEFAULT_COLLECTIONS) {
    const tags = product.tags || inferTags(product);
    return collections
      .map((collection) => {
        const reasons = [];
        let score = 50;
        if (matchesRule(collection.excluded, product, tags)) score -= 70;
        if (collection.required && Object.keys(collection.required).length && !matchesRule(collection.required, product, tags)) score -= 45;
        const preferredScore = matchRuleScore(collection.preferred, product, tags, reasons);
        score += preferredScore;
        if (product.brand && collection.name.includes(product.brand)) score += 20;
        return { collectionId: collection.collectionId || collection.id, name: collection.name, score: clamp(Math.round(score), 0, 100), reasons };
      })
      .filter((item) => item.score > 40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  function diversify(items, limit) {
    const result = [];
    const brandCount = new Map();
    const categoryCount = new Map();
    const colorCount = new Map();
    for (const item of items) {
      if (result.length >= limit) break;
      const nextSize = result.length + 1;
      const brandRatio = ((brandCount.get(item.brand) || 0) + 1) / nextSize;
      const categoryRatio = ((categoryCount.get(item.category) || 0) + 1) / nextSize;
      const colorRatio = ((colorCount.get(item.color) || 0) + 1) / nextSize;
      const canAdd = result.length < 8 || (brandRatio <= 0.3 && categoryRatio <= 0.35 && colorRatio <= 0.35);
      if (!canAdd && items.length > limit) continue;
      result.push(item);
      inc(brandCount, item.brand || "unknown");
      inc(categoryCount, item.category || "unknown");
      inc(colorCount, item.color || "unknown");
    }
    for (const item of items) {
      if (result.length >= limit) break;
      if (!result.some((existing) => existing.canonicalProductId === item.canonicalProductId)) result.push(item);
    }
    return result;
  }

  function inferTags(product) {
    const text = `${product.name || ""} ${product.hook || ""} ${product.category || ""} ${JSON.stringify(product.details || {})}`;
    return {
      brand: product.details?.brand || product.brand || "",
      category: product.category || "",
      subCategory: product.category || "",
      taste: inferTaste(text),
      scene: inferScene(text),
      season: inferSeason(text),
      colorFamily: normalizeColor(product.details?.color || findColor(text)),
      material: inferMaterial(text),
      fit: /ゆったり|オーバー|ワイド/.test(text) ? "ゆったり" : /細見え|すっきり|タイト/.test(text) ? "すっきり" : "",
      bodyTypeSupport: inferProblem(text),
      problemSolution: inferProblem(text),
      function: inferFunction(text),
      priceRange: priceRange(product.price),
      targetAge: "20代-40代",
      occasion: inferScene(text)[0] || "",
    };
  }

  function normalizeProductName(name) {
    let value = clean(name).toUpperCase();
    PROMO_WORDS.forEach((word) => { value = value.replaceAll(word.toUpperCase(), " "); });
    SIZE_WORDS.forEach((word) => { value = value.replace(new RegExp(`\\b${escapeRegExp(word.toUpperCase())}\\b`, "g"), " "); });
    value = value
      .replace(/[【】［］\[\]（）(){}<>＜＞「」『』!！?？★☆◎○●◆◇■□♪♫♡❤︎♥]/g, " ")
      .replace(/\d{1,3}(,\d{3})*円|\d+%|\d+％|ポイント\d+倍/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return value;
  }

  function normalizeUrl(url) {
    try {
      const parsed = new URL(String(url || ""));
      ["scid", "iasid", "s-id", "utm_source", "utm_medium", "utm_campaign", "variant"].forEach((key) => parsed.searchParams.delete(key));
      parsed.hash = "";
      return parsed.toString().replace(/\/$/, "");
    } catch {
      return String(url || "").trim();
    }
  }

  function getShopCodeFromUrl(url) {
    const match = String(url || "").match(/item\.rakuten\.co\.jp\/([^/]+)/);
    return match?.[1] || "";
  }

  function getItemCodeFromUrl(url) {
    const match = String(url || "").match(/item\.rakuten\.co\.jp\/[^/]+\/([^/?#]+)/);
    return match?.[1] || "";
  }

  function baseItemCode(value) {
    return clean(value).toLowerCase().replace(/-(black|white|ivory|beige|pink|navy|blue|gray|grey|brown|moca|m|l|s|ll|free)$/i, "");
  }

  function scoreRanking(product) {
    const text = `${product.name || ""} ${product.hook || ""}`;
    let score = /ランキング|1位|入賞|高評価|人気|売れ/.test(text) ? 0.9 : 0.45;
    const reviews = number(product.details?.reviewCount);
    if (reviews > 500) score = Math.max(score, 0.9);
    else if (reviews > 100) score = Math.max(score, 0.75);
    return score;
  }

  function scoreReview(product) {
    const rating = number(product.details?.rating);
    const reviews = number(product.details?.reviewCount);
    if (!rating && !reviews) return null;
    return clamp(((rating || 3.8) - 3.5) / 1.5 * 0.6 + Math.min(0.4, Math.log10(reviews + 1) / 8), 0, 1);
  }

  function scoreSeason(product, today = new Date()) {
    const month = new Date(today).getMonth() + 1;
    const text = `${product.name || ""} ${product.hook || ""} ${product.category || ""}`;
    if (month >= 3 && month <= 5 && /春|薄手|ブラウス|カーデ|花|ピンク/.test(text)) return 1;
    if (month >= 6 && month <= 8 && /夏|UV|接触冷感|水着|サンダル|リネン|半袖/.test(text)) return 1;
    if (month >= 9 && month <= 11 && /秋|ニット|カーデ|ブラウン|チェック/.test(text)) return 1;
    if ((month === 12 || month <= 2) && /冬|裏起毛|コート|ニット|ブーツ|あったか/.test(text)) return 1;
    return 0.62;
  }

  function scorePrice(product) {
    const price = number(product.price);
    if (!price) return null;
    if (price >= 1500 && price <= 5999) return 1;
    if (price <= 9999) return 0.78;
    if (price <= 14999) return 0.58;
    return 0.35;
  }

  function scoreHanakoFit(product) {
    const text = `${product.name || ""} ${product.hook || ""} ${product.category || ""}`;
    let score = 0.45;
    if (/大人|ガーリー|甘め|きれいめ|高見え|リボン|フリル|レース|淡色|華奢|細見え/.test(text)) score += 0.4;
    if (/通勤|カフェ|デート|旅行|女子会/.test(text)) score += 0.15;
    return clamp(score, 0, 1);
  }

  function scoreCoordinateEase(product) {
    if (["トップス", "スカート", "パンツ", "ワンピース", "バッグ", "シューズ", "アクセサリー"].includes(product.category)) return 0.9;
    return 0.55;
  }

  function scoreTrend(product) {
    const text = `${product.name || ""} ${product.hook || ""}`;
    if (/新着|新色|再入荷|予約|急上昇|ランキング|クーポン|SALE|セール/.test(text)) return 0.9;
    return 0.5;
  }

  function scoreOwnPerformance(product, metrics = []) {
    if (!metrics.length) return null;
    const text = `${product.brand} ${product.category}`;
    const relevant = metrics.filter((item) => `${item.post || ""} ${item.pattern || ""}`.includes(product.category) || (product.brand && `${item.post || ""}`.includes(product.brand)));
    if (!relevant.length) return 0.5;
    const clicks = relevant.reduce((sum, item) => sum + Number(item.clicks || 0), 0);
    const sales = relevant.reduce((sum, item) => sum + Number(item.sales || 0), 0);
    return clamp(0.55 + clicks / 100 + sales / 10 + (text ? 0 : 0), 0, 1);
  }

  function normalizeFactors(factors) {
    const evaluated = factors.filter((item) => item.value !== null && item.value !== undefined);
    const weightSum = evaluated.reduce((sum, item) => sum + item.weight, 0) || 1;
    const total = Math.round(evaluated.reduce((sum, item) => sum + item.value * item.weight, 0) / weightSum * 100);
    return {
      total: clamp(total, 0, 100),
      factors: evaluated.map((item) => ({
        key: item.key,
        label: item.label,
        points: Math.round(item.value * item.weight / weightSum * 100),
        raw: Math.round(item.value * 100),
      })),
      unevaluated: factors.filter((item) => item.value === null || item.value === undefined).map((item) => item.label),
    };
  }

  function addFactor(factors, key, weight, value, label) {
    factors.push({ key, weight, value, label });
  }

  function sortSelectionItem(a, b) {
    return b.operationPriorityScore - a.operationPriorityScore || b.salePotentialScore - a.salePotentialScore || a.normalizedProductName.localeCompare(b.normalizedProductName, "ja");
  }

  function rankByOperation(score) {
    if (score >= 82) return "S";
    if (score >= 70) return "A";
    if (score >= 58) return "B";
    if (score >= 45) return "C";
    return "D";
  }

  function findMissingItems(product) {
    return [
      !product.mainImageUrl && "商品画像",
      !product.hook && "推しポイント",
      !product.price && "価格",
      !product.brand && "ブランド",
    ].filter(Boolean);
  }

  function productCompleteness(product) {
    return [
      product.name,
      product.url,
      product.mainImageUrl || product.image,
      product.category,
      product.price,
      product.hook,
      product.brand,
      product.color,
    ].filter(Boolean).length / 8 * 100;
  }

  function infoReadiness(product) {
    return productCompleteness(product) / 100;
  }

  function buildEfficiencyKpis(sourceCount, candidateCount, visibleCount) {
    return {
      sourceCandidates: sourceCount,
      savedCandidates: candidateCount,
      visibleCandidates: visibleCount,
      expectedReviewReductionRate: candidateCount ? Math.round((1 - visibleCount / candidateCount) * 100) : 0,
      manualInputPerProduct: "未計測",
      selectionMinutes: "未計測",
      duplicatePrevented: Math.max(0, sourceCount - candidateCount),
    };
  }

  function matchRuleScore(rulePart = {}, product, tags, reasons = []) {
    let score = 0;
    Object.entries(rulePart || {}).forEach(([key, values]) => {
      const haystack = [product[key], tags[key], ...(Array.isArray(tags[key]) ? tags[key] : [])].flat().filter(Boolean);
      const matched = values.some((value) => haystack.some((item) => String(item).includes(value) || String(value).includes(item)));
      if (matched) {
        score += 16;
        reasons.push(`${key}が一致`);
      }
    });
    return score;
  }

  function matchesRule(rulePart = {}, product, tags) {
    return Object.entries(rulePart || {}).every(([key, values]) => {
      const haystack = [product[key], tags[key], ...(Array.isArray(tags[key]) ? tags[key] : [])].flat().filter(Boolean);
      return values.some((value) => haystack.some((item) => String(item).includes(value) || String(value).includes(item)));
    });
  }

  function inferTaste(text) {
    const tags = [];
    if (/甘め|ガーリー|リボン|フリル|レース/.test(text)) tags.push("甘め", "大人可愛い");
    if (/きれいめ|通勤|上品|高見え/.test(text)) tags.push("きれいめ", "高見え");
    if (/ナチュラル|リネン|綿|コットン/.test(text)) tags.push("ナチュラル");
    return tags.length ? tags : ["大人可愛い"];
  }

  function inferScene(text) {
    const tags = [];
    if (/通勤|オフィス|仕事/.test(text)) tags.push("通勤");
    if (/カフェ|ランチ/.test(text)) tags.push("カフェ");
    if (/デート|女子会/.test(text)) tags.push("デート");
    if (/旅行|旅|リゾート/.test(text)) tags.push("旅行");
    return tags.length ? tags : ["カフェ"];
  }

  function inferSeason(text) {
    if (/春/.test(text)) return "春";
    if (/夏|UV|冷感|水着|半袖/.test(text)) return "夏";
    if (/秋/.test(text)) return "秋";
    if (/冬|裏起毛|コート/.test(text)) return "冬";
    return "通年";
  }

  function inferMaterial(text) {
    return ["レース", "リネン", "コットン", "サテン", "シフォン", "ニット", "デニム"].find((item) => text.includes(item)) || "";
  }

  function inferProblem(text) {
    if (/二の腕|袖/.test(text)) return "二の腕を華奢見せ";
    if (/腰|ヒップ/.test(text)) return "腰まわりすっきり";
    if (/細見え|着やせ/.test(text)) return "細見え";
    if (/気温|冷房|寒暖差/.test(text)) return "気温差対策";
    return "高見え";
  }

  function inferFunction(text) {
    return ["洗える", "UV", "接触冷感", "撥水", "シワになりにくい", "歩きやすい"].filter((item) => text.includes(item));
  }

  function priceRange(value) {
    const price = number(value);
    if (!price) return "";
    if (price <= 2999) return "低価格";
    if (price <= 6999) return "買いやすい";
    if (price <= 12999) return "少し上質";
    return "高価格";
  }

  function sameColor(product, post) {
    return normalizeColor(product.color || "") === normalizeColor(post.color || "");
  }

  function confidenceForCanonical(input) {
    if (input.shopCode && input.itemCode) return 98;
    if (input.janCode) return 96;
    if (input.brand && input.modelNumber) return 88;
    if (input.brand && input.normalizedProductName) return 72;
    return 48;
  }

  function normalizeColor(value) {
    const text = clean(value);
    if (!text) return "";
    if (/黒|ブラック/.test(text)) return "ブラック";
    if (/白|ホワイト|アイボリー/.test(text)) return "ホワイト";
    if (/ベージュ|モカ|ブラウン|茶/.test(text)) return "ベージュ";
    if (/ピンク|ローズ/.test(text)) return "ピンク";
    if (/ネイビー|紺|ブルー|青/.test(text)) return "ブルー";
    if (/グレー|灰/.test(text)) return "グレー";
    return text;
  }

  function findColor(text) {
    return COLOR_WORDS.find((word) => String(text || "").includes(word)) || "";
  }

  function findSize(text) {
    return SIZE_WORDS.find((word) => new RegExp(`\\b${escapeRegExp(word)}\\b`, "i").test(String(text || ""))) || "";
  }

  function findModelNumber(text) {
    return String(text || "").match(/[A-Z]{1,4}[-_ ]?\d{2,6}/i)?.[0] || "";
  }

  function removeColorAndSize(text) {
    let value = text;
    COLOR_WORDS.concat(SIZE_WORDS).forEach((word) => { value = value.replaceAll(word.toUpperCase(), " "); });
    return clean(value);
  }

  function normalizeImageUrl(url) {
    return String(url || "").replace(/\?_ex=\d+x\d+$/, "").trim();
  }

  function number(value) {
    const text = String(value || "").replace(/[,円￥¥]/g, "");
    const match = text.match(/\d+(\.\d+)?/);
    return match ? Number(match[0]) : 0;
  }

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function slug(value) {
    return clean(value).toLowerCase().replace(/[^a-z0-9ぁ-んァ-ヶ一-龠ー]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
  }

  function inc(map, key) {
    map.set(key, (map.get(key) || 0) + 1);
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function startOfDay(date) {
    return new Date(new Date(date).toISOString().slice(0, 10));
  }

  function toDateKey(date) {
    return new Date(date).toISOString().slice(0, 10);
  }

  function stableSelectionId(date) {
    return `daily-${toDateKey(date)}`;
  }

  window.HanakoOpsEngine = {
    buildDailySelection,
    enrichProduct,
    createCanonicalProductId,
    normalizeProductName,
    normalizeUrl,
    groupDuplicateProducts,
    evaluateRepostWindow,
    scoreSalePotential,
    scoreOperationPriority,
    recommendCollections,
    defaultCollections: () => DEFAULT_COLLECTIONS.map((item) => ({ ...item })),
  };
})();
