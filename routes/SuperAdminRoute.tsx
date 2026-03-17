import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SuperAdminRoute: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/buyer/login" replace />;
  }

  if (currentUser.role !== 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default SuperAdminRoute;
