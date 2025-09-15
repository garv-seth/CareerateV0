import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  const terminalContent = [
    "$ careerate new-app",
    "🤖 What would you like to build?",
    "> A todo app with user authentication and real-time sync",
    "✨ Generating full-stack application...",
    "🏗️ Setting up React + Node.js + PostgreSQL...",
    "🔐 Implementing JWT authentication...",
    "⚡ Adding real-time WebSocket support...",
    "🚀 Deploying to production...",
    "✅ App deployed at: https://my-todo-app.careerate.dev"
  ];

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < terminalContent.length) {
        setTerminalLines(prev => [...prev, terminalContent[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
      <div className="absolute inset-0 gradient-mesh opacity-10"></div>
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Build & Deploy<br />with AI
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            The world's first platform combining AI-powered coding with intelligent hosting. 
            Build full-stack applications with natural language, then let AI handle all your infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/dashboard">
              <Button 
                className="px-8 py-4 bg-primary text-primary-foreground rounded-full text-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg"
                data-testid="button-start-building"
              >
                Start Building Now
              </Button>
            </Link>
            <Button 
              variant="outline"
              className="px-8 py-4 glass rounded-full text-lg font-semibold hover:bg-white/20 transition-colors"
              data-testid="button-watch-demo"
            >
              <Play className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Terminal Demo */}
        <div className="glass rounded-2xl p-8 max-w-4xl mx-auto" data-testid="terminal-demo">
          <div className="code-bg rounded-xl p-6 font-mono text-sm">
            <div className="flex items-center mb-4">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="ml-4 text-gray-400">careerate-terminal</div>
            </div>
            <div className="space-y-2 min-h-48">
              {terminalLines.map((line, index) => {
                if (!line || typeof line !== 'string') return null;
                return (
                  <div 
                    key={index} 
                    className={`${
                      line.startsWith('$') ? 'text-accent' :
                      line.startsWith('🤖') ? 'text-secondary' :
                      line.startsWith('>') ? 'syntax-white' :
                      line.startsWith('✅') ? 'text-accent' :
                      'text-yellow-400'
                    }`}
                    data-testid={`terminal-line-${index}`}
                  >
                    {line}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
