import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  CheckCircle2, 
  PlayCircle,
  Target
} from "lucide-react";
import { motion } from "framer-motion";

// Define UserProgress type locally since @shared/schema doesn't exist
interface UserProgress {
  id: string;
  status: 'completed' | 'in_progress' | 'not_started';
  hoursSpent?: number;
  progressType: 'tool_completion' | 'skill_acquisition' | 'learning_path';
  skillName?: string;
  progressPercentage?: number;
  completedAt?: string;
  achievements?: string[];
}

export function ProgressTracker() {
  const { data: progress, isLoading } = useQuery({
    queryKey: ["/api/progress"],
  });



  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const progressItems = Array.isArray(progress) ? progress : [];
  const completedItems = progressItems.filter((item: UserProgress) => item.status === 'completed');
  const inProgressItems = progressItems.filter((item: UserProgress) => item.status === 'in_progress');
  const overallProgress = progressItems.length > 0 
    ? Math.round((completedItems.length / progressItems.length) * 100)
    : 0;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Overall Progress Summary */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Your Learning Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {overallProgress}%
              </div>
              <p className="text-sm text-muted-foreground">Overall Progress</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-1">
                {completedItems.length}
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-1">
                {inProgressItems.length}
              </div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-1">
                {Math.round(progressItems.reduce((sum: number, item: UserProgress) => 
                  sum + (item.hoursSpent || 0), 0))}h
              </div>
              <p className="text-sm text-muted-foreground">Time Invested</p>
            </div>
          </div>
          
          <div className="mt-6">
            <Progress value={overallProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Active Learning Items */}
      {inProgressItems.length > 0 && (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-orange-500" />
              Currently Learning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {inProgressItems.map((item: UserProgress) => (
              <motion.div
                key={item.id}
                className="flex items-center justify-between p-4 bg-muted rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    {item.progressType === 'tool_completion' && (
                      <Target className="w-5 h-5 text-white" />
                    )}
                    {item.progressType === 'skill_acquisition' && (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    )}
                    {item.progressType === 'learning_path' && (
                      <TrendingUp className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {item.skillName || 'Unnamed Learning Item'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {item.hoursSpent ? `${item.hoursSpent.toFixed(1)} hours completed` : 'Just started'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-orange-500 mb-1">
                    {item.progressPercentage || 0}% Complete
                  </div>
                  <Progress 
                    value={item.progressPercentage || 0} 
                    className="w-24"
                  />
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-secondary" />
              Completed ({completedItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedItems.slice(0, 6).map((item: UserProgress) => (
                <motion.div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <div>
                      <h5 className="font-medium text-sm">
                        {item.skillName || 'Learning Item'}
                      </h5>
                      {item.completedAt && (
                        <p className="text-xs text-muted-foreground">
                          Completed {new Date(item.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {item.achievements && item.achievements.length > 0 && (
                    <div className="flex gap-1">
                      {item.achievements.slice(0, 2).map((achievement: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {achievement}
                        </Badge>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            
            {completedItems.length > 6 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  View All Completed Items
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {progressItems.length === 0 && (
        <Card className="card-hover">
          <CardContent className="text-center py-12">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start Your Learning Journey</h3>
            <p className="text-muted-foreground mb-6">
              Begin tracking your progress with AI tools and skills development
            </p>
            <Button>Explore AI Tools</Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
