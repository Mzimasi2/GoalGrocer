import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const redirectTo = location.state?.from || "/checkout";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to sign in.");
    }
  }

  return (
    <AppShell title="Sign In" subtitle="Sign in only when you are ready to checkout.">
      <section className="card form-card">
        <form onSubmit={handleSubmit} className="form-grid">
          <input
            className="field"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="error-text">{error}</p>}

          <button className="btn btn-primary" type="submit">
            Sign In
          </button>
        </form>

        <p>
          New customer?{" "}
          <Link to="/register" state={{ from: redirectTo }}>
            Create account
          </Link>
        </p>

        <p className="helper-text">
          Admin demo account: admin@goalgrocer.com / Admin@123
        </p>
      </section>
    </AppShell>
  );
}
