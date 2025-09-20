# Careerate Design System v1.0 (2025) - Elegant Futurism

This document outlines the design principles, color palette, typography, and component library for the Careerate platform. It ensures a cohesive, scalable, and premium user experience, inspired by iOS "liquid glass" aesthetics. AI agents building UI components MUST adhere to these guidelines.

## A. Core Principles

- **Philosophy**: Elegant futurism—subtle power over flashiness. Every interaction feels "liquid" (smooth, anticipatory) and intelligent.
- **Tone**: Professional yet approachable. Use SVGs for icons, avoiding emojis in production UI.
- **Responsiveness**: Mobile-first design. Key breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).
- **Performance**: Aim for <100ms interactions (Lighthouse). Lazy-load offscreen assets.
- **Accessibility**: Target WCAG AA compliance. Use semantic HTML, provide ARIA labels, and respect `@prefers-reduced-motion`.

## B. Color Palette (CSS Variables)

Defined in `client/src/index.css`. The system defaults to dark mode.

| Category          | CSS Variable             | Dark Mode Hex/HSL      | Light Mode Hex/HSL      | Usage                               |
| ----------------- | ------------------------ | ---------------------- | ----------------------- | ----------------------------------- |
| **Primary Base**  | `--background`           | `#1E0E3F` (257 50% 5%) | `#F8FAFC` (220 13% 98%) | Main backgrounds                    |
|                   | `--foreground`           | `#F8FAFC` (220 13% 98%) | `#0F172A` (222 47% 11%) | Body text                           |
| **Accent Primary**| `--primary`              | `#A78BFA` (252 94% 77%) | `#7C3AED` (262 84% 59%) | Buttons, links, highlights          |
|                   | `--primary-foreground`   | `#F8FAFC` (220 13% 98%) | `#F8FAFC` (220 13% 98%) | Text on primary elements            |
| **Accent Secondary**| `--secondary`            | `#E879F9` (290 92% 75%) | `#F472B6` (334 82% 66%) | Gradients, secondary icons          |
| **Neutral Mute**  | `--muted` / `--muted-foreground` | `#94A3B8` (226 34% 65%) | `#64748B` (223 39% 47%) | Subtext, placeholder text, labels   |
| **Glass/Borders** | `--card`                 | `257 50% 10% / 0.5`    | `220 13% 95% / 0.5`    | Glassmorphic panel backgrounds    |
|                   | `--border` / `--input`   | `252 94% 77% / 0.2`    | `262 84% 59% / 0.2`    | Borders for glass panels & inputs |

**Rule**: Glassmorphic elements use the `.glass-pane` utility class from `index.css`, which applies a semi-transparent background, a `backdrop-filter`, and a subtle border.

## C. Typography Scale

- **Display Font**: `Space Grotesk` (for headings, via `--font-display` and `.text-display`)
- **Sans-serif Font**: `Inter` (for body text, via `--font-sans`)
- **Monospace Font**: `JetBrains Mono` (for code blocks, via `--font-mono`)

| Use Case      | Font Family     | Recommended Weight | Recommended Size (Tailwind) |
| ------------- | --------------- | ------------------ | --------------------------- |
| Hero Headings | `Space Grotesk` | `700` (bold)       | `text-5xl` to `text-7xl`    |
| Section Headers| `Space Grotesk` | `600` (semibold)   | `text-3xl` to `text-5xl`    |
| Card Titles   | `Space Grotesk` | `600` (semibold)   | `text-xl` to `text-2xl`     |
| Body Text     | `Inter`         | `400` (normal)     | `text-base` to `text-lg`    |
| Subtext/Labels| `Inter`         | `400` (normal)     | `text-sm`                   |

**Rule**: Use `tracking-tight` or `tracking-tighter` on headings for a more refined look.

## D. Spacing & Layout System

- **Scale**: Multiples of 4px, aligned with Tailwind's default spacing scale (`p-4` = 16px, etc.).
- **Layout**: Main content container is centered with `mx-auto`, a `max-w-7xl`, and `px-4`.
- **Radii**: Default border radius is `0.75rem` (`--radius`). Components like buttons and cards use rounded variants like `rounded-full` or `rounded-3xl`.

## E. Components Library

- **Buttons**:
  - **Primary**: Pill-shaped (`rounded-full`), glass effect with a subtle background (`bg-primary/15`), and a scaling animation on hover.
  - **Secondary/Ghost**: Pill-shaped (`rounded-full`) with a transparent background that gains a subtle fill on hover (`hover:bg-primary/10`).
- **Cards**:
  - Use the `.glass-pane` utility class with `rounded-3xl`.
  - Employ hover effects like lifting (`hover:-translate-y-2`) and glowing shadows (`hover:shadow-2xl hover:shadow-primary/10`).
- **Navbar**:
  - A floating, tubular glass pane (`.glass-pane` with `rounded-full`).
  - Uses a scroll listener to shrink in height and padding for a dynamic feel.
- **Inputs/Forms**:
  - Should have a glass border (`border border-input`) and a focused ring effect (`focus:ring-2 ring-ring`).

## F. Animations & Motion System

- **Library**: Use CSS transitions for simple hover/focus effects. For more complex animations (staggering, timelines), a library like `Framer Motion` or `GSAP` is recommended.
- **Easing**: Default to gentle, quick eases like `ease-out` or `ease-in-out` with durations around `300ms`.
- **Loading States**: Use skeleton placeholders with a shimmering effect (animated gradient sweep).
- **AI Feedback**: For agent interactions, use typing indicators and liquid-fill progress bars to provide feedback.
