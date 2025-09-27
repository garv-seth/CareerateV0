import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, Code, Cloud, Shield, Brain, Globe, Users, Database, Terminal, Activity } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GradientDots } from "@/components/ui/gradient-dots";
import Hero from "@/components/ui/animated-shader-hero";

const FeatureCard = ({ icon: Icon, title, description, colorClass }: { icon: React.ElementType, title: string, description: string, colorClass: string }) => (
    <div className="glass-pane rounded-3xl p-6 flex flex-col items-start text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10">
      <div className={`mb-4 p-3 rounded-xl bg-gradient-to-br ${colorClass}`}>
          <Icon className="h-6 w-6 text-white"/>
      </div>
      <h3 className="text-display text-xl font-semibold mb-2">{title}</h3>
      <p className="text-foreground/60">{description}</p>
    </div>
);


const Features = () => (
  <section id="features" className="py-24 sm:py-32">
    <div className="container mx-auto px-4">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">The Most Advanced AI Development Platform</h2>
        <p className="text-lg text-foreground/70">
            Built for the future of software development with cutting-edge AI agents and enterprise-grade infrastructure.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
            { icon: Brain, title: "GPT-5 Powered", description: "Latest AI models for superior code generation and analysis", colorClass: "from-primary to-secondary" },
            { icon: Globe, title: "100+ Integrations", description: "Connect GitHub, AWS, Stripe, Datadog, and 100+ more services", colorClass: "from-blue-500 to-cyan-500" },
            { icon: Users, title: "Real-time Collaboration", description: "Live cursors, presence, and collaborative editing like never before", colorClass: "from-green-500 to-emerald-500" },
            { icon: Shield, title: "Enterprise Security", description: "Azure KeyVault encryption and SOC 2 Type II compliance", colorClass: "from-orange-500 to-red-500" },
            { icon: Cloud, title: "Multi-Cloud Deploy", description: "Deploy anywhere with natural language commands", colorClass: "from-indigo-500 to-purple-500" },
            { icon: Activity, title: "Autonomous Agents", description: "AI handles monitoring, scaling, and maintenance 24/7", colorClass: "from-pink-500 to-rose-500" },
        ].map(feature => <FeatureCard key={feature.title} {...feature} />)}
      </div>
    </div>
  </section>
);

const Pricing = () => (
  <section id="pricing" className="py-24 sm:py-32">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-display text-4xl font-bold mb-2">Simple, transparent pricing</h2>
        <p className="text-foreground/70">Start free. Scale when you’re ready.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[{
          name: 'Free', price: '$0', desc: 'For exploration and small projects', features: ['1 Project', 'Basic AI generation', 'Community support']
        },{
          name: 'Pro', price: '$49', desc: 'For solo builders and startups', features: ['Unlimited Projects', 'Advanced agents', 'Priority builds', 'Email support']
        },{
          name: 'Enterprise', price: 'Contact', desc: 'Security, SSO, custom SLAs', features: ['SSO & SAML', 'Private cloud/VPC', 'Dedicated support']
        }].map(tier => (
          <div key={tier.name} className="glass-pane rounded-3xl p-8 flex flex-col">
            <h3 className="text-xl font-semibold mb-1">{tier.name}</h3>
            <p className="text-3xl font-bold mb-2">{tier.price}</p>
            <p className="text-foreground/60 mb-6">{tier.desc}</p>
            <ul className="space-y-2 text-sm flex-1">
              {tier.features.map(f => <li key={f} className="text-foreground/70">• {f}</li>)}
            </ul>
            <Button className="mt-6 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300">Get Started</Button>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Docs = () => (
  <section id="docs" className="py-24 sm:py-32">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-display text-4xl font-bold mb-4">Developer-first docs</h2>
          <p className="text-foreground/70 mb-6">Clear guides, API references, and copy‑paste snippets to automate everything—from code generation to multi‑cloud deploys.</p>
          <div className="flex gap-3">
            <a href="#" className="rounded-full px-5 py-3 glass-pane">Quickstart</a>
            <a href="#" className="rounded-full px-5 py-3 glass-pane">CLI & API</a>
          </div>
        </div>
        <div className="glass-pane rounded-3xl p-6 text-sm text-foreground/80">
          <pre className="whitespace-pre-wrap">{
            `curl -X POST /api/ai/deploy \\\n+  -d '{\"project\":\"shop-app\",\"provider\":\"azure\",\"strategy\":\"blue-green\"}'`
          }</pre>
        </div>
      </div>
    </div>
  </section>
);

const CTA = () => (
    <section className="py-24 sm:py-32">
        <div className="container mx-auto px-4">
            <div className="relative rounded-3xl p-10 sm:p-16 text-center overflow-hidden glass-pane">
                 <div className="absolute -inset-2 bg-gradient-to-r from-primary to-secondary opacity-10 blur-3xl"></div>
                 <div className="relative z-10">
                    <h2 className="text-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">Ready to Build the Future?</h2>
                    <p className="max-w-2xl mx-auto text-lg text-foreground/70 mb-8">
                        Join thousands of developers using AI agents to build, deploy, and scale applications faster than ever before.
                    </p>
                    <Button size="lg" className="rounded-full px-10 py-6 text-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all duration-300 hover:scale-105 shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Start Building Free
                    </Button>
                 </div>
            </div>
        </div>
    </section>
);

const Footer = () => (
  <footer className="border-t border-white/10 mt-20">
    <div className="container mx-auto px-4 py-12">
       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-8">
          <div className="col-span-full lg:col-span-1">
              <h3 className="text-display font-semibold text-lg mb-2">Careerate</h3>
              <p className="text-sm text-foreground/60">The future of development is autonomous.</p>
          </div>
          {['Platform', 'Company', 'Resources', 'Legal'].map(section => (
              <div key={section}>
                  <h4 className="font-semibold mb-4">{section}</h4>
                  <ul className="space-y-3">
                      <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition">Link 1</a></li>
                      <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition">Link 2</a></li>
                  </ul>
              </div>
          ))}
       </div>
       <div className="border-t border-white/10 pt-8 text-center text-sm text-foreground/60">
        <p>© {new Date().getFullYear()} Careerate. All rights reserved.</p>
       </div>
    </div>
  </footer>
)


export default function LandingNew() {
  const handleGetStarted = () => {
    // Scroll to pricing section
    document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleWatchDemo = () => {
    // Scroll to features section
    document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* New Animated Shader Hero */}
      <Hero
        headline={{
          line1: "Let Ideas Flow.",
          line2: "Agents Handle The Rest."
        }}
        subtitle="Ship in hours, not months. AI agents handle everything."
        buttons={{
          primary: {
            text: "Start Building Now",
            onClick: handleGetStarted
          },
          secondary: {
            text: "Watch Demo",
            onClick: handleWatchDemo
          }
        }}
      />

      {/* Professional Dynamic Background Transition */}
      <div className="relative">
        {/* Subtle gradient transition overlay */}
        <div className="absolute inset-x-0 top-0 h-32 z-20">
          <div className="w-full h-full bg-gradient-to-b from-transparent via-orange-500/5 to-background"></div>
        </div>

        {/* Dynamic Background Content Section */}
        <div className="relative">
          {/* Subtle animated background orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse-subtle"></div>
            <div className="absolute top-40 right-1/3 w-80 h-80 bg-amber-500/4 rounded-full blur-3xl animate-pulse-subtle" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-orange-600/3 rounded-full blur-3xl animate-pulse-subtle" style={{animationDelay: '4s'}}></div>
          </div>

          <AppShell>
            <main className="relative z-10 pt-16">
              <Features />
              <Pricing />
              <Docs />
              <CTA />
            </main>
          </AppShell>
        </div>
      </div>
    </div>
  );
}
