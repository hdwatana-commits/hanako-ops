(function () {
  "use strict";

  const DAY_MS = 24 * 60 * 60 * 1000;
  const DIMENSIONS = ["brand", "category", "priceRange", "scene", "background", "copyType", "season"];

  function runLearningCycle(context = {}) {
    const now = new Date();
    const observations = buildLearningEvents(context, now);
    const knowledge = buildKnowledgeBase(observations, context);
    const winPatterns = buildPatterns(knowledge, "win");
    const losePatterns = buildPatterns(knowledge, "lose");
    const retrospective = buildDailyRetrospective(observations, winPatterns, losePatterns, now);
    const improvements = buildImprovementPlan(retrospective, knowledge, context);
    const weightProposals = buildWeightProposals(knowledge);
    const exploration = buildExplorationPlan(context.products || [], knowledge, context);
    const simulations = buildSimulations(context.aiPostPlans || [], improvements, knowledge);
    const weeklyMeeting = buildWeeklyMeeting(observations, winPatterns, losePatterns, improvements, now);
    const monthlyMeeting = buildMonthlyMeeting(knowledge, improvements, now);
    const dashboard = buildDashboard(context, knowledge, winPatterns, losePatterns, exploration, improvements);

    return {
      id: stableHash(`phase4:${dateKey(now)}:${observations.length}:${knowledge.length}`),
      generatedAt: now.toISOString(),
      observations,
      knowledge,
      winPatterns,
      losePatterns,
      retrospective,
      improvements,
      weightProposals,
      exploration,
      simulations,
      weeklyMeeting,
      monthlyMeeting,
      dashboard,
      mcpReadyInterfaces: [
        "rakuten-api.product-search",
        "image-generation.create-cover",
        "google-drive.save-report",
        "calendar.schedule-posts",
        "notion.publish-meeting-note",
      ],
    };
  }

  function buildLearningEvents(context, now = new Date()) {
    const products = context.products || [];
    const posts = context.posts || [];
    const plans = context.aiPostPlans || [];
    const sales = context.salesResults || [];
    const metrics = context.metrics || [];
    const events = [];
    const productById = new Map(products.map((product) => [product.id, product]));
    const planByProduct = new Map(plans.map((plan) => [plan.productId, plan]));

    posts.forEach((post) => {
      const product = productById.get(post.productId) || products.find((item) => item.name === post.productName) || {};
      const relatedSales = sales.filter((sale) => sale.postId === post.id || sale.productId === product.id || sale.productName === product.name);
      const relatedMetric = metrics.find((metric) => metric.postId === post.id || metric.productId === product.id) || {};
      events.push(buildEvent({ product, post, plan: planByProduct.get(product.id), sales: relatedSales, metric: relatedMetric, now }));
    });

    plans.forEach((plan) => {
      if (events.some((event) => event.productId === plan.productId)) return;
      const product = productById.get(plan.productId) || {};
      const relatedSales = sales.filter((sale) => sale.productId === product.id || sale.productName === product.name);
      events.push(buildEvent({ product, post: {}, plan, sales: relatedSales, metric: {}, now }));
    });

    sales.forEach((sale) => {
      if (events.some((event) => event.salesIds.includes(sale.id))) return;
      const product = productById.get(sale.productId) || products.find((item) => item.name === sale.productName) || {};
      events.push(buildEvent({ product, post: {}, plan: planByProduct.get(product.id), sales: [sale], metric: {}, now }));
    });

    products.slice(0, 200).forEach((product) => {
      if (events.some((event) => event.productId === product.id)) return;
      events.push(buildEvent({ product, post: {}, plan: planByProduct.get(product.id), sales: [], metric: {}, now, candidateOnly: true }));
    });

    return events.slice(0, 500);
  }

  function buildEvent({ product = {}, post = {}, plan = {}, sales = [], metric = {}, now = new Date(), candidateOnly = false }) {
    const postedAt = post.postedAt || post.createdAt || plan.approvedAt || plan.createdAt || product.createdAt || now.toISOString();
    const date = new Date(postedAt);
    const clicks = number(metric.clicks || post.clicks || sales.reduce((sum, sale) => sum + number(sale.clicks), 0));
    const salesCount = sales.reduce((sum, sale) => sum + number(sale.quantity || sale.salesCount || 1), 0);
    const salesAmount = sales.reduce((sum, sale) => sum + number(sale.salesAmount || sale.amount), 0);
    const rewardAmount = sales.reduce((sum, sale) => sum + number(sale.rewardAmount || sale.reward), 0);
    const aiScore = number(plan.aiTotalScore || product.aiTotalScore || product.salePotentialScore || product.ops?.salePotentialScore || 0);
    const actualScore = salesAmount ? clamp(55 + salesCount * 12 + rewardAmount / 100, 0, 100) : clicks ? clamp(35 + clicks * 2, 0, 100) : 0;
    const outcome = candidateOnly ? "candidate" : actualScore >= 70 ? "win" : actualScore > 0 ? "watch" : "lose";
    const text = `${product.name || ""} ${product.category || ""} ${product.hook || ""} ${plan.theme?.label || ""} ${plan.coordinate?.scene || ""} ${plan.copyBundle?.room || ""}`;
    return {
      id: stableHash(`event:${product.id || product.name}:${post.id || plan.id || dateKey(date)}`),
      productId: product.id || "",
      productName: product.name || "Unknown product",
      postId: post.id || "",
      planId: plan.id || "",
      salesIds: sales.map((sale) => sale.id).filter(Boolean),
      postedAt: date.toISOString(),
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
      hour: date.getHours(),
      brand: product.details?.brand || product.brand || "Unknown",
      category: product.category || "fashion",
      priceRange: priceRange(product.price),
      reviewBand: reviewBand(product.reviewCount || product.reviews),
      rankingBand: rankingBand(product.ranking || product.rank),
      imageFeatures: inferImageFeatures(product, plan),
      background: plan.coordinate?.background || plan.theme?.background || post.backgroundLocation || inferBackground(text),
      copyType: inferCopyType(text),
      scene: plan.coordinate?.scene || plan.theme?.scene || post.scene || inferScene(text),
      season: inferSeason(date, text),
      collection: plan.collectionCandidates?.[0]?.name || post.collectionName || "unclassified",
      imagePrompt: plan.imageJob?.prompt || post.imagePrompt || "",
      copyText: plan.copyBundle?.room || post.copyText || "",
      operatorRating: number(post.operatorRating || plan.operatorRating),
      aiPredictedScore: aiScore,
      actualScore,
      clicks,
      salesCount,
      salesAmount,
      rewardAmount,
      outcome,
      evidence: {
        hasSales: sales.length > 0,
        hasPost: Boolean(post.id),
        hasAiPlan: Boolean(plan.id),
        sourceFields: ["product", "post", "aiPostPlan", "salesResult", "metric"],
      },
      createdAt: new Date().toISOString(),
    };
  }

  function buildKnowledgeBase(events, context = {}) {
    const rows = [];
    DIMENSIONS.forEach((dimension) => {
      const groups = groupBy(events, (event) => event[dimension] || "unknown");
      Object.entries(groups).forEach(([value, items]) => {
        if (!value || value === "unknown") return;
        const posted = items.filter((item) => item.outcome !== "candidate");
        const salesCount = sum(items, "salesCount");
        const clicks = sum(items, "clicks");
        const rewardAmount = sum(items, "rewardAmount");
        const conversionRate = posted.length ? salesCount / Math.max(1, posted.length) : 0;
        const avgPrediction = average(items.map((item) => item.aiPredictedScore).filter(Boolean));
        const avgActual = average(items.map((item) => item.actualScore).filter(Boolean));
        const confidence = clamp(posted.length * 8 + salesCount * 12 + clicks, 0, 100);
        rows.push({
          id: stableHash(`knowledge:${dimension}:${value}`),
          type: dimension,
          value,
          sampleSize: posted.length,
          candidateSize: items.length,
          salesCount,
          clicks,
          rewardAmount,
          conversionRate,
          avgPrediction,
          avgActual,
          confidence,
          verdict: confidence < 20 ? "insufficient" : avgActual >= avgPrediction + 8 || conversionRate >= 0.2 ? "underrated" : avgActual + 8 < avgPrediction ? "overrated" : salesCount ? "stable_win" : "neutral",
          evidenceIds: items.slice(0, 12).map((item) => item.id),
          updatedAt: new Date().toISOString(),
        });
      });
    });

    (context.aiKnowledgeBase || []).forEach((item) => {
      if (!rows.some((row) => row.id === item.id)) rows.push(item);
    });
    return rows.sort((a, b) => b.confidence - a.confidence).slice(0, 600);
  }

  function buildPatterns(knowledge, mode) {
    const isWin = mode === "win";
    return knowledge
      .filter((item) => item.confidence >= 20)
      .filter((item) => isWin ? ["underrated", "stable_win"].includes(item.verdict) : item.verdict === "overrated")
      .sort((a, b) => (b.conversionRate - a.conversionRate) || (b.confidence - a.confidence))
      .slice(0, 12)
      .map((item) => ({
        id: stableHash(`${mode}:${item.id}`),
        patternType: mode,
        title: `${labelDimension(item.type)}: ${item.value}`,
        dimension: item.type,
        value: item.value,
        score: Math.round(clamp(item.conversionRate * 100 + item.confidence * 0.4, 0, 100)),
        reason: isWin
          ? `${item.sampleSize} posts, ${item.salesCount} sales. Keep using this signal.`
          : `${item.sampleSize} posts underperformed versus AI prediction. Reduce exposure or change angle.`,
        evidenceIds: item.evidenceIds || [],
        createdAt: new Date().toISOString(),
      }));
  }

  function buildDailyRetrospective(events, wins, losses, now) {
    const posted = events.filter((event) => event.outcome !== "candidate" && isSameDate(event.postedAt, now));
    const target = posted.length ? posted : events.filter((event) => event.outcome !== "candidate").slice(0, 60);
    const highPredicted = target.filter((event) => event.aiPredictedScore >= 90);
    const sold = target.filter((event) => event.salesCount > 0);
    const missed = highPredicted.filter((event) => !event.salesCount);
    return {
      id: stableHash(`retro:${dateKey(now)}`),
      date: dateKey(now),
      postedCount: target.length,
      highPredictionCount: highPredicted.length,
      soldCount: sold.length,
      missedCount: missed.length,
      summary: target.length
        ? `${target.length} learned items. ${sold.length} sales signals, ${missed.length} high-score misses.`
        : "No completed posts yet. Learning will start from candidates and operator decisions.",
      causes: [
        topCause(missed, "priceRange", "Price range may be overestimated"),
        topCause(missed, "background", "Background may not match audience"),
        topCause(missed, "copyType", "Copy angle may need change"),
        topCause(missed, "brand", "Brand signal needs calibration"),
      ].filter(Boolean),
      winPatternIds: wins.slice(0, 5).map((item) => item.id),
      losePatternIds: losses.slice(0, 5).map((item) => item.id),
      evidenceIds: target.slice(0, 20).map((item) => item.id),
      createdAt: new Date().toISOString(),
    };
  }

  function buildImprovementPlan(retrospective, knowledge) {
    const wins = knowledge.filter((item) => ["underrated", "stable_win"].includes(item.verdict)).slice(0, 4);
    const losses = knowledge.filter((item) => item.verdict === "overrated").slice(0, 4);
    const actions = [];
    wins.forEach((item) => {
      actions.push({
        id: stableHash(`improve:more:${item.id}`),
        action: `Increase ${labelDimension(item.type)} "${item.value}"`,
        expectedImpact: Math.round(clamp(item.conversionRate * 100, 2, 12)),
        reason: `${item.value} has stronger actual results than baseline.`,
        evidenceIds: item.evidenceIds,
      });
    });
    losses.forEach((item) => {
      actions.push({
        id: stableHash(`improve:less:${item.id}`),
        action: `Reduce or rewrite ${labelDimension(item.type)} "${item.value}"`,
        expectedImpact: Math.round(clamp(item.confidence / 12, 1, 8)),
        reason: `${item.value} underperformed versus prediction.`,
        evidenceIds: item.evidenceIds,
      });
    });
    if (!actions.length) {
      actions.push({
        id: stableHash("improve:explore"),
        action: "Reserve 15% exploration slots",
        expectedImpact: 3,
        reason: "Not enough outcome data. Keep learning with controlled experiments.",
        evidenceIds: [],
      });
    }
    return actions.slice(0, 10);
  }

  function buildWeightProposals(knowledge) {
    return knowledge
      .filter((item) => item.confidence >= 20)
      .slice(0, 20)
      .map((item) => {
        const delta = item.verdict === "underrated" || item.verdict === "stable_win"
          ? clamp(Math.round(item.confidence / 25), 1, 5)
          : item.verdict === "overrated"
            ? -clamp(Math.round(item.confidence / 25), 1, 5)
            : 0;
        return {
          id: stableHash(`weight:${item.id}`),
          dimension: item.type,
          value: item.value,
          proposedDelta: delta,
          reason: delta > 0 ? "Actual performance is stronger than prediction." : delta < 0 ? "AI overestimated this signal." : "Keep current weight.",
          sampleSize: item.sampleSize,
          confidence: item.confidence,
          status: "proposal",
        };
      })
      .filter((item) => item.proposedDelta !== 0)
      .slice(0, 12);
  }

  function buildExplorationPlan(products, knowledge, context) {
    const seenValues = new Set(knowledge.filter((item) => item.confidence >= 40).map((item) => `${item.type}:${item.value}`));
    const candidates = products
      .map((product) => {
        const dimensions = {
          brand: product.details?.brand || product.brand || "Unknown",
          category: product.category || "fashion",
          priceRange: priceRange(product.price),
        };
        const unknownCount = Object.entries(dimensions).filter(([key, value]) => !seenValues.has(`${key}:${value}`)).length;
        const base = number(product.salePotentialScore || product.ops?.salePotentialScore || 55);
        return {
          id: stableHash(`explore:${product.id}`),
          productId: product.id,
          productName: product.name,
          explorationScore: clamp(base * 0.55 + unknownCount * 15 + (product.image ? 8 : 0), 0, 100),
          reason: unknownCount ? "Under-tested brand/category/price signal." : "Controlled creative variation for learning.",
          dimensions,
        };
      })
      .sort((a, b) => b.explorationScore - a.explorationScore);
    const targetCount = Math.max(1, Math.ceil(Math.min(products.length, 30) * 0.15));
    return {
      id: stableHash(`exploration:${dateKey(new Date())}`),
      ratio: 0.15,
      targetCount,
      candidates: candidates.slice(0, targetCount),
      rule: "Use 10-20% of daily slots for exploration and 80-90% for proven signals.",
      createdAt: new Date().toISOString(),
    };
  }

  function buildSimulations(plans, improvements, knowledge) {
    return plans.slice(0, 12).map((plan) => {
      const actions = improvements.slice(0, 3).map((item) => ({
        change: item.action,
        estimatedLiftPercent: item.expectedImpact,
        evidenceIds: item.evidenceIds || [],
      }));
      if (!actions.length) actions.push({ change: "Keep current plan", estimatedLiftPercent: 0, evidenceIds: [] });
      return {
        id: stableHash(`simulation:${plan.id}`),
        planId: plan.id,
        productId: plan.productId,
        productName: plan.productName,
        currentScore: number(plan.aiTotalScore),
        actions,
        createdAt: new Date().toISOString(),
      };
    });
  }

  function buildWeeklyMeeting(events, wins, losses, improvements, now) {
    const weekEvents = events.filter((event) => daysBetween(event.postedAt, now) <= 7 && event.outcome !== "candidate");
    return {
      id: stableHash(`weekly-meeting:${weekKey(now)}`),
      title: `Weekly AI meeting ${weekKey(now)}`,
      facts: [
        `${weekEvents.length} posts reviewed.`,
        `${sum(weekEvents, "salesCount")} sales signals.`,
        `${wins.length} win patterns and ${losses.length} risk patterns detected.`,
      ],
      assumptions: improvements.slice(0, 5).map((item) => item.reason),
      nextStrategy: improvements.slice(0, 5).map((item) => item.action),
      createdAt: now.toISOString(),
    };
  }

  function buildMonthlyMeeting(knowledge, improvements, now) {
    return {
      id: stableHash(`monthly-meeting:${now.getFullYear()}-${now.getMonth() + 1}`),
      title: `Monthly strategy ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      nextMonthStrategy: [
        seasonalStrategy(now),
        ...improvements.slice(0, 4).map((item) => item.action),
      ],
      knowledgeCount: knowledge.length,
      createdAt: now.toISOString(),
    };
  }

  function buildDashboard(context, knowledge, wins, losses, exploration, improvements) {
    const products = context.products || [];
    const top10 = products
      .map((product) => {
        const boost = knowledgeBoost(product, knowledge);
        const base = number(product.salePotentialScore || product.ops?.salePotentialScore || 55);
        return {
          productId: product.id,
          productName: product.name,
          score: Math.round(clamp(base + boost, 0, 100)),
          reason: boost >= 0 ? "Matches learned winning signals." : "Includes caution signals.",
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    return {
      top10,
      recommendedPosts: (context.aiPostPlans || []).slice(0, 5).map((plan) => ({ planId: plan.id, productName: plan.productName, score: plan.aiTotalScore })),
      weeklyImprovements: improvements.slice(0, 5),
      explorationItems: exploration.candidates || [],
      winPatterns: wins.slice(0, 5),
      cautionBrands: losses.filter((item) => item.dimension === "brand").slice(0, 5),
      todos: [
        "Approve proven 80-90% slots.",
        "Keep 10-20% exploration slots.",
        "Review weight proposals before applying.",
        "Record clicks and sales for tomorrow's learning.",
      ],
    };
  }

  function answer(question, context = {}) {
    const q = normalize(question);
    const knowledge = context.knowledge || context.aiKnowledgeBase || [];
    const results = searchKnowledge(q, knowledge);
    const run = context.run || {};
    if (/brand|ブランド/.test(q)) return buildAnswer("Brand learning", results, run.dashboard?.cautionBrands);
    if (/why|理由|売れない|失敗/.test(q)) return buildAnswer("Risk signals", results, run.losePatterns);
    if (/today|今日|売れる|おすすめ/.test(q)) return buildAnswer("Today top picks", results, run.dashboard?.top10);
    if (/future|伸び|来月|来週/.test(q)) return buildAnswer("Next strategy", results, run.monthlyMeeting?.nextMonthStrategy);
    return buildAnswer("Knowledge DB answer", results, run.winPatterns || run.dashboard?.winPatterns);
  }

  function searchKnowledge(question, knowledge = []) {
    const tokens = normalize(question).split(/\s+/).filter(Boolean);
    return knowledge
      .map((item) => {
        const hay = normalize(`${item.type} ${item.value} ${item.verdict}`);
        const score = tokens.reduce((sum, token) => sum + (hay.includes(token) ? 1 : 0), 0) + number(item.confidence) / 100;
        return { item, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((entry) => entry.item);
  }

  function buildAnswer(title, knowledgeResults = [], fallback = []) {
    const evidence = knowledgeResults.length
      ? knowledgeResults.map((item) => `- ${labelDimension(item.type)} ${item.value}: confidence ${Math.round(item.confidence)}, verdict ${item.verdict}`).join("\n")
      : "- Knowledge DB has limited evidence. Treat this as a hypothesis.";
    const fallbackLines = (fallback || []).slice(0, 5).map((item) => `- ${item.productName || item.title || item.action || item}`).join("\n");
    return `${title}\n\nEvidence from Knowledge DB:\n${evidence}\n\nSuggested action:\n${fallbackLines || "- Run the Phase4 learning cycle after recording sales/clicks."}`;
  }

  function knowledgeBoost(product, knowledge) {
    const keys = [
      ["brand", product.details?.brand || product.brand],
      ["category", product.category],
      ["priceRange", priceRange(product.price)],
    ];
    return keys.reduce((sumValue, [type, value]) => {
      const row = knowledge.find((item) => item.type === type && item.value === value);
      if (!row || row.confidence < 20) return sumValue;
      if (["underrated", "stable_win"].includes(row.verdict)) return sumValue + Math.min(8, row.confidence / 12);
      if (row.verdict === "overrated") return sumValue - Math.min(8, row.confidence / 12);
      return sumValue;
    }, 0);
  }

  function inferImageFeatures(product, plan) {
    const text = normalize(`${product.name || ""} ${product.image || ""} ${plan.imageJob?.prompt || ""}`);
    return {
      hasImage: Boolean(product.image || product.mainImageUrl),
      personCentered: /center|中央|全身/.test(text),
      paleColor: /white|ivory|beige|pink|淡|白|ベージュ|ピンク/.test(text),
      fullBody: /full|全身|足元/.test(text),
      faceVisible: !/face hidden|顔なし/.test(text),
    };
  }

  function inferBackground(text) {
    const t = normalize(text);
    if (/paris|海外|travel|旅行/.test(t)) return "overseas";
    if (/cafe|カフェ/.test(t)) return "cafe";
    if (/room|部屋/.test(t)) return "room";
    return "neutral";
  }

  function inferCopyType(text) {
    const t = normalize(text);
    if (/高見え|high/.test(t)) return "high-looking";
    if (/着回し|wear/.test(t)) return "mix-and-match";
    if (/体型|cover|華奢/.test(t)) return "body-support";
    if (/旅行|travel/.test(t)) return "travel";
    return "cute-editorial";
  }

  function inferScene(text) {
    const t = normalize(text);
    if (/通勤|office/.test(t)) return "office";
    if (/旅行|travel/.test(t)) return "travel";
    if (/デート|date/.test(t)) return "date";
    if (/カフェ|cafe/.test(t)) return "cafe";
    return "daily";
  }

  function inferSeason(date, text) {
    const t = normalize(text);
    if (/夏|uv|冷房|サンダル|水着/.test(t)) return "summer";
    if (/冬|ニット|コート/.test(t)) return "winter";
    if (/春|花|淡色/.test(t)) return "spring";
    if (/秋|ブラウン|チェック/.test(t)) return "autumn";
    const month = new Date(date).getMonth() + 1;
    if ([6, 7, 8].includes(month)) return "summer";
    if ([12, 1, 2].includes(month)) return "winter";
    if ([3, 4, 5].includes(month)) return "spring";
    return "autumn";
  }

  function topCause(items, field, label) {
    if (!items.length) return null;
    const groups = groupBy(items, (item) => item[field] || "unknown");
    const top = Object.entries(groups).sort((a, b) => b[1].length - a[1].length)[0];
    return top ? `${label}: ${top[0]} (${top[1].length})` : null;
  }

  function priceRange(price) {
    const value = number(price);
    if (!value) return "unknown";
    if (value < 3000) return "0-2999";
    if (value < 5000) return "3000-4999";
    if (value < 7000) return "5000-6999";
    if (value < 10000) return "7000-9999";
    return "10000+";
  }

  function reviewBand(value) {
    const n = number(value);
    if (!n) return "unknown";
    if (n < 10) return "0-9";
    if (n < 50) return "10-49";
    if (n < 200) return "50-199";
    return "200+";
  }

  function rankingBand(value) {
    const n = number(value);
    if (!n) return "unknown";
    if (n <= 10) return "top10";
    if (n <= 50) return "top50";
    if (n <= 100) return "top100";
    return "outside100";
  }

  function seasonalStrategy(now) {
    const month = now.getMonth() + 1;
    if ([7, 8].includes(month)) return "Prioritize cooling, travel, washable, and light-color summer items.";
    if ([9, 10].includes(month)) return "Shift gradually to autumn color, light knit, cardigan, and long-sleeve items.";
    if ([11, 12, 1].includes(month)) return "Start knit, coat, warm accessories, and holiday outing collections.";
    if ([2, 3, 4].includes(month)) return "Move to spring color, blouse, light outerwear, and ceremony-ready outfits.";
    return "Balance temperature-gap items and early summer travel collections.";
  }

  function groupBy(items, keyFn) {
    return items.reduce((acc, item) => {
      const key = keyFn(item) || "unknown";
      (acc[key] ||= []).push(item);
      return acc;
    }, {});
  }

  function sum(items, field) {
    return items.reduce((total, item) => total + number(item[field]), 0);
  }

  function average(values) {
    const clean = values.map(number).filter((value) => Number.isFinite(value));
    return clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : 0;
  }

  function number(value) {
    const n = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim();
  }

  function labelDimension(type) {
    return {
      brand: "Brand",
      category: "Category",
      priceRange: "Price",
      scene: "Scene",
      background: "Background",
      copyType: "Copy",
      season: "Season",
    }[type] || type;
  }

  function dateKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function weekKey(date) {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - start) / DAY_MS) + start.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
  }

  function isSameDate(value, date) {
    return dateKey(value) === dateKey(date);
  }

  function daysBetween(value, date) {
    return Math.abs(new Date(date) - new Date(value)) / DAY_MS;
  }

  function stableHash(value) {
    const text = String(value || "");
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `p4_${(hash >>> 0).toString(36)}`;
  }

  window.HanakoPhase4Engine = {
    runLearningCycle,
    buildLearningEvents,
    buildKnowledgeBase,
    searchKnowledge,
    answer,
    stableHash,
  };
})();
