import { useState } from "react";
import { Link } from "wouter";
import { 
  Sparkles, Code, Cloud, Shield, Brain, Rocket, 
  ArrowRight, Play, Star, Users, Activity, Globe,
  Database, Terminal, MessageSquare, Zap, GitBranch,
  ChevronDown, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{background: "linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)"}}>
      {/* Modern Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Careerate</span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Activity className="h-3 w-3 mr-1" />
                v2.0 Live
              </Badge>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <div className="flex items-center space-x-6">
                <span className="text-white/70 hover:text-white cursor-pointer transition-colors">Features</span>
                <span className="text-white/70 hover:text-white cursor-pointer transition-colors">Pricing</span>
                <span className="text-white/70 hover:text-white cursor-pointer transition-colors">Docs</span>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => window.location.href = '/api/login'}
                >
                  Sign In
                </Button>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  onClick={() => window.location.href = '/api/login'}
                >
                  Get Started
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Powered by GPT-5 & Advanced AI Agents
            </Badge>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Build Anything with
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> AI Agents</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/70 max-w-4xl mx-auto mb-12 leading-relaxed">
            From idea to production in minutes. Our AI agents handle coding, deployment, monitoring, and maintenance so you can focus on building amazing products.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 text-lg"
              onClick={() => window.location.href = '/api/login'}
            >
              <Rocket className="h-5 w-5 mr-2" />
              Start Building Now
            </Button>
            <Button 
              size="lg"
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg"
            >
              <Play className="h-5 w-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Code className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Vibe Coding</h3>
              <p className="text-white/60">Natural language to production-ready code with real-time collaboration</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Cloud className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Vibe Hosting</h3>
              <p className="text-white/60">Multi-cloud deployment with AI-managed infrastructure and scaling</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">DevSecOps</h3>
              <p className="text-white/60">Enterprise migration and security with autonomous maintenance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              The Most Advanced AI Development Platform
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Built for the future of software development with cutting-edge AI agents and enterprise-grade infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "GPT-5 Powered",
                description: "Latest AI models for superior code generation and analysis",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: Globe,
                title: "100+ Integrations",
                description: "Connect GitHub, AWS, Stripe, Datadog, and 100+ more services",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Users,
                title: "Real-time Collaboration",
                description: "Live cursors, presence, and collaborative editing like never before",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: Database,
                title: "Enterprise Security",
                description: "Azure KeyVault encryption and SOC 2 Type II compliance",
                color: "from-orange-500 to-red-500"
              },
              {
                icon: Terminal,
                title: "Multi-Cloud Deploy",
                description: "Deploy anywhere with natural language commands",
                color: "from-indigo-500 to-purple-500"
              },
              {
                icon: Activity,
                title: "Autonomous Agents",
                description: "AI handles monitoring, scaling, and maintenance 24/7",
                color: "from-pink-500 to-rose-500"
              }
            ].map((feature, index) => (
              <Card key={index} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-white/70">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl p-12 border border-purple-500/30 backdrop-blur-md">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Build the Future?
            </h2>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Join thousands of developers using AI agents to build, deploy, and scale applications faster than ever before.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 text-lg"
                onClick={() => window.location.href = '/api/login'}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start Building Free
              </Button>
              <Button 
                size="lg"
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Talk to Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Careerate</span>
              </div>
              <p className="text-white/60">
                The most advanced AI development platform for building, deploying, and scaling applications.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Platform</h3>
              <div className="space-y-2">
                <p className="text-white/60 hover:text-white cursor-pointer transition-colors">Vibe Coding</p>
                <p className="text-white/60 hover:text-white cursor-pointer transition-colors">Vibe Hosting</p>
                <p className="text-white/60 hover:text-white cursor-pointer transition-colors">Enterprise Migration</p>
                <p className="text-white/60 hover:text-white cursor-pointer transition-colors">Integrations</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <div className="space-y-2">
                <p className="text-white/60 hover:text-white cursor-pointer transition-colors">About</p>
                <p className="text-white/60 hover:text-white cursor-pointer transition-colors">Careers</p>
                <p className="text-white/60 hover:text-white cursor-pointer transition-colors">Contact</p>
                <p className="text-white/60 hover:text-white cursor-pointer transition-colors">Security</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Resources</h3>
              <div className="space-y-2">
                <p className="text-white/60 hover:text-white cursor-pointer transition-colors">Documentation</p>
                <p className="text-white/60 hover:text-white cursor-pointer transition-colors">API Reference</p>
                <p className="text-white/60 hover:text-white cursor-pointer transition-colors">Status</p>
                <p className="text-white/60 hover:text-white cursor-pointer transition-colors">Support</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-12 pt-8 flex items-center justify-between">
            <p className="text-white/60">© 2025 Careerate. All rights reserved.</p>
            <div className="flex items-center space-x-6">
              <Link href="/privacy">
                <span className="text-white/60 hover:text-white cursor-pointer transition-colors">Privacy</span>
              </Link>
              <Link href="/terms">
                <span className="text-white/60 hover:text-white cursor-pointer transition-colors">Terms</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
