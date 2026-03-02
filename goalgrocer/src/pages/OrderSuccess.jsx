import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { currency, formatDate } from "../services/format";

export default function OrderSuccess() {
  const raw = localStorage.getItem("goalgrocer_last_order");
  const order = raw ? JSON.parse(raw) : null;

  return (
    <AppShell title="Order Complete" subtitle="Your payment was successful.">
      {!order ? (
        <section className="card">
          <p>No recent order found.</p>
          <div className="actions-row" style={{ justifyContent: "center", marginTop: 12 }}>
            <Link className="btn btn-primary" to="/store">
              Continue shopping
            </Link>
          </div>
        </section>
      ) : (
        <section className="card">
          <p>
            Order ID: <strong>{order.id}</strong>
          </p>
          <p>
            Status: <strong>{order.status}</strong>
          </p>
          <p>
            Payment: <strong>{order.paymentType}</strong>
          </p>
          <p>
            Date: <strong>{formatDate(order.createdAt)}</strong>
          </p>

          <div className="order-list">
            {order.items.map((item) => (
              <article key={item.productId} className="order-row">
                <div className="checkout-item-main">
                  <div className="checkout-item-image-wrap">
                    {item.imageUrl ? (
                      <img
                        className="checkout-item-image"
                        src={item.imageUrl}
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
                <strong>{currency(item.lineTotal)}</strong>
              </article>
            ))}
          </div>

          <h3>Total: {currency(order.subTotal)}</h3>
          <div className="actions-row" style={{ justifyContent: "center", marginTop: 12 }}>
            <Link className="btn btn-primary" to="/store">
              Continue shopping
            </Link>
          </div>
        </section>
      )}
    </AppShell>
  );
}
