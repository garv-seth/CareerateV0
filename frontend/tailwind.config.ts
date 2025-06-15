import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        border: "rgb(var(--border-rgb))",
        input: "rgb(var(--input))",
        ring: "rgb(var(--ring))",
        background: "rgb(var(--background-rgb))",
        foreground: "rgb(var(--foreground-rgb))",
        primary: {
          DEFAULT: "rgb(var(--primary-rgb))",
          foreground: "rgb(250 250 255)",
          hover: "rgb(var(--primary-hover-rgb))",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary-rgb))",
          foreground: "rgb(255 255 255)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted-rgb))",
          foreground: "rgb(var(--muted-rgb))",
        },
        accent: {
          DEFAULT: "rgb(var(--accent-rgb))",
          foreground: "rgb(var(--background-rgb))",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive-rgb))",
          foreground: "rgb(255 255 255)",
        },
        success: {
          DEFAULT: "rgb(var(--success-rgb))",
          foreground: "rgb(var(--background-rgb))",
        },
        warning: {
          DEFAULT: "rgb(var(--warning-rgb))",
          foreground: "rgb(var(--background-rgb))",
        },
        card: {
          DEFAULT: "rgb(var(--card-rgb))",
          foreground: "rgb(var(--foreground-rgb))",
        },
        popover: {
          DEFAULT: "rgb(var(--popover-rgb))",
          foreground: "rgb(var(--foreground-rgb))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;