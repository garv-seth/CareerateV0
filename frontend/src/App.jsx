import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider, useIsAuthenticated, useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { PublicClientApplication } from '@azure/msal-browser';

import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import { msalConfig } from './config/authConfig';
import { loginRequest } from "./config/authConfig";

const msalInstance = new PublicClientApplication(msalConfig);

const PrivateRoute = ({ children }) => {
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
        <div className="bg-gray-900 min-h-screen">
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
          </Routes>
        </div>
      </Router>
    </MsalProvider>
  );
}

export default App; 