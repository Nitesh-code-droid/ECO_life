# backend/model/clip_model.py

import torch
import clip
from PIL import Image

class CLIPVerifier:
    def __init__(self):
        # Load CLIP model and preprocessing
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model, self.preprocess = clip.load("ViT-B/32", device=self.device)

    def verify_activity(self, image_path, text_description):
        # Load and preprocess the image
        image = self.preprocess(Image.open(image_path)).unsqueeze(0).to(self.device)

        # Tokenize the text
        text = clip.tokenize([text_description]).to(self.device)

        # Get similarity between image and text
        with torch.no_grad():
            image_features = self.model.encode_image(image)
            text_features = self.model.encode_text(text)

            # Normalize features
            image_features /= image_features.norm(dim=-1, keepdim=True)
            text_features /= text_features.norm(dim=-1, keepdim=True)

            similarity = (image_features @ text_features.T).item()

        return similarity  # Higher = more related (1 means strong match)
