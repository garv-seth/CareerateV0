import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
// import { useAuth } from '../hooks/useAuth'; // This will be created later

const CallbackPage = () => {
  const navigate = useNavigate();
  const { inProgress } = useMsal();
  // const { handleRedirectCallback } = useAuth(); // This will be used later

  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      navigate('/dashboard');
    }
  }, [inProgress, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <div className="p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        <p>Please wait while we authenticate your session.</p>
      </div>
    </div>
  );
};

export default CallbackPage; 