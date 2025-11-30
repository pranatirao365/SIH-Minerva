from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
import uvicorn
import os
import torch

# Monkey-patch torch.load to use weights_only=False for compatibility with older YOLO models
_original_torch_load = torch.load
def patched_torch_load(*args, **kwargs):
    kwargs.setdefault('weights_only', False)
    return _original_torch_load(*args, **kwargs)
torch.load = patched_torch_load

from ultralytics import YOLO

# PPE Class Mapping - Maps YOLO classes to PPE categories (6 categories)
PPE_CLASSES = {
    "helmet": ["Helmet", "helmet", "hardhat", "hard-hat"],
    "gloves": ["Gloves", "glove"],
    "vest": ["Vest", "Safety-Vest", "vest", "jacket", "safety-vest"],
    "eye_protection": ["Goggles", "goggles", "Glasses", "glasses", "Glass", "glass", "eyewear"],
    "safety_boots": ["Safety-Boot", "Shoes", "shoes", "boots", "boot"],
    "protective_suit": ["Suit", "suit", "coverall", "overall"]
}

# Initialize FastAPI app
app = FastAPI(
    title="PPE Detection API",
    description="YOLOv8-based PPE detection service with custom class mapping",
    version="2.0.0"
)

# CORS Configuration - Allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLOv8 model from local path
model_path = os.path.join(os.path.dirname(__file__), "model", "yolov8s_custom.pt")
print(f"🔄 Loading YOLO model from {model_path}...")
model = YOLO(model_path)
print("✅ Model loaded successfully!")
print(f"📋 Model has {len(model.names)} classes")
for idx, name in model.names.items():
    print(f"  Class {idx}: {name}")

@app.get("/")
def health_check():
    """Health check endpoint"""
    return {
        "status": "running",
        "message": "PPE Detection API is online",
        "endpoint": "/ppe-scan",
        "model_classes": model.names
    }

@app.post("/ppe-scan")
async def ppe_scan(file: UploadFile = File(...)):
    """
    PPE Detection Endpoint
    
    Accepts: multipart/form-data with 'file' field containing an image
    Returns: ALL 8 PPE categories with present/not present status
    """
    try:
        # Validate content type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Please upload an image file."
            )
        
        # Read and process image
        image_bytes = await file.read()
        pil_image = Image.open(BytesIO(image_bytes))
        
        # Convert PIL image to numpy array
        image_array = np.array(pil_image)
        
        # Convert RGB to BGR for OpenCV/YOLO
        if len(image_array.shape) == 3 and image_array.shape[2] == 3:
            image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        
        # Run YOLO inference
        results = model(image_array)
        
        # Initialize ALL 6 PPE categories as NOT PRESENT (binary presence detection)
        ppe_results = {
            "helmet": {"present": False},
            "gloves": {"present": False},
            "vest": {"present": False},
            "eye_protection": {"present": False},
            "safety_boots": {"present": False},
            "protective_suit": {"present": False}
        }
        
        # Update with YOLO detections (binary presence only)
        detected_classes = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # Get raw class name and confidence from YOLO model
                class_id = int(box.cls[0])
                raw_class = result.names[class_id]
                confidence = float(box.conf[0])
                
                detected_classes.append(f"{raw_class} ({confidence:.2%})")
                
                # Skip "no-" variants (duplicates)
                if "no-" in raw_class.lower() or "no_" in raw_class.lower() or raw_class.lower().startswith("no "):
                    continue
                
                # Map to PPE category using flexible matching
                for ppe_type, variants in PPE_CLASSES.items():
                    if raw_class in variants:
                        # Mark as present (binary detection)
                        ppe_results[ppe_type]["present"] = True
                        print(f"✓ Detected: {ppe_type} -> {raw_class} ({confidence:.2%})")
                        break
        
        print(f"\n📊 Raw Detections: {', '.join(detected_classes) if detected_classes else 'None'}")
        print(f"\n📊 Final Results (Binary Presence):")
        for ppe_type, data in ppe_results.items():
            status = "✓ PRESENT" if data["present"] else "✗ MISSING"
            print(f"  {ppe_type}: {status}")
        
        return ppe_results
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process image: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
