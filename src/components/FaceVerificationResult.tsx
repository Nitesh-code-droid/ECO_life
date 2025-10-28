import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, AlertCircle, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface FaceVerificationResultProps {
  verified: boolean;
  similarity_score: number;
  bonusCredits?: number;
  activityVerified?: boolean;
  activityScore?: number;
}

const FaceVerificationResult: React.FC<FaceVerificationResultProps> = ({
  verified,
  similarity_score,
  bonusCredits = 5,
  activityVerified = false,
  activityScore = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
    >
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          {verified ? (
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center"
              >
                <Check className="w-12 h-12 text-white" />
              </motion.div>
              
              <div>
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                  Face Verified! ✅
                </h3>
                <p className="text-muted-foreground">
                  Your identity has been confirmed
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-green-700 dark:text-green-300">
                    Bonus Reward!
                  </span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  +{bonusCredits} extra green credits for verified habit
                </p>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>Face Match: {(similarity_score * 100).toFixed(1)}%</p>
                {activityVerified && (
                  <p className="text-green-600 dark:text-green-400 font-semibold">
                    ✓ Activity Match: {(activityScore * 100).toFixed(1)}%
                  </p>
                )}
                {!activityVerified && activityScore > 0 && (
                  <p className="text-yellow-600 dark:text-yellow-400">
                    Activity Match: {(activityScore * 100).toFixed(1)}% (not verified)
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="mx-auto w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center"
              >
                <AlertCircle className="w-12 h-12 text-white" />
              </motion.div>
              
              <div>
                <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                  Face Not Verified
                </h3>
                <p className="text-muted-foreground">
                  The photo doesn't match your profile
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Your habit was still logged, but no bonus credits were awarded.
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Similarity Score: {(similarity_score * 100).toFixed(1)}%</p>
                <p className="mt-1 text-xs">
                  Tip: Make sure your face is clearly visible and well-lit
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FaceVerificationResult;
