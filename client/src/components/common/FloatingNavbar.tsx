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
  Zap
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
        className={`floating-navbar hidden md:flex items-center justify-between px-6 py-3 glass-nav ${
          isScrolled ? 'backdrop-blur-xl bg-opacity-90' : ''
        }`}
      >
        {/* Logo */}
        <motion.div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-xl text-gradient">Careerate</span>
        </motion.div>

        {/* Navigation Items */}
        <div className="flex items-center space-x-1">
          {navItems.map((item) => (
            <motion.button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`px-4 py-2 rounded-full flex items-center space-x-2 transition-all duration-200 ${
                isActivePath(item.path)
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.name}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
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
              className="flex items-center space-x-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center">
                <User size={16} className="text-accent-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">
                {user.displayName || user.email?.split('@')[0] || 'User'}
              </span>
            </motion.div>
          )}
          
          <Button
            variant={isAuthenticated ? "outline" : "default"}
            size="sm"
            onClick={handleAuth}
            className={`pixel-btn ${isAuthenticated ? '' : 'bg-primary hover:bg-primary/90'}`}
          >
            {isAuthenticated ? (
              <>
                <LogOut size={16} className="mr-2" />
                Sign Out
              </>
            ) : (
              <>
                <LogIn size={16} className="mr-2" />
                Sign In
              </>
            )}
          </Button>
        </div>
      </motion.nav>

      {/* Mobile Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`md:hidden fixed top-4 left-4 right-4 z-50 glass-nav rounded-2xl px-4 py-3 ${
          isScrolled ? 'backdrop-blur-xl bg-opacity-90' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-7 h-7 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">C</span>
            </div>
            <span className="font-bold text-lg text-gradient">Careerate</span>
          </motion.div>

          {/* Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2"
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={20} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed top-20 left-4 right-4 z-40 glass-nav rounded-2xl p-4"
          >
            <div className="space-y-2">
              {navItems.map((item) => (
                <motion.button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full px-4 py-3 rounded-xl flex items-center space-x-3 transition-all duration-200 ${
                    isActivePath(item.path)
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs px-2 py-1 ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </motion.button>
              ))}
              
              <div className="border-t border-border pt-3 mt-3">
                {isAuthenticated && user && (
                  <div className="flex items-center space-x-3 px-4 py-2 mb-3 rounded-xl bg-muted/30">
                    <div className="w-8 h-8 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center">
                      <User size={16} className="text-accent-foreground" />
                    </div>
                    <span className="font-medium text-foreground">
                      {user.displayName || user.email?.split('@')[0] || 'User'}
                    </span>
                  </div>
                )}
                
                <Button
                  variant={isAuthenticated ? "outline" : "default"}
                  onClick={handleAuth}
                  className={`w-full pixel-btn ${isAuthenticated ? '' : 'bg-primary hover:bg-primary/90'}`}
                >
                  {isAuthenticated ? (
                    <>
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </>
                  ) : (
                    <>
                      <LogIn size={16} className="mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingNavbar; 