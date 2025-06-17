import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { MsalProvider, useIsAuthenticated, useMsal } from '@azure/msal-react';
import { InteractionStatus, PublicClientApplication } from "@azure/msal-browser";
import React from 'react';

import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import { msalConfig, loginRequest } from './authConfig';

const msalInstance = new PublicClientApplication(msalConfig);

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  React.useEffect(() => {
    if (!isAuthenticated && inProgress === InteractionStatus.None) {
      instance.loginRedirect(loginRequest);
    }
  }, [isAuthenticated, inProgress, instance]);

  if (isAuthenticated) {
    return children;
  }

  return <div>Loading...</div>; // Or a loading spinner
};

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <Router>
        <div>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </div>
      </Router>
    </MsalProvider>
  );
}

export default App;
