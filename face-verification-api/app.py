"""
Face Verification API for ECO_life
Verifies if a habit photo matches the user's profile photo
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from mtcnn import MTCNN
from keras_facenet import FaceNet
import cv2
import numpy as np
from scipy.spatial.distance import cosine
import base64
import io
from PIL import Image
import torch
import clip

app = Flask(__name__)
CORS(app)  # Allow requests from React frontend

# Initialize models (load once at startup)
face_detector = MTCNN()
face_embedder = FaceNet()

# Initialize CLIP model for activity verification
device = "cuda" if torch.cuda.is_available() else "cpu"
clip_model, clip_preprocess = clip.load("ViT-B/32", device=device)
print(f"✅ CLIP model loaded on {device}")

def decode_base64_image(base64_string):
    """Convert base64 string to numpy array"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        return np.array(image.convert('RGB'))
    except Exception as e:
        raise ValueError(f"Invalid image data: {str(e)}")

def detect_and_crop_face(image, margin=0.2):
    """Detect face and return cropped, resized face"""
    detections = face_detector.detect_faces(image)
    
    if not detections:
        return None, "No face detected in image"
    
    if len(detections) > 1:
        # If multiple faces, use the largest one
        detections.sort(key=lambda x: x['box'][2] * x['box'][3], reverse=True)
    
    x, y, width, height = detections[0]['box']
    confidence = detections[0]['confidence']
    
    # Add margin around face
    x_min = max(x - int(margin * width), 0)
    y_min = max(y - int(margin * height), 0)
    x_max = min(x + width + int(margin * width), image.shape[1])
    y_max = min(y + height + int(margin * height), image.shape[0])
    
    # Crop and resize
    face = image[y_min:y_max, x_min:x_max]
    face_resized = cv2.resize(face, (160, 160))
    
    return face_resized, confidence

def get_face_embedding(face_image):
    """Generate 128-dimensional embedding for face"""
    embedding = face_embedder.embeddings([face_image])[0]
    return embedding

def compare_faces(embedding1, embedding2, threshold=0.5):
    """Compare two face embeddings using cosine similarity"""
    distance = cosine(embedding1, embedding2)
    is_same_person = distance < threshold
    similarity_score = 1 - distance  # Convert distance to similarity (0-1)
    
    return {
        'is_match': bool(is_same_person),
        'similarity_score': float(similarity_score),
        'distance': float(distance),
        'threshold': threshold
    }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Face verification API is running'})

@app.route('/verify-face', methods=['POST'])
def verify_face():
    """
    Verify if habit photo matches profile photo
    
    Request body:
    {
        "profile_photo": "base64_encoded_image",
        "habit_photo": "base64_encoded_image",
        "threshold": 0.5  // optional, default 0.5
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'profile_photo' not in data or 'habit_photo' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing profile_photo or habit_photo in request'
            }), 400
        
        threshold = data.get('threshold', 0.5)
        
        # Decode images
        profile_img = decode_base64_image(data['profile_photo'])
        habit_img = decode_base64_image(data['habit_photo'])
        
        # Detect and crop faces
        profile_face, profile_conf = detect_and_crop_face(profile_img)
        if profile_face is None:
            return jsonify({
                'success': False,
                'error': 'No face detected in profile photo',
                'details': profile_conf
            }), 400
        
        habit_face, habit_conf = detect_and_crop_face(habit_img)
        if habit_face is None:
            return jsonify({
                'success': False,
                'error': 'No face detected in habit photo',
                'details': habit_conf
            }), 400
        
        # Generate embeddings
        profile_embedding = get_face_embedding(profile_face)
        habit_embedding = get_face_embedding(habit_face)
        
        # Compare faces
        result = compare_faces(profile_embedding, habit_embedding, threshold)
        
        return jsonify({
            'success': True,
            'verified': result['is_match'],
            'similarity_score': result['similarity_score'],
            'confidence': {
                'profile_photo': float(profile_conf),
                'habit_photo': float(habit_conf)
            },
            'message': 'Face verified successfully!' if result['is_match'] else 'Face verification failed - photos do not match'
        })
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/detect-face', methods=['POST'])
def detect_face():
    """
    Simple face detection endpoint (for testing)
    Returns face detection results without comparison
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing image in request'
            }), 400
        
        # Decode image
        img = decode_base64_image(data['image'])
        
        # Detect face
        face, confidence = detect_and_crop_face(img)
        
        if face is None:
            return jsonify({
                'success': False,
                'error': confidence  # Error message
            })
        
        return jsonify({
            'success': True,
            'face_detected': True,
            'confidence': float(confidence),
            'message': 'Face detected successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/verify-activity', methods=['POST'])
def verify_activity():
    """
    Verify if the image matches the activity description using CLIP
    Request: { "image": "base64_string", "activity": "cycling to work" }
    Response: { "success": true, "verified": true, "similarity_score": 0.85, "confidence": "high" }
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data or 'activity' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: image and activity'
            }), 400
        
        image_base64 = data['image']
        activity_description = data['activity']
        threshold = data.get('threshold', 0.25)  # CLIP threshold (lower than face verification)
        
        # Decode image
        image_array = decode_base64_image(image_base64)
        pil_image = Image.fromarray(image_array)
        
        # Preprocess image for CLIP
        image_input = clip_preprocess(pil_image).unsqueeze(0).to(device)
        
        # Tokenize activity description
        text_input = clip.tokenize([activity_description]).to(device)
        
        # Get similarity
        with torch.no_grad():
            image_features = clip_model.encode_image(image_input)
            text_features = clip_model.encode_text(text_input)
            
            # Normalize features
            image_features /= image_features.norm(dim=-1, keepdim=True)
            text_features /= text_features.norm(dim=-1, keepdim=True)
            
            similarity = (image_features @ text_features.T).item()
        
        # Determine verification result
        verified = similarity > threshold
        
        # Confidence levels
        if similarity > 0.35:
            confidence_level = "high"
        elif similarity > 0.25:
            confidence_level = "medium"
        else:
            confidence_level = "low"
        
        return jsonify({
            'success': True,
            'verified': verified,
            'similarity_score': float(similarity),
            'confidence': confidence_level,
            'threshold': threshold,
            'message': f'Activity {"verified" if verified else "not verified"}'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Face Verification API starting...")
    print("📸 Models loaded: MTCNN + FaceNet + CLIP")
    print("🌐 Server running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
