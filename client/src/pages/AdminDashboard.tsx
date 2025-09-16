import { useState } from "react";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Activity,
  Calendar,
  CreditCard,
  AlertTriangle,
  BarChart3,
  Filter,
  Download,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SubscriptionMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  totalSubscribers: number;
  activeSubscribers: number;
  churnRate: number;
  averageRevenuePerUser: number;
}

interface SubscriptionDetails {
  id: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  plan: {
    name: string;
    monthlyPrice: number;
  };
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  stripeSubscriptionId: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const { toast } = useToast();

  // Fetch subscription metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/admin/subscription-metrics'],
    enabled: true
  });

  // Fetch all subscriptions
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['/api/admin/subscriptions'],
    enabled: true
  });

  // Fetch revenue analytics
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['/api/admin/revenue-analytics'],
    enabled: true
  });

  // Update subscription status mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ subscriptionId, action }: { subscriptionId: string, action: string }) => {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update subscription');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Updated",
        description: "Subscription status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscription-metrics'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubscriptionAction = async (subscriptionId: string, action: string) => {
    await updateSubscriptionMutation.mutateAsync({ subscriptionId, action });
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((sub: SubscriptionDetails) => {
    const matchesSearch = searchTerm === "" || 
      sub.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${sub.user.firstName} ${sub.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    const matchesPlan = planFilter === "all" || sub.plan.name.toLowerCase() === planFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesPlan;
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (metricsLoading || subscriptionsLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="admin-title">
            Subscription Management
          </h1>
          <p className="text-muted-foreground" data-testid="admin-description">
            Monitor subscription metrics, manage customer accounts, and analyze revenue.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4" data-testid="admin-tabs">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card data-testid="metric-total-revenue">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="total-revenue-value">
                    {formatCurrency(metrics?.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +12.5% from last month
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="metric-active-subscribers">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="active-subscribers-value">
                    {metrics?.activeSubscribers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +8.2% from last month
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="metric-monthly-revenue">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="monthly-revenue-value">
                    {formatCurrency(metrics?.monthlyRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +15.3% from last month
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="metric-churn-rate">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="churn-rate-value">
                    {(metrics?.churnRate || 0).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    -2.1% from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card data-testid="recent-activity-card">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest subscription changes and events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subscriptions.slice(0, 5).map((sub: SubscriptionDetails) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`activity-item-${sub.id}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(sub.status)}`} />
                        <div>
                          <p className="font-medium" data-testid={`activity-user-${sub.id}`}>
                            {sub.user.firstName} {sub.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`activity-email-${sub.id}`}>
                            {sub.user.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getStatusColor(sub.status)} text-white`} data-testid={`activity-status-${sub.id}`}>
                          {sub.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1" data-testid={`activity-plan-${sub.id}`}>
                          {sub.plan.name} - {formatCurrency(sub.plan.monthlyPrice)}/month
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            {/* Filters */}
            <Card data-testid="subscriptions-filters-card">
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>View and manage all customer subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by email or name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                      data-testid="search-subscriptions"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48" data-testid="filter-status">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trialing">Trialing</SelectItem>
                      <SelectItem value="past_due">Past Due</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                      <SelectItem value="incomplete">Incomplete</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-full md:w-48" data-testid="filter-plan">
                      <SelectValue placeholder="Filter by plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Subscriptions Table */}
                <div className="space-y-4">
                  {filteredSubscriptions.map((sub: SubscriptionDetails) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50" data-testid={`subscription-item-${sub.id}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(sub.status)}`} />
                        <div>
                          <p className="font-medium" data-testid={`sub-user-${sub.id}`}>
                            {sub.user.firstName} {sub.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`sub-email-${sub.id}`}>
                            {sub.user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium" data-testid={`sub-plan-${sub.id}`}>
                            {sub.plan.name}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`sub-price-${sub.id}`}>
                            {formatCurrency(sub.plan.monthlyPrice)}/{sub.billingCycle}
                          </p>
                        </div>

                        <Badge className={`${getStatusColor(sub.status)} text-white`} data-testid={`sub-status-${sub.id}`}>
                          {sub.status}
                        </Badge>

                        <div className="text-right text-sm text-muted-foreground">
                          <p data-testid={`sub-period-start-${sub.id}`}>
                            {format(new Date(sub.currentPeriodStart), 'MMM dd')}
                          </p>
                          <p data-testid={`sub-period-end-${sub.id}`}>
                            {format(new Date(sub.currentPeriodEnd), 'MMM dd')}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {sub.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSubscriptionAction(sub.id, 'pause')}
                              disabled={updateSubscriptionMutation.isPending}
                              data-testid={`button-pause-${sub.id}`}
                            >
                              Pause
                            </Button>
                          )}
                          
                          {sub.status === 'past_due' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSubscriptionAction(sub.id, 'retry')}
                              disabled={updateSubscriptionMutation.isPending}
                              data-testid={`button-retry-${sub.id}`}
                            >
                              Retry
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`button-view-details-${sub.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredSubscriptions.length === 0 && (
                    <div className="text-center py-8" data-testid="no-subscriptions">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No subscriptions found matching your criteria</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card data-testid="revenue-analytics-card">
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>Detailed revenue and subscription analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 border rounded-lg" data-testid="arpu-metric">
                    <p className="text-sm text-muted-foreground">Average Revenue Per User</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics?.averageRevenuePerUser || 0)}</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg" data-testid="ltv-metric">
                    <p className="text-sm text-muted-foreground">Customer Lifetime Value</p>
                    <p className="text-2xl font-bold">{formatCurrency((metrics?.averageRevenuePerUser || 0) * 24)}</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg" data-testid="conversion-metric">
                    <p className="text-sm text-muted-foreground">Trial Conversion Rate</p>
                    <p className="text-2xl font-bold">78.5%</p>
                  </div>
                </div>

                <div className="text-center py-8" data-testid="analytics-placeholder">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Revenue charts and detailed analytics would be implemented here</p>
                  <p className="text-sm text-muted-foreground mt-2">Integration with charting library (e.g., Recharts) for visual analytics</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card data-testid="reports-card">
              <CardHeader>
                <CardTitle>Reports & Exports</CardTitle>
                <CardDescription>Generate and download subscription reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Subscription Reports</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" data-testid="export-active-subs">
                        <Download className="h-4 w-4 mr-2" />
                        Active Subscriptions
                      </Button>
                      <Button variant="outline" className="w-full justify-start" data-testid="export-churn-report">
                        <Download className="h-4 w-4 mr-2" />
                        Churn Analysis
                      </Button>
                      <Button variant="outline" className="w-full justify-start" data-testid="export-revenue-report">
                        <Download className="h-4 w-4 mr-2" />
                        Revenue Report
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Custom Reports</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" data-testid="export-usage-report">
                        <Download className="h-4 w-4 mr-2" />
                        Usage Analytics
                      </Button>
                      <Button variant="outline" className="w-full justify-start" data-testid="export-billing-report">
                        <Download className="h-4 w-4 mr-2" />
                        Billing History
                      </Button>
                      <Button variant="outline" className="w-full justify-start" data-testid="export-customer-report">
                        <Download className="h-4 w-4 mr-2" />
                        Customer Insights
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-muted rounded-lg" data-testid="reports-info">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Report Generation</p>
                      <p className="text-sm text-muted-foreground">
                        Reports are generated in real-time and exported as CSV files. Large reports may take a few minutes to process.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}