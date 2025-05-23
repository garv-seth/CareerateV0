import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { 
  User, 
  Brain, 
  Target, 
  TrendingUp, 
  Award,
  Settings,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Lightbulb
} from "lucide-react";
import type { User as UserType } from "@shared/schema";

interface AIReadinessAssessment {
  score: number;
  level: string;
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    role: user?.role || "",
    company: user?.company || "",
    yearsExperience: user?.yearsExperience || 0,
    currentLevel: user?.currentLevel || "beginner",
    preferences: user?.preferences || {},
  });

  const { data: assessment, isLoading: assessmentLoading } = useQuery({
    queryKey: ["/api/profile/ai-assessment"],
    enabled: false, // Manual trigger
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserType>) => {
      const response = await apiRequest("PATCH", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const assessAIReadinessMutation = useMutation({
    mutationFn: async () => {
      // Since we don't have this endpoint in routes, we'll simulate the assessment
      // In a real implementation, this would call a backend service
      return new Promise<AIReadinessAssessment>((resolve) => {
        setTimeout(() => {
          const mockAssessment: AIReadinessAssessment = {
            score: user?.aiReadinessScore || Math.floor(Math.random() * 100),
            level: user?.currentLevel || "intermediate",
            recommendations: [
              "Learn GitHub Copilot for enhanced coding productivity",
              "Explore ChatGPT for documentation and problem-solving",
              "Practice with Cursor AI for intelligent code completion",
              "Understand AI prompt engineering fundamentals"
            ],
            strengths: [
              "Strong technical background",
              "Active learning mindset",
              "Good understanding of software development"
            ],
            weaknesses: [
              "Limited AI tool experience",
              "Needs exposure to modern AI workflows",
              "Could benefit from AI ethics training"
            ]
          };
          resolve(mockAssessment);
        }, 2000);
      });
    },
    onSuccess: (data) => {
      // Update user's AI readiness score
      updateProfileMutation.mutate({ aiReadinessScore: data.score });
      toast({
        title: "Assessment Complete",
        description: `Your AI readiness score is ${data.score}/100`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Assessment Failed",
        description: error.message || "Failed to complete AI assessment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const aiReadinessScore = user?.aiReadinessScore || 0;
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-secondary";
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return "Excellent! You're well-prepared for AI-enhanced workflows.";
    if (score >= 60) return "Good progress! Continue building your AI skills.";
    if (score >= 40) return "Getting started! Focus on fundamental AI tools.";
    return "Beginning your AI journey! Start with basic AI concepts.";
  };

  const currentAssessment = assessAIReadinessMutation.data || assessment;

  return (
    <div className="min-h-screen bg-background">
      <FloatingNavbar />
      
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Profile & AI Readiness
            </h1>
            <p className="text-xl text-muted-foreground">
              Manage your profile and track your AI adoption journey
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Profile Information
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        {isEditing ? "Cancel" : "Edit"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">Current Role</Label>
                        <Input
                          id="role"
                          placeholder="e.g., Software Engineer, Product Manager"
                          value={formData.role}
                          onChange={(e) => handleInputChange("role", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          placeholder="e.g., Google, Microsoft, Startup"
                          value={formData.company}
                          onChange={(e) => handleInputChange("company", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="experience">Years of Experience</Label>
                          <Input
                            id="experience"
                            type="number"
                            min="0"
                            max="50"
                            value={formData.yearsExperience}
                            onChange={(e) => handleInputChange("yearsExperience", parseInt(e.target.value) || 0)}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="currentLevel">AI Experience Level</Label>
                          <Select
                            value={formData.currentLevel}
                            onValueChange={(value) => handleInputChange("currentLevel", value)}
                            disabled={!isEditing}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {isEditing && (
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={updateProfileMutation.isPending}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      )}
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* AI Readiness Sidebar */}
            <div className="space-y-6">
              {/* AI Readiness Score */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      AI Readiness Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${getScoreColor(aiReadinessScore)}`}>
                      {aiReadinessScore}/100
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      {user?.currentLevel || "Beginner"} Level
                    </div>
                    <Progress value={aiReadinessScore} className="mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      {getScoreDescription(aiReadinessScore)}
                    </p>
                    <Button
                      onClick={() => assessAIReadinessMutation.mutate()}
                      disabled={assessAIReadinessMutation.isPending}
                      className="w-full"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${assessAIReadinessMutation.isPending ? 'animate-spin' : ''}`} />
                      {assessAIReadinessMutation.isPending ? "Assessing..." : "Retake Assessment"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Assessment Results */}
              {currentAssessment && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Assessment Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Strengths */}
                      {currentAssessment.strengths.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-secondary" />
                            Strengths
                          </h4>
                          <div className="space-y-1">
                            {currentAssessment.strengths.map((strength, index) => (
                              <Badge key={index} variant="secondary" className="text-xs block w-fit">
                                {strength}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Areas for Improvement */}
                      {currentAssessment.weaknesses.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                            Areas for Improvement
                          </h4>
                          <div className="space-y-1">
                            {currentAssessment.weaknesses.map((weakness, index) => (
                              <p key={index} className="text-xs text-muted-foreground">
                                • {weakness}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {currentAssessment.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-primary" />
                            Recommendations
                          </h4>
                          <div className="space-y-1">
                            {currentAssessment.recommendations.slice(0, 3).map((recommendation, index) => (
                              <p key={index} className="text-xs text-muted-foreground">
                                • {recommendation}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Experience</span>
                      <span className="font-semibold">{user?.yearsExperience || 0} years</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">AI Level</span>
                      <Badge variant="outline">{user?.currentLevel || "Beginner"}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Member Since</span>
                      <span className="font-semibold">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
