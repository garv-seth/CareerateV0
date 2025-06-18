import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        'primary-deep': 'var(--primary-deep)',
        'primary-main': 'var(--primary-main)',
        'primary-light': 'var(--primary-light)',
        'primary-soft': 'var(--primary-soft)',
        'neutral-dark': 'var(--neutral-dark)',
        'neutral-main': 'var(--neutral-main)',
        'neutral-light': 'var(--neutral-light)',
        'neutral-soft': 'var(--neutral-soft)',
        'glass-white': 'var(--glass-white)',
        'glass-blue': 'var(--glass-blue)',
        'glass-dark': 'var(--glass-dark)',
        'glass-border': 'var(--glass-border)',
        'accent-success': 'var(--accent-success)',
        'accent-warning': 'var(--accent-warning)',
        'accent-danger': 'var(--accent-danger)',
        'accent-info': 'var(--accent-info)',
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-glass': 'var(--gradient-glass)',
        'gradient-mesh': 'var(--gradient-mesh)',
        'grid-neutral-main': 'linear-gradient(to right, var(--neutral-main) 1px, transparent 1px), linear-gradient(to bottom, var(--neutral-main) 1px, transparent 1px)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.7', boxShadow: '0 0 10px 0px var(--primary-main)' },
          '50%': { opacity: '1', boxShadow: '0 0 25px 10px var(--primary-main)' },
        }
      }
    },
  },
  plugins: [],
};
export default config; 