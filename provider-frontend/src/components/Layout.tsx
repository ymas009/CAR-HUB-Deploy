import { Menu, UserRound, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

const navItems = [
  { href: "/provider", label: "Workspace" },
  { href: "/contact", label: "Contact" }
];

const customerAppUrl = (import.meta.env.VITE_CUSTOMER_APP_URL ?? "http://localhost:5173").replace(/\/$/, "");

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardPath = "/provider";

  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink to="/provider" className="brand" aria-label="CarHub provider workspace">
          <img className="brand-logo" src="/carhub-logo.png" alt="CarHub" />
          <span className="provider-header-title">Provider workspace</span>
        </NavLink>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink key={item.href} to={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
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
            <>
              <button
                className="primary-button nav-signin-button"
                onClick={() => navigate("/login", { state: { role: "PROVIDER", formMode: "login" } })}
              >
                Sign in
              </button>
              <button
                className="outline-button"
                onClick={() => navigate("/register", { state: { role: "PROVIDER", formMode: "register" } })}
              >
                Register
              </button>
            </>
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
              <NavLink to="/login" onClick={() => setMenuOpen(false)}>Provider login</NavLink>
              <NavLink to="/register" onClick={() => setMenuOpen(false)}>Provider register</NavLink>
              <a href={customerAppUrl} onClick={() => setMenuOpen(false)}>Customer site</a>
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
