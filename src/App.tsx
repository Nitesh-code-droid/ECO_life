import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, getUserProfile, isFirebaseConfigured } from '@/lib/firebase';
import TubelightNavbar from '@/components/TubelightNavbar';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import './App.css';

interface AppUser extends User {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

interface UserProfile {
  ecoScore: number;
  greenCredits: number;
  level: number;
  totalCO2Saved: number;
  streakDays: number;
  badges: string[];
}

const App = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const firebaseConfigured = isFirebaseConfigured();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Fetch user profile data
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update user profile when data changes
  const updateProfile = (newProfileData: Partial<UserProfile>) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, ...newProfileData });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div 
            className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 mx-auto"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <p className="text-emerald-400 font-medium">Loading EcoLife...</p>
          {!firebaseConfigured && (
            <p className="text-sm text-orange-400">Firebase configuration needed</p>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <TooltipProvider>
        <Toaster />
        <Login />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Toaster />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900/20 to-black">
        <TubelightNavbar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          user={user}
        />
        <Dashboard 
          user={user} 
          userProfile={userProfile}
          activeTab={activeTab} 
          onProfileUpdate={updateProfile}
        />
      </div>
    </TooltipProvider>
  );
};

export default App;