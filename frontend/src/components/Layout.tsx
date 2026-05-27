import { Headphones, Mail, MapPin, Menu, Moon, Phone, Sun, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authMenuOpen, setAuthMenuOpen] = useState(false);
  const [dark, toggleTheme] = useDarkMode();

  const dashboardPath =
    user?.role === "PROVIDER"
      ? "/provider"
      : "/customer";

  const footerVisible = !/^\/(login|register|forgot-password|customer|booking|provider)(\/|$)?/.test(location.pathname);

  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink to="/" className="ch-nav-brand" aria-label="CarHub home">
          <span className="ch-brand-car">Car</span><span className="ch-brand-hub">Hub</span>
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
            className="ch-nav-icon-btn"
            onClick={toggleTheme}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {user ? (
            <>
              <button className="ch-nav-ghost-btn" onClick={() => navigate(dashboardPath)}>
                <UserRound size={16} />
                My Bookings
              </button>
              <button className="ch-nav-outline-btn" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <div className="auth-menu">
              <button
                className="ch-nav-cta-btn"
                onClick={() => setAuthMenuOpen((open) => !open)}
                aria-expanded={authMenuOpen}
                aria-haspopup="menu"
              >
                Sign In
              </button>
              {authMenuOpen && (
                <div className="auth-menu-panel ch-auth-panel" role="menu">
                  <button
                    type="button"
                    className="ch-auth-item"
                    onClick={() => {
                      setAuthMenuOpen(false);
                      navigate("/login", { state: { role: "CUSTOMER", formMode: "login" } });
                    }}
                  >
                    <UserRound size={15} />
                    <strong>Customer</strong>
                  </button>
                  <button
                    type="button"
                    className="ch-auth-item"
                    onClick={() => {
                      setAuthMenuOpen(false);
                      window.location.assign(providerPortalPath("/login"));
                    }}
                  >
                    <UserRound size={15} />
                    <strong>Provider</strong>
                  </button>
                </div>
              )}
            </div>
          )}
          <button className="ch-nav-icon-btn menu-button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
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
          <button className="theme-toggle-mobile" onClick={toggleTheme}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? "Light mode" : "Dark mode"}
          </button>
        </nav>
      </div>
      <main>
        <Outlet />
      </main>
      {footerVisible && <CustomerFooter />}
    </div>
  );
}

function CustomerFooter() {
  return (
    <footer className="customer-site-footer">
      <div className="customer-site-footer-inner">
        <section className="customer-footer-brand">
          <img className="customer-footer-logo" src="/carhub-logo.png" alt="CarHub" />
          <p>
            Curated road trips from Pune with clear booking support.
          </p>
          <div className="customer-footer-contact-list">
            <span><Mail size={15} /> support@carhub.travel</span>
            <span><Phone size={15} /> +91 20 4000 2400</span>
            <span><MapPin size={15} /> Pune, Maharashtra</span>
          </div>
        </section>
        <nav className="customer-footer-column" aria-label="Quick links">
          <strong>Explore</strong>
          <NavLink to="/packages">All packages</NavLink>
          <NavLink to="/about">About CarHub</NavLink>
          <NavLink to="/contact">Contact us</NavLink>
        </nav>
        <nav className="customer-footer-column" aria-label="Support">
          <strong>Support</strong>
          <NavLink to="/privacy">Privacy policy</NavLink>
          <NavLink to="/terms">Terms</NavLink>
          <NavLink to="/cancellation-refund">Cancellation & refund</NavLink>
        </nav>
        <section className="customer-footer-column customer-footer-support">
          <strong>Help</strong>
          <p>Route, booking, and trip assistance.</p>
          <span><Headphones size={15} /> 8 AM - 10 PM</span>
        </section>
      </div>
      <div className="customer-site-footer-base">
        <span>CarHub journeys</span>
        <span>Secure booking</span>
      </div>
    </footer>
  );
}
