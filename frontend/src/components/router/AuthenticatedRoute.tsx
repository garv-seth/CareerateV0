import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { Loader2 } from 'lucide-react'; // Using lucide-react for a spinner

interface AuthenticatedRouteProps {
  children: React.ReactNode;
}

const AuthenticatedRoute: React.FC<AuthenticatedRouteProps> = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();
  const location = useLocation();

  // Show a loading spinner while MSAL is processing (e.g., checking session, redirecting)
  if (inProgress === InteractionStatus.Startup || inProgress === InteractionStatus.HandleRedirect) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading authentication status...</p>
      </div>
    );
  }

  if (!isAuthenticated && inProgress === InteractionStatus.None) {
    // User is not authenticated and MSAL is idle, redirect to login
    // Pass the current location to redirect back after successful login
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // User is authenticated or MSAL is in a state where children can be rendered (e.g. ssoSilent)
  return <>{children}</>;
};

export default AuthenticatedRoute; 