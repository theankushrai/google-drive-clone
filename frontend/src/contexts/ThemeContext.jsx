// src/contexts/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// Create a context called ThemeContext
const ThemeContext = createContext();

// A hook to access the theme state from any component
export const useTheme = () => {
  // Get the theme state and functions from the context
  const context = useContext(ThemeContext);

  // If the component is not wrapped with ThemeProvider, throw an error
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  // Return the theme state and functions
  return context;
};

// The provider component that wraps the app
export const ThemeProvider = ({ children }) => {
  // Initialize the theme state with 'light' as default
  const [theme, setTheme] = useState('light');

  // Update the body class name when theme changes
  useEffect(() => {
    // Set the body class name to the current theme
    document.body.className = `${theme}-mode`;
  }, [theme]);

  // Load the saved theme from local storage when the app mounts
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) {
      // Set the theme state to the saved theme
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // If the user prefers dark mode, set the theme to 'dark'
      setTheme('dark');
    }
  }, []);

  // A function to toggle the theme
  const toggleTheme = () => {
    // Update the theme state to the opposite of the current theme
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      // Save the new theme to local storage
      localStorage.setItem('app-theme', newTheme);
      return newTheme;
    });
  };

  // The value object that will be passed to the context provider
  const value = {
    // The current theme
    theme,
    // A boolean indicating if the current theme is dark
    isDarkMode: theme === 'dark',
    // The function to toggle the theme
    toggleTheme,
  };

  // Wrap the app with the context provider
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};