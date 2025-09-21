'use client';

import React from 'react';
import { motion } from 'framer-motion';

type GradientDotsProps = React.ComponentProps<typeof motion.div> & {
	/** Dot size (default: 8) */
	dotSize?: number;
	/** Spacing between dots (default: 10) */
	spacing?: number;
	/** Animation duration (default: 30) */
	duration?: number;
	/** Color cycle duration (default: 6) */
	colorCycleDuration?: number;
	/** Background color (default: 'var(--background)') */
	backgroundColor?: string;
};

export function GradientDots({
	dotSize = 8,
	spacing = 10,
	duration = 30,
	colorCycleDuration = 6,
	backgroundColor = 'var(--background)',
	className,
	...props
}: GradientDotsProps) {
	const hexSpacing = spacing * 1.732; // Hexagonal spacing calculation

	// Create a larger visible "hole" so the colorful layers are noticeable
	const ringInner = dotSize; // size of transparent hole
	const ringOuter = dotSize + 1; // thin ring to keep the grid structure

	return (
		<motion.div
			className={`absolute inset-0 ${className || ''}`}
			style={{
				backgroundColor,
				backgroundImage: `
          radial-gradient(circle at 50% 50%, transparent ${ringInner}px, ${backgroundColor} ${ringInner}px ${ringOuter}px, transparent ${ringOuter}px),
          radial-gradient(circle at 50% 50%, transparent ${ringInner}px, ${backgroundColor} ${ringInner}px ${ringOuter}px, transparent ${ringOuter}px),
          radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.3), transparent 70%),
          radial-gradient(circle at 50% 50%, hsl(var(--secondary) / 0.3), transparent 70%),
          radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.2), transparent 70%),
          radial-gradient(ellipse at 50% 50%, hsl(var(--secondary) / 0.2), transparent 70%)
        `,
				backgroundSize: `
          ${spacing}px ${hexSpacing}px,
          ${spacing}px ${hexSpacing}px,
          200% 200%,
          200% 200%,
          200% 200%,
          200% ${hexSpacing}px
        `,
				backgroundPosition: `
          0px 0px, ${spacing / 2}px ${hexSpacing / 2}px,
          0% 0%,
          0% 0%,
          0% 0px
        `,
			}}
			animate={{
				backgroundPosition: [
					`0px 0px, ${spacing / 2}px ${hexSpacing / 2}px, 600% 300%, 800% -300%, -1000% -500%, 300% ${hexSpacing}px`,
					`0px 0px, ${spacing / 2}px ${hexSpacing / 2}px, 0% 0%, 0% 0%, 0% 0%, 0% 0%`,
				],
				filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)'],
			}}
			transition={{
				backgroundPosition: {
					duration: duration * 1.5,
					ease: 'linear',
					repeat: Number.POSITIVE_INFINITY,
				},
				filter: {
					duration: colorCycleDuration * 1.5,
					ease: 'linear',
					repeat: Number.POSITIVE_INFINITY,
				},
			}}
			{...props}
		/>
	);
}


