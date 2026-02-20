import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useCart } from "../context/CartContext";
import {
  GOAL_INGREDIENT_PRODUCT_IDS,
  GOAL_PLAN_CARDS,
  WEEKLY_MEAL_PLANS,
} from "../data/weeklyPlans";
import { listProducts } from "../services/db";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function WeeklyMealPlans() {
  const { addMany } = useCart();
  const [searchParams] = useSearchParams();
  const goal = searchParams.get("goal") || "Weight Loss";

  const goals = useMemo(() => Object.keys(WEEKLY_MEAL_PLANS), []);
  const safeGoal = goals.includes(goal) ? goal : goals[0];
  const schedule = WEEKLY_MEAL_PLANS[safeGoal];
  const products = useMemo(() => listProducts(), []);

  function handleAddPlanIngredients() {
    const ids = GOAL_INGREDIENT_PRODUCT_IDS[safeGoal] || [];
    const items = ids
      .map((id) => products.find((product) => product.id === id))
      .filter(Boolean);
    addMany(items);
  }

  return (
    <AppShell
      title="Weekly Meal Plans"
      subtitle="Monday to Sunday meal schedule by body goal."
    >
      <section className="card">
        <div className="actions-row">
          {GOAL_PLAN_CARDS.map((card) => (
            <Link
              key={card.goal}
              to={`/meal-plans?goal=${encodeURIComponent(card.goal)}`}
              className={`btn ${safeGoal === card.goal ? "btn-primary" : "btn-ghost"}`}
            >
              {card.goal}
            </Link>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>{safeGoal}: Monday to Sunday</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Breakfast</th>
                <th>Lunch</th>
                <th>Dinner</th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day}>
                  <td>{day}</td>
                  <td>{schedule[day]?.breakfast || "-"}</td>
                  <td>{schedule[day]?.lunch || "-"}</td>
                  <td>{schedule[day]?.dinner || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="actions-row" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={handleAddPlanIngredients}>
            Add meal plan ingredients to cart
          </button>
        </div>
      </section>
    </AppShell>
  );
}
