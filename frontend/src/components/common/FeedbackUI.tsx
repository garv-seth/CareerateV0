import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from '@/lib/utils';

interface FeedbackUIProps {
  recommendationId: string;
  onFeedbackSubmit: (feedback: { recommendationId: string; rating: 'like' | 'dislike'; comment?: string }) => void;
  className?: string;
}

const FeedbackUI: React.FC<FeedbackUIProps> = ({ recommendationId, onFeedbackSubmit, className }) => {
  const [feedbackType, setFeedbackType] = useState<'like' | 'dislike' | null>(null);
  const [comment, setComment] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);

  const handleFeedback = (type: 'like' | 'dislike') => {
    setFeedbackType(type);
    setShowCommentBox(true); // Show comment box when like/dislike is clicked
    // Optionally, submit immediately without comment:
    // onFeedbackSubmit({ recommendationId, rating: type }); 
  };

  const handleSubmitComment = () => {
    if (feedbackType) {
      onFeedbackSubmit({ recommendationId, rating: feedbackType, comment });
      setFeedbackType(null); // Reset after submit
      setComment('');
      setShowCommentBox(false);
    }
  };

  return (
    <div className={cn("mt-4 flex flex-col items-start gap-2", className)}>
      <div className="flex gap-2">
        <Button 
          variant={feedbackType === 'like' ? "default" : "outline"} 
          size="icon" 
          onClick={() => handleFeedback('like')}
          aria-label="Like recommendation"
        >
          <ThumbsUp className={cn("h-5 w-5", feedbackType === 'like' ? "text-green-500" : "text-muted-foreground")} />
        </Button>
        <Button 
          variant={feedbackType === 'dislike' ? "default" : "outline"} 
          size="icon" 
          onClick={() => handleFeedback('dislike')}
          aria-label="Dislike recommendation"
        >
          <ThumbsDown className={cn("h-5 w-5", feedbackType === 'dislike' ? "text-red-500" : "text-muted-foreground")} />
        </Button>
      </div>
      {showCommentBox && feedbackType && (
        <div className="w-full mt-2 flex flex-col gap-2 items-end">
          <Textarea 
            placeholder={`Any additional feedback on why you ${feedbackType}d this? (Optional)`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full"
          />
          <Button onClick={handleSubmitComment} size="sm">
            Submit Feedback
          </Button>
        </div>
      )}
    </div>
  );
};

export default FeedbackUI; 