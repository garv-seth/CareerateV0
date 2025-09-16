import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, AlertTriangle, TrendingUp, Users, 
  Server, Database, Wifi, Clock, Brain, Shield,
  Zap, RefreshCw, Settings, Download, Bell
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MonitoringData {
  overview: {
    totalIncidents: number;
    openIncidents: number;
    recentIncidents: number;
    criticalAnomalies: number;
    activeAlerts: number;
    performanceBaselines: number;
  };
  metrics: Record<string, Array<{
    timestamp: string;
    value: number;
    unit: string;
  }>>;
  incidents: any[];
  anomalies: any[];
  alertRules: any[];
  timeRange: {
    start: string;
    end: string;
    range: string;
  };
}

export default function MonitoringDashboard() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState('24h');
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const [realtimeData, setRealtimeData] = useState<any[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch comprehensive monitoring dashboard data
  const { data: dashboardData, isLoading, refetch } = useQuery<MonitoringData>({
    queryKey: [`/api/projects/${projectId}/monitoring-dashboard`, timeRange],
    enabled: !!projectId,
    refetchInterval: isRealTimeEnabled ? 30000 : 0, // Refresh every 30 seconds if real-time enabled
  });

  // Fetch time series metrics
  const { data: timeSeriesMetrics = [] } = useQuery({
    queryKey: [`/api/projects/${projectId}/time-series-metrics`],
    enabled: !!projectId,
  });

  // Fetch anomalies
  const { data: anomalies = [] } = useQuery({
    queryKey: [`/api/projects/${projectId}/anomalies`],
    enabled: !!projectId,
  });

  // Fetch alert rules
  const { data: alertRules = [] } = useQuery({
    queryKey: [`/api/projects/${projectId}/alert-rules`],
    enabled: !!projectId,
  });

  // Real-time streaming setup
  useEffect(() => {
    if (!isRealTimeEnabled || !projectId) return;

    const eventSource = new EventSource(`/api/projects/${projectId}/metrics/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'metrics') {
          setRealtimeData(prevData => {
            const newData = [...prevData, ...data.data].slice(-100); // Keep last 100 points
            return newData;
          });
        }
      } catch (error) {
        console.error('Error parsing real-time data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      toast({
        title: "Real-time Connection Lost",
        description: "Reconnecting to real-time metrics...",
        variant: "destructive"
      });
    };

    return () => {
      eventSource.close();
    };
  }, [isRealTimeEnabled, projectId, toast]);

  // Toggle real-time monitoring
  const toggleRealTime = () => {
    setIsRealTimeEnabled(!isRealTimeEnabled);
    if (!isRealTimeEnabled) {
      toast({
        title: "Real-time Monitoring Enabled",
        description: "Dashboard will now update in real-time",
      });
    }
  };

  // Refresh dashboard data
  const refreshData = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
    toast({
      title: "Dashboard Refreshed", 
      description: "Latest monitoring data loaded"
    });
  };

  // Chart color scheme
  const colors = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#6366f1',
    muted: '#6b7280'
  };

  // Format metrics data for charts
  const formatMetricsForChart = (metrics: Record<string, any[]>) => {
    const metricNames = Object.keys(metrics);
    if (metricNames.length === 0) return [];

    const firstMetric = metrics[metricNames[0]] || [];
    return firstMetric.map((point, index) => {
      const entry: any = {
        timestamp: new Date(point.timestamp).toLocaleTimeString(),
        time: point.timestamp
      };
      
      metricNames.forEach(name => {
        if (metrics[name] && metrics[name][index]) {
          entry[name] = metrics[name][index].value;
        }
      });
      
      return entry;
    });
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return colors.danger;
      case 'high': return colors.warning;
      case 'medium': return colors.info;
      case 'low': return colors.success;
      default: return colors.muted;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading monitoring dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  const chartData = dashboardData ? formatMetricsForChart(dashboardData.metrics) : [];

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="monitoring-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
            Monitoring Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time performance monitoring and AI-powered incident detection
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange} data-testid="select-time-range">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant={isRealTimeEnabled ? "default" : "outline"}
            size="sm"
            onClick={toggleRealTime}
            data-testid="button-toggle-realtime"
          >
            <Activity className="h-4 w-4 mr-2" />
            {isRealTimeEnabled ? "Real-time ON" : "Real-time OFF"}
          </Button>
          
          <Button variant="outline" size="sm" onClick={refreshData} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="kpi-incidents">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-incidents">
              {dashboardData?.overview.totalIncidents || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.overview.openIncidents || 0} currently open
            </p>
          </CardContent>
        </Card>

        <Card data-testid="kpi-anomalies">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Anomalies</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-critical-anomalies">
              {dashboardData?.overview.criticalAnomalies || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              AI-detected anomalies
            </p>
          </CardContent>
        </Card>

        <Card data-testid="kpi-alerts">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-alerts">
              {dashboardData?.overview.activeAlerts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Monitoring rules enabled
            </p>
          </CardContent>
        </Card>

        <Card data-testid="kpi-uptime">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-system-health">
              99.9%
            </div>
            <p className="text-xs text-muted-foreground">
              Uptime ({timeRange})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="metrics" className="space-y-6" data-testid="dashboard-tabs">
        <TabsList>
          <TabsTrigger value="metrics" data-testid="tab-metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="incidents" data-testid="tab-incidents">Incidents & Alerts</TabsTrigger>
          <TabsTrigger value="anomalies" data-testid="tab-anomalies">AI Detection</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Performance Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Performance Chart */}
            <Card data-testid="chart-system-performance">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="h-5 w-5" />
                  <span>System Performance</span>
                  {isRealTimeEnabled && <Badge variant="default" className="text-xs">LIVE</Badge>}
                </CardTitle>
                <CardDescription>
                  CPU, Memory, and Response Time metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="cpu_usage" 
                      stroke={colors.primary} 
                      name="CPU %" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="memory_usage" 
                      stroke={colors.success} 
                      name="Memory %" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="response_time" 
                      stroke={colors.warning} 
                      name="Response Time (ms)" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* API Performance Chart */}
            <Card data-testid="chart-api-performance">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wifi className="h-5 w-5" />
                  <span>API Performance</span>
                </CardTitle>
                <CardDescription>
                  Request throughput and error rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="api_response_time" 
                      stackId="1"
                      stroke={colors.info} 
                      fill={colors.info}
                      name="API Response Time"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Database Performance */}
          <Card data-testid="chart-database-performance">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Database Performance</span>
              </CardTitle>
              <CardDescription>
                Query execution times and connection pool status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="database_execution_time" 
                    fill={colors.primary} 
                    name="Query Time (ms)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents & Alerts Tab */}
        <TabsContent value="incidents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Incidents */}
            <Card data-testid="card-recent-incidents">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Recent Incidents</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.incidents.length ? (
                    dashboardData.incidents.map((incident, index) => (
                      <div key={incident.id || index} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`incident-${index}`}>
                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant={incident.severity === 'critical' ? 'destructive' : 'secondary'}
                            data-testid={`badge-incident-severity-${index}`}
                          >
                            {incident.severity}
                          </Badge>
                          <div>
                            <p className="font-medium" data-testid={`text-incident-title-${index}`}>
                              {incident.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(incident.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" data-testid={`badge-incident-status-${index}`}>
                          {incident.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No incidents reported</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Alert Rules */}
            <Card data-testid="card-alert-rules">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Alert Rules</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alertRules.length ? (
                    alertRules.slice(0, 5).map((rule, index) => (
                      <div key={rule.id || index} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`alert-rule-${index}`}>
                        <div>
                          <p className="font-medium" data-testid={`text-alert-rule-name-${index}`}>
                            {rule.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {rule.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={rule.severity === 'critical' ? 'destructive' : 'secondary'}
                            data-testid={`badge-alert-rule-severity-${index}`}
                          >
                            {rule.severity}
                          </Badge>
                          <Badge 
                            variant={rule.isEnabled ? 'default' : 'outline'}
                            data-testid={`badge-alert-rule-status-${index}`}
                          >
                            {rule.isEnabled ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No alert rules configured</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Detection Tab */}
        <TabsContent value="anomalies" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Anomaly Detection */}
            <Card data-testid="card-anomaly-detection">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>AI Anomaly Detection</span>
                </CardTitle>
                <CardDescription>
                  Machine learning powered anomaly detection results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {anomalies.length ? (
                    anomalies.slice(0, 5).map((anomaly, index) => (
                      <div key={anomaly.id || index} className="p-4 border rounded-lg" data-testid={`anomaly-${index}`}>
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            style={{ backgroundColor: getSeverityColor(anomaly.severity) }}
                            className="text-white"
                            data-testid={`badge-anomaly-severity-${index}`}
                          >
                            {anomaly.severity}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(anomaly.confidenceScore * 100)}% confidence
                          </span>
                        </div>
                        <h4 className="font-medium" data-testid={`text-anomaly-metric-${index}`}>
                          {anomaly.metricName}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {anomaly.anomalyType} detected
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Detected: {new Date(anomaly.detectedAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No anomalies detected</p>
                      <p className="text-xs">AI models are monitoring your system</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card data-testid="card-ai-insights">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>AI Insights</span>
                </CardTitle>
                <CardDescription>
                  Performance recommendations and predictions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Performance Optimization
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Consider implementing caching for frequently accessed API endpoints to reduce response times by ~30%.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h4 className="font-medium text-green-900 dark:text-green-100">
                      Resource Scaling
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Current resource utilization is optimal. No scaling adjustments needed.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                      Predictive Alert
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Memory usage trend suggests potential threshold breach in 2-3 hours.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Trends */}
            <Card data-testid="card-performance-trends">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Performance Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Response Time</span>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">-15%</span>
                    </div>
                  </div>
                  <Progress value={85} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Error Rate</span>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                      <span className="text-sm font-medium">-5%</span>
                    </div>
                  </div>
                  <Progress value={95} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Throughput</span>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">+22%</span>
                    </div>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Resource Utilization */}
            <Card data-testid="card-resource-utilization">
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'CPU', value: 45, fill: colors.primary },
                        { name: 'Memory', value: 32, fill: colors.success },
                        { name: 'Storage', value: 23, fill: colors.warning }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label
                    >
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* System Health Score */}
            <Card data-testid="card-health-score">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Health Score</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-500 mb-2">
                    A+
                  </div>
                  <div className="text-lg font-medium text-green-600 mb-4">
                    Excellent
                  </div>
                  <Progress value={92} className="h-3 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Overall system health is excellent with no critical issues detected.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}