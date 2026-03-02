import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  getWishlistProductIds,
  incrementProductViews,
  listCategories,
  listMealPlans,
  listProducts,
  toggleWishlistItem,
} from "../services/db";
import {
  recommendFromPromptAI,
  recommendFromImageAI,
} from "../services/recommendation";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [products, setProducts] = useState(() => listProducts());
  const [categories] = useState(() => listCategories());
  const [mealPlans] = useState(() => listMealPlans());

  const [prompt, setPrompt] = useState("");
  const [selectedGoal, setSelectedGoal] = useState(user?.savedGoal || "");
  const [budget, setBudget] = useState(user?.savedBudget || "");
  const [promptResult, setPromptResult] = useState(null);
  const [isRunningRecommendation, setIsRunningRecommendation] = useState(false);
  const [isRunningImageRecommendation, setIsRunningImageRecommendation] = useState(false);
  const [imageResult, setImageResult] = useState([]);
  const [imageResultMeta, setImageResultMeta] = useState(null);
  const [openAdvanced, setOpenAdvanced] = useState(false);
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

  async function handlePromptRun() {
    setIsRunningRecommendation(true);
    try {
      const result = await recommendFromPromptAI(products, prompt, selectedGoal, budget);
      setPromptResult(result);
    } finally {
      setIsRunningRecommendation(false);
    }
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsRunningImageRecommendation(true);
    try {
      const result = await recommendFromImageAI(products, file, selectedGoal, budget);
      setImageResult(result.products);
      setImageResultMeta(result);
    } finally {
      setIsRunningImageRecommendation(false);
    }
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
    <AppShell>
      <header className="homeHero">
        <h1 className="homeTitle">GoalGrocer</h1>
        <p className="homeSub">Clean groceries for weight loss and maintenance goals.</p>
      </header>

      <section className="smart-search">
        <div className="smart-row">
          <div className="smart-input-wrap">
            <span className="smart-icon" aria-hidden>
              🔎
            </span>
            <input
              className="smart-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='Try: "High protein under R300, good for weight loss"'
            />
          </div>

          <button
            className="btn btn-primary smart-primary"
            onClick={handlePromptRun}
            disabled={isRunningRecommendation}
          >
            {isRunningRecommendation ? "Generating..." : "Recommend"}
          </button>

          <button
            className="btn btn-ghost smart-ghost"
            onClick={() => setOpenAdvanced((value) => !value)}
            aria-expanded={openAdvanced}
          >
            {openAdvanced ? "Hide" : "Filters"}
          </button>
        </div>

        {openAdvanced && (
          <div className="smart-advanced">
            <div className="smart-advanced-grid">
              <div className="advanced-field">
                <label htmlFor="home-goal">Goal</label>
                <select
                  id="home-goal"
                  className="field"
                  value={selectedGoal}
                  onChange={(e) => setSelectedGoal(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div className="advanced-field">
                <label htmlFor="home-budget">Weekly budget (R)</label>
                <input
                  id="home-budget"
                  className="field"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 800"
                />
              </div>

              <div className="advanced-field">
                <label>Upload image</label>
                <label className="btn btn-ghost file-btn smart-upload">
                  {isRunningImageRecommendation ? "Analyzing..." : "Choose image"}
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

          </div>
        )}
      </section>

      {promptResult && (
        <section>
          <div className="section-head">
            <h3>Prompt Results</h3>
            <small>
              Goal: {promptResult.goal || "Any"} | Budget: {promptResult.budget || "Not set"}
            </small>
          </div>
          <p className="helper-text">
            Engine: {promptResult.source === "ai" ? "AI model" : "Local rules"} |{" "}
            {promptResult.sourceNote}
          </p>
          <div className="product-grid home-product-grid">
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

      {imageResultMeta && (
        <section>
          <h3>Similar Products from Image</h3>
          {imageResult.length > 0 ? (
          <div className="product-grid home-product-grid">
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
          ) : (
            <p className="helper-text">No matches returned from image analysis.</p>
          )}
        </section>
      )}

      <section>
        <div className="section-head">
          <h3>Top Selling Products</h3>
          <Link to="/store" className="text-link">
            View all
          </Link>
        </div>
        <div className="product-grid home-product-grid">
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
        <div className="product-grid home-product-grid">
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
          {mealPlans.map((plan) => {
            return (
              <article key={plan.goal} className="card meal-plan-card">
                <img
                  className="meal-plan-image"
                  src={plan.imageUrl || ""}
                  alt={`${plan.goal} meal plan`}
                  loading="lazy"
                />
                <h4>{plan.goal}</h4>
                <p>{plan.summary}</p>
                <Link
                  className="btn meal-plan-btn"
                  to={`/meal-plans?goal=${encodeURIComponent(plan.goal)}`}
                >
                  View Full Weekly Plan {"->"}
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
