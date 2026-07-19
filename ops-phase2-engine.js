(function () {
  "use strict";

  const DAY_MS = 24 * 60 * 60 * 1000;
  const PRICE_RANGES = [
    { id: "0-2999", label: "0〜2,999円", min: 0, max: 2999 },
    { id: "3000-4999", label: "3,000〜4,999円", min: 3000, max: 4999 },
    { id: "5000-6999", label: "5,000〜6,999円", min: 5000, max: 6999 },
    { id: "7000-9999", label: "7,000〜9,999円", min: 7000, max: 9999 },
    { id: "10000-", label: "10,000円以上", min: 10000, max: Infinity },
  ];

  const CSV_ALIASES = {
    occurredAt: ["発生日", "発生日時", "注文日", "クリック日時", "date", "occurred_at"],
    confirmedAt: ["確定日", "承認日", "confirmed_at"],
    productName: ["商品名", "成果対象", "item_name", "product"],
    productUrl: ["商品URL", "URL", "リンク先URL", "product_url"],
    productCode: ["商品コード", "itemCode", "item_code", "商品ID"],
    shopName: ["ショップ名", "店舗名", "shop"],
    shopCode: ["ショップコード", "shopCode", "shop_code"],
    salesAmount: ["売上金額", "売上", "成果売上", "amount"],
    quantity: ["件数", "個数", "数量", "quantity"],
    rewardAmount: ["成果報酬", "報酬", "報酬額", "reward"],
    status: ["ステータス", "状態", "status"],
    rate: ["料率", "rate"],
    device: ["デバイス", "device"],
    orderId: ["注文ID", "注文番号", "order_id"],
    trackingId: ["管理用ID", "トラッキングID", "tracking_id"],
  };

  const DEFAULT_PHASE2_RULES = [
    {
      id: "rule-adult-girly",
      collectionId: "adult-girly",
      name: "大人ガーリー即戦力",
      description: "甘めきれいめ・大人可愛い商品を高確信度で拾う",
      isActive: true,
      automationMode: "auto",
      minimumConfidence: 90,
      requiredConditions: { category: ["トップス", "ワンピース", "スカート", "バッグ", "シューズ"] },
      preferredConditions: { taste: ["大人可愛い", "甘め", "きれいめ"], scene: ["通勤", "カフェ", "旅行"] },
      excludedConditions: { category: ["ホテル・旅行", "スポーツウェア"] },
      maxBrandRatio: 0.3,
      maxCategoryRatio: 0.4,
      maxColorRatio: 0.35,
      maxPriceRangeRatio: 0.45,
      minimumSalePotentialScore: 68,
      minimumOperationPriorityScore: 70,
      priority: 80,
      targetItemCount: 35,
    },
    {
      id: "rule-office-cute",
      collectionId: "office-cute",
      name: "通勤も可愛い",
      description: "平日投稿に回しやすい上品服を集める",
      isActive: true,
      automationMode: "confirm",
      minimumConfidence: 84,
      requiredConditions: { scene: ["通勤", "オフィス"], category: ["トップス", "パンツ", "スカート", "バッグ", "シューズ"] },
      preferredConditions: { taste: ["きれいめ", "高見え"], function: ["ウォッシャブル", "シワになりにくい"] },
      excludedConditions: { taste: ["リゾート専用", "スポーツ専用"] },
      maxBrandRatio: 0.35,
      maxCategoryRatio: 0.42,
      maxColorRatio: 0.4,
      maxPriceRangeRatio: 0.5,
      minimumSalePotentialScore: 64,
      minimumOperationPriorityScore: 66,
      priority: 70,
      targetItemCount: 30,
    },
  ];

  function defaultCollectionRules(collections = []) {
    const existing = collections.map((collection) => normalizeRule(collection));
    const ids = new Set(existing.map((rule) => rule.collectionId));
    return [
      ...existing,
      ...DEFAULT_PHASE2_RULES.filter((rule) => !ids.has(rule.collectionId)).map((rule) => normalizeRule(rule)),
    ];
  }

  function normalizeRule(rule = {}) {
    const id = rule.id || `rule-${rule.collectionId || slug(rule.name || "collection")}`;
    const requiredConditions = rule.requiredConditions || rule.required || {};
    const preferredConditions = rule.preferredConditions || rule.preferred || {};
    const excludedConditions = rule.excludedConditions || rule.excluded || {};
    return {
      id,
      collectionId: rule.collectionId || rule.id || id,
      name: rule.name || "未命名コレクション",
      description: rule.description || "",
      isActive: rule.isActive !== false,
      automationMode: rule.automationMode || "confirm",
      minimumConfidence: Number(rule.minimumConfidence || rule.minConfidence || 86),
      requiredConditions,
      preferredConditions,
      excludedConditions,
      required: requiredConditions,
      preferred: preferredConditions,
      excluded: excludedConditions,
      maxBrandRatio: Number(rule.maxBrandRatio || 0.35),
      maxCategoryRatio: Number(rule.maxCategoryRatio || 0.45),
      maxColorRatio: Number(rule.maxColorRatio || 0.4),
      maxPriceRangeRatio: Number(rule.maxPriceRangeRatio || 0.5),
      minimumSalePotentialScore: Number(rule.minimumSalePotentialScore || 0),
      minimumOperationPriorityScore: Number(rule.minimumOperationPriorityScore || 0),
      priority: Number(rule.priority || 50),
      targetItemCount: Number(rule.targetItemCount || 30),
      seasonalStartDate: rule.seasonalStartDate || "",
      seasonalEndDate: rule.seasonalEndDate || "",
    };
  }

  function evaluateCollectionRule(product, rule, context = {}) {
    const normalizedRule = normalizeRule(rule);
    const reasons = [];
    const penalties = [];
    const violations = [];
    if (!normalizedRule.isActive || normalizedRule.automationMode === "disabled") {
      violations.push("ルールが停止中です");
      return result(0, reasons, penalties, violations, normalizedRule);
    }

    let score = 18 + Math.min(12, normalizedRule.priority / 10);
    const required = scoreConditions(product, normalizedRule.requiredConditions, 32, true);
    score += required.score;
    reasons.push(...required.reasons);
    violations.push(...required.violations);

    const preferred = scoreConditions(product, normalizedRule.preferredConditions, 30, false);
    score += preferred.score;
    reasons.push(...preferred.reasons);

    const excluded = scoreExcluded(product, normalizedRule.excludedConditions);
    score -= excluded.penalty;
    penalties.push(...excluded.penalties);
    violations.push(...excluded.violations);

    const saleScore = Number(product.salePotentialScore || product.ops?.salePotentialScore || 0);
    const opScore = Number(product.operationPriorityScore || product.ops?.operationPriorityScore || 0);
    if (saleScore >= normalizedRule.minimumSalePotentialScore) {
      const points = Math.min(8, Math.round((saleScore - normalizedRule.minimumSalePotentialScore) / 5));
      score += points;
      if (points) reasons.push({ label: "売れやすさが基準以上", points });
    } else if (normalizedRule.minimumSalePotentialScore) {
      penalties.push({ label: "売れやすさが基準未満", points: -8 });
      score -= 8;
    }
    if (opScore >= normalizedRule.minimumOperationPriorityScore) {
      const points = Math.min(8, Math.round((opScore - normalizedRule.minimumOperationPriorityScore) / 5));
      score += points;
      if (points) reasons.push({ label: "投稿準備が進めやすい", points });
    } else if (normalizedRule.minimumOperationPriorityScore) {
      penalties.push({ label: "運用優先度が基準未満", points: -8 });
      score -= 8;
    }

    const balancePenalty = collectionBalancePenalty(product, normalizedRule, context);
    score += balancePenalty.score;
    reasons.push(...balancePenalty.reasons);
    penalties.push(...balancePenalty.penalties);
    violations.push(...balancePenalty.violations);

    const performance = collectionPerformanceBoost(product, normalizedRule, context);
    score += performance.score;
    reasons.push(...performance.reasons);

    return result(score, reasons, penalties, violations, normalizedRule);
  }

  function result(score, reasons, penalties, violations, rule) {
    return {
      collectionId: rule.collectionId,
      name: rule.name,
      automationMode: rule.automationMode,
      minimumConfidence: rule.minimumConfidence,
      score: clamp(Math.round(score), 0, 100),
      reasons,
      penalties,
      violations,
      status: violations.length ? "blocked" : "candidate",
    };
  }

  function scoreConditions(product, conditions = {}, maxScore, required) {
    const entries = Object.entries(conditions || {}).filter(([, value]) => value != null && value !== "" && (!Array.isArray(value) || value.length));
    if (!entries.length) return { score: required ? maxScore : 0, reasons: [], violations: [] };
    let matched = 0;
    const reasons = [];
    const violations = [];
    entries.forEach(([field, expected]) => {
      const matchedField = matchesCondition(getFieldValue(product, field), expected, field, product);
      if (matchedField) {
        matched += 1;
        reasons.push({ label: `${labelFor(field)}が条件に一致`, points: Math.round(maxScore / entries.length) });
      } else if (required) {
        violations.push(`${labelFor(field)}が必須条件に未一致`);
      }
    });
    const ratio = matched / entries.length;
    return { score: Math.round(maxScore * ratio), reasons, violations };
  }

  function scoreExcluded(product, conditions = {}) {
    const penalties = [];
    const violations = [];
    Object.entries(conditions || {}).forEach(([field, expected]) => {
      if (matchesCondition(getFieldValue(product, field), expected, field, product)) {
        penalties.push({ label: `${labelFor(field)}が除外条件に一致`, points: -35 });
        violations.push(`${labelFor(field)}が除外条件に一致`);
      }
    });
    return { penalty: penalties.length ? 35 : 0, penalties, violations };
  }

  function collectionBalancePenalty(product, rule, context = {}) {
    const memberships = (context.collectionMemberships || []).filter((item) => item.collectionId === rule.collectionId && item.status !== "rejected");
    if (!memberships.length) return { score: 3, reasons: [{ label: "コレクションの初期充実枠", points: 3 }], penalties: [], violations: [] };
    const productMap = new Map((context.products || []).map((item) => [item.id, item]));
    const rows = memberships.map((item) => productMap.get(item.productId)).filter(Boolean);
    const checks = [
      ["brand", rule.maxBrandRatio, getBrand(product)],
      ["category", rule.maxCategoryRatio, product.category],
      ["colorFamily", rule.maxColorRatio, product.details?.color || product.ops?.color],
      ["priceRange", rule.maxPriceRangeRatio, priceRange(product.price).id],
    ];
    const penalties = [];
    const reasons = [];
    const violations = [];
    checks.forEach(([field, limit, value]) => {
      if (!value || !limit) return;
      const ratio = rows.filter((row) => String(getComparableField(row, field)) === String(value)).length / Math.max(1, rows.length);
      if (ratio >= limit) {
        penalties.push({ label: `${labelFor(field)}の偏りが上限に近い`, points: -5 });
        if (ratio > limit + 0.12) violations.push(`${labelFor(field)}の偏り上限超過`);
      } else if (ratio < limit * 0.45) {
        reasons.push({ label: `${labelFor(field)}の不足を補える`, points: 4 });
      }
    });
    return { score: reasons.reduce((sum, item) => sum + item.points, 0) + penalties.reduce((sum, item) => sum + item.points, 0), reasons, penalties, violations };
  }

  function collectionPerformanceBoost(product, rule, context = {}) {
    const aggregates = context.performanceAggregates || [];
    const related = aggregates.filter((item) => item.dimension === "collection" && item.dimensionValue === rule.collectionId && Number(item.sampleSize || 0) >= 20);
    if (!related.length) return { score: 0, reasons: [] };
    const aggregate = related[0];
    const lift = Number(aggregate.conversionRate || 0) / Math.max(0.01, Number(aggregate.baselineConversionRate || 0.01));
    if (lift >= 1.2) return { score: 6, reasons: [{ label: "同コレクションの直近成果が良い", points: 6 }] };
    if (lift < 0.75) return { score: -4, reasons: [{ label: "同コレクションの成果が弱め", points: -4 }] };
    return { score: 0, reasons: [] };
  }

  function classifyCollections(product, rules = [], context = {}) {
    return rules
      .map((rule) => evaluateCollectionRule(product, rule, context))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  function buildPendingMemberships(products = [], rules = [], context = {}) {
    const existingKeys = new Set((context.collectionMemberships || []).map((item) => `${item.collectionId}:${item.productId}`));
    const rows = [];
    products.forEach((product) => {
      classifyCollections(product, rules, context).forEach((fit) => {
        const key = `${fit.collectionId}:${product.id}`;
        if (existingKeys.has(key)) return;
        if (fit.automationMode === "auto" && fit.score >= fit.minimumConfidence && !fit.violations.length && isPostable(product)) {
          rows.push({
            id: stableHash(key).slice(0, 16),
            collectionId: fit.collectionId,
            productId: product.id,
            status: "pending_auto",
            confidence: fit.score,
            reasons: fit.reasons,
            createdAt: new Date().toISOString(),
          });
        }
      });
    });
    return rows;
  }

  function analyzeCollectionBalance(collection, memberships = [], products = [], salesResults = []) {
    const productMap = new Map(products.map((item) => [item.id, item]));
    const rows = memberships.filter((item) => item.collectionId === collection.collectionId || item.collectionId === collection.id).map((item) => productMap.get(item.productId)).filter(Boolean);
    const salesByProduct = groupBy(salesResults, (item) => item.productId || item.canonicalProductId || "");
    const dimensions = ["brand", "category", "colorFamily", "priceRange", "season", "taste", "scene"];
    const composition = {};
    dimensions.forEach((dimension) => {
      composition[dimension] = distribution(rows, (product) => getComparableField(product, dimension), salesByProduct);
    });
    const warnings = [];
    let status = rows.length < Math.max(8, Number(collection.targetItemCount || 20) * 0.35) ? "underfilled" : "healthy";
    Object.entries(composition).forEach(([dimension, values]) => {
      const top = values[0];
      if (!top || top.ratio < 0.5) return;
      if (top.salesContributionRatio >= top.ratio * 1.25) {
        status = status === "healthy" ? "performance_concentrated" : status;
        warnings.push(`${labelFor(dimension)}「${top.value}」に成果が集中しています`);
      } else {
        status = top.ratio >= 0.65 ? "imbalanced" : "watch";
        warnings.push(`${labelFor(dimension)}「${top.value}」が${Math.round(top.ratio * 100)}%です`);
      }
    });
    return {
      collectionId: collection.collectionId || collection.id,
      status,
      itemCount: rows.length,
      composition,
      warnings,
      recommendations: balanceRecommendations(composition),
      createdAt: new Date().toISOString(),
    };
  }

  function calculatePostSimilarity(candidate, existingPost, options = {}) {
    const weights = {
      sameProduct: 25,
      brand: 5,
      category: 8,
      colorFamily: 7,
      scene: 10,
      backgroundLocation: 8,
      pose: 7,
      problemSolution: 10,
      copyText: 12,
      imageLayout: 8,
    };
    let score = 0;
    const matchedFeatures = [];
    const differentFeatures = [];
    const productMatch = candidate.canonicalProductId && existingPost.canonicalProductId && candidate.canonicalProductId === existingPost.canonicalProductId;
    if (productMatch || candidate.productId === existingPost.productId) add("sameProduct", "同一商品", true);
    compare("brand", "ブランド");
    compare("category", "カテゴリ");
    compare("colorFamily", "色系統");
    compare("scene", "シーン");
    compare("backgroundLocation", "背景");
    compare("pose", "ポーズ");
    compare("problemSolution", "悩み訴求");
    compare("imageLayout", "構図");
    const copySimilarity = textSimilarity(normalizeCopy(candidate.copyText), normalizeCopy(existingPost.copyText));
    if (copySimilarity >= 0.72) {
      score += Math.round(weights.copyText * copySimilarity);
      matchedFeatures.push(`コピー類似 ${Math.round(copySimilarity * 100)}`);
    } else {
      differentFeatures.push("コピー");
    }
    const ageDays = daysBetween(existingPost.postedAt, new Date());
    if (Number.isFinite(ageDays) && ageDays > Number(options.compareDays || 90)) score = Math.round(score * 0.75);
    const status = score >= 80 ? "block" : score >= 60 ? "confirm" : score >= 40 ? "light" : "ok";
    return {
      existingPostId: existingPost.id,
      similarityScore: clamp(score, 0, 100),
      matchedFeatures,
      differentFeatures,
      status,
      recommendation: recommendationForSimilarity(score, existingPost),
      changeSuggestions: buildSimilarityChangeSuggestions(candidate, existingPost),
      createdAt: new Date().toISOString(),
    };

    function compare(field, label) {
      const same = comparable(candidate[field]) && comparable(candidate[field]) === comparable(existingPost[field]);
      add(field, label, same);
    }
    function add(field, label, same) {
      if (same) {
        score += weights[field] || 0;
        matchedFeatures.push(label);
      } else {
        differentFeatures.push(label);
      }
    }
  }

  function findSimilarPosts(candidate, posts = [], options = {}) {
    return posts
      .map((post) => calculatePostSimilarity(candidate, post, options))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 3);
  }

  function generateDecisionInbox(context = {}) {
    const items = [];
    const selectionItems = context.selectionItems || [];
    selectionItems.forEach((product) => {
      if (product.duplicateSummary && product.duplicateSummary.type !== "none" && Number(product.duplicateSummary.confidence || 0) < 82) {
        items.push(inbox("duplicate", "Product", product.id, "重複判定の確信度が低い", "同一商品として統合する", 82, product));
      }
      if (product.repost && /不可|注意|block|禁止/.test(String(product.repost.status))) {
        items.push(inbox("repost", "Product", product.id, product.repost.reason || "再投稿ルールの確認が必要", "再投稿を延期する", 88, product));
      }
      if (Number(product.salePotentialScore || 0) >= 82 && (product.missingItems || []).length) {
        items.push(inbox("data_missing", "Product", product.id, "売れそうだが投稿準備情報が不足", "不足項目を埋めて採用", 76, product));
      }
      const collections = product.recommendedCollections || [];
      if (collections.length >= 2 && Math.abs(Number(collections[0].score || 0) - Number(collections[1].score || 0)) <= 3) {
        items.push(inbox("collection", "Product", product.id, "推奨コレクションが同点に近い", "上位コレクションを採用", 72, product));
      } else if (collections[0] && Number(collections[0].score || 0) < 78) {
        items.push(inbox("collection", "Product", product.id, "分類確信度が低い", "人がコレクションを確認", 68, product));
      }
    });
    (context.postSimilarities || []).filter((item) => Number(item.similarityScore) >= 60).forEach((similarity) => {
      items.push(inbox("similar_post", "PostPlan", similarity.newPostPlanId, `投稿企画が過去投稿と${similarity.similarityScore}%類似`, "背景・訴求・コピーを変更", 84, similarity));
    });
    (context.salesAttributions || []).filter((item) => item.status !== "confirmed" && Number(item.confidence || 0) < 90).forEach((attribution) => {
      items.push(inbox("sales_link", "SalesResult", attribution.salesResultId, "売上実績の紐付けが曖昧", "商品または投稿へ手動紐付け", attribution.confidence || 60, attribution));
    });
    return dedupeBy(items, (item) => `${item.type}:${item.entityType}:${item.entityId}:${item.reason}`);
  }

  function inbox(type, entityType, entityId, reason, recommendedAction, confidence, source) {
    const priority = Math.round((Number(source.salePotentialScore || source.confidence || confidence || 50) + Number(confidence || 50)) / 2);
    return {
      id: stableHash(`${type}:${entityType}:${entityId}:${reason}`).slice(0, 18),
      type,
      entityType,
      entityId,
      reason,
      recommendedAction,
      recommendationConfidence: confidence,
      priority,
      status: "open",
      dueAt: new Date(Date.now() + (priority >= 85 ? 1 : 3) * DAY_MS).toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  function parseCsv(text) {
    const rows = [];
    let current = [];
    let field = "";
    let quoted = false;
    const input = String(text || "").replace(/^\uFEFF/, "");
    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];
      const next = input[index + 1];
      if (char === '"' && quoted && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        current.push(field);
        field = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && next === "\n") index += 1;
        current.push(field);
        if (current.some((cell) => String(cell).trim())) rows.push(current);
        current = [];
        field = "";
      } else {
        field += char;
      }
    }
    current.push(field);
    if (current.some((cell) => String(cell).trim())) rows.push(current);
    const headers = rows.shift() || [];
    return { headers, rows };
  }

  function autoMapColumns(headers = []) {
    const mapping = {};
    Object.entries(CSV_ALIASES).forEach(([field, aliases]) => {
      const found = headers.find((header) => aliases.some((alias) => normalizeHeader(alias) === normalizeHeader(header)));
      if (found) mapping[field] = found;
    });
    return mapping;
  }

  function rowsToSalesResults(headers = [], rows = [], mapping = {}, importId = "manual") {
    return rows.map((row, index) => {
      const record = {};
      Object.entries(mapping).forEach(([field, header]) => {
        const columnIndex = headers.indexOf(header);
        if (columnIndex >= 0) record[field] = row[columnIndex];
      });
      const result = normalizeSalesRecord(record);
      result.id = stableHash(`${importId}:${result.importFingerprint}`).slice(0, 20);
      result.csvImportId = importId;
      result.rowIndex = index;
      return result;
    });
  }

  function normalizeSalesRecord(record = {}) {
    const occurredAt = parseDate(record.occurredAt || record.confirmedAt || new Date());
    const salesAmount = number(record.salesAmount);
    const rewardAmount = number(record.rewardAmount);
    const quantity = Math.max(1, number(record.quantity) || 1);
    const normalizedProductName = normalizeName(record.productName || "");
    const normalizedUrl = normalizeUrl(record.productUrl || "");
    const productCode = clean(record.productCode || "");
    const shopCode = clean(record.shopCode || "");
    const fingerprintSource = record.orderId
      ? [record.orderId, productCode, occurredAt, salesAmount, rewardAmount].join("|")
      : [normalizedProductName, shopCode, String(occurredAt).slice(0, 10), salesAmount, quantity].join("|");
    return {
      occurredAt,
      confirmedAt: parseDate(record.confirmedAt || ""),
      productName: record.productName || "",
      normalizedProductName,
      productUrl: record.productUrl || "",
      normalizedUrl,
      productCode,
      shopName: record.shopName || "",
      shopCode,
      salesAmount,
      quantity,
      rewardAmount,
      status: record.status || "",
      rate: record.rate || "",
      device: record.device || "",
      orderId: record.orderId || "",
      trackingId: record.trackingId || "",
      importFingerprint: stableHash(fingerprintSource),
      createdAt: new Date().toISOString(),
    };
  }

  function attributeSales(result, products = [], posts = [], options = {}) {
    const candidates = products.map((product) => {
      const score = attributionScore(result, product);
      return { product, score };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
    const best = candidates[0];
    const productId = best?.product?.id || "";
    const post = choosePostForSale(result, productId, posts, options);
    const confidence = Math.min(100, Math.round((best?.score || 0) + (post ? 10 : 0)));
    return {
      id: stableHash(`${result.id || result.importFingerprint}:${productId}:${post?.id || "product"}`).slice(0, 20),
      salesResultId: result.id,
      productId,
      postId: post?.id || "",
      confidence,
      method: best?.score >= 92 ? "code_or_url" : best?.score >= 70 ? "name_shop" : "manual_required",
      status: confidence >= 90 ? "confirmed" : confidence >= 70 ? "provisional" : "needs_review",
      attributionWindowDays: Number(options.salesWindowDays || 30),
      createdAt: new Date().toISOString(),
    };
  }

  function attributionScore(result, product) {
    const ops = product.ops || {};
    const details = product.details || {};
    if (result.productCode && [ops.itemCode, details.itemCode, product.itemCode].filter(Boolean).includes(result.productCode)) return 95;
    if (result.normalizedUrl && result.normalizedUrl === normalizeUrl(product.url || product.productUrl || "")) return 94;
    if (result.shopCode && result.productCode && result.shopCode === (ops.shopCode || details.shopCode) && result.productCode === (ops.itemCode || details.itemCode)) return 92;
    if (ops.canonicalProductId && result.productCode && ops.canonicalProductId.includes(result.productCode)) return 88;
    const nameScore = textSimilarity(normalizeName(result.productName), normalizeName(product.name));
    const shopBonus = result.shopCode && result.shopCode === (ops.shopCode || details.shopCode) ? 16 : 0;
    return Math.round(nameScore * 74 + shopBonus);
  }

  function choosePostForSale(result, productId, posts = [], options = {}) {
    const saleTime = new Date(result.occurredAt || Date.now()).getTime();
    const windowDays = Number(options.salesWindowDays || 30);
    return posts
      .filter((post) => post.productId === productId || post.canonicalProductId === productId)
      .filter((post) => post.postedAt && new Date(post.postedAt).getTime() <= saleTime)
      .filter((post) => saleTime - new Date(post.postedAt).getTime() <= windowDays * DAY_MS)
      .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))[0] || null;
  }

  function aggregatePerformance({ products = [], posts = [], salesResults = [], attributions = [], metrics = [] } = {}) {
    const productMap = new Map(products.map((item) => [item.id, item]));
    const attributedSales = salesResults.map((sale) => {
      const attribution = attributions.find((item) => item.salesResultId === sale.id && item.status !== "needs_review");
      const product = productMap.get(attribution?.productId);
      return { sale, attribution, product };
    }).filter((item) => item.product);
    const rows = [];
    const dimensions = [
      ["brand", (p) => getBrand(p)],
      ["category", (p) => p.category || "未分類"],
      ["priceRange", (p) => priceRange(p.price).label],
      ["collection", (p, attribution) => attribution?.collectionId || (posts.find((post) => post.id === attribution?.postId)?.collectionIds || [])[0] || "未分類"],
      ["scoreBand", (p) => scoreBand(p.salePotentialScore || p.ops?.salePotentialScore || 0)],
    ];
    dimensions.forEach(([dimension, getter]) => {
      const grouped = new Map();
      products.forEach((product) => {
        const value = getter(product, null) || "未分類";
        if (!grouped.has(value)) grouped.set(value, baseAggregate(dimension, value));
        grouped.get(value).postCount += posts.filter((post) => post.productId === product.id).length;
        grouped.get(value).sampleSize += 1;
      });
      attributedSales.forEach(({ sale, attribution, product }) => {
        const value = getter(product, attribution) || "未分類";
        if (!grouped.has(value)) grouped.set(value, baseAggregate(dimension, value));
        const aggregate = grouped.get(value);
        aggregate.salesCount += Number(sale.quantity || 1);
        aggregate.salesAmount += Number(sale.salesAmount || 0);
        aggregate.rewardAmount += Number(sale.rewardAmount || 0);
      });
      metrics.forEach((metric) => {
        if (dimension !== "scoreBand") return;
        const value = scoreBand(metric.salePotentialScore || 0);
        if (!grouped.has(value)) grouped.set(value, baseAggregate(dimension, value));
        grouped.get(value).clicks += Number(metric.clicks || 0);
      });
      grouped.forEach((aggregate) => {
        aggregate.conversionRate = aggregate.clicks ? aggregate.salesCount / aggregate.clicks : aggregate.postCount ? aggregate.salesCount / aggregate.postCount : 0;
        aggregate.baselineConversionRate = 0;
        rows.push(aggregate);
      });
    });
    const baseline = rows.reduce((sum, row) => sum + row.salesCount, 0) / Math.max(1, rows.reduce((sum, row) => sum + row.sampleSize, 0));
    rows.forEach((row) => { row.baselineConversionRate = baseline; });
    return rows;
  }

  function calculateScoreAdjustments(aggregates = [], enabled = true) {
    if (!enabled) return [];
    return aggregates.map((aggregate) => {
      const sample = Number(aggregate.sampleSize || aggregate.postCount || 0);
      if (sample < 20) return null;
      const max = sample >= 100 ? 10 : sample >= 50 ? 5 : 2;
      const baseline = Math.max(0.001, Number(aggregate.baselineConversionRate || 0.001));
      const lift = Number(aggregate.conversionRate || 0) / baseline;
      let value = 0;
      if (lift >= 1.5) value = max;
      else if (lift >= 1.2) value = Math.ceil(max / 2);
      else if (lift < 0.5) value = -max;
      else if (lift < 0.8) value = -Math.ceil(max / 2);
      return {
        id: stableHash(`${aggregate.dimension}:${aggregate.dimensionValue}`).slice(0, 18),
        dimension: aggregate.dimension,
        dimensionValue: aggregate.dimensionValue,
        sampleSize: sample,
        conversionRate: aggregate.conversionRate,
        baselineConversionRate: aggregate.baselineConversionRate,
        adjustmentValue: clamp(value, -10, 10),
        confidence: sample >= 100 ? "high" : sample >= 50 ? "medium" : "low",
        isEnabled: true,
        reason: reasonForAdjustment(value, aggregate),
        validFrom: new Date().toISOString(),
      };
    }).filter(Boolean);
  }

  function applyScoreAdjustments(product, adjustments = []) {
    const enabled = adjustments.filter((item) => item.isEnabled !== false && Number(item.adjustmentValue));
    const details = [
      ["brand", getBrand(product)],
      ["category", product.category],
      ["priceRange", priceRange(product.price).label],
      ["scoreBand", scoreBand(product.salePotentialScore || product.ops?.salePotentialScore || 0)],
    ];
    const matched = enabled.filter((adjustment) => details.some(([dimension, value]) => adjustment.dimension === dimension && String(adjustment.dimensionValue) === String(value)));
    const correction = clamp(matched.reduce((sum, item) => sum + Number(item.adjustmentValue || 0), 0), -10, 10);
    return {
      baseScore: Number(product.salePotentialScore || 0),
      correction,
      finalScore: clamp(Number(product.salePotentialScore || 0) + correction, 0, 100),
      matchedAdjustments: matched,
    };
  }

  function buildWeeklyInsights(context = {}) {
    const aggregates = context.performanceAggregates || [];
    const best = [...aggregates].filter((item) => Number(item.sampleSize || 0) >= 5).sort((a, b) => (b.conversionRate || 0) - (a.conversionRate || 0)).slice(0, 5);
    const weak = [...aggregates].filter((item) => Number(item.sampleSize || 0) >= 5).sort((a, b) => (a.conversionRate || 0) - (b.conversionRate || 0)).slice(0, 5);
    const decisionCount = (context.userDecisions || []).filter((item) => withinDays(item.createdAt, 7)).length;
    return {
      id: `weekly-${dateKey(new Date())}`,
      periodStart: new Date(Date.now() - 7 * DAY_MS).toISOString(),
      periodEnd: new Date().toISOString(),
      facts: best.map((item) => `${labelFor(item.dimension)}「${item.dimensionValue}」は${item.sampleSize}件中、成果${item.salesCount}件です。`),
      assumptions: best.map((item) => `${item.dimensionValue}は今のフォロワー層と相性がよい可能性があります。`),
      recommendations: [
        ...best.slice(0, 3).map((item) => `${item.dimensionValue}を次回候補で少し優先する`),
        ...weak.slice(0, 2).map((item) => `${item.dimensionValue}は訴求やコレクションを見直す`),
      ],
      manualDecisionCount: decisionCount,
      createdAt: new Date().toISOString(),
    };
  }

  function previewRule(rule, products = [], context = {}) {
    const normalized = normalizeRule(rule);
    const matches = products.map((product) => ({ product, fit: evaluateCollectionRule(product, normalized, context) })).filter((item) => item.fit.score >= normalized.minimumConfidence && !item.fit.violations.length);
    return {
      rule: normalized,
      targetCount: matches.length,
      autoTargetCount: normalized.automationMode === "auto" ? matches.length : 0,
      samples: matches.slice(0, 30),
    };
  }

  function getFieldValue(product, field) {
    if (field === "brand") return getBrand(product);
    if (field === "priceRange") return priceRange(product.price).label;
    if (field === "salePotentialScore") return Number(product.salePotentialScore || product.ops?.salePotentialScore || 0);
    if (field === "operationPriorityScore") return Number(product.operationPriorityScore || product.ops?.operationPriorityScore || 0);
    return product[field] || product.details?.[field] || product.ops?.[field] || product.tags?.[field] || "";
  }

  function matchesCondition(value, expected, field, product) {
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      const actual = Number(getFieldValue(product, field));
      if (expected.gte != null && actual < Number(expected.gte)) return false;
      if (expected.lte != null && actual > Number(expected.lte)) return false;
      return true;
    }
    const values = Array.isArray(expected) ? expected : [expected];
    const text = comparable(value);
    return values.some((item) => text.includes(comparable(item)) || comparable(item).includes(text));
  }

  function distribution(rows, getter, salesByProduct) {
    const map = new Map();
    rows.forEach((row) => {
      const value = getter(row) || "未分類";
      if (!map.has(value)) map.set(value, { value, count: 0, salesAmount: 0 });
      const entry = map.get(value);
      entry.count += 1;
      entry.salesAmount += (salesByProduct.get(row.id) || []).reduce((sum, item) => sum + Number(item.salesAmount || 0), 0);
    });
    const total = Math.max(1, rows.length);
    const totalSales = [...map.values()].reduce((sum, item) => sum + item.salesAmount, 0) || 1;
    return [...map.values()].map((item) => ({ ...item, ratio: item.count / total, salesContributionRatio: item.salesAmount / totalSales })).sort((a, b) => b.count - a.count);
  }

  function balanceRecommendations(composition) {
    const recs = [];
    Object.entries(composition).forEach(([dimension, values]) => {
      const top = values[0];
      if (top && top.ratio >= 0.55 && top.salesContributionRatio < top.ratio * 0.6) {
        recs.push(`${labelFor(dimension)}「${top.value}」が多めです。次は別の${labelFor(dimension)}を優先してください。`);
      }
    });
    return recs.slice(0, 4);
  }

  function getComparableField(product, field) {
    if (field === "brand") return getBrand(product);
    if (field === "colorFamily") return product.details?.color || product.ops?.color || "未分類";
    if (field === "priceRange") return priceRange(product.price).id;
    if (field === "taste") return (product.tags?.taste || product.taste || [])[0] || "未分類";
    if (field === "scene") return (product.tags?.scene || product.scene || [])[0] || "未分類";
    return product[field] || product.details?.[field] || "未分類";
  }

  function baseAggregate(dimension, value) {
    return {
      id: stableHash(`${dimension}:${value}`).slice(0, 18),
      dimension,
      dimensionValue: value || "未分類",
      sampleSize: 0,
      postCount: 0,
      clicks: 0,
      salesCount: 0,
      salesAmount: 0,
      rewardAmount: 0,
      conversionRate: 0,
      baselineConversionRate: 0,
      createdAt: new Date().toISOString(),
    };
  }

  function normalizeCopy(text) {
    return normalizeName(text)
      .replace(/#[^\s#]+/g, "")
      .replace(/[♡♥❤💕✨🌸🎀👗🛍️🔥💡✅]/g, "")
      .replace(/ファッションハナコ|可愛さラボ|楽天ROOM/g, "")
      .replace(/\s+/g, "");
  }

  function normalizeName(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[【】\[\]（）()『』「」"'“”]/g, " ")
      .replace(/sale|新色|追加|再入荷|予約|web限定|送料無料|ポイント|ランキング|off|円|税込/gi, " ")
      .replace(/[0-9０-９,.，、%％]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function textSimilarity(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;
    const aSet = new Set([...a]);
    const bSet = new Set([...b]);
    const intersection = [...aSet].filter((item) => bSet.has(item)).length;
    return intersection / Math.max(1, Math.max(aSet.size, bSet.size));
  }

  function buildSimilarityChangeSuggestions(candidate, existingPost) {
    const suggestions = [];
    if (candidate.backgroundLocation === existingPost.backgroundLocation) suggestions.push("背景都市や場所を変える");
    if (candidate.scene === existingPost.scene) suggestions.push("シーンを通勤・旅行・カフェなど別軸にする");
    if (candidate.problemSolution === existingPost.problemSolution) suggestions.push("訴求を高見えから体型カバーなどへ変える");
    if (candidate.pose === existingPost.pose) suggestions.push("ポーズと構図を変える");
    if (textSimilarity(normalizeCopy(candidate.copyText), normalizeCopy(existingPost.copyText)) > 0.6) suggestions.push("冒頭コピーを別の悩み解決にする");
    return suggestions.slice(0, 5).concat(["登録コレクションを変える", "季節ワードを入れ替える"]).slice(0, 5);
  }

  function recommendationForSimilarity(score, existingPost) {
    const hadSales = Number(existingPost.sales || existingPost.orders || 0) > 0;
    if (score >= 80) return hadSales ? "成功パターン再利用候補。ただし3項目以上変更してください。" : "新鮮さ不足。原則ブロックです。";
    if (score >= 60) return "確認推奨。背景・悩み・コピーの変更で通せます。";
    if (score >= 40) return "軽い類似。連続投稿だけ避ければ問題ありません。";
    return "問題なし";
  }

  function reasonForAdjustment(value, aggregate) {
    if (!value) return "全体平均に近いため補正なし";
    const direction = value > 0 ? "成果が平均より強い" : "成果が平均より弱い";
    return `${labelFor(aggregate.dimension)}「${aggregate.dimensionValue}」は${direction}ため${value > 0 ? "加点" : "減点"}`;
  }

  function priceRange(price) {
    const value = number(price);
    return PRICE_RANGES.find((range) => value >= range.min && value <= range.max) || PRICE_RANGES[0];
  }

  function scoreBand(score) {
    const value = Number(score || 0);
    if (value >= 90) return "90〜100";
    if (value >= 80) return "80〜89";
    if (value >= 70) return "70〜79";
    if (value >= 60) return "60〜69";
    return "59以下";
  }

  function isPostable(product) {
    return !/不可|禁止|block/.test(String(product.repost?.status || ""));
  }

  function getBrand(product) {
    return product.brand || product.details?.brand || product.ops?.brand || product.shopName || "未設定";
  }

  function normalizeUrl(value) {
    try {
      const url = new URL(String(value || ""), location.href);
      ["scid", "iasid", "s-id", "l-id", "rafcid", "utm_source", "utm_medium", "utm_campaign"].forEach((key) => url.searchParams.delete(key));
      url.hash = "";
      return url.href.replace(/\/$/, "");
    } catch {
      return String(value || "").trim();
    }
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function comparable(value) {
    return normalizeName(Array.isArray(value) ? value.join(" ") : value);
  }

  function normalizeHeader(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  }

  function number(value) {
    const numeric = String(value || "").replace(/[^\d.-]/g, "");
    return Number(numeric || 0);
  }

  function parseDate(value) {
    if (!value) return "";
    const text = String(value).trim().replace(/\./g, "/").replace(/年|月/g, "/").replace(/日/g, "");
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  function daysBetween(a, b) {
    if (!a || !b) return Infinity;
    return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / DAY_MS);
  }

  function withinDays(date, days) {
    return date && Date.now() - new Date(date).getTime() <= days * DAY_MS;
  }

  function dateKey(date) {
    return new Date(date).toISOString().slice(0, 10);
  }

  function groupBy(list, getter) {
    const map = new Map();
    list.forEach((item) => {
      const key = getter(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return map;
  }

  function dedupeBy(list, getter) {
    const map = new Map();
    list.forEach((item) => {
      const key = getter(item);
      if (!map.has(key) || Number(item.priority || 0) > Number(map.get(key).priority || 0)) map.set(key, item);
    });
    return [...map.values()].sort((a, b) => b.priority - a.priority);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function slug(value) {
    return String(value || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "item";
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
      brand: "ブランド",
      category: "カテゴリ",
      subCategory: "サブカテゴリ",
      colorFamily: "色",
      priceRange: "価格帯",
      season: "季節",
      taste: "テイスト",
      scene: "シーン",
      function: "機能",
      salePotentialScore: "売れやすさ",
      operationPriorityScore: "運用優先度",
      collection: "コレクション",
      scoreBand: "スコア帯",
    }[field] || field;
  }

  window.HanakoPhase2Engine = {
    PRICE_RANGES,
    CSV_ALIASES,
    defaultCollectionRules,
    normalizeRule,
    evaluateCollectionRule,
    classifyCollections,
    buildPendingMemberships,
    analyzeCollectionBalance,
    calculatePostSimilarity,
    findSimilarPosts,
    generateDecisionInbox,
    parseCsv,
    autoMapColumns,
    rowsToSalesResults,
    normalizeSalesRecord,
    attributeSales,
    aggregatePerformance,
    calculateScoreAdjustments,
    applyScoreAdjustments,
    buildWeeklyInsights,
    previewRule,
    normalizeCopy,
    normalizeName,
    stableHash,
  };
})();
