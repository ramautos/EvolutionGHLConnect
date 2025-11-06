import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/contexts/UserContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/AdminLayout";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import SubaccountDetails from "@/pages/SubaccountDetails";
import AdminPanel from "@/pages/AdminPanel";
import AdminDashboard from "@/pages/AdminDashboard";
import CompaniesManagement from "@/pages/CompaniesManagement";
import AdminWebhook from "@/pages/AdminWebhook";
import AdminAPI from "@/pages/AdminAPI";
import AdminSettings from "@/pages/AdminSettings";
import Billing from "@/pages/Billing";
import BillingSuccess from "@/pages/BillingSuccess";
import Invoices from "@/pages/Invoices";
import Onboarding from "@/pages/Onboarding";
import DashboardGHL from "@/pages/DashboardGHL";
import LocationsDashboard from "@/pages/LocationsDashboard";
import AuthSuccess from "@/pages/AuthSuccess";
import ClaimSubaccount from "@/pages/ClaimSubaccount";
import GhlIframe from "@/pages/GhlIframe";
import InstallSubaccount from "@/pages/InstallSubaccount";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/claim-subaccount">
        <ProtectedRoute>
          <ClaimSubaccount />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/subaccount/:id">
        <ProtectedRoute>
          <SubaccountDetails />
        </ProtectedRoute>
      </Route>
      
      {/* Admin Routes with Layout */}
      <Route path="/admin/dashboard">
        <ProtectedRoute requireAdmin={true}>
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/companies">
        <ProtectedRoute requireAdmin={true}>
          <AdminLayout>
            <CompaniesManagement />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute requireAdmin={true}>
          <AdminLayout>
            <AdminPanel />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/subaccounts">
        <ProtectedRoute requireAdmin={true}>
          <AdminLayout>
            <AdminPanel />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/billing">
        <ProtectedRoute requireAdmin={true}>
          <AdminLayout>
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
                <p className="text-muted-foreground">Gestión de facturación y pagos con Stripe</p>
              </div>
              <div className="text-muted-foreground">En desarrollo...</div>
            </div>
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/reports">
        <ProtectedRoute requireAdmin={true}>
          <AdminLayout>
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
                <p className="text-muted-foreground">Análisis y reportes del sistema</p>
              </div>
              <div className="text-muted-foreground">En desarrollo...</div>
            </div>
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/webhook">
        <ProtectedRoute requireAdmin={true}>
          <AdminLayout>
            <AdminWebhook />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/api">
        <ProtectedRoute requireAdmin={true}>
          <AdminLayout>
            <AdminAPI />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute requireAdmin={true}>
          <AdminLayout>
            <AdminSettings />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      
      {/* Legacy Admin Route - Redirect to Dashboard */}
      <Route path="/admin">
        <ProtectedRoute requireAdmin={true}>
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/billing">
        <ProtectedRoute>
          <Billing />
        </ProtectedRoute>
      </Route>
      <Route path="/billing/success">
        <ProtectedRoute>
          <BillingSuccess />
        </ProtectedRoute>
      </Route>
      <Route path="/invoices">
        <ProtectedRoute>
          <Invoices />
        </ProtectedRoute>
      </Route>
      <Route path="/locations">
        <ProtectedRoute>
          <LocationsDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/auth/success">
        <ProtectedRoute>
          <AuthSuccess />
        </ProtectedRoute>
      </Route>
      <Route path="/old-dashboard" component={DashboardGHL} />

      {/* GHL Iframe - SSO Authentication (no requiere ProtectedRoute, usa SSO) */}
      <Route path="/ghl-iframe" component={GhlIframe} />

      {/* Install Subaccount - Public route for sold subaccounts */}
      <Route path="/install/:token" component={InstallSubaccount} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
