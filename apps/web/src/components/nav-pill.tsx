'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface NavPillProps {
  name: string;
  path: string;
  isActive: boolean;
}

export const NavPill = ({ name, path, isActive }: NavPillProps) => {
  return (
    <Link href={path} className="relative px-4 py-2 text-sm font-medium text-white rounded-full">
      {isActive && (
        <motion.div
          layoutId="nav-pill-active"
          className="absolute inset-0 bg-primary-main rounded-full"
          style={{ borderRadius: 9999 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <span className="relative z-10">{name}</span>
    </Link>
  );
}; 