import React from 'react';
import usePageTitle from '@/hooks/usePageTitle';
import { Button } from "@/components/ui/button";
import { LogIn } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const AuthPage: React.FC = () => {
  usePageTitle('Sign In - Careerate');
  const navigate = useNavigate();

  const handleSignIn = () => {
    // For now, just a placeholder action. Azure AD B2C integration is a larger task.
    alert("Sign-in process will be implemented here. Redirecting to dashboard for now (simulated).");
    // Simulate navigation to dashboard after a delay
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "circOut" }}
        className="w-full max-w-md bg-card p-8 rounded-xl shadow-2xl border border-border"
      >
        <div className="flex flex-col items-center mb-8">
          <img src="/CareerateICON.png" alt="Careerate Logo" className="w-16 h-16 mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground mt-1 text-center">
            Sign in to access your personalized career dashboard.
          </p>
        </div>

        <Button 
          size="lg"
          className="w-full py-3 text-base font-semibold bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg shadow-md shadow-primary/30 transition-all duration-300 transform hover:scale-102"
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
      
      {/* Footer hint, can be expanded or removed */}
      <p className="text-xs text-muted-foreground mt-10 text-center">
        &copy; {new Date().getFullYear()} Careerate. Secure and AI-Powered.
      </p>
    </div>
  );
};

export default AuthPage; 