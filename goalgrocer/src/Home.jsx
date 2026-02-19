import { useState } from "react";
import { Link } from "react-router-dom";

function Home() {
  // Search state
  const [query, setQuery] = useState("");

  // Block 4 Data (Top Selling Products) - UPDATED: name + tags added
  const topSelling = [
    {
      id: 1,
      name: "Chicken Breast Pack",
      tags: ["high-protein", "low-carb"],
      price: 350,
      calories: 420,
      protein: 35,
    },
    {
      id: 2,
      name: "Greek Yogurt (Plain)",
      tags: ["high-protein", "low-sugar"],
      price: 299,
      calories: 310,
      protein: 28,
    },
    {
      id: 3,
      name: "Lean Beef Mince",
      tags: ["high-protein"],
      price: 399,
      calories: 500,
      protein: 40,
    },
    {
      id: 4,
      name: "Mixed Veggies Bowl",
      tags: ["low-calorie", "high-fibre"],
      price: 250,
      calories: 280,
      protein: 22,
    },
  ];

  // Weekly Deals - UPDATED: name + tags added
  const cleanDeal = [
    {
      id: 5,
      name: "Tuna Can (In Water)",
      tags: ["high-protein", "low-calorie"],
      price: 199,
      calories: 260,
      protein: 24,
    },
    {
      id: 6,
      name: "Oats (Rolled)",
      tags: ["high-fibre", "budget"],
      price: 220,
      calories: 300,
      protein: 27,
    },
    {
      id: 7,
      name: "Eggs (18 Pack)",
      tags: ["budget", "high-protein"],
      price: 180,
      calories: 240,
      protein: 20,
    },
    {
      id: 8,
      name: "Cottage Cheese",
      tags: ["high-protein", "low-carb"],
      price: 250,
      calories: 320,
      protein: 30,
    },
  ];

  // Weekly meal plan
  const weeklyMealPlans = [
    {
      id: 1,
      name: "Weight Loss Starter (7 Days)",
      goal: "Weight Loss",
      caloriesPerDay: 1500,
      proteinPerDay: 120,
      mealsPerDay: 3,
    },
    {
      id: 2,
      name: "Maintain & Balanced (7 Days)",
      goal: "Maintain Weight",
      caloriesPerDay: 2000,
      proteinPerDay: 110,
      mealsPerDay: 3,
    },
    {
      id: 3,
      name: "Lean Muscle Builder (7 Days)",
      goal: "Gain Lean Muscle",
      caloriesPerDay: 2500,
      proteinPerDay: 160,
      mealsPerDay: 4,
    },
  ];

  // Story 2: Standard search uses the SAME input
  const allProducts = [...topSelling, ...cleanDeal];
  const q = query.toLowerCase().trim();

  const results =
    q === ""
      ? []
      : allProducts.filter((p) => {
          const nameMatch = (p.name || "").toLowerCase().includes(q);
          const tagsMatch = (p.tags || []).some((t) =>
            t.toLowerCase().includes(q)
          );
          return nameMatch || tagsMatch;
        });

  return (
    <div className="home">
      {/* Block 1: NAVBAR */}
      <nav className="navbar">
        <div className="logo">
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
             GoalGrocer
        </Link>
    </div>

        

        <div className="navIcons">
          <button className="iconBtn">👤</button>
          <button className="iconBtn">🛒</button>
          <Link className="iconBtn" to="/store">Store</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="heroSection">
        <h1 className="mainTitle">EAT CLEAN. REACH YOUR GOAL</h1>
        <p className="subTitle">Clean Food. Smart Choices</p>

        {/* ONE Search Input (Story 2 now, Story 4 later) */}
        <div className="searchRow">
          <input
            className="promptInput"
            type="text"
            placeholder="Search products (e.g. chicken, yogurt) or describe your goal"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button className="iconBtn" aria-label="Search">
            🔍
          </button>

          <label className="iconBtn" aria-label="Upload image">
            ⬆️
            <input type="file" hidden />
          </label>

          <Link to="/store" className="iconBtn" aria-label="Go to Store">🏬</Link>

        </div>

        {/* Goal Buttons */}
        <div className="goalButtons">
          <button className="goalBtn">Weight Loss</button>
          <button className="goalBtn">Maintain Weight</button>
          <button className="goalBtn">Gain Lean Muscle</button>
        </div>
      </div>

      {/* Story 2: Search Results (shows only when query is not empty) */}
      {q !== "" && (
        <section className="productsSection">
          <h2 className="sectionTitle">Search Results ({results.length})</h2>

          <div className="productGrid">
            {results.map((product) => (
              <div key={product.id} className="productCard">
                <div className="productImage">🖼️</div>

                <div className="productInfo">
                  <strong>{product.name}</strong>
                  <p>R{product.price}</p>
                  <p>Calories: {product.calories}</p>
                  <p>Protein: {product.protein}g</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Block 4: Top Selling Products */}
      <section className="productsSection">
        <h2 className="sectionTitle">TOP SELLING PRODUCTS</h2>

        <div className="productGrid">
          {topSelling.map((product) => (
            <div key={product.id} className="productCard">
              <div className="productImage">🖼️</div>

              <div className="productInfo">
                <strong>{product.name}</strong>
                <p>R{product.price}</p>
                <p>Calories: {product.calories}</p>
                <p>Protein: {product.protein}g</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Block 5: This Week’s Clean Deal */}
      <section className="productsSection">
        <h2 className="sectionTitle">THIS WEEK’S CLEAN DEAL</h2>

        <div className="productGrid">
          {cleanDeal.map((product) => (
            <div key={product.id} className="productCard">
              <div className="productImage">🏷️</div>

              <div className="productInfo">
                <strong>{product.name}</strong>
                <p>R{product.price}</p>
                <p>Calories: {product.calories}</p>
                <p>Protein: {product.protein}g</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Block 6: Weekly Meal Plans */}
      <section className="mealPlansSection">
        <div className="sectionHeaderRow">
          <h2 className="sectionTitle">WEEKLY MEAL PLANS</h2>
          <button className="linkBtn">View all</button>
        </div>

        <div className="mealPlanGrid">
          {weeklyMealPlans.map((plan) => (
            <div key={plan.id} className="mealPlanCard">
              <div className="mealPlanTop">
                <div className="mealPlanBadge">{plan.goal}</div>
                <h3 className="mealPlanName">{plan.name}</h3>
              </div>

              <div className="mealPlanStats">
                <p>
                  <strong>{plan.mealsPerDay}</strong> meals/day
                </p>
                <p>
                  <strong>{plan.caloriesPerDay}</strong> kcal/day
                </p>
                <p>
                  <strong>{plan.proteinPerDay}</strong> g protein/day
                </p>
              </div>

              <div className="mealPlanActions">
                <button className="primaryBtn">Use this plan</button>
                <button className="secondaryBtn">See details</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Block 7: Footer */}
      <footer className="footer">
        <div className="footerTop">
          <div className="footerBrand">
            <strong>GoalGrocer</strong>
            <p>Clean food for goal-driven people.</p>
          </div>

          <div className="footerLinks">
            <a href="#">About</a>
            <a href="#">Contact</a>
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </div>

        <div className="footerBottom">
          <p>© {new Date().getFullYear()} GoalGrocer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
 }

export default Home;
