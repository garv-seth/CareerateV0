import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';

const CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { instance } = useMsal();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const response = await instance.handleRedirectPromise();
        if (response) {
          instance.setActiveAccount(response.account);
        }
      } catch (e) {
        console.error('MSAL redirect error', e);
      } finally {
        navigate('/dashboard', { replace: true });
      }
    };

    handleRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <p>Signing you in...</p>
    </div>
  );
};

export default CallbackPage; 