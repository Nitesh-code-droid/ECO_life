# 🎯 Face Verification Integration Guide

Complete integration of AI-powered face verification for ECO_life habit tracking.

## 📋 Overview

This system verifies that habit photos match the user's profile photo, awarding bonus credits for verified activities.

### Flow:
1. **User signs up** → Upload profile photo (one-time)
2. **User logs habit** → Upload habit photo
3. **AI verifies** → Compare faces using FaceNet
4. **Award bonus** → +5 extra credits if verified ✅

---

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   React     │─────▶│  Python API  │─────▶│  Face Models    │
│  Frontend   │      │  (Flask)     │      │  MTCNN+FaceNet  │
└─────────────┘      └──────────────┘      └─────────────────┘
       │                     │                       │
       ▼                     ▼                       ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  Firebase   │      │   Firebase   │      │   128-dim       │
│  Storage    │      │  Firestore   │      │   Embeddings    │
└─────────────┘      └──────────────┘      └─────────────────┘
```

---

## 🚀 Setup Instructions

### Step 1: Install Python API

```bash
cd face-verification-api
pip install -r requirements.txt
python app.py
```

Server runs on `http://localhost:5000`

### Step 2: Configure Environment

Create `.env` file:
```env
VITE_FACE_VERIFICATION_API_URL=http://localhost:5000
```

For production:
```env
VITE_FACE_VERIFICATION_API_URL=https://your-api.com
```

### Step 3: Test API

```bash
curl http://localhost:5000/health
# Should return: {"status": "healthy"}
```

---

## 📱 User Experience

### First Time Setup (Profile Photo)

1. User logs in for the first time
2. **ProfilePhotoUpload** component appears
3. User uploads a clear face photo
4. AI detects face (shows ✅ or ❌)
5. Photo saved to Firebase Storage
6. `profilePhotoURL` saved in Firestore

### Logging a Habit with Photo

1. User clicks "Log Habit"
2. Fills in habit details
3. Uploads photo showing them doing the activity
4. **Submits habit**
5. Frontend sends both photos to Python API
6. API compares faces (takes ~2-3 seconds)
7. **FaceVerificationResult** modal appears:
   - ✅ **Verified**: "Face Verified! +5 bonus credits"
   - ❌ **Not Verified**: "Face not verified, no bonus"
8. Habit is logged regardless of verification

---

## 🎨 Components Created

### 1. `ProfilePhotoUpload.tsx`
- Upload profile photo
- Real-time face detection
- Shows confidence score
- Drag & drop support

### 2. `FaceVerificationResult.tsx`
- Beautiful verification result modal
- Shows similarity score
- Bonus credits animation
- Auto-closes after 5 seconds

### 3. `faceVerification.ts`
- API integration functions
- Image compression
- Base64 conversion
- Error handling

---

## 🔧 API Endpoints

### Health Check
```http
GET /health
```

### Detect Face (Testing)
```http
POST /detect-face
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "face_detected": true,
  "confidence": 0.99
}
```

### Verify Face (Main)
```http
POST /verify-face
Content-Type: application/json

{
  "profile_photo": "data:image/jpeg;base64,...",
  "habit_photo": "data:image/jpeg;base64,...",
  "threshold": 0.5
}
```

**Response (Verified):**
```json
{
  "success": true,
  "verified": true,
  "similarity_score": 0.87,
  "confidence": {
    "profile_photo": 0.99,
    "habit_photo": 0.98
  },
  "message": "Face verified successfully!"
}
```

**Response (Not Verified):**
```json
{
  "success": true,
  "verified": false,
  "similarity_score": 0.32,
  "message": "Face verification failed"
}
```

---

## ⚙️ Configuration

### Threshold Tuning

| Threshold | Behavior | Use Case |
|-----------|----------|----------|
| **0.3** | Very strict | High security, more false negatives |
| **0.4** | Strict | Balanced security |
| **0.5** | **Default** | Recommended for most cases |
| **0.6** | Lenient | Fewer false negatives |
| **0.7** | Very lenient | More false positives |

### Bonus Credits

Edit in `HabitLogger.tsx`:
```typescript
const FACE_VERIFICATION_BONUS = 5; // Extra credits for verified habits
```

---

## 📊 Expected Accuracy

| Metric | Rate |
|--------|------|
| **Face Detection Success** | 90-95% |
| **True Positive (Correct Match)** | 95-98% |
| **False Positive (Wrong Match)** | 1-3% |
| **False Negative (Reject Correct)** | 2-5% |

---

## 🐛 Error Handling

### Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| "No face detected" | Poor lighting/angle | Ask user to retake |
| "API timeout" | Slow connection | Retry with smaller image |
| "Face verification failed" | Different person | No bonus, habit still logged |
| "API unavailable" | Server down | Graceful fallback, no verification |

### Fallback Behavior

If API is unavailable:
- Habit is still logged ✅
- No bonus credits awarded
- User sees: "Verification unavailable, habit logged normally"

---

## 🚢 Deployment Options

### Option 1: Google Cloud Run (Recommended)

```bash
# Build and deploy
gcloud run deploy face-verification-api \
  --source ./face-verification-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --timeout 60s
```

**Cost**: ~$5-10/month for 1000 verifications

### Option 2: Heroku

```bash
cd face-verification-api
heroku create eco-life-face-api
git push heroku main
```

**Cost**: Free tier available, then $7/month

### Option 3: AWS Lambda + API Gateway

Use Zappa for serverless deployment:
```bash
pip install zappa
zappa init
zappa deploy production
```

**Cost**: Pay per request, very cheap for low traffic

---

## 🔒 Security Considerations

1. **API Authentication**: Add API keys for production
2. **Rate Limiting**: Prevent abuse (max 10 requests/minute per user)
3. **Image Size Limits**: Max 5MB per image
4. **HTTPS Only**: Never send images over HTTP
5. **Privacy**: Profile photos stored securely in Firebase Storage

---

## 📈 Performance Optimization

1. **Image Compression**: Resize to 800x800px before upload
2. **Caching**: Cache face embeddings to avoid recomputation
3. **CDN**: Use Firebase CDN for fast image delivery
4. **Lazy Loading**: Load face verification only when needed

---

## 🧪 Testing

### Test Profile Photo Upload
1. Go to Dashboard
2. Click "Upload Profile Photo"
3. Upload a clear face photo
4. Verify face detection works

### Test Habit Verification
1. Log a habit with your photo
2. Verify you get bonus credits
3. Log a habit with someone else's photo
4. Verify no bonus credits

### Test API Directly
```bash
# Test face detection
curl -X POST http://localhost:5000/detect-face \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,..."}'
```

---

## 📝 Database Schema

### Firestore `users` collection:
```javascript
{
  uid: "user123",
  email: "user@example.com",
  displayName: "John Doe",
  photoURL: "https://...",  // Google profile pic
  profilePhotoURL: "https://...",  // Face verification photo
  profilePhotoUploaded: true,
  profilePhotoUpdatedAt: Timestamp,
  greenCredits: 150,
  // ... other fields
}
```

### Firestore `habits` collection:
```javascript
{
  userId: "user123",
  habitName: "Cycled to work",
  category: "transportation",
  photos: ["https://..."],
  faceVerified: true,  // NEW: Was face verified?
  faceVerificationScore: 0.87,  // NEW: Similarity score
  bonusCreditsAwarded: 5,  // NEW: Extra credits
  greenCredits: 15,  // 10 base + 5 bonus
  timestamp: Timestamp
}
```

---

## 🎓 How It Works (Technical)

### 1. Face Detection (MTCNN)
- Detects faces in images
- Returns bounding box coordinates
- Confidence score (0-1)

### 2. Face Recognition (FaceNet)
- Converts face to 128-dimensional vector
- Each person has a unique "face fingerprint"
- Trained on millions of faces

### 3. Similarity Comparison
- Uses cosine similarity between vectors
- Distance < threshold = same person
- Distance ≥ threshold = different person

### Math:
```
similarity = 1 - cosine_distance(embedding1, embedding2)
verified = similarity > threshold
```

---

## 🔮 Future Enhancements

1. **Liveness Detection**: Prevent photo spoofing
2. **Multi-face Support**: Group activities
3. **Age Verification**: Ensure user is same age
4. **Emotion Detection**: Detect happiness in eco-activities
5. **Activity Recognition**: Verify activity type (cycling, recycling, etc.)

---

## 📞 Support

If face verification isn't working:
1. Check API is running: `curl http://localhost:5000/health`
2. Check browser console for errors
3. Verify profile photo is uploaded
4. Try with better lighting/angle
5. Lower threshold to 0.6 for more lenient matching

---

## ✅ Integration Checklist

- [ ] Python API installed and running
- [ ] Environment variables configured
- [ ] Profile photo upload component added
- [ ] Habit logger updated with verification
- [ ] Firebase Storage rules updated
- [ ] Firestore security rules updated
- [ ] Tested with real photos
- [ ] API deployed to production
- [ ] Frontend environment updated with production URL
- [ ] Monitoring and logging configured

---

**🎉 You're all set! Users can now earn bonus credits for verified eco-activities!**
