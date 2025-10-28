"""
Test script for Face Verification API
Tests face detection and verification with sample images
"""

import requests
import base64
import json
from pathlib import Path

API_URL = "http://localhost:5000"

def image_to_base64(image_path):
    """Convert image file to base64 string"""
    with open(image_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def test_health():
    """Test 1: Health check"""
    print("\n" + "="*50)
    print("TEST 1: Health Check")
    print("="*50)
    
    response = requests.get(f"{API_URL}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✅ Health check PASSED")
        return True
    else:
        print("❌ Health check FAILED")
        return False

def test_detect_face(image_path):
    """Test 2: Face detection"""
    print("\n" + "="*50)
    print(f"TEST 2: Face Detection - {image_path}")
    print("="*50)
    
    if not Path(image_path).exists():
        print(f"❌ Image not found: {image_path}")
        print("Please provide a test image with a face")
        return False
    
    try:
        image_b64 = image_to_base64(image_path)
        
        response = requests.post(
            f"{API_URL}/detect-face",
            json={"image": f"data:image/jpeg;base64,{image_b64}"},
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        if result.get('success') and result.get('face_detected'):
            print(f"✅ Face detected with {result.get('confidence', 0)*100:.1f}% confidence")
            return True
        else:
            print(f"❌ No face detected: {result.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_verify_faces(profile_image, habit_image):
    """Test 3: Face verification"""
    print("\n" + "="*50)
    print(f"TEST 3: Face Verification")
    print(f"Profile: {profile_image}")
    print(f"Habit: {habit_image}")
    print("="*50)
    
    if not Path(profile_image).exists() or not Path(habit_image).exists():
        print("❌ One or both images not found")
        print("Please provide two test images with faces")
        return False
    
    try:
        profile_b64 = image_to_base64(profile_image)
        habit_b64 = image_to_base64(habit_image)
        
        response = requests.post(
            f"{API_URL}/verify-face",
            json={
                "profile_photo": f"data:image/jpeg;base64,{profile_b64}",
                "habit_photo": f"data:image/jpeg;base64,{habit_b64}",
                "threshold": 0.5
            },
            timeout=60
        )
        
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        if result.get('success'):
            if result.get('verified'):
                print(f"✅ VERIFIED - Same person!")
                print(f"   Similarity: {result.get('similarity_score', 0)*100:.1f}%")
            else:
                print(f"❌ NOT VERIFIED - Different person")
                print(f"   Similarity: {result.get('similarity_score', 0)*100:.1f}%")
            return True
        else:
            print(f"❌ Verification failed: {result.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def main():
    print("\n" + "🎯"*25)
    print("FACE VERIFICATION API TEST SUITE")
    print("🎯"*25)
    
    # Test 1: Health check
    if not test_health():
        print("\n❌ API is not running. Please start the API first:")
        print("   python app.py")
        return
    
    # Test 2: Face detection
    print("\n📸 To test face detection, please provide an image path:")
    print("   Example: test_api.py --detect path/to/image.jpg")
    print("\n   Or place a test image named 'test_face.jpg' in this folder")
    
    test_image = Path("test_face.jpg")
    if test_image.exists():
        test_detect_face(str(test_image))
    else:
        print("\n⚠️  No test image found. Skipping face detection test.")
    
    # Test 3: Face verification
    print("\n👥 To test face verification, provide two images:")
    print("   - profile.jpg (your profile photo)")
    print("   - habit.jpg (photo to verify)")
    
    profile = Path("profile.jpg")
    habit = Path("habit.jpg")
    
    if profile.exists() and habit.exists():
        test_verify_faces(str(profile), str(habit))
    else:
        print("\n⚠️  Profile or habit image not found. Skipping verification test.")
    
    print("\n" + "="*50)
    print("TEST SUITE COMPLETE")
    print("="*50)
    print("\n📝 To run full tests:")
    print("   1. Add test_face.jpg (any photo with a face)")
    print("   2. Add profile.jpg (your photo)")
    print("   3. Add habit.jpg (another photo to verify)")
    print("   4. Run: python test_api.py")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 2 and sys.argv[1] == "--detect":
        test_health()
        test_detect_face(sys.argv[2])
    elif len(sys.argv) > 3 and sys.argv[1] == "--verify":
        test_health()
        test_verify_faces(sys.argv[2], sys.argv[3])
    else:
        main()
