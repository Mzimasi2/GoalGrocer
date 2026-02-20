import { Link } from "react-router-dom";
import AppShell from "../../components/AppShell";
import { buildReports, listOrders, listProducts } from "../../services/db";
import { currency } from "../../services/format";

export default function AdminDashboard() {
  const products = listProducts();
  const orders = listOrders();
  const reports = buildReports();

  return (
    <AppShell
      title="Admin Dashboard"
      subtitle="Manage catalogue, orders, and reports."
    >
      <section className="stat-grid cards-4">
        <article className="card">
          <small>Products</small>
          <h3>{products.length}</h3>
        </article>
        <article className="card">
          <small>Orders</small>
          <h3>{orders.length}</h3>
        </article>
        <article className="card">
          <small>Total Revenue</small>
          <h3>{currency(reports.financial.totalRevenue)}</h3>
        </article>
        <article className="card">
          <small>Total Profit</small>
          <h3>{currency(reports.financial.totalProfit)}</h3>
        </article>
      </section>

      <section className="card">
        <h3>Quick Access</h3>
        <div className="actions-row">
          <Link className="btn btn-primary" to="/admin/products">
            Manage Products
          </Link>
          <Link className="btn btn-ghost" to="/admin/categories">
            Manage Categories
          </Link>
          <Link className="btn btn-ghost" to="/admin/orders">
            Manage Orders
          </Link>
          <Link className="btn btn-ghost" to="/admin/reports">
            View Reports
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
