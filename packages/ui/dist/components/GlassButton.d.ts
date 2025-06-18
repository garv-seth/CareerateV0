import React from 'react';
import { HTMLMotionProps } from 'framer-motion';
interface GlassButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
    children: React.ReactNode;
    variant?: 'primary' | 'glass';
    fullWidth?: boolean;
    className?: string;
}
export declare const GlassButton: ({ children, variant, fullWidth, className, ...props }: GlassButtonProps) => React.JSX.Element;
export {};
//# sourceMappingURL=GlassButton.d.ts.map