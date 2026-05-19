import { Menu, UserRound, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/packages", label: "Packages" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

const providerAppUrl = (import.meta.env.VITE_PROVIDER_APP_URL ?? "http://localhost:5175").replace(/\/$/, "");

function providerPortalPath(path: string) {
  return `${providerAppUrl}${path}`;
}

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authMenuOpen, setAuthMenuOpen] = useState(false);

  const dashboardPath =
    user?.role === "PROVIDER"
      ? "/provider"
      : "/customer";

  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink to="/" className="brand" aria-label="CarHub home">
          <img className="brand-logo" src="/carhub-logo.png" alt="CarHub" />
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
            <div className="auth-menu">
              <button
                className="primary-button nav-signin-button"
                onClick={() => setAuthMenuOpen((open) => !open)}
                aria-expanded={authMenuOpen}
                aria-haspopup="menu"
              >
                Sign in
              </button>
              {authMenuOpen && (
                <div className="auth-menu-panel" role="menu">
                  <button
                    type="button"
                    className="auth-menu-item"
                    onClick={() => {
                      setAuthMenuOpen(false);
                      navigate("/login", { state: { role: "CUSTOMER", formMode: "login" } });
                    }}
                  >
                    <strong>Customer</strong>
                  </button>
                  <button
                    type="button"
                    className="auth-menu-item"
                    onClick={() => {
                      setAuthMenuOpen(false);
                      window.location.assign(providerPortalPath("/login"));
                    }}
                  >
                    <strong>Provider</strong>
                  </button>
                </div>
              )}
            </div>
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
              <NavLink to="/login" onClick={() => setMenuOpen(false)}>Customer login</NavLink>
              <NavLink to="/register" onClick={() => setMenuOpen(false)}>Customer register</NavLink>
              <a href={providerPortalPath("/login")} onClick={() => setMenuOpen(false)}>Provider login</a>
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
