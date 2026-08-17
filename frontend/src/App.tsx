import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { WorkspaceLayout } from "./components/WorkspaceLayout";
import { HomeRedirect } from "./components/HomeRedirect";
import { DashboardPage } from "./pages/DashboardPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { DocumentDetailPage } from "./pages/DocumentDetailPage";
import { UsersPage } from "./pages/UsersPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { ActionPlanPage } from "./pages/ActionPlanPage";
import { SearchPage } from "./pages/SearchPage";
import { AuthPage } from './pages/AuthPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { PlatformTenantDetailPage } from './pages/PlatformTenantDetailPage';
import { IncidentsPage } from "./pages/IncidentsPage";
import { LandingPage } from "./pages/LandingPage";
import { PublicDataSubjectRequestPage } from "./pages/PublicDataSubjectRequestPage";
import { DataSubjectRequestsPage } from "./pages/DataSubjectRequestsPage";
import { EmailConfirmationPage } from "./pages/EmailConfirmationPage";
import { AccountActivationPage } from "./pages/AccountActivationPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/signup" element={<AuthPage initialMode="signup" />} />
          <Route path="/solicitacao/:documentId" element={<PublicDataSubjectRequestPage />} />
          <Route path="/confirmar-email/:token" element={<EmailConfirmationPage />} />
          <Route path="/ativar-conta/:token" element={<AccountActivationPage />} />
          <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
          <Route path="/redefinir-senha/:token" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route
                path="/documents/:documentId"
                element={<DocumentDetailPage />}
              />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/platform" element={<SuperAdminPage />} />
              <Route path="/platform/:tenantId" element={<PlatformTenantDetailPage />} />

              <Route
                path="/workspaces/:workspaceId"
                element={<WorkspaceLayout />}
              >
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="action-plan" element={<ActionPlanPage />} />
                <Route path="incidents" element={<IncidentsPage />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="incidents" element={<IncidentsPage />} />
                <Route path="data-subject-requests" element={<DataSubjectRequestsPage />} />
                <Route path="search" element={<SearchPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;