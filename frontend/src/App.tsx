import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUserStore } from "@/state/userStore"; // Assuming userStore is set up
import { authHelpers, activityHelpers } from '@/state/userStore'; // Assuming these are exported
import { useIsAuthenticated } from "@azure/msal-react"; // To potentially redirect from root if authenticated

// Layouts & Common Components
import MainLayout from "./components/layout/MainLayout";
import AuthenticatedRoute from "./components/router/AuthenticatedRoute"; // Import AuthenticatedRoute

// Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage"; // Import SettingsPage
import NotFoundPage from "./pages/NotFoundPage";

// Example: Placeholder for a future admin page
// import AdminPage from "./pages/AdminPage"; 

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

  const isAuthenticatedFromMSAL = useIsAuthenticated();

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
            <Router>
              <ExtensionUserIdSender />
              <Routes>
                {/* Public Routes with MainLayout (Navbar & Footer) */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<LandingPage />} />
                  {/* AuthPage might eventually have its own minimal layout or no layout */}
                  {/* For now, keeping it outside MainLayout if it shouldn't have Navbar/Footer */}
                  {/* Or include it if it should have them. Current AuthPage is full screen. */}
                </Route>

                {/* AuthPage - typically doesn't use MainLayout if it's a full-screen focused page */}
                <Route path="/auth/login" element={<AuthPage />} />

                {/* Authenticated Routes with MainLayout */}
                <Route 
                  path="/dashboard" 
                  element={
                    <AuthenticatedRoute>
                      <MainLayout>
                        <DashboardPage />
                      </MainLayout>
                    </AuthenticatedRoute>
                  }
                />
                <Route 
                  path="/settings" 
                  element={
                    <AuthenticatedRoute>
                      <MainLayout>
                        <SettingsPage />
                      </MainLayout>
                    </AuthenticatedRoute>
                  }
                />
                
                {/* Example: Authenticated Admin Route (requires additional role check typically) */}
                {/* 
                <Route 
                  path="/admin" 
                  element={
                    <AuthenticatedRoute>
                      <AdminLayout> // Or MainLayout if admin uses the same
                        <AdminPage />
                      </AdminLayout>
                    </AuthenticatedRoute>
                  }
                /> 
                */}

                {/* Catch-all 404 Not Found Page - within MainLayout */}
                <Route 
                  path="*" 
                  element={
                    <MainLayout>
                      <NotFoundPage />
                    </MainLayout>
                  }
                />
              </Routes>
              <Toaster />
            </Router>
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
          <Router>
            <ExtensionUserIdSender />
            <Routes>
              {/* Public Routes with MainLayout (Navbar & Footer) */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<LandingPage />} />
                {/* AuthPage might eventually have its own minimal layout or no layout */}
                {/* For now, keeping it outside MainLayout if it shouldn't have Navbar/Footer */}
                {/* Or include it if it should have them. Current AuthPage is full screen. */}
              </Route>

              {/* AuthPage - typically doesn't use MainLayout if it's a full-screen focused page */}
              <Route path="/auth/login" element={<AuthPage />} />

              {/* Authenticated Routes with MainLayout */}
              <Route 
                path="/dashboard" 
                element={
                  <AuthenticatedRoute>
                    <MainLayout>
                      <DashboardPage />
                    </MainLayout>
                  </AuthenticatedRoute>
                }
              />
              <Route 
                path="/settings" 
                element={
                  <AuthenticatedRoute>
                    <MainLayout>
                      <SettingsPage />
                    </MainLayout>
                  </AuthenticatedRoute>
                }
              />
              
              {/* Example: Authenticated Admin Route (requires additional role check typically) */}
              {/* 
              <Route 
                path="/admin" 
                element={
                  <AuthenticatedRoute>
                    <AdminLayout> // Or MainLayout if admin uses the same
                      <AdminPage />
                    </AdminLayout>
                  </AuthenticatedRoute>
                }
              /> 
              */}

              {/* Catch-all 404 Not Found Page - within MainLayout */}
              <Route 
                path="*" 
                element={
                  <MainLayout>
                    <NotFoundPage />
                  </MainLayout>
                }
              />
            </Routes>
            <Toaster />
          </Router>
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
