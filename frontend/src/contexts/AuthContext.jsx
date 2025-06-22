// src/contexts/AuthContext.jsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../services/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Store the ID token in localStorage when the user logs in
  const storeAuthToken = async (user) => {
    if (user) {
      try {
        const token = await user.getIdToken();
        localStorage.setItem('token', token);
        // Refresh token before it expires
        const tokenResult = await user.getIdTokenResult();
        const expiresIn = (new Date(tokenResult.expirationTime).getTime() - Date.now()) - (5 * 60 * 1000); // 5 minutes before expiration
        setTimeout(() => storeAuthToken(user), expiresIn);
      } catch (error) {
        console.error('Error getting ID token:', error);
        localStorage.removeItem('token');
      }
    } else {
      localStorage.removeItem('token');
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        await storeAuthToken(user);
      } else {
        localStorage.removeItem('token');
      }
      setLoading(false);
    });

    // Set up token refresh on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && auth.currentUser) {
        auth.currentUser.getIdToken(true); // Force refresh token
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const logout = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    logout,
    // Add a method to refresh the token when needed
    refreshToken: async () => {
      if (auth.currentUser) {
        await storeAuthToken(auth.currentUser);
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
