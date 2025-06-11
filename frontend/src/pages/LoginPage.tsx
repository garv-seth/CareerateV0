import React from 'react';
import { useMsal } from '@azure/msal-react';
import { Navigate } from 'react-router-dom';
import { loginRequest } from '../config/authConfig';

const LoginPage = () => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = accounts.length > 0;

  const handleLogin = () => {
    instance.loginRedirect(loginRequest).catch(e => {
      console.error(e);
    });
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <div className="p-8 rounded-lg shadow-lg text-center bg-white/10 backdrop-blur-md border border-white/20">
        <h1 className="text-2xl font-bold mb-4">Welcome to Careerate</h1>
        <p className="mb-4">Please login to continue.</p>
        <button 
          onClick={handleLogin}
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 hover:bg-white/20 hover:scale-105"
        >
          Login with Microsoft
        </button>
      </div>
    </div>
  );
};

export default LoginPage; 