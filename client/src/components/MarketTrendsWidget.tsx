import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Users, Briefcase } from 'lucide-react';

interface MarketTrend {
  skill: string;
  demand: 'rising' | 'stable' | 'falling';
  changePercentage: number;
  jobCount: number;
  salaryRange: { min: number; max: number };
  growth: string;
  description: string;
}

interface MarketData {
  aiRoles: MarketTrend[];
  emergingSkills: MarketTrend[];
  displacementRisk: {
    roles: string[];
    riskLevel: 'low' | 'medium' | 'high';
    timeframe: string;
  };
  lastUpdated: string;
}

export default function MarketTrendsWidget() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'trending' | 'emerging' | 'risk'>('trending');

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      const response = await fetch('/api/market-trends');
      const data = await response.json();
      setMarketData(data);
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDemandIcon = (demand: string) => {
    switch (demand) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'falling': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <div className="w-4 h-4 bg-yellow-500 rounded-full" />;
    }
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'rising': return 'text-green-600 bg-green-50';
      case 'falling': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatSalary = (min: number, max: number) => {
    return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 font-sfpro">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!marketData) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 font-sfpro">
        <div className="text-center text-gray-500">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>Unable to load market trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 font-sfpro">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">AI Job Market Trends</h3>
        <div className="text-sm text-gray-500">
          Updated {new Date(marketData.lastUpdated).toLocaleDateString()}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setSelectedTab('trending')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            selectedTab === 'trending'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Trending Roles
        </button>
        <button
          onClick={() => setSelectedTab('emerging')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            selectedTab === 'emerging'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Briefcase className="w-4 h-4 inline mr-2" />
          Emerging Skills
        </button>
        <button
          onClick={() => setSelectedTab('risk')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            selectedTab === 'risk'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          Risk Assessment
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {selectedTab === 'trending' && (
          <div>
            {marketData.aiRoles.map((role, index) => (
              <div
                key={role.skill}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  {getDemandIcon(role.demand)}
                  <div>
                    <h4 className="font-semibold text-gray-900">{role.skill}</h4>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDemandColor(role.demand)}`}>
                    {role.growth}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <Users className="w-3 h-3 inline mr-1" />
                    {role.jobCount.toLocaleString()} jobs
                  </div>
                  <div className="text-sm text-gray-600">
                    <DollarSign className="w-3 h-3 inline mr-1" />
                    {formatSalary(role.salaryRange.min, role.salaryRange.max)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'emerging' && (
          <div>
            {marketData.emergingSkills.map((skill, index) => (
              <div
                key={skill.skill}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{skill.skill}</h4>
                    <p className="text-sm text-gray-600">{skill.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-600 font-semibold text-lg">
                    +{skill.changePercentage}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatSalary(skill.salaryRange.min, skill.salaryRange.max)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'risk' && (
          <div>
            <div className={`p-4 rounded-lg border-2 ${getRiskColor(marketData.displacementRisk.riskLevel)} mb-4`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Displacement Risk Level</h4>
                <span className="text-sm font-medium uppercase">
                  {marketData.displacementRisk.riskLevel}
                </span>
              </div>
              <p className="text-sm opacity-75">
                Timeframe: {marketData.displacementRisk.timeframe}
              </p>
            </div>

            <div className="space-y-3">
              <h5 className="font-semibold text-gray-900">At-Risk Roles:</h5>
              {marketData.displacementRisk.roles.map((role, index) => (
                <div key={role} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-sm text-red-700">{role}</span>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h5 className="font-semibold text-blue-900 mb-2">Recommended Actions:</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Upskill in AI/ML technologies</li>
                <li>• Learn prompt engineering</li>
                <li>• Focus on human-AI collaboration</li>
                <li>• Develop AI tool proficiency</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-shadow">
          Get Personalized Risk Assessment
        </button>
      </div>
    </div>
  );
} 