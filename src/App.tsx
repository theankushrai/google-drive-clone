import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import UploadPage from "./pages/UploadPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Debug component to log route changes
function DebugRouter() {
  const location = useLocation();
  
  useEffect(() => {
    console.log('Route changed to:', location.pathname);
  }, [location]);
  
  return null;
}

// Private route component to protect routes that require authentication
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  
  console.log('PrivateRoute - currentUser:', currentUser?.uid, 'loading:', loading, 'path:', location.pathname);
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  // If user is not authenticated, redirect to login with the current location as the return path
  if (!currentUser) {
    console.log('Redirecting to login from:', location.pathname);
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  // If we get here, user is authenticated
  return <>{children}</>;
}

// Public route component to redirect authenticated users away from auth pages
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  
  // Only use the from path if it exists and is not the root path
  const from = (location.state as any)?.from?.pathname;
  const redirectTo = from && from !== '/' ? from : '/upload';
  
  console.log('PublicRoute - currentUser:', currentUser?.uid, 'loading:', loading, 'redirectTo:', redirectTo);
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  // Only redirect if we have a current user and we're not already on the target page
  if (currentUser && location.pathname !== redirectTo) {
    console.log('Redirecting authenticated user to:', redirectTo);
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }
  
  // If we're already on the target page or user is not authenticated, render children
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <DebugRouter />
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <PrivateRoute>
              <UploadPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  console.log('App component rendering');
  
  return (
    <div className="app">
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
