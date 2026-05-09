import { Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/packages", label: "Packages" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardPath =
    user?.role === "PROVIDER"
      ? "/provider"
      : "/customer/requests";

  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink to="/" className="brand" aria-label="CarHub home">
          <span className="brand-mark">C</span>
          <span className="brand-text">Car<span>Hub</span></span>
        </NavLink>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink key={item.href} to={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <div className="trust-pill">
            <ShieldCheck size={16} />
            Company controlled
          </div>
          {user ? (
            <>
              <button className="ghost-button" onClick={() => navigate(dashboardPath)}>
                <UserRound size={17} />
                My workspace
              </button>
              <button className="outline-button" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <button className="primary-button nav-signin-button" onClick={() => navigate("/login")}>
              Sign in
            </button>
          )}
          <button className="icon-button menu-button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      <div className={`mobile-nav-panel ${menuOpen ? "open" : ""}`}>
        <nav aria-label="Mobile navigation">
          {navItems.map((item) => (
            <NavLink key={item.href} to={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </NavLink>
          ))}
          {user && (
            <NavLink to={dashboardPath} onClick={() => setMenuOpen(false)}>
              My workspace
            </NavLink>
          )}
          {!user && (
            <>
              <NavLink to="/login" onClick={() => setMenuOpen(false)}>Login</NavLink>
              <NavLink to="/register" onClick={() => setMenuOpen(false)}>Register</NavLink>
            </>
          )}
        </nav>
      </div>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
