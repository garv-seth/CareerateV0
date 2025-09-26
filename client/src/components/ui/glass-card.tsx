import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  children: React.ReactNode;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-pane rounded-3xl p-6",
          hover && "hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

interface GlassCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GlassCardHeader = React.forwardRef<HTMLDivElement, GlassCardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 mb-4", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCardHeader.displayName = "GlassCardHeader";

interface GlassCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

const GlassCardTitle = React.forwardRef<HTMLParagraphElement, GlassCardTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn("text-display text-xl font-semibold leading-none tracking-tight", className)}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

GlassCardTitle.displayName = "GlassCardTitle";

interface GlassCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GlassCardContent = React.forwardRef<HTMLDivElement, GlassCardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("text-foreground/60", className)} {...props}>
        {children}
      </div>
    );
  }
);

GlassCardContent.displayName = "GlassCardContent";

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  colorClass?: string;
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  colorClass = "from-primary to-secondary",
  className
}) => {
  return (
    <GlassCard className={cn("flex flex-col items-start text-left", className)}>
      <div className={`mb-4 p-3 rounded-xl bg-gradient-to-br ${colorClass}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <GlassCardTitle>{title}</GlassCardTitle>
      <GlassCardContent>
        <p>{description}</p>
      </GlassCardContent>
    </GlassCard>
  );
};

FeatureCard.displayName = "FeatureCard";

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  FeatureCard,
};