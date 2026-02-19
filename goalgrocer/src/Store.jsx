import { Link } from "react-router-dom";
import "./Store.css";
import { useState, useMemo } from "react";

const products = [
  {
    id: 1,
    name: "Chicken Breast Pack",
    category: "Protein",
    tags: ["high-protein", "low-carb"],
    goals: ["Weight Loss", "Gain Lean Muscle"],
    price: 350,
    calories: 420,
    protein: 35,
  },
  {
    id: 2,
    name: "Greek Yogurt (Plain)",
    category: "Dairy",
    tags: ["high-protein", "low-sugar"],
    goals: ["Weight Loss", "Maintain Weight"],
    price: 299,
    calories: 310,
    protein: 28,
  },
  {
    id: 3,
    name: "Lean Beef Mince",
    category: "Protein",
    tags: ["high-protein"],
    goals: ["Gain Lean Muscle"],
    price: 399,
    calories: 500,
    protein: 40,
  },
  {
    id: 4,
    name: "Mixed Veggies Bowl",
    category: "Veg",
    tags: ["low-calorie", "high-fibre"],
    goals: ["Weight Loss"],
    price: 250,
    calories: 280,
    protein: 22,
  },
  {
    id: 5,
    name: "Tuna Can (In Water)",
    category: "Protein",
    tags: ["high-protein", "low-calorie"],
    goals: ["Weight Loss", "Gain Lean Muscle"],
    price: 199,
    calories: 260,
    protein: 24,
  },
  {
    id: 6,
    name: "Oats (Rolled)",
    category: "Carbs",
    tags: ["high-fibre", "budget"],
    goals: ["Maintain Weight"],
    price: 220,
    calories: 300,
    protein: 27,
  },
  {
    id: 7,
    name: "Eggs (18 Pack)",
    category: "Protein",
    tags: ["budget", "high-protein"],
    goals: ["Gain Lean Muscle", "Maintain Weight"],
    price: 180,
    calories: 240,
    protein: 20,
  },
  {
    id: 8,
    name: "Cottage Cheese",
    category: "Dairy",
    tags: ["high-protein", "low-carb"],
    goals: ["Weight Loss", "Maintain Weight"],
    price: 250,
    calories: 320,
    protein: 30,
  },
  {
    id: 9,
    name: "Brown Rice (1kg)",
    category: "Carbs",
    tags: ["high-fibre"],
    goals: ["Maintain Weight", "Gain Lean Muscle"],
    price: 180,
    calories: 360,
    protein: 8,
  },
  {
    id: 10,
    name: "Almond Butter",
    category: "Healthy Fats",
    tags: ["healthy-fat", "high-calorie"],
    goals: ["Gain Lean Muscle"],
    price: 320,
    calories: 600,
    protein: 21,
  },
  {
    id: 11,
    name: "Avocados (4 Pack)",
    category: "Healthy Fats",
    tags: ["healthy-fat", "low-carb"],
    goals: ["Weight Loss", "Maintain Weight"],
    price: 250,
    calories: 320,
    protein: 4,
  },
  {
    id: 12,
    name: "Sweet Potatoes (1kg)",
    category: "Carbs",
    tags: ["high-fibre", "low-fat"],
    goals: ["Maintain Weight", "Gain Lean Muscle"],
    price: 140,
    calories: 280,
    protein: 5,
  },
  {
    id: 13,
    name: "Salmon Fillets",
    category: "Protein",
    tags: ["omega-3", "high-protein"],
    goals: ["Weight Loss", "Gain Lean Muscle"],
    price: 450,
    calories: 520,
    protein: 42,
  },
  {
    id: 14,
    name: "Protein Wraps",
    category: "Carbs",
    tags: ["high-protein", "low-carb"],
    goals: ["Weight Loss", "Maintain Weight"],
    price: 160,
    calories: 210,
    protein: 15,
  },
  {
    id: 15,
    name: "Quinoa (500g)",
    category: "Carbs",
    tags: ["high-protein", "high-fibre"],
    goals: ["Maintain Weight"],
    price: 230,
    calories: 350,
    protein: 14,
  },
  {
    id: 16,
    name: "Low Fat Milk",
    category: "Dairy",
    tags: ["low-fat"],
    goals: ["Maintain Weight"],
    price: 120,
    calories: 150,
    protein: 8,
  },
  {
    id: 17,
    name: "Whey Protein Powder",
    category: "Supplement",
    tags: ["high-protein"],
    goals: ["Gain Lean Muscle"],
    price: 650,
    calories: 120,
    protein: 24,
  },
  {
    id: 18,
    name: "Peanut Butter (Natural)",
    category: "Healthy Fats",
    tags: ["healthy-fat", "high-protein"],
    goals: ["Gain Lean Muscle", "Maintain Weight"],
    price: 200,
    calories: 580,
    protein: 25,
  },
  {
    id: 19,
    name: "Spinach Pack",
    category: "Veg",
    tags: ["low-calorie", "high-fibre"],
    goals: ["Weight Loss"],
    price: 90,
    calories: 80,
    protein: 3,
  },
  {
    id: 20,
    name: "Chickpeas (Canned)",
    category: "Protein",
    tags: ["plant-protein", "high-fibre"],
    goals: ["Weight Loss", "Maintain Weight"],
    price: 130,
    calories: 270,
    protein: 12,
  },
];


function Store() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [goal, setGoal] = useState("All");
  const [sort, setSort] = useState("relevance");

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category)));
    return ["All", ...unique];
  }, []);

  const goals = useMemo(() => {
    const unique = Array.from(
      new Set(products.flatMap((p) => p.goals))
    );
    return ["All", ...unique];
  }, []);

  const filteredProducts = useMemo(() => {
    const s = search.trim().toLowerCase();

    let list = products.filter((p) => {
      const matchesSearch =
        !s ||
        p.name.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s) ||
        p.tags.some((t) => t.toLowerCase().includes(s)) ||
        p.goals.some((g) => g.toLowerCase().includes(s));

      const matchesCategory = category === "All" || p.category === category;
      const matchesGoal = goal === "All" || p.goals.includes(goal);

      return matchesSearch && matchesCategory && matchesGoal;
    });

    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);

    return list;
  }, [search, category, goal, sort]);

  return (
    <div>
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            GoalGrocer
          </Link>
        </div>

        <div className="navIcons">
          <button className="iconBtn" title="Profile">👤</button>
          <button className="iconBtn" title="Cart">🛒</button>
        </div>
      </nav>

      {/* STORE HEADER */}
      <div className="storeHeader">
        <h2>Shop Clean Food</h2>
        <p>Filter by goal, category, and compare key nutrition fast.</p>
      </div>

      {/* FILTERS */}
      <div className="filters">
        <input
          className="searchInput"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search: chicken, high-protein, weight loss..."
        />

        <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select className="select" value={goal} onChange={(e) => setGoal(e.target.value)}>
          {goals.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="relevance">Sort: Relevance</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
        </select>
      </div>

      {/* RESULTS */}
      <div className="resultsMeta">
        <strong>{filteredProducts.length}</strong> items found
      </div>

      {/* PRODUCT GRID */}
      <div className="productGrid">
        {filteredProducts.map((p) => (
          <div key={p.id} className="productCard">
            <div className="cardTop">
              <h3 className="productName">{p.name}</h3>
              <span className="price">R{p.price}</span>
            </div>

            <div className="badgesRow">
              <span className="badge">{p.category}</span>
              {p.tags.slice(0, 2).map((t) => (
                <span key={t} className="badge ghost">{t}</span>
              ))}
            </div>

            <div className="nutritionRow">
              <div className="nutri">
                <div className="nutriLabel">Calories</div>
                <div className="nutriValue">{p.calories}</div>
              </div>
              <div className="nutri">
                <div className="nutriLabel">Protein (g)</div>
                <div className="nutriValue">{p.protein}</div>
              </div>
            </div>

            <div className="goalsRow">
              {p.goals.map((g) => (
                <span key={g} className="goalPill">{g}</span>
              ))}
            </div>

            <div className="cardActions">
              <button className="btnPrimary">Add to Cart</button>
              <button className="btnGhost">Wishlist</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Store;



