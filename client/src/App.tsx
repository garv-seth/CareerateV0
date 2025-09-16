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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Payment route accessible to all users */}
      <Route path="/payment" component={PaymentPage} />
      
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
