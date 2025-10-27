import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Leaf, Car, Utensils, Zap, Trash2, Camera, Upload, X, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { addHabit } from '@/lib/firebase';
import { uploadHabitPhotoResumable, uploadHabitPhoto, compressImage } from '@/lib/storage';

interface HabitLoggerProps {
  userId: string;
  onHabitAdded: (habit: any) => void;
}

interface PhotoUpload {
  file: File;
  preview: string;
  compressed?: File;
  uploading?: boolean;
  uploaded?: boolean;
  url?: string;
  progress?: number;
}

const HabitLogger: React.FC<HabitLoggerProps> = ({ userId, onHabitAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [customCredits, setCustomCredits] = useState('');
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const categories = [
    { id: 'transportation', name: 'Transportation', icon: Car, color: 'bg-blue-500', credits: 10 },
    { id: 'energy', name: 'Energy', icon: Zap, color: 'bg-yellow-500', credits: 8 },
    { id: 'food', name: 'Food', icon: Utensils, color: 'bg-green-500', credits: 6 },
    { id: 'waste-reduction', name: 'Waste Reduction', icon: Trash2, color: 'bg-purple-500', credits: 7 },
    { id: 'nature', name: 'Nature Care', icon: Leaf, color: 'bg-emerald-500', credits: 9 }
  ];

  const predefinedHabits = {
    transportation: [
      'Cycled to work', 'Used public transport', 'Walked instead of driving', 'Carpooled with others', 'Used electric vehicle'
    ],
    energy: [
      'Used LED bulbs', 'Unplugged devices', 'Used solar power', 'Reduced AC usage', 'Air-dried clothes'
    ],
    food: [
      'Ate plant-based meal', 'Bought organic food', 'Reduced food waste', 'Grew own vegetables', 'Bought local produce'
    ],
    'waste-reduction': [
      'Used reusable water bottle', 'Recycled properly', 'Composted organic waste', 'Avoided single-use plastic', 'Repaired instead of buying new'
    ],
    nature: [
      'Planted a tree', 'Cleaned up litter', 'Used eco-friendly products', 'Conserved water', 'Participated in environmental activity'
    ]
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newPhotos: PhotoUpload[] = [];
    
    for (let i = 0; i < Math.min(files.length, 3 - photos.length); i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select only image files');
        continue;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB');
        continue;
      }

      const preview = URL.createObjectURL(file);
      
      try {
        // Compress image
        const compressed = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8
        });
        
        newPhotos.push({
          file,
          preview,
          compressed,
          uploading: false,
          uploaded: false
        });
      } catch (error) {
        console.error('Error compressing image:', error);
        newPhotos.push({
          file,
          preview,
          uploading: false,
          uploaded: false
        });
      }
    }

    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const uploadPromises = photos.map(async (photo, index) => {
      if (photo.uploaded && photo.url) return photo.url;
      
      setPhotos(prev => prev.map((p, i) => 
        i === index ? { ...p, uploading: true, progress: 0 } : p
      ));

      try {
        const fileToUpload = photo.compressed || photo.file;
        const url = await uploadHabitPhotoResumable(userId, fileToUpload, (progress) => {
          setPhotos(prev => prev.map((p, i) => 
            i === index ? { ...p, progress } : p
          ));
        });
        
        setPhotos(prev => prev.map((p, i) => 
          i === index ? { ...p, uploading: false, uploaded: true, url, progress: 100 } : p
        ));
        
        return url;
      } catch (error) {
        console.error('Error uploading photo:', error);
        setPhotos(prev => prev.map((p, i) => 
          i === index ? { ...p, uploading: false } : p
        ));
        throw error;
      }
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim() || !category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload photos first (non-blocking fail: proceed without photos on error)
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        toast.info('Uploading photos...', { duration: 2000 });
        try {
          photoUrls = await uploadPhotos();
        } catch (err) {
          toast.warning('Photo upload failed or timed out. Proceeding without photos.');
          // Clear uploading flags to stop spinners
          setPhotos(prev => prev.map(p => ({ ...p, uploading: false })));
          photoUrls = [];
        }
      }

      const selectedCategory = categories.find(cat => cat.id === category);
      const baseCredits = selectedCategory?.credits || 5;
      const finalCredits = customCredits ? parseInt(customCredits) : baseCredits;

      const habitData = {
        name: habitName,
        category,
        description: description || '',
        greenCredits: finalCredits,
        photos: photoUrls,
        hasPhotos: photoUrls.length > 0,
        timestamp: new Date(),
        verified: false, // Will be verified by AI later
        userId
      };

      await addHabit(userId, habitData);
      
      onHabitAdded({
        ...habitData,
        date: new Date()
      });

      // Success message with photo info
      const photoMessage = photoUrls.length > 0 
        ? ` with ${photoUrls.length} photo${photoUrls.length > 1 ? 's' : ''}`
        : '';
      
      toast.success(`Habit logged successfully${photoMessage}! 🌱`, {
        description: `+${finalCredits} Green Credits earned${photoUrls.length > 0 ? ' (pending photo verification)' : ''}`,
        duration: 4000,
      });

      // Reset form
      setHabitName('');
      setCategory('');
      setDescription('');
      setCustomCredits('');
      setPhotos([]);
      setIsOpen(false);

    } catch (error) {
      console.error('Error adding habit:', error);
      toast.error('Failed to log habit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.id === category);

  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-emerald-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Leaf className="w-5 h-5 text-emerald-400" />
          <span>Log Your Green Habits</span>
        </CardTitle>
        <CardDescription className="text-gray-300">
          Track your eco-friendly activities and earn Green Credits. Add photos for verification!
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <AnimatePresence>
          {!isOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                onClick={() => setIsOpen(true)}
                className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Habit
              </Button>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-white">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem key={cat.id} value={cat.id} className="text-white hover:bg-gray-600">
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4" />
                            <span>{cat.name}</span>
                            <Badge variant="secondary" className="ml-auto">
                              {cat.credits} credits
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Select Habits */}
              {category && predefinedHabits[category as keyof typeof predefinedHabits] && (
                <div className="space-y-2">
                  <Label className="text-white">Quick Select</Label>
                  <div className="flex flex-wrap gap-2">
                    {predefinedHabits[category as keyof typeof predefinedHabits].map((habit, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setHabitName(habit)}
                        className="text-xs bg-gray-700 border-gray-600 text-gray-300 hover:bg-emerald-600 hover:text-white"
                      >
                        {habit}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Habit Name */}
              <div className="space-y-2">
                <Label htmlFor="habitName" className="text-white">Habit Name *</Label>
                <Input
                  id="habitName"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  placeholder="e.g., Used reusable water bottle"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details about your eco-friendly activity..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[80px]"
                />
              </div>

              {/* Photo Upload Section */}
              <div className="space-y-3">
                <Label className="text-white flex items-center space-x-2">
                  <Camera className="w-4 h-4" />
                  <span>Add Photos (Optional)</span>
                  <Badge variant="secondary" className="text-xs">
                    Verify for bonus credits
                  </Badge>
                </Label>
                
                {/* Upload Area */}
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                    dragActive 
                      ? 'border-emerald-400 bg-emerald-500/10' 
                      : 'border-gray-600 hover:border-emerald-500'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={photos.length >= 3}
                  />
                  
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-300 mb-1">
                      {photos.length >= 3 
                        ? 'Maximum 3 photos allowed'
                        : 'Drop photos here or click to upload'
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG up to 10MB • Max 3 photos
                    </p>
                  </div>
                </div>

                {/* Photo Previews */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-700">
                          <img
                            src={photo.preview}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Upload Status Overlay */}
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          {photo.uploading && (
                            <motion.div
                              className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                          )}
                          {photo.uploaded && (
                            <Check className="w-6 h-6 text-green-400" />
                          )}
                          {!photo.uploading && !photo.uploaded && (
                            <AlertCircle className="w-6 h-6 text-yellow-400" />
                          )}
                        </div>

                        {/* Remove Button */}
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Credits */}
              <div className="space-y-2">
                <Label htmlFor="customCredits" className="text-white">
                  Custom Credits (Optional)
                </Label>
                <Input
                  id="customCredits"
                  type="number"
                  value={customCredits}
                  onChange={(e) => setCustomCredits(e.target.value)}
                  placeholder={selectedCategory ? `Default: ${selectedCategory.credits}` : '5'}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  min="1"
                  max="50"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-white font-semibold"
                >
                  {isSubmitting ? (
                    <motion.div
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {isSubmitting ? 'Logging...' : 'Log Habit'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setHabitName('');
                    setCategory('');
                    setDescription('');
                    setCustomCredits('');
                    setPhotos([]);
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default HabitLogger;