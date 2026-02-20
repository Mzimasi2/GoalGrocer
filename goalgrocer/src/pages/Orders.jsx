import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { listOrders } from "../services/db";
import { currency, formatDate } from "../services/format";

export default function Orders() {
  const { user } = useAuth();
  const orders = listOrders({ userId: user.id });

  return (
    <AppShell title="Order History" subtitle="Track your previous purchases.">
      {orders.length === 0 ? (
        <section className="card">
          <p>No orders yet.</p>
        </section>
      ) : (
        <section className="order-list">
          {orders.map((order) => (
            <article key={order.id} className="card">
              <div className="section-head">
                <strong>{order.id}</strong>
                <span>
                  {order.status} | {order.paymentType}
                </span>
              </div>
              <small>{formatDate(order.createdAt)}</small>

              <div className="order-list" style={{ marginTop: 8 }}>
                {order.items.map((item) => (
                  <div key={item.productId} className="order-row">
                    <span>
                      {item.name} x {item.qty}
                    </span>
                    <span>{currency(item.lineTotal)}</span>
                  </div>
                ))}
              </div>

              <h4>Total: {currency(order.subTotal)}</h4>
            </article>
          ))}
        </section>
      )}
    </AppShell>
  );
}
