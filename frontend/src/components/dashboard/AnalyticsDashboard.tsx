import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  TrendingUp, Users, Clock, Target, Zap, Brain,
  CheckCircle, AlertTriangle, Award, Calendar
} from 'lucide-react';

interface TeamMetrics {
  productivity: number;
  questionsAnswered: number;
  timesSaved: string;
  successRate: number;
  activeUsers: number;
  topTools: string[];
  weeklyTrend: Array<{ day: string; questions: number; timesSaved: number }>;
  errorTrends: Array<{ category: string; count: number; trend: 'up' | 'down' | 'stable' }>;
  skillGaps: string[];
  achievements: Array<{ user: string; achievement: string; date: string }>;
}

interface Props {
  teamId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AnalyticsDashboard: React.FC<Props> = ({ teamId }) => {
  const [metrics, setMetrics] = useState<TeamMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [teamId, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, fetch from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMetrics({
        productivity: 87,
        questionsAnswered: 342,
        timesSaved: '47 hours',
        successRate: 94,
        activeUsers: 12,
        topTools: ['Terraform', 'Kubernetes', 'AWS', 'Docker', 'Monitoring'],
        weeklyTrend: [
          { day: 'Mon', questions: 45, timesSaved: 6 },
          { day: 'Tue', questions: 38, timesSaved: 5 },
          { day: 'Wed', questions: 52, timesSaved: 8 },
          { day: 'Thu', questions: 41, timesSaved: 6 },
          { day: 'Fri', questions: 35, timesSaved: 4 },
          { day: 'Sat', questions: 12, timesSaved: 2 },
          { day: 'Sun', questions: 8, timesSaved: 1 }
        ],
        errorTrends: [
          { category: 'Terraform', count: 23, trend: 'down' },
          { category: 'Kubernetes', count: 18, trend: 'stable' },
          { category: 'AWS', count: 15, trend: 'up' },
          { category: 'Docker', count: 12, trend: 'down' },
          { category: 'Monitoring', count: 8, trend: 'stable' }
        ],
        skillGaps: ['Kubernetes Networking', 'Terraform Modules', 'AWS Security'],
        achievements: [
          { user: 'John Doe', achievement: 'Problem Solver', date: '2024-01-15' },
          { user: 'Jane Smith', achievement: 'Fast Learner', date: '2024-01-14' },
          { user: 'Mike Wilson', achievement: 'Team Helper', date: '2024-01-13' }
        ]
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Unavailable</h3>
        <p className="text-gray-600">Unable to load team analytics. Please try again later.</p>
      </div>
    );
  }

  const MetricCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string | number;
    change?: string;
    color: string;
  }> = ({ icon, title, value, change, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${color} flex items-center mt-1`}>
              <TrendingUp className="h-4 w-4 mr-1" />
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Analytics</h1>
          <p className="text-gray-600">Insights into your team's DevOps productivity</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter')}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
          </select>
          
          <button
            onClick={fetchAnalytics}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={<TrendingUp className="h-6 w-6" />}
          title="Productivity Score"
          value={`${metrics.productivity}%`}
          change="+12% from last week"
          color="text-green-600"
        />
        <MetricCard
          icon={<Brain className="h-6 w-6" />}
          title="Questions Answered"
          value={metrics.questionsAnswered}
          change="+34 this week"
          color="text-blue-600"
        />
        <MetricCard
          icon={<Clock className="h-6 w-6" />}
          title="Time Saved"
          value={metrics.timesSaved}
          change="+8 hours this week"
          color="text-purple-600"
        />
        <MetricCard
          icon={<Target className="h-6 w-6" />}
          title="Success Rate"
          value={`${metrics.successRate}%`}
          change="+2% improvement"
          color="text-green-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="questions"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="timesSaved"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Tool Usage */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Used Tools</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metrics.topTools.map((tool, index) => ({
                  name: tool,
                  value: Math.floor(Math.random() * 50) + 10
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {metrics.topTools.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Error Trends and Skill Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Categories</h3>
          <div className="space-y-4">
            {metrics.errorTrends.map((error, index) => (
              <div key={error.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    error.trend === 'up' ? 'bg-red-500' :
                    error.trend === 'down' ? 'bg-green-500' :
                    'bg-yellow-500'
                  }`}></div>
                  <span className="font-medium text-gray-900">{error.category}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">{error.count} errors</span>
                  <div className={`p-1 rounded ${
                    error.trend === 'up' ? 'text-red-600 bg-red-100' :
                    error.trend === 'down' ? 'text-green-600 bg-green-100' :
                    'text-yellow-600 bg-yellow-100'
                  }`}>
                    {error.trend === 'up' ? '↗' : error.trend === 'down' ? '↙' : '→'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Skill Gaps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Identified Skill Gaps</h3>
          <div className="space-y-3">
            {metrics.skillGaps.map((skill, index) => (
              <div key={skill} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium text-gray-900">{skill}</span>
                <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors">
                  Learn
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Recommendation</h4>
            <p className="text-blue-800 text-sm">
              Consider scheduling training sessions on Kubernetes networking and Terraform best practices.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Recent Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Achievements</h3>
          <Award className="h-6 w-6 text-yellow-500" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.achievements.map((achievement, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {achievement.user.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="font-medium text-gray-900">{achievement.user}</p>
                <p className="text-sm text-gray-600">{achievement.achievement}</p>
                <p className="text-xs text-gray-500">{achievement.date}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Team Activity Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Activity Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{metrics.activeUsers}</p>
            <p className="text-sm text-blue-800">Active Users</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{metrics.questionsAnswered}</p>
            <p className="text-sm text-green-800">Questions Resolved</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Zap className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{metrics.timesSaved}</p>
            <p className="text-sm text-purple-800">Time Saved</p>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <Calendar className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">7</p>
            <p className="text-sm text-yellow-800">Days Active</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard; 