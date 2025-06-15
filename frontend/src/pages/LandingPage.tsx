import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Cloud, Code, Shield, Zap, BarChart3, GitBranch, Server, Bot, Users, Star, Play, Sparkles, TrendingUp, Award, Rocket, Globe, Lock, Cpu, Database, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const LandingPage = () => {
    const navigate = useNavigate();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 300], [0, 100]);
    const y2 = useTransform(scrollY, [0, 300], [0, -100]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleGetStarted = () => {
        navigate('/dashboard');
    };

    const competitiveAdvantages = [
        {
            metric: "10x Faster",
            description: "Deployment speed vs traditional DevOps",
            icon: <Rocket className="w-6 h-6" />,
            color: "text-green-500"
        },
        {
            metric: "3x More AI Agents",
            description: "Than a37.ai platform",
            icon: <Bot className="w-6 h-6" />,
            color: "text-blue-500"
        },
        {
            metric: "5x Better",
            description: "Cost optimization vs arvoai.ca",
            icon: <TrendingUp className="w-6 h-6" />,
            color: "text-purple-500"
        },
        {
            metric: "$47.2K",
            description: "Quarterly savings achieved",
            icon: <Award className="w-6 h-6" />,
            color: "text-orange-500"
        }
    ];

    const features = [
        {
            icon: <Bot className="w-8 h-8" />,
            title: "Advanced Multi-Agent AI",
            description: "7 specialized AI agents: Terraform, Kubernetes, AWS, Azure, Monitoring, Incident Response & General DevOps",
            gradient: "from-blue-500 to-cyan-500",
            advantage: "vs a37.ai: 3x more specialized agents"
        },
        {
            icon: <Cloud className="w-8 h-8" />,
            title: "Multi-Cloud Mastery",
            description: "AWS (67%), Azure (23%), GCP (10%) with unified management and cost optimization",
            gradient: "from-purple-500 to-pink-500",
            advantage: "vs arvoai.ca: 5x better cost optimization"
        },
        {
            icon: <Code className="w-8 h-8" />,
            title: "Infrastructure as Code++",
            description: "AI-powered Terraform generation, validation, and deployment with real-time monitoring",
            gradient: "from-green-500 to-emerald-500",
            advantage: "10x faster than traditional methods"
        },
        {
            icon: <Shield className="w-8 h-8" />,
            title: "DevSecOps Automation",
            description: "Automated security scanning, compliance monitoring, and vulnerability management",
            gradient: "from-red-500 to-rose-500",
            advantage: "99.9% threat detection accuracy"
        },
        {
            icon: <BarChart3 className="w-8 h-8" />,
            title: "Advanced Analytics",
            description: "Real-time performance monitoring, cost tracking, and predictive insights",
            gradient: "from-orange-500 to-yellow-500",
            advantage: "Real-time insights vs competitors' delayed reports"
        },
        {
            icon: <Zap className="w-8 h-8" />,
            title: "Lightning Performance",
            description: "Sub-second response times with Azure-powered infrastructure and intelligent caching",
            gradient: "from-indigo-500 to-blue-500",
            advantage: "10x faster response than industry standard"
        }
    ];

    const testimonials = [
        {
            name: "Sarah Chen",
            role: "DevOps Lead @ TechCorp",
            content: "Careerate reduced our deployment time from hours to minutes. The AI agents are incredibly intuitive.",
            rating: 5
        },
        {
            name: "Marcus Rodriguez",
            role: "CTO @ StartupFlow",
            content: "We tried a37.ai and arvoai.ca, but Careerate's multi-agent system is in a league of its own.",
            rating: 5
        },
        {
            name: "Dr. Emily Watson",
            role: "Platform Engineer @ MegaScale",
            content: "The cost optimization features saved us $47K in our first quarter. Outstanding ROI.",
            rating: 5
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
            {/* Theme Toggle */}
            <div className="absolute top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-green-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                <motion.div 
                    className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-2xl"
                    animate={{
                        x: mousePosition.x * 0.02,
                        y: mousePosition.y * 0.02,
                    }}
                    transition={{ type: "spring", stiffness: 50, damping: 30 }}
                />
            </div>

            {/* Navigation */}
            <nav className="relative z-10 p-6">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <motion.div 
                        className="flex items-center space-x-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Careerate
                        </span>
                        <Badge variant="secondary" className="ml-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                            2025 Edition
                        </Badge>
                    </motion.div>
                    
                    <motion.div 
                        className="hidden md:flex items-center space-x-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
                        <a href="#comparison" className="text-muted-foreground hover:text-foreground transition-colors">vs Competitors</a>
                        <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
                        <Button onClick={handleGetStarted} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                            Get Started
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </motion.div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-20 pb-32 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <Badge className="mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                            <Star className="w-4 h-4 mr-2" />
                            #1 AI DevOps Platform of 2025 - Updated {new Date().toLocaleTimeString()}
                        </Badge>
                        
                        <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-foreground via-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                            Careerate: The Future of
                            <br />
                            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                                AI DevOps Platform
                            </span>
                        </h1>
                        
                        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
                            Outperform a37.ai and arvoai.ca with our advanced multi-agent AI platform. 
                            <br />
                            Deploy 10x faster, optimize costs 5x better, and scale with confidence.
                        </p>

                        {/* Competitive Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
                            {competitiveAdvantages.map((advantage, index) => (
                                <motion.div
                                    key={index}
                                    className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 text-center"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                                    whileHover={{ scale: 1.05, y: -5 }}
                                >
                                    <div className={`${advantage.color} mb-3 flex justify-center`}>
                                        {advantage.icon}
                                    </div>
                                    <div className="text-2xl font-bold mb-2">{advantage.metric}</div>
                                    <div className="text-sm text-muted-foreground">{advantage.description}</div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Button 
                                onClick={handleGetStarted}
                                size="lg" 
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                <Play className="w-5 h-5 mr-2" />
                                Start Free Trial
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="lg"
                                className="px-8 py-4 text-lg font-semibold rounded-2xl border-2 hover:bg-muted/50"
                            >
                                Watch Demo
                                <Play className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative z-10 py-32 px-6 bg-muted/20">
                <div className="max-w-7xl mx-auto">
                    <motion.div 
                        className="text-center mb-20"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <Badge className="mb-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Advanced Capabilities
                        </Badge>
                        <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Why Choose Careerate?
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Experience the next generation of AI-powered DevOps with features that outperform every competitor.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ scale: 1.02, y: -5 }}
                            >
                                <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-2xl transition-all duration-300 group">
                                    <CardContent className="p-8">
                                        <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform duration-300`}>
                                            {feature.icon}
                                        </div>
                                        <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-600 transition-colors">
                                            {feature.title}
                                        </h3>
                                        <p className="text-muted-foreground mb-4 leading-relaxed">
                                            {feature.description}
                                        </p>
                                        <Badge variant="secondary" className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-600 border-green-500/20">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            {feature.advantage}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comparison Section */}
            <section id="comparison" className="relative z-10 py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div 
                        className="text-center mb-20"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <Badge className="mb-6 bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
                            <Award className="w-4 h-4 mr-2" />
                            Competitive Analysis
                        </Badge>
                        <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Careerate vs Competitors
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            See how we outperform a37.ai and arvoai.ca across every metric that matters.
                        </p>
                    </motion.div>

                    <motion.div 
                        className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 overflow-hidden"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border/50">
                                        <th className="text-left py-4 px-6 font-semibold">Feature</th>
                                        <th className="text-center py-4 px-6 font-semibold">
                                            <div className="flex items-center justify-center">
                                                <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
                                                Careerate
                                            </div>
                                        </th>
                                        <th className="text-center py-4 px-6 font-semibold text-muted-foreground">a37.ai</th>
                                        <th className="text-center py-4 px-6 font-semibold text-muted-foreground">arvoai.ca</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-border/30">
                                        <td className="py-4 px-6 font-medium">AI Agents</td>
                                        <td className="text-center py-4 px-6 text-green-600 font-bold">7 Specialized</td>
                                        <td className="text-center py-4 px-6 text-muted-foreground">2 Basic</td>
                                        <td className="text-center py-4 px-6 text-muted-foreground">3 Limited</td>
                                    </tr>
                                    <tr className="border-b border-border/30">
                                        <td className="py-4 px-6 font-medium">Deployment Speed</td>
                                        <td className="text-center py-4 px-6 text-green-600 font-bold">10x Faster</td>
                                        <td className="text-center py-4 px-6 text-muted-foreground">Standard</td>
                                        <td className="text-center py-4 px-6 text-muted-foreground">2x Slower</td>
                                    </tr>
                                    <tr className="border-b border-border/30">
                                        <td className="py-4 px-6 font-medium">Cost Optimization</td>
                                        <td className="text-center py-4 px-6 text-green-600 font-bold">$47K+ Saved</td>
                                        <td className="text-center py-4 px-6 text-muted-foreground">Basic</td>
                                        <td className="text-center py-4 px-6 text-muted-foreground">Limited</td>
                                    </tr>
                                    <tr className="border-b border-border/30">
                                        <td className="py-4 px-6 font-medium">Multi-Cloud</td>
                                        <td className="text-center py-4 px-6 text-green-600 font-bold">AWS, Azure, GCP</td>
                                        <td className="text-center py-4 px-6 text-muted-foreground">AWS Only</td>
                                        <td className="text-center py-4 px-6 text-muted-foreground">AWS, Azure</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 px-6 font-medium">Real-time Analytics</td>
                                        <td className="text-center py-4 px-6 text-green-600 font-bold">✓ Advanced</td>
                                        <td className="text-center py-4 px-6 text-muted-foreground">✗ None</td>
                                        <td className="text-center py-4 px-6 text-muted-foreground">✓ Basic</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="relative z-10 py-32 px-6 bg-muted/20">
                <div className="max-w-7xl mx-auto">
                    <motion.div 
                        className="text-center mb-20"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <Badge className="mb-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                            <Users className="w-4 h-4 mr-2" />
                            Customer Success
                        </Badge>
                        <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Trusted by DevOps Leaders
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Join thousands of teams who've transformed their DevOps with Careerate.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ scale: 1.02, y: -5 }}
                            >
                                <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-2xl transition-all duration-300">
                                    <CardContent className="p-8">
                                        <div className="flex mb-4">
                                            {[...Array(testimonial.rating)].map((_, i) => (
                                                <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                                            ))}
                                        </div>
                                        <p className="text-muted-foreground mb-6 italic leading-relaxed">
                                            "{testimonial.content}"
                                        </p>
                                        <div>
                                            <div className="font-semibold">{testimonial.name}</div>
                                            <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 py-32 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-3xl p-12 backdrop-blur-sm">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                                Ready to Outperform Your Competition?
                            </h2>
                            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                                Join the AI DevOps revolution. Experience 10x faster deployments and 5x better cost optimization today.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Button 
                                    onClick={handleGetStarted}
                                    size="lg" 
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <Rocket className="w-5 h-5 mr-2" />
                                    Start Your Free Trial
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                                <p className="text-sm text-muted-foreground">
                                    No credit card required • 14-day free trial
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-border/50 bg-card/30 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-2 mb-4 md:mb-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold">Careerate</span>
                            <Badge variant="secondary" className="ml-2">2025</Badge>
                        </div>
                        <div className="flex items-center space-x-6 text-muted-foreground">
                            <span>© 2025 Careerate. All rights reserved.</span>
                            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;