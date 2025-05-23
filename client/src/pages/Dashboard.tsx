import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Tool {
  id: string;
  name: string;
  relevance: number;
}

interface LearningPath {
  id: string;
  steps: string[];
  tools: string[];
}

interface ServerInsight {
  serverId: string;
  status: string;
  lastHeartbeat: number;
}

export default function Dashboard() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [insights, setInsights] = useState<ServerInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [toolsRes, pathsRes] = await Promise.all([
          fetch('/api/tools'),
          fetch('/api/learning-paths')
        ]);

        const toolsData = await toolsRes.json();
        const pathsData = await pathsRes.json();

        setTools(toolsData.tools);
        setLearningPaths(pathsData.paths);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up WebSocket connection for real-time insights
    const ws = new WebSocket(`ws://${window.location.host}/ws/${localStorage.getItem('userId')}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setInsights(data);
    };

    return () => {
      ws.close();
    };
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold mb-8">AI Career Assistant</h1>
      
      {/* Tools Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Recommended Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Card key={tool.id}>
              <CardHeader>
                <CardTitle>{tool.name}</CardTitle>
                <CardDescription>Relevance Score</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={tool.relevance * 100} className="mb-4" />
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Learning Paths Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Learning Paths</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {learningPaths.map((path) => (
            <Card key={path.id}>
              <CardHeader>
                <CardTitle>Learning Path {path.id}</CardTitle>
                <CardDescription>{path.steps.length} steps</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2">
                  {path.steps.map((step, index) => (
                    <li key={index} className="text-sm">{step}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* System Status Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight) => (
            <Card key={insight.serverId}>
              <CardHeader>
                <CardTitle>{insight.serverId}</CardTitle>
                <CardDescription>
                  Last updated: {new Date(insight.lastHeartbeat).toLocaleTimeString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`inline-block px-2 py-1 rounded-full text-sm ${
                  insight.status === 'running' ? 'bg-green-100 text-green-800' :
                  insight.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {insight.status}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
