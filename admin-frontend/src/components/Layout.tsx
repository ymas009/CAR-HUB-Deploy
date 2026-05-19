import { Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

const navItems = [
  { href: "/admin", label: "Control Center" },
  { href: "/support", label: "Support Ops" }
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardPath =
    user?.role === "ADMIN" || user?.role === "SUB_ADMIN"
      ? "/admin"
      : "/support";

  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink to="/" className="brand" aria-label="CarHub home">
          <img className="brand-logo" src="/carhub-logo.png" alt="CarHub" />
        </NavLink>
        {user && (
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <NavLink key={item.href} to={item.href}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
        <div className="header-actions">
          <div className="trust-pill">
            <ShieldCheck size={16} />
            Admin control center
          </div>
          {user ? (
            <>
              <button className="ghost-button" onClick={() => navigate(dashboardPath)}>
                <UserRound size={17} />
                {user.role}
              </button>
              <button className="outline-button" onClick={logout}>
                Logout
              </button>
            </>
          ) : null}
          <button className="icon-button menu-button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      <div className={`mobile-nav-panel ${menuOpen ? "open" : ""}`}>
        <nav aria-label="Mobile navigation">
          {user && navItems.map((item) => (
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
