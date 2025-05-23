import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { RecommendationCard } from "@/components/dashboard/RecommendationCard";
import { ProgressTracker } from "@/components/dashboard/ProgressTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Target,
  MessageSquare,
  Lightbulb,
  RefreshCw
} from "lucide-react";
import type { Recommendation } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ["/api/recommendations"],
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ["/api/insights"],
  });

  const generateRecommendationsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/recommendations/generate", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({
        title: "Recommendations Updated",
        description: "New personalized recommendations have been generated based on your profile.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate recommendations",
        variant: "destructive",
      });
    },
  });

  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/insights/generate", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      toast({
        title: "Insights Updated",
        description: "Latest career insights have been generated from market data.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate insights",
        variant: "destructive",
      });
    },
  });

  const updateRecommendationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/recommendations/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({
        title: "Recommendation Updated",
        description: "Your preference has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update recommendation",
        variant: "destructive",
      });
    },
  });

  const handleAcceptRecommendation = (id: number) => {
    updateRecommendationMutation.mutate({ id, status: "accepted" });
  };

  const handleDismissRecommendation = (id: number) => {
    updateRecommendationMutation.mutate({ id, status: "dismissed" });
  };

  const aiReadinessScore = user?.aiReadinessScore || 0;
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-secondary";
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  const getScoreLevel = (score: number) => {
    if (score >= 80) return "Advanced";
    if (score >= 60) return "Intermediate";
    return "Beginner";
  };

  return (
    <div className="min-h-screen bg-background">
      <FloatingNavbar />
      
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  Welcome back, {user?.firstName || "User"}! 👋
                </h1>
                <p className="text-xl text-muted-foreground">
                  {user?.role || "Professional"} • {user?.company || "Tech Professional"}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Brain className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">AI Readiness Score</div>
                      <div className={`text-2xl font-bold ${getScoreColor(aiReadinessScore)}`}>
                        {aiReadinessScore}/100
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getScoreLevel(aiReadinessScore)} Level
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Button
              variant="outline"
              className="h-16 flex-col gap-2"
              onClick={() => generateRecommendationsMutation.mutate()}
              disabled={generateRecommendationsMutation.isPending}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-sm">
                {generateRecommendationsMutation.isPending ? "Generating..." : "Get AI Recommendations"}
              </span>
            </Button>
            
            <Button
              variant="outline"
              className="h-16 flex-col gap-2"
              onClick={() => generateInsightsMutation.mutate()}
              disabled={generateInsightsMutation.isPending}
            >
              <Lightbulb className="w-5 h-5" />
              <span className="text-sm">
                {generateInsightsMutation.isPending ? "Analyzing..." : "Career Insights"}
              </span>
            </Button>
            
            <Button
              variant="outline"
              className="h-16 flex-col gap-2"
              onClick={() => setActiveTab("progress")}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">Track Progress</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-16 flex-col gap-2"
              onClick={() => window.location.href = "/tools"}
            >
              <Target className="w-5 h-5" />
              <span className="text-sm">Explore Tools</span>
            </Button>
          </motion.div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="recommendations">
                Recommendations
                {recommendations && recommendations.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {recommendations.filter((r: Recommendation) => r.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <DashboardOverview />
            </TabsContent>

            <TabsContent value="recommendations" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">AI-Powered Recommendations</h2>
                    <p className="text-muted-foreground">
                      Personalized suggestions to accelerate your career growth
                    </p>
                  </div>
                  <Button
                    onClick={() => generateRecommendationsMutation.mutate()}
                    disabled={generateRecommendationsMutation.isPending}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${generateRecommendationsMutation.isPending ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                {recommendationsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                          <div className="h-16 bg-muted rounded"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : recommendations && recommendations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map((recommendation: Recommendation) => (
                      <RecommendationCard
                        key={recommendation.id}
                        recommendation={recommendation}
                        onAccept={handleAcceptRecommendation}
                        onDismiss={handleDismissRecommendation}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Generate personalized AI recommendations based on your profile and career goals
                      </p>
                      <Button onClick={() => generateRecommendationsMutation.mutate()}>
                        Generate Recommendations
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
              <ProgressTracker />
            </TabsContent>

            <TabsContent value="insights" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Career Insights</h2>
                    <p className="text-muted-foreground">
                      Data-driven insights to guide your career decisions
                    </p>
                  </div>
                  <Button
                    onClick={() => generateInsightsMutation.mutate()}
                    disabled={generateInsightsMutation.isPending}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${generateInsightsMutation.isPending ? 'animate-spin' : ''}`} />
                    Update Insights
                  </Button>
                </div>

                {insightsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-16 bg-muted rounded"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : insights && insights.length > 0 ? (
                  <div className="space-y-6">
                    {insights.map((insight: any) => (
                      <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Card className="card-hover">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  {insight.insightType === 'market_trend' && <TrendingUp className="w-5 h-5 text-primary" />}
                                  {insight.insightType === 'skill_gap' && <Target className="w-5 h-5 text-orange-500" />}
                                  {insight.insightType === 'opportunity' && <Lightbulb className="w-5 h-5 text-secondary" />}
                                  {insight.title}
                                </CardTitle>
                                <Badge variant="outline" className="mt-2">
                                  {insight.insightType.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Relevance</div>
                                <div className="text-lg font-bold text-primary">
                                  {insight.relevanceScore}%
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground mb-4">
                              {insight.content}
                            </p>
                            
                            {insight.actionItems && insight.actionItems.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Recommended Actions:</h4>
                                <ul className="space-y-1">
                                  {insight.actionItems.map((action: string, index: number) => (
                                    <li key={index} className="text-sm text-muted-foreground flex items-center">
                                      <Target className="w-3 h-3 mr-2 text-primary" />
                                      {action}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Lightbulb className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Insights Available</h3>
                      <p className="text-muted-foreground mb-6">
                        Generate career insights based on the latest market trends and your profile
                      </p>
                      <Button onClick={() => generateInsightsMutation.mutate()}>
                        Generate Insights
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
