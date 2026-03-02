import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "goalgrocer_cart_v2";
const MIN_QTY = 1;
const MAX_QTY = 99;

function readCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => readCart());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  function addToCart(product, qty = 1) {
    const safeQty = Math.min(MAX_QTY, Math.max(MIN_QTY, Math.trunc(Number(qty) || 1)));
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, qty: Math.min(MAX_QTY, i.qty + safeQty) }
            : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          cost: product.cost,
          imageUrl: product.imageUrl || "",
          categoryId: product.categoryId || "",
          calories: Number(product.calories) || 0,
          protein: Number(product.protein) || 0,
          tags: Array.isArray(product.tags) ? product.tags : [],
          goalBadges: Array.isArray(product.goalBadges) ? product.goalBadges : [],
          qty: safeQty,
        },
      ];
    });
  }

  function addMany(products) {
    for (const product of products) addToCart(product, 1);
  }

  function removeFromCart(id) {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }

  function setQty(id, qty) {
    const amount = Math.min(MAX_QTY, Math.max(MIN_QTY, Math.trunc(Number(qty) || MIN_QTY)));
    setCartItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: amount } : item))
        .filter((item) => item.qty >= MIN_QTY && item.qty <= MAX_QTY)
    );
  }

  function clearCart() {
    setCartItems([]);
  }

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.qty, 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.qty * item.price, 0),
    [cartItems]
  );

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    addToCart,
    addMany,
    removeFromCart,
    setQty,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
