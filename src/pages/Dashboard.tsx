import React, { useState, useEffect, useMemo } from 'react';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, TrendingUp, Leaf, Zap, Target, Award } from 'lucide-react';
import HabitLogger from '@/components/HabitLogger';
import CarbonAnalyzer from '@/components/CarbonAnalyzer';
import RewardsSystem from '@/components/RewardsSystem';
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload';
import { sampleUserData, getUserHabits, getUserProfile, subscribeUserHabits } from '@/lib/firebase';

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

interface DashboardProps {
  user: any;
  userProfile: UserProfile | null;
  activeTab: string;
  onProfileUpdate: (data: Partial<UserProfile>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, userProfile, activeTab, onProfileUpdate }) => {
  const [recentHabits, setRecentHabits] = useState([] as any[]);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const key = `habits:${user.uid}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const cached = JSON.parse(raw) as any[];
        const normalized = cached.map((h: any) => ({
          ...h,
          date: new Date(h.date || h.timestamp || Date.now())
        }));
        setRecentHabits(normalized);
      }
    } catch {}
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeUserHabits(user.uid, (items: any[]) => {
      const normalized = items.map((h: any) => {
        let dt: Date | null = null;
        const t = h.timestamp ?? h.date;
        if (t?.toDate) {
          dt = t.toDate();
        } else if (t instanceof Date) {
          dt = t;
        } else if (typeof t === 'number') {
          dt = new Date(t);
        } else if (typeof t === 'string') {
          dt = new Date(t);
        }
        return {
          ...h,
          date: dt || new Date(),
        };
      });
      setRecentHabits(normalized);
    });
    return () => unsub && unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const key = `habits:${user.uid}`;
    try {
      const serializable = recentHabits.map((h: any) => ({
        ...h,
        date: (h.date instanceof Date ? h.date : new Date(h.date)).toISOString(),
      }));
      localStorage.setItem(key, JSON.stringify(serializable));
    } catch {}
  }, [recentHabits, user?.uid]);

  // Use actual user profile data or fallback to zeroed defaults
  const currentProfile = userProfile || {
    ecoScore: 0,
    greenCredits: 0,
    level: 1,
    totalCO2Saved: 0,
    streakDays: 0,
    badges: [] as string[]
  };

  // Weekly progress from current week's habits
  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const startOfWeek = new Date(today);
    const dayIdx = today.getDay();
    startOfWeek.setDate(today.getDate() - dayIdx); // Sunday as start
    startOfWeek.setHours(0, 0, 0, 0);

    const sums: Record<string, { credits: number; co2Saved: number }> = {
      Sun: { credits: 0, co2Saved: 0 },
      Mon: { credits: 0, co2Saved: 0 },
      Tue: { credits: 0, co2Saved: 0 },
      Wed: { credits: 0, co2Saved: 0 },
      Thu: { credits: 0, co2Saved: 0 },
      Fri: { credits: 0, co2Saved: 0 },
      Sat: { credits: 0, co2Saved: 0 }
    };

    for (const habit of recentHabits) {
      const d = new Date(habit.date || habit.timestamp || Date.now());
      const inWeek = d >= startOfWeek && d <= new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (!inWeek) continue;
      const key = days[d.getDay()] as keyof typeof sums;
      const credits = Number(habit.greenCredits || 0);
      sums[key].credits += credits;
      sums[key].co2Saved += credits * 0.2;
    }

    // Return in Mon..Sun order to match UI label sequence
    const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
    return order.map((day) => ({ day, credits: sums[day].credits, co2Saved: Number(sums[day].co2Saved.toFixed(2)) }));
  }, [recentHabits]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const windowMonths: { key: string; label: string; year: number; monthIndex: number }[] = [];
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${pad(d.getMonth())}`;
      const label = d.toLocaleString(undefined, { month: 'short' });
      windowMonths.push({ key, label, year: d.getFullYear(), monthIndex: d.getMonth() });
    }

    const sums: Record<string, { credits: number; co2Saved: number }> = {};
    for (const m of windowMonths) sums[m.key] = { credits: 0, co2Saved: 0 };

    for (const habit of recentHabits) {
      const t = habit.timestamp ?? habit.date;
      const d = t?.toDate ? t.toDate() : (t instanceof Date ? t : (typeof t === 'number' ? new Date(t) : new Date(String(t))));
      if (!(d instanceof Date) || isNaN(d.getTime())) continue;
      const k = `${d.getFullYear()}-${pad(d.getMonth())}`;
      if (!sums[k]) continue;
      const c = Number(habit.greenCredits || 0);
      sums[k].credits += c;
      sums[k].co2Saved += c * 0.2;
    }

    return windowMonths.map(m => ({
      month: m.label,
      credits: sums[m.key].credits,
      co2Saved: Number(sums[m.key].co2Saved.toFixed(2))
    }));
  }, [recentHabits]);

  const totalWeeklyCredits = useMemo(() => {
    return weeklyData.reduce((sum, d) => sum + (Number(d.credits) || 0), 0);
  }, [weeklyData]);

  const categoryData = useMemo(() => {
    const totals = {
      transportation: 0,
      energy: 0,
      food: 0,
      waste: 0
    };

    for (const habit of recentHabits) {
      const credits = Number(habit.greenCredits || 0);
      const cat: string = habit.category || '';
      if (cat === 'transportation') totals.transportation += credits;
      else if (cat === 'energy') totals.energy += credits;
      else if (cat === 'food') totals.food += credits;
      else if (cat === 'waste-reduction') totals.waste += credits;
    }

    return [
      { name: 'Transportation', value: totals.transportation, color: '#10B981' },
      { name: 'Energy', value: totals.energy, color: '#F59E0B' },
      { name: 'Food', value: totals.food, color: '#8B5CF6' },
      { name: 'Waste', value: totals.waste, color: '#06B6D4' }
    ];
  }, [recentHabits]);

  const handleHabitAdded = async (habit: any) => {
    // Optimistic update so chart updates immediately; snapshot will resync
    const t = habit?.timestamp ?? habit?.date ?? new Date();
    const dt = t?.toDate ? t.toDate() : (t instanceof Date ? t : (typeof t === 'number' ? new Date(t) : new Date(String(t))));
    setRecentHabits(prev => [{ ...habit, date: dt }, ...prev]);
  };

  const handleProductAnalyzed = (product: any) => {
    if (product.isEcoFriendly) {
      onProfileUpdate({
        greenCredits: currentProfile.greenCredits + 5,
        totalCO2Saved: currentProfile.totalCO2Saved + 0.5
      });
    }
  };

  const renderDashboardContent = () => (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-emerald-500/20 to-lime-500/20 border-emerald-500/30">
            <CardContent className="p-6 text-center">
              <Zap className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-400">{currentProfile.greenCredits}</div>
              <p className="text-sm text-black-800">Green Credits</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30">
            <CardContent className="p-6 text-center">
              <Leaf className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-400">{currentProfile.totalCO2Saved.toFixed(1)}kg</div>
              <p className="text-sm text-black-800">CO₂ Saved</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-400">{currentProfile.streakDays}</div>
              <p className="text-sm text-black-800">Day Streak</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
            <CardContent className="p-6 text-center">
              <Award className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-400">Level {currentProfile.level}</div>
              <p className="text-sm text-black-800">Eco Level</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <HabitLogger userId={user?.uid || 'demo'} onHabitAdded={handleHabitAdded} />

          {/* Weekly Progress Chart */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-emerald-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span>Weekly Progress</span>
                </CardTitle>
                <div className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Total: {totalWeeklyCredits} credits</div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis yAxisId="left" stroke="#9CA3AF" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#9CA3AF"
                    tickFormatter={(v) => `${v}kg`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #10B981',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend verticalAlign="top" height={24} wrapperStyle={{ color: '#fff' }} />
                  <Area
                    type="monotone"
                    dataKey="credits"
                    stroke="#10B981"
                    fill="url(#gradientCredits)"
                    yAxisId="left"
                  />
                  <Line
                    type="monotone"
                    dataKey="co2Saved"
                    stroke="#06B6D4"
                    strokeWidth={3}
                    dot={{ r: 3, fill: '#06B6D4' }}
                    yAxisId="right"
                  />
                  <defs>
                    <linearGradient id="gradientCredits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <CarbonAnalyzer onProductAnalyzed={handleProductAnalyzed} />

          {/* Impact Categories */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-emerald-500/30">
            <CardHeader>
              <CardTitle className="text-white">Impact by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activities */}
      <Card className="bg-gray-800/50 backdrop-blur-sm border-emerald-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <span>Recent Activities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentHabits.slice(0, 5).map((habit, index) => (
              <motion.div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <div>
                    <p className="text-white font-medium">{habit.name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(habit.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-emerald-400 font-medium">
                  +{habit.greenCredits} credits
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderHabitsContent = () => (
    <div className="grid lg:grid-cols-2 gap-6">
      <HabitLogger userId={user?.uid || 'demo'} onHabitAdded={handleHabitAdded} />

      <Card className="bg-gray-800/50 backdrop-blur-sm border-emerald-500/30">
        <CardHeader>
          <CardTitle className="text-white">Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #10B981',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line
                type="monotone"
                dataKey="credits"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="co2Saved"
                stroke="#06B6D4"
                strokeWidth={3}
                dot={{ fill: '#06B6D4', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderRewardsContent = () => (
    <RewardsSystem
      userId={user?.uid || ''}
      userEmail={user?.email || null}
      userCredits={currentProfile.greenCredits}
      userLevel={currentProfile.level}
      userBadges={currentProfile.badges}
    />
  );

  const renderProfileContent = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-gray-800/50 backdrop-blur-sm border-emerald-500/30">
        <CardHeader className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            {userProfile?.profilePhotoURL ? (
              <img 
                src={userProfile.profilePhotoURL} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover border-4 border-emerald-400"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 flex items-center justify-center text-2xl font-bold text-white">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <button
              onClick={() => setShowPhotoUpload(true)}
              className="absolute bottom-0 right-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-2 shadow-lg transition-colors"
              title="Update profile photo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <CardTitle className="text-white">{user?.displayName || 'Eco Warrior'}</CardTitle>
          <CardDescription className="text-gray-300">{user?.email || 'demo@ecolife.com'}</CardDescription>
          {userProfile?.profilePhotoUploaded && (
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Face Verification Enabled
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-emerald-500/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-emerald-400">{currentProfile.greenCredits}</div>
              <div className="text-sm text-gray-300">Total Credits</div>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{currentProfile.totalCO2Saved.toFixed(1)}kg</div>
              <div className="text-sm text-gray-300">CO₂ Saved</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Your Badges</h3>
            <div className="grid grid-cols-3 gap-3">
              {currentProfile.badges.map((badge, index) => (
                <div key={index} className="bg-gradient-to-r from-emerald-500/20 to-lime-500/20 rounded-lg p-3 text-center border border-emerald-500/30">
                  <div className="text-2xl mb-1">🏆</div>
                  <div className="text-xs text-white font-medium">{badge}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Profile Photo Upload Modal */}
      {showPhotoUpload && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative">
            <button
              onClick={() => setShowPhotoUpload(false)}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 z-10 shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <ProfilePhotoUpload
              userId={user?.uid || ''}
              currentPhotoURL={userProfile?.profilePhotoURL}
              onPhotoUploaded={(photoURL) => {
                onProfileUpdate({ 
                  profilePhotoURL: photoURL,
                  profilePhotoUploaded: true 
                });
                setShowPhotoUpload(false);
              }}
              onSkip={() => setShowPhotoUpload(false)}
              required={false}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900/20 to-black pt-20 px-4 pb-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {activeTab === 'dashboard' && renderDashboardContent()}
          {activeTab === 'habits' && renderHabitsContent()}
          {activeTab === 'rewards' && renderRewardsContent()}
          {activeTab === 'profile' && renderProfileContent()}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;