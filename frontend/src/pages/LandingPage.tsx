import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlickeringGrid } from '@/components/ui/flickering-grid-hero';
import FloatingNavbar from '@/components/common/FloatingNavbar';
import FloatingFooter from '@/components/common/FloatingFooter';
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
  Lightbulb,
  Code,
  Database,
  Palette,
  Monitor,
  Briefcase,
  Megaphone,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/state/userStore';
import usePageTitle from '@/hooks/usePageTitle';
import { useAccount } from "@azure/msal-react"; // MSAL Hooks

const LandingPage: React.FC = () => {
  usePageTitle('Home - Careerate');
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const { scrollYProgress } = useScroll();
  const activeAccount = useAccount(); // Get account info if needed for display name

  useEffect(() => {
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      // Trigger authentication flow
      navigate('/auth/login');
    }
  };

  // Background grid configurations
  const GRID_CONFIG = {
    background: {
      gridColor: "hsl(var(--primary-rgb))",
      maxOpacity: 0.15,
      flickerChance: 0.08,
      squareSize: 3,
      gridGap: 3,
    },
    logo: {
      gridColor: "hsl(var(--accent-rgb))",
      maxOpacity: 0.5,
      flickerChance: 0.12,
      squareSize: 2,
      gridGap: 4,
    },
  };

  const features = [
    {
      icon: <Brain className="h-8 w-8 text-primary" />,
      title: "AI-Powered Workflow Analysis",
      description: "Advanced neural networks analyze your work patterns to identify optimization opportunities and skill gaps in real-time.",
      color: "primary",
      stats: "98% accuracy"
    },
    {
      icon: <Target className="h-8 w-8 text-secondary" />,
      title: "Personalized Tool Recommendations",
      description: "Machine learning algorithms deliver tailored AI tool suggestions based on your domain, skill level, and productivity goals.",
      color: "secondary",
      stats: "300+ AI tools"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-accent" />,
      title: "Real-time Performance Tracking",
      description: "Monitor productivity gains with comprehensive analytics, trend analysis, and predictive insights.",
      color: "accent",
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-yellow-400" />,
      title: "Adaptive Learning Paths",
      description: "Dynamic curricula that evolve with your progress, ensuring optimal skill development trajectories.",
      color: "yellow",
      stats: "Personalized routes"
    },
    {
      icon: <Shield className="h-8 w-8 text-red-400" />,
      title: "Privacy-First Architecture",
      description: "Zero PII collection with end-to-end encryption. Your data remains private with local processing.",
      color: "red",
      stats: "100% secure"
    },
    {
      icon: <Zap className="h-8 w-8 text-cyan-400" />,
      title: "Instant AI Integration",
      description: "Chrome extension provides real-time recommendations as you work across 1000+ platforms.",
      color: "cyan",
    },
    { title: 'Personalized AI Insights', description: 'Tailored career advice based on your unique profile and goals.', icon: <Lightbulb size={28} className="text-primary" />, comingSoon: false },
    { title: 'Skill Gap Analysis', description: 'Identify and bridge the skill gaps for your desired career path.', icon: <TrendingUp size={28} className="text-accent" />, comingSoon: false },
    { title: 'Real-time Opportunity Matching', description: 'Discover relevant job openings and projects aligned with your skills.', icon: <Zap size={28} className="text-secondary" />, comingSoon: true },
    { title: 'Progress Tracking & Gamification', description: 'Monitor your career growth with interactive dashboards and achievements.', icon: <BarChart3 size={28} className="text-primary" />, comingSoon: false },
    { title: 'Community & Mentorship', description: 'Connect with peers and mentors for guidance and support.', icon: <Users size={28} className="text-accent" />, comingSoon: true },
    { title: 'Privacy First Design', description: 'You control your data. We ensure it is anonymized and protected.', icon: <ShieldCheck size={28} className="text-secondary" />, comingSoon: false },
  ];

  const stats = [
    { 
      value: "50%", 
      label: "Productivity Increase", 
      icon: <TrendingUp className="h-6 w-6" />,
      description: "Average productivity boost"
    },
    { 
      value: "500+", 
      label: "AI Tools Tracked", 
      icon: <Brain className="h-6 w-6" />,
      description: "Comprehensive tool database"
    },
    { 
      value: "25K+", 
      label: "Active Users", 
      icon: <Users className="h-6 w-6" />,
      description: "Growing community"
    },
    { 
      value: "99.2%", 
      label: "User Satisfaction", 
      icon: <Star className="h-6 w-6" />,
      description: "Verified reviews"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Senior Software Engineer",
      company: "Meta",
      content: "Careerate transformed my development workflow. The AI recommendations helped me discover tools that cut my coding time by 60%. It's like having a personal productivity advisor.",
      avatar: "SC",
      rating: 5,
      tools: ["GitHub Copilot", "Cursor", "Linear"]
    },
    {
      name: "Marcus Rodriguez",
      role: "Product Designer",
      company: "Spotify",
      content: "The workflow analysis opened my eyes to inefficiencies I never noticed. Now I'm 40% more productive with AI-powered design tools and automated workflows.",
      avatar: "MR", 
      rating: 5,
      tools: ["Midjourney", "Figma AI", "Notion AI"]
    },
    {
      name: "Dr. Emily Watson",
      role: "Research Scientist",
      company: "Stanford University",
      content: "Perfect for academics! It recommended research tools that transformed my paper writing and data analysis process. A game-changer for scientific productivity.",
      avatar: "EW",
      rating: 5,
      tools: ["Claude", "Perplexity", "Elicit"]
    }
  ];

  const pricingPlans = [
    {
      name: "Explorer",
      price: "$0",
      period: "forever",
      description: "Perfect for individuals exploring AI-powered productivity",
      features: [
        "Basic workflow tracking",
        "10 AI tool recommendations/month",
        "Simple productivity analytics",
        "Chrome extension access",
        "Community support",
        "Basic learning resources"
      ],
      highlighted: false,
      cta: "Start Free",
      popular: false
    },
    {
      name: "Professional",
      price: "$29",
      period: "per month",
      description: "For professionals serious about AI-accelerated growth",
      features: [
        "Advanced pattern analysis",
        "Unlimited recommendations",
        "Real-time insights & alerts",
        "Personalized learning paths",
        "Priority support",
        "Team collaboration tools",
        "Custom integrations",
        "Advanced analytics dashboard",
        "Weekly coaching calls"
      ],
      highlighted: true,
      cta: "Start 14-day Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "For teams and organizations scaling AI adoption",
      features: [
        "Everything in Professional",
        "Team analytics & insights",
        "SSO & admin controls",
        "Custom AI model training",
        "Dedicated success manager",
        "SLA guarantees",
        "On-premise deployment",
        "White-label options",
        "Advanced security features"
      ],
      highlighted: false,
      cta: "Contact Sales",
      popular: false
    }
  ];

  const industries = [
    { name: "Software Development", icon: <Code className="h-6 w-6" />, users: "12K+" },
    { name: "Data Science", icon: <Database className="h-6 w-6" />, users: "8K+" },
    { name: "Product Management", icon: <Briefcase className="h-6 w-6" />, users: "5K+" },
    { name: "Design", icon: <Palette className="h-6 w-6" />, users: "7K+" },
    { name: "Marketing", icon: <Megaphone className="h-6 w-6" />, users: "6K+" },
    { name: "Content Creation", icon: <Monitor className="h-6 w-6" />, users: "4K+" }
  ];

  // Personalized welcome if authenticated
  const welcomeMessage = isAuthenticated && activeAccount?.name ? `Welcome back, ${activeAccount.name.split(' ')[0]}!` : "AI-Powered Career Acceleration Platform";

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden w-full">
      <FloatingNavbar />

      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center text-center overflow-hidden cyber-grid-bg">
        <FlickeringGrid
          {...GRID_CONFIG.background}
          className="absolute inset-0 z-0"
        />
        <motion.div 
          className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <Badge variant="default" className="mb-6 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 px-4 py-1.5 text-sm font-medium">
            {welcomeMessage}
          </Badge>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8">
            <span className="block text-foreground">Master AI Tools.</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
              Accelerate Your Career.
            </span>
          </h1>
          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-muted-foreground mb-10">
            Discover, learn, and master the perfect AI tools for your workflow. Get personalized
            recommendations, track your productivity gains, and join <strong className="text-foreground font-semibold">25,000+ professionals</strong>
            transforming their careers.
          </p>
          <Button 
            size="lg" 
            className="px-10 py-7 text-lg font-semibold bg-primary hover:bg-primary-hover text-primary-foreground rounded-full shadow-lg shadow-primary/30 transition-all duration-300 transform hover:scale-105"
            onClick={handleGetStarted}
          >
            Start Your AI Journey <ArrowRight className="ml-3 h-5 w-5" />
          </Button>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Unlock Your Potential
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Careerate provides a comprehensive suite of AI-powered tools to help you navigate the complexities of the modern tech landscape.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="glass-card border-primary/20 card-hover h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                        {feature.icon}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {feature.stats}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-semibold text-foreground">
                      {feature.title}
                    </CardTitle>
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

      {/* Industries Section */}
      <section className="py-20 bg-muted/5">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-4 text-gradient">
              Trusted Across Industries
            </h2>
            <p className="text-lg text-muted-foreground">
              Join professionals from leading companies and industries
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {industries.map((industry, index) => (
              <motion.div
                key={industry.name}
                className="glass-card p-6 text-center card-hover border border-primary/10"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex justify-center mb-3 text-primary">
                  {industry.icon}
                </div>
                <h3 className="font-semibold text-sm mb-1">{industry.name}</h3>
                <p className="text-xs text-muted-foreground">{industry.users} users</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="w-full py-20 md:py-32 bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Loved by Professionals Worldwide
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Hear what leading tech professionals are saying about their Careerate journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="glass-card border-secondary/20 card-hover h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-secondary-foreground font-bold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                      </div>
                    </div>
                    <div className="flex space-x-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 leading-relaxed italic">
                      "{testimonial.content}"
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {testimonial.tools.map((tool) => (
                        <Badge key={tool} variant="secondary" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Flexible Pricing for Every Ambition
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that aligns with your career goals and unlock your full potential.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1 neon-glow">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <Card className={`glass-card card-hover h-full ${
                  plan.highlighted 
                    ? 'border-primary/50 ring-2 ring-primary/20 bg-primary/5' 
                    : 'border-primary/20'
                }`}>
                  <CardHeader>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-gradient">{plan.price}</span>
                        {plan.price !== "Custom" && (
                          <span className="text-muted-foreground">/{plan.period}</span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">{plan.description}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      className={`w-full pixel-btn ${
                        plan.highlighted 
                          ? 'bg-primary hover:bg-primary/90 neon-glow' 
                          : 'bg-secondary hover:bg-secondary/90'
                      }`}
                      onClick={handleGetStarted}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full py-20 md:py-32 cyber-grid-bg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            viewport={{ once: true }}
          >
            <Sparkles className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-6 text-foreground">
              Ready to Transform Your Career?
            </h2>
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground mb-10">
              Join thousands of professionals who are already leveraging AI to accelerate
              their progress and achieve their career ambitions.
            </p>
            <Button
              size="lg"
              className="px-10 py-7 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-full shadow-xl shadow-primary/40 transition-all duration-300 transform hover:scale-105 focus:ring-4 ring-primary/50"
              onClick={handleGetStarted}
            >
              {isAuthenticated ? "Go to Dashboard" : "Start Your Free Trial"}
            </Button>
          </motion.div>
        </div>
      </section>

      <FloatingFooter />
    </div>
  );
};

export default LandingPage; 