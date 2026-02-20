const STOP_WORDS = new Set([
  "i",
  "a",
  "the",
  "for",
  "to",
  "my",
  "with",
  "and",
  "or",
  "under",
  "want",
  "looking",
  "need",
  "good",
  "best",
]);

export function parsePrompt(prompt) {
  const text = String(prompt || "").toLowerCase();

  const budgetMatch = text.match(/(?:r\s*)?(\d{2,5})(?:\s*k)?/i);
  let budget = null;
  if (budgetMatch) {
    budget = Number(budgetMatch[1]);
    if (/\d\s*k/i.test(budgetMatch[0])) budget *= 1000;
  }

  let goal = "";
  if (/lose|loss|cut|lean/.test(text)) goal = "Weight Loss";
  if (/maintain|maintenance|balanced|steady/.test(text)) goal = "Maintenance";

  const keywords = text
    .split(/[^a-z0-9]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  return { goal, budget, keywords };
}

function scoreProduct(product, criteria) {
  const { goal, keywords } = criteria;
  let score = 0;

  if (goal) {
    if ((product.goalBadges || []).includes(goal)) score += 30;
    if (goal === "Weight Loss") {
      score += Math.max(0, 250 - product.calories) * 0.08;
      score += product.protein * 0.5;
    } else {
      score += Math.max(0, 500 - Math.abs(380 - product.calories)) * 0.04;
      score += product.protein * 0.35;
    }
  } else {
    score += product.protein * 0.2;
    score += Math.max(0, 300 - product.calories) * 0.05;
  }

  for (const keyword of keywords) {
    const inName = product.name.toLowerCase().includes(keyword);
    const inTags = (product.tags || []).some((tag) => tag.toLowerCase().includes(keyword));
    if (inName) score += 14;
    if (inTags) score += 10;
  }

  score += (product.soldCount || 0) * 0.1;
  return score;
}

export function rankProducts(products, criteria) {
  return [...products]
    .map((product) => ({ product, score: scoreProduct(product, criteria) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product);
}

export function buildBasketWithinBudget(products, budget) {
  const max = Number(budget);
  if (!Number.isFinite(max) || max <= 0) return products.slice(0, 8);

  const picked = [];
  let spent = 0;

  for (const product of products) {
    if (spent + product.price > max) continue;
    picked.push(product);
    spent += product.price;
    if (picked.length >= 8) break;
  }

  return picked;
}

export function recommendFromPrompt(products, prompt, selectedGoal, selectedBudget) {
  const parsed = parsePrompt(prompt);
  const goal = selectedGoal || parsed.goal;
  const budget = Number(selectedBudget) || parsed.budget;
  const criteria = { goal, budget, keywords: parsed.keywords };
  const ranked = rankProducts(products, criteria);
  return {
    goal,
    budget,
    parsed,
    products: buildBasketWithinBudget(ranked, budget),
  };
}

export function recommendFromImageName(products, fileName) {
  if (!fileName) return [];
  const terms = fileName
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((v) => v.trim())
    .filter((v) => v.length > 2);

  if (terms.length === 0) return [];

  return [...products]
    .map((product) => {
      let score = 0;
      for (const term of terms) {
        if (product.name.toLowerCase().includes(term)) score += 14;
        if ((product.tags || []).some((tag) => tag.toLowerCase().includes(term))) score += 10;
      }
      return { product, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.product);
}
