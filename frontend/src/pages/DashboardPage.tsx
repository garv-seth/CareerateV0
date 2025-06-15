import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">Welcome</h3>
            <p className="text-gray-300">This is your dashboard. The beautiful Three.js landing page is now active.</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Stunning 3D star field</li>
              <li>• Animated nebula</li>
              <li>• Parallax mountains</li>
              <li>• Smooth camera movement</li>
            </ul>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">Status</h3>
            <p className="text-green-400 font-semibold">✓ Application Running</p>
            <p className="text-gray-300 text-sm mt-2">Single port, clean design</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;