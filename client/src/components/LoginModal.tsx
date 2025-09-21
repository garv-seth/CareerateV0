import { useState } from "react";
import { X, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (provider: 'microsoft' | 'github') => {
    setIsLoading(true);

    if (provider === 'microsoft') {
      // Check if Microsoft auth is available
      try {
        const response = await fetch('/api/login', { method: 'HEAD', redirect: 'manual' });
        if (response.status === 500) {
          alert('Microsoft authentication is temporarily unavailable. Please use GitHub to sign in.');
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Microsoft auth check failed:', error);
      }
      window.location.href = '/api/login';
    } else {
      window.location.href = '/api/login/github';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-pane rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold text-foreground">
            Sign in to Careerate
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm text-foreground/60 hover:text-foreground transition-colors focus:outline-none"
            data-testid="close-login-modal"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <div className="flex flex-col space-y-3 p-6">
          {/* Microsoft Login */}
          <Button
            onClick={() => handleLogin('microsoft')}
            disabled={isLoading}
            className="w-full h-12 text-sm font-bold rounded-full bg-white/10 hover:bg-white/15 text-foreground flex items-center justify-center gap-3 border border-white/20"
            data-testid="login-microsoft"
          >
            {/* Fluent Microsoft 4-square mark */}
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <rect width="10" height="10" x="1" y="1" fill="#F25022"/>
              <rect width="10" height="10" x="13" y="1" fill="#00A4EF"/>
              <rect width="10" height="10" x="1" y="13" fill="#7FBA00"/>
              <rect width="10" height="10" x="13" y="13" fill="#FFB900"/>
            </svg>
            {isLoading ? 'Connecting...' : 'Continue with Microsoft'}
          </Button>

          {/* GitHub Login */}
          <Button
            onClick={() => handleLogin('github')}
            disabled={isLoading}
            variant="ghost"
            className="w-full h-12 text-sm font-bold rounded-full glass-pane flex items-center justify-center gap-3"
            data-testid="login-github"
          >
            <Github className="w-5 h-5" />
            {isLoading ? 'Connecting...' : 'Continue with GitHub'}
          </Button>

          <div className="text-center text-sm text-foreground/70 mt-4">
            By continuing, you agree to our{' '}
            <a href="/terms" className="underline hover:text-primary font-medium" target="_blank">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline hover:text-primary font-medium" target="_blank">
              Privacy Policy
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}