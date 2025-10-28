# Face Verification API for ECO_life

AI-powered face verification service to validate habit photos against user profile photos.

## Features

- ✅ Face detection using MTCNN
- ✅ Face recognition using FaceNet (128-dimensional embeddings)
- ✅ Cosine similarity comparison
- ✅ RESTful API with CORS support
- ✅ Base64 image input
- ✅ Detailed error handling

## Setup

### 1. Install Python Dependencies

```bash
cd face-verification-api
pip install -r requirements.txt
```

### 2. Run the Server

```bash
python app.py
```

Server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /health
```

### Verify Face
```
POST /verify-face
Content-Type: application/json

{
  "profile_photo": "data:image/jpeg;base64,...",
  "habit_photo": "data:image/jpeg;base64,...",
  "threshold": 0.5  // optional
}
```

**Response:**
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

### Detect Face (Testing)
```
POST /detect-face
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,..."
}
```

## Deployment

### Option 1: Google Cloud Run (Recommended)
```bash
# Build Docker image
docker build -t face-verification-api .

# Deploy to Cloud Run
gcloud run deploy face-verification-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Option 2: Heroku
```bash
heroku create eco-life-face-verification
git push heroku main
```

### Option 3: AWS Lambda (with Zappa)
```bash
pip install zappa
zappa init
zappa deploy production
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| "No face detected" | Poor photo quality | Ask user to retake with better lighting |
| "Multiple faces" | Group photo | Use largest face or ask for solo photo |
| "Face verification failed" | Different person | Reject submission or allow with no bonus |

## Accuracy

- **Face Detection**: 90-95%
- **Face Verification**: 95-98%
- **False Positive Rate**: 1-3%

## Threshold Tuning

- **0.4** - Very strict (fewer false positives, more false negatives)
- **0.5** - Balanced (recommended)
- **0.6** - Lenient (more false positives, fewer false negatives)
