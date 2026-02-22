import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "../styles/Store.css";
import {
  getWishlistProductIds,
  incrementProductViews,
  listCategories,
  listProducts,
  toggleWishlistItem,
} from "../services/db";

export default function Store() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [products, setProducts] = useState(() => listProducts());
  const [categories] = useState(() => listCategories());

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [goal, setGoal] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState("relevance");

  const [wishlistIds, setWishlistIds] = useState(() =>
    getWishlistProductIds(user?.id)
  );

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );
  const tagOptions = useMemo(() => {
    const unique = new Set();
    for (const product of products) {
      for (const productTag of product.tags || []) {
        unique.add(productTag);
      }
    }
    return [...unique].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const promoCount = useMemo(
    () => products.filter((product) => product.isPromotion).length,
    [products]
  );

  const averagePrice = useMemo(() => {
    if (products.length === 0) return 0;
    const total = products.reduce((sum, product) => sum + Number(product.price || 0), 0);
    return Math.round(total / products.length);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const t = tag.trim().toLowerCase();

    let list = products.filter((product) => {
      const categoryName = categoryMap[product.categoryId] || "";
      const matchSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        categoryName.toLowerCase().includes(q) ||
        product.tags.some((x) => x.toLowerCase().includes(q));

      const matchCategory =
        category === "All" || (categoryMap[product.categoryId] || "") === category;

      const matchGoal =
        goal === "All" || (product.goalBadges || []).includes(goal);

      const matchPrice = !maxPrice || product.price <= Number(maxPrice);

      const matchTag = !t || product.tags.some((x) => x.toLowerCase().includes(t));

      return matchSearch && matchCategory && matchGoal && matchPrice && matchTag;
    });

    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "top-sold") list = [...list].sort((a, b) => b.soldCount - a.soldCount);

    return list;
  }, [
    products,
    search,
    category,
    goal,
    maxPrice,
    tag,
    sort,
    categoryMap,
  ]);

  function refresh() {
    setProducts(listProducts());
  }

  function handleView(product) {
    incrementProductViews(product.id);
    refresh();
  }

  function handleWishlist(product) {
    if (!user || user.role !== "customer") {
      navigate("/login", { state: { from: "/store" } });
      return;
    }
    const ids = toggleWishlistItem(user.id, product.id);
    setWishlistIds(ids);
  }

  function clearFilters() {
    setSearch("");
    setCategory("All");
    setGoal("All");
    setMaxPrice("");
    setTag("");
    setSort("relevance");
  }

  const activeFilterCount =
    Number(Boolean(search)) +
    Number(category !== "All") +
    Number(goal !== "All") +
    Number(Boolean(maxPrice)) +
    Number(Boolean(tag)) +
    Number(sort !== "relevance");

  return (
    <AppShell title="Store" subtitle="Premium nutrition marketplace curated for your goals.">
      <div className="store-page">
        <section className="card store-hero">
          <div className="store-hero-content">
            <p className="store-eyebrow">GoalGrocer Signature Market</p>
            <h2>Shop clean groceries with confidence</h2>
            <p>
              Discover top-rated products designed for Weight Loss and Maintenance plans.
            </p>
            <div className="store-kpi-row">
              <article>
                <small>Live products</small>
                <strong>{products.length}</strong>
              </article>
              <article>
                <small>Promotions</small>
                <strong>{promoCount}</strong>
              </article>
              <article>
                <small>Average price</small>
                <strong>R{averagePrice}</strong>
              </article>
            </div>
          </div>
          <div className="store-hero-glow" />
        </section>

        <section className="card store-filter-panel">
          <div className="store-filter-head">
            <div>
              <h3>Refine your selection</h3>
              <p>{activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}</p>
            </div>
            <button className="btn btn-ghost" onClick={clearFilters}>
              Reset all
            </button>
          </div>

          <div className="filter-grid store-filter-grid">
            <input
              className="field"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product, category, or keyword"
            />

            <select
              className="field"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>All</option>
              {categories.map((c) => (
                <option key={c.id}>{c.name}</option>
              ))}
            </select>

            <select className="field" value={goal} onChange={(e) => setGoal(e.target.value)}>
              <option>All</option>
              <option>Weight Loss</option>
              <option>Maintenance</option>
            </select>

            <input
              className="field"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max price (R)"
            />

            <select className="field" value={tag} onChange={(e) => setTag(e.target.value)}>
              <option value="">All tags</option>
              {tagOptions.map((tagOption) => (
                <option key={tagOption} value={tagOption}>
                  {tagOption}
                </option>
              ))}
            </select>

            <select className="field" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="relevance">Sort: Relevance</option>
              <option value="price-asc">Price low to high</option>
              <option value="price-desc">Price high to low</option>
              <option value="top-sold">Best sellers</option>
            </select>
          </div>
        </section>

        <section>
          <div className="section-head store-results-head">
            <h3>{filteredProducts.length} products</h3>
            <small>Smart nutrition picks for your selected criteria</small>
          </div>
          <div className="product-grid store-product-grid">
            {filteredProducts.map((product) => (
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
      </div>
      
    </AppShell>
  );
}
