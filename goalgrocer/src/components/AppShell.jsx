import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function activeStyle({ isActive }) {
  return isActive ? "nav-link nav-link-active" : "nav-link";
}

export default function AppShell({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div>
      <header className="topbar">
        <Link to="/" className="brand">
          GoalGrocer
        </Link>

        <nav className="topnav">
          <NavLink to="/" className={activeStyle}>
            Home
          </NavLink>
          <NavLink to="/store" className={activeStyle}>
            Store
          </NavLink>
          <NavLink to="/cart" className={activeStyle}>
            Cart ({cartCount})
          </NavLink>

          {user?.role === "customer" && (
            <>
              <NavLink to="/wishlist" className={activeStyle}>
                Wishlist
              </NavLink>
              <NavLink to="/orders" className={activeStyle}>
                Orders
              </NavLink>
              <NavLink to="/profile" className={activeStyle}>
                Profile
              </NavLink>
            </>
          )}

          {user?.role === "admin" && (
            <>
              <NavLink to="/admin" className={activeStyle}>
                Admin
              </NavLink>
              <NavLink to="/admin/products" className={activeStyle}>
                Products
              </NavLink>
              <NavLink to="/admin/orders" className={activeStyle}>
                Orders
              </NavLink>
              <NavLink to="/admin/reports" className={activeStyle}>
                Reports
              </NavLink>
            </>
          )}
        </nav>

        <div className="auth-actions">
          {!user && (
            <>
              <Link to="/login" className="btn btn-ghost">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </>
          )}

          {user && (
            <>
              <span className="role-chip">{user.role}</span>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      <main className="page-wrap">
        {(title || subtitle) && (
          <section className="page-heading">
            {title && <h1>{title}</h1>}
            {subtitle && <p>{subtitle}</p>}
          </section>
        )}
        {children}
      </main>
    </div>
  );
}
