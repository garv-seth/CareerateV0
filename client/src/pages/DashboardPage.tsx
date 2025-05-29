import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Activity
} from 'lucide-react';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { RecommendationCard } from '@/components/dashboard/RecommendationCard';
import { ProgressTracker } from '@/components/dashboard/ProgressTracker';
import { useUserStore } from '@/state/userStore';

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
  const { userId, isAuthenticated } = useUserStore();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Real-time AI recommendations
  const { data: recommendations, isLoading: recommendationsLoading, error: recommendationsError } = useQuery<AIRecommendation[]>({
    queryKey: ['ai-recommendations', userId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/recommendations/ai-powered?userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return response.json();
    },
    enabled: !!userId && isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Workflow insights
  const { data: insights, isLoading: insightsLoading } = useQuery<WorkflowInsight[]>({
    queryKey: ['workflow-insights', userId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/activity/insights?userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch insights');
      return response.json();
    },
    enabled: !!userId && isAuthenticated,
  });

  // Learning paths
  const { data: learningPaths, isLoading: pathsLoading } = useQuery<LearningPath[]>({
    queryKey: ['learning-paths', userId],
    queryFn: async () => {
      const response = await fetch(`/api/learning-path/personalized?userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch learning paths');
      return response.json();
    },
    enabled: !!userId && isAuthenticated,
  });

  // Refresh all data
  const refreshMutation = useMutation({
    mutationFn: async () => {
      setIsRefreshing(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] }),
        queryClient.invalidateQueries({ queryKey: ['workflow-insights'] }),
        queryClient.invalidateQueries({ queryKey: ['learning-paths'] }),
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
        body: JSON.stringify({ userId })
      });
      if (!response.ok) throw new Error('Failed to accept recommendation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4 md:p-8">
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
          onClick={() => refreshMutation.mutate()}
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
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">AI Recommendations</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {recommendations?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Active Paths</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {learningPaths?.filter(p => p.isActive).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Insights</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {insights?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Productivity</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  +{Math.round(Math.random() * 30 + 15)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
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
                {recommendationsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-20 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : recommendationsError ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Failed to load recommendations. Please try refreshing.
                    </AlertDescription>
                  </Alert>
                ) : recommendations && recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.map((rec) => (
                      <RecommendationCard
                        key={rec.id}
                        recommendation={rec}
                        onAccept={() => acceptRecommendationMutation.mutate(rec.id)}
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
                {pathsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                        <div className="h-16 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : learningPaths && learningPaths.length > 0 ? (
                  <div className="space-y-6">
                    {learningPaths.map((path) => (
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
                {insightsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
                        <div className="h-16 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : insights && insights.length > 0 ? (
                  <div className="space-y-4">
                    {insights.map((insight) => (
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