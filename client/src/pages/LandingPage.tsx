import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Zap, 
  Target, 
  TrendingUp, 
  Shield, 
  Users, 
  CheckCircle,
  ArrowRight,
  Star,
  Sparkles,
  BarChart3,
  Clock,
  Globe,
  ChevronRight,
  Play,
  Award,
  Lightbulb,
  Rocket
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/state/userStore';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const [isVisible, setIsVisible] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      // Trigger authentication flow
      navigate('/auth/login');
    }
  };

  const features = [
    {
      icon: <Brain className="h-8 w-8 text-blue-500" />,
      title: "AI-Powered Analysis",
      description: "Advanced AI agents analyze your workflow patterns to identify optimization opportunities and skill gaps.",
      color: "blue"
    },
    {
      icon: <Target className="h-8 w-8 text-green-500" />,
      title: "Personalized Recommendations",
      description: "Get tailored AI tool suggestions based on your work domain, skill level, and productivity goals.",
      color: "green"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-purple-500" />,
      title: "Productivity Tracking",
      description: "Monitor your productivity gains with comprehensive analytics and real-time insights.",
      color: "purple"
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-orange-500" />,
      title: "Learning Paths",
      description: "Follow personalized curricula designed to help you master AI tools efficiently.",
      color: "orange"
    },
    {
      icon: <Shield className="h-8 w-8 text-red-500" />,
      title: "Privacy First",
      description: "Zero PII collection with end-to-end encryption. Your data stays private and secure.",
      color: "red"
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      title: "Real-time Insights",
      description: "Get instant recommendations as you work with our Chrome extension integration.",
      color: "yellow"
    }
  ];

  const stats = [
    { value: "30-50%", label: "Productivity Increase", icon: <TrendingUp className="h-6 w-6" /> },
    { value: "200+", label: "AI Tools Tracked", icon: <Brain className="h-6 w-6" /> },
    { value: "10K+", label: "Active Users", icon: <Users className="h-6 w-6" /> },
    { value: "95%", label: "User Satisfaction", icon: <Star className="h-6 w-6" /> }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer",
      company: "TechCorp",
      content: "Careerate helped me discover AI tools that cut my development time in half. The personalized recommendations are spot-on!",
      avatar: "SC"
    },
    {
      name: "Marcus Rodriguez",
      role: "Content Creator",
      company: "Creative Agency",
      content: "The workflow analysis opened my eyes to inefficiencies I never noticed. Now I'm 40% more productive with AI assistance.",
      avatar: "MR"
    },
    {
      name: "Dr. Emily Watson",
      role: "Research Scientist",
      company: "University",
      content: "Perfect for academics! It recommended research tools that transformed my workflow and paper writing process.",
      avatar: "EW"
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for individuals getting started with AI tools",
      features: [
        "Basic workflow tracking",
        "5 AI tool recommendations/month",
        "Simple productivity analytics",
        "Chrome extension access",
        "Community support"
      ],
      highlighted: false
    },
    {
      name: "Pro",
      price: "$19",
      period: "per month",
      description: "For professionals serious about AI-powered productivity",
      features: [
        "Advanced pattern analysis",
        "Unlimited recommendations",
        "Real-time insights",
        "Personalized learning paths",
        "Priority support",
        "Team collaboration tools",
        "Custom integrations"
      ],
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "For teams and organizations at scale",
      features: [
        "Everything in Pro",
        "Team analytics dashboard",
        "SSO integration",
        "Custom AI model training",
        "Dedicated account manager",
        "SLA guarantees",
        "On-premise deployment"
      ],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900">
      {/* Hero Section */}
      <motion.section 
        className="relative overflow-hidden"
        style={{ opacity }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 dark:from-blue-400/10 dark:to-purple-400/10" />
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="flex items-center justify-center gap-2 mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 mr-2" />
                AI-Powered Career Acceleration
              </Badge>
            </motion.div>
            
            <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">
              Master AI Tools.<br />
              Accelerate Your Career.
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Discover personalized AI tool recommendations based on your workflow patterns. 
              Boost productivity by 30-50% with intelligent automation and learning paths.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Rocket className="h-5 w-5 mr-2" />
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-6 text-lg font-semibold rounded-xl border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Play className="h-5 w-5 mr-2" />
                Watch Demo
              </Button>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Privacy first
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Free forever plan
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex justify-center mb-3 text-blue-600 dark:text-blue-400">
                  {stat.icon}
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Intelligent AI Tool Discovery
            </h2>
            <p className="text-xl text-muted-foreground">
              Our advanced AI agents analyze your work patterns to recommend the perfect tools for your workflow.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="cursor-pointer"
              >
                <Card className="h-full bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-2 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <CardHeader>
                    <div className="mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              How Careerate Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Three simple steps to transform your productivity with AI-powered insights.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-12">
            {[
              {
                step: "1",
                title: "Install & Connect",
                description: "Install our Chrome extension and connect your workflow tools for privacy-first activity tracking.",
                icon: <Globe className="h-12 w-12" />
              },
              {
                step: "2", 
                title: "AI Analysis",
                description: "Our AI agents analyze your patterns and identify optimization opportunities in your workflow.",
                icon: <BarChart3 className="h-12 w-12" />
              },
              {
                step: "3",
                title: "Get Recommendations",
                description: "Receive personalized AI tool recommendations with learning paths and implementation guides.",
                icon: <Award className="h-12 w-12" />
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-2xl font-bold mb-4">
                    {step.step}
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 mb-4">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Loved by Professionals
            </h2>
            <p className="text-xl text-muted-foreground">
              See how Careerate is transforming careers across industries.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role} at {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative ${plan.highlighted ? 'scale-105' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <Card className={`h-full ${plan.highlighted ? 'border-blue-500 shadow-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/50 dark:to-purple-900/50' : 'bg-white dark:bg-slate-800'}`}>
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    <p className="text-muted-foreground mt-2">{plan.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${plan.highlighted ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' : ''}`}
                      variant={plan.highlighted ? 'default' : 'outline'}
                    >
                      {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Ready to Accelerate Your Career?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Join thousands of professionals who are already using AI to boost their productivity and advance their careers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="px-8 py-6 text-lg font-semibold bg-white text-blue-600 hover:bg-blue-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Rocket className="h-5 w-5 mr-2" />
                Start Free Today
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-6 text-lg font-semibold rounded-xl border-2 border-white text-white hover:bg-white/10"
              >
                <Clock className="h-5 w-5 mr-2" />
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Careerate</h3>
              <p className="text-slate-400 mb-4">
                AI-powered career acceleration platform helping professionals discover and master the right tools.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Chrome Extension</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Careerate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 