import AppShell from "../../components/AppShell";
import { buildReports } from "../../services/db";
import { currency } from "../../services/format";

function MetricBars({ rows, valueKey, labelKey, formatter = (value) => value }) {
  const max = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 1);

  return (
    <div className="metric-bars">
      {rows.map((row) => {
        const value = Number(row[valueKey] || 0);
        const width = `${Math.max(6, Math.round((value / max) * 100))}%`;
        return (
          <article key={row.id || row[labelKey]} className="metric-row">
            <div className="metric-row-head">
              <strong>{row[labelKey]}</strong>
              <span>{formatter(value)}</span>
            </div>
            <div className="metric-track">
              <div className="metric-fill" style={{ width }} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

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
        <MetricBars
          rows={reports.product.bestSellingProducts}
          labelKey="name"
          valueKey="soldCount"
          formatter={(value) => `${value} sold`}
        />
      </section>

      <section className="card">
        <h3>Most Viewed Products</h3>
        <MetricBars
          rows={reports.product.mostViewedProducts}
          labelKey="name"
          valueKey="viewsCount"
          formatter={(value) => `${value} views`}
        />
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
