import AppShell from "../components/AppShell";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  getWishlistProductIds,
  incrementProductViews,
  listCategories,
  listProducts,
  toggleWishlistItem,
} from "../services/db";
import { useMemo, useState } from "react";

export default function Wishlist() {
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [products, setProducts] = useState(() => listProducts());
  const [categories] = useState(() => listCategories());
  const [wishlistIds, setWishlistIds] = useState(() => getWishlistProductIds(user?.id));

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlistIds.includes(p.id)),
    [products, wishlistIds]
  );

  function refresh() {
    setProducts(listProducts());
  }

  function handleView(product) {
    incrementProductViews(product.id);
    refresh();
  }

  function handleWishlist(product) {
    const next = toggleWishlistItem(user.id, product.id);
    setWishlistIds(next);
  }

  return (
    <AppShell title="Wishlist" subtitle="Products saved for later.">
      {wishlistProducts.length === 0 ? (
        <section className="card">
          <p>No wishlist products yet.</p>
        </section>
      ) : (
        <section className="product-grid">
          {wishlistProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categoryName={categoryMap[product.categoryId]}
              onAdd={addToCart}
              onView={handleView}
              onWishlist={handleWishlist}
              wishlistActive
            />
          ))}
        </section>
      )}
    </AppShell>
  );
}
