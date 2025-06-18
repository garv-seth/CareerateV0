'use client';

import { motion } from 'framer-motion';

interface TabButtonProps {
    name: string;
    isActive: boolean;
    onClick: () => void;
}

export const TabButton = ({ name, isActive, onClick }: TabButtonProps) => {
    return (
        <button onClick={onClick} className="relative px-4 py-2 text-sm font-medium text-white rounded-lg">
            {isActive && (
                <motion.div
                    layoutId="activity-tab-active"
                    className="absolute inset-0 bg-primary-main rounded-lg"
                    style={{ borderRadius: 8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
            )}
            <span className="relative z-10">{name}</span>
        </button>
    );
}; 