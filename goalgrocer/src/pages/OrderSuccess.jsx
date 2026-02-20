import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { currency, formatDate } from "../services/format";

export default function OrderSuccess() {
  const raw = localStorage.getItem("goalgrocer_last_order");
  const order = raw ? JSON.parse(raw) : null;

  return (
    <AppShell title="Order Complete" subtitle="Your payment simulation is successful.">
      {!order ? (
        <section className="card">
          <p>No recent order found.</p>
          <Link className="btn btn-primary" to="/store">
            Continue shopping
          </Link>
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
                <span>
                  {item.name} x {item.qty}
                </span>
                <strong>{currency(item.lineTotal)}</strong>
              </article>
            ))}
          </div>

          <h3>Total: {currency(order.subTotal)}</h3>
          <Link className="btn btn-primary" to="/store">
            Continue shopping
          </Link>
        </section>
      )}
    </AppShell>
  );
}
