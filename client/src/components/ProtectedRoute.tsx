import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'patient' | 'doctor' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();


  // Check if user has unauthorized access
  const hasUnauthorizedAccess = requiredRole && user && user.role !== requiredRole;

  // Show toast for unauthorized access
  useEffect(() => {
    if (hasUnauthorizedAccess) {
      toast.error(`Access denied. This page is only available for ${requiredRole}s.`);
    }
  }, [hasUnauthorizedAccess, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (hasUnauthorizedAccess) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath = user.role === 'doctor' ? '/app/doctor-dashboard' : 
                        user.role === 'admin' ? '/app/admin-dashboard' : 
                        '/app/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
