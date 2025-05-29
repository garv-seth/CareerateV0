import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-foreground">Oops! Page Not Found.</h2>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link 
        to="/"
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-lg text-lg shadow-lg transition duration-300 ease-in-out"
      >
        Go to Homepage
      </Link>
    </div>
  );
};

export default NotFoundPage; 