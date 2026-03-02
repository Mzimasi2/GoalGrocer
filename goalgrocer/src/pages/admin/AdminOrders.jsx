import { useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import { listOrders, listProducts } from "../../services/db";
import { currency, formatDate } from "../../services/format";

export default function AdminOrders() {
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const orders = listOrders({ paymentType: paymentFilter, status: statusFilter });
  const products = useMemo(() => listProducts(), []);
  const productMap = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product])),
    [products]
  );

  return (
    <AppShell title="Admin Orders" subtitle="Filter and monitor transactions.">
      <section className="card">
        <div className="filter-grid">
          <select
            className="field"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option>All</option>
            <option>Card</option>
            <option>Cash</option>
            <option>PayPal</option>
          </select>

          <select
            className="field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>Complete</option>
          </select>
        </div>
      </section>

      <section className="order-list">
        {orders.map((order) => (
          <article key={order.id} className="card">
            <div className="section-head">
              <strong>{order.id}</strong>
              <span>
                {order.status} | {order.paymentType}
              </span>
            </div>
            <small>
              User: {order.userId} | {formatDate(order.createdAt)}
            </small>
            <div className="order-list" style={{ marginTop: 8 }}>
              {order.items.map((item) => (
                <div key={item.productId} className="order-row">
                  <div className="checkout-item-main">
                    <div className="checkout-item-image-wrap">
                      {item.imageUrl || productMap[item.productId]?.imageUrl ? (
                        <img
                          className="checkout-item-image"
                          src={item.imageUrl || productMap[item.productId]?.imageUrl}
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
                  <span>{currency(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <h4>
              Revenue: {currency(order.subTotal)} | Cost: {currency(order.totalCost)} | Profit: {currency(order.profit)}
            </h4>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
