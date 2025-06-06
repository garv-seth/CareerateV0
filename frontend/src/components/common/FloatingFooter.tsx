import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

import { useNavigate } from 'react-router-dom';

const FloatingFooter: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

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



  return (
    <motion.footer
      className={`floating-footer ${isVisible ? 'visible' : ''} hidden md:flex items-center justify-between text-sm`}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: isVisible ? 0 : 100, opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex items-center space-x-2">
        <motion.div 
          className="cursor-pointer" 
          onClick={() => navigate('/')}
          whileHover={{scale: 1.1}} whileTap={{scale: 0.9}}
        >
          <img src="/CareerateICON.png" alt="Careerate Logo" className="h-6 w-6" />
        </motion.div>
        <span className="text-muted-foreground">
          &copy; {new Date().getFullYear()} Careerate. All rights reserved.
        </span>
      </div>
      <div className="flex items-center space-x-4">
        <motion.a 
          href="/privacy-policy" 
          className="text-muted-foreground hover:text-primary transition-colors"
          whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}
        >
          Privacy Policy
        </motion.a>
        <motion.a 
          href="/terms-of-service" 
          className="text-muted-foreground hover:text-primary transition-colors"
          whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}
        >
          Terms of Service
        </motion.a>
        <ThemeToggle />
      </div>
    </motion.footer>
  );
};

export default FloatingFooter; 