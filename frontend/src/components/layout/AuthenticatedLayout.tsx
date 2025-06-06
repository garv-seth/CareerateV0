import React from 'react';
import MainLayout from './MainLayout';
import AuthenticatedRoute from '../router/AuthenticatedRoute';

const AuthenticatedLayout: React.FC = () => {
  return (
    <AuthenticatedRoute>
      <MainLayout />
    </AuthenticatedRoute>
  );
};

export default AuthenticatedLayout; 