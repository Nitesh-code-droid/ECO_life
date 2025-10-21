// Firebase configuration and API integrations
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, doc, setDoc, getDoc } from 'firebase/firestore';

// Environment shim for Vite
const env = (typeof import.meta !== 'undefined' ? import.meta.env : {}) || {};

// Firebase config - Replace with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "your-api-key-here",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "your-project-id.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "your-project-id.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
  appId: env.VITE_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Create or update user profile in Firestore
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // New user - create profile with default values
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date(),
        ecoScore: 0,
        greenCredits: 0,
        level: 1,
        totalCO2Saved: 0,
        streakDays: 0,
        badges: ['First Steps'],
        lastLoginAt: new Date()
      });
    } else {
      // Existing user - update last login
      await setDoc(userRef, {
        lastLoginAt: new Date()
      }, { merge: true });
    }
    
    return user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Get user profile data
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      // Return default profile if none exists
      return {
        ecoScore: 0,
        greenCredits: 0,
        level: 1,
        totalCO2Saved: 0,
        streakDays: 0,
        badges: ['First Steps']
      };
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    return sampleUserData; // Fallback to sample data
  }
};

// Update user profile
export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, profileData, { merge: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

// Firestore functions
export const addHabit = async (userId, habitData) => {
  try {
    const docRef = await addDoc(collection(db, 'habits'), {
      userId,
      ...habitData,
      timestamp: new Date(),
      greenCredits: habitData.greenCredits || 5
    });
    
    // Update user's total green credits
    const userProfile = await getUserProfile(userId);
    await updateUserProfile(userId, {
      greenCredits: (userProfile.greenCredits || 0) + (habitData.greenCredits || 5),
      totalCO2Saved: (userProfile.totalCO2Saved || 0) + ((habitData.greenCredits || 5) * 0.2)
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error adding habit:", error);
    throw error;
  }
};

export const getUserHabits = async (userId) => {
  try {
    const q = query(
      collection(db, 'habits'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting habits:", error);
    return sampleUserData.habits; // Fallback to sample data
  }
};

// Mock Carbon Footprint API (for demo purposes)
export const getCarbonFootprint = async (productName) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock carbon footprint data
  const mockData = {
    'apple': { carbonFootprint: 0.3, isEcoFriendly: true, alternatives: ['organic apple', 'local apple'] },
    'beef': { carbonFootprint: 27.0, isEcoFriendly: false, alternatives: ['plant-based protein', 'chicken', 'tofu'] },
    'plastic bottle': { carbonFootprint: 0.5, isEcoFriendly: false, alternatives: ['reusable bottle', 'glass bottle'] },
    'electric car': { carbonFootprint: 4.6, isEcoFriendly: true, alternatives: ['public transport', 'bicycle'] },
    'solar panel': { carbonFootprint: -2.5, isEcoFriendly: true, alternatives: ['wind energy', 'hydroelectric'] },
    'banana': { carbonFootprint: 0.7, isEcoFriendly: true, alternatives: ['local fruit', 'seasonal fruit'] },
    'fast fashion': { carbonFootprint: 8.1, isEcoFriendly: false, alternatives: ['sustainable clothing', 'second-hand', 'organic cotton'] },
    'led bulb': { carbonFootprint: 0.1, isEcoFriendly: true, alternatives: ['natural lighting', 'energy star bulbs'] }
  };

  const product = productName.toLowerCase();
  return mockData[product] || { 
    carbonFootprint: Math.random() * 10, 
    isEcoFriendly: Math.random() > 0.5,
    alternatives: ['eco-friendly alternative', 'sustainable option']
  };
};

// Sample user data for demo/fallback
export const sampleUserData = {
  totalGreenCredits: 247,
  ecoScore: 85,
  level: 3,
  badges: ['First Steps', 'Green Warrior', 'Carbon Saver'],
  streakDays: 12,
  totalCO2Saved: 45.7,
  habits: [
    { name: 'Used reusable water bottle', date: new Date(), greenCredits: 5, category: 'waste-reduction' },
    { name: 'Cycled to work', date: new Date(Date.now() - 86400000), greenCredits: 10, category: 'transportation' },
    { name: 'Bought organic vegetables', date: new Date(Date.now() - 172800000), greenCredits: 8, category: 'food' },
    { name: 'Used LED bulbs', date: new Date(Date.now() - 259200000), greenCredits: 6, category: 'energy' }
  ]
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = () => {
  // Consider configured only if essential keys are present
  return Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID);
};