import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <div className="p-8 rounded-lg shadow-lg text-center bg-white/10 backdrop-blur-md border border-white/20">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl mb-6">Page Not Found</p>
        <Link 
          to="/"
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 hover:bg-white/20 hover:scale-105"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage; 