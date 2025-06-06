import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMsal, useIsAuthenticated, useAccount } from '@azure/msal-react';
import { msalInstance } from '@/main';
import { loginRequest } from '@/authConfig';
import { 
  Home, 
  BarChart3, 
  Settings, 
  User, 
  LogIn, 
  LogOut,
  Menu,
  X,
  Sparkles,
  Zap,
  Sun,
  Moon,
  Briefcase,
  MessageSquare
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  sectionId: string;
}

const FloatingNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const account = useAccount(accounts[0] || undefined);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const publicNavItems: NavItem[] = [
    { name: 'Home', path: '/', icon: <Home size={18} />, sectionId: 'hero' },
    { name: 'Features', path: '/#features', icon: <Sparkles size={18} />, sectionId: 'features' },
    { name: 'Pricing', path: '/#pricing', icon: <Briefcase size={18} />, sectionId: 'pricing' },
    { name: 'Testimonials', path: '/#testimonials', icon: <MessageSquare size={18} />, sectionId: 'testimonials' },
  ];

  const navItems = publicNavItems;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);

  const handleNavigation = (path: string) => {
    setIsMobileMenuOpen(false);
    if (path.startsWith('/#')) {
      navigate('/');
      setTimeout(() => {
        const sectionId = path.split('#')[1];
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    } else {
      navigate(path);
    }
  };

  const isActivePath = (path: string) => {
    if (path.includes('#')) {
      return location.pathname === path.split('#')[0] && location.hash === `#${path.split('#')[1]}`;
    }
    return location.pathname === path;
  };

  const handleAuth = () => {
    if (isAuthenticated) {
      instance.logoutRedirect({ postLogoutRedirectUri: '/' }).catch(e => {
        console.error('MSAL logoutRedirect error:', e);
      });
    } else {
      navigate('/auth/login');
    }
    setIsMobileMenuOpen(false);
  };

  let finalUserDisplayName: string = "User";
  let finalUserInitialDesktop: React.ReactNode = <User size={14} />;
  let finalUserInitialMobile: React.ReactNode = <User size={20} />;
  let finalUserUsername: string = "";

  if (isAuthenticated && account) {
    const nameCandidate = account.name || account.username?.split('@')[0];
    if (nameCandidate && nameCandidate.trim() !== "") {
      finalUserDisplayName = nameCandidate.trim();
    }
    
    if (finalUserDisplayName === "") {
      finalUserDisplayName = "User";
    }
    
    if (finalUserDisplayName !== "User") {
      const initialChar = finalUserDisplayName.charAt(0).toUpperCase();
      finalUserInitialDesktop = initialChar;
      finalUserInitialMobile = initialChar;
    } else {
      finalUserInitialDesktop = <User size={14} />;
      finalUserInitialMobile = <User size={20} />;
    }
    finalUserUsername = account.username || "";
  }

  return (
    <>
      {/* Desktop Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`floating-navbar hidden md:flex items-center justify-between gap-4 ${isScrolled ? 'py-2' : 'py-3'}`}
      >
        {/* Logo */}
        <motion.div
          className="flex items-center space-x-2 cursor-pointer group"
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img src="/CareerateICON.png" alt="Careerate Logo" className="h-9 w-9 transition-all duration-300 group-hover:opacity-80" />
          <span className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
            Careerate
          </span>
        </motion.div>

        {/* Navigation Items */}
        <div className="flex items-center space-x-1">
          {navItems.map((item) => (
            <motion.button
              key={item.name}
              onClick={() => handleNavigation(item.path)}
              className={`px-3.5 py-1.5 rounded-md flex items-center space-x-2 transition-colors duration-200 text-sm font-medium
                ${isActivePath(item.path)
                  ? 'bg-primary/15 text-primary' 
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {item.icon}
              <span>{item.name}</span>
              {item.badge && (
                <Badge variant="default" className="text-xs px-1.5 py-0.5 bg-accent text-accent-foreground ml-1">
                  {item.badge}
                </Badge>
              )}
            </motion.button>
          ))}
          {isAuthenticated && (
            <motion.button
              onClick={() => navigate('/dashboard')}
              className={`px-3.5 py-1.5 rounded-md flex items-center space-x-2 transition-colors duration-200 text-sm font-medium
                ${isActivePath('/dashboard')
                  ? 'bg-primary/15 text-primary' 
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <BarChart3 size={18} />
              <span>Dashboard</span>
            </motion.button>
          )}
        </div>

        {/* Auth Button */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && account && (
            <motion.div
              className="flex items-center space-x-2 pr-1 cursor-pointer group"
              onClick={() => navigate('/settings')}
              title={`Signed in as ${finalUserDisplayName}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              whileHover={{ scale: 1.03 }}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-sm font-medium text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/50 transition-shadow">
                {finalUserInitialDesktop}
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground hidden lg:block transition-colors">
                {finalUserDisplayName}
              </span>
            </motion.div>
          )}
          <Button
            variant={isAuthenticated ? "outline" : "default"}
            size="sm"
            onClick={handleAuth}
            className={`rounded-md text-sm font-medium transition-all duration-300 transform hover:scale-105 
              ${isAuthenticated 
                ? 'border-border text-muted-foreground hover:bg-muted/10 hover:text-foreground' 
                : 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-md shadow-primary/30'}`}
          >
            {isAuthenticated ? (
              <>
                <LogOut size={16} className="mr-1.5" />
                Sign Out
              </>
            ) : (
              <>
                <LogIn size={16} className="mr-1.5" />
                Sign In
              </>
            )}
          </Button>
        </div>
      </motion.nav>

      {/* Mobile Navbar - Ensure it uses theme colors too */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`md:hidden fixed top-0 left-0 right-0 z-[1000] shadow-lg 
          bg-card/80 backdrop-blur-md border-b border-border/70`}
      >
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
          >
            <img src="/CareerateICON.png" alt="Careerate Logo" className="h-7 w-7" />
            <span className="font-bold text-lg text-foreground">Careerate</span>
          </motion.div>

          {/* Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-muted-foreground hover:text-primary"
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.25, ease: "circOut" }}
                >
                  <X size={22} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.25, ease: "circOut" }}
                >
                  <Menu size={22} />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </motion.nav>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
            className="md:hidden fixed top-0 left-0 right-0 bottom-0 z-[999] pt-[60px] bg-background/95 backdrop-blur-lg overflow-y-auto"
          >
            <div className="container mx-auto px-6 py-8 space-y-3">
              {isAuthenticated && account && (
                <motion.div 
                  className="flex items-center space-x-3 px-3 py-3 mb-3 rounded-lg bg-card border border-border"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-lg font-medium text-primary-foreground">
                    {finalUserInitialMobile}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-base">{finalUserDisplayName}</p>
                    <p className="text-xs text-muted-foreground">{finalUserUsername}</p>
                  </div>
                </motion.div>
              )}
              {navItems.map((item) => (
                <motion.button
                  key={`mobile-${item.name}`}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full px-4 py-3.5 rounded-lg flex items-center space-x-3 transition-colors duration-200 text-base font-semibold 
                    ${isActivePath(item.path)
                      ? 'bg-primary/15 text-primary'
                      : 'text-foreground hover:bg-primary/10 hover:text-primary'}`}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + item.name.length * 0.02 }}
                >
                  {item.icon && React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                  <span>{item.name}</span>
                  {item.badge && (
                    <Badge variant="default" className="text-xs px-2 py-1 ml-auto bg-accent text-accent-foreground">
                      {item.badge}
                    </Badge>
                  )}
                </motion.button>
              ))}
              {isAuthenticated && (
                <motion.button
                  onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}
                  className={`w-full px-4 py-3.5 rounded-lg flex items-center space-x-3 transition-colors duration-200 text-base font-semibold 
                    ${isActivePath('/dashboard')
                      ? 'bg-primary/15 text-primary'
                      : 'text-foreground hover:bg-primary/10 hover:text-primary'}`}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + navItems.length * 0.02 }}
                >
                  <BarChart3 size={20} />
                  <span>Dashboard</span>
                </motion.button>
              )}
              <motion.div 
                className="border-t border-border pt-6 mt-6"
                initial={{ opacity: 0}} animate={{ opacity: 1}} transition={{delay: 0.2 + (isAuthenticated ? navItems.length +1 : navItems.length) * 0.02}}
              >
                <Button
                  variant={isAuthenticated ? "outline" : "default"}
                  size="lg"
                  onClick={handleAuth}
                  className={`w-full text-base font-semibold rounded-lg transition-all duration-300 
                    ${isAuthenticated 
                      ? 'border-border text-muted-foreground hover:bg-muted/10 hover:text-foreground' 
                      : 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-md shadow-primary/30'}`}
                >
                  {isAuthenticated ? (
                    <><LogOut size={18} className="mr-2" />Sign Out</>
                  ) : (
                    <><LogIn size={18} className="mr-2" />Sign In</>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingNavbar; 