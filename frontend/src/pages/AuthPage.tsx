import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "../authConfig"; // Import loginRequest
import { Button } from "@/components/ui/button";
import { LogIn, ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import usePageTitle from '@/hooks/usePageTitle';

const AuthPage: React.FC = () => {
  usePageTitle("Sign In - Careerate");
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSignIn = () => {
    // Initiate login redirect
    instance.loginRedirect(loginRequest).catch(e => {
      console.error("MSAL loginRedirect error:", e);
      // Potentially handle specific errors, e.g., if the user closes the popup
      // or if there's a configuration issue not caught by the main event callback.
    });
  };

  // Do not render the login form if already authenticated (will redirect via useEffect)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
        <ShieldCheck className="w-16 h-16 text-success mb-4" />
        <h1 className="text-2xl font-semibold text-foreground">Already signed in.</h1>
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "circOut" }}
        className="w-full max-w-md bg-card p-8 sm:p-10 rounded-xl shadow-2xl border border-border"
      >
        <div className="flex flex-col items-center mb-8">
          <img src="/CareerateICON.png" alt="Careerate Logo" className="w-16 h-16 mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Sign In to Careerate</h1>
          <p className="text-muted-foreground mt-1.5 text-center">
            Unlock your AI-powered career acceleration.
          </p>
        </div>

        <Button 
          size="lg"
          className="w-full py-3.5 text-base font-semibold bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg shadow-md shadow-primary/30 transition-all duration-300 transform hover:scale-102 flex items-center justify-center"
          onClick={handleSignIn}
        >
          <LogIn size={20} className="mr-2.5" /> Sign In with Microsoft
        </Button>

        <div className="mt-8 text-center">
          <Link 
            to="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <ArrowLeft size={14} className="inline mr-1.5 align-middle" />
            Back to Homepage
          </Link>
        </div>
      </motion.div>
      
      <p className="text-xs text-muted-foreground mt-10 text-center">
        &copy; {new Date().getFullYear()} Careerate. Secure and AI-Powered.
      </p>
    </div>
  );
};

export default AuthPage; 