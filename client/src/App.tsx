import React, { useEffect } from 'react';
import { BrowserRouter as AppRouter, Routes, Route } from 'react-router-dom';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUserStore } from "@/state/userStore"; // Assuming userStore is set up
import { authHelpers, activityHelpers } from '@/state/userStore'; // Assuming these are exported

import LandingPage from "@/pages/LandingPage";
import DashboardPage from "@/pages/DashboardPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFoundPage from "@/pages/NotFoundPage";
// Basic MSAL setup will go here or in a dedicated auth file
// For now, assume a simple layout without enforced auth for all routes

// A simple layout component (can be expanded)
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Add Navbar, Sidebar here if needed for authenticated routes
  return <main>{children}</main>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
      <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// Component to send userId to extension
const ExtensionUserIdSender: React.FC = () => {
  const { user, isAuthenticated } = useUserStore(state => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated
  }));

  React.useEffect(() => {
    if (isAuthenticated && user && user.id) {
      // Check if in an environment where the extension's content script might be running
      if (window.postMessage) {
        console.log('Careerate WebApp: Sending user ID to content script:', user.id);
        // IMPORTANT: For security, in production, you might want to target the specific origin 
        // of your extension if known, instead of '*', though for localhost '/' (same origin) or '*' is common.
        // However, sending to '/' might not work if extension context is different.
        // Using '*' is simpler for now but be mindful of security implications if other extensions listen.
        window.postMessage({ type: 'CAREERATE_SET_USER_ID', userId: user.id }, '*');
      }
    }
  }, [isAuthenticated, user]);

  return null; // This component does not render anything
};

function App() {
  const { user, isAuthenticated, isLoading, initializeSession } = useUserStore(
    (state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      initializeSession: authHelpers.initializeSession, // Get from helpers
    })
  );

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // Effect to fetch activity stats if user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && user.id) {
      activityHelpers.syncActivityStats(user.id);
      activityHelpers.checkExtensionConnection();
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col font-sfpro bg-background text-foreground">
        <QueryClientProvider client={queryClient}>
          {/* MSAL Provider will wrap this once configured */}
          <TooltipProvider>
            <AppRouter>
              <ExtensionUserIdSender />
              <AppRoutes />
              <Toaster />
            </AppRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sfpro bg-background text-foreground">
      <QueryClientProvider client={queryClient}>
        {/* MSAL Provider will wrap this once configured */}
        <TooltipProvider>
          <AppRouter>
            <ExtensionUserIdSender />
            <AppRoutes />
            <Toaster />
          </AppRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
