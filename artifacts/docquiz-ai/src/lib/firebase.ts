import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth';

// Firebase Web configuration from Vite environment variables with fallback defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCtthoYg4I6-uoupa5C5pycOLuqF47vg8Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "docquiz-be307.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "docquiz-be307",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "docquiz-be307.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "731118108909",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:731118108909:web:232da22cb66cd47a5d0ce4",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RSJ06D0E42",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  } catch (err) {
    console.warn('Firebase initialization error:', err);
  }
}

export { app, auth, googleProvider, signInWithPopup, fbSignOut, onAuthStateChanged };
export type { FirebaseUser };
