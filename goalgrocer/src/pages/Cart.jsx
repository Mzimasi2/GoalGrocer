import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useCart } from "../context/CartContext";
import { currency } from "../services/format";

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, setQty, cartTotal, clearCart } = useCart();

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
              {cartItems.map((item) => (
                <article key={item.id} className="order-row">
                  <div>
                    <strong>{item.name}</strong>
                    <div>{currency(item.price)} each</div>
                  </div>
                  <div className="actions-row">
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
