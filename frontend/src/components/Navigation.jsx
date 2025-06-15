// src/components/Navigation.jsx
import React, { useEffect } from 'react';
import { Navbar, Nav, Container, Button, Form } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'react-bootstrap-icons';

// Debug helper
const log = (...args) => {
  console.log('[Navigation]', ...args);
};

log('Navigation module loaded');

export default function Navigation() {
  log('Navigation component rendering');
  
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Log auth and path info on mount and updates
  useEffect(() => {
    log('Component mounted/updated', { pathname, currentUser: !!currentUser });
  }, [pathname, currentUser]);

  // Normalize the path and check if it's an auth page
  const normalizedPath = pathname.toLowerCase().replace(/\/+$/, '');
  const isAuthPage = ['/login', '/signup', ''].includes(normalizedPath);
  
  log('Navigation state', {
    pathname,
    normalizedPath,
    isAuthPage,
    hasUser: !!currentUser,
    user: currentUser
  });

  const handleLogout = async () => {
    log('Logout initiated');
    try {
      await logout();
      log('Logout successful');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // For auth pages, only show brand and theme toggle
  if (isAuthPage) {
    log('Rendering auth page navigation');
    return (
      <Navbar bg={isDarkMode ? 'dark' : 'light'} variant={isDarkMode ? 'dark' : 'light'} expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold">
            DriveClone
          </Navbar.Brand>
          <div className="d-flex align-items-center">
            <Form.Check
              type="switch"
              id="theme-switch"
              label={isDarkMode ? <Sun className="text-warning" /> : <Moon />}
              checked={isDarkMode}
              onChange={toggleTheme}
              className="me-2"
            />
          </div>
        </Container>
      </Navbar>
    );
  }

  // For other pages, show full navigation
  log('Rendering full navigation with user:', !!currentUser);
  return (
    <Navbar 
      bg={isDarkMode ? 'dark' : 'light'} 
      variant={isDarkMode ? 'dark' : 'light'} 
      className="shadow-sm"
      collapseOnSelect={false}
      expand={false} // Disable auto-collapse
    >
      <Container fluid className="px-3">
        <div className="d-flex w-100 align-items-center">
          {/* Brand on the left */}
          <Navbar.Brand as={Link} to="/" className="fw-bold me-4 flex-shrink-0">
            DriveClone
          </Navbar.Brand>
          
          {/* Spacer to push everything to the right */}
          <div className="flex-grow-1" />
          
          {/* Theme toggle and logout button - always visible */}
          <div className="d-flex align-items-center">
            {/* Theme Toggle */}
            <div className="d-flex align-items-center me-3">
              <Form.Check
                type="switch"
                id="theme-switch"
                label={isDarkMode ? <Sun className="text-warning" /> : <Moon />}
                checked={isDarkMode}
                onChange={toggleTheme}
                className="m-0"
              />
            </div>
            
            {/* Logout Button (only when user is logged in) */}
            {currentUser && (
              <Button 
                variant={isDarkMode ? 'outline-light' : 'outline-secondary'}
                onClick={handleLogout}
                size="sm"
                className="flex-shrink-0"
              >
                Logout
              </Button>
            )}
            
            {/* Login/Signup Buttons (only when user is not logged in) */}
            {!currentUser && (
              <>
                <Nav.Link as={Link} to="/login" className="px-2 flex-shrink-0">
                  Login
                </Nav.Link>
                <Button 
                  as={Link} 
                  to="/signup" 
                  variant="primary"
                  size="sm"
                  className="ms-2 flex-shrink-0"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </Container>
    </Navbar>
  );
}
