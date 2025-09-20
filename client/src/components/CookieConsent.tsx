import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (consent: 'accepted' | 'declined') => {
    localStorage.setItem('cookieConsent', consent);
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setIsVisible(false);
    // Here you would add logic to initialize analytics etc. if accepted
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl transition-all duration-500 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      )}
    >
      <div className="glass-pane rounded-2xl p-4 sm:p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <p className="flex-grow text-sm text-foreground/80 text-center sm:text-left">
            We use essential cookies to make our site work. With your consent, we may also use non-essential cookies to improve user experience. By clicking ”Accept”, you agree to our cookie use. You can view our
            <Link href="/privacy">
              <a className="underline hover:text-primary transition-colors mx-1">Privacy Policy</a>
            </Link>
            for more details.
          </p>
          <div className="flex-shrink-0 flex items-center gap-2">
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => handleConsent('declined')}
            >
              Decline
            </Button>
            <Button
              className="rounded-full bg-primary/15 text-primary-foreground hover:bg-primary/25"
              onClick={() => handleConsent('accepted')}
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}