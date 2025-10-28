import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { storage } from './firebase';

// Initialize Firebase Storage
const storageInstance = storage;

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

// Compress image before upload
export const compressImage = (file: File, options: CompressOptions = {}): Promise<File> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.8
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Resumable upload with progress callback
export const uploadHabitPhotoResumable = async (
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const fileExtension = file.name.split('.').pop();
      const fileName = `habit_${timestamp}_${randomId}.${fileExtension}`;

      const storageRef = ref(storageInstance, `habits/${userId}/${fileName}`);
      const task = uploadBytesResumable(storageRef, file);

      let timeoutId: any = setTimeout(() => {
        try { task.cancel(); } catch {}
        reject(new Error('Upload timed out'));
      }, 120000);

      task.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(Number(progress.toFixed(0)));
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        async () => {
          clearTimeout(timeoutId);
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            resolve(url);
          } catch (e) {
            reject(e);
          }
        }
      );
    } catch (e) {
      reject(e);
    }
  });
};

// Upload habit photo to Firebase Storage
export const uploadHabitPhoto = async (userId: string, file: File, folder: string = 'habits'): Promise<string> => {
  try {
    const withTimeout = async <T>(p: Promise<T>, ms: number, label: string): Promise<T> => {
      let t: any;
      const timeout = new Promise<never>((_, reject) => {
        t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      });
      try {
        // race original promise with timeout
        const result = await Promise.race([p, timeout]);
        clearTimeout(t);
        return result as T;
      } catch (e) {
        clearTimeout(t);
        throw e;
      }
    };

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${folder === 'profile-photos' ? 'profile' : 'habit'}_${timestamp}_${randomId}.${fileExtension}`;
    
    // Create storage reference
    const storageRef = ref(storageInstance, `${folder}/${userId}/${fileName}`);
    
    // Upload file
    const snapshot = await withTimeout(uploadBytes(storageRef, file), 30000, 'Upload');
    
    // Get download URL
    const downloadURL = await withTimeout(getDownloadURL(snapshot.ref), 20000, 'GetDownloadURL');
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw new Error('Failed to upload photo. Please try again.');
  }
};

// Upload profile photo
export const uploadProfilePhoto = async (userId: string, file: File): Promise<string> => {
  try {
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `profile_${timestamp}.${fileExtension}`;
    
    const storageRef = ref(storage, `profiles/${userId}/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw new Error('Failed to upload profile photo. Please try again.');
  }
};

// Delete file from storage
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const storageRef = ref(storage, filePath);
    // Note: deleteObject is not available in the current Firebase version
    // This is a placeholder for future implementation
    console.log('Delete file:', filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file.');
  }
};

// Validate image file
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select an image file' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'Image size should be less than 10MB' };
  }

  // Check supported formats
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supportedFormats.includes(file.type)) {
    return { valid: false, error: 'Supported formats: JPEG, PNG, WebP' };
  }

  return { valid: true };
};

// Get file size in human readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate thumbnail from image file
export const generateThumbnail = (file: File, maxSize: number = 200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const { width, height } = img;
      const aspectRatio = width / height;
      
      let newWidth, newHeight;
      if (width > height) {
        newWidth = Math.min(maxSize, width);
        newHeight = newWidth / aspectRatio;
      } else {
        newHeight = Math.min(maxSize, height);
        newWidth = newHeight * aspectRatio;
      }

      canvas.width = newWidth;
      canvas.height = newHeight;

      ctx?.drawImage(img, 0, 0, newWidth, newHeight);
      
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(thumbnailDataUrl);
    };

    img.onerror = () => reject(new Error('Failed to generate thumbnail'));
    img.src = URL.createObjectURL(file);
  });
};