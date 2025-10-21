import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Sparkles, Trophy, Users, Info, AlertCircle } from 'lucide-react';
import { signInWithGoogle, isFirebaseConfigured } from '@/lib/firebase';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const firebaseConfigured = isFirebaseConfigured();

  const handleGoogleSignIn = async () => {
    if (!firebaseConfigured) {
      toast.error('Firebase not configured', {
        description: 'Please set up your Firebase credentials first. Check FIREBASE_SETUP.md for instructions.',
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome to EcoLife! 🌱', {
        description: 'Start your sustainable journey today!',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Sign in failed:', error);
      
      let errorMessage = 'Sign in failed. Please try again.';
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized. Please add it to Firebase Console.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign in was cancelled.';
      }
      
      toast.error('Authentication Error', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Leaf,
      title: "Track Your Impact",
      description: "Log eco-friendly habits and see your real-time carbon footprint reduction"
    },
    {
      icon: Sparkles,
      title: "Earn Green Credits",
      description: "Get rewarded for every sustainable action with our gamified credit system"
    },
    {
      icon: Trophy,
      title: "Unlock Achievements",
      description: "Collect badges and climb the leaderboard as you build green habits"
    },
    {
      icon: Users,
      title: "Join the Community",
      description: "Connect with eco-warriors and compete in sustainability challenges"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-black flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400/20 rounded-full"
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.2, 0.8, 0.2]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding & Features */}
        <motion.div
          className="text-center lg:text-left space-y-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo & Title */}
          <div className="space-y-4">
            <motion.div
              className="flex items-center justify-center lg:justify-start space-x-3"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400" />
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(16, 185, 129, 0.5)',
                      '0 0 40px rgba(16, 185, 129, 0.8)',
                      '0 0 20px rgba(16, 185, 129, 0.5)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
                EcoLife
              </h1>
            </motion.div>
            
            <p className="text-xl text-gray-300 max-w-md mx-auto lg:mx-0">
              Turn sustainable living into an exciting game. Track habits, earn rewards, save the planet.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-emerald-500/20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)'
                  }}
                >
                  <Icon className="w-8 h-8 text-emerald-400 mb-2" />
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Right Side - Login Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="bg-gray-800/80 backdrop-blur-lg border-emerald-500/30 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <CardTitle className="text-2xl text-white">Welcome to the Future</CardTitle>
              <CardDescription className="text-gray-300">
                Join thousands of eco-warriors making a difference, one habit at a time.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Firebase Configuration Notice */}
              {!firebaseConfigured && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-orange-300">
                    <p className="font-medium">Firebase Setup Required</p>
                    <p className="text-orange-400/80">
                      Please configure Firebase credentials to enable authentication. 
                      See <code className="bg-orange-500/20 px-1 rounded">FIREBASE_SETUP.md</code> for instructions.
                    </p>
                  </div>
                </div>
              )}

              {/* Setup Status */}
              {firebaseConfigured && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-start space-x-2">
                  <Info className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-300">
                    <p className="font-medium">Firebase Configured ✓</p>
                    <p className="text-green-400/80">Ready to sign in with Google authentication!</p>
                  </div>
                </div>
              )}

              {/* Stats Preview */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                  <div className="text-2xl font-bold text-emerald-400">10K+</div>
                  <div className="text-xs text-gray-400">Active Users</div>
                </div>
                <div className="bg-lime-500/10 rounded-lg p-3 border border-lime-500/20">
                  <div className="text-2xl font-bold text-lime-400">500T</div>
                  <div className="text-xs text-gray-400">CO₂ Saved</div>
                </div>
                <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                  <div className="text-2xl font-bold text-emerald-400">1M+</div>
                  <div className="text-xs text-gray-400">Green Credits</div>
                </div>
              </div>

              {/* Sign In Button */}
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading || !firebaseConfigured}
                className={`w-full font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
                  firebaseConfigured 
                    ? 'bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-white hover:shadow-emerald-500/25'
                    : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {firebaseConfigured ? 'Continue with Google' : 'Setup Required'}
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-400 text-center">
                {firebaseConfigured 
                  ? "By signing in, you agree to our Terms of Service and Privacy Policy."
                  : "Complete Firebase setup to enable Google authentication."
                }
                <br />
                Start your sustainable journey today! 🌱
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;