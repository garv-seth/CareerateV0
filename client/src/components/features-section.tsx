import { Server, Shield, TrendingUp, Globe, Rocket, Database, Wand2, FileCode, Users } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: <Server className="text-secondary-foreground" />,
      title: "Autonomous Infrastructure",
      description: "AI agents manage servers, scaling, load balancing, and infrastructure optimization automatically.",
      color: "bg-secondary"
    },
    {
      icon: <Shield className="text-accent-foreground" />,
      title: "Security & Compliance",
      description: "Automated security updates, vulnerability scanning, and compliance monitoring 24/7.",
      color: "bg-accent"
    },
    {
      icon: <TrendingUp className="text-secondary-foreground" />,
      title: "Intelligent Monitoring",
      description: "Proactive performance monitoring with self-healing capabilities and predictive scaling.",
      color: "bg-secondary"
    },
    {
      icon: <Globe className="text-accent-foreground" />,
      title: "Global CDN & Edge",
      description: "Automatic content distribution and edge computing for optimal performance worldwide.",
      color: "bg-accent"
    },
    {
      icon: <Rocket className="text-secondary-foreground" />,
      title: "Zero-Downtime Deployments",
      description: "Seamless deployments with automatic rollbacks and blue-green deployment strategies.",
      color: "bg-secondary"
    },
    {
      icon: <Database className="text-accent-foreground" />,
      title: "Database Optimization",
      description: "Automated database tuning, backups, and performance optimization by AI.",
      color: "bg-accent"
    }
  ];

  const codeEditorFeatures = [
    {
      icon: <Wand2 className="mr-2 text-accent" />,
      title: "Natural Language to Code",
      description: "Describe what you want to build in plain English, and our AI generates production-ready code instantly."
    },
    {
      icon: <FileCode className="mr-2 text-secondary" />,
      title: "Intelligent Code Completion",
      description: "Context-aware suggestions and automatic refactoring powered by advanced AI models."
    },
    {
      icon: <Users className="mr-2 text-accent" />,
      title: "Real-time Collaboration",
      description: "Work together with your team in real-time with intelligent conflict resolution."
    }
  ];

  const codeExample = `import React from 'react'
import { useState, useEffect } from 'react'

function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  // AI-generated authentication hook
  const { user, login, logout } = useAuth();

  // Real-time sync with WebSocket
  useEffect(() => {
    const socket = io('ws://localhost:3001');
    socket.on('todoUpdate', setTodos);
    return () => socket.disconnect();
  }, []);`;

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="features-title">
            Vibe Coding + Vibe Hosting
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="features-description">
            AI-powered infrastructure that handles DevOps, scaling, security, and maintenance 
            so you can focus on building.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="glass rounded-2xl p-8 hover:bg-white/20 transition-all duration-300"
              data-testid={`feature-card-${index}`}
            >
              <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-6`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-4" data-testid={`feature-title-${index}`}>
                {feature.title}
              </h3>
              <p className="text-muted-foreground" data-testid={`feature-description-${index}`}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Code Editor Preview */}
        <div className="glass rounded-2xl p-8" data-testid="code-editor-preview">
          <h3 className="text-2xl font-semibold mb-6 text-center" data-testid="code-editor-title">
            AI-Powered Code Editor
          </h3>
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <div className="code-bg rounded-xl p-6 h-96 overflow-hidden" data-testid="code-display">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-gray-400 text-sm">app.js</div>
                </div>
                <div className="font-mono text-sm space-y-1">
                  {codeExample.split('\n').map((line, index) => (
                    <div key={index} className="syntax-white" data-testid={`code-line-${index}`}>
                      {line.includes('import') && <span className="syntax-keyword">import</span>}
                      {line.includes('from') && <span className="syntax-keyword"> from</span>}
                      {line.includes("'") && <span className="syntax-string">{line.match(/'[^']*'/)?.[0]}</span>}
                      {line.includes('function') && <span className="syntax-keyword">function</span>}
                      {line.includes('const') && <span className="syntax-keyword">const</span>}
                      {line.includes('//') && <span className="syntax-comment">{line.match(/\/\/.*/)?.[0]}</span>}
                      {line.replace(/import|from|function|const|\/\/.*/g, '').replace(/'[^']*'/g, '')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              {codeEditorFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="glass rounded-xl p-6"
                  data-testid={`editor-feature-${index}`}
                >
                  <h4 className="font-semibold mb-3 flex items-center" data-testid={`editor-feature-title-${index}`}>
                    {feature.icon}
                    {feature.title}
                  </h4>
                  <p className="text-muted-foreground text-sm" data-testid={`editor-feature-description-${index}`}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
