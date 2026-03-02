import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { listMealPlans, listProducts, updateMealPlanMealImage } from "../services/db";
import { uploadMealPlanImage } from "../services/mealPlanMedia";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function readMealTitle(mealValue) {
  if (typeof mealValue === "string") return mealValue;
  return String(mealValue?.title || "");
}

function readMealImage(mealValue) {
  if (mealValue && typeof mealValue === "object") {
    return String(mealValue.imageUrl || "");
  }
  return "";
}

function parseIngredients(mealText) {
  return String(mealText || "")
    .replace(/\bwith\b/gi, "+")
    .replace(/&/g, "+")
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 5)
    .map((ingredient, index) => {
      const quantityPresets = ["200g", "120g", "1 cup", "1 portion", "80g"];
      const qty = quantityPresets[index % quantityPresets.length];
      return `${qty} ${ingredient}`;
    });
}

function estimateNutrition(mealText, slot) {
  const text = String(mealText || "");
  const hash = [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const caloriesBase = slot === "breakfast" ? 430 : slot === "lunch" ? 620 : 560;
  const proteinBase = slot === "breakfast" ? 30 : slot === "lunch" ? 46 : 40;
  return {
    calories: caloriesBase + (hash % 90),
    protein: proteinBase + (hash % 12),
  };
}

function buildBadges(goal, mealText) {
  const text = String(mealText || "").toLowerCase();
  const badges = new Set();
  if (text.includes("protein") || text.includes("whey") || text.includes("chicken")) {
    badges.add("High Protein");
  }
  if (text.includes("spinach") || text.includes("veggie") || text.includes("salad")) {
    badges.add("Balanced");
  }
  if (text.includes("oats") || text.includes("rice") || text.includes("quinoa")) {
    badges.add("Sustained Energy");
  }
  if (/weight loss/i.test(goal)) badges.add("Fat Loss");
  if (/lean muscle/i.test(goal)) badges.add("Muscle Gain");
  if (/maintenance/i.test(goal)) badges.add("Maintenance");
  return [...badges].slice(0, 3);
}

function inferProductIdsForDay(daySchedule, products, activePlan) {
  const text = [
    readMealTitle(daySchedule?.breakfast),
    readMealTitle(daySchedule?.lunch),
    readMealTitle(daySchedule?.dinner),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const safeIds = new Set(activePlan?.ingredientProductIds || []);
  const ids = new Set();

  for (const product of products) {
    if (safeIds.size && !safeIds.has(product.id)) continue;
    const keywords = [
      ...String(product.name || "")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((term) => term.length > 3),
      ...(product.tags || []).map((tag) => tag.toLowerCase()),
    ];
    if (keywords.some((keyword) => text.includes(keyword))) {
      ids.add(product.id);
    }
  }

  if (!ids.size) {
    for (const fallbackId of activePlan?.ingredientProductIds || []) {
      ids.add(fallbackId);
      if (ids.size >= 5) break;
    }
  }

  return [...ids];
}

export default function WeeklyMealPlans() {
  const { user } = useAuth();
  const { addMany } = useCart();
  const [searchParams] = useSearchParams();
  const goal = searchParams.get("goal") || "Weight Loss";

  const [plans, setPlans] = useState(() => listMealPlans());
  const goals = useMemo(() => plans.map((plan) => plan.goal), [plans]);
  const safeGoal = goals.includes(goal) ? goal : goals[0];
  const activePlan = useMemo(
    () => plans.find((plan) => plan.goal === safeGoal) || null,
    [plans, safeGoal]
  );
  const schedule = useMemo(() => activePlan?.schedule || {}, [activePlan]);
  const products = useMemo(() => listProducts(), []);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [expandedIngredients, setExpandedIngredients] = useState({});
  const [uploadingSlot, setUploadingSlot] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const daySchedule = useMemo(() => schedule[selectedDay] || {}, [schedule, selectedDay]);

  const dayMeals = useMemo(() => {
    return [
      { slot: "breakfast", label: "Breakfast", meal: daySchedule.breakfast },
      { slot: "lunch", label: "Lunch", meal: daySchedule.lunch },
      { slot: "dinner", label: "Dinner", meal: daySchedule.dinner },
    ].map((entry) => {
      const title = readMealTitle(entry.meal) || "-";
      const imageUrl = readMealImage(entry.meal);
      const nutrition = estimateNutrition(title, entry.slot);
      return {
        ...entry,
        title,
        imageUrl,
        badges: buildBadges(safeGoal, title),
        ingredients: parseIngredients(title),
        nutrition,
      };
    });
  }, [daySchedule, safeGoal]);

  function handleAddPlanIngredients() {
    const ids = activePlan?.ingredientProductIds || [];
    const items = ids
      .map((id) => products.find((product) => product.id === id))
      .filter(Boolean);
    addMany(items);
  }

  function handleAddDayIngredients() {
    const ids = inferProductIdsForDay(daySchedule, products, activePlan);
    const items = ids
      .map((id) => products.find((product) => product.id === id))
      .filter(Boolean);
    addMany(items);
  }

  function toggleIngredients(slot) {
    const key = `${selectedDay}-${slot}`;
    setExpandedIngredients((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleUploadMealImage(slot, file) {
    if (!activePlan || !file) return;
    setUploadMessage("");
    setUploadingSlot(slot);
    try {
      const imageUrl = await uploadMealPlanImage({
        file,
        planId: activePlan.id,
        day: selectedDay,
        slot,
      });
      const updated = updateMealPlanMealImage(activePlan.id, selectedDay, slot, imageUrl, user);
      if (updated) {
        setPlans((prev) => prev.map((plan) => (plan.id === updated.id ? updated : plan)));
      }
      setUploadMessage(`Saved ${selectedDay} ${slot} image to Firebase.`);
    } catch (error) {
      setUploadMessage(error?.message || "Failed to upload meal image.");
    } finally {
      setUploadingSlot("");
    }
  }

  if (!plans.length) {
    return (
      <AppShell
        title="Weekly Meal Plans"
        subtitle="Monday to Sunday meal schedule by body goal."
      >
        <section className="card">
          <h3>No meal plans available</h3>
          <p className="helper-text">Seed the `mealPlans` collection and refresh.</p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Weekly Meal Plans"
      subtitle="Monday to Sunday meal schedule by body goal."
    >
      <section className="card">
        <div className="actions-row">
          {plans.map((card) => (
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
        <div className="meal-day-tabs">
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              className={`btn ${selectedDay === day ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setSelectedDay(day)}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="meal-experience-grid">
          {dayMeals.map((meal) => {
            const ingredientKey = `${selectedDay}-${meal.slot}`;
            const isOpen = Boolean(expandedIngredients[ingredientKey]);
            const isUploading = uploadingSlot === meal.slot;

            return (
              <article key={meal.slot} className="meal-card">
                {meal.imageUrl ? (
                  <img className="meal-card-image" src={meal.imageUrl} alt={`${selectedDay} ${meal.label}`} loading="lazy" />
                ) : (
                  <div className="meal-card-image-fallback">GoalGrocer Meal</div>
                )}
                <div className="meal-card-body">
                  <p className="meal-card-slot">{meal.label}</p>
                  <h4>{meal.title}</h4>
                  <p className="meal-card-macros">
                    {meal.nutrition.calories} kcal | {meal.nutrition.protein}g protein
                  </p>

                  <div className="meal-badge-row">
                    {meal.badges.map((badge) => (
                      <span key={badge} className="meal-badge">
                        {badge}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost meal-toggle-btn"
                    onClick={() => toggleIngredients(meal.slot)}
                  >
                    {isOpen ? "Hide Ingredients" : "View Ingredients"}
                  </button>

                  {user?.role === "admin" && (
                    <label className="btn btn-ghost file-btn meal-upload-btn">
                      {isUploading ? "Uploading..." : "Upload Meal Image"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={(event) =>
                          handleUploadMealImage(meal.slot, event.target.files?.[0])
                        }
                      />
                    </label>
                  )}

                  {isOpen && (
                    <ul className="meal-ingredients-list">
                      {meal.ingredients.map((ingredient) => (
                        <li key={ingredient}>{ingredient}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="actions-row meal-plan-actions" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={handleAddDayIngredients}>
            Add {selectedDay} Plan to Cart
          </button>
          <button className="btn btn-primary" onClick={handleAddPlanIngredients}>
            Add Full Week Ingredients to Cart
          </button>
        </div>
        {uploadMessage && <p className="helper-text">{uploadMessage}</p>}
      </section>
    </AppShell>
  );
}
