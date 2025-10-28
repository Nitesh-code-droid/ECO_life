import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Check, AlertCircle, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage } from '@/lib/storage';
import { updateProfilePhoto } from '@/lib/firebase';
import { detectFace } from '@/lib/faceVerification';

interface ProfilePhotoUploadProps {
  userId: string;
  currentPhotoURL?: string | null;
  onPhotoUploaded: (photoURL: string) => void;
  onSkip?: () => void;
  required?: boolean;
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  userId,
  currentPhotoURL,
  onPhotoUploaded,
  onSkip,
  required = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentPhotoURL || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [faceDetected, setFaceDetected] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setSelectedFile(file);
    setFaceDetected(null);

    // Verify face in photo
    setIsVerifying(true);
    try {
      const result = await detectFace(file);
      if (result.success && result.face_detected) {
        setFaceDetected(true);
        const conf = typeof result.confidence === 'number' ? result.confidence : 0.95;
        toast.success('Face detected! ✅', {
          description: `Confidence: ${(conf * 100).toFixed(0)}%`
        });
      } else {
        setFaceDetected(false);
        toast.error('No face detected in photo', {
          description: 'Please take a clear photo of your face'
        });
      }
    } catch (error) {
      console.error('Face detection error:', error);
      // Allow upload even if face detection fails (API might be down)
      setFaceDetected(null);
      toast.warning('Could not verify face, but you can still upload');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a photo first');
      return;
    }

    if (faceDetected === false) {
      toast.error('Please upload a photo with a clear face');
      return;
    }

    setIsUploading(true);
    try {
      // Compress image and convert to base64
      const compressed = await compressImage(selectedFile, { maxWidth: 800, maxHeight: 800, quality: 0.8 });
      
      // Convert to base64 string (no Firebase Storage needed!)
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressed);
      });
      
      const photoBase64 = await base64Promise;

      // Update user profile with base64 string
      await updateProfilePhoto(userId, photoBase64);

      toast.success('Profile photo uploaded! 🎉', {
        description: 'Your photo will be used for habit verification'
      });

      onPhotoUploaded(photoBase64);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo', {
        description: 'Please try again'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-6 h-6" />
          Upload Profile Photo
        </CardTitle>
        <CardDescription>
          {required 
            ? 'Upload a clear photo of your face for habit verification'
            : 'Optional: Upload a photo to enable face-verified habits and earn bonus credits'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview Area */}
        <div
          className="relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Profile preview"
                className="max-w-full max-h-64 mx-auto rounded-lg"
              />
              {isVerifying && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
              {faceDetected === true && (
                <div className="absolute top-2 right-2 bg-green-500 text-white p-2 rounded-full">
                  <Check className="w-5 h-5" />
                </div>
              )}
              {faceDetected === false && (
                <div className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full">
                  <X className="w-5 h-5" />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, or JPEG (max 5MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Face Detection Status */}
        <AnimatePresence>
          {faceDetected === true && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Face detected successfully!
              </span>
            </motion.div>
          )}
          {faceDetected === false && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">
                No face detected. Please upload a clear photo of your face.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Tips for best results:
          </h4>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• Use good lighting (natural light is best)</li>
            <li>• Face the camera directly</li>
            <li>• Remove sunglasses or face coverings</li>
            <li>• Ensure your face is clearly visible</li>
            <li>• Use a recent photo</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || isVerifying || faceDetected === false}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </>
            )}
          </Button>
          {onSkip && !required && (
            <Button
              variant="outline"
              onClick={onSkip}
              disabled={isUploading}
            >
              Skip for now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfilePhotoUpload;
