import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { createOrder, listProducts } from "../services/db";
import { currency } from "../services/format";

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();

  const [paymentType, setPaymentType] = useState("Card");
  const [isPlacing, setIsPlacing] = useState(false);
  const products = useMemo(() => listProducts(), []);
  const productMap = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product])),
    [products]
  );

  const hasItems = useMemo(
    () => Array.isArray(cartItems) && cartItems.length > 0,
    [cartItems]
  );

  function handlePlaceOrder() {
    if (!user || !hasItems || isPlacing) return;
    setIsPlacing(true);

    try {
      const order = createOrder({
        userId: user.id,
        items: cartItems,
        paymentType,
        actor: user,
      });

      localStorage.setItem("goalgrocer_last_order", JSON.stringify(order));
      clearCart();
      navigate("/order-success", { replace: true });
    } catch {
      setIsPlacing(false);
    }
  }

  return (
    <AppShell title="Checkout" subtitle="Secure payment and order confirmation.">
      {!hasItems ? (
        <section className="card">
          <p>Your cart is empty.</p>
          <Link to="/store" className="btn btn-primary">
            Back to Store
          </Link>
        </section>
      ) : (
        <>
          <section className="card">
            <h3>Order Summary</h3>
            <div className="order-list">
              {cartItems.map((item) => (
                <article key={item.id} className="order-row checkout-item-row">
                  <div className="checkout-item-main">
                    <div className="checkout-item-image-wrap">
                      {item.imageUrl || productMap[item.id]?.imageUrl ? (
                        <img
                          className="checkout-item-image"
                          src={item.imageUrl || productMap[item.id]?.imageUrl}
                          alt={item.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="checkout-item-image-fallback">GoalGrocer</div>
                      )}
                    </div>
                    <div className="checkout-item-detail">
                      <strong>{item.name}</strong>
                      <small>Qty: {item.qty}</small>
                    </div>
                  </div>
                  <strong>{currency(item.price * item.qty)}</strong>
                </article>
              ))}
            </div>
            <h3>Total: {currency(cartTotal)}</h3>
          </section>

          <section className="card">
            <h3>Payment Method</h3>
            <select
              className="field"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              disabled={isPlacing}
            >
              <option value="Card">Card</option>
              <option value="Cash">Cash on Delivery</option>
              <option value="PayPal">PayPal</option>
            </select>

            <div className="actions-row" style={{ marginTop: 12 }}>
              <Link to="/cart" className="btn btn-ghost">
                Back to cart
              </Link>
              <button
                className="btn btn-primary"
                onClick={handlePlaceOrder}
                disabled={isPlacing}
              >
                {isPlacing ? "Processing payment..." : "Pay now"}
              </button>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
