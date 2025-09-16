import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function PaymentForm({ clientSecret, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        onError(error.message || 'Payment failed');
        toast({
          title: "Payment Failed",
          description: error.message || "Something went wrong with your payment.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent);
        
        // Invalidate subscription-related cache
        queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
        queryClient.invalidateQueries({ queryKey: ['/api/subscription/usage'] });
        queryClient.invalidateQueries({ queryKey: ['/api/subscription/billing-history'] });
        
        toast({
          title: "Payment Successful",
          description: "Your subscription has been activated!",
        });
        
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      onError('An unexpected error occurred');
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <PaymentElement 
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'klarna', 'ideal']
          }}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || !elements || isProcessing}
        className="w-full"
        data-testid="button-complete-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Processing Payment...
          </>
        ) : (
          "Complete Payment"
        )}
      </Button>
    </form>
  );
}

export default function PaymentPage() {
  const [location, navigate] = useLocation();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Extract client_secret from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const secret = urlParams.get('client_secret');
    
    if (!secret) {
      console.error('No client_secret found in URL');
      setPaymentStatus('error');
      setErrorMessage('Invalid payment session. Please try again.');
      return;
    }
    
    console.log('Client secret found:', secret);
    setClientSecret(secret);
  }, []);

  const handlePaymentSuccess = () => {
    setPaymentStatus('success');
    
    // Redirect to billing dashboard after a short delay
    setTimeout(() => {
      navigate('/billing');
    }, 3000);
  };

  const handlePaymentError = (error: string) => {
    setPaymentStatus('error');
    setErrorMessage(error);
  };

  const handleBackToPricing = () => {
    navigate('/#pricing');
  };

  // Error state
  if (paymentStatus === 'error') {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card data-testid="payment-error-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Payment Error</CardTitle>
            <CardDescription className="text-red-500">
              {errorMessage || 'Something went wrong with your payment'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Don't worry, you haven't been charged. Please try again or contact support if the problem persists.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                variant="outline" 
                onClick={handleBackToPricing}
                data-testid="button-back-to-pricing"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pricing
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                data-testid="button-try-again"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (paymentStatus === 'success') {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card data-testid="payment-success-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Payment Successful!</CardTitle>
            <CardDescription>
              Your subscription has been activated
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Thank you for subscribing! You now have access to all premium features.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to your billing dashboard in a few seconds...
            </p>
            <Button 
              onClick={() => navigate('/billing')}
              data-testid="button-go-to-dashboard"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (!clientSecret) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading payment details...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment form
  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl" data-testid="payment-page">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={handleBackToPricing}
          className="mb-4"
          data-testid="button-back-arrow"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pricing
        </Button>
        <h1 className="text-3xl font-bold mb-2" data-testid="payment-title">
          Complete Your Payment
        </h1>
        <p className="text-muted-foreground" data-testid="payment-description">
          Enter your payment information to activate your subscription
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>
            Your payment is secured with 256-bit SSL encryption
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Elements 
            stripe={stripePromise} 
            options={{ 
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: 'hsl(var(--primary))',
                  colorBackground: 'hsl(var(--background))',
                  colorText: 'hsl(var(--foreground))',
                  colorDanger: 'hsl(var(--destructive))',
                  fontFamily: 'system-ui, sans-serif',
                  spacingUnit: '4px',
                  borderRadius: '6px',
                }
              }
            }}
          >
            <PaymentForm 
              clientSecret={clientSecret}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </Elements>
        </CardContent>
      </Card>

      {/* Security badges */}
      <div className="mt-8 text-center">
        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Secure Payment
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            SSL Encrypted
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            PCI Compliant
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Powered by Stripe • No payment information stored on our servers
        </p>
      </div>
    </div>
  );
}