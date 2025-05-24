import React, { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import MarketTrendsWidget from '../components/MarketTrendsWidget';
import LearningPathWidget from '../components/LearningPathWidget';
import AchievementsWidget from '../components/AchievementsWidget';
import ReferralWidget from '../components/ReferralWidget';
import ShareableCardWidget from '../components/ShareableCardWidget';
import ToolsDirectoryWidget from '../components/ToolsDirectoryWidget';
import ResumeAnalyzerWidget from '../components/ResumeAnalyzerWidget';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
      }
    };

    fetchData();

    // Set up WebSocket connection for real-time insights
    const ws = new WebSocket(`ws://${window.location.host}/ws/${localStorage.getItem('userId')}`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Assuming data is an array of ServerInsight or a single object to be wrapped in an array
        setInsights(Array.isArray(data) ? data : [data]); 
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
        // Optionally, show a toast message for WebSocket errors
        // toast({
        //   title: "WebSocket Error",
        //   description: "Could not parse real-time update.",
        //   variant: "destructive"
        // });
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
      // toast({
      //   title: "WebSocket Connection Error",
      //   description: "Could not connect to real-time updates.",
      //   variant: "destructive"
      // });
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-800 p-4 md:p-8 font-sfpro text-slate-100">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Careerate Dashboard
        </h1>
        <p className="text-slate-400 mt-2">Your AI-powered career co-pilot.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Wider Column for main content or larger widgets */}
        <div className="lg:col-span-2 space-y-6">
          <LearningPathWidget />
          <MarketTrendsWidget />
          <ResumeAnalyzerWidget /> 
        </div>

        {/* Column 2: Sidebar for smaller/supplementary widgets */}
        <div className="space-y-6">
          <AchievementsWidget />
          <ReferralWidget />
          <ToolsDirectoryWidget />
          <ShareableCardWidget />
        </div>
      </div>

      {/* System Status Section (Kept from original, ensure styling matches new theme) */}
      {insights.length > 0 && (
        <section className="mt-10 pt-6 border-t border-slate-700">
          <h2 className="text-2xl font-semibold mb-4 text-slate-200">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight) => (
              <Card key={insight.serverId} className="bg-slate-800 border-slate-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-100">{insight.serverId}</CardTitle>
                  <CardDescription className="text-slate-400">
                    Last updated: {new Date(insight.lastHeartbeat).toLocaleTimeString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    insight.status === 'running' ? 'bg-green-500/20 text-green-300' :
                    insight.status === 'error' ? 'bg-red-500/20 text-red-300' :
                    'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {insight.status}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
