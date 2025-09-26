import React from 'react';

// Types for component props
interface SimpleHeroProps {
  trustBadge?: {
    text: string;
    icons?: string[];
  };
  headline: {
    line1: string;
    line2: string;
  };
  subtitle: string;
  buttons?: {
    primary?: {
      text: string;
      onClick?: () => void;
    };
    secondary?: {
      text: string;
      onClick?: () => void;
    };
  };
  className?: string;
}

const SimpleHero: React.FC<SimpleHeroProps> = ({
  trustBadge,
  headline,
  subtitle,
  buttons,
  className = ""
}) => {
  return (
    <div className={`relative w-full h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 ${className}`}>
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-cyan-600/20 animate-pulse"></div>

      {/* Hero Content Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white">
        {/* Trust Badge */}
        {trustBadge && (
          <div className="mb-8 animate-fade-in opacity-0 animation-delay-200" style={{
            animation: 'fadeInUp 0.8s ease-out 0.2s forwards'
          }}>
            <div className="flex items-center gap-2 px-6 py-3 bg-primary/10 backdrop-blur-md border border-primary/30 rounded-full text-sm">
              {trustBadge.icons && (
                <div className="flex">
                  {trustBadge.icons.map((icon, index) => (
                    <span key={index} className="text-primary">
                      {icon}
                    </span>
                  ))}
                </div>
              )}
              <span className="text-primary-foreground/90">{trustBadge.text}</span>
            </div>
          </div>
        )}

        <div className="text-center space-y-6 max-w-5xl mx-auto px-4">
          {/* Main Heading with Animation */}
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-white via-purple-100 to-cyan-100 bg-clip-text text-transparent opacity-0"
                style={{
                  animation: 'fadeInUp 0.8s ease-out 0.4s forwards'
                }}>
              {headline.line1}
            </h1>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent opacity-0"
                style={{
                  animation: 'fadeInUp 0.8s ease-out 0.6s forwards'
                }}>
              {headline.line2}
            </h1>
          </div>

          {/* Subtitle with Animation */}
          <div className="max-w-3xl mx-auto opacity-0"
               style={{
                 animation: 'fadeInUp 0.8s ease-out 0.8s forwards'
               }}>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-200 font-light leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* CTA Buttons with Animation */}
          {buttons && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 opacity-0"
                 style={{
                   animation: 'fadeInUp 0.8s ease-out 1s forwards'
                 }}>
              {buttons.primary && (
                <button
                  onClick={buttons.primary.onClick}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25"
                >
                  {buttons.primary.text}
                </button>
              )}
              {buttons.secondary && (
                <button
                  onClick={buttons.secondary.onClick}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/50 text-white rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                >
                  {buttons.secondary.text}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default SimpleHero;