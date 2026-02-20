import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, savePreferences } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [savedGoal, setSavedGoal] = useState(user?.savedGoal || "");
  const [savedBudget, setSavedBudget] = useState(user?.savedBudget || "");

  function handleSave(event) {
    event.preventDefault();
    savePreferences({ fullName, savedGoal, savedBudget });
  }

  return (
    <AppShell title="Profile" subtitle="Manage your goal and budget preferences.">
      <section className="card form-card">
        <form onSubmit={handleSave} className="form-grid">
          <input
            className="field"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
          />

          <select
            className="field"
            value={savedGoal}
            onChange={(e) => setSavedGoal(e.target.value)}
          >
            <option value="">Preferred goal: Not set</option>
            <option value="Weight Loss">Weight Loss</option>
            <option value="Maintenance">Maintenance</option>
          </select>

          <input
            className="field"
            type="number"
            value={savedBudget}
            onChange={(e) => setSavedBudget(e.target.value)}
            placeholder="Weekly budget"
          />

          <button className="btn btn-primary" type="submit">
            Save profile
          </button>
        </form>

        <div className="actions-row">
          <Link className="btn btn-ghost" to="/wishlist">
            Open wishlist
          </Link>
          <Link className="btn btn-ghost" to="/orders">
            Open order history
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
