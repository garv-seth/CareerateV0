import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import usePageTitle from '@/hooks/usePageTitle';

const NotFoundPage: React.FC = () => {
  usePageTitle('Page Not Found - Careerate');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="text-center space-y-8">
        <SearchX className="mx-auto h-24 w-24 text-primary opacity-80" />
        <div className="space-y-3">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            404
          </h1>
          <p className="text-2xl font-semibold text-foreground">
            Oops! Page Not Found.
          </p>
          <p className="text-muted-foreground max-w-md mx-auto">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-3 text-lg font-medium transition-all duration-300 transform hover:scale-105">
          <Link to="/">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Go to Homepage
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage; 