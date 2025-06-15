// src/components/PrivateRoute.js
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // If the user isn't logged in, send them to the `/login` page.
    // We also tell the login page where they *were trying* to go (`from: location`)
    // so they can be sent back there after logging in,
    // and we prevent them from pressing 'back' to get to this protected page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}