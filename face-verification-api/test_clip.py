import torch
import clip
from PIL import Image

print("🚀 Starting CLIP test...")

# Load CLIP model
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")
model, preprocess = clip.load("ViT-B/32", device=device)

# Path to your test image
image_path = "plant.jpeg"  # Make sure this file exists in your backend folder!

# Text description
text_description = "A person planting a tree"

# Try loading the image
try:
    image = preprocess(Image.open(image_path)).unsqueeze(0).to(device)
except Exception as e:
    print(f"❌ Error loading image: {e}")
    exit()

# Tokenize text
text = clip.tokenize([text_description]).to(device)

# Compute similarity
with torch.no_grad():
    image_features = model.encode_image(image)
    text_features = model.encode_text(text)

    image_features /= image_features.norm(dim=-1, keepdim=True)
    text_features /= text_features.norm(dim=-1, keepdim=True)

    similarity = (image_features @ text_features.T).item()

print(f"🔍 Similarity score: {similarity:.4f}")
if similarity > 0.3:
    print("✅ Match: The image likely matches the description.")
else:
    print("❌ Not a match.")
