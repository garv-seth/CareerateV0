import { BrowserRouter as AppRouter, Routes, Route } from 'react-router-dom';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Tools from "@/pages/Tools";
import Profile from "@/pages/Profile";
import ResumeAnalysis from "@/pages/ResumeAnalysis";
import NotFound from "@/pages/not-found";
import Footer from "./components/Footer";

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Routes>
      {isLoading || !isAuthenticated ? (
        <Route path="/" element={<Landing />} />
      ) : (
        <>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/resume-analysis" element={<ResumeAnalysis />} />
        </>
      )}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="min-h-screen flex flex-col font-sfpro bg-background">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <AppRouter>
              <AppRoutes />
              <Toaster />
            </AppRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
      <Footer />
    </div>
  );
}

export default App;
