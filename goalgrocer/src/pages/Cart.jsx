import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useCart } from "../context/CartContext";
import { currency } from "../services/format";
import { listCategories, listProducts } from "../services/db";
import "./Cart.css";

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, setQty, cartTotal, clearCart } = useCart();
  const products = useMemo(() => listProducts(), []);
  const categories = useMemo(() => listCategories(), []);

  const productMap = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product])),
    [products]
  );
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories]
  );
  const enrichedItems = useMemo(
    () =>
      cartItems.map((item) => {
        const product = productMap[item.id];
        return {
          ...item,
          imageUrl: item.imageUrl || product?.imageUrl || "",
          categoryId: item.categoryId || product?.categoryId || "",
          calories: item.calories || product?.calories || 0,
          protein: item.protein || product?.protein || 0,
          tags: item.tags?.length ? item.tags : product?.tags || [],
          goalBadges: item.goalBadges?.length ? item.goalBadges : product?.goalBadges || [],
        };
      }),
    [cartItems, productMap]
  );

  return (
    <AppShell title="Cart" subtitle="Review your items before checkout.">
      {cartItems.length === 0 ? (
        <section className="card">
          <h3>Your cart is empty</h3>
          <Link to="/store" className="btn btn-primary">
            Browse products
          </Link>
        </section>
      ) : (
        <>
          <section className="card">
            <div className="order-list">
              {enrichedItems.map((item) => (
                <article key={item.id} className="order-row cart-item-row">
                  <div className="cart-item-main">
                    <div className="cart-item-image-wrap">
                      {item.imageUrl ? (
                        <img className="cart-item-image" src={item.imageUrl} alt={item.name} loading="lazy" />
                      ) : (
                        <div className="cart-item-image-fallback">GoalGrocer</div>
                      )}
                    </div>

                    <div className="cart-item-details">
                      <strong>{item.name}</strong>
                      <div>{currency(item.price)} each</div>
                      <div className="cart-item-meta">
                        <span>{categoryMap[item.categoryId] || "Uncategorized"}</span>
                        <span>•</span>
                        <span>{item.protein}g protein</span>
                        <span>•</span>
                        <span>{item.calories} kcal</span>
                      </div>
                      <div className="cart-item-tags">
                        {(item.goalBadges || []).slice(0, 2).map((badge) => (
                          <span key={badge} className="goal-badge">
                            {badge}
                          </span>
                        ))}
                        {(item.tags || []).slice(0, 2).map((tagName) => (
                          <span key={tagName} className="pill pill-muted">
                            {tagName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="actions-row cart-item-actions">
                    <input
                      className="field qty-field"
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => setQty(item.id, Number(e.target.value))}
                    />
                    <strong>{currency(item.price * item.qty)}</strong>
                    <button className="btn btn-ghost" onClick={() => removeFromCart(item.id)}>
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="card">
            <h3>Total: {currency(cartTotal)}</h3>
            <div className="actions-row">
              <button className="btn btn-ghost" onClick={clearCart}>
                Clear cart
              </button>
              <button className="btn btn-primary" onClick={() => navigate("/checkout")}>
                Checkout
              </button>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
