import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Target, Gift, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logOut } from '@/lib/firebase';

interface TubelightNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: any;
}

const TubelightNavbar: React.FC<TubelightNavbarProps> = ({ activeTab, onTabChange, user }) => {
  const [isGlowing, setIsGlowing] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'habits', label: 'Habits', icon: Target },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-emerald-500/30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            onHoverStart={() => setIsGlowing(true)}
            onHoverEnd={() => setIsGlowing(false)}
          >
            <div className="relative">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 ${isGlowing ? 'animate-pulse shadow-lg shadow-emerald-400/50' : ''}`} />
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400"
                animate={{
                  boxShadow: isGlowing 
                    ? ['0 0 20px rgba(16, 185, 129, 0.5)', '0 0 40px rgba(16, 185, 129, 0.8)', '0 0 20px rgba(16, 185, 129, 0.5)']
                    : '0 0 0px rgba(16, 185, 129, 0)'
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
              EcoLife
            </span>
          </motion.div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive 
                      ? 'text-emerald-400' 
                      : 'text-gray-300 hover:text-emerald-300'
                  }`}
                  onClick={() => onTabChange(item.id)}
                >
                  <div className="flex items-center space-x-2">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-300">
                <img 
                  src={user.photoURL || '/default-avatar.png'} 
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-emerald-400/50"
                />
                <span>{user.displayName}</span>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="!bg-transparent !hover:bg-transparent border-emerald-400 text-emerald-400 hover:border-emerald-300 hover:text-emerald-300 transition-all duration-300"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex justify-around py-2 border-t border-emerald-500/30">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg ${
                  isActive ? 'text-emerald-400' : 'text-gray-400'
                }`}
                onClick={() => onTabChange(item.id)}
              >
                <Icon size={20} />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default TubelightNavbar;