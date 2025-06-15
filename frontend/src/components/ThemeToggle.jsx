// src/components/ThemeToggle.jsx
import React from 'react';
import { Button } from 'react-bootstrap';
import { SunFill, MoonFill } from 'react-bootstrap-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Button
      variant={isDarkMode ? 'outline-light' : 'outline-secondary'}
      onClick={toggleTheme}
      className="d-flex align-items-center justify-content-center"
      style={{
        width: '40px',
        height: '40px',
        padding: '0.5rem',
        borderRadius: '50%',
      }}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {isDarkMode ? (
        <SunFill aria-hidden="true" />
      ) : (
        <MoonFill aria-hidden="true" />
      )}
    </Button>
  );
}