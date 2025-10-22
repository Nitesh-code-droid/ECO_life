// Firebase configuration and API integrations
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase config - Using VITE_ prefix for Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDLLdkSkHwcQwKGiMfvGYy0oOOw6t4dd04",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ecolife-d8306.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ecolife-d8306",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ecolife-d8306.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "837150090249",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:837150090249:web:f0d7af6b2cf70b85ca84d8",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-06P5ZDPJH5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

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
      greenCredits: habitData.greenCredits || 5,
      photos: habitData.photos || [],
      hasPhotos: (habitData.photos && habitData.photos.length > 0) || false,
      verified: false // Will be verified by AI later
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

// Get habits with photos for AI verification
export const getHabitsWithPhotos = async (userId) => {
  try {
    const q = query(
      collection(db, 'habits'),
      where('userId', '==', userId),
      where('hasPhotos', '==', true),
      where('verified', '==', false),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting habits with photos:", error);
    return [];
  }
};

// Update habit verification status
export const updateHabitVerification = async (habitId, verified, aiAnalysis = null) => {
  try {
    const habitRef = doc(db, 'habits', habitId);
    await setDoc(habitRef, {
      verified,
      aiAnalysis,
      verifiedAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating habit verification:", error);
    throw error;
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
    { name: 'Used reusable water bottle', date: new Date(), greenCredits: 5, category: 'waste-reduction', photos: [] },
    { name: 'Cycled to work', date: new Date(Date.now() - 86400000), greenCredits: 10, category: 'transportation', photos: [] },
    { name: 'Bought organic vegetables', date: new Date(Date.now() - 172800000), greenCredits: 8, category: 'food', photos: [] },
    { name: 'Used LED bulbs', date: new Date(Date.now() - 259200000), greenCredits: 6, category: 'energy', photos: [] }
  ]
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "your-api-key-here" && 
         firebaseConfig.projectId !== "your-project-id" &&
         firebaseConfig.apiKey && 
         firebaseConfig.projectId;
};

// AI Photo Analysis (placeholder for future implementation)
export const analyzeHabitPhoto = async (photoUrl, habitName, category) => {
  // This is a placeholder for AI photo analysis
  // In the future, this would call an AI service to verify the habit
  
  // Simulate AI analysis delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock AI response
  const mockAnalysis = {
    verified: Math.random() > 0.3, // 70% chance of verification
    confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
    description: `AI detected activity related to ${habitName} in the ${category} category`,
    suggestions: [
      'Great job on your eco-friendly activity!',
      'Consider documenting the impact for better tracking',
      'Share your achievement with the community'
    ]
  };
  
  return mockAnalysis;
};