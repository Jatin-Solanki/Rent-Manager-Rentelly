import { initializeApp } from 'firebase/app';
import { getFirestore, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { format, isValid } from 'date-fns';

// Your Firebase configuration

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Helper function to safely format dates with a fallback
export const safeFormat = (date: Date | null | undefined, formatStr: string, fallback: string = "N/A"): string => {
  if (!date || !isValid(date)) return fallback;
  try {
    return format(date, formatStr);
  } catch (error) {
    console.error("Error formatting date:", error);
    return fallback;
  }
};

// Helper function to safely convert Firebase timestamps to JavaScript Date objects
const timestampToDate = (timestamp: Timestamp | Date | null | undefined): Date | null => {
  if (!timestamp) return null;
  
  if (timestamp instanceof Date) return timestamp;
  
  if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // If it's a string or number, try to create a Date
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  console.warn("Failed to convert timestamp to Date:", timestamp);
  return null;
};

// Helper function to ensure a value is a valid Date object
const ensureDate = (value: any): Date => {
  if (value instanceof Date) {
    return value;
  }
  
  if (typeof value === 'object' && value !== null) {
    if ('toDate' in value && typeof value.toDate === 'function') {
      return value.toDate();
    }
    
    if ('seconds' in value && typeof value.seconds === 'number') {
      return new Date(value.seconds * 1000);
    }
    
    if ('_seconds' in value && typeof value._seconds === 'number') {
      return new Date(value._seconds * 1000);
    }
  }
  
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  console.error("Invalid date value:", value);
  return new Date(); // Return current date as fallback
};

export { db, auth, storage, timestampToDate, ensureDate };
