import React from 'react';
import { Outlet } from 'react-router-dom';
import FloatingNavbar from '@/components/common/FloatingNavbar';
import FloatingFooter from '@/components/common/FloatingFooter';

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <FloatingNavbar />
      <main className="flex-grow w-full">
        {/* Content of the specific page will be rendered here */}
        <Outlet /> 
      </main>
      <FloatingFooter />
    </div>
  );
};

export default MainLayout; 