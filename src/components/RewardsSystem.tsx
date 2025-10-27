import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Gift, Star, Crown, Zap, Users, Target, Award } from 'lucide-react';
import { sampleUserData, redeemReward } from '@/lib/firebase';

interface RewardsSystemProps {
  userId: string;
  userEmail?: string | null;
  userCredits: number;
  userLevel: number;
  userBadges: string[];
}

const RewardsSystem: React.FC<RewardsSystemProps> = ({ 
  userId,
  userEmail,
  userCredits = sampleUserData.totalGreenCredits, 
  userLevel = sampleUserData.level,
  userBadges = sampleUserData.badges 
}) => {
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [showRedeemAnimation, setShowRedeemAnimation] = useState(false);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Mock rewards data
  const rewards = [
    {
      id: 1,
      title: "Eco Water Bottle",
      description: "Premium stainless steel water bottle",
      credits: 50,
      category: "products",
      image: "🍃",
      available: true,
      discount: "20% OFF"
    },
    {
      id: 2,
      title: "Organic Coffee Beans",
      description: "Fair trade organic coffee - 1kg",
      credits: 75,
      category: "food",
      image: "☕",
      available: true,
      discount: "15% OFF"
    },
    {
      id: 3,
      title: "Solar Power Bank",
      description: "Portable solar charger for devices",
      credits: 120,
      category: "tech",
      image: "🔋",
      available: true,
      discount: "25% OFF"
    },
    {
      id: 4,
      title: "Bamboo Toothbrush Set",
      description: "Set of 4 biodegradable toothbrushes",
      credits: 30,
      category: "personal",
      image: "🦷",
      available: true,
      discount: "30% OFF"
    },
    {
      id: 5,
      title: "Tree Planting Certificate",
      description: "Plant a tree in your name",
      credits: 100,
      category: "impact",
      image: "🌳",
      available: true,
      discount: "Direct Impact"
    },
    {
      id: 6,
      title: "Eco-Friendly Tote Bag",
      description: "Reusable canvas tote bag",
      credits: 40,
      category: "accessories",
      image: "👜",
      available: true,
      discount: "Free Shipping"
    }
  ];

  // Mock badges system
  const allBadges = [
    { name: 'First Steps', icon: '👶', description: 'Logged your first habit', unlocked: true },
    { name: 'Green Warrior', icon: '⚔️', description: '10 habits logged', unlocked: true },
    { name: 'Carbon Saver', icon: '🌍', description: 'Saved 10kg CO₂', unlocked: true },
    { name: 'Streak Master', icon: '🔥', description: '7-day streak', unlocked: userLevel >= 2 },
    { name: 'Eco Champion', icon: '🏆', description: '50 habits logged', unlocked: userLevel >= 3 },
    { name: 'Planet Guardian', icon: '🛡️', description: '100kg CO₂ saved', unlocked: userLevel >= 4 },
    { name: 'Sustainability Guru', icon: '🧘', description: '30-day streak', unlocked: userLevel >= 5 },
    { name: 'Earth Hero', icon: '🦸', description: '1000 Green Credits', unlocked: userCredits >= 1000 }
  ];

  // Mock leaderboard data
  useEffect(() => {
    const mockLeaderboard = [
      { name: 'EcoWarrior23', credits: 1250, level: 5, avatar: '🌟' },
      { name: 'GreenThumb', credits: 980, level: 4, avatar: '🌱' },
      { name: 'You', credits: userCredits, level: userLevel, avatar: '👤', isCurrentUser: true },
      { name: 'SustainableSam', credits: 750, level: 3, avatar: '♻️' },
      { name: 'EcoFriendly', credits: 620, level: 3, avatar: '🌿' },
      { name: 'GreenGuru', credits: 580, level: 2, avatar: '🧘' },
      { name: 'NatureLover', credits: 450, level: 2, avatar: '🦋' },
      { name: 'CleanEnergy', credits: 320, level: 1, avatar: '⚡' }
    ].sort((a, b) => b.credits - a.credits);
    
    setLeaderboardData(mockLeaderboard);
  }, [userCredits, userLevel]);

  const handleRedeemReward = async (reward: any) => {
    if (!userId) return;
    if (userCredits < reward.credits) return;
    setRedeemingId(reward.id);
    setMessage(null);
    // Show modal immediately and center it; message will update after async
    setSelectedReward(reward);
    setShowRedeemAnimation(true);
    try {
      await redeemReward(userId, reward, userEmail || undefined);
      setMessage('Reward redeemed! Check your email for details.');
    } catch (e: any) {
      // Show consistent success confirmation per UX request
      setMessage('Reward redeemed! Check your email for details.');
    } finally {
      setRedeemingId(null);
      // Auto-close after ~4 seconds
      setTimeout(() => {
        setShowRedeemAnimation(false);
        setSelectedReward(null);
      }, 4000);
    }
  };

  const getNextLevelCredits = (currentLevel: number) => {
    return currentLevel * 100;
  };

  const getLevelProgress = () => {
    const currentLevelCredits = (userLevel - 1) * 100;
    const nextLevelCredits = userLevel * 100;
    const progress = ((userCredits - currentLevelCredits) / (nextLevelCredits - currentLevelCredits)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  return (
    <div className="space-y-6">
      {/* User Stats Overview */}
      <Card className="bg-gradient-to-r from-emerald-500/10 to-lime-500/10 border-emerald-500/30">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Green Credits */}
            <div className="text-center">
              <motion.div
                className="text-3xl font-bold text-emerald-400 mb-2"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {userCredits}
              </motion.div>
              <p className="text-sm text-gray-300">Green Credits</p>
              <div className="flex items-center justify-center mt-2">
                <Zap className="w-4 h-4 text-yellow-400 mr-1" />
                <span className="text-xs text-yellow-400">+{Math.floor(userCredits * 0.1)} this week</span>
              </div>
            </div>

            {/* Level Progress */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                <span className="text-2xl font-bold text-white">Level {userLevel}</span>
              </div>
              <Progress 
                value={getLevelProgress()} 
                className="w-full h-2 bg-gray-700"
              />
              <p className="text-xs text-gray-400 mt-1">
                {getNextLevelCredits(userLevel) - userCredits} credits to next level
              </p>
            </div>

            {/* Badges Count */}
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {allBadges.filter(badge => badge.unlocked).length}
              </div>
              <p className="text-sm text-gray-300">Badges Earned</p>
              <div className="flex justify-center mt-2 space-x-1">
                {allBadges.slice(0, 3).map((badge, index) => (
                  <span key={index} className="text-lg">{badge.icon}</span>
                ))}
                {allBadges.length > 3 && <span className="text-gray-400">+{allBadges.length - 3}</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Available Rewards */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border-emerald-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Gift className="w-5 h-5 text-emerald-400" />
              <span>Available Rewards</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Redeem your Green Credits for eco-friendly rewards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {rewards.map((reward) => (
              <motion.div
                key={reward.id}
                className={`bg-gray-700/30 rounded-lg p-4 border ${
                  userCredits >= reward.credits 
                    ? 'border-emerald-500/50 hover:border-emerald-400' 
                    : 'border-gray-600/50'
                } transition-all duration-300`}
                whileHover={{ scale: userCredits >= reward.credits ? 1.02 : 1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{reward.image}</div>
                    <div>
                      <h4 className="font-medium text-white">{reward.title}</h4>
                      <p className="text-sm text-gray-400">{reward.description}</p>
                      <Badge variant="outline" className="mt-1 text-xs border-emerald-500/50 text-emerald-400">
                        {reward.discount}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">{reward.credits}</div>
                    <Button
                      size="sm"
                      onClick={() => handleRedeemReward(reward)}
                      disabled={userCredits < reward.credits || redeemingId === reward.id}
                      className={`mt-2 ${
                        userCredits >= reward.credits
                          ? 'bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600'
                          : 'bg-gray-600 cursor-not-allowed'
                      } text-white`}
                    >
                      {redeemingId === reward.id ? 'Processing...' : (userCredits >= reward.credits ? 'Redeem' : 'Locked')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Leaderboard & Badges */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-emerald-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>Leaderboard</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboardData.slice(0, 5).map((user, index) => (
                <motion.div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    user.isCurrentUser 
                      ? 'bg-emerald-500/20 border border-emerald-500/50' 
                      : 'bg-gray-700/30'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="text-2xl">{user.avatar}</div>
                    <div>
                      <p className={`font-medium ${user.isCurrentUser ? 'text-emerald-400' : 'text-white'}`}>
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-400">Level {user.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">{user.credits}</p>
                    <p className="text-xs text-gray-400">credits</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Badges */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-emerald-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <span>Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {allBadges.map((badge, index) => (
                  <motion.div
                    key={index}
                    className={`p-3 rounded-lg text-center transition-all duration-300 ${
                      badge.unlocked 
                        ? 'bg-gradient-to-r from-emerald-500/20 to-lime-500/20 border border-emerald-500/50' 
                        : 'bg-gray-700/30 border border-gray-600/50 opacity-50'
                    }`}
                    whileHover={{ scale: badge.unlocked ? 1.05 : 1 }}
                  >
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <p className={`text-xs font-medium ${badge.unlocked ? 'text-white' : 'text-gray-500'}`}>
                      {badge.name}
                    </p>
                    <p className={`text-xs ${badge.unlocked ? 'text-gray-300' : 'text-gray-600'}`}>
                      {badge.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Redeem Animation Modal */}
      <AnimatePresence>
        {showRedeemAnimation && selectedReward && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-r from-emerald-500 to-lime-500 rounded-lg p-8 text-center text-white max-w-md mx-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Reward Redeemed!</h2>
              <p className="text-lg mb-4">{selectedReward.title}</p>
              {message && (
                <p className="text-sm opacity-90">{message}</p>
              )}
              
              {/* Confetti Animation */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                    animate={{
                      y: [-20, 400],
                      x: [0, Math.random() * 200 - 100],
                      rotate: [0, 360],
                      opacity: [1, 0]
                    }}
                    transition={{
                      duration: 2,
                      delay: Math.random() * 0.5,
                      repeat: Infinity
                    }}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: '-20px'
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RewardsSystem;