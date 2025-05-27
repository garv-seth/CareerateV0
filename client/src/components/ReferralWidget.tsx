import React, { useState, useEffect } from 'react';
import { Users, Gift, Link, Share2, TrendingUp, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ReferralInvite {
  id: string;
  inviteeEmail: string;
  referralCode: string;
  status: 'pending' | 'registered' | 'activated' | 'expired';
  sentAt: string;
}

interface ReferralStats {
  userId: string;
  totalInvitesSent: number;
  pendingInvites: number;
  successfulReferrals: number;
  conversionRate: number;
  totalRewards: number; // Points or other rewards
  recentInvites: ReferralInvite[];
  referralCode: string;
  referralLink: string;
}

export default function ReferralWidget() {
  const { user, isAuthenticated } = useAuth();
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchReferralStats();
    }
  }, [isAuthenticated, user]);

  const fetchReferralStats = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/referral/stats/${user.id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      // Add referralLink to the mock data if it's not there
      if (data && data.referralCode && !data.referralLink) {
        data.referralLink = `https://gocareerate.com/join?ref=${data.referralCode}`;
      }
      setReferralStats(data);
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !referralStats?.referralCode || !user) return;
    
    try {
      await fetch('/api/referral/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          referrerUserId: user.id,
          inviteeEmail: inviteEmail,
          referralCode: referralStats.referralCode,
          channel: 'dashboard_invite'
        })
      });
      setInviteEmail('');
      fetchReferralStats(); // Refresh stats
      alert('Invite sent successfully!');
    } catch (error) {
      console.error('Error sending invite:', error);
      alert('Failed to send invite.');
    }
  };

  const copyToClipboard = () => {
    if (!referralStats?.referralLink) return;
    navigator.clipboard.writeText(referralStats.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activated': return 'text-green-600 bg-green-100';
      case 'registered': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 font-sfpro">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded"></div>)}
          </div>
          <div className="h-24 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!referralStats) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 font-sfpro">
        <div className="text-center text-gray-500">
          <Gift className="w-8 h-8 mx-auto mb-2" />
          <p>Unable to load referral program details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 font-sfpro">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <Gift className="w-6 h-6 mr-2 text-purple-600" />
          Refer & Earn Rewards
        </h3>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-blue-700">{referralStats.successfulReferrals}</p>
          <p className="text-xs text-blue-600">Successful Referrals</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-green-700">{referralStats.conversionRate.toFixed(0)}%</p>
          <p className="text-xs text-green-600">Conversion Rate</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <Gift className="w-6 h-6 text-purple-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-purple-700">{referralStats.totalRewards}</p>
          <p className="text-xs text-purple-600">Total Rewards Earned</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <Link className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-yellow-700">{referralStats.totalInvitesSent}</p>
          <p className="text-xs text-yellow-600">Invites Sent</p>
        </div>
      </div>

      {/* Invite Section */}
      <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3 text-lg">Invite Friends & Colleagues</h4>
        <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3 mb-4">
          <input 
            type="email" 
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Enter friend's email address"
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow"
            required
          />
          <button 
            type="submit"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-sm hover:shadow-md flex items-center justify-center"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Send Invite
          </button>
        </form>
        
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
          <span className="text-sm text-gray-700 truncate">
            {referralStats.referralLink}
          </span>
          <button 
            onClick={copyToClipboard}
            className="ml-3 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors flex items-center"
          >
            {copied ? <Check className="w-3 h-3 text-green-500 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Recent Invites */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Users className="w-5 h-5 mr-2 text-gray-600" />
          Recent Invites
        </h4>
        {referralStats.recentInvites.length > 0 ? (
          <div className="space-y-2">
            {referralStats.recentInvites.slice(0,3).map(invite => (
              <div key={invite.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">{invite.inviteeEmail}</p>
                  <p className="text-xs text-gray-500">Sent: {new Date(invite.sentAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(invite.status)}`}>
                  {invite.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No recent invites sent yet.</p>
        )}
        {referralStats.recentInvites.length > 3 && (
           <div className="text-center mt-4">
            <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
              View All Invites
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500">Refer new users and earn up to 1000 points for each successful referral!</p>
      </div>
    </div>
  );
} 