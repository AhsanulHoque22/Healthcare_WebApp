import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  switch (user.role) {
    case 'patient':
      return <Navigate to="/app/dashboard" replace />;
    case 'doctor':
      return <Navigate to="/app/doctor-dashboard" replace />;
    case 'admin':
      return <Navigate to="/app/admin-dashboard" replace />;
    default:
      return <Navigate to="/app/dashboard" replace />;
  }
};

export default RoleBasedRedirect;
