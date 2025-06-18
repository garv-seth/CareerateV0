'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import React from 'react';

interface GlassButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  variant?: "primary" | "glass";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const GlassButton = ({ children, variant = "primary", size = "md", className, ...props }: GlassButtonProps) => {
  const baseClasses = "relative overflow-hidden rounded-lg font-medium transition-all duration-300 group";
  
  const variantClasses = {
    primary: 'bg-gradient-primary text-white shadow-lg shadow-primary-main/25',
    glass: 'bg-glass-white backdrop-blur-md border border-glass-border text-white'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {/* Tube light effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                    -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}; 