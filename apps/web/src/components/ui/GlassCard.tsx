'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'elevated' | 'interactive';
}

const glassVariants = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }
};

export const GlassCard = ({ children, className = '', variant = 'default' }: GlassCardProps) => {
    const glassStyles = {
        default: 'bg-glass-dark/80 backdrop-blur-xl border border-glass-border',
        elevated: 'bg-glass-dark/80 backdrop-blur-2xl border border-glass-border shadow-2xl shadow-primary-main/10',
        interactive: 'bg-glass-white backdrop-blur-lg border border-glass-border hover:bg-glass-blue hover:shadow-lg hover:shadow-primary-main/25 transition-all duration-300'
    };

    return (
        <motion.div
            variants={glassVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`rounded-2xl ${glassStyles[variant]} ${className}`}
        >
            {children}
        </motion.div>
    );
}; 