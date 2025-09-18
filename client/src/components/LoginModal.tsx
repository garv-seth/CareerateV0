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

  const handleLogin = (provider: 'microsoft' | 'github') => {
    setIsLoading(true);
    if (provider === 'microsoft') {
      window.location.href = '/api/login';
    } else {
      window.location.href = '/api/login/github';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-md border border-border/50">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Sign in to Careerate
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
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
            className="w-full h-12 text-sm font-medium bg-[#0078d4] hover:bg-[#106ebe] text-white flex items-center justify-center gap-3"
            data-testid="login-microsoft"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 21 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#00a4ef" />
              <rect x="1" y="11" width="9" height="9" fill="#ffb900" />
              <rect x="11" y="11" width="9" height="9" fill="#7fba00" />
            </svg>
            {isLoading ? 'Connecting...' : 'Continue with Microsoft'}
          </Button>

          {/* GitHub Login */}
          <Button
            onClick={() => handleLogin('github')}
            disabled={isLoading}
            variant="outline"
            className="w-full h-12 text-sm font-medium border-2 hover:bg-gray-50 flex items-center justify-center gap-3"
            data-testid="login-github"
          >
            <Github className="w-5 h-5" />
            {isLoading ? 'Connecting...' : 'Continue with GitHub'}
          </Button>

          <div className="text-center text-sm text-muted-foreground mt-4">
            By continuing, you agree to our{' '}
            <a href="/terms" className="underline hover:text-primary" target="_blank">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline hover:text-primary" target="_blank">
              Privacy Policy
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}