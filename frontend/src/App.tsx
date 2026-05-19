import { Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import {
  AuthPage,
  BookingConfirmationPage,
  CustomerDashboard,
  ExplorePage,
  HomePage,
  MemberSelectionPage,
  NotFoundPage,
  PackageDetailsPage,
  StaticPage
} from "./pages/Pages";

const providerAppUrl = (import.meta.env.VITE_PROVIDER_APP_URL ?? "http://localhost:5175").replace(/\/$/, "");

function ProviderPortalRedirect() {
  useEffect(() => {
    window.location.replace(`${providerAppUrl}/provider`);
  }, []);
  return null;
}

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
            <Route path="/booking/:packageId" element={<MemberSelectionPage />} />
            <Route path="/booking/confirmation/:ticketId" element={<BookingConfirmationPage />} />
          </Route>
          <Route path="/provider/*" element={<ProviderPortalRedirect />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
