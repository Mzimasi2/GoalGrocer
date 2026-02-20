import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const redirectTo = location.state?.from || "/checkout";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await register({ fullName, email, password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed.");
    }
  }

  return (
    <AppShell title="Create Account" subtitle="Create your customer profile.">
      <section className="card form-card">
        <form onSubmit={handleSubmit} className="form-grid">
          <input
            className="field"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
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
            minLength={6}
          />

          {error && <p className="error-text">{error}</p>}

          <button className="btn btn-primary" type="submit">
            Register
          </button>
        </form>

        <p>
          Already have an account?{" "}
          <Link to="/login" state={{ from: redirectTo }}>
            Sign in
          </Link>
        </p>
      </section>
    </AppShell>
  );
}
