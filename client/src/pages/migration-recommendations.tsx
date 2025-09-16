import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  Lightbulb, 
  TrendingUp, 
  Shield, 
  Zap,
  Database,
  Cloud,
  Cpu,
  DollarSign,
  ArrowLeft,
  Star,
  ThumbsUp,
  ThumbsDown,
  Download,
  Eye,
  CheckCircle,
  AlertTriangle,
  Target,
  Gauge,
  Lock,
  Settings,
  GitBranch,
  Container,
  Server
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AIRecommendation {
  id: string;
  category: 'architecture' | 'performance' | 'security' | 'cost' | 'scalability' | 'reliability';
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  title: string;
  description: string;
  currentState: string;
  recommendedAction: string;
  expectedBenefit: string;
  implementation: {
    complexity: 'simple' | 'moderate' | 'complex';
    effort: number; // hours
    cost: number; // dollars
    timeline: number; // weeks
    prerequisites: string[];
    steps: string[];
    risks: string[];
  };
  impact: {
    performance: number; // -100 to 100
    cost: number; // -100 to 100 (negative is savings)
    security: number; // 0-100
    scalability: number; // 0-100
    maintenance: number; // -100 to 100 (negative is reduced maintenance)
  };
  evidence: {
    metrics: Array<{ name: string; current: number; projected: number; unit: string }>;
    benchmarks: Array<{ name: string; value: string; source: string }>;
    analysis: string;
  };
  relatedRecommendations: string[];
  status: 'new' | 'reviewed' | 'approved' | 'rejected' | 'implemented';
  votes: { up: number; down: number };
  feedback: string[];
  createdAt: string;
  updatedAt: string;
}

interface RecommendationFilter {
  category?: string;
  priority?: string;
  status?: string;
  complexity?: string;
}

export default function MigrationRecommendations() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);
  const [filters, setFilters] = useState<RecommendationFilter>({});
  const [sortBy, setSortBy] = useState<'priority' | 'confidence' | 'impact' | 'cost'>('priority');

  // Mock recommendations data
  const mockRecommendations: AIRecommendation[] = [
    {
      id: "rec-1",
      category: "architecture",
      priority: "high",
      confidence: 92,
      title: "Migrate to Microservices Architecture",
      description: "Break down monolithic application into microservices to improve scalability and maintainability",
      currentState: "Monolithic Java application with 200K+ lines of code",
      recommendedAction: "Decompose into 6-8 domain-specific microservices using Domain-Driven Design principles",
      expectedBenefit: "40% improvement in deployment frequency, 60% reduction in MTTR, independent scaling",
      implementation: {
        complexity: "complex",
        effort: 320,
        cost: 120000,
        timeline: 16,
        prerequisites: ["Service discovery infrastructure", "API gateway", "Monitoring system"],
        steps: [
          "Analyze domain boundaries using DDD",
          "Extract shared libraries and utilities",
          "Implement service contracts and APIs",
          "Set up service discovery and configuration",
          "Implement distributed tracing and monitoring",
          "Migrate services incrementally with strangler pattern"
        ],
        risks: [
          "Increased operational complexity",
          "Network latency between services",
          "Data consistency challenges",
          "Higher infrastructure costs initially"
        ]
      },
      impact: {
        performance: 25,
        cost: -15,
        security: 30,
        scalability: 80,
        maintenance: -40
      },
      evidence: {
        metrics: [
          { name: "Deployment Frequency", current: 2, projected: 10, unit: "per week" },
          { name: "MTTR", current: 4, projected: 1.5, unit: "hours" },
          { name: "Code Coupling", current: 85, projected: 30, unit: "%" }
        ],
        benchmarks: [
          { name: "Netflix", value: "600+ microservices", source: "Netflix Tech Blog" },
          { name: "Amazon", value: "50% faster feature delivery", source: "AWS re:Invent 2024" }
        ],
        analysis: "Analysis of your current codebase shows high coupling between business domains. Microservices would allow independent development and deployment."
      },
      relatedRecommendations: ["rec-3", "rec-5"],
      status: "new",
      votes: { up: 8, down: 1 },
      feedback: [
        "This aligns with our long-term scalability goals",
        "Concerned about the complexity increase"
      ],
      createdAt: "2025-09-15T10:00:00Z",
      updatedAt: "2025-09-16T09:30:00Z"
    },
    {
      id: "rec-2",
      category: "performance",
      priority: "critical",
      confidence: 87,
      title: "Implement Database Connection Pooling",
      description: "Add connection pooling to reduce database connection overhead and improve performance",
      currentState: "Direct database connections with no pooling, causing connection exhaustion",
      recommendedAction: "Implement HikariCP connection pooling with optimized configuration",
      expectedBenefit: "50% reduction in database response time, 70% reduction in connection errors",
      implementation: {
        complexity: "simple",
        effort: 16,
        cost: 2000,
        timeline: 1,
        prerequisites: ["Database performance analysis"],
        steps: [
          "Add HikariCP dependency",
          "Configure connection pool settings",
          "Update application configuration",
          "Implement connection monitoring",
          "Performance testing and tuning"
        ],
        risks: [
          "Configuration tuning required",
          "Monitoring overhead"
        ]
      },
      impact: {
        performance: 50,
        cost: -25,
        security: 10,
        scalability: 40,
        maintenance: -20
      },
      evidence: {
        metrics: [
          { name: "Avg Response Time", current: 250, projected: 125, unit: "ms" },
          { name: "Connection Errors", current: 15, projected: 2, unit: "per hour" },
          { name: "DB Connection Count", current: 200, projected: 50, unit: "connections" }
        ],
        benchmarks: [
          { name: "Industry Standard", value: "10-50 connections per app", source: "Database Performance Guide" }
        ],
        analysis: "Current application creates new connections for each request, leading to resource waste and performance degradation."
      },
      relatedRecommendations: ["rec-4"],
      status: "approved",
      votes: { up: 12, down: 0 },
      feedback: [
        "Quick win with high impact",
        "Should be implemented immediately"
      ],
      createdAt: "2025-09-15T11:00:00Z",
      updatedAt: "2025-09-16T10:00:00Z"
    },
    {
      id: "rec-3",
      category: "security",
      priority: "high",
      confidence: 95,
      title: "Implement Zero-Trust Security Model",
      description: "Upgrade security architecture to zero-trust model with enhanced authentication and authorization",
      currentState: "Perimeter-based security with limited internal authentication",
      recommendedAction: "Implement zero-trust architecture with mTLS, service mesh, and identity-based access controls",
      expectedBenefit: "90% reduction in lateral movement attacks, enhanced compliance posture",
      implementation: {
        complexity: "complex",
        effort: 240,
        cost: 80000,
        timeline: 12,
        prerequisites: ["Service mesh deployment", "Identity provider setup", "Certificate management"],
        steps: [
          "Deploy service mesh (Istio/Linkerd)",
          "Implement mTLS between services",
          "Set up identity and access management",
          "Configure policy enforcement points",
          "Implement continuous compliance monitoring"
        ],
        risks: [
          "Complex configuration management",
          "Performance overhead from encryption",
          "Operational complexity increase"
        ]
      },
      impact: {
        performance: -10,
        cost: 5,
        security: 90,
        scalability: 20,
        maintenance: 10
      },
      evidence: {
        metrics: [
          { name: "Security Incidents", current: 5, projected: 1, unit: "per month" },
          { name: "Compliance Score", current: 65, projected: 95, unit: "%" },
          { name: "Auth Failures", current: 200, projected: 20, unit: "per day" }
        ],
        benchmarks: [
          { name: "Google BeyondCorp", value: "Zero breaches in 5 years", source: "Google Security Blog" }
        ],
        analysis: "Current perimeter security is insufficient for cloud-native environments. Zero-trust provides defense in depth."
      },
      relatedRecommendations: ["rec-1"],
      status: "reviewed",
      votes: { up: 6, down: 2 },
      feedback: [
        "Critical for our compliance requirements",
        "Concerned about performance impact"
      ],
      createdAt: "2025-09-15T12:00:00Z",
      updatedAt: "2025-09-16T08:00:00Z"
    },
    {
      id: "rec-4",
      category: "cost",
      priority: "medium",
      confidence: 88,
      title: "Optimize Cloud Resource Utilization",
      description: "Implement auto-scaling and resource optimization to reduce cloud infrastructure costs",
      currentState: "Static resource allocation with 40% average utilization",
      recommendedAction: "Implement horizontal pod autoscaling, vertical scaling, and spot instances",
      expectedBenefit: "$30,000 annual savings with improved performance during peak loads",
      implementation: {
        complexity: "moderate",
        effort: 80,
        cost: 15000,
        timeline: 6,
        prerequisites: ["Monitoring and metrics collection", "Kubernetes cluster"],
        steps: [
          "Analyze current resource usage patterns",
          "Configure horizontal pod autoscaling",
          "Implement vertical pod autoscaling",
          "Set up spot instance integration",
          "Configure cost monitoring and alerting"
        ],
        risks: [
          "Spot instance interruptions",
          "Scaling latency during spikes"
        ]
      },
      impact: {
        performance: 15,
        cost: -40,
        security: 0,
        scalability: 60,
        maintenance: -15
      },
      evidence: {
        metrics: [
          { name: "Resource Utilization", current: 40, projected: 75, unit: "%" },
          { name: "Monthly Cloud Cost", current: 8000, projected: 5500, unit: "USD" },
          { name: "Scaling Response Time", current: 300, projected: 45, unit: "seconds" }
        ],
        benchmarks: [
          { name: "AWS Best Practices", value: "70-80% utilization target", source: "AWS Well-Architected" }
        ],
        analysis: "Significant opportunity for cost savings through better resource utilization and dynamic scaling."
      },
      relatedRecommendations: ["rec-2"],
      status: "new",
      votes: { up: 10, down: 1 },
      feedback: [
        "Great ROI potential",
        "Should start with development environment"
      ],
      createdAt: "2025-09-15T13:00:00Z",
      updatedAt: "2025-09-16T07:00:00Z"
    }
  ];

  const filteredRecommendations = mockRecommendations.filter(rec => {
    if (filters.category && rec.category !== filters.category) return false;
    if (filters.priority && rec.priority !== filters.priority) return false;
    if (filters.status && rec.status !== filters.status) return false;
    if (filters.complexity && rec.implementation.complexity !== filters.complexity) return false;
    return true;
  });

  const sortedRecommendations = [...filteredRecommendations].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      case 'confidence':
        return b.confidence - a.confidence;
      case 'impact':
        const getImpactScore = (rec: AIRecommendation) => 
          (rec.impact.performance + rec.impact.scalability + rec.impact.security) / 3;
        return getImpactScore(b) - getImpactScore(a);
      case 'cost':
        return a.implementation.cost - b.implementation.cost;
      default:
        return 0;
    }
  });

  const selectedRec = selectedRecommendation 
    ? mockRecommendations.find(r => r.id === selectedRecommendation)
    : sortedRecommendations[0];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'architecture': return <GitBranch className="h-5 w-5" />;
      case 'performance': return <Gauge className="h-5 w-5" />;
      case 'security': return <Lock className="h-5 w-5" />;
      case 'cost': return <DollarSign className="h-5 w-5" />;
      case 'scalability': return <TrendingUp className="h-5 w-5" />;
      case 'reliability': return <Shield className="h-5 w-5" />;
      default: return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'architecture': return 'bg-blue-100 text-blue-800';
      case 'performance': return 'bg-green-100 text-green-800';
      case 'security': return 'bg-red-100 text-red-800';
      case 'cost': return 'bg-yellow-100 text-yellow-800';
      case 'scalability': return 'bg-purple-100 text-purple-800';
      case 'reliability': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'new': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const approveRecommendation = (id: string) => {
    toast({
      title: "Recommendation Approved",
      description: "The recommendation has been approved for implementation."
    });
  };

  const rejectRecommendation = (id: string) => {
    toast({
      title: "Recommendation Rejected",
      description: "The recommendation has been rejected.",
      variant: "destructive"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/migration")}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">AI-Powered Recommendations</h1>
                <p className="text-sm text-muted-foreground">Intelligent optimization suggestions for your migration</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" data-testid="button-generate-report">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
              <Button data-testid="button-refresh-recommendations">
                <Zap className="mr-2 h-4 w-4" />
                Refresh AI Analysis
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter and Sort Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Recommendation Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Select 
                value={filters.category || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, category: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="architecture">Architecture</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="cost">Cost Optimization</SelectItem>
                  <SelectItem value="scalability">Scalability</SelectItem>
                  <SelectItem value="reliability">Reliability</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.priority || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.status || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="implemented">Implemented</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.complexity || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, complexity: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Complexity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Complexity</SelectItem>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="complex">Complex</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Sort by Priority</SelectItem>
                  <SelectItem value="confidence">Sort by Confidence</SelectItem>
                  <SelectItem value="impact">Sort by Impact</SelectItem>
                  <SelectItem value="cost">Sort by Cost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recommendations List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-semibold">Recommendations ({filteredRecommendations.length})</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {sortedRecommendations.map((rec) => (
                <Card 
                  key={rec.id} 
                  className={`cursor-pointer transition-colors ${selectedRec?.id === rec.id ? 'ring-2 ring-blue-500' : 'hover:bg-muted/50'}`}
                  onClick={() => setSelectedRecommendation(rec.id)}
                  data-testid={`card-recommendation-${rec.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          {getCategoryIcon(rec.category)}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{rec.title}</h4>
                          <div className="flex items-center space-x-1 mt-1">
                            <Badge className={getCategoryColor(rec.category)} variant="secondary">
                              {rec.category}
                            </Badge>
                            <Badge className={getPriorityColor(rec.priority)} variant="secondary">
                              {rec.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{rec.confidence}%</div>
                        <div className="text-xs text-muted-foreground">confidence</div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {rec.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {rec.implementation.effort}h • ${rec.implementation.cost.toLocaleString()}
                      </span>
                      <div className="flex items-center space-x-1">
                        <ThumbsUp className="h-3 w-3 text-green-500" />
                        <span className="text-green-600">{rec.votes.up}</span>
                        <ThumbsDown className="h-3 w-3 text-red-500" />
                        <span className="text-red-600">{rec.votes.down}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Detailed Recommendation View */}
          <div className="lg:col-span-2">
            {selectedRec ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        {getCategoryIcon(selectedRec.category)}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{selectedRec.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {selectedRec.description}
                        </CardDescription>
                        <div className="flex items-center space-x-2 mt-3">
                          <Badge className={getCategoryColor(selectedRec.category)}>
                            {selectedRec.category}
                          </Badge>
                          <Badge className={getPriorityColor(selectedRec.priority)}>
                            {selectedRec.priority}
                          </Badge>
                          <Badge className={getStatusColor(selectedRec.status)}>
                            {selectedRec.status}
                          </Badge>
                          <Badge variant="outline">
                            {selectedRec.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedRec.status === 'new' || selectedRec.status === 'reviewed' ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => rejectRecommendation(selectedRec.id)}
                            data-testid="button-reject-recommendation"
                          >
                            <ThumbsDown className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => approveRecommendation(selectedRec.id)}
                            data-testid="button-approve-recommendation"
                          >
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="implementation">Implementation</TabsTrigger>
                      <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
                      <TabsTrigger value="evidence">Evidence</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-2">Current State</h4>
                          <p className="text-sm text-muted-foreground">{selectedRec.currentState}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Recommended Action</h4>
                          <p className="text-sm text-muted-foreground">{selectedRec.recommendedAction}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Expected Benefits</h4>
                        <p className="text-sm text-muted-foreground">{selectedRec.expectedBenefit}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 mb-1">
                            {selectedRec.implementation.timeline}w
                          </div>
                          <div className="text-sm text-muted-foreground">Timeline</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {selectedRec.implementation.effort}h
                          </div>
                          <div className="text-sm text-muted-foreground">Effort</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-orange-600 mb-1">
                            ${selectedRec.implementation.cost.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">Cost</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-purple-600 mb-1">
                            {selectedRec.implementation.complexity}
                          </div>
                          <div className="text-sm text-muted-foreground">Complexity</div>
                        </div>
                      </div>

                      {selectedRec.feedback.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">Team Feedback</h4>
                          <div className="space-y-2">
                            {selectedRec.feedback.map((feedback, idx) => (
                              <div key={idx} className="flex items-start space-x-2 p-3 bg-muted/50 rounded-lg">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-xs text-blue-600 font-medium">{idx + 1}</span>
                                </div>
                                <span className="text-sm">{feedback}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="implementation" className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-3">Prerequisites</h4>
                        <div className="space-y-2">
                          {selectedRec.implementation.prerequisites.map((prereq, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{prereq}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Implementation Steps</h4>
                        <div className="space-y-3">
                          {selectedRec.implementation.steps.map((step, idx) => (
                            <div key={idx} className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs text-blue-600 font-medium">{idx + 1}</span>
                              </div>
                              <span className="text-sm">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Risks & Mitigation</h4>
                        <div className="space-y-2">
                          {selectedRec.implementation.risks.map((risk, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{risk}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="impact" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Performance Impact</span>
                              <span className="text-sm font-bold text-green-600">+{selectedRec.impact.performance}%</span>
                            </div>
                            <Progress value={selectedRec.impact.performance + 50} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Cost Impact</span>
                              <span className={`text-sm font-bold ${selectedRec.impact.cost < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {selectedRec.impact.cost > 0 ? '+' : ''}{selectedRec.impact.cost}%
                              </span>
                            </div>
                            <Progress value={Math.abs(selectedRec.impact.cost)} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Security Improvement</span>
                              <span className="text-sm font-bold text-blue-600">+{selectedRec.impact.security}%</span>
                            </div>
                            <Progress value={selectedRec.impact.security} className="h-2" />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Scalability Improvement</span>
                              <span className="text-sm font-bold text-purple-600">+{selectedRec.impact.scalability}%</span>
                            </div>
                            <Progress value={selectedRec.impact.scalability} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Maintenance Impact</span>
                              <span className={`text-sm font-bold ${selectedRec.impact.maintenance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {selectedRec.impact.maintenance > 0 ? '+' : ''}{selectedRec.impact.maintenance}%
                              </span>
                            </div>
                            <Progress value={Math.abs(selectedRec.impact.maintenance)} className="h-2" />
                          </div>
                        </div>
                      </div>

                      <Alert>
                        <Target className="h-4 w-4" />
                        <AlertTitle>Impact Summary</AlertTitle>
                        <AlertDescription>
                          This recommendation is projected to improve overall system performance by {selectedRec.impact.performance}% 
                          while {selectedRec.impact.cost < 0 ? 'reducing costs' : 'increasing costs'} by {Math.abs(selectedRec.impact.cost)}%.
                          Security posture will improve by {selectedRec.impact.security}% and scalability by {selectedRec.impact.scalability}%.
                        </AlertDescription>
                      </Alert>
                    </TabsContent>

                    <TabsContent value="evidence" className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-3">Performance Metrics</h4>
                        <div className="space-y-3">
                          {selectedRec.evidence.metrics.map((metric, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                              <span className="font-medium">{metric.name}</span>
                              <div className="text-right">
                                <div className="text-sm">
                                  <span className="text-muted-foreground">{metric.current} {metric.unit}</span>
                                  <span className="mx-2">→</span>
                                  <span className="font-medium text-green-600">{metric.projected} {metric.unit}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {metric.projected > metric.current ? '+' : ''}
                                  {Math.round(((metric.projected - metric.current) / metric.current) * 100)}% change
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Industry Benchmarks</h4>
                        <div className="space-y-2">
                          {selectedRec.evidence.benchmarks.map((benchmark, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div>
                                <span className="font-medium">{benchmark.name}</span>
                                <div className="text-sm text-muted-foreground">{benchmark.source}</div>
                              </div>
                              <span className="text-sm font-medium">{benchmark.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">AI Analysis</h4>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">{selectedRec.evidence.analysis}</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12">
                <Lightbulb className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Select a Recommendation</h3>
                <p className="text-muted-foreground">
                  Choose a recommendation from the list to view detailed analysis and implementation guidance.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}