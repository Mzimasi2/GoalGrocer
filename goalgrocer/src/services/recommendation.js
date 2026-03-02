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

const AI_API_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL || "https://api.openai.com/v1";
const AI_MODEL = import.meta.env.VITE_AI_MODEL || "gpt-4o-mini";
const AI_API_KEY = import.meta.env.VITE_AI_API_KEY;
const ALLOW_LOCAL_IMAGE_FALLBACK = import.meta.env.VITE_ALLOW_LOCAL_IMAGE_FALLBACK !== "false";

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

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}

const VISUAL_SIZE = 32;
const HASH_SIZE = 8;
const visualFeatureCache = new Map();

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image load failed."));
    image.src = src;
  });
}

async function loadImageFromFile(file) {
  const dataUrl = await fileToDataUrl(file);
  return loadImageElement(dataUrl);
}

function imageToVisualFeature(image) {
  const canvas = document.createElement("canvas");
  canvas.width = VISUAL_SIZE;
  canvas.height = VISUAL_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas context unavailable.");

  ctx.drawImage(image, 0, 0, VISUAL_SIZE, VISUAL_SIZE);
  const data = ctx.getImageData(0, 0, VISUAL_SIZE, VISUAL_SIZE).data;

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  const blockValues = [];
  const colorHist = new Array(24).fill(0);
  const edgeHist = new Array(4).fill(0);

  const blockStep = VISUAL_SIZE / HASH_SIZE;

  for (let by = 0; by < HASH_SIZE; by += 1) {
    for (let bx = 0; bx < HASH_SIZE; bx += 1) {
      let blockGray = 0;
      let blockCount = 0;

      const startY = Math.floor(by * blockStep);
      const endY = Math.floor((by + 1) * blockStep);
      const startX = Math.floor(bx * blockStep);
      const endX = Math.floor((bx + 1) * blockStep);

      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          const idx = (y * VISUAL_SIZE + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const gray = r * 0.299 + g * 0.587 + b * 0.114;
          blockGray += gray;
          blockCount += 1;

          sumR += r;
          sumG += g;
          sumB += b;

          const rBin = Math.min(3, Math.floor(r / 64));
          const gBin = Math.min(3, Math.floor(g / 64));
          const bBin = Math.min(3, Math.floor(b / 64));
          colorHist[rBin] += 1;
          colorHist[4 + gBin] += 1;
          colorHist[8 + bBin] += 1;

          // Edge buckets by local gradient (very lightweight texture signal)
          if (x + 1 < VISUAL_SIZE && y + 1 < VISUAL_SIZE) {
            const rightIdx = (y * VISUAL_SIZE + (x + 1)) * 4;
            const downIdx = ((y + 1) * VISUAL_SIZE + x) * 4;
            const rightGray =
              data[rightIdx] * 0.299 + data[rightIdx + 1] * 0.587 + data[rightIdx + 2] * 0.114;
            const downGray =
              data[downIdx] * 0.299 + data[downIdx + 1] * 0.587 + data[downIdx + 2] * 0.114;
            const gx = rightGray - gray;
            const gy = downGray - gray;
            const mag = Math.abs(gx) + Math.abs(gy);
            if (mag > 20) {
              if (Math.abs(gx) > Math.abs(gy) * 1.4) edgeHist[0] += 1; // vertical edge
              else if (Math.abs(gy) > Math.abs(gx) * 1.4) edgeHist[1] += 1; // horizontal edge
              else if (gx * gy > 0) edgeHist[2] += 1; // diag /
              else edgeHist[3] += 1; // diag \
            }
          }
        }
      }

      blockValues.push(blockCount ? blockGray / blockCount : 0);
    }
  }

  const pixelCount = VISUAL_SIZE * VISUAL_SIZE;
  const meanGray = blockValues.reduce((sum, value) => sum + value, 0) / blockValues.length;
  const hashBits = blockValues.map((value) => (value >= meanGray ? 1 : 0));
  const colorHistNorm = colorHist.map((v) => v / Math.max(1, pixelCount * 3));
  const edgeTotal = edgeHist.reduce((sum, v) => sum + v, 0);
  const edgeHistNorm = edgeHist.map((v) => v / Math.max(1, edgeTotal));

  return {
    hashBits,
    avgColor: [sumR / pixelCount, sumG / pixelCount, sumB / pixelCount],
    colorHist: colorHistNorm,
    edgeHist: edgeHistNorm,
  };
}

function hammingDistance(bitsA, bitsB) {
  const size = Math.min(bitsA.length, bitsB.length);
  let distance = 0;
  for (let i = 0; i < size; i += 1) {
    if (bitsA[i] !== bitsB[i]) distance += 1;
  }
  return distance + Math.abs(bitsA.length - bitsB.length);
}

function colorDistance(colorA, colorB) {
  const dr = colorA[0] - colorB[0];
  const dg = colorA[1] - colorB[1];
  const db = colorA[2] - colorB[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function l1Distance(listA, listB) {
  const len = Math.min(listA.length, listB.length);
  let total = 0;
  for (let i = 0; i < len; i += 1) {
    total += Math.abs(listA[i] - listB[i]);
  }
  return total + Math.abs(listA.length - listB.length);
}

async function getProductVisualFeature(product) {
  const imageUrl = String(product.imageUrl || "").trim();
  if (!imageUrl) return null;

  if (visualFeatureCache.has(imageUrl)) return visualFeatureCache.get(imageUrl);

  const featurePromise = loadImageElement(imageUrl)
    .then((image) => imageToVisualFeature(image))
    .catch(() => null);

  visualFeatureCache.set(imageUrl, featurePromise);
  return featurePromise;
}

async function recommendFromImageVisual(products, file, selectedBudget = "") {
  const image = await loadImageFromFile(file);
  const queryFeature = imageToVisualFeature(image);
  const maxHashDistance = HASH_SIZE * HASH_SIZE;
  const maxColorDistance = Math.sqrt(255 * 255 * 3);

  const scored = (
    await Promise.all(
      products.map(async (product) => {
        const feature = await getProductVisualFeature(product);
        if (!feature) return null;

        const hashDist = hammingDistance(queryFeature.hashBits, feature.hashBits);
        const colorDist = colorDistance(queryFeature.avgColor, feature.avgColor);
        const histDist = l1Distance(queryFeature.colorHist, feature.colorHist);
        const edgeDist = l1Distance(queryFeature.edgeHist, feature.edgeHist);

        const hashScore = 1 - hashDist / maxHashDistance;
        const colorScore = 1 - colorDist / maxColorDistance;
        const histScore = 1 - Math.min(1, histDist / 2);
        const edgeScore = 1 - Math.min(1, edgeDist / 2);
        const score = hashScore * 0.45 + colorScore * 0.2 + histScore * 0.25 + edgeScore * 0.1;

        return { product, score };
      })
    )
  ).filter(Boolean);

  scored.sort((a, b) => b.score - a.score);
  const bestScore = scored[0]?.score ?? 0;
  const minScore = Math.max(0.52, bestScore - 0.2);

  const matches = scored
    .filter(Boolean)
    .filter((entry) => entry.score >= minScore)
    .slice(0, 6)
    .map((entry) => entry.product);

  const budget = Number(selectedBudget);
  const productsWithinBudget =
    Number.isFinite(budget) && budget > 0 ? buildBasketWithinBudget(matches, budget) : matches;

  return {
    products: productsWithinBudget,
    source: "local-vision",
    sourceNote:
      productsWithinBudget.length > 0
        ? "Local visual matching used (no paid API)."
        : "No strong visual matches found in current catalog images.",
  };
}

async function recommendFromImageLocalComposite(products, file, selectedBudget = "") {
  try {
    const visual = await recommendFromImageVisual(products, file, selectedBudget);
    if (visual.products.length > 0) return visual;
  } catch {
    // Fall through to caption-style rules below.
  }

  const nameMatched = recommendFromImageName(products, file?.name || "");
  const budget = Number(selectedBudget);
  const productsWithinBudget =
    Number.isFinite(budget) && budget > 0 ? buildBasketWithinBudget(nameMatched, budget) : nameMatched;

  return {
    products: productsWithinBudget,
    source: "caption-rules",
    sourceNote:
      productsWithinBudget.length > 0
        ? "Filename caption matching used (local rules)."
        : "No local visual or caption matches found.",
  };
}

function parseFirstJsonObject(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export function hasAiSupport() {
  return Boolean(AI_API_KEY);
}

export async function recommendFromImageAI(products, file, selectedGoal = "", selectedBudget = "") {
  if (!file) {
    return {
      products: [],
      source: "ai",
      sourceNote: "No image file provided.",
    };
  }

  if (!hasAiSupport()) {
    if (ALLOW_LOCAL_IMAGE_FALLBACK) {
      try {
        const local = await recommendFromImageLocalComposite(products, file, selectedBudget);
        return {
          ...local,
          sourceNote:
            local.source === "caption-rules"
              ? "AI key not configured. Filename caption matching used."
              : "AI key not configured. Local visual matching used.",
        };
      } catch {
        return {
          products: [],
          source: "ai",
          sourceNote: "AI image analysis unavailable and local fallback failed.",
        };
      }
    }

    return {
      products: [],
      source: "ai",
      sourceNote: "AI image analysis requires VITE_AI_API_KEY.",
    };
  }

  try {
    const imageDataUrl = await fileToDataUrl(file);
    const catalog = products.map((product) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      calories: Number(product.calories || 0),
      protein: Number(product.protein || 0),
      goalBadges: product.goalBadges || [],
      tags: product.tags || [],
    }));

    const response = await fetch(`${AI_API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a nutrition e-commerce assistant. Analyze the uploaded image and return strict JSON only.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  task: "Recommend up to 8 products that best match the food/items in the uploaded image.",
                  selectedGoal: selectedGoal || "",
                  selectedBudget: selectedBudget || "",
                  products: catalog,
                  outputSchema: {
                    recommendedProductIds: ["product-id"],
                    reasoning: "short explanation",
                  },
                }),
              },
              {
                type: "image_url",
                image_url: { url: imageDataUrl },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`AI request failed (${response.status})`);

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const parsed = parseFirstJsonObject(content);
    if (!parsed || !Array.isArray(parsed.recommendedProductIds)) {
      throw new Error("AI response JSON not usable.");
    }

    const idSet = new Set(parsed.recommendedProductIds);
    let aiProducts = products.filter((product) => idSet.has(product.id)).slice(0, 8);

    const budget = Number(selectedBudget);
    if (Number.isFinite(budget) && budget > 0) {
      aiProducts = buildBasketWithinBudget(aiProducts, budget);
    }

    const sourceNote =
      parsed.reasoning && String(parsed.reasoning).trim().length > 0
        ? String(parsed.reasoning)
        : aiProducts.length > 0
          ? "Recommendations generated from image analysis."
          : "AI found no matching products in the current catalog.";

    return {
      products: aiProducts,
      source: "ai",
      sourceNote,
    };
  } catch (error) {
    if (ALLOW_LOCAL_IMAGE_FALLBACK) {
      try {
        const local = await recommendFromImageLocalComposite(products, file, selectedBudget);
        return {
          ...local,
          sourceNote:
            local.source === "caption-rules"
              ? `AI request failed (${error instanceof Error ? error.message : "unknown"}). Filename caption matching used.`
              : `AI request failed (${error instanceof Error ? error.message : "unknown"}). Local visual matching used.`,
        };
      } catch {
        return {
          products: [],
          source: "ai",
          sourceNote: "Image AI request failed and local analysis was unavailable.",
        };
      }
    }

    return {
      products: [],
      source: "ai",
      sourceNote: `Image AI request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function recommendFromPromptAI(products, prompt, selectedGoal, selectedBudget) {
  const fallback = recommendFromPrompt(products, prompt, selectedGoal, selectedBudget);

  if (!hasAiSupport()) {
    return {
      ...fallback,
      source: "rules",
      sourceNote: "AI key not configured, using local recommendation engine.",
    };
  }

  try {
    const catalog = products.map((product) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      calories: Number(product.calories || 0),
      protein: Number(product.protein || 0),
      goalBadges: product.goalBadges || [],
      tags: product.tags || [],
      soldCount: Number(product.soldCount || 0),
    }));

    const response = await fetch(`${AI_API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an e-commerce nutrition recommendation assistant. Return strict JSON only.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Recommend up to 8 products that fit the user request.",
              userPrompt: prompt || "",
              selectedGoal: selectedGoal || "",
              selectedBudget: selectedBudget || "",
              products: catalog,
              outputSchema: {
                goal: "Weight Loss | Maintenance | ''",
                budget: "number or null",
                recommendedProductIds: ["product-id"],
                reasoning: "short explanation",
              },
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed (${response.status})`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const parsed = parseFirstJsonObject(content);

    if (!parsed || !Array.isArray(parsed.recommendedProductIds)) {
      throw new Error("AI response JSON not usable.");
    }

    const idSet = new Set(parsed.recommendedProductIds);
    const aiRanked = products.filter((product) => idSet.has(product.id));
    const goal = selectedGoal || parsed.goal || fallback.goal;
    const budget = Number(selectedBudget) || Number(parsed.budget) || fallback.budget;

    return {
      goal,
      budget,
      parsed: fallback.parsed,
      products: buildBasketWithinBudget(aiRanked, budget),
      source: "ai",
      sourceNote: parsed.reasoning || "Recommendations generated by AI model.",
    };
  } catch {
    return {
      ...fallback,
      source: "rules",
      sourceNote: "AI unavailable, switched to local recommendation engine.",
    };
  }
}
