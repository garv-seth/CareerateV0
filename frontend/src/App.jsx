import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider, useIsAuthenticated } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';

import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import { msalConfig } from './config/authConfig';

const msalInstance = new PublicClientApplication(msalConfig);

const PrivateRoute = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  return isAuthenticated ? children : <Navigate to="/" />;
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