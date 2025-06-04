import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import {
  ArrowUp,
  Github,
  Twitter,
  Linkedin
} from 'lucide-react';

const FloatingFooter: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show footer when user has scrolled down a bit, or is near the bottom
      const scrollThreshold = windowHeight * 0.3; // Show after 30% of viewport scrolled
      const nearBottomThreshold = documentHeight - windowHeight * 1.5; // Show when 1.5x viewport height from bottom

      const shouldShow = scrollTop > scrollThreshold || (scrollTop > 0 && scrollTop > nearBottomThreshold) || (documentHeight <= windowHeight) ;
      
      if (shouldShow) {
        setIsVisible(true);
        clearTimeout(timeoutId); // Clear any pending timeout to hide
      } else if (isVisible && scrollTop < scrollThreshold / 2) { // Hide only if scrolled back up significantly
        // Debounce hiding to prevent flickering when scrolling near threshold
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setIsVisible(false);
        }, 300);
      }
    };

    // Initial check in case page is very short or already scrolled
    handleScroll(); 

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [isVisible]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialLinks = [
    { name: 'GitHub', icon: <Github size={18} />, url: 'https://github.com/careerate' },
    { name: 'Twitter', icon: <Twitter size={18} />, url: 'https://twitter.com/careerate' },
    { name: 'LinkedIn', icon: <Linkedin size={18} />, url: 'https://linkedin.com/company/careerate' },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.footer
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className='floating-footer glass-nav px-4 py-3 md:px-6' // Centered by default due to .floating-footer class
        >
          <div className="w-full mx-auto flex items-center justify-between">
            {/* Left Section - Logo & Copyright */}
            <div className="flex items-center gap-3">
              <img src="/CareerateICON.png" alt="Careerate Logo" className="h-7 w-7" />
              <p className="text-xs text-muted-foreground hidden sm:block">
                &copy; {new Date().getFullYear()} Careerate
              </p>
            </div>

            {/* Center Section - Social Links */}
            <div className="flex items-center gap-1">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-muted-foreground hover:text-primary transition-colors duration-200 rounded-full hover:bg-primary/10"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  title={social.name}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>

            {/* Right Section - Theme Toggle & Back to Top */}
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <motion.button
                onClick={scrollToTop}
                className="p-2 text-muted-foreground hover:text-primary transition-colors duration-200 rounded-full hover:bg-primary/10 flex items-center space-x-1"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                title="Back to top"
                aria-label="Scroll to top"
              >
                <ArrowUp size={18} />
              </motion.button>
            </div>
          </div>
        </motion.footer>
      )}
    </AnimatePresence>
  );
};

export default FloatingFooter; 