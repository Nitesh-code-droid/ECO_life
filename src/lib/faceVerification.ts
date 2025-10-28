// Face Verification Service
// Integrates with Python Face Verification API

const FACE_API_URL = import.meta.env.VITE_FACE_VERIFICATION_API_URL || 'http://localhost:5000';

export interface FaceVerificationResult {
  success: boolean;
  verified?: boolean;
  similarity_score?: number;
  confidence?: {
    profile_photo: number;
    habit_photo: number;
  } | number | string;
  face_detected?: boolean;
  message?: string;
  error?: string;
}

export interface ActivityVerificationResult {
  success: boolean;
  verified?: boolean;
  similarity_score?: number;
  confidence?: string;
  threshold?: number;
  message?: string;
  error?: string;
}

/**
 * Convert image file to base64 string
 */
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Compress image before sending to API
 */
export const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
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

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Verify if habit photo matches profile photo
 */
export const verifyFace = async (
  profilePhoto: string | File,
  habitPhoto: string | File,
  threshold = 0.5
): Promise<FaceVerificationResult> => {
  try {
    // Convert files to base64 if needed
    const profileBase64 = typeof profilePhoto === 'string' 
      ? profilePhoto 
      : await compressImage(profilePhoto);
    
    const habitBase64 = typeof habitPhoto === 'string' 
      ? habitPhoto 
      : await compressImage(habitPhoto);

    const response = await fetch(`${FACE_API_URL}/verify-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile_photo: profileBase64,
        habit_photo: habitBase64,
        threshold,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Face verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify face',
    };
  }
};

/**
 * Detect if a photo contains a face (for validation)
 */
export const detectFace = async (photo: string | File): Promise<FaceVerificationResult> => {
  try {
    const photoBase64 = typeof photo === 'string' 
      ? photo 
      : await compressImage(photo);

    const response = await fetch(`${FACE_API_URL}/detect-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: photoBase64,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Face detection error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to detect face',
    };
  }
};

/**
 * Verify if an image matches an activity description using CLIP
 */
export const verifyActivity = async (
  photo: string | File,
  activityDescription: string,
  threshold: number = 0.25
): Promise<ActivityVerificationResult> => {
  try {
    const photoBase64 = typeof photo === 'string' 
      ? photo 
      : await compressImage(photo);

    const response = await fetch(`${FACE_API_URL}/verify-activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: photoBase64,
        activity: activityDescription,
        threshold,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Activity verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify activity',
    };
  }
};

/**
 * Check if Face Verification API is available
 */
export const checkFaceAPIHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${FACE_API_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('Face API health check failed:', error);
    return false;
  }
};
