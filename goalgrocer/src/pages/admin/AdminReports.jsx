import AppShell from "../../components/AppShell";
import { buildReports } from "../../services/db";
import { currency } from "../../services/format";

const CHART_COLORS = ["#dc2626", "#16a34a", "#eab308"];

function MetricBars({
  rows,
  valueKey,
  labelKey,
  formatter = (value) => value,
  metaFormatter = null,
}) {
  const max = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 1);

  return (
    <div className="metric-bars">
      {rows.map((row, index) => {
        const value = Number(row[valueKey] || 0);
        const width = `${Math.max(6, Math.round((value / max) * 100))}%`;
        const color = CHART_COLORS[index % CHART_COLORS.length];
        return (
          <article key={row.id || row[labelKey]} className="metric-row">
            <div className="metric-row-head">
              <div className="metric-row-label">
                <strong>{row[labelKey]}</strong>
                {metaFormatter && <small>{metaFormatter(row)}</small>}
              </div>
              <span>{formatter(value)}</span>
            </div>
            <div className="metric-track">
              <div className="metric-fill" style={{ width, backgroundColor: color }} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PieChart({ rows, valueKey, labelKey, formatter = (value) => value }) {
  const normalized = rows
    .map((row, index) => ({
      id: row.id || row[labelKey] || `${labelKey}-${index}`,
      label: String(row[labelKey] || "Unknown"),
      value: Math.max(0, Number(row[valueKey] || 0)),
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .filter((row) => row.value > 0);

  const total = normalized.reduce((sum, row) => sum + row.value, 0);
  const slices = [];
  let cursor = 0;
  for (const row of normalized) {
    const start = cursor;
    const span = total > 0 ? (row.value / total) * 360 : 0;
    cursor += span;
    slices.push(`${row.color} ${start.toFixed(2)}deg ${cursor.toFixed(2)}deg`);
  }
  const background = slices.length
    ? `conic-gradient(${slices.join(", ")})`
    : "conic-gradient(#e2e8f0 0deg 360deg)";

  return (
    <div className="pie-layout">
      <div className="pie-chart-wrap">
        <div className="pie-chart" style={{ background }} aria-label="Pie chart" />
        <div className="pie-center">
          <strong>{formatter(total)}</strong>
          <small>Total</small>
        </div>
      </div>
      <div className="pie-legend">
        {normalized.map((row) => {
          const percent = total > 0 ? Math.round((row.value / total) * 100) : 0;
          return (
            <div key={row.id} className="pie-legend-row">
              <span className="pie-dot" style={{ backgroundColor: row.color }} />
              <span className="pie-label">{row.label}</span>
              <span className="pie-value">{formatter(row.value)}</span>
              <span className="pie-percent">{percent}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminReports() {
  const reports = buildReports();
  const paymentRows = Object.entries(reports.financial.revenueByPayment).map(([type, value]) => ({
    id: type,
    label: type,
    value,
  }));
  const goalRows = Object.entries(reports.customer.goalPreferenceDistribution).map(
    ([goal, count]) => ({
      id: goal,
      label: goal,
      count,
    })
  );

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
        <PieChart
          rows={paymentRows}
          labelKey="label"
          valueKey="value"
          formatter={(value) => currency(value)}
        />
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
        <MetricBars
          rows={reports.product.salesByCategory}
          labelKey="categoryName"
          valueKey="sales"
          formatter={(value) => currency(value)}
        />
      </section>

      <section className="card">
        <h3>Top Spending Customers</h3>
        <MetricBars
          rows={reports.customer.topSpendingCustomers}
          labelKey="name"
          valueKey="totalSpend"
          formatter={(value) => currency(value)}
          metaFormatter={(row) => `${row.email} | ${row.orderCount} orders`}
        />
      </section>

      <section className="card">
        <h3>Customer Metrics</h3>
        <p>Average Order Value: {currency(reports.customer.averageOrderValue)}</p>
        <h4>Goal Preference Distribution</h4>
        <PieChart
          rows={goalRows}
          labelKey="label"
          valueKey="count"
          formatter={(value) => `${value} users`}
        />
      </section>
    </AppShell>
  );
}
