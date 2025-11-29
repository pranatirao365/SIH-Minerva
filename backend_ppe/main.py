from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
import uvicorn
import os
import torch

# Fix PyTorch 2.9 weights_only security change - import ultralytics classes first
from ultralytics.nn.tasks import DetectionModel
torch.serialization.add_safe_globals([DetectionModel])

from ultralytics import YOLO

# PPE Class Mapping - Maps YOLO classes to PPE categories
PPE_CLASSES = {
    "Helmet": ["Helmet", "helmet"],
    "Gloves": ["Gloves"],
    "Vest": ["Vest", "Safety-Vest", "vest"],
    "Shoes": ["Safety-Boot"]
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
        
        # Initialize ALL 4 PPE categories as NOT PRESENT
        ppe_results = {
            "Helmet": {"present": False},
            "Gloves": {"present": False},
            "Vest": {"present": False},
            "Shoes": {"present": False}
        }
        
        # Update with YOLO detections
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # Get raw class name from YOLO model
                class_id = int(box.cls[0])
                raw_class = result.names[class_id]
                
                # Map to PPE category using EXACT mapping
                for ppe_type, variants in PPE_CLASSES.items():
                    if raw_class in variants:
                        ppe_results[ppe_type]["present"] = True
                        print(f"✓ Detected: {ppe_type} -> {raw_class}")
                        break
        
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
