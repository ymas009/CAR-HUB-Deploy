import { Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import {
  AuthPage,
  CustomerDashboard,
  ExplorePage,
  HomePage,
  NotFoundPage,
  PackageDetailsPage,
  ProviderDashboard,
  RequestWizardPage,
  StaticPage
} from "./pages/Pages";

export function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/packages" element={<ExplorePage />} />
          <Route path="/packages/:id" element={<PackageDetailsPage />} />
          <Route path="/about" element={<StaticPage slug="about" fallbackTitle="About CarHub" />} />
          <Route path="/contact" element={<StaticPage slug="contact" fallbackTitle="Contact Us" />} />
          <Route path="/privacy" element={<StaticPage slug="privacy" fallbackTitle="Privacy Policy" />} />
          <Route path="/terms" element={<StaticPage slug="terms" fallbackTitle="Terms and Conditions" />} />
          <Route path="/cancellation-refund" element={<StaticPage slug="cancellation-refund" fallbackTitle="Cancellation and Refund Policy" />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
          <Route element={<ProtectedRoute roles={["CUSTOMER"]} />}>
            <Route path="/customer/*" element={<CustomerDashboard />} />
            <Route path="/request/:packageId" element={<RequestWizardPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={["PROVIDER"]} />}>
            <Route path="/provider/*" element={<ProviderDashboard />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
