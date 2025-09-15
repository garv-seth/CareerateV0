import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="cta-title">
          Ready to revolutionize your development process?
        </h2>
        <p className="text-xl text-muted-foreground mb-8" data-testid="cta-description">
          Start your free trial today. No credit card required.
        </p>
        <Link href="/dashboard">
          <Button 
            className="px-8 py-4 bg-primary text-primary-foreground rounded-full text-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg"
            data-testid="button-start-trial"
          >
            Start Your Free Trial
          </Button>
        </Link>
      </div>
    </section>
  );
}
