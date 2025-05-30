import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Target, 
  Award,
  Book,
  Zap,
  BarChart3,
  Settings,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Play,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  Activity,
  Lightbulb
} from 'lucide-react';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { RecommendationCard } from '@/components/dashboard/RecommendationCard';
import { ProgressTracker } from '@/components/dashboard/ProgressTracker';
import { useUserStore } from '@/state/userStore';
import { toast } from '@/components/ui/use-toast';

// Define DashboardTab type
type DashboardTab = "overview" | "recommendations" | "paths" | "insights";
const VALID_DASHBOARD_TABS: DashboardTab[] = ["overview", "recommendations", "paths", "insights"];

interface AIRecommendation {
  id: string;
  type: 'tool' | 'skill' | 'learning_path' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  category: string;
  estimatedImpact: 'low' | 'medium' | 'high';
  timeToImplement: string;
  reasoning: string;
  actionUrl?: string;
  prerequisites?: string[];
  relatedTools?: string[];
}

interface WorkflowInsight {
  id: string;
  type: 'pattern' | 'inefficiency' | 'opportunity';
  title: string;
  description: string;
  impact: number;
  frequency: string;
  suggestion: string;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  progress: number;
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
  nextStep: string;
  isActive: boolean;
}

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useUserStore(state => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated
  }));
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch AI Recommendations
  const { 
    data: recommendationsData, 
    isLoading: isLoadingRecommendations,
    isError: isErrorRecommendations,
    error: recommendationsError,
    refetch: refetchRecommendations
  } = useQuery<AIRecommendation[], Error>({
    queryKey: ['aiRecommendations', user?.id], // Use user.id in queryKey
    queryFn: async () => {
      if (!user?.id) throw new Error("User ID not available");
      // Replace with actual API call to fetch recommendations
      // Example: return apiClient.get(`/recommendations/user/${user.id}`);
      // For now, returning mock data or throwing error if not applicable for LangGraph agent directly
      // This endpoint was /analyze-and-recommend, now it will be devops-agent/invoke
      // The structure of request and response is different for the LangGraph agent.
      // This query might need to be re-thought for how it interacts with the agent.
      // For now, let's assume a placeholder or that this page will primarily *display* results from agent interactions initiated elsewhere.
      console.warn("Placeholder: AI Recommendations query needs to be adapted for LangGraph agent interaction.");
      // Simulating an empty array as the agent might not be directly queried this way for a list.
      return Promise.resolve([]); 
    },
    enabled: !!user?.id && isAuthenticated, // Only run if user.id is available and authenticated
  });

  // Fetch Workflow Insights (placeholder)
  const { 
    data: insightsData, 
    isLoading: isLoadingInsights,
    refetch: refetchInsights
  } = useQuery<WorkflowInsight[], Error>({
    queryKey: ['workflowInsights', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User ID not available");
      console.warn("Placeholder: Workflow Insights query to be implemented.");
      // Conforming to WorkflowInsight interface
      return Promise.resolve<WorkflowInsight[]>([
        {
          id: 'insight1',
          type: 'pattern',
          title: 'Optimize Kubernetes Manifests',
          description: 'Identified frequent manual edits to YAML files. Consider a templating tool or AI assistant.',
          impact: 3, // Example impact (scale 1-5 or similar)
          frequency: 'daily',
          suggestion: 'Explore Kustomize or Helm for templating, or use an AI tool to generate/validate YAML.'
        },
      ]);
    },
    enabled: !!user?.id && isAuthenticated,
  });

  // Fetch Learning Paths (placeholder)
  const { 
    data: learningPathsData, 
    isLoading: isLoadingPaths,
    refetch: refetchPaths
  } = useQuery<LearningPath[], Error>({
    queryKey: ['learningPaths', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User ID not available");
      console.warn("Placeholder: Learning Paths query to be implemented.");
      // Conforming to LearningPath interface
      return Promise.resolve<LearningPath[]>([
        {
          id: 'lp1',
          title: 'Mastering Terraform with AI',
          description: 'Learn to leverage AI for efficient Terraform development.',
          progress: 20,
          estimatedHours: 8,
          difficulty: 'intermediate',
          skills: ['Terraform', 'HCL', 'AI Prompting', 'IaC Best Practices'],
          nextStep: 'Module 2: Advanced HCL with AI assistance',
          isActive: true
        },
      ]);
    },
    enabled: !!user?.id && isAuthenticated,
  });

  // Fetch Activity Stats (placeholder)
  const { 
    data: activityStatsData, 
    isLoading: isLoadingActivityStats,
    refetch: refetchActivityStats 
  } = useQuery<any, Error>({
    queryKey: ['activityStats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User ID not available");
      // This should fetch from an endpoint that consolidates activity data, potentially via the FastAPI service
      // The current activity.py router has /stats/{user_id}
      // const response = await apiClient.get(`/activity/stats/${user.id}`);
      // return response.data; 
      console.warn("Placeholder: Activity Stats query to be implemented. Using mock data.");
      return Promise.resolve({
        totalInteractions: 120,
        commonTools: ["kubectl", "docker", "terraform"],
        commonActivities: ["running_cli", "editing_config_file"],
        productivityScore: 75, // Example score
        activeDays: 15,
        insightsGenerated: 5,
      });
    },
    enabled: !!user?.id && isAuthenticated,
  });

  // Refresh all data
  const refreshMutation = useMutation({
    mutationFn: async () => {
      setIsRefreshing(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['aiRecommendations'] }),
        queryClient.invalidateQueries({ queryKey: ['workflowInsights'] }),
        queryClient.invalidateQueries({ queryKey: ['learningPaths'] }),
      ]);
    },
    onSettled: () => {
      setIsRefreshing(false);
    },
  });

  // Accept recommendation
  const acceptRecommendationMutation = useMutation({
    mutationFn: async (recommendationId: string) => {
      const response = await fetch(`/api/v1/recommendations/${recommendationId}/accept`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user?.id })
      });
      if (!response.ok) throw new Error('Failed to accept recommendation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiRecommendations'] });
    },
  });

  const handleAcceptRecommendation = (recommendationId: string) => {
    console.log(`Recommendation ${recommendationId} accepted by user: ${user?.id}`);
    // Placeholder: Call API to mark recommendation as accepted
    // mutationAccept.mutate(recommendationId);
    toast({
      title: "Recommendation Accepted",
      description: "The recommendation has been marked as accepted.",
    });
  };

  const handleRefreshData = () => {
    if (!user?.id) {
      toast({ title: "User not identified", description: "Cannot refresh data.", variant: "destructive" });
      return;
    }
    refetchRecommendations();
  };

  // Quick Stats - using activityStatsData or other relevant sources
  const quickStats = [
    { title: "AI Recommendations", value: recommendationsData?.length ?? 0, icon: Lightbulb, change: (recommendationsData?.length ?? 0) > 0 ? "+1" : "0" },
    { title: "Active Learning Paths", value: learningPathsData?.filter(lp => lp.isActive && lp.progress < 100).length ?? 0, icon: Zap, change: "+0" }, // Simplified change
    { title: "Workflow Insights", value: insightsData?.length ?? 0, icon: BarChart3, change: "+0" },
    { title: "Avg Productivity", value: `${activityStatsData?.productivityScore ?? 0}%`, icon: Activity, change: "+0%" },
  ];

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access your AI-powered dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI Career Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Personalized insights and recommendations powered by advanced AI
          </p>
        </div>
        <Button 
          onClick={handleRefreshData}
          disabled={isRefreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Quick Stats */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {quickStats.map((stat) => (
          <Card key={stat.title} className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          if (VALID_DASHBOARD_TABS.includes(value as DashboardTab)) {
            setActiveTab(value as DashboardTab);
          }
        }} 
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Recommendations
          </TabsTrigger>
          <TabsTrigger value="learning" className="gap-2">
            <Book className="h-4 w-4" />
            Learning Paths
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Target className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DashboardOverview />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI-Powered Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingRecommendations ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-20 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : isErrorRecommendations ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {recommendationsError?.message || "Could not load AI recommendations."}
                    </AlertDescription>
                  </Alert>
                ) : recommendationsData && recommendationsData.length > 0 ? (
                  <div className="space-y-4">
                    {recommendationsData.map((rec) => (
                      <RecommendationCard
                        key={rec.id}
                        recommendation={rec}
                        onAccept={() => handleAcceptRecommendation(rec.id)}
                        isAccepting={acceptRecommendationMutation.isPending}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No recommendations available. Keep using AI tools to get personalized suggestions!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="learning" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5 text-primary" />
                  Personalized Learning Paths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingPaths ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                        <div className="h-16 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : learningPathsData && learningPathsData.length > 0 ? (
                  <div className="space-y-6">
                    {learningPathsData.map((path) => (
                      <motion.div
                        key={path.id}
                        className="border rounded-lg p-6 space-y-4"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">{path.title}</h3>
                              {path.isActive && (
                                <Badge variant="default" className="gap-1">
                                  <Play className="h-3 w-3" />
                                  Active
                                </Badge>
                              )}
                              <Badge variant="outline">
                                {path.difficulty}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">{path.description}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {path.estimatedHours}h
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="h-4 w-4" />
                                {path.skills.length} skills
                              </span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="gap-2">
                            Continue
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>{path.progress}%</span>
                          </div>
                          <Progress value={path.progress} className="h-2" />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {path.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        {path.nextStep && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-sm font-medium">Next Step:</p>
                            <p className="text-sm text-muted-foreground">{path.nextStep}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No learning paths available. Complete your profile to get personalized recommendations!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Workflow Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingInsights ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
                        <div className="h-16 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : insightsData && insightsData.length > 0 ? (
                  <div className="space-y-4">
                    {insightsData.map((insight) => (
                      <motion.div
                        key={insight.id}
                        className="border rounded-lg p-4 space-y-3"
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{insight.title}</h4>
                              <Badge 
                                variant={insight.type === 'opportunity' ? 'default' : 
                                        insight.type === 'inefficiency' ? 'destructive' : 'secondary'}
                              >
                                {insight.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{insight.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">Impact: {insight.impact}%</div>
                            <div className="text-xs text-muted-foreground">{insight.frequency}</div>
                          </div>
                        </div>
                        
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm font-medium">Suggestion:</p>
                          <p className="text-sm text-muted-foreground">{insight.suggestion}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No insights available yet. Use the Chrome extension to track your workflow!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage; 