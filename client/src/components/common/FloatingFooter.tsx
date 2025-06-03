import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Github, 
  Twitter, 
  Linkedin, 
  Mail,
  Heart,
  ExternalLink,
  ArrowUp
} from 'lucide-react';

const FloatingFooter: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show footer when user has scrolled past 80% of the page
      const scrollPercentage = (scrollTop + windowHeight) / documentHeight;
      const shouldShow = scrollPercentage > 0.8;
      
      // Check if user is at the bottom of the page
      const atBottom = windowHeight + scrollTop >= documentHeight - 10;
      
      setIsVisible(shouldShow);
      setIsAtBottom(atBottom);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialLinks = [
    { name: 'GitHub', icon: <Github size={16} />, url: 'https://github.com/careerate' },
    { name: 'Twitter', icon: <Twitter size={16} />, url: 'https://twitter.com/careerate' },
    { name: 'LinkedIn', icon: <Linkedin size={16} />, url: 'https://linkedin.com/company/careerate' },
    { name: 'Email', icon: <Mail size={16} />, url: 'mailto:hello@careerate.com' }
  ];

  const quickLinks = [
    { name: 'Privacy Policy', url: '/privacy' },
    { name: 'Terms of Service', url: '/terms' },
    { name: 'Help Center', url: '/help' },
    { name: 'Contact Us', url: '/contact' }
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.footer
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`floating-footer visible glass-nav ${
            isAtBottom ? 'mb-4' : ''
          }`}
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-6 py-4">
            {/* Left Section - Logo & Copyright */}
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs">C</span>
                </div>
                <span className="font-semibold text-sm text-gradient">Careerate</span>
              </div>
              
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <span>© 2025 Careerate</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  Made with <Heart size={12} className="text-accent" fill="currentColor" /> for your career
                </span>
              </div>
            </div>

            {/* Center Section - Quick Links */}
            <div className="hidden lg:flex items-center space-x-1">
              {quickLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.url}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-muted/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {link.name}
                </motion.a>
              ))}
            </div>

            {/* Right Section - Social Links & Back to Top */}
            <div className="flex items-center space-x-2">
              {/* Social Links */}
              <div className="flex items-center space-x-1">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-muted/30"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title={social.name}
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-border mx-2" />

              {/* Back to Top Button */}
              <motion.button
                onClick={scrollToTop}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-muted/30 flex items-center space-x-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Back to top"
              >
                <ArrowUp size={16} />
                <span className="text-xs hidden sm:inline">Top</span>
              </motion.button>
            </div>
          </div>

          {/* Mobile Quick Links */}
          <div className="lg:hidden border-t border-border/50 px-6 py-3">
            <div className="flex flex-wrap justify-center gap-2">
              {quickLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.url}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-muted/30 flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {link.name}
                  <ExternalLink size={10} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Neon glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 pointer-events-none" />
        </motion.footer>
      )}
    </AnimatePresence>
  );
};

export default FloatingFooter; 