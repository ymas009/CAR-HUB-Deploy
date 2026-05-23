import { Menu, Moon, Sun, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

const navItems = [
  { href: "/contact", label: "Contact" }
];

const customerAppUrl = (import.meta.env.VITE_CUSTOMER_APP_URL ?? "http://localhost:5173").replace(/\/$/, "");

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("carhub-theme");
    return stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("carhub-theme", dark ? "dark" : "light");
  }, [dark]);

  return [dark, () => setDark((d) => !d)] as const;
}

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authMenuOpen, setAuthMenuOpen] = useState(false);
  const [dark, toggleTheme] = useDarkMode();
  const authMenuRef = useRef<HTMLDivElement>(null);

  const dashboardPath = "/provider";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (authMenuRef.current && !authMenuRef.current.contains(event.target as Node)) {
        setAuthMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          <button
            className="icon-button theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
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
            <div className="auth-menu" ref={authMenuRef}>
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
                      navigate("/login", { state: { role: "PROVIDER", formMode: "login" } });
                    }}
                  >
                    <strong>Provider</strong>
                  </button>
                  <button
                    type="button"
                    className="auth-menu-item"
                    onClick={() => {
                      setAuthMenuOpen(false);
                      window.location.assign(`${customerAppUrl}/login`);
                    }}
                  >
                    <strong>Customer</strong>
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
              <NavLink to="/login" state={{ role: "PROVIDER", formMode: "login" }} onClick={() => setMenuOpen(false)}>Provider login</NavLink>
              <NavLink to="/register" state={{ role: "PROVIDER", formMode: "register" }} onClick={() => setMenuOpen(false)}>Provider register</NavLink>
              <a href={`${customerAppUrl}/login`} onClick={() => setMenuOpen(false)}>Customer login</a>
              <a href={customerAppUrl} onClick={() => setMenuOpen(false)}>Customer site</a>
            </>
          )}
          <button className="theme-toggle-mobile" onClick={toggleTheme}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? "Light mode" : "Dark mode"}
          </button>
        </nav>
      </div>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
