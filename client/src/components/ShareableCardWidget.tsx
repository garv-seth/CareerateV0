import React, { useState, useEffect } from 'react';
import { Share2, Download, Eye, ThumbsUp, BarChart2, CreditCard, Image } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ShareableCard {
  id: string;
  userId: string;
  type: 'ai-risk' | 'milestone' | 'achievement' | 'progress' | 'certification';
  title: string;
  subtitle: string;
  imageUrl: string;
  shareUrl: string;
  createdAt: string;
  views?: number;
  likes?: number;
}

export default function ShareableCardWidget() {
  const { user, isAuthenticated } = useAuth();
  const [userCards, setUserCards] = useState<ShareableCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardType, setSelectedCardType] = useState<string>('achievement');
  const [customMessage, setCustomMessage] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserCards();
    }
  }, [isAuthenticated, user]);

  const fetchUserCards = async (type?: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/share-card/user/${user.id}?limit=5&type=${type || selectedCardType}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setUserCards(data.cards || []);
    } catch (error) {
      console.error('Error fetching user cards:', error);
      setUserCards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCard = async () => {
    if (!user) return;
    
    setGenerating(true);
    // Use real user data for generation
    let cardData = {};
    switch(selectedCardType) {
        case 'ai-risk':
            cardData = { 
              riskLevel: user.aiRisk.level, 
              riskScore: user.aiRisk.score 
            };
            break;
        case 'milestone':
            cardData = { 
              milestoneName: 'Completed Advanced Python', 
              completedAt: new Date().toISOString() 
            };
            break;
        case 'achievement':
            cardData = { 
              badgeName: 'Python Pro', 
              badgeDescription: 'Mastered Python fundamentals' 
            };
            break;
        default:
            cardData = { genericData: 'Some cool data' }; 
    }

    try {
      const response = await fetch('/api/share-card/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          type: selectedCardType,
          data: cardData,
          customMessage
        })
      });
      const newCard = await response.json();
      setUserCards(prev => [newCard, ...prev.slice(0,4)]);
      setCustomMessage('');
      alert('Shareable card generated!');
    } catch (error) {
      console.error('Error generating card:', error);
      alert('Failed to generate card.');
    } finally {
      setGenerating(false);
    }
  };

  const cardTypes = [
    { value: 'achievement', label: 'Achievement', icon: <ThumbsUp className="w-4 h-4 mr-2" /> },
    { value: 'milestone', label: 'Milestone', icon: <BarChart2 className="w-4 h-4 mr-2" /> },
    { value: 'ai-risk', label: 'AI Risk Report', icon: <Image className="w-4 h-4 mr-2" /> },
    { value: 'progress', label: 'Learning Progress', icon: <CreditCard className="w-4 h-4 mr-2" /> },
  ];

  if (loading && userCards.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 font-sfpro">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-10 bg-gray-100 rounded mb-4"></div>
          <div className="h-40 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 font-sfpro">
      <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
        <Share2 className="w-6 h-6 mr-2 text-indigo-600" />
        Create & Share Cards
      </h3>
      <p className="text-sm text-gray-600 mb-6">Showcase your progress, achievements, and AI insights.</p>

      {/* Card Generation Form */}
      <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="cardType" className="block text-sm font-medium text-gray-700 mb-1">Card Type</label>
            <select 
              id="cardType"
              value={selectedCardType}
              onChange={(e) => {
                setSelectedCardType(e.target.value);
                fetchUserCards(e.target.value); // Refresh list for the new type
              }}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            >
              {cardTypes.map(ct => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="customMessage" className="block text-sm font-medium text-gray-700 mb-1">Custom Message (Optional)</label>
            <input 
              type="text"
              id="customMessage"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="e.g., Excited to share my latest achievement!"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            />
          </div>
        </div>
        <button 
          onClick={handleGenerateCard}
          disabled={generating}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md flex items-center justify-center disabled:opacity-50"
        >
          {generating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <Image className="w-4 h-4 mr-2" />
              Generate Card
            </>
          )}
        </button>
      </div>

      {/* User's Generated Cards */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-gray-600" />
          Your Recent Cards
        </h4>
        {loading && <p className="text-sm text-gray-500">Loading cards...</p>}
        {!loading && userCards.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No cards generated for this type yet. Create one above!</p>
        )}
        {!loading && userCards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCards.map(card => (
              <div key={card.id} className="border border-gray-200 rounded-lg shadow-sm overflow-hidden bg-white hover:shadow-lg transition-shadow">
                <img src={card.imageUrl || `https://via.placeholder.com/400x210/indigo/white?text=${encodeURIComponent(card.title)}`} alt={card.title} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h5 className="font-semibold text-gray-800 truncate mb-1" title={card.title}>{card.title}</h5>
                  <p className="text-xs text-gray-500 mb-3">Generated: {new Date(card.createdAt).toLocaleDateString()}</p>
                  <div className="flex items-center justify-between">
                    <a href={card.shareUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full hover:bg-indigo-200 transition-colors flex items-center">
                      <Eye className="w-3 h-3 mr-1" /> View
                    </a>
                    <button className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full hover:bg-green-200 transition-colors flex items-center">
                      <Share2 className="w-3 h-3 mr-1" /> Share
                    </button>
                    <button className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full hover:bg-gray-200 transition-colors flex items-center">
                      <Download className="w-3 h-3 mr-1" /> Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 