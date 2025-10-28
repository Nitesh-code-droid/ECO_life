import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Leaf, AlertTriangle, Lightbulb, Sparkles } from 'lucide-react';
import { getCarbonFootprint } from '@/lib/firebase';
import { toast } from 'sonner';

interface CarbonAnalyzerProps {
  onProductAnalyzed: (product: any) => void;
}

const CarbonAnalyzer: React.FC<CarbonAnalyzerProps> = ({ onProductAnalyzed }) => {
  const [productName, setProductName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const analyzeProduct = async () => {
    if (!productName.trim()) return;
    
    setIsLoading(true);
    setResult(null);
    setShowAlternatives(false);

    try {
      const carbonData = await getCarbonFootprint(productName);
      setResult({ ...carbonData, productName });
      onProductAnalyzed({ ...carbonData, productName });

      // Show appropriate toast based on eco-friendliness
      if (carbonData.isEcoFriendly) {
        toast.success('🌱 Great choice! This is eco-friendly!', {
          description: `Low carbon footprint: ${carbonData.carbonFootprint}kg CO₂`,
          duration: 4000,
        });
      } else {
        toast.warning('⚠️ High carbon footprint detected', {
          description: `Consider alternatives: ${carbonData.carbonFootprint}kg CO₂`,
          duration: 4000,
        });
      }
    } catch (error) {
      toast.error('Failed to analyze product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickSearchItems = [
    'Apple', 'Beef', 'Electric car', 'Solar panel', 
    'Banana', 'Fast fashion', 'LED bulb', 'Coffee'
  ];

  const getCarbonLevel = (footprint: number) => {
    if (footprint < 0) return { level: 'negative', color: 'from-purple-400 to-pink-400', label: 'Carbon Negative!' };
    if (footprint < 1) return { level: 'low', color: 'from-green-400 to-emerald-400', label: 'Low Impact' };
    if (footprint < 5) return { level: 'medium', color: 'from-yellow-400 to-orange-400', label: 'Medium Impact' };
    return { level: 'high', color: 'from-red-400 to-pink-400', label: 'High Impact' };
  };

  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-emerald-500/30 shadow-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Search className="w-5 h-5 text-emerald-400" />
          <span>Carbon Footprint Analyzer</span>
        </CardTitle>
        <CardDescription className="text-gray-300">
          Scan or search products to discover their environmental impact
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="space-y-3">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter product name (e.g., 'apple', 'electric car')..."
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="bg-gray-700/50 border-emerald-500/30 text-white placeholder-gray-400 focus:border-emerald-400"
              onKeyPress={(e) => e.key === 'Enter' && analyzeProduct()}
            />
            <Button
              onClick={analyzeProduct}
              disabled={!productName.trim() || isLoading}
              className="bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-white px-6"
            >
              {isLoading ? (
                <motion.div
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Quick Search Buttons */}
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Quick search:</p>
            <div className="flex flex-wrap gap-2">
              {quickSearchItems.map((item) => (
                <Button
                  key={item}
                  variant="outline"
                  size="sm"
                  onClick={() => setProductName(item)}
                  className="text-xs bg-gray-700/30 border-gray-600 text-gray-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-300"
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Analysis Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              {/* Main Result Card */}
              <div className={`bg-gradient-to-r ${getCarbonLevel(result.carbonFootprint).color} rounded-lg p-6 text-white relative overflow-hidden`}>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold capitalize">{result.productName}</h3>
                    <Badge 
                      variant="secondary" 
                      className="bg-white/20 text-white border-white/30"
                    >
                      {getCarbonLevel(result.carbonFootprint).label}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm opacity-90">Carbon Footprint</p>
                      <p className="text-2xl font-bold">
                        {result.carbonFootprint > 0 ? '+' : ''}{result.carbonFootprint} kg CO₂
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {result.isEcoFriendly ? (
                          <>
                            <Leaf className="w-6 h-6" />
                            <span className="font-medium">Eco-Friendly!</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-6 h-6" />
                            <span className="font-medium">Consider Alternatives</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-20 h-20 border border-white rounded-full"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.1, 0.3]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.5
                      }}
                      style={{
                        left: `${20 + (i * 15)}%`,
                        top: `${10 + (i % 2) * 60}%`
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Alternatives Section */}
              {result.alternatives && result.alternatives.length > 0 && (
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                  <Button
                    onClick={() => setShowAlternatives(!showAlternatives)}
                    variant="ghost"
                    className="w-full text-left text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 p-0 h-auto font-medium"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <Lightbulb className="w-4 h-4" />
                        <span>Greener Alternatives</span>
                      </div>
                      <motion.div
                        animate={{ rotate: showAlternatives ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        ▼
                      </motion.div>
                    </div>
                  </Button>

                  <AnimatePresence>
                    {showAlternatives && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-3 space-y-2"
                      >
                        {result.alternatives.map((alternative: string, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center space-x-2 text-sm text-gray-300"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span className="capitalize">{alternative}</span>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Impact Visualization */}
              <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Environmental Impact</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Carbon Footprint</span>
                    <span className="text-white">{Math.abs(result.carbonFootprint)} kg CO₂</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full bg-gradient-to-r ${getCarbonLevel(result.carbonFootprint).color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((Math.abs(result.carbonFootprint) / 30) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {result.carbonFootprint < 0 
                      ? "This product actually removes CO₂ from the atmosphere! 🌱"
                      : result.carbonFootprint < 1
                      ? "Low impact choice - great for the environment! 🌿"
                      : result.carbonFootprint < 5
                      ? "Moderate impact - consider alternatives when possible 🌱"
                      : "High impact - try to find more sustainable alternatives 🌍"
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default CarbonAnalyzer;