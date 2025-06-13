import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import '../styles/ProtectedRoute.css';

const ProtectedRoute = ({ children, adminOnly = false, userOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If this is an admin-only route, check admin role
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }

  // If this is a user-only route, prevent admin access
  if (userOnly && isAdmin) {
    return <Navigate to="/admin" />;
  }

  // If all checks pass, render the children
  return children;
};

export default ProtectedRoute;