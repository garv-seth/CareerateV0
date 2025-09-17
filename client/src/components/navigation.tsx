import { useState } from "react";
import { Link } from "wouter";
import { Code, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "@/components/LoginModal";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-6">
      <div className="glass rounded-xl px-6 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2" data-testid="nav-logo">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Code className="text-primary-foreground text-sm" />
            </div>
            <span className="font-bold text-xl">Careerate</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-1">
            <button 
              onClick={() => scrollToSection("features")}
              className="px-4 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium"
              data-testid="nav-features"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection("how-it-works")}
              className="px-4 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium"
              data-testid="nav-how-it-works"
            >
              How it Works
            </button>
            <button 
              onClick={() => scrollToSection("pricing")}
              className="px-4 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium"
              data-testid="nav-pricing"
            >
              Pricing
            </button>
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button 
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    data-testid="button-dashboard"
                  >
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  data-testid="button-logout"
                  onClick={() => window.location.href = '/api/logout'}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                data-testid="button-login"
                onClick={() => setIsLoginModalOpen(true)}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Login'}
              </Button>
            )}
          </div>

          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            data-testid="button-menu-toggle"
          >
            {isMenuOpen ? <X className="text-foreground" /> : <Menu className="text-foreground" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-border">
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => scrollToSection("features")}
                className="px-4 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-left"
                data-testid="nav-mobile-features"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection("how-it-works")}
                className="px-4 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-left"
                data-testid="nav-mobile-how-it-works"
              >
                How it Works
              </button>
              <button 
                onClick={() => scrollToSection("pricing")}
                className="px-4 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-left"
                data-testid="nav-mobile-pricing"
              >
                Pricing
              </button>
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard">
                    <Button 
                      className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                      data-testid="button-mobile-dashboard"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    data-testid="button-mobile-logout"
                    onClick={() => window.location.href = '/api/logout'}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                  data-testid="button-mobile-login"
                  onClick={() => {
                    setIsLoginModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Login'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </nav>
  );
}
