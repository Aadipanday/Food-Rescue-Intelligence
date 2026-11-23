import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
        <p className="text-slate-600 font-medium">Verifying credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.role || 'user').toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

    // Allow admins access to all routes
    if (userRole === 'admin') {
      return children;
    }

    // Strict role restriction only for admin portal
    if (normalizedAllowed.includes('admin') && normalizedAllowed.length === 1) {
      if (userRole !== 'admin') {
        return <Navigate to="/" replace />;
      }
    }

    // For general application dashboards, allow all authenticated users (including multi-role testing)
    const hasRole =
      normalizedAllowed.includes(userRole) ||
      userRole === 'user' ||
      normalizedAllowed.includes('donor') ||
      normalizedAllowed.includes('ngo');

    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
