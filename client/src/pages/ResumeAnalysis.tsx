import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { 
  Upload, 
  FileText, 
  Brain, 
  TrendingUp, 
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Download,
  Trash2,
  RefreshCw,
  Star,
  Target
} from "lucide-react";
import type { Resume } from "@shared/schema";

export default function ResumeAnalysis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);

  const { data: resumes, isLoading } = useQuery<Resume[] | undefined>({
    queryKey: ["/api/resumes"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      
      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      setSelectedResume(data);
      toast({
        title: "Resume Analyzed",
        description: "Your resume has been uploaded and analyzed successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload and analyze resume",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (!file.type.includes('text') && !file.type.includes('pdf') && !file.type.includes('document')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a text file, PDF, or document.",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }
    if (file) {
      uploadMutation.mutate(file as File);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-secondary";
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return "Excellent! Your resume is well-optimized for AI-enhanced roles.";
    if (score >= 60) return "Good foundation! Some improvements will boost your AI readiness.";
    if (score >= 40) return "Getting started! Focus on highlighting relevant AI skills.";
    return "Needs improvement! Consider adding AI-related experience and skills.";
  };

  const currentResume = selectedResume || (resumes && resumes.length > 0 ? resumes[0] : null);

  return (
    <div className="min-h-screen bg-background">
      <FloatingNavbar />
      
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-foreground mb-2">
              AI-Powered Resume Analysis
            </h1>
            <p className="text-xl text-muted-foreground">
              Upload your resume to get personalized feedback and AI-enhanced optimization suggestions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Upload Resume
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                        isDragging
                          ? 'border-primary bg-primary/5'
                          : 'border-muted-foreground/25 hover:border-primary/50'
                      }`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">
                        {uploadMutation.isPending ? "Analyzing..." : "Drop your resume here"}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        or click to browse files
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports PDF, DOC, DOCX, TXT (Max 5MB)
                      </p>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                        className="hidden"
                      />
                    </div>

                    {uploadMutation.isPending && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Analyzing your resume...</span>
                        </div>
                        <Progress value={66} className="w-full" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Previous Resumes */}
              {resumes && resumes.length > 0 && (
                <motion.div
                  className="mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Previous Analyses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {resumes.slice(0, 5).map((resume: Resume) => (
                          <div
                            key={resume.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedResume?.id === resume.id
                                ? 'border-primary bg-primary/5'
                                : 'hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedResume(resume)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm truncate">
                                  {resume.fileName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {resume.uploadedAt ? new Date(resume.uploadedAt).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                              {resume.analysisResults?.overallScore && (
                                <div className={`text-lg font-bold ${getScoreColor(resume.analysisResults.overallScore)}`}>
                                  {resume.analysisResults.overallScore}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Analysis Results */}
            <div className="lg:col-span-2">
              {currentResume ? (
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {/* Overall Score */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        AI Readiness Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className={`text-4xl font-bold ${getScoreColor(currentResume.analysisResults?.overallScore || 0)}`}>
                            {currentResume.analysisResults?.overallScore || 0}/100
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {getScoreDescription(currentResume.analysisResults?.overallScore || 0)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground mb-1">Analyzed</div>
                          <div className="text-sm font-medium">
                            {currentResume.uploadedAt ? new Date(currentResume.uploadedAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <Progress 
                        value={currentResume.analysisResults?.overallScore || 0} 
                        className="mb-4" 
                      />

                      {/* Score Breakdown */}
                      {currentResume.analysisResults?.scoreBreakdown && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(currentResume.analysisResults.scoreBreakdown as Record<string, number>).map(([category, score]) => (
                            <div key={category} className="text-center">
                              <div className="text-2xl font-bold text-primary mb-1">
                                {score}
                              </div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {category.replace(/([A-Z])/g, ' $1').trim()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Suggestions */}
                  {currentResume.suggestions && currentResume.suggestions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="w-5 h-5" />
                          AI Enhancement Suggestions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {currentResume.suggestions.map((suggestion: string, index: number) => (
                            <div key={index} className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                              <Target className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm">{suggestion}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI-Enhanced Sections */}
                  {currentResume.analysisResults?.aiEnhancedSections && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="w-5 h-5" />
                          AI-Enhanced Content
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.entries(currentResume.analysisResults.aiEnhancedSections as Record<string, string>).map(([section, content]) => (
                            <div key={section} className="border rounded-lg p-4">
                              <h4 className="font-medium mb-2 capitalize flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-secondary" />
                                {section.replace(/([A-Z])/g, ' $1').trim()}
                              </h4>
                              <Textarea
                                value={content}
                                readOnly
                                className="min-h-[100px] bg-secondary/5"
                              />
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" variant="outline">
                                  <Download className="w-4 h-4 mr-2" />
                                  Copy
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Download Enhanced Resume
                    </Button>
                    <Button variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Re-analyze
                    </Button>
                    <Button variant="outline" size="icon">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card>
                    <CardContent className="text-center py-12">
                      <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Resume Uploaded</h3>
                      <p className="text-muted-foreground mb-6">
                        Upload your resume to get AI-powered analysis and enhancement suggestions
                      </p>
                      <Button onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Your Resume
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
