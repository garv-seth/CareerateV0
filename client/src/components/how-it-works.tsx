import { MessageSquare, Code, Rocket, Settings } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: <MessageSquare className="text-secondary-foreground text-xl" />,
      title: "Describe Your App",
      description: "Simply tell our AI what you want to build in natural language. No technical knowledge required.",
      color: "bg-secondary"
    },
    {
      number: 2,
      icon: <Code className="text-white text-xl" />,
      title: "AI Builds Everything",
      description: "Our agents handle architecture, coding, testing, and database setup. Full-stack apps in minutes.",
      color: "bg-purple-500"
    },
    {
      number: 3,
      icon: <Rocket className="text-accent-foreground text-xl" />,
      title: "Auto-Deploy & Scale",
      description: "Your app is automatically deployed with intelligent infrastructure that scales based on demand.",
      color: "bg-accent"
    },
    {
      number: 4,
      icon: <Settings className="text-white text-xl" />,
      title: "AI Maintains It",
      description: "Sit back while AI handles updates, security, monitoring, and optimization 24/7.",
      color: "bg-orange-500"
    }
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="how-it-works-title">
            How Careerate Works
          </h2>
          <p className="text-xl text-muted-foreground" data-testid="how-it-works-description">
            From conversation to production-ready application in four simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center" data-testid={`step-${index}`}>
              <div className="relative mb-8">
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto shadow-lg`}>
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {step.number}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4" data-testid={`step-title-${index}`}>
                {step.title}
              </h3>
              <p className="text-muted-foreground" data-testid={`step-description-${index}`}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
