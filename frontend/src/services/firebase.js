// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Retrieve the stringified Firebase config from the Vite environment variable.
const firebaseConfigString = import.meta.env.VITE_FIREBASE_CONFIG;

let firebaseConfig;
try {
  // Parse the JSON string back into a JavaScript object.
  firebaseConfig = JSON.parse(firebaseConfigString);
} catch (e) {
  console.error("Error parsing Firebase config from environment variable:", e);
  // It's crucial to handle this error. If the string is malformed, your app won't initialize.
  // You might want to throw an error or provide a default empty config if appropriate.
  firebaseConfig = {}; // Provide an empty object or a default to prevent further crashes
}

// Initialize Firebase with the parsed configuration object.
const app = initializeApp(firebaseConfig);

// Export the Auth instance and Google Provider for use in other parts of your app.
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();