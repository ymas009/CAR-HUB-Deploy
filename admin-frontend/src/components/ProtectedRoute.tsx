import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { Role } from "../types";
import { useAuth } from "../state/AuthContext";

export function ProtectedRoute({ roles }: { roles: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-loader">Checking secure CarHub access...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ returnTo: location.pathname }} />;
  }

  if (!roles.includes(user.role)) {
    return (
      <div className="page padded-page">
        <section className="static-panel">
          <span className="eyebrow">Access controlled</span>
          <h1>This workspace is not available for your role.</h1>
          <p>CarHub separates customer, admin, provider, and support data so each role sees only the right information.</p>
          <Link className="primary-button" to="/">
            Return home
          </Link>
        </section>
      </div>
    );
  }

  return <Outlet />;
}
