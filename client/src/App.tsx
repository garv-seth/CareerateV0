import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Editor from "@/pages/editor";
import DevOpsDashboard from "@/pages/devops-dashboard";
import MonitoringDashboard from "@/pages/monitoring-dashboard";
import IntegrationsPage from "@/pages/integrations";
import IntegrationsSetup from "@/pages/integrations-setup";
import BillingDashboard from "@/pages/BillingDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import PaymentPage from "@/pages/payment";
import LegacyAnalysis from "@/pages/legacy-analysis";
import MigrationPlanning from "@/pages/migration-planning";
import ModernizationWorkflows from "@/pages/modernization-workflows";
import MigrationExecution from "@/pages/migration-execution";
import MigrationRecommendations from "@/pages/migration-recommendations";
import EnterpriseMigration from "@/pages/enterprise-migration";
import EnterpriseDashboard from "@/pages/enterprise-dashboard";
import AccountSettings from "@/pages/account-settings";
import VibeCoding from "@/pages/vibe-coding";
import Deploy from "@/pages/vibe-hosting";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import { CookieConsent } from "@/components/CookieConsent";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state to prevent flash
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Routes accessible to all users */}
      <Route path="/payment" component={PaymentPage} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />

      {/* Authenticated routes */}
      {isAuthenticated ? (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/editor/:projectId" component={Editor} />
          <Route path="/devops/:projectId" component={DevOpsDashboard} />
          <Route path="/monitoring/:projectId" component={MonitoringDashboard} />
          <Route path="/integrations" component={IntegrationsPage} />
          <Route path="/integrations/setup" component={IntegrationsSetup} />
          <Route path="/billing" component={BillingDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/enterprise" component={EnterpriseDashboard} />
          <Route path="/account" component={AccountSettings} />
          {/* Vibe Coding and Hosting Routes */}
          <Route path="/projects/:id/coding" component={VibeCoding} />
          <Route path="/projects/:id/hosting" component={Deploy} />
          {/* Enterprise Migration - Unified Dashboard */}
          <Route path="/migration" component={EnterpriseMigration} />
          <Route path="/enterprise-migration" component={EnterpriseMigration} />
          <Route path="/projects/:id/migration" component={EnterpriseMigration} />
          {/* Legacy migration routes redirect to unified dashboard */}
          <Route path="/migration/analysis" component={EnterpriseMigration} />
          <Route path="/migration/new-assessment" component={EnterpriseMigration} />
          <Route path="/migration/planning" component={EnterpriseMigration} />
          <Route path="/migration/modernization" component={EnterpriseMigration} />
          <Route path="/migration/execution" component={EnterpriseMigration} />
          <Route path="/migration/execution/:projectId" component={EnterpriseMigration} />
          <Route path="/migration/recommendations" component={EnterpriseMigration} />
          <Route path="/migration/project/:projectId" component={EnterpriseMigration} />
          <Route path="/migration/reports" component={EnterpriseMigration} />
          <Route component={NotFound} />
        </>
      ) : (
        <>
          <Route path="/" component={Landing} />
          <Route component={Landing} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <CookieConsent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
