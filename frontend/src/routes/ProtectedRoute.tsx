import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '../store/useAuthStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const getDefaultRouteForRole = (role?: string): string => {
  if (!role) return '/dashboard';
  const lower = role.toLowerCase();
  if (lower.includes('lab') || lower.includes('technician')) {
    return '/lab';
  }
  if (lower.includes('pathologist')) {
    return '/lab';
  }
  if (lower.includes('doctor')) {
    return '/appointments';
  }
  if (lower.includes('receptionist')) {
    return '/appointments';
  }
  return '/dashboard';
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && user?.role) {
    const isOwnerOrAdmin =
      user.role === 'Clinic Owner' || user.role === 'Super Admin';

    if (!isOwnerOrAdmin && !allowedRoles.includes(user.role)) {
      // Redirect to their role's home view
      return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
    }
  }

  return <Outlet />;
};

