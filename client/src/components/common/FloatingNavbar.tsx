import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/state/userStore';
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
  Moon
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

const FloatingNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useUserStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const publicNavItems: NavItem[] = [
    { name: 'Home', path: '/', icon: <Home size={18} /> },
    { name: 'Features', path: '/#features', icon: <Sparkles size={18} /> },
    { name: 'Pricing', path: '/#pricing', icon: <Zap size={18} /> }
  ];

  const authenticatedNavItems: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: <BarChart3 size={18} /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart3 size={18} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={18} /> },
  ];

  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAuth = () => {
    if (isAuthenticated) {
      // Handle logout
      // TODO: Implement logout logic
    } else {
      navigate('/auth/login');
    }
  };

  const handleNavigation = (path: string) => {
    if (path.startsWith('/#')) {
      // Handle smooth scroll to sections
      const element = document.querySelector(path.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(path);
    }
    setIsMobileMenuOpen(false);
  };

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

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
        </div>

        {/* Auth Button */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && user && (
            <motion.div
              className="flex items-center space-x-2 pr-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-sm font-medium text-primary-foreground">
                {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || <User size={14}/>}
              </div>
              <span className="text-sm font-medium text-muted-foreground hidden lg:block">
                {user.displayName || user.email?.split('@')[0] || 'User'}
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
              {navItems.map((item) => (
                <motion.button
                  key={`mobile-${item.name}`}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full px-4 py-3.5 rounded-lg flex items-center space-x-3 transition-colors duration-200 text-base font-semibold 
                    ${isActivePath(item.path)
                      ? 'bg-primary/15 text-primary'
                      : 'text-foreground hover:bg-primary/10 hover:text-primary'}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: item.name.length * 0.02 }} // Stagger animation
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
              {/* Mobile Auth Button */}
              <motion.div 
                className="border-t border-border pt-6 mt-6"
                initial={{ opacity: 0}} animate={{ opacity: 1}} transition={{delay: 0.2}}
              >
                <Button
                  variant={isAuthenticated ? "outline" : "default"}
                  size="lg"
                  onClick={() => { handleAuth(); setIsMobileMenuOpen(false); }}
                  className={`w-full text-base font-semibold rounded-lg transition-all duration-300 
                    ${isAuthenticated 
                      ? 'border-border text-muted-foreground hover:bg-muted/10 hover:text-foreground' 
                      : 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-md shadow-primary/30'}`}
                >
                  {isAuthenticated ? (
                    <>
                      <LogOut size={18} className="mr-2" />
                      Sign Out
                    </>
                  ) : (
                    <>
                      <LogIn size={18} className="mr-2" />
                      Sign In
                    </>
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