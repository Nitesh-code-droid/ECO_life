import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, getUserProfile, isFirebaseConfigured, updateUserProfile, subscribeUserProfile } from '@/lib/firebase';

import TubelightNavbar from '@/components/TubelightNavbar';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload';
import './App.css';

interface UserProfile {
  ecoScore: number;
  greenCredits: number;
  level: number;
  totalCO2Saved: number;
  streakDays: number;
  badges: string[];
  profilePhotoURL?: string | null;
  profilePhotoUploaded?: boolean;
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const firebaseConfigured = isFirebaseConfigured();

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        // Start real-time profile subscription
        try {
          if (unsubProfile) unsubProfile();
          unsubProfile = subscribeUserProfile(u.uid, (profile) => {
            setUserProfile(profile as UserProfile);
          });
        } catch (error) {
          console.error('Error subscribing to user profile:', error);
          // Fallback: one-time fetch
          try {
            const profile = await getUserProfile(u.uid);
            setUserProfile(profile as UserProfile);
          } catch {}
        }
      } else {
        setUser(null);
        setUserProfile(null);
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = null;
        }
      }
      setLoading(false);
    });

    return () => {
      if (unsubProfile) unsubProfile();
      unsubscribeAuth();
    };
  }, []);

  // Update user profile when data changes (persist to Firestore to survive refresh)
  const updateProfile = async (newProfileData: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await updateUserProfile(user.uid, newProfileData);
      if (userProfile) {
        setUserProfile({ ...userProfile, ...newProfileData });
      } else {
        setUserProfile(newProfileData as UserProfile);
      }
    } catch (e) {
      // still update local state to keep UI responsive
      if (userProfile) setUserProfile({ ...userProfile, ...newProfileData });
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

  // Show profile photo upload modal if user hasn't uploaded one yet
  const showProfilePhotoUpload = user && userProfile && !userProfile.profilePhotoUploaded;

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
        
        {/* Profile Photo Upload Modal */}
        {showProfilePhotoUpload && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <ProfilePhotoUpload
              userId={user.uid}
              currentPhotoURL={userProfile.profilePhotoURL}
              onPhotoUploaded={(photoURL) => {
                updateProfile({ 
                  profilePhotoURL: photoURL,
                  profilePhotoUploaded: true 
                });
              }}
              onSkip={() => {
                updateProfile({ profilePhotoUploaded: true });
              }}
              required={false}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default App;