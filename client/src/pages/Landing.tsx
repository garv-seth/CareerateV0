import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { SpiralAnimation } from "@/components/SpiralAnimation";
import { 
  Bot, 
  Lightbulb, 
  TrendingUp, 
  GraduationCap, 
  FileText, 
  Shield,
  Star,
  Check,
  Twitter,
  Linkedin,
  Github
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Bot,
      title: "Personal AI Assistant",
      description: "Your dedicated AI companion that learns your work style, preferences, and career goals to provide tailored guidance.",
      color: "primary"
    },
    {
      icon: Lightbulb,
      title: "Smart Tool Recommendations",
      description: "Discover AI tools perfectly matched to your role, workflow, and industry with contextual implementation guides.",
      color: "secondary"
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description: "Monitor your AI adoption journey with detailed analytics, skill assessments, and milestone achievements.",
      color: "primary"
    },
    {
      icon: GraduationCap,
      title: "Interactive Learning",
      description: "Hands-on tutorials and guided implementations to master AI tools within your existing workflow.",
      color: "secondary"
    },
    {
      icon: FileText,
      title: "Resume Enhancement",
      description: "AI-powered resume analysis and optimization to showcase your growing AI expertise to employers.",
      color: "primary"
    },
    {
      icon: Shield,
      title: "Privacy-First Design",
      description: "Enterprise-grade security with encrypted storage and zero-trust architecture protecting your data.",
      color: "secondary"
    }
  ];

  const testimonials = [
    {
      name: "Alex Rodriguez",
      role: "Senior DevOps Engineer",
      content: "Careerate helped me identify and implement AI tools that reduced my deployment time by 40%. The personalized recommendations were spot-on for my workflow.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    },
    {
      name: "Maria Santos",
      role: "Product Manager",
      content: "The AI assistant understood my role perfectly and suggested tools that transformed how I analyze user data. I got promoted within 6 months of starting.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    },
    {
      name: "David Kim",
      role: "Full Stack Developer",
      content: "From a junior developer to team lead in 8 months. Careerate's learning paths and tool recommendations gave me the edge I needed in today's AI-driven market.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for getting started",
      features: [
        "Personal AI assistant",
        "Basic tool recommendations",
        "Progress tracking",
        "5 AI tools per month"
      ],
      buttonText: "Start Free",
      buttonVariant: "outline" as const
    },
    {
      name: "Professional",
      price: "$29",
      priceUnit: "/month",
      description: "For career acceleration",
      features: [
        "Everything in Starter",
        "Advanced AI recommendations",
        "Resume optimization",
        "Unlimited AI tools",
        "Priority support"
      ],
      buttonText: "Get Professional",
      buttonVariant: "default" as const,
      popular: true
    },
    {
      name: "Enterprise",
      price: "$99",
      priceUnit: "/month",
      description: "For teams and organizations",
      features: [
        "Everything in Professional",
        "Team analytics dashboard",
        "Custom integrations",
        "Dedicated account manager",
        "SSO & enterprise security"
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const
    }
  ];

  const handleGetStarted = () => {
    window.location.href = "/api/login";
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <FloatingNavbar />
      
      {/* Hero Section */}
      <section className="spiral-bg min-h-screen flex items-center justify-center px-6 py-24 relative overflow-hidden">
        <SpiralAnimation />
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Master <span className="text-primary">AI</span> for Your<br />
              <span className="text-secondary">Career Success</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Personalized AI guidance to help tech professionals adapt, learn, and leverage cutting-edge AI tools for accelerated career growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                className="px-8 py-4 text-lg font-medium shadow-lg hover:shadow-xl"
                onClick={handleGetStarted}
              >
                Start Your AI Journey
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-4 text-lg font-medium"
                onClick={() => scrollToSection('dashboard')}
              >
                Watch Demo
              </Button>
            </div>
          </motion.div>
          
          {/* Stats Section */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-muted-foreground">Professionals Empowered</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary mb-2">95%</div>
              <div className="text-muted-foreground">Career Advancement Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">200+</div>
              <div className="text-muted-foreground">AI Tools Integrated</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              AI-Powered Career <span className="text-primary">Intelligence</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our advanced AI platform provides personalized guidance, tool recommendations, and progress tracking to accelerate your professional growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full card-hover">
                  <CardHeader>
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 ${
                      feature.color === 'primary' ? 'bg-primary' : 'bg-secondary'
                    }`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-6">
                      {feature.description}
                    </p>
                    <div className="flex items-center text-primary font-medium">
                      Learn More <TrendingUp className="w-4 h-4 ml-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section id="dashboard" className="py-24 px-6 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Your AI Career <span className="text-secondary">Command Center</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A comprehensive dashboard that provides real-time insights, personalized recommendations, and progress tracking for your AI-enhanced career journey.
            </p>
          </div>

          <motion.div
            className="bg-card rounded-3xl shadow-2xl overflow-hidden border"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {/* Dashboard Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold mb-1">Sarah Chen</h3>
                  <p className="opacity-90">Senior Software Engineer</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">87</div>
                  <div className="text-sm opacity-90">AI Readiness Score</div>
                </div>
              </div>
            </div>

            {/* Dashboard Content Preview */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Learning Path</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">GitHub Copilot Integration</div>
                            <div className="text-sm text-muted-foreground">Estimated 2 hours remaining</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-secondary">75% Complete</div>
                          <div className="w-20 h-2 bg-muted rounded-full mt-1">
                            <div className="w-3/4 h-full bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">This Week's Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Tools Explored</span>
                        <span className="font-semibold">3</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Hours Learned</span>
                        <span className="font-semibold">12.5</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Skills Gained</span>
                        <span className="font-semibold">2</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Trusted by <span className="text-primary">Industry Leaders</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how professionals across tech are leveraging AI to accelerate their careers and stay ahead of the curve.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-6">
                      <img 
                        src={testimonial.avatar} 
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover mr-4"
                      />
                      <div>
                        <div className="font-semibold text-foreground">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      "{testimonial.content}"
                    </p>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
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
      <section id="pricing" className="py-24 px-6 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Choose Your <span className="text-secondary">Growth Plan</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Start free and scale as you advance. Every plan includes our core AI assistant and personalized recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={plan.popular ? "relative" : ""}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-secondary text-white px-4 py-1 rounded-full text-sm font-medium z-10">
                    Most Popular
                  </div>
                )}
                <Card className={`h-full card-hover ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="text-4xl font-bold text-foreground mb-1">
                      {plan.price}
                      {plan.priceUnit && <span className="text-lg">{plan.priceUnit}</span>}
                    </div>
                    <p className="text-muted-foreground">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center">
                          <Check className="w-4 h-4 text-secondary mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full mt-6" 
                      variant={plan.buttonVariant}
                      onClick={handleGetStarted}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Career with AI?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who are already leveraging AI to accelerate their career growth and stay ahead in the rapidly evolving tech landscape.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                variant="secondary"
                className="px-8 py-4 text-lg font-medium shadow-lg bg-white text-primary hover:bg-gray-100"
                onClick={handleGetStarted}
              >
                Start Your Free Trial
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="px-8 py-4 text-lg font-medium border-white text-white hover:bg-white hover:text-primary"
                onClick={() => scrollToSection('dashboard')}
              >
                Schedule Demo
              </Button>
            </div>
            <p className="text-sm opacity-75 mt-6">
              No credit card required • 7-day free trial • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="font-bold text-2xl text-primary mb-4">Careerate</div>
              <p className="text-gray-300 mb-6 max-w-md">
                Empowering tech professionals to master AI tools and accelerate their career growth through personalized guidance and intelligent recommendations.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Product</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2024 Careerate. All rights reserved.</p>
            <div className="flex space-x-6 text-sm text-gray-400 mt-4 md:mt-0">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
