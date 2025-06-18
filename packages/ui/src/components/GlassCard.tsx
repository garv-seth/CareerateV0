'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import React from 'react';

// Framer Motion variants for glass elements
export const glassVariants = {
  initial: { 
    opacity: 0, 
    scale: 0.95,
    backdropFilter: "blur(0px)",
    y: 20
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    backdropFilter: "blur(20px)",
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 0.8
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    backdropFilter: "blur(0px)",
    y: -20,
    transition: {
      duration: 0.2
    }
  }
};

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "interactive";
}

export const GlassCard = ({ children, className, variant = "default", ...props }: GlassCardProps) => {
  const glassStyles = {
    default: "bg-glass-white backdrop-blur-md border border-glass-border",
    elevated: "bg-glass-white backdrop-blur-xl border border-glass-border shadow-2xl shadow-primary-main/20",
    interactive: "bg-glass-white backdrop-blur-lg border border-glass-border hover:bg-glass-blue hover:shadow-lg hover:shadow-primary-main/25 transition-all duration-300"
  };

  return (
    <motion.div
      variants={glassVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`rounded-xl ${glassStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}; 