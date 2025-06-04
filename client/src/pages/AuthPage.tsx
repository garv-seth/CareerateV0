import React from 'react';
import usePageTitle from '@/hooks/usePageTitle';
import { Button } from "@/components/ui/button";
import { LogIn } from 'lucide-react';

const AuthPage: React.FC = () => {
  usePageTitle('Sign In - Careerate');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/10 p-4 font-sfpro">
      <div className="w-full max-w-sm text-center bg-card p-8 rounded-xl shadow-2xl backdrop-blur-lg border border-border/20">
        <img src="/CareerateICON.png" alt="Careerate Logo" className="w-20 h-20 mx-auto mb-6 rounded-full shadow-lg" />
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-3">
          Welcome Back
        </h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Sign in to access your personalized career dashboard.
        </p>
        
        {/* Placeholder for Azure AD B2C integration */}
        <Button 
          className="w-full py-3 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-lg shadow-primary/30 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
          onClick={() => alert('Azure AD B2C Login to be implemented here.')}
        >
          <LogIn size={18} />
          <span>Sign In with Microsoft</span>
        </Button>

        <div className="my-6 text-xs text-muted-foreground">
          Authentication will be handled by Azure AD B2C.
        </div>
        
        <p className="mt-8 text-xs">
          <a href="/" className="text-primary/80 hover:text-primary hover:underline">
            Back to Homepage
          </a>
        </p>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Careerate. All rights reserved.
      </p>
    </div>
  );
};

export default AuthPage; 