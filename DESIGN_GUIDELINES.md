# Careerate Design System Guidelines

## Overview
Careerate's design system combines modern glassmorphism aesthetics with dynamic shader-based animations to create a futuristic yet professional development platform experience.

## Core Visual Principles

### 1. Glassmorphism & Transparency
- **Primary Pattern**: `glass-pane` class for translucent surfaces
- **Background**: Semi-transparent backgrounds with backdrop blur
- **Borders**: Subtle borders using `border-primary/30` or `border-white/10`
- **Usage**: Cards, modals, navigation elements, feature sections

### 2. Dynamic Animations
- **Shader Backgrounds**: WebGL-powered animated backgrounds for hero sections
- **Micro-interactions**: Hover states with scale transforms (`hover:scale-105`)
- **Page Transitions**: Fade-in animations with staggered delays
- **Entrance Animations**: `animate-fade-in-up` and `animate-fade-in-down`

### 3. Gradient System
- **Primary Gradients**: `from-primary via-secondary to-primary`
- **Text Gradients**: `bg-gradient-to-r` with `bg-clip-text text-transparent`
- **Button Gradients**: Subtle gradients for primary actions
- **Background Gradients**: Animated gradients for dynamic elements

## Color Palette

### Primary Colors
- **Primary**: Purple/violet tones (`#A78BFA` - `#8B5CF6`)
- **Secondary**: Pink/magenta accents (`#E879F9` - `#D946EF`)
- **Foreground**: Adaptive text color based on theme
- **Background**: Dark theme optimized

### Semantic Colors
- **Success**: Green (`bg-green-400`, `text-green-400`)
- **Warning**: Yellow/amber (`bg-yellow-400`, `text-yellow-400`)
- **Error**: Red (`bg-red-400`, `text-red-400`)
- **Info**: Blue (`bg-blue-400`, `text-blue-400`)
- **Neutral**: Gray variations for secondary content

## Typography

### Hierarchy
- **Display**: Large headings (`text-display`) with bold weights
- **Headings**: `text-2xl` to `text-7xl` with font-bold
- **Body**: `text-base` to `text-lg` with balanced line-height
- **Captions**: `text-sm` to `text-xs` for secondary information

### Font Weights
- **Bold**: Primary headings and important CTAs
- **Semibold**: Secondary headings and labels
- **Medium**: Button text and navigation
- **Light**: Large display text for elegance

## Component Patterns

### Cards
```tsx
<Card className="glass-pane rounded-3xl hover:-translate-y-2 transition-all duration-300">
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>
```

### Buttons
```tsx
// Primary CTA
<Button className="rounded-full bg-primary/15 text-primary-foreground hover:bg-primary/25 transition-all duration-300 hover:scale-105 shadow-lg shadow-primary/10">

// Secondary
<Button variant="outline" className="rounded-full border-primary/30 hover:bg-primary/10 backdrop-blur-sm">
```

### Navigation
```tsx
<nav className="glass-pane rounded-full p-2">
  <NavLink className="px-3 py-2 rounded-full hover:bg-primary/10 transition-all duration-300">
    {/* Link content */}
  </NavLink>
</nav>
```

## Layout Patterns

### Hero Sections
- **Full viewport height**: `min-h-screen`
- **Centered content**: Flexbox centering
- **Shader backgrounds**: WebGL animated backgrounds
- **Overlay content**: Absolute positioned with proper z-index

### Content Sections
- **Container**: `max-w-7xl mx-auto px-4`
- **Vertical spacing**: `py-24 sm:py-32`
- **Grid layouts**: Responsive grids with proper gap spacing

### Responsive Design
- **Mobile-first**: Start with mobile, enhance for desktop
- **Breakpoints**: Follow Tailwind's standard breakpoints
- **Touch-friendly**: Minimum 44px touch targets
- **Readable text**: Appropriate font sizes for each breakpoint

## Animation Guidelines

### Timing Functions
- **Ease-out**: For entrance animations (`ease-out`)
- **Ease-in-out**: For state changes (`ease-in-out`)
- **Linear**: For continuous animations like rotations

### Duration Standards
- **Micro**: 150ms for hover states
- **Quick**: 300ms for button interactions
- **Standard**: 500ms for page transitions
- **Slow**: 800ms+ for complex animations

### Animation Delays
- **Staggered**: 200ms intervals for sequential animations
- **Progressive**: Increasing delays for layered content
- **Responsive**: Consider reducing animations on mobile

## Interactive Elements

### Hover States
- **Scale**: `hover:scale-105` for buttons and cards
- **Background**: Subtle background color changes
- **Shadow**: Enhanced shadows for depth
- **Transitions**: Smooth transitions for all changes

### Focus States
- **Visible**: Clear focus indicators for accessibility
- **High contrast**: Ensure visibility across themes
- **Consistent**: Use same focus style across components

## Accessibility

### Color Contrast
- **WCAG AA**: Minimum 4.5:1 ratio for normal text
- **WCAG AAA**: 7:1 ratio for important content
- **Testing**: Regular contrast testing across themes

### Motion Preferences
- **Respect settings**: Honor `prefers-reduced-motion`
- **Fallbacks**: Static alternatives for animations
- **Toggles**: Option to disable animations

## Implementation Notes

### CSS Custom Properties
- Use CSS variables for theme-aware properties
- Support for automatic dark/light theme switching
- Consistent spacing using design tokens

### Performance
- **GPU acceleration**: Use transform and opacity for animations
- **Debounced resize**: Optimize shader canvas resizing
- **Lazy loading**: Progressive enhancement for heavy animations

## Usage Examples

### Hero Component Integration
```tsx
import Hero from "@/components/ui/animated-shader-hero";

<Hero
  trustBadge={{ text: "Trusted by teams", icons: ["🚀"] }}
  headline={{ line1: "First Line", line2: "Second Line" }}
  subtitle="Compelling subtitle text"
  buttons={{
    primary: { text: "Get Started", onClick: handler },
    secondary: { text: "Learn More", onClick: handler }
  }}
/>
```

### Feature Cards
```tsx
<div className="glass-pane rounded-3xl p-6 hover:-translate-y-2 transition-all duration-300">
  <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-primary to-secondary">
    <Icon className="h-6 w-6 text-white" />
  </div>
  <h3 className="text-xl font-semibold mb-2">{title}</h3>
  <p className="text-foreground/60">{description}</p>
</div>
```

## File Organization

### Component Structure
```
/components/ui/
  ├── animated-shader-hero.tsx    # Hero with WebGL background
  ├── gradient-dots.tsx           # Animated dot patterns
  ├── glass-card.tsx              # Glassmorphism card variants
  └── animated-button.tsx         # Enhanced button components
```

### Style Organization
- **Utility-first**: Prefer Tailwind utilities
- **Custom components**: Extract reusable patterns
- **CSS modules**: For complex animations only
- **Design tokens**: Centralized theming system

---

*This document should be updated as the design system evolves. Regular reviews ensure consistency across the platform.*