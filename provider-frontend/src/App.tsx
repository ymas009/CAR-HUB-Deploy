import { Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import {
  AuthPage,
  NotFoundPage,
  ProviderDashboard,
  StaticPage
} from "./pages/Pages";

const providerLoginState = { role: "PROVIDER" as const, formMode: "login" as const };
const providerRegisterState = { role: "PROVIDER" as const, formMode: "register" as const };

export function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/login" replace state={providerLoginState} />} />
          <Route path="/contact" element={<StaticPage slug="contact" fallbackTitle="Contact Us" />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/provider-login" element={<Navigate to="/login" replace state={providerLoginState} />} />
          <Route path="/provider-register" element={<Navigate to="/register" replace state={providerRegisterState} />} />
          <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
          <Route element={<ProtectedRoute roles={["PROVIDER"]} />}>
            <Route path="/provider/*" element={<ProviderDashboard />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
