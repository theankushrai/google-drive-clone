import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Create the Context (a central store of information that can be accessed by components)
const ThemeContext = createContext();

// 2. Create a custom hook to easily use the theme context
// This hook will throw an error if useTheme is used outside of a ThemeProvider
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// 3. Create the ThemeProvider component
// This component will wrap the entire application and provide the theme context
export const ThemeProvider = ({ children }) => {
  // State to store the current theme (light or dark)
  const [theme, setTheme] = useState('light');

  // Effect to apply the theme class to the body tag
  // This will allow us to style the app based on the theme
  useEffect(() => {
    document.body.className = `${theme}-mode`;
  }, [theme]);

  // Effect to load the saved theme from local storage or detect the system preference
  useEffect(() => {
    // Try to load the saved theme from local storage
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // If no saved theme, detect the system preference
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDarkMode ? 'dark' : 'light');
    }
  }, []);

  // Function to toggle between light and dark theme
  const toggleTheme = () => {
    setTheme(prevTheme => {
      // Save the new theme to local storage
      localStorage.setItem('app-theme', prevTheme === 'light' ? 'dark' : 'light');
      // Return the new theme
      return prevTheme === 'light' ? 'dark' : 'light';
    });
  };

  // Create the value object that will be passed to the context provider
  // This object contains the current theme, a boolean indicating if we are in dark mode, and the toggle function
  const value = {
    theme,
    isDarkMode: theme === 'dark',
    toggleTheme,
  };

  // Return the ThemeContext.Provider component
  // This component will wrap the entire application and provide the theme context
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
