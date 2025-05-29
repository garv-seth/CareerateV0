import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  ExternalLink, 
  Clock, 
  TrendingUp, 
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';

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

interface RecommendationCardProps {
  recommendation: AIRecommendation;
  onAccept: () => void;
  isAccepting?: boolean;
  onDismiss?: () => void;
  onLearnMore?: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  recommendation,
  onAccept,
  isAccepting = false,
  onDismiss,
  onLearnMore
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tool':
        return <Zap className="h-4 w-4" />;
      case 'skill':
        return <Brain className="h-4 w-4" />;
      case 'learning_path':
        return <Target className="h-4 w-4" />;
      case 'optimization':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getImpactVariant = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleAction = () => {
    if (recommendation.actionUrl) {
      window.open(recommendation.actionUrl, '_blank', 'noopener,noreferrer');
    } else if (onLearnMore) {
      onLearnMore();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="w-full"
    >
      <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getImpactColor(recommendation.estimatedImpact)}/10`}>
                {getTypeIcon(recommendation.type)}
              </div>
              <div>
                <CardTitle className="text-lg leading-tight text-foreground">
                  {recommendation.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {recommendation.category}
                  </Badge>
                  <Badge variant={getImpactVariant(recommendation.estimatedImpact)} className="text-xs">
                    {recommendation.estimatedImpact} impact
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-muted-foreground">
                Confidence
              </div>
              <div className="text-lg font-bold text-primary">
                {Math.round(recommendation.confidence * 100)}%
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {recommendation.description}
          </p>

          {/* Confidence Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">AI Confidence</span>
              <span className="font-medium">{Math.round(recommendation.confidence * 100)}%</span>
            </div>
            <Progress 
              value={recommendation.confidence * 100} 
              className="h-2"
            />
          </div>

          {/* Time to Implement */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Time to implement: {recommendation.timeToImplement}</span>
          </div>

          {/* AI Reasoning */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Reasoning</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {recommendation.reasoning}
            </p>
          </div>

          {/* Prerequisites */}
          {recommendation.prerequisites && recommendation.prerequisites.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Prerequisites</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {recommendation.prerequisites.map((prereq, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {prereq}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Related Tools */}
          {recommendation.relatedTools && recommendation.relatedTools.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Related Tools</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {recommendation.relatedTools.map((tool, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={onAccept}
              disabled={isAccepting}
              className="flex-1 gap-2"
              size="sm"
            >
              {isAccepting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Accept
                </>
              )}
            </Button>
            
            {(recommendation.actionUrl || onLearnMore) && (
              <Button 
                variant="outline"
                size="sm"
                onClick={handleAction}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Learn More
              </Button>
            )}

            {onDismiss && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="px-3"
              >
                Dismiss
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export { RecommendationCard };
export default RecommendationCard;
