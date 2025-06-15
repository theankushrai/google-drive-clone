// src/components/MainLayout.jsx
import React from 'react';
import { Container } from 'react-bootstrap';
import Navigation from './Navigation';
import { useTheme } from '../contexts/ThemeContext';

export default function MainLayout({ children }) {
  const { isDarkMode } = useTheme();

  return (
    <div className={`d-flex flex-column min-vh-100 ${isDarkMode ? 'bg-dark' : 'bg-light'}`}>
      <Navigation />
      <main className="flex-grow-1 py-4">
        {children}
      </main>
      <footer className={`py-3 ${isDarkMode ? 'bg-dark text-white' : 'bg-light'}`}>
        <Container className="text-center">
          <p className="mb-0">&copy; {new Date().getFullYear()} Google Drive Clone. All rights reserved.</p>
        </Container>
      </footer>
    </div>
  );
}