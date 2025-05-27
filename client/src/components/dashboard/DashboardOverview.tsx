import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Award,
  Book,
  Upload,
  Search,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";

interface WeeklyStats {
  toolsExplored: number;
  hoursLearned: number;
  skillsGained: number;
}

interface UserProgress {
  id: number;
  progressType: string;
  status: string;
  skillName?: string;
  hoursSpent?: number;
  progressPercentage?: number;
}

interface Recommendation {
  id: number;
  type: string;
  title: string;
  description: string;
}

export function DashboardOverview() {
  const { data: weeklyStats, isLoading: statsLoading } = useQuery<WeeklyStats>({
    queryKey: ["/api/progress/weekly-stats"],
    queryFn: async () => {
      const response = await fetch('/api/progress/weekly-stats');
      return response.json();
    }
  });

  const { data: progress, isLoading: progressLoading } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress"],
    queryFn: async () => {
      const response = await fetch('/api/progress');
      return response.json();
    }
  });

  const { data: recommendations, isLoading: recommendationsLoading } = useQuery<Recommendation[]>({
    queryKey: ["/api/recommendations", { limit: 3 }],
    queryFn: async () => {
      const response = await fetch('/api/recommendations?limit=3');
      return response.json();
    }
  });

  const currentLearningPath = progress?.find(
    (p: UserProgress) => p.progressType === "learning_path" && p.status === "in_progress"
  );

  const achievements = [
    { id: 1, name: "AI Explorer", icon: "🚀", earned: true },
    { id: 2, name: "Tool Master", icon: "🛠️", earned: true },
    { id: 3, name: "Quick Learner", icon: "⚡", earned: false },
    { id: 4, name: "Career Booster", icon: "🎯", earned: false },
  ];

  if (statsLoading || progressLoading || recommendationsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tools Explored</p>
                  <p className="text-3xl font-bold text-primary">
                    {weeklyStats?.toolsExplored || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Search className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hours Learned</p>
                  <p className="text-3xl font-bold text-secondary">
                    {weeklyStats?.hoursLearned?.toFixed(1) || "0.0"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Skills Gained</p>
                  <p className="text-3xl font-bold text-primary">
                    {weeklyStats?.skillsGained || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Learning Path */}
        <div className="lg:col-span-2">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="w-5 h-5 text-primary" />
                Current Learning Path
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentLearningPath ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {currentLearningPath.skillName || "AI Skills Development"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {Math.round((currentLearningPath.hoursSpent || 0) * 60)} minutes completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-secondary">
                        {currentLearningPath.progressPercentage || 0}% Complete
                      </div>
                      <Progress 
                        value={currentLearningPath.progressPercentage || 0} 
                        className="w-20 mt-1"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Book className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium mb-2">No Active Learning Path</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start your AI journey with a personalized learning path
                  </p>
                  <Button>Create Learning Path</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Achievements */}
        <div className="space-y-6">
          {/* Weekly Progress */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-lg">This Week's Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tools Explored</span>
                <span className="font-semibold">{weeklyStats?.toolsExplored || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Hours Learned</span>
                <span className="font-semibold">
                  {weeklyStats?.hoursLearned?.toFixed(1) || "0.0"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Skills Gained</span>
                <span className="font-semibold">{weeklyStats?.skillsGained || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Achievement Badges */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-lg">Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`text-center p-3 rounded-lg transition-all ${
                      achievement.earned
                        ? "bg-secondary/10 border border-secondary/20"
                        : "bg-muted"
                    }`}
                  >
                    <div className="text-2xl mb-1">{achievement.icon}</div>
                    <div className="text-xs font-medium">{achievement.name}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="ghost" className="w-full justify-start">
                <Upload className="w-4 h-4 mr-3" />
                Upload Resume
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Search className="w-4 h-4 mr-3" />
                Find AI Tools
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-3" />
                Schedule Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recommendations Preview */}
      {recommendations && recommendations.length > 0 && (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recommended for You</span>
              <Button variant="outline" size="sm">View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.slice(0, 3).map((rec: any) => (
                <div key={rec.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{rec.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {rec.matchScore}% Match
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {rec.description}
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Try Now
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
