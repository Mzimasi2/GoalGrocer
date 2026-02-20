import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { seedCategories, seedDishes, seedProducts, seedUsers } from "../data/seedData";
import { firestore } from "./firebase";

const COLLECTIONS = {
  users: "users",
  categories: "categories",
  products: "products",
  orders: "orders",
  wishlists: "wishlists",
  dishes: "dishes",
};

let initialized = false;
let dbState = {
  users: [],
  categories: [],
  products: [],
  orders: [],
  wishlists: [],
  dishes: [],
};

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function withoutId(entity) {
  const copy = { ...entity };
  delete copy.id;
  return copy;
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

  for (const user of seedUsers) {
    batch.set(doc(firestore, COLLECTIONS.users, user.id), withoutId(user));
  }

  await batch.commit();
}

async function loadAllCollections() {
  const [users, categories, products, orders, wishlists, dishes] = await Promise.all([
    fetchCollection(COLLECTIONS.users),
    fetchCollection(COLLECTIONS.categories),
    fetchCollection(COLLECTIONS.products),
    fetchCollection(COLLECTIONS.orders),
    fetchCollection(COLLECTIONS.wishlists),
    fetchCollection(COLLECTIONS.dishes),
  ]);

  dbState = { users, categories, products, orders, wishlists, dishes };
}

export async function initializeDb() {
  if (initialized) return dbState;
  await seedIfEmpty();
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
  const normalizedEmail = email.trim().toLowerCase();
  const db = ensureDb();

  if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    throw new Error("A user with this email already exists.");
  }

  const user = {
    id: makeId("u"),
    fullName: fullName.trim(),
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
  const normalizedEmail = email.trim().toLowerCase();

  const user = ensureDb().users.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
  );

  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

export function updateUserProfile(userId, values) {
  const target = ensureDb().users.find((u) => u.id === userId);
  if (!target) return null;

  if (typeof values.fullName === "string") target.fullName = values.fullName.trim();
  if (typeof values.savedGoal === "string") target.savedGoal = values.savedGoal;
  if (values.savedBudget !== undefined) target.savedBudget = values.savedBudget;

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
  const normalized = {
    id: product.id || makeId("p"),
    name: (product.name || "").trim(),
    price: Number(product.price) || 0,
    cost: Number(product.cost) || 0,
    categoryId: product.categoryId,
    tags: Array.isArray(product.tags)
      ? product.tags.map((t) => t.trim()).filter(Boolean)
      : String(product.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
    calories: Number(product.calories) || 0,
    protein: Number(product.protein) || 0,
    goalBadges: Array.isArray(product.goalBadges)
      ? product.goalBadges
      : String(product.goalBadges || "")
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
    imageUrl: product.imageUrl || "",
    isPromotion: Boolean(product.isPromotion),
    viewsCount: Number(product.viewsCount) || 0,
    soldCount: Number(product.soldCount) || 0,
  };

  const list = ensureDb().products;
  const index = list.findIndex((p) => p.id === normalized.id);
  if (index >= 0) list[index] = { ...list[index], ...normalized };
  else list.unshift(normalized);

  persistSet(COLLECTIONS.products, normalized.id, normalized);
}

export function deleteProduct(productId) {
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

export function upsertCategory(category) {
  const entry = {
    id: category.id || makeId("cat"),
    name: String(category.name || "").trim(),
  };

  const list = ensureDb().categories;
  const index = list.findIndex((c) => c.id === entry.id);
  if (index >= 0) list[index] = entry;
  else list.push(entry);

  persistSet(COLLECTIONS.categories, entry.id, entry);
}

export function deleteCategory(categoryId) {
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

export function createOrder({ userId, items, paymentType }) {
  const db = ensureDb();

  const pricedItems = items
    .map((item) => {
      const product = db.products.find((p) => p.id === item.id);
      if (!product) return null;
      const qty = Number(item.qty) || 1;
      return {
        productId: product.id,
        name: product.name,
        qty,
        unitPrice: product.price,
        unitCost: product.cost,
        lineTotal: qty * product.price,
        lineCost: qty * product.cost,
      };
    })
    .filter(Boolean);

  const subTotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalCost = pricedItems.reduce((sum, item) => sum + item.lineCost, 0);

  const order = {
    id: makeId("o"),
    userId,
    items: pricedItems,
    subTotal,
    totalCost,
    profit: subTotal - totalCost,
    paymentType,
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
