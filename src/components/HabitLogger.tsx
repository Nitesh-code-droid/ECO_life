import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Leaf, Bike, Recycle, Zap, Plus, Check, Sparkles } from 'lucide-react';
import { addHabit } from '@/lib/firebase';
import { toast } from 'sonner';

interface HabitLoggerProps {
  userId: string;
  onHabitAdded: (habit: any) => void;
}

const HabitLogger: React.FC<HabitLoggerProps> = ({ userId, onHabitAdded }) => {
  const [customHabit, setCustomHabit] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]);

  const quickHabits = [
    { 
      name: 'Used reusable water bottle', 
      icon: Recycle, 
      credits: 5, 
      category: 'waste-reduction',
      color: 'from-blue-400 to-cyan-400'
    },
    { 
      name: 'Cycled to work', 
      icon: Bike, 
      credits: 10, 
      category: 'transportation',
      color: 'from-green-400 to-emerald-400'
    },
    { 
      name: 'Bought organic food', 
      icon: Leaf, 
      credits: 8, 
      category: 'food',
      color: 'from-emerald-400 to-lime-400'
    },
    { 
      name: 'Used LED bulbs', 
      icon: Zap, 
      credits: 6, 
      category: 'energy',
      color: 'from-yellow-400 to-orange-400'
    },
    { 
      name: 'Composted food waste', 
      icon: Recycle, 
      credits: 7, 
      category: 'waste-reduction',
      color: 'from-amber-400 to-yellow-400'
    },
    { 
      name: 'Used public transport', 
      icon: Bike, 
      credits: 8, 
      category: 'transportation',
      color: 'from-purple-400 to-pink-400'
    }
  ];

  const handleQuickHabit = async (habit: any) => {
    if (recentlyAdded.includes(habit.name)) return;
    
    setIsLoading(true);
    try {
      const habitData = {
        name: habit.name,
        category: habit.category,
        greenCredits: habit.credits,
        date: new Date().toISOString()
      };

      await addHabit(userId, habitData);
      onHabitAdded(habitData);
      
      // Add to recently added with animation
      setRecentlyAdded(prev => [...prev, habit.name]);
      
      // Show success toast with credits animation
      toast.success(`+${habit.credits} Green Credits! 🌱`, {
        description: `Great job logging: ${habit.name}`,
        duration: 3000,
      });

      // Remove from recently added after 3 seconds
      setTimeout(() => {
        setRecentlyAdded(prev => prev.filter(name => name !== habit.name));
      }, 3000);

    } catch (error) {
      toast.error('Failed to log habit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomHabit = async () => {
    if (!customHabit.trim()) return;
    
    setIsLoading(true);
    try {
      const habitData = {
        name: customHabit,
        category: 'custom',
        greenCredits: 5,
        date: new Date().toISOString()
      };

      await addHabit(userId, habitData);
      onHabitAdded(habitData);
      
      toast.success('+5 Green Credits! 🌱', {
        description: `Great job logging: ${customHabit}`,
        duration: 3000,
      });

      setCustomHabit('');
    } catch (error) {
      toast.error('Failed to log habit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-emerald-500/30 shadow-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span>Log Your Green Habits</span>
        </CardTitle>
        <CardDescription className="text-gray-300">
          Track your eco-friendly actions and earn Green Credits instantly!
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Habit Buttons */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickHabits.map((habit, index) => {
              const Icon = habit.icon;
              const isRecentlyAdded = recentlyAdded.includes(habit.name);
              
              return (
                <motion.div
                  key={habit.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Button
                    onClick={() => handleQuickHabit(habit)}
                    disabled={isLoading || isRecentlyAdded}
                    className={`w-full h-auto p-4 bg-gradient-to-r ${habit.color} hover:scale-105 transition-all duration-300 text-white font-medium shadow-lg relative overflow-hidden`}
                    variant="outline"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5" />
                        <span className="text-sm">{habit.name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isRecentlyAdded ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center space-x-1"
                          >
                            <Check className="w-4 h-4" />
                            <span className="text-xs">Added!</span>
                          </motion.div>
                        ) : (
                          <Badge variant="secondary" className="bg-white/20 text-white">
                            +{habit.credits}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Success Animation Overlay */}
                    <AnimatePresence>
                      {isRecentlyAdded && (
                        <motion.div
                          className="absolute inset-0 bg-white/20 flex items-center justify-center"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <motion.div
                            animate={{
                              rotate: [0, 360],
                              scale: [1, 1.2, 1]
                            }}
                            transition={{ duration: 1, repeat: 2 }}
                          >
                            <Sparkles className="w-8 h-8 text-yellow-300" />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Custom Habit Input */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">Custom Habit</h3>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter your eco-friendly action..."
              value={customHabit}
              onChange={(e) => setCustomHabit(e.target.value)}
              className="bg-gray-700/50 border-emerald-500/30 text-white placeholder-gray-400 focus:border-emerald-400"
              onKeyPress={(e) => e.key === 'Enter' && handleCustomHabit()}
            />
            <Button
              onClick={handleCustomHabit}
              disabled={!customHabit.trim() || isLoading}
              className="bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-white px-6"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Today's Progress */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-lime-500/10 rounded-lg p-4 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-emerald-400">Today's Impact</h4>
              <p className="text-xs text-gray-400">Keep up the great work!</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-400">+{recentlyAdded.length * 5}</div>
              <div className="text-xs text-gray-400">Credits earned today</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HabitLogger;