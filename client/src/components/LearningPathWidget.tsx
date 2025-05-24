import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Trophy, CheckCircle, ArrowRight, Star, Target, Play } from 'lucide-react';

interface LearningStep {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'tool' | 'project' | 'certification';
  provider: string;
  url: string;
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
  completed: boolean;
  order: number;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
  estimatedTotalHours: number;
  remainingHours: number;
  targetRole: string;
  skills: string[];
  steps: LearningStep[];
  milestones: {
    stepId: string;
    title: string;
    reward: string;
    achieved: boolean;
  }[];
  lastUpdated: string;
}

export default function LearningPathWidget() {
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<string | null>(null);

  useEffect(() => {
    fetchLearningPath();
  }, []);

  const fetchLearningPath = async () => {
    try {
      const response = await fetch('/api/learning-path/user-123'); // Mock user ID
      const data = await response.json();
      setLearningPath(data);
      
      // Set first incomplete step as active
      const firstIncomplete = data.steps.find((step: LearningStep) => !step.completed);
      if (firstIncomplete) {
        setActiveStep(firstIncomplete.id);
      }
    } catch (error) {
      console.error('Error fetching learning path:', error);
    } finally {
      setLoading(false);
    }
  };

  const markStepComplete = async (stepId: string) => {
    try {
      await fetch('/api/learning-path/user-123/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, completed: true, hoursSpent: 0 })
      });
      
      // Refresh data
      fetchLearningPath();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="w-4 h-4" />;
      case 'tool': return <Star className="w-4 h-4" />;
      case 'project': return <Target className="w-4 h-4" />;
      case 'certification': return <Trophy className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'course': return 'bg-blue-100 text-blue-700';
      case 'tool': return 'bg-purple-100 text-purple-700';
      case 'project': return 'bg-green-100 text-green-700';
      case 'certification': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 font-sfpro">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-2 bg-gray-200 rounded w-full mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!learningPath) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 font-sfpro">
        <div className="text-center text-gray-500">
          <BookOpen className="w-8 h-8 mx-auto mb-2" />
          <p>No learning path found</p>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Generate Learning Path
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 font-sfpro">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">{learningPath.title}</h3>
          <div className="text-sm text-gray-500">
            {learningPath.completedSteps} / {learningPath.totalSteps} completed
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-4">{learningPath.description}</p>
        
        {/* Progress Bar */}
        <div className="relative">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${learningPath.progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{learningPath.progressPercentage}% Complete</span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {learningPath.remainingHours}h remaining
            </span>
          </div>
        </div>
      </div>

      {/* Skills & Target Role */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-900">Target Role</h4>
          <span className="text-sm font-medium text-purple-600">{learningPath.targetRole}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {learningPath.skills.map(skill => (
            <span key={skill} className="px-2 py-1 bg-white text-xs font-medium text-gray-700 rounded-full border">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Learning Steps */}
      <div className="space-y-4 mb-6">
        <h4 className="font-semibold text-gray-900 flex items-center">
          <BookOpen className="w-4 h-4 mr-2" />
          Learning Steps
        </h4>
        
        {learningPath.steps.slice(0, 5).map((step, index) => (
          <div 
            key={step.id} 
            className={`border rounded-lg p-4 transition-all cursor-pointer ${
              step.completed 
                ? 'bg-green-50 border-green-200' 
                : activeStep === step.id 
                  ? 'bg-blue-50 border-blue-200 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-semibold">{step.order}</span>
                  )}
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">{step.title}</h5>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(step.type)}`}>
                  {getTypeIcon(step.type)}
                  {step.type}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(step.difficulty)}`}>
                  {step.difficulty}
                </span>
                <span className="text-xs text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {step.estimatedHours}h
                </span>
              </div>
            </div>

            {/* Expanded Step Details */}
            {activeStep === step.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Provider: {step.provider}</p>
                    <div className="flex flex-wrap gap-1">
                      {step.skills.map(skill => (
                        <span key={skill} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <a 
                      href={step.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Start
                    </a>
                    {!step.completed && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          markStepComplete(step.id);
                        }}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {learningPath.steps.length > 5 && (
          <div className="text-center">
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center mx-auto">
              View all {learningPath.steps.length} steps
              <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Milestones */}
      {learningPath.milestones.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 flex items-center mb-3">
            <Trophy className="w-4 h-4 mr-2" />
            Milestones
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {learningPath.milestones.map(milestone => (
              <div 
                key={milestone.stepId}
                className={`p-3 rounded-lg border ${
                  milestone.achieved 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{milestone.title}</span>
                  {milestone.achieved && <Trophy className="w-4 h-4 text-yellow-500" />}
                </div>
                <p className="text-xs text-gray-600">{milestone.reward}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-shadow">
          Continue Learning
        </button>
        <button className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          Customize Path
        </button>
      </div>
    </div>
  );
} 