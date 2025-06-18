'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type GlassButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart' | 'style'> & {
    children: React.ReactNode;
    variant?: 'primary' | 'glass';
    fullWidth?: boolean;
    className?: string;
};

export const GlassButton = ({ children, variant = 'primary', fullWidth = false, className = '', ...props }: GlassButtonProps) => {
    return (
        <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`
                relative overflow-hidden rounded-lg font-medium transition-all duration-300
                group
                ${fullWidth ? 'w-full' : ''}
                ${variant === 'primary' ? 'bg-gradient-primary text-white shadow-lg shadow-primary-main/25' : ''}
                ${variant === 'glass' ? 'bg-glass-white backdrop-blur-md border border-glass-border text-white' : ''}
                px-6 py-3 text-base
                ${className}
            `}
            {...props}
        >
            {/* Tube light effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                          -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="relative z-10">{children}</span>
        </motion.button>
    );
}; 