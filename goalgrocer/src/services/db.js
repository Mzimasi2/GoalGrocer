import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import {
  seedCategories,
  seedDishes,
  seedMealPlans,
  seedProducts,
  seedUsers,
} from "../data/seedData";
import { firestore } from "./firebase";

const COLLECTIONS = {
  users: "users",
  categories: "categories",
  products: "products",
  orders: "orders",
  wishlists: "wishlists",
  dishes: "dishes",
  mealPlans: "mealPlans",
};

let initialized = false;
let dbState = {
  users: [],
  categories: [],
  products: [],
  orders: [],
  wishlists: [],
  dishes: [],
  mealPlans: [],
};

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function withoutId(entity) {
  const copy = { ...entity };
  delete copy.id;
  return copy;
}

function normalizeText(value, max = 200) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeEmail(value) {
  return normalizeText(value, 254).toLowerCase();
}

function parseNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeInt(value, min, max, fallback) {
  const parsed = Math.trunc(parseNumber(value, fallback));
  return clampNumber(parsed, min, max);
}

function normalizeList(value, maxItems = 8, maxLen = 40) {
  const array = Array.isArray(value)
    ? value
    : String(value || "")
        .split(",")
        .map((item) => item.trim());
  return [...new Set(array.map((item) => normalizeText(item, maxLen)).filter(Boolean))].slice(
    0,
    maxItems
  );
}

function normalizeImageUrl(value) {
  const url = normalizeText(value, 1000);
  if (!url) return "";
  if (!/^https:\/\/|^http:\/\//i.test(url)) {
    throw new Error("Image URL must start with http:// or https://");
  }
  return url;
}

function requireAuthenticated(actor) {
  if (!actor?.id && !actor?.authUid) {
    throw new Error("Authentication required.");
  }
}

function requireAdmin(actor) {
  requireAuthenticated(actor);
  if (actor.role !== "admin") {
    throw new Error("Admin access required.");
  }
}

function requireSelfOrAdmin(targetUserId, actor) {
  requireAuthenticated(actor);
  if (actor.role === "admin") return;
  if (actor.id !== targetUserId && actor.authUid !== targetUserId) {
    throw new Error("Not authorized to update this profile.");
  }
}

async function fetchCollection(name) {
  const snapshot = await getDocs(collection(firestore, name));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

async function seedIfEmpty() {
  const [categories, products, dishes, users] = await Promise.all([
    fetchCollection(COLLECTIONS.categories),
    fetchCollection(COLLECTIONS.products),
    fetchCollection(COLLECTIONS.dishes),
    fetchCollection(COLLECTIONS.users),
  ]);

  if (categories.length || products.length || dishes.length || users.length) return;

  const batch = writeBatch(firestore);

  for (const category of seedCategories) {
    batch.set(doc(firestore, COLLECTIONS.categories, category.id), withoutId(category));
  }

  for (const product of seedProducts) {
    batch.set(doc(firestore, COLLECTIONS.products, product.id), withoutId(product));
  }

  for (const dish of seedDishes) {
    batch.set(doc(firestore, COLLECTIONS.dishes, dish.id), withoutId(dish));
  }

  for (const mealPlan of seedMealPlans) {
    batch.set(doc(firestore, COLLECTIONS.mealPlans, mealPlan.id), withoutId(mealPlan));
  }

  for (const user of seedUsers) {
    batch.set(doc(firestore, COLLECTIONS.users, user.id), withoutId(user));
  }

  await batch.commit();
}

async function ensureMealPlansSeeded() {
  const plans = await fetchCollection(COLLECTIONS.mealPlans);
  if (plans.length) return;

  const batch = writeBatch(firestore);
  for (const mealPlan of seedMealPlans) {
    batch.set(doc(firestore, COLLECTIONS.mealPlans, mealPlan.id), withoutId(mealPlan));
  }
  await batch.commit();
}

function normalizeMealSlot(slotValue) {
  if (typeof slotValue === "string") {
    return { title: slotValue, imageUrl: "" };
  }
  if (slotValue && typeof slotValue === "object") {
    return {
      title: String(slotValue.title || ""),
      imageUrl: String(slotValue.imageUrl || ""),
    };
  }
  return { title: "", imageUrl: "" };
}

async function migrateMealPlanScheduleFormat() {
  const plans = await fetchCollection(COLLECTIONS.mealPlans);

  await Promise.all(
    plans.map(async (plan) => {
      const schedule = plan.schedule || {};
      let changed = false;
      const normalizedSchedule = {};

      for (const [day, meals] of Object.entries(schedule)) {
        const normalizedDay = {
          breakfast: normalizeMealSlot(meals?.breakfast),
          lunch: normalizeMealSlot(meals?.lunch),
          dinner: normalizeMealSlot(meals?.dinner),
        };

        if (
          typeof meals?.breakfast === "string" ||
          typeof meals?.lunch === "string" ||
          typeof meals?.dinner === "string"
        ) {
          changed = true;
        }

        normalizedSchedule[day] = normalizedDay;
      }

      if (!changed) return;

      await persistSet(COLLECTIONS.mealPlans, plan.id, {
        ...plan,
        schedule: normalizedSchedule,
      });
    })
  );
}

const DEFAULT_MEAL_IMAGES = {
  breakfast:
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
  lunch:
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
  dinner:
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80",
};

async function backfillMissingMealImageUrls() {
  const plans = await fetchCollection(COLLECTIONS.mealPlans);

  await Promise.all(
    plans.map(async (plan) => {
      const schedule = plan.schedule || {};
      let changed = false;
      const nextSchedule = {};

      for (const [day, meals] of Object.entries(schedule)) {
        const nextDay = {};
        for (const slot of ["breakfast", "lunch", "dinner"]) {
          const current = meals?.[slot];
          const normalized = normalizeMealSlot(current);
          if (!normalized.imageUrl) {
            normalized.imageUrl = DEFAULT_MEAL_IMAGES[slot] || "";
            changed = true;
          }
          nextDay[slot] = normalized;
        }
        nextSchedule[day] = nextDay;
      }

      if (!changed) return;
      await persistSet(COLLECTIONS.mealPlans, plan.id, {
        ...plan,
        schedule: nextSchedule,
      });
    })
  );
}

async function loadAllCollections() {
  const [users, categories, products, orders, wishlists, dishes, mealPlans] = await Promise.all([
    fetchCollection(COLLECTIONS.users),
    fetchCollection(COLLECTIONS.categories),
    fetchCollection(COLLECTIONS.products),
    fetchCollection(COLLECTIONS.orders),
    fetchCollection(COLLECTIONS.wishlists),
    fetchCollection(COLLECTIONS.dishes),
    fetchCollection(COLLECTIONS.mealPlans),
  ]);

  dbState = { users, categories, products, orders, wishlists, dishes, mealPlans };
}

export async function initializeDb() {
  if (initialized) return dbState;
  await seedIfEmpty();
  await ensureMealPlansSeeded();
  await migrateMealPlanScheduleFormat();
  await backfillMissingMealImageUrls();
  await loadAllCollections();
  initialized = true;
  return dbState;
}

export function ensureDb() {
  return dbState;
}

function persistSet(collectionName, id, payload) {
  return setDoc(doc(firestore, collectionName, id), withoutId(payload), { merge: true });
}

export function listProducts() {
  return ensureDb().products;
}

export function listCategories() {
  return ensureDb().categories;
}

export function listDishes() {
  return ensureDb().dishes;
}

export function listMealPlans() {
  return ensureDb().mealPlans;
}

export function upsertMealPlan(mealPlan) {
  requireAdmin(mealPlan?.actor);

  const schedule = mealPlan.schedule || {};
  const normalizedSchedule = {};
  for (const [day, meals] of Object.entries(schedule)) {
    normalizedSchedule[day] = {
      breakfast: normalizeMealSlot(meals?.breakfast),
      lunch: normalizeMealSlot(meals?.lunch),
      dinner: normalizeMealSlot(meals?.dinner),
    };
  }

  const normalized = {
    id: mealPlan.id || makeId("meal-plan"),
    goal: normalizeText(mealPlan.goal, 40),
    summary: normalizeText(mealPlan.summary, 240),
    imageUrl: normalizeImageUrl(mealPlan.imageUrl || ""),
    ingredientProductIds: Array.isArray(mealPlan.ingredientProductIds)
      ? mealPlan.ingredientProductIds
      : [],
    schedule: normalizedSchedule,
  };

  const list = ensureDb().mealPlans;
  const index = list.findIndex((entry) => entry.id === normalized.id);
  if (index >= 0) list[index] = { ...list[index], ...normalized };
  else list.unshift(normalized);

  persistSet(COLLECTIONS.mealPlans, normalized.id, normalized);
  return normalized;
}

export function updateMealPlanMealImage(planId, day, slot, imageUrl, actor) {
  requireAdmin(actor);
  const target = ensureDb().mealPlans.find((plan) => plan.id === planId);
  if (!target) return null;
  const safeDay = normalizeText(day, 20);
  const safeSlot = normalizeText(slot, 20).toLowerCase();
  if (!["breakfast", "lunch", "dinner"].includes(safeSlot)) {
    throw new Error("Invalid meal slot.");
  }
  const safeImageUrl = normalizeImageUrl(imageUrl);

  const currentSlot = target.schedule?.[safeDay]?.[safeSlot];
  const currentTitle =
    typeof currentSlot === "string"
      ? currentSlot
      : String(currentSlot?.title || "");
  const nextSlot = { title: currentTitle, imageUrl: safeImageUrl };
  const nextDay = {
    ...(target.schedule?.[safeDay] || {}),
    [safeSlot]: nextSlot,
  };
  target.schedule = {
    ...(target.schedule || {}),
    [safeDay]: nextDay,
  };

  persistSet(COLLECTIONS.mealPlans, target.id, target);
  return { ...target };
}

export function listUsers() {
  return ensureDb().users.map((user) => {
    const safeUser = { ...user };
    delete safeUser.password;
    return safeUser;
  });
}

export function getUserById(userId) {
  const user = ensureDb().users.find((u) => u.id === userId);
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

export async function ensureUserProfileForAuth(authUser) {
  const db = ensureDb();
  const authUid = authUser.uid;
  const email = String(authUser.email || "").toLowerCase();
  const displayName = authUser.displayName || "";

  let target = db.users.find((u) => u.id === authUid);
  const byEmail = db.users.find((u) => String(u.email || "").toLowerCase() === email);

  if (!target) {
    const role = byEmail?.role || "customer";
    target = {
      id: authUid,
      authUid,
      fullName: byEmail?.fullName || displayName || email.split("@")[0] || "Customer",
      email,
      role,
      savedGoal: byEmail?.savedGoal || "",
      savedBudget: byEmail?.savedBudget || "",
      createdAt: byEmail?.createdAt || new Date().toISOString(),
    };

    db.users = [target, ...db.users.filter((u) => String(u.email || "").toLowerCase() !== email)];
  } else {
    target.authUid = authUid;
    if (!target.email) target.email = email;
    if (!target.fullName) target.fullName = displayName || email.split("@")[0] || "Customer";
  }

  await persistSet(COLLECTIONS.users, target.id, target);

  if (byEmail && byEmail.id !== target.id) {
    deleteDoc(doc(firestore, COLLECTIONS.users, byEmail.id));
  }

  const safeUser = { ...target };
  delete safeUser.password;
  return safeUser;
}

export function createCustomer({ fullName, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const db = ensureDb();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Invalid email address.");
  }

  if (String(password || "").length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    throw new Error("A user with this email already exists.");
  }

  const user = {
    id: makeId("u"),
    fullName: normalizeText(fullName, 80),
    email: normalizedEmail,
    password,
    role: "customer",
    savedGoal: "",
    savedBudget: "",
    createdAt: new Date().toISOString(),
  };

  db.users.unshift(user);
  persistSet(COLLECTIONS.users, user.id, user);

  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

export function authenticateUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  const user = ensureDb().users.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
  );

  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

export function updateUserProfile(userId, values, actor) {
  requireSelfOrAdmin(userId, actor);
  const target = ensureDb().users.find((u) => u.id === userId);
  if (!target) return null;

  if (typeof values.fullName === "string") target.fullName = normalizeText(values.fullName, 80);
  if (typeof values.savedGoal === "string") {
    const allowed = new Set(["", "Weight Loss", "Maintenance", "Lean Muscle"]);
    target.savedGoal = allowed.has(values.savedGoal) ? values.savedGoal : "";
  }
  if (values.savedBudget !== undefined) {
    target.savedBudget = normalizeInt(values.savedBudget, 0, 50000, 0);
  }

  persistSet(COLLECTIONS.users, target.id, target);

  const safeUser = { ...target };
  delete safeUser.password;
  return safeUser;
}

export function incrementProductViews(productId) {
  const product = ensureDb().products.find((p) => p.id === productId);
  if (!product) return;
  product.viewsCount = (product.viewsCount || 0) + 1;
  updateDoc(doc(firestore, COLLECTIONS.products, productId), {
    viewsCount: product.viewsCount,
  });
}

export function upsertProduct(product) {
  requireAdmin(product?.actor);

  const name = normalizeText(product.name, 120);
  if (!name) throw new Error("Product name is required.");
  const price = clampNumber(parseNumber(product.price, 0), 0, 100000);
  const cost = clampNumber(parseNumber(product.cost, 0), 0, 100000);
  const calories = normalizeInt(product.calories, 0, 5000, 0);
  const protein = normalizeInt(product.protein, 0, 500, 0);

  const normalized = {
    id: product.id || makeId("p"),
    name,
    price,
    cost,
    categoryId: normalizeText(product.categoryId, 60),
    tags: normalizeList(product.tags, 8, 30),
    calories,
    protein,
    goalBadges: normalizeList(product.goalBadges, 4, 24),
    imageUrl: normalizeImageUrl(product.imageUrl || ""),
    isPromotion: Boolean(product.isPromotion),
    viewsCount: normalizeInt(product.viewsCount, 0, 1000000, 0),
    soldCount: normalizeInt(product.soldCount, 0, 1000000, 0),
  };

  if (!normalized.categoryId) throw new Error("Category is required.");

  const list = ensureDb().products;
  const index = list.findIndex((p) => p.id === normalized.id);
  if (index >= 0) list[index] = { ...list[index], ...normalized };
  else list.unshift(normalized);

  persistSet(COLLECTIONS.products, normalized.id, normalized);
}

export function deleteProduct(productId, actor) {
  requireAdmin(actor);
  const db = ensureDb();
  db.products = db.products.filter((p) => p.id !== productId);

  db.wishlists = db.wishlists.map((wishlist) => ({
    ...wishlist,
    productIds: (wishlist.productIds || []).filter((id) => id !== productId),
  }));

  deleteDoc(doc(firestore, COLLECTIONS.products, productId));

  for (const wishlist of db.wishlists) {
    persistSet(COLLECTIONS.wishlists, wishlist.userId, wishlist);
  }
}

export function upsertCategory(category, actor) {
  requireAdmin(actor);
  const entry = {
    id: category.id || makeId("cat"),
    name: normalizeText(category.name, 60),
  };

  if (!entry.name) throw new Error("Category name is required.");

  const list = ensureDb().categories;
  const index = list.findIndex((c) => c.id === entry.id);
  if (index >= 0) list[index] = entry;
  else list.push(entry);

  persistSet(COLLECTIONS.categories, entry.id, entry);
}

export function deleteCategory(categoryId, actor) {
  requireAdmin(actor);
  const db = ensureDb();
  db.categories = db.categories.filter((c) => c.id !== categoryId);

  if (!db.categories.some((c) => c.id === "uncategorized")) {
    const uncategorized = { id: "uncategorized", name: "Uncategorized" };
    db.categories.push(uncategorized);
    persistSet(COLLECTIONS.categories, uncategorized.id, uncategorized);
  }

  db.products = db.products.map((product) =>
    product.categoryId === categoryId ? { ...product, categoryId: "uncategorized" } : product
  );

  deleteDoc(doc(firestore, COLLECTIONS.categories, categoryId));

  for (const product of db.products) {
    persistSet(COLLECTIONS.products, product.id, product);
  }
}

export function createOrder({ userId, items, paymentType, actor }) {
  requireSelfOrAdmin(userId, actor);
  const db = ensureDb();
  const allowedPayments = new Set(["Card", "Cash", "PayPal"]);
  const safePaymentType = allowedPayments.has(paymentType) ? paymentType : "Card";

  const pricedItems = items
    .map((item) => {
      const product = db.products.find((p) => p.id === item.id);
      if (!product) return null;
      const qty = normalizeInt(item.qty, 1, 99, 1);
      return {
        productId: product.id,
        name: normalizeText(product.name, 120),
        qty,
        unitPrice: product.price,
        unitCost: product.cost,
        lineTotal: qty * product.price,
        lineCost: qty * product.cost,
        imageUrl: product.imageUrl || "",
      };
    })
    .filter(Boolean);

  if (!pricedItems.length) {
    throw new Error("Order has no valid items.");
  }

  const subTotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalCost = pricedItems.reduce((sum, item) => sum + item.lineCost, 0);

  const order = {
    id: makeId("o"),
    userId,
    items: pricedItems,
    subTotal,
    totalCost,
    profit: subTotal - totalCost,
    paymentType: safePaymentType,
    status: "Complete",
    createdAt: new Date().toISOString(),
  };

  db.orders.unshift(order);
  persistSet(COLLECTIONS.orders, order.id, order);

  for (const item of pricedItems) {
    const product = db.products.find((p) => p.id === item.productId);
    if (!product) continue;
    product.soldCount = (product.soldCount || 0) + item.qty;
    updateDoc(doc(firestore, COLLECTIONS.products, product.id), {
      soldCount: product.soldCount,
    });
  }

  return order;
}

export function listOrders(filters = {}) {
  const { userId, paymentType, status } = filters;
  return ensureDb().orders.filter((order) => {
    const passUser = !userId || order.userId === userId;
    const passPayment = !paymentType || paymentType === "All" || order.paymentType === paymentType;
    const passStatus = !status || status === "All" || order.status === status;
    return passUser && passPayment && passStatus;
  });
}

export function getWishlistProductIds(userId) {
  if (!userId) return [];
  const wishlist = ensureDb().wishlists.find((w) => w.userId === userId);
  return wishlist?.productIds || [];
}

export function toggleWishlistItem(userId, productId) {
  if (!userId) return [];
  if (!ensureDb().products.some((product) => product.id === productId)) {
    throw new Error("Invalid product for wishlist.");
  }

  const db = ensureDb();
  let wishlist = db.wishlists.find((w) => w.userId === userId);

  if (!wishlist) {
    wishlist = { userId, productIds: [], updatedAt: new Date().toISOString() };
    db.wishlists.push(wishlist);
  }

  if (wishlist.productIds.includes(productId)) {
    wishlist.productIds = wishlist.productIds.filter((id) => id !== productId);
  } else {
    wishlist.productIds.push(productId);
  }

  wishlist.updatedAt = new Date().toISOString();
  persistSet(COLLECTIONS.wishlists, wishlist.userId, wishlist);

  return [...wishlist.productIds];
}

function groupBy(list, keyFn) {
  return list.reduce((map, item) => {
    const key = keyFn(item);
    map[key] = (map[key] || 0) + 1;
    return map;
  }, {});
}

export function buildReports() {
  const db = ensureDb();
  const orders = db.orders;
  const products = db.products;

  const totalRevenue = orders.reduce((sum, order) => sum + order.subTotal, 0);
  const totalCostOfSales = orders.reduce((sum, order) => sum + order.totalCost, 0);
  const totalProfit = totalRevenue - totalCostOfSales;

  const revenueByPayment = orders.reduce((acc, order) => {
    acc[order.paymentType] = (acc[order.paymentType] || 0) + order.subTotal;
    return acc;
  }, {});

  const salesByCategory = orders.reduce((acc, order) => {
    for (const item of order.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      acc[product.categoryId] = (acc[product.categoryId] || 0) + item.lineTotal;
    }
    return acc;
  }, {});

  const spendingByUser = orders.reduce((acc, order) => {
    acc[order.userId] = (acc[order.userId] || 0) + order.subTotal;
    return acc;
  }, {});

  const orderCountByUser = groupBy(orders, (order) => order.userId);

  const customerRows = Object.keys(spendingByUser)
    .map((userId) => {
      const user = db.users.find((u) => u.id === userId);
      return {
        userId,
        name: user?.fullName || user?.email || "Unknown",
        email: user?.email || "-",
        totalSpend: spendingByUser[userId],
        orderCount: orderCountByUser[userId] || 0,
      };
    })
    .sort((a, b) => b.totalSpend - a.totalSpend);

  const goalPreferenceDistribution = db.users
    .filter((u) => u.role === "customer")
    .reduce((acc, user) => {
      const key = user.savedGoal || "Not set";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  const categoryNameById = Object.fromEntries(db.categories.map((c) => [c.id, c.name]));

  return {
    financial: {
      totalRevenue,
      totalCostOfSales,
      totalProfit,
      revenueByPayment,
    },
    product: {
      bestSellingProducts: [...products]
        .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
        .slice(0, 5),
      mostViewedProducts: [...products]
        .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
        .slice(0, 5),
      salesByCategory: Object.entries(salesByCategory)
        .map(([categoryId, sales]) => ({
          categoryId,
          categoryName: categoryNameById[categoryId] || categoryId,
          sales,
        }))
        .sort((a, b) => b.sales - a.sales),
      promotionPerformance: products
        .filter((p) => p.isPromotion)
        .map((p) => ({ id: p.id, name: p.name, soldCount: p.soldCount || 0 })),
    },
    customer: {
      topSpendingCustomers: customerRows.slice(0, 5),
      averageOrderValue: orders.length ? totalRevenue / orders.length : 0,
      purchaseFrequency: customerRows,
      goalPreferenceDistribution,
    },
  };
}
