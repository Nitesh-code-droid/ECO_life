// Firebase configuration and API integrations
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, doc, setDoc, getDoc, onSnapshot, increment, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { searchCarbonFootprint } from './carbonDatabase.js';

// Firebase config - Using VITE_ prefix for Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDLLdkSkHwcQwKGiMfvGYy0oOOw6t4dd04",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ecolife-d8306.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ecolife-d8306",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ecolife-d8306.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "837150090249",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:837150090249:web:f0d7af6b2cf70b85ca84d8",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-06P5ZDPJH5"
};

// Redeem a reward: deduct credits atomically, log redemption, and trigger email via optional webhook
export const redeemReward = async (userId, reward, userEmail) => {
  if (!userId || !reward?.credits) throw new Error('Invalid redemption request');
  // 1) Check current profile to ensure sufficient credits
  const profile = await getUserProfile(userId);
  const current = Number(profile?.greenCredits || 0);
  const cost = Number(reward.credits);
  if (current < cost) throw new Error('Insufficient credits');

  // 2) Atomically deduct credits
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, { greenCredits: increment(-cost) }, { merge: true });

  // 3) Log redemption
  await addDoc(collection(db, 'redemptions'), {
    userId,
    userEmail: userEmail || null,
    rewardId: reward.id,
    title: reward.title,
    credits: cost,
    createdAt: serverTimestamp(),
    status: 'pending_email'
  });

  // 4) Optional: trigger email via webhook/function if provided
  const webhook = import.meta.env.VITE_REDEMPTION_WEBHOOK;
  if (webhook && typeof fetch !== 'undefined') {
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: userEmail,
          reward: { id: reward.id, title: reward.title, credits: cost },
        })
      });
    } catch (e) {
      console.warn('Redemption webhook failed:', e?.message || e);
    }
  }

  return { remaining: current - cost };
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

// Carbon Footprint: Use local database (fast, reliable, no API errors)
export const getCarbonFootprint = async (productName) => {
  // Simulate slight delay for UX (optional)
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const result = searchCarbonFootprint(productName);
  
  return {
    carbonFootprint: result.co2e,
    isEcoFriendly: result.isEcoFriendly,
    alternatives: result.alternatives,
    co2e_unit: result.unit,
    source: 'local_database',
    category: result.category,
    message: result.message
  };
};

// OLD CLIMATIQ API CODE (kept for reference, can be deleted)
/*
export const getCarbonFootprintAPI = async (productName) => {
  const API_KEY = "V1Z4DT9E9D3CDDQK3RA6FSQ0TM";
  const DATA_VERSION = "27.27";

  const defaultValues = {
    mass: { value: 1, unit: "kg" },
    distance: { value: 1, unit: "km" },
    volume: { value: 1, unit: "l" },
    energy: { value: 1, unit: "kWh" },
    weight: { value: 1, unit: "kg" }, // Added for Weight unit type
  };

  const getParameterForUnitType = (unitType) => {
    const lowerUnitType = unitType.toLowerCase();
    console.log('🔍 Unit type received:', unitType, '→ Lower:', lowerUnitType);

    if (lowerUnitType.includes("weight")) return "weight";
    if (lowerUnitType.includes("mass")) return "mass";
    if (lowerUnitType.includes("distance")) return "distance";
    if (lowerUnitType.includes("energy")) return "energy";
    if (lowerUnitType.includes("volume")) return "volume";
    return null;
  };

  const getAlternatives = (productName) => {
    const lowerName = productName.toLowerCase();
    if (lowerName.includes('beef') || lowerName.includes('meat')) {
      return ["plant-based proteins", "chicken", "tofu", "lentils"];
    }
    if (lowerName.includes('plastic')) {
      return ["glass containers", "reusable materials", "biodegradable options"];
    }
    if (lowerName.includes('car') || lowerName.includes('vehicle')) {
      return ["public transportation", "bicycle", "electric vehicle"];
    }
    if (lowerName.includes('fashion') || lowerName.includes('clothing')) {
      return ["sustainable brands", "secondhand", "clothing rental"];
    }
    return ["eco-friendly alternatives", "sustainable options"];
  };

  try {
    console.log('🌍 Calling Climatiq API for:', productName);
    
    const normalizedProductName = productName.toLowerCase().trim();

    // Step 1: Search for emission factor
    const searchUrl = `https://api.climatiq.io/data/v1/search?query=${encodeURIComponent(normalizedProductName)}&data_version=${DATA_VERSION}`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: { 
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('❌ Search API Error:', errorText);
      throw new Error(`Search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('🔍 Search results for', normalizedProductName, ':', searchData);

    const firstResult = searchData.results?.[0];

    if (!firstResult) {
      console.error('❌ No results found for:', normalizedProductName);
      throw new Error(`No emission factor found for "${productName}". Try: "diesel", "beef", "apple", "electric car"`);
    }

    console.log('✅ First result:', firstResult);
    console.log('📋 Full first result details:', JSON.stringify(firstResult, null, 2));

    const { activity_id, unit_type } = firstResult;
    const param = getParameterForUnitType(unit_type);

    if (!param || !defaultValues[param]) {
      console.error('❌ Unsupported unit type:', unit_type, 'Available:', Object.keys(defaultValues));
      throw new Error(`Unsupported unit type: ${unit_type}. Supported: ${Object.keys(defaultValues).join(', ')} (mass/weight → mass parameter)`);
    }

    console.log('✅ Mapped unit type', unit_type, 'to parameter:', param);
    console.log('📊 Emission factor details:', {
      activity_id,
      unit_type,
      param,
      defaults: defaultValues[param]
    });

    const defaults = defaultValues[param];

    // Step 2: Estimate emissions using correct Climatiq format
    const estimatePayload = {
      emission_factor: { activity_id, data_version: DATA_VERSION },
      parameters: { [param]: defaults.value, [`${param}_unit`]: defaults.unit }
    };

    console.log('📤 Estimate payload:', JSON.stringify(estimatePayload, null, 2));

    const estimateResponse = await fetch("https://api.climatiq.io/data/v1/estimate", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(estimatePayload)
    });

    if (!estimateResponse.ok) {
      const errorText = await estimateResponse.text();
      console.error('❌ Estimate API Error:', errorText);
      throw new Error(`Estimate failed: ${estimateResponse.status} - ${errorText}`);
    }

    const data = await estimateResponse.json();
    console.log('✅ Estimate response:', data);
    
    // Extract CO2e value
    let co2e = 0;
    let unit = "kg CO2e";
    
    if (typeof data.co2e === 'object' && data.co2e !== null) {
      co2e = data.co2e.value || 0;
      unit = data.co2e.unit || unit;
    } else {
      co2e = data.co2e || 0;
    }

    console.log('✅ API Response:', { co2e, unit, activity_id });

    return {
      carbonFootprint: Number(co2e.toFixed(4)),
      isEcoFriendly: co2e < 5,
      alternatives: getAlternatives(normalizedProductName),
      co2e_unit: unit,
      source: 'climatiq'
    };
  } catch (error) {
    console.error('❌ Failed to fetch carbon footprint:', error);
    throw error;
  }
};
*/

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
        profilePhotoURL: null, // Will be set when user uploads profile photo for face verification
        profilePhotoUploaded: false,
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
    // Fallback to a zeroed default profile instead of sample data
    return {
      ecoScore: 0,
      greenCredits: 0,
      level: 1,
      totalCO2Saved: 0,
      streakDays: 0,
      badges: ['First Steps']
    };
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

// Update user's profile photo for face verification
export const updateProfilePhoto = async (userId, photoURL) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      profilePhotoURL: photoURL,
      profilePhotoUploaded: true,
      profilePhotoUpdatedAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating profile photo:", error);
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

    // Atomically update user's totals to avoid race conditions
    const habitCredits = habitData.greenCredits || 5;
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        greenCredits: increment(habitCredits),
        totalCO2Saved: increment(habitCredits * 0.2)
      },
      { merge: true }
    );

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
    // Fallback to empty list instead of sample data to avoid fake chart points
    return [];
  }
};

// Real-time subscription to a user's profile document
export const subscribeUserProfile = (userId, callback) => {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback({
        ecoScore: 0,
        greenCredits: 0,
        level: 1,
        totalCO2Saved: 0,
        streakDays: 0,
        badges: ['First Steps']
      });
    }
  });
};

// Real-time subscription to a user's habits query
export const subscribeUserHabits = (userId, callback) => {
  const q = query(
    collection(db, 'habits'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );
  return onSnapshot(q, (querySnapshot) => {
    const items = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  });
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

// Carbon Footprint: Prefer backend proxy (Climatiq via Firebase Functions) with safe fallback

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