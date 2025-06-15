// src/contexts/AuthContext.js

// Import necessary React hooks for state and side effects.
import React, { createContext, useContext, useEffect, useState } from 'react';

// Import the Firebase authentication instance.
import { auth } from '../services/firebase';

// Create the Context object. This will hold the authentication state and functions
// that will be accessible throughout the component tree.
const AuthContext = createContext();

/**
 * Custom hook to easily access the authentication data from any descendant component.
 * @returns {object} An object containing currentUser (the authenticated user) and loading status.
 */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * AuthProvider component.
 * This component wraps parts of your application and provides the authentication state
 * and related functionality to all its children. It listens for Firebase auth state changes.
 * @param {object} { children } - React children to be rendered within the provider's scope.
 */
export function AuthProvider({ children }) {
  // State to hold the currently authenticated user object from Firebase (or null if not logged in).
  const [currentUser, setCurrentUser] = useState(null);
  // State to indicate if the initial authentication check is still in progress.
  const [loading, setLoading] = useState(true);

  // useEffect hook to set up a listener for Firebase authentication state changes.
  // This effect runs only once after the initial render (due to the empty dependency array).
  useEffect(() => {
    // onAuthStateChanged subscribes to changes in the user's sign-in status.
    // It returns an unsubscribe function, which is crucial for cleanup when the component unmounts.
    const unsubscribe = auth.onAuthStateChanged(user => {
      // Update the currentUser state with the user object (or null).
      setCurrentUser(user);
      // Once the initial check is complete, set loading to false.
      setLoading(false);
    });

    // Cleanup function: This function is called when the component unmounts,
    // ensuring the Firebase listener is detached to prevent memory leaks.
    return unsubscribe;
  }, []);

  // The value object contains the data that will be exposed to consumers of this context.
  const value = {
    currentUser,
    loading
  };

  return (
    // The AuthContext.Provider makes the 'value' available to any nested components
    // that call useContext(AuthContext) or useAuth().
    // Children are only rendered once the initial authentication check is complete (i.e., not loading).
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
