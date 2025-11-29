# FastAPI Backend for PPE Detection
# main.py

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io
import numpy as np
from typing import List, Dict, Any
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="PPE Detection API",
    description="YOLO-based Personal Protective Equipment detection API",
    version="1.0.0"
)

# Configure CORS for Expo mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)

# Load YOLO model at startup
MODEL_PATH = "model/yolov8s_custom.pt"
model = None

@app.on_event("startup")
async def load_model():
    """Load YOLO model on startup"""
    global model
    try:
        logger.info(f"Loading YOLO model from {MODEL_PATH}")
        model = YOLO(MODEL_PATH)
        logger.info("✅ Model loaded successfully")
    except Exception as e:
        logger.error(f"❌ Failed to load model: {str(e)}")
        raise RuntimeError(f"Could not load YOLO model: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "PPE Detection API",
        "status": "online",
        "endpoints": {
            "predict": "/predict",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH
    }

@app.post("/predict")
async def predict_ppe(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    PPE Detection Endpoint
    
    Args:
        file: Image file (jpeg, jpg, png)
        
    Returns:
        JSON with detections array containing:
        - class: PPE item name
        - confidence: detection confidence (0-1)
        - bbox: bounding box coordinates [x1, y1, x2, y2]
    """
    
    # Validate model is loaded
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Expected image file."
        )
    
    try:
        # Read image file
        logger.info(f"Processing image: {file.filename}")
        image_bytes = await file.read()
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert RGBA to RGB if necessary
        if image.mode == 'RGBA':
            image = image.convert('RGB')
        
        # Run YOLO inference
        logger.info("Running YOLO inference...")
        results = model(image, verbose=False)
        
        # Process results
        detections = []
        for result in results:
            boxes = result.boxes
            
            for box in boxes:
                # Extract detection data
                class_id = int(box.cls[0])
                class_name = result.names[class_id]
                confidence = float(box.conf[0])
                bbox = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                
                detections.append({
                    "class": class_name,
                    "confidence": confidence,
                    "bbox": bbox
                })
        
        logger.info(f"✅ Detected {len(detections)} PPE items")
        
        return {
            "success": True,
            "detections": detections,
            "count": len(detections)
        }
        
    except Exception as e:
        logger.error(f"❌ Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/classes")
async def get_classes():
    """Get list of detectable PPE classes"""
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    return {
        "classes": list(model.names.values()),
        "count": len(model.names)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
