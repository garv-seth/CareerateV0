import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, useIsAuthenticated } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';

import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import { msalConfig } from './config/authConfig'; // Assuming you have this config file

const msalInstance = new PublicClientApplication(msalConfig);

// A wrapper for protected routes
const PrivateRoute = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <Router>
        <div className="bg-gray-900 min-h-screen">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/callback" element={<CallbackPage />} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </MsalProvider>
  );
}

export default App; 