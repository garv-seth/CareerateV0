import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { 
  CreditCard, 
  Calendar, 
  BarChart3, 
  Settings, 
  Download, 
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Crown,
  Building,
  Users,
  Database,
  Activity,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface UsageMetric {
  metricType: string;
  usage: number;
  limit: number;
  remaining: number;
}

interface Subscription {
  id: string;
  status: string;
  plan: {
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
  };
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

interface BillingHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  invoiceUrl?: string;
  createdAt: string;
}

export default function BillingDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  // Fetch current subscription
  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['/api/subscription/current'],
    enabled: true
  });

  // Fetch usage statistics
  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['/api/subscription/usage'],
    enabled: true
  });

  // Fetch billing history
  const { data: billingHistory, isLoading: billingLoading } = useQuery({
    queryKey: ['/api/subscription/billing-history'],
    enabled: true
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelAtPeriodEnd: true })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel subscription');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Canceled",
        description: "Your subscription will be canceled at the end of the billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500';
      case 'trialing': return 'bg-blue-500';
      case 'past_due': return 'bg-yellow-500';
      case 'canceled': return 'bg-red-500';
      case 'incomplete': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'starter': return <Zap className="h-5 w-5 text-blue-500" />;
      case 'professional': return <Crown className="h-5 w-5 text-purple-500" />;
      case 'enterprise': return <Building className="h-5 w-5 text-gold-500" />;
      default: return <Zap className="h-5 w-5 text-gray-500" />;
    }
  };

  const getUsageIcon = (metricType: string) => {
    switch (metricType.toLowerCase()) {
      case 'aigenerations': return <Zap className="h-4 w-4" />;
      case 'projects': return <Database className="h-4 w-4" />;
      case 'collaborators': return <Users className="h-4 w-4" />;
      case 'apicalls': return <Activity className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getUsagePercentage = (usage: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((usage / limit) * 100, 100);
  };

  const formatUsageLabel = (metricType: string) => {
    const labels = {
      'aigenerations': 'AI Generations',
      'projects': 'Projects',
      'collaborators': 'Collaborators',
      'apicalls': 'API Calls',
      'storagegb': 'Storage (GB)'
    };
    return labels[metricType.toLowerCase()] || metricType;
  };

  if (subscriptionLoading || usageLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading billing dashboard...</span>
        </div>
      </div>
    );
  }

  const subscription = subscriptionData?.subscription;
  const plan = subscriptionData?.plan;
  const usage = usageData?.usage || {};

  return (
    <div className="container mx-auto py-8 px-4" data-testid="billing-dashboard">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="dashboard-title">
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground" data-testid="dashboard-description">
            Manage your subscription, view usage, and billing history.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4" data-testid="dashboard-tabs">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="usage" data-testid="tab-usage">Usage</TabsTrigger>
            <TabsTrigger value="billing" data-testid="tab-billing">Billing</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Plan Card */}
              <Card data-testid="current-plan-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getPlanIcon(plan?.name)}
                    Current Plan
                  </CardTitle>
                  <CardDescription>
                    Your subscription details and status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {subscription ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg" data-testid="plan-name">
                          {plan?.name} Plan
                        </span>
                        <Badge 
                          className={`${getStatusColor(subscription.status)} text-white`}
                          data-testid="plan-status"
                        >
                          {subscription.status}
                        </Badge>
                      </div>
                      
                      <div className="text-2xl font-bold" data-testid="plan-price">
                        ${subscription.billingCycle === 'yearly' ? plan?.yearlyPrice : plan?.monthlyPrice}
                        <span className="text-sm text-muted-foreground">
                          /{subscription.billingCycle === 'yearly' ? 'year' : 'month'}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Billing Cycle:</span>
                          <span className="capitalize" data-testid="billing-cycle">
                            {subscription.billingCycle}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current Period:</span>
                          <span data-testid="billing-period">
                            {format(new Date(subscription.currentPeriodStart), 'MMM dd')} - {format(new Date(subscription.currentPeriodEnd), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Next Billing:</span>
                          <span data-testid="next-billing">
                            {format(new Date(subscription.currentPeriodEnd), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setActiveTab('settings')}
                        data-testid="button-manage-plan"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Plan
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4" data-testid="no-subscription">
                        No active subscription
                      </p>
                      <Button data-testid="button-choose-plan">
                        <a href="/#pricing">Choose a Plan</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Usage Overview */}
              <Card data-testid="usage-overview-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Usage Overview
                  </CardTitle>
                  <CardDescription>
                    Current month usage summary
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(usage).slice(0, 3).map(([metricType, data]: [string, any]) => (
                      <div key={metricType} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {getUsageIcon(metricType)}
                            <span>{formatUsageLabel(metricType)}</span>
                          </div>
                          <span data-testid={`usage-${metricType}`}>
                            {data.usage} {data.limit === -1 ? '' : `/ ${data.limit}`}
                          </span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(data.usage, data.limit)} 
                          className="h-2"
                          data-testid={`progress-${metricType}`}
                        />
                      </div>
                    ))}
                    
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => setActiveTab('usage')}
                      data-testid="button-view-all-usage"
                    >
                      View All Usage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Billing Activity */}
            <Card data-testid="recent-billing-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Recent Billing Activity
                </CardTitle>
                <CardDescription>
                  Latest billing transactions and invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {billingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading billing history...</span>
                  </div>
                ) : billingHistory && billingHistory.length > 0 ? (
                  <div className="space-y-4">
                    {billingHistory.slice(0, 3).map((transaction: BillingHistory) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`transaction-${transaction.id}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            transaction.status === 'paid' ? 'bg-green-500' : 
                            transaction.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <p className="font-medium" data-testid={`transaction-description-${transaction.id}`}>
                              {transaction.description}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`transaction-date-${transaction.id}`}>
                              {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium" data-testid={`transaction-amount-${transaction.id}`}>
                            ${transaction.amount}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize" data-testid={`transaction-status-${transaction.id}`}>
                            {transaction.status}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('billing')}
                      data-testid="button-view-all-billing"
                    >
                      View All Billing History
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8" data-testid="no-billing-history">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No billing history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-6">
            <Card data-testid="detailed-usage-card">
              <CardHeader>
                <CardTitle>Detailed Usage Statistics</CardTitle>
                <CardDescription>
                  Track your usage across all features and services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {Object.entries(usage).map(([metricType, data]: [string, any]) => (
                    <div key={metricType} className="space-y-3 p-4 border rounded-lg" data-testid={`detailed-usage-${metricType}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getUsageIcon(metricType)}
                          <h4 className="font-medium">{formatUsageLabel(metricType)}</h4>
                        </div>
                        <Badge variant="outline" data-testid={`usage-badge-${metricType}`}>
                          {data.usage} {data.limit === -1 ? '/ Unlimited' : `/ ${data.limit}`}
                        </Badge>
                      </div>
                      
                      <Progress 
                        value={getUsagePercentage(data.usage, data.limit)} 
                        className="h-3"
                        data-testid={`detailed-progress-${metricType}`}
                      />
                      
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Used: {data.usage}</span>
                        <span>
                          {data.limit === -1 ? 'Unlimited' : `Remaining: ${data.limit - data.usage}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card data-testid="billing-history-card">
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>
                  View and download your invoices and payment history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {billingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading billing history...</span>
                  </div>
                ) : billingHistory && billingHistory.length > 0 ? (
                  <div className="space-y-3">
                    {billingHistory.map((transaction: BillingHistory) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50" data-testid={`billing-transaction-${transaction.id}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${
                            transaction.status === 'paid' ? 'bg-green-500' : 
                            transaction.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <p className="font-medium" data-testid={`billing-description-${transaction.id}`}>
                              {transaction.description}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`billing-date-${transaction.id}`}>
                              {format(new Date(transaction.createdAt), 'MMMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium" data-testid={`billing-amount-${transaction.id}`}>
                              ${transaction.amount} {transaction.currency.toUpperCase()}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize" data-testid={`billing-status-${transaction.id}`}>
                              {transaction.status}
                            </p>
                          </div>
                          
                          {transaction.invoiceUrl && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(transaction.invoiceUrl, '_blank')}
                              data-testid={`button-download-invoice-${transaction.id}`}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Invoice
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8" data-testid="no-billing-transactions">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No billing transactions found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Subscription Management */}
              <Card data-testid="subscription-management-card">
                <CardHeader>
                  <CardTitle>Subscription Management</CardTitle>
                  <CardDescription>
                    Change your plan or cancel your subscription
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.href = '/#pricing'}
                    data-testid="button-change-plan"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Change Plan
                  </Button>
                  
                  {subscription && (
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => cancelSubscriptionMutation.mutate()}
                      disabled={cancelSubscriptionMutation.isPending}
                      data-testid="button-cancel-subscription"
                    >
                      {cancelSubscriptionMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mr-2" />
                      )}
                      Cancel Subscription
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card data-testid="payment-methods-card">
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    Manage your payment methods and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    data-testid="button-add-payment-method"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    data-testid="button-update-billing-info"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Update Billing Info
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}