import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  Upload, 
  FileText, 
  Database, 
  Server, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Code,
  GitBranch,
  Play,
  Download,
  Eye,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AssessmentFormData {
  systemName: string;
  description: string;
  systemType: 'monolithic' | 'distributed' | 'microservices' | 'hybrid';
  primaryLanguage: string;
  framework: string;
  databaseType: string;
  hostingEnvironment: string;
  teamSize: number;
  businessCritical: boolean;
}

interface AnalysisResult {
  id: string;
  systemName: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  technologyStack?: any;
  securityAssessment?: any;
  performanceAnalysis?: any;
  costAnalysis?: any;
  recommendations?: any;
  createdAt: string;
}

export default function LegacyAnalysis() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<AssessmentFormData>({
    systemName: '',
    description: '',
    systemType: 'monolithic',
    primaryLanguage: '',
    framework: '',
    databaseType: '',
    hostingEnvironment: '',
    teamSize: 5,
    businessCritical: false
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [analysisStep, setAnalysisStep] = useState<'form' | 'upload' | 'analyzing' | 'results'>('form');
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);

  // Start legacy system assessment
  const startAssessmentMutation = useMutation({
    mutationFn: async (data: AssessmentFormData & { files?: File[] }) => {
      const formDataObj = new FormData();
      formDataObj.append('systemData', JSON.stringify(data));
      
      if (data.files) {
        data.files.forEach((file, index) => {
          formDataObj.append(`file_${index}`, file);
        });
      }

      const response = await apiRequest("POST", "/api/legacy-assessment/start", formDataObj);
      if (!response.ok) throw new Error("Failed to start assessment");
      return response.json();
    },
    onSuccess: (result) => {
      setCurrentAnalysis(result);
      setAnalysisStep('analyzing');
      toast({
        title: "Assessment Started",
        description: `Legacy system assessment for "${result.systemName}" has been initiated.`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Assessment Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Get assessment results
  const { data: analysisResults = [] } = useQuery({
    queryKey: ["/api/legacy-assessments"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/legacy-assessments");
      if (!response.ok) throw new Error("Failed to fetch assessments");
      return response.json();
    }
  });

  // Mock analysis result for demonstration
  const mockAnalysisResult: AnalysisResult = {
    id: "assessment-1",
    systemName: "Legacy ERP System",
    status: "completed",
    progress: 100,
    technologyStack: {
      languages: [
        { name: "Java", version: "8", usage: "primary", lineCount: 50000, lastUpdated: "2021-01-01" },
        { name: "JavaScript", version: "ES5", usage: "secondary", lineCount: 15000, lastUpdated: "2020-06-01" }
      ],
      frameworks: [
        { name: "Spring Boot", version: "1.5.22", category: "web", supportStatus: "deprecated" },
        { name: "jQuery", version: "1.12.4", category: "web", supportStatus: "maintenance" }
      ],
      databases: [
        { type: "MySQL", version: "5.7", size: "100GB", connections: 150, performance: "moderate" }
      ]
    },
    securityAssessment: {
      vulnerabilities: [
        { severity: "high", category: "dependency", description: "Log4j vulnerability", cveId: "CVE-2021-44228" },
        { severity: "medium", category: "configuration", description: "Weak SSL/TLS configuration" }
      ],
      securityScore: 45
    },
    performanceAnalysis: {
      bottlenecks: [
        { component: "database", type: "database", severity: "high", description: "Slow query performance" }
      ],
      performanceScore: 60
    },
    costAnalysis: {
      currentCosts: { total: 53000 },
      projectedCosts: { total: 58000 },
      savings: { annual: 15000, roi: 1.8 }
    },
    recommendations: {
      strategy: "refactor",
      priority: "high",
      complexity: "moderate",
      timelineEstimate: 16,
      recommendations: [
        "Upgrade to Java 11+ for better performance",
        "Migrate to Spring Boot 3.x",
        "Implement microservices architecture"
      ]
    },
    createdAt: "2025-09-15"
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartAssessment = () => {
    if (!formData.systemName.trim()) {
      toast({
        title: "Validation Error", 
        description: "System name is required",
        variant: "destructive"
      });
      return;
    }

    startAssessmentMutation.mutate({
      ...formData,
      files: uploadedFiles
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (analysisStep === 'results' || (currentAnalysis && currentAnalysis.status === 'completed')) {
    const result = mockAnalysisResult; // Use mock data for demo

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setLocation("/migration")}
                  className="p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">Legacy System Analysis Results</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" data-testid="button-download-report">
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
                <Button onClick={() => setLocation("/migration/planning")}>
                  Create Migration Plan
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Executive Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Executive Summary - {result.systemName}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {result.securityAssessment?.securityScore}/100
                  </div>
                  <div className="text-sm text-muted-foreground">Security Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-1">
                    {result.performanceAnalysis?.performanceScore}/100
                  </div>
                  <div className="text-sm text-muted-foreground">Performance Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    ${result.costAnalysis?.savings.annual.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Annual Savings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {result.recommendations?.timelineEstimate}
                  </div>
                  <div className="text-sm text-muted-foreground">Weeks Estimate</div>
                </div>
              </div>

              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Migration Strategy: {result.recommendations?.strategy.toUpperCase()}</AlertTitle>
                <AlertDescription>
                  Priority: {result.recommendations?.priority.toUpperCase()} | 
                  Complexity: {result.recommendations?.complexity.toUpperCase()} | 
                  Risk Level: {result.recommendations?.riskLevel || 'MEDIUM'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Detailed Analysis Tabs */}
          <Tabs defaultValue="technology" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="technology">Technology Stack</TabsTrigger>
              <TabsTrigger value="security">Security Assessment</TabsTrigger>
              <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
              <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="technology" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="h-5 w-5" />
                    <span>Technology Stack Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Languages */}
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Programming Languages</h4>
                    <div className="space-y-3">
                      {result.technologyStack?.languages.map((lang: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div>
                              <span className="font-medium">{lang.name} {lang.version}</span>
                              <Badge className="ml-2" variant={lang.usage === 'primary' ? 'default' : 'secondary'}>
                                {lang.usage}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <div>{lang.lineCount.toLocaleString()} lines</div>
                            <div>Last updated: {new Date(lang.lastUpdated).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Frameworks */}
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Frameworks & Libraries</h4>
                    <div className="space-y-3">
                      {result.technologyStack?.frameworks.map((framework: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <div>
                              <span className="font-medium">{framework.name} {framework.version}</span>
                              <Badge className="ml-2" variant={
                                framework.supportStatus === 'active' ? 'default' :
                                framework.supportStatus === 'deprecated' ? 'destructive' : 'secondary'
                              }>
                                {framework.supportStatus}
                              </Badge>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground capitalize">
                            {framework.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Databases */}
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Databases</h4>
                    <div className="space-y-3">
                      {result.technologyStack?.databases.map((db: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Database className="h-5 w-5 text-green-600" />
                            <div>
                              <span className="font-medium">{db.type} {db.version}</span>
                              <Badge className="ml-2" variant={
                                db.performance === 'good' ? 'default' :
                                db.performance === 'moderate' ? 'secondary' : 'destructive'
                              }>
                                {db.performance} performance
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <div>Size: {db.size}</div>
                            <div>{db.connections} connections</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security Assessment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="text-4xl font-bold text-orange-600">
                      {result.securityAssessment?.securityScore}/100
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Security Score</div>
                      <div className="text-muted-foreground">
                        {result.securityAssessment?.vulnerabilities.length} vulnerabilities found
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-3">Vulnerabilities</h4>
                    <div className="space-y-3">
                      {result.securityAssessment?.vulnerabilities.map((vuln: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <AlertTriangle className="h-5 w-5 text-orange-500" />
                              <span className="font-medium">{vuln.description}</span>
                            </div>
                            <Badge className={getSeverityColor(vuln.severity)}>
                              {vuln.severity}
                            </Badge>
                          </div>
                          {vuln.cveId && (
                            <div className="text-sm text-muted-foreground mb-2">
                              CVE ID: {vuln.cveId}
                            </div>
                          )}
                          <div className="text-sm">
                            <strong>Category:</strong> {vuln.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Performance Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="text-4xl font-bold text-yellow-600">
                      {result.performanceAnalysis?.performanceScore}/100
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Performance Score</div>
                      <div className="text-muted-foreground">
                        {result.performanceAnalysis?.bottlenecks.length} bottlenecks identified
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-3">Performance Bottlenecks</h4>
                    <div className="space-y-3">
                      {result.performanceAnalysis?.bottlenecks.map((bottleneck: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <Server className="h-5 w-5 text-blue-500" />
                              <span className="font-medium capitalize">{bottleneck.component}</span>
                            </div>
                            <Badge className={getSeverityColor(bottleneck.severity)}>
                              {bottleneck.severity}
                            </Badge>
                          </div>
                          <div className="text-sm mb-2">
                            <strong>Type:</strong> {bottleneck.type}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {bottleneck.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="costs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Cost Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <h4 className="text-lg font-semibold mb-3">Current Annual Costs</h4>
                      <div className="text-3xl font-bold text-red-600 mb-2">
                        ${result.costAnalysis?.currentCosts.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Infrastructure, maintenance, licensing, personnel
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="text-lg font-semibold mb-3">Projected Annual Costs</h4>
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        ${result.costAnalysis?.projectedCosts.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        After cloud migration and modernization
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 border rounded-lg bg-green-50">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        ${result.costAnalysis?.savings.annual.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Annual Savings</div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg bg-blue-50">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {result.costAnalysis?.savings.roi}x
                      </div>
                      <div className="text-sm text-muted-foreground">ROI Multiplier</div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg bg-purple-50">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        18
                      </div>
                      <div className="text-sm text-muted-foreground">Payback Period (months)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Migration Recommendations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Recommended Strategy: {result.recommendations?.strategy.toUpperCase()}</AlertTitle>
                    <AlertDescription>
                      This approach balances risk, cost, and business value for your specific system architecture.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-lg font-semibold text-orange-600 mb-1">
                        {result.recommendations?.priority.toUpperCase()}
                      </div>
                      <div className="text-sm text-muted-foreground">Priority</div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-lg font-semibold text-blue-600 mb-1">
                        {result.recommendations?.complexity.toUpperCase()}
                      </div>
                      <div className="text-sm text-muted-foreground">Complexity</div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-lg font-semibold text-green-600 mb-1">
                        {result.recommendations?.timelineEstimate} WEEKS
                      </div>
                      <div className="text-sm text-muted-foreground">Timeline</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-3">Key Recommendations</h4>
                    <div className="space-y-2">
                      {result.recommendations?.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center space-x-4 pt-6">
                    <Button onClick={() => setLocation("/migration/planning")} size="lg">
                      Create Migration Plan
                    </Button>
                    <Button variant="outline" onClick={() => setLocation("/migration/modernization")} size="lg">
                      Start Modernization
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  if (analysisStep === 'analyzing') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Analyzing Legacy System</h1>
              <Button variant="outline" onClick={() => setAnalysisStep('form')}>
                Cancel Analysis
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">AI-Powered System Analysis in Progress</CardTitle>
              <CardDescription>
                Our AI agents are comprehensively analyzing your legacy system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-12 w-12 text-blue-600 animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Analyzing: {formData.systemName}</h3>
                <Progress value={75} className="w-full max-w-md mx-auto" />
                <p className="text-muted-foreground mt-2">75% complete</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Technology stack detection completed</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Security vulnerability assessment completed</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Clock className="h-5 w-5 text-blue-500 animate-spin" />
                  <span>Performance analysis in progress...</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>Cost analysis pending</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>Migration recommendations pending</span>
                </div>
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => setAnalysisStep('results')} 
                  size="lg"
                  className="mt-4"
                >
                  View Results (Demo)
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Click to see sample analysis results
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/migration")}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Legacy System Analysis</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>System Assessment</span>
            </CardTitle>
            <CardDescription>
              Provide details about your legacy system for AI-powered analysis and migration planning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={analysisStep} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="form">System Details</TabsTrigger>
                <TabsTrigger value="upload">Upload Files</TabsTrigger>
              </TabsList>

              <TabsContent value="form" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="systemName">System Name *</Label>
                    <Input
                      id="systemName"
                      value={formData.systemName}
                      onChange={(e) => setFormData(prev => ({ ...prev, systemName: e.target.value }))}
                      placeholder="e.g., Legacy ERP System"
                      data-testid="input-system-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="systemType">System Type</Label>
                    <Select
                      value={formData.systemType}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, systemType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monolithic">Monolithic</SelectItem>
                        <SelectItem value="distributed">Distributed</SelectItem>
                        <SelectItem value="microservices">Microservices</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primaryLanguage">Primary Language</Label>
                    <Input
                      id="primaryLanguage"
                      value={formData.primaryLanguage}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryLanguage: e.target.value }))}
                      placeholder="e.g., Java, .NET, Python"
                      data-testid="input-primary-language"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="framework">Framework</Label>
                    <Input
                      id="framework"
                      value={formData.framework}
                      onChange={(e) => setFormData(prev => ({ ...prev, framework: e.target.value }))}
                      placeholder="e.g., Spring Boot, .NET Framework"
                      data-testid="input-framework"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="databaseType">Database Type</Label>
                    <Input
                      id="databaseType"
                      value={formData.databaseType}
                      onChange={(e) => setFormData(prev => ({ ...prev, databaseType: e.target.value }))}
                      placeholder="e.g., MySQL, Oracle, SQL Server"
                      data-testid="input-database-type"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hostingEnvironment">Hosting Environment</Label>
                    <Input
                      id="hostingEnvironment"
                      value={formData.hostingEnvironment}
                      onChange={(e) => setFormData(prev => ({ ...prev, hostingEnvironment: e.target.value }))}
                      placeholder="e.g., On-premises, AWS EC2, Azure VMs"
                      data-testid="input-hosting-environment"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">System Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the system's purpose, key features, and current challenges..."
                    className="min-h-[100px]"
                    data-testid="textarea-description"
                  />
                </div>

                <div className="flex justify-center">
                  <Button onClick={() => setAnalysisStep('upload')} size="lg">
                    Continue to File Upload
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-6">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload System Files</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload source code, configuration files, documentation, or infrastructure definitions
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".java,.js,.py,.cs,.php,.rb,.go,.ts,.jsx,.tsx,.xml,.json,.yml,.yaml,.properties,.conf,.md,.txt,.sql,.zip,.tar,.gz"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    data-testid="button-upload-files"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Select Files
                  </Button>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    Supported formats: Source code, configs, docs, archives (max 100MB each)
                  </p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Uploaded Files ({uploadedFiles.length})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="text-sm font-medium">{file.name}</span>
                              <div className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Data Privacy & Security</AlertTitle>
                  <AlertDescription>
                    Your files are encrypted in transit and at rest. Analysis is performed securely and 
                    files are deleted after processing. No code is stored permanently or shared.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-center space-x-4">
                  <Button variant="outline" onClick={() => setAnalysisStep('form')}>
                    Back to Details
                  </Button>
                  <Button 
                    onClick={handleStartAssessment}
                    disabled={startAssessmentMutation.isPending}
                    size="lg"
                    data-testid="button-start-assessment"
                  >
                    {startAssessmentMutation.isPending ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Starting Analysis...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start AI Analysis
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Assessments */}
        {analysisResults.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>
                View previous legacy system analyses and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisResults.map((assessment: AnalysisResult) => (
                  <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        assessment.status === 'completed' ? 'bg-green-500' :
                        assessment.status === 'running' ? 'bg-blue-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <span className="font-medium">{assessment.systemName}</span>
                        <div className="text-sm text-muted-foreground">
                          Created: {new Date(assessment.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={assessment.status === 'completed' ? 'default' : 'secondary'}>
                        {assessment.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}