import React, { useState, useEffect } from 'react';
import { Trophy, Zap, Award, Activity, BarChart, Users, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'referral' | 'learning' | 'tool' | 'streak';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
}

interface UserAchievement {
  badgeId: string;
  earnedAt: string;
  progress: number;
  completed: boolean;
}

interface UserStats {
  userId: string;
  totalBadges: number;
  totalPoints: number;
  rank: number;
  streak: {
    current: number;
    longest: number;
    lastActive: string;
  };
  categories: {
    milestone: number;
    referral: number;
    learning: number;
    tool: number;
    streak: number;
  };
  achievements: UserAchievement[];
}

const allBadgesData: Badge[] = [
  { id: 'welcome', name: 'Welcome', description: 'Profile setup', icon: '👋', category: 'milestone', rarity: 'common', points: 10 },
  { id: 'resume_uploaded', name: 'Resume Analyzer', description: 'Analyzed resume', icon: '📄', category: 'milestone', rarity: 'common', points: 20 },
  { id: 'first_course', name: 'Learner', description: 'First course', icon: '🎓', category: 'learning', rarity: 'common', points: 25 },
  { id: 'learning_streak_7', name: 'Week Warrior', description: '7-day streak', icon: '🔥', category: 'streak', rarity: 'rare', points: 50 },
  { id: 'first_ai_tool', name: 'AI Explorer', description: 'Used first AI tool', icon: '🤖', category: 'tool', rarity: 'common', points: 30 },
  { id: 'learning_streak_30', name: 'Month Master', description: '30-day streak', icon: '🏆', category: 'streak', rarity: 'epic', points: 200 },
];

export default function AchievementsWidget() {
  const { user, isAuthenticated } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'badges' | 'leaderboard'>('overview');

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserAchievements();
    }
  }, [isAuthenticated, user]);

  const fetchUserAchievements = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/achievements/user/${user.id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setUserStats(data);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeById = (badgeId: string) => {
    return allBadgesData.find(b => b.id === badgeId);
  };
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-200 text-gray-700';
      case 'rare': return 'bg-blue-200 text-blue-700';
      case 'epic': return 'bg-purple-200 text-purple-700';
      case 'legendary': return 'bg-yellow-300 text-yellow-800';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 font-sfpro">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded"></div>)}
          </div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 font-sfpro">
        <div className="text-center text-gray-500">
          <Trophy className="w-8 h-8 mx-auto mb-2" />
          <p>Unable to load achievements</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 font-sfpro">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Achievements & Stats</h3>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setSelectedTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            selectedTab === 'overview'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          Overview
        </button>
        <button
          onClick={() => setSelectedTab('badges')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            selectedTab === 'badges'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Award className="w-4 h-4 inline mr-2" />
          Badges ({userStats.totalBadges})
        </button>
        <button
          onClick={() => setSelectedTab('leaderboard')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            selectedTab === 'leaderboard'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart className="w-4 h-4 inline mr-2" />
          Leaderboard
        </button>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm">
            <div className="flex items-center text-blue-700 mb-1">
              <Trophy className="w-5 h-5 mr-2" />
              <h4 className="font-semibold">Total Points</h4>
            </div>
            <p className="text-3xl font-bold text-blue-600">{userStats.totalPoints.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg shadow-sm">
            <div className="flex items-center text-purple-700 mb-1">
              <Award className="w-5 h-5 mr-2" />
              <h4 className="font-semibold">Badges Earned</h4>
            </div>
            <p className="text-3xl font-bold text-purple-600">{userStats.totalBadges}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg shadow-sm">
            <div className="flex items-center text-green-700 mb-1">
              <Zap className="w-5 h-5 mr-2" />
              <h4 className="font-semibold">Current Streak</h4>
            </div>
            <p className="text-3xl font-bold text-green-600">{userStats.streak.current} days</p>
            <p className="text-xs text-green-600">Longest: {userStats.streak.longest} days</p>
          </div>
          <div className="md:col-span-3 bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg shadow-sm">
            <div className="flex items-center text-yellow-700 mb-1">
              <Users className="w-5 h-5 mr-2" />
              <h4 className="font-semibold">Leaderboard Rank</h4>
            </div>
            <p className="text-3xl font-bold text-yellow-600">#{userStats.rank}</p>
          </div>
        </div>
      )}

      {/* Badges Tab */}
      {selectedTab === 'badges' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {userStats.achievements.map(ach => {
            const badge = getBadgeById(ach.badgeId);
            if (!badge) return null;
            return (
              <div key={badge.id} className={`p-4 rounded-lg border text-center transition-all ${ach.completed ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                <div className={`text-3xl mx-auto mb-2 p-2 rounded-full inline-block ${ach.completed ? 'bg-green-100' : 'bg-gray-100'}`}>{badge.icon}</div>
                <h5 className={`font-semibold mb-1 ${ach.completed ? 'text-green-800' : 'text-gray-700'}`}>{badge.name}</h5>
                <p className={`text-xs mb-2 ${ach.completed ? 'text-green-700' : 'text-gray-600'}`}>{badge.description}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRarityColor(badge.rarity)}`}>{badge.rarity}</span>
                {ach.completed ? (
                  <p className="text-xs text-green-600 mt-2">Earned: {new Date(ach.earnedAt).toLocaleDateString()}</p>
                ) : (
                  <div className="mt-2 h-2 bg-gray-200 rounded-full w-full overflow-hidden">
                    <div className="h-full bg-yellow-400" style={{ width: `${ach.progress}%`}}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard Tab (Placeholder) */}
      {selectedTab === 'leaderboard' && (
        <div className="text-center py-10">
          <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-lg font-semibold text-gray-700 mb-1">Leaderboard Coming Soon!</h4>
          <p className="text-sm text-gray-500">Compete with others and climb the ranks.</p>
        </div>
      )}

      {/* Share Button */}
      <div className="mt-8 pt-4 border-t border-gray-100 text-center">
        <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-6 rounded-lg font-semibold hover:shadow-lg transition-shadow text-sm">
          <Crown className="w-4 h-4 inline mr-2"/>
          Share My Achievements
        </button>
      </div>
    </div>
  );
} 