import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "@/components/LoginModal";
import { cn } from "@/lib/utils";

// Define a new SVG Logo component to match the design system
const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-300 group-hover:scale-110">
    <path d="M20 0L24.4903 15.5097L40 20L24.4903 24.4903L20 40L15.5097 24.4903L0 20L15.5097 15.5097L20 0Z" fill="url(#logo-gradient)"/>
    <defs>
      <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A78BFA"/>
        <stop offset="1" stopColor="#E879F9"/>
      </linearGradient>
    </defs>
  </svg>
);


export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a
      href={href}
      className="px-4 py-2 rounded-full text-sm font-medium text-foreground/80 transition-all duration-300 hover:text-foreground hover:bg-primary/10"
      onClick={(e) => {
        if (href.startsWith('#')) {
          e.preventDefault();
          const el = document.querySelector(href);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }}
    >
      {children}
    </a>
  );

  const AuthButtons = () => (
    <div className="flex items-center gap-2">
      {isAuthenticated ? (
        <>
          <Link href="/dashboard">
            <Button variant="ghost" className="rounded-full text-sm">Dashboard</Button>
          </Link>
          <Button
            className="rounded-full text-sm bg-primary/10 border border-primary/20 text-primary-foreground hover:bg-primary/20"
            onClick={() => window.location.href = '/api/logout'}
          >
            Logout
          </Button>
        </>
      ) : (
        <>
          <Button variant="ghost" className="rounded-full text-sm" onClick={() => setIsLoginModalOpen(true)} disabled={isLoading}>
            Sign In
          </Button>
          <Button 
            className="rounded-full text-sm bg-primary/15 text-primary-foreground hover:bg-primary/25 transition-all duration-300 hover:scale-105"
            onClick={() => {
              const el = document.querySelector('#pricing');
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            disabled={isLoading}
          >
            Get Started
          </Button>
        </>
      )}
    </div>
  );

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out",
        isScrolled ? "pt-2" : "pt-4 md:pt-6"
      )}>
        <div className={cn(
          "container mx-auto max-w-5xl transition-all duration-300 ease-out",
        )}>
          <nav className={cn(
            "w-full flex items-center justify-between p-2 rounded-full glass-pane transition-all duration-300",
            isScrolled ? "h-14" : "h-16"
          )}>
            <Link href="/" className="flex items-center gap-3 group pl-2">
              <Logo />
              <span className="text-display font-bold text-lg text-foreground">Careerate</span>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#pricing">Pricing</NavLink>
              <NavLink href="#docs">Docs</NavLink>
            </div>

            <div className="hidden md:flex items-center pr-2">
              <AuthButtons />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden pr-2">
              <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </nav>
        </div>
      </header>
      
      {/* Mobile Menu Drawer */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-full max-w-xs z-40 bg-background/80 backdrop-blur-xl transition-transform duration-300 ease-in-out md:hidden",
        isMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
         <div className="h-full flex flex-col justify-between p-6 pt-24">
            <div className="flex flex-col gap-4">
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#pricing">Pricing</NavLink>
              <NavLink href="#docs">Docs</NavLink>
            </div>
            <AuthButtons />
         </div>
      </div>


      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
