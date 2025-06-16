// src/components/Navigation.jsx
import React from "react";
import { Navbar, Nav, Container, Button, Form } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Sun, Moon } from "react-bootstrap-icons";

export default function Navigation() {
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const normalizedPath = pathname.toLowerCase().replace(/\/+$/, "");
  const isAuthPage = ["/login", "/signup", ""].includes(normalizedPath);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isAuthPage) {
    return (
      <Navbar
        bg={isDarkMode ? "dark" : "light"}
        variant={isDarkMode ? "dark" : "light"}
        expand="lg"
        className="shadow-sm"
      >
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

  return (
    <Navbar
      bg={isDarkMode ? "dark" : "light"}
      variant={isDarkMode ? "dark" : "light"}
      className="shadow-sm"
      collapseOnSelect={false}
      expand={false} // Disable auto-collapse
    >
      <Container fluid className="px-3">
        <div className="d-flex w-100 align-items-center">
          <Navbar.Brand as={Link} to="/" className="fw-bold me-4 flex-shrink-0">
            DriveClone
          </Navbar.Brand>
          <div className="flex-grow-1" />
          <div className="d-flex align-items-center">
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
            {currentUser && (
              <Button
                variant={isDarkMode ? "outline-light" : "outline-secondary"}
                onClick={handleLogout}
                size="sm"
                className="flex-shrink-0"
              >
                Logout
              </Button>
            )}
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
