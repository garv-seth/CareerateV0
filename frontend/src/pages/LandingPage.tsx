import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Cloud, Code, Shield, Zap, BarChart3, GitBranch, Server, Bot, Users, Star, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

    const features = [
        {
            icon: <Bot className="w-8 h-8" />,
            title: "Multi-Agent AI System",
            description: "Specialized AI agents for Terraform, Kubernetes, AWS, monitoring, and incident response",
            gradient: "from-blue-500 to-cyan-500"
        },
        {
            icon: <Cloud className="w-8 h-8" />,
            title: "Multi-Cloud Management",
            description: "Natural language interface to AWS, Azure, and GCP with unified observability",
            gradient: "from-purple-500 to-pink-500"
        },
        {
            icon: <Code className="w-8 h-8" />,
            title: "Infrastructure as Code",
            description: "Generate, validate, and deploy Terraform configurations with AI assistance",
            gradient: "from-green-500 to-emerald-500"
        },
        {
            icon: <Shield className="w-8 h-8" />,
            title: "DevSecOps Automation",
            description: "Automated security scanning, compliance checks, and vulnerability management",
            gradient: "from-red-500 to-orange-500"
        },
        {
            icon: <BarChart3 className="w-8 h-8" />,
            title: "Cost Optimization",
            description: "AI-driven cost analysis and recommendations to optimize cloud spending",
            gradient: "from-yellow-500 to-amber-500"
        },
        {
            icon: <Zap className="w-8 h-8" />,
            title: "Real-time Monitoring",
            description: "Intelligent alerting and automated incident response with context-aware AI",
            gradient: "from-indigo-500 to-blue-500"
        }
    ];

    const stats = [
        { value: "99.9%", label: "Uptime" },
        { value: "50%", label: "Cost Reduction" },
        { value: "10x", label: "Faster Deployment" },
        { value: "24/7", label: "AI Support" }
    ];

    const competitors = [
        { name: "Traditional DevOps", setup: "Weeks", learning: "Months", cost: "High" },
        { name: "a37.ai", setup: "Days", learning: "Weeks", cost: "Medium" },
        { name: "Careerate", setup: "Minutes", learning: "Hours", cost: "Low" }
    ];

    return (
        <div className="relative bg-white dark:bg-gray-950 overflow-x-hidden">
            {/* Animated background */}
            <div className="fixed inset-0 pointer-events-none">
                <div 
                    className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl"
                    style={{
                        left: mousePosition.x - 192,
                        top: mousePosition.y - 192,
                        transition: 'all 0.3s ease-out'
                    }}
                />
            </div>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
                <motion.div 
                    className="text-center max-w-6xl mx-auto"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Badge className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none">
                        <Star className="w-4 h-4 mr-2" />
                        Next-Generation DevOps Platform
                    </Badge>
                    
                    <h1 className="text-5xl md:text-8xl font-black mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent leading-tight">
                        AI DevOps
                        <br />
                        <span className="text-4xl md:text-6xl">Reimagined</span>
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                        Transform your infrastructure management with intelligent AI agents that understand your entire DevOps stack. 
                        From natural language to production-ready infrastructure.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button 
                            onClick={handleGetStarted}
                            size="lg"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6 rounded-full shadow-2xl hover:shadow-purple-500/25"
                        >
                            Start Building
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        
                        <Button 
                            variant="outline" 
                            size="lg"
                            className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 text-lg px-8 py-6 rounded-full"
                        >
                            <Play className="mr-2 h-5 w-5" />
                            Watch Demo
                        </Button>
                    </div>
                </motion.div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                className="text-center"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <div className="text-4xl md:text-5xl font-black text-blue-600 mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-gray-600 dark:text-gray-300 font-medium">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <motion.div 
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                            Beyond Traditional DevOps
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            Experience the future of infrastructure management with AI-powered automation that understands your needs
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -10 }}
                            >
                                <Card className="h-full border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                    <CardContent className="p-8">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-white mb-6`}>
                                            {feature.icon}
                                        </div>
                                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comparison Section */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-6xl mx-auto px-4">
                    <motion.div 
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-6xl font-black mb-6 text-gray-900 dark:text-white">
                            Why Choose Careerate?
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            See how we compare to traditional DevOps and other AI-powered solutions
                        </p>
                    </motion.div>

                    <div className="overflow-x-auto">
                        <table className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left p-6 font-bold text-gray-900 dark:text-white">Platform</th>
                                    <th className="text-center p-6 font-bold text-gray-900 dark:text-white">Setup Time</th>
                                    <th className="text-center p-6 font-bold text-gray-900 dark:text-white">Learning Curve</th>
                                    <th className="text-center p-6 font-bold text-gray-900 dark:text-white">Cost Impact</th>
                                </tr>
                            </thead>
                            <tbody>
                                {competitors.map((comp, index) => (
                                    <tr key={index} className={`border-b border-gray-200 dark:border-gray-700 ${comp.name === 'Careerate' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                        <td className="p-6">
                                            <div className="flex items-center">
                                                {comp.name === 'Careerate' && <Star className="w-5 h-5 text-yellow-500 mr-2" />}
                                                <span className={`font-semibold ${comp.name === 'Careerate' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                                    {comp.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-center p-6 text-gray-600 dark:text-gray-300">{comp.setup}</td>
                                        <td className="text-center p-6 text-gray-600 dark:text-gray-300">{comp.learning}</td>
                                        <td className="text-center p-6">
                                            <Badge variant={comp.cost === 'Low' ? 'default' : comp.cost === 'Medium' ? 'secondary' : 'destructive'}>
                                                {comp.cost}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-6xl font-black mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Ready to Transform Your DevOps?
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                            Join teams already using AI to revolutionize their infrastructure management
                        </p>
                        <Button 
                            onClick={handleGetStarted}
                            size="lg"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xl px-12 py-8 rounded-full shadow-2xl hover:shadow-purple-500/25"
                        >
                            Start Your Free Trial
                            <ArrowRight className="ml-3 h-6 w-6" />
                        </Button>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage; 