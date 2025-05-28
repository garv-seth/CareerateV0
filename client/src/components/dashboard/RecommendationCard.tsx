import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ExternalLink, CheckCircle, X } from "lucide-react";
import { motion } from "framer-motion";
import type { Recommendation } from "@shared/schema";

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAccept?: (id: number) => void;
  onDismiss?: (id: number) => void;
}

export function RecommendationCard({ 
  recommendation, 
  onAccept, 
  onDismiss 
}: RecommendationCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ai_tool': return '🛠️';
      case 'skill_development': return '📚';
      case 'learning_path': return '🎯';
      default: return '💡';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="card-hover h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getTypeIcon(recommendation.type)}</span>
              <CardTitle className="text-lg leading-tight">
                {recommendation.title}
              </CardTitle>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={getPriorityColor(recommendation.priority || 'low')}>
                {recommendation.priority}
              </Badge>
              {recommendation.matchScore && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-xs font-medium">
                    {recommendation.matchScore}% match
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {recommendation.description}
          </p>

          {recommendation.reasoning && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Why this recommendation:</strong> {recommendation.reasoning}
              </p>
            </div>
          )}

          {/* Metadata Display */}
          {recommendation.metadata && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(recommendation.metadata as Record<string, any>).map(([key, value]) => {
                if (key === 'category' || key === 'difficulty') {
                  return (
                    <Badge key={key} variant="outline" className="text-xs">
                      {String(value)}
                    </Badge>
                  );
                }
                return null;
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {recommendation.status === 'pending' && (
              <>
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onAccept?.(recommendation.id)}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Accept
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onDismiss?.(recommendation.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
            
            {recommendation.status === 'accepted' && (
              <Button size="sm" className="flex-1" variant="outline">
                <ExternalLink className="w-4 h-4 mr-1" />
                View Details
              </Button>
            )}

            {recommendation.status === 'dismissed' && (
              <Badge variant="secondary" className="w-full justify-center">
                Dismissed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
