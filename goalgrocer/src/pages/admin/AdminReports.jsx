import AppShell from "../../components/AppShell";
import { buildReports } from "../../services/db";
import { currency } from "../../services/format";

export default function AdminReports() {
  const reports = buildReports();

  return (
    <AppShell title="Admin Reports" subtitle="Financial, product, and customer insights.">
      <section className="stat-grid cards-3">
        <article className="card">
          <small>Total Revenue</small>
          <h3>{currency(reports.financial.totalRevenue)}</h3>
        </article>
        <article className="card">
          <small>Cost of Sales</small>
          <h3>{currency(reports.financial.totalCostOfSales)}</h3>
        </article>
        <article className="card">
          <small>Total Profit</small>
          <h3>{currency(reports.financial.totalProfit)}</h3>
        </article>
      </section>

      <section className="card">
        <h3>Revenue by Payment Type</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Payment Type</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(reports.financial.revenueByPayment).map(([type, value]) => (
                <tr key={type}>
                  <td>{type}</td>
                  <td>{currency(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>Best Selling Products</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Sold Count</th>
              </tr>
            </thead>
            <tbody>
              {reports.product.bestSellingProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.soldCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>Most Viewed Products</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Views</th>
              </tr>
            </thead>
            <tbody>
              {reports.product.mostViewedProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.viewsCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>Sales by Category</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Sales</th>
              </tr>
            </thead>
            <tbody>
              {reports.product.salesByCategory.map((row) => (
                <tr key={row.categoryId}>
                  <td>{row.categoryName}</td>
                  <td>{currency(row.sales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>Top Spending Customers</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Total Spend</th>
                <th>Order Count</th>
              </tr>
            </thead>
            <tbody>
              {reports.customer.topSpendingCustomers.map((row) => (
                <tr key={row.userId}>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{currency(row.totalSpend)}</td>
                  <td>{row.orderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>Customer Metrics</h3>
        <p>Average Order Value: {currency(reports.customer.averageOrderValue)}</p>
        <h4>Goal Preference Distribution</h4>
        <ul>
          {Object.entries(reports.customer.goalPreferenceDistribution).map(([goal, count]) => (
            <li key={goal}>
              {goal}: {count}
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
