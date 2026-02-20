import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { GOAL_PLAN_CARDS } from "../data/weeklyPlans";
import {
  getWishlistProductIds,
  incrementProductViews,
  listCategories,
  listProducts,
  toggleWishlistItem,
} from "../services/db";
import {
  recommendFromImageName,
  recommendFromPrompt,
} from "../services/recommendation";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [products, setProducts] = useState(() => listProducts());
  const [categories] = useState(() => listCategories());

  const [prompt, setPrompt] = useState("");
  const [selectedGoal, setSelectedGoal] = useState(user?.savedGoal || "");
  const [budget, setBudget] = useState(user?.savedBudget || "");
  const [promptResult, setPromptResult] = useState(null);
  const [imageResult, setImageResult] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(() =>
    getWishlistProductIds(user?.id)
  );

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const topSelling = useMemo(
    () => [...products].sort((a, b) => b.soldCount - a.soldCount).slice(0, 4),
    [products]
  );

  const promotions = useMemo(
    () => products.filter((p) => p.isPromotion).slice(0, 4),
    [products]
  );

  function refreshProducts() {
    setProducts(listProducts());
  }

  function handleView(product) {
    incrementProductViews(product.id);
    refreshProducts();
  }

  function handlePromptRun() {
    const result = recommendFromPrompt(products, prompt, selectedGoal, budget);
    setPromptResult(result);
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const match = recommendFromImageName(products, file.name);
    setImageResult(match);
  }

  function handleWishlist(product) {
    if (!user || user.role !== "customer") {
      navigate("/login", { state: { from: "/" } });
      return;
    }

    const next = toggleWishlistItem(user.id, product.id);
    setWishlistIds(next);
  }

  return (
    <AppShell
      title="GoalGrocer"
      subtitle="Clean groceries for weight loss and maintenance goals."
    >
      <section className="card hero-card">
        <h2>Prompt Search + Goal Recommendation</h2>
        <p>
          Tell the platform what you need. Example: "I want to lose weight under
          R800, high protein."
        </p>

        <div className="grid-two">
          <input
            className="field"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your goal and constraints"
          />
          <input
            className="field"
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Weekly budget (R)"
          />
        </div>

        <div className="actions-row">
          <button className="btn btn-primary" onClick={handlePromptRun}>
            Recommend products
          </button>
          <select
            className="field"
            value={selectedGoal}
            onChange={(e) => setSelectedGoal(e.target.value)}
          >
            <option value="">Goal: Any</option>
            <option value="Weight Loss">Weight Loss</option>
            <option value="Maintenance">Maintenance</option>
          </select>
          <label className="btn btn-ghost file-btn">
            Upload image
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>
      </section>

      {promptResult && (
        <section>
          <div className="section-head">
            <h3>Prompt Results</h3>
            <small>
              Goal: {promptResult.goal || "Any"} | Budget: {promptResult.budget || "Not set"}
            </small>
          </div>
          <div className="product-grid">
            {promptResult.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={categoryMap[product.categoryId]}
                onAdd={addToCart}
                onView={handleView}
                onWishlist={handleWishlist}
                wishlistActive={wishlistIds.includes(product.id)}
              />
            ))}
          </div>
        </section>
      )}

      {imageResult.length > 0 && (
        <section>
          <h3>Similar Products from Image</h3>
          <div className="product-grid">
            {imageResult.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={categoryMap[product.categoryId]}
                onAdd={addToCart}
                onView={handleView}
                onWishlist={handleWishlist}
                wishlistActive={wishlistIds.includes(product.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="section-head">
          <h3>Top Selling Products</h3>
          <Link to="/store" className="text-link">
            View all
          </Link>
        </div>
        <div className="product-grid">
          {topSelling.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categoryName={categoryMap[product.categoryId]}
              onAdd={addToCart}
              onView={handleView}
              onWishlist={handleWishlist}
              wishlistActive={wishlistIds.includes(product.id)}
            />
          ))}
        </div>
      </section>

      <section>
        <h3>This Week's Promotions</h3>
        <div className="product-grid">
          {promotions.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categoryName={categoryMap[product.categoryId]}
              onAdd={addToCart}
              onView={handleView}
              onWishlist={handleWishlist}
              wishlistActive={wishlistIds.includes(product.id)}
            />
          ))}
        </div>
      </section>

      <section>
        <h3>Weekly Meal Plans</h3>
        <div className="dish-grid">
          {GOAL_PLAN_CARDS.map((plan) => {
            return (
              <article key={plan.goal} className="card">
                <h4>{plan.goal}</h4>
                <p>{plan.summary}</p>
                <Link
                  className="btn btn-primary"
                  to={`/meal-plans?goal=${encodeURIComponent(plan.goal)}`}
                >
                  View Monday-Sunday Plan
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
