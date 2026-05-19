import { Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import {
  AdminDashboard,
  AuthPage,
  ChangeAdminIdPage,
  ChangePasswordPage,
  NotFoundPage,
  SupportDashboard
} from "./pages/Pages";

export function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/admin" replace />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
          <Route path="/change-email" element={<ChangeAdminIdPage />} />
          <Route element={<ProtectedRoute roles={["ADMIN", "SUB_ADMIN"]} />}>
            <Route path="/admin/change-id" element={<ChangeAdminIdPage />} />
            <Route path="/admin/change-password" element={<ChangePasswordPage />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>
          <Route element={<ProtectedRoute roles={["SUPPORT", "ADMIN", "SUB_ADMIN"]} />}>
            <Route path="/support/*" element={<SupportDashboard />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
