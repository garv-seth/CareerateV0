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
import IntegrationsPage from "@/pages/IntegrationsPage";
import BillingDashboard from "@/pages/BillingDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import PaymentPage from "@/pages/payment";
import MigrationDashboard from "@/pages/migration-dashboard";
import LegacyAnalysis from "@/pages/legacy-analysis";
import MigrationPlanning from "@/pages/migration-planning";
import ModernizationWorkflows from "@/pages/modernization-workflows";
import MigrationExecution from "@/pages/migration-execution";
import MigrationRecommendations from "@/pages/migration-recommendations";
import EnterpriseMigration from "@/pages/enterprise-migration";
import VibeCoding from "@/pages/vibe-coding";
import VibeHosting from "@/pages/vibe-hosting";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import { CookieConsent } from "@/components/CookieConsent";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Routes accessible to all users */}
      <Route path="/payment" component={PaymentPage} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/editor/:projectId" component={Editor} />
          <Route path="/devops/:projectId" component={DevOpsDashboard} />
          <Route path="/monitoring/:projectId" component={MonitoringDashboard} />
          <Route path="/integrations" component={IntegrationsPage} />
          <Route path="/billing" component={BillingDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          {/* Vibe Coding and Hosting Routes */}
          <Route path="/projects/:id/coding" component={VibeCoding} />
          <Route path="/projects/:id/hosting" component={VibeHosting} />
          {/* Migration Tools Routes */}
          <Route path="/migration" component={MigrationDashboard} />
          <Route path="/enterprise-migration" component={EnterpriseMigration} />
          <Route path="/projects/:id/migration" component={EnterpriseMigration} />
          <Route path="/migration/analysis" component={LegacyAnalysis} />
          <Route path="/migration/new-assessment" component={LegacyAnalysis} />
          <Route path="/migration/planning" component={MigrationPlanning} />
          <Route path="/migration/modernization" component={ModernizationWorkflows} />
          <Route path="/migration/execution" component={MigrationExecution} />
          <Route path="/migration/execution/:projectId" component={MigrationExecution} />
          <Route path="/migration/recommendations" component={MigrationRecommendations} />
          <Route path="/migration/project/:projectId" component={MigrationPlanning} />
          <Route path="/migration/reports" component={MigrationRecommendations} />
        </>
      )}
      <Route component={NotFound} />
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
