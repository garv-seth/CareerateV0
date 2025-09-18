import { useState, useEffect } from "react";
import { X, Cookie, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    savePreferences(allPreferences);
  };

  const handleAcceptSelected = () => {
    savePreferences(preferences);
  };

  const handleRejectAll = () => {
    const minimalPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    savePreferences(minimalPreferences);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());

    // Here you would typically also set/remove actual cookies based on preferences
    // For example, disable analytics cookies if analytics is false

    setIsVisible(false);
  };

  const updatePreference = (type: keyof CookiePreferences, value: boolean) => {
    if (type === 'necessary') return; // Can't disable necessary cookies
    setPreferences(prev => ({ ...prev, [type]: value }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="mx-auto max-w-4xl shadow-2xl border-2 border-gray-300 bg-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Cookie className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />

            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">We value your privacy</h3>

              {!showDetails ? (
                <div>
                  <p className="text-sm text-gray-700 mb-4">
                    We use cookies to enhance your experience, analyze site traffic, and personalize content.
                    You can choose which cookies to accept.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleAcceptAll}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      data-testid="accept-all-cookies"
                    >
                      Accept All
                    </Button>

                    <Button
                      onClick={handleRejectAll}
                      variant="outline"
                      className="border-2 border-gray-900 text-gray-900 hover:bg-gray-100 font-medium"
                      data-testid="reject-all-cookies"
                    >
                      Reject All
                    </Button>

                    <Button
                      onClick={() => setShowDetails(true)}
                      variant="ghost"
                      className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium"
                      data-testid="customize-cookies"
                    >
                      <Settings className="w-4 h-4" />
                      Customize
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-700 mb-4">
                    Choose which cookies you'd like to accept. You can change these settings at any time.
                  </p>

                  <div className="space-y-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="necessary"
                        checked={true}
                        disabled={true}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="necessary" className="text-sm font-medium">
                          Necessary Cookies
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Required for basic site functionality, authentication, and security.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="functional"
                        checked={preferences.functional}
                        onCheckedChange={(checked) => updatePreference('functional', checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="functional" className="text-sm font-medium">
                          Functional Cookies
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Remember your preferences and settings to enhance your experience.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="analytics"
                        checked={preferences.analytics}
                        onCheckedChange={(checked) => updatePreference('analytics', checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="analytics" className="text-sm font-medium">
                          Analytics Cookies
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Help us understand how you use our site to improve performance and user experience.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="marketing"
                        checked={preferences.marketing}
                        onCheckedChange={(checked) => updatePreference('marketing', checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="marketing" className="text-sm font-medium">
                          Marketing Cookies
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Used to deliver personalized advertisements and measure campaign effectiveness.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleAcceptSelected}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      data-testid="save-cookie-preferences"
                    >
                      Save Preferences
                    </Button>

                    <Button
                      onClick={() => setShowDetails(false)}
                      variant="outline"
                      className="border-2 border-gray-900 text-gray-900 hover:bg-gray-100 font-medium"
                      data-testid="back-cookie-banner"
                    >
                      Back
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-600">
                Learn more in our{' '}
                <Link href="/privacy" className="underline text-blue-600 hover:text-blue-800 font-medium">
                  Privacy Policy
                </Link>
                {' '}and{' '}
                <Link href="/terms" className="underline text-blue-600 hover:text-blue-800 font-medium">
                  Terms of Service
                </Link>
              </div>
            </div>

            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              data-testid="close-cookie-banner"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}