"""
FastAPI Backend for Crack Segmentation using DeepCrack Model
"""

import os
import io
import cv2
import base64
import torch
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import argparse

# Load environment variables
load_dotenv()

# Import the model and utility functions
from inference_utils import create_model, tensor2im, read_image


# ===========================
# Configuration
# ===========================
class Options:
    """Options class mimicking argparse for model initialization"""
    def __init__(self):
        self.model = 'deepcrack'
        self.input_nc = 3
        self.num_classes = 1
        self.ngf = 64
        self.norm = 'batch'
        self.init_type = 'normal'
        self.init_gain = 0.02
        self.gpu_ids = [0] if torch.cuda.is_available() else []
        self.isTrain = False
        self.display_sides = True
        self.loss_mode = 'focal'
        self.lambda_side = 1.0
        self.lambda_fused = 1.0


# ===========================
# Response Model
# ===========================
class PredictionResponse(BaseModel):
    success: bool
    message: str
    fused_mask: str  # base64 encoded PNG
    side1: Optional[str] = None  # base64 encoded PNG
    side2: Optional[str] = None
    side3: Optional[str] = None
    side4: Optional[str] = None
    side5: Optional[str] = None
    binary_mask: str  # base64 encoded PNG
    severity_percentage: float
    severity_label: str
    crack_confidence: float


# ===========================
# FastAPI App
# ===========================
app = FastAPI(
    title="DeepCrack Segmentation API",
    description="Crack detection and segmentation backend using pretrained DeepCrack model",
    version="1.0.0"
)

# Global model instance
model = None
opt = None
device = None


@app.on_event("startup")
async def load_model():
    """Load the DeepCrack model on startup"""
    global model, opt, device
    
    print("=" * 60)
    print("Loading DeepCrack Model...")
    print("=" * 60)
    
    # Setup device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    # Create options
    opt = Options()
    
    # Load model using the existing create_model function
    model = create_model(opt, cp_path='pretrained_net_G.pth')
    model.eval()
    
    print("Model loaded successfully!")
    print("=" * 60)


def numpy_to_base64(img: np.ndarray) -> str:
    """Convert numpy array to base64 encoded PNG"""
    _, buffer = cv2.imencode('.png', img)
    return base64.b64encode(buffer).decode('utf-8')


def calculate_severity(mask: np.ndarray, confidence: float) -> tuple:
    """Calculate severity percentage and label"""
    # Calculate percentage of crack pixels
    binary = (mask > 90).astype(np.uint8)
    total_pixels = binary.size
    crack_pixels = np.sum(binary)
    severity_pct = (crack_pixels / total_pixels) * 100
    
    # Determine severity label based on percentage and confidence
    if severity_pct < 0.5 or confidence < 0.3:
        severity_label = "LOW"
    elif severity_pct < 2.0 or confidence < 0.5:
        severity_label = "MEDIUM"
    elif severity_pct < 5.0 or confidence < 0.7:
        severity_label = "HIGH"
    else:
        severity_label = "CRITICAL"
    
    return severity_pct, severity_label


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "DeepCrack Segmentation API",
        "status": "running",
        "model_loaded": model is not None
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "device": str(device)
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    """
    Crack segmentation prediction endpoint
    
    Args:
        file: Uploaded image file (JPEG, PNG, etc.)
    
    Returns:
        PredictionResponse with segmentation masks and severity information
    """
    try:
        # Validate model is loaded
        if model is None:
            raise HTTPException(status_code=500, detail="Model not loaded")
        
        # Read uploaded file
        contents = await file.read()
        
        # Preprocess image using existing function (resizes to 256x256, normalizes, converts to tensor)
        image_tensor = read_image(contents, dim=(256, 256))
        image_tensor = image_tensor.unsqueeze(0)  # Add batch dimension
        
        # Set input for the model
        model.set_input({
            'image': image_tensor, 
            'label': torch.zeros_like(image_tensor), 
            'A_paths': file.filename
        })
        
        # Run inference
        model.test()
        
        # Get visual results
        visuals = model.get_current_visuals()
        
        # Extract confidence from fused output
        confidence = visuals['fused'].max().item()
        
        # Convert all outputs to uint8 numpy arrays
        results = {}
        for key in visuals.keys():
            results[key] = tensor2im(visuals[key])
        
        # Generate binary mask
        fused_gray = cv2.cvtColor(results['fused'], cv2.COLOR_BGR2GRAY)
        binary_mask = fused_gray.copy()
        binary_mask[binary_mask < 90] = 0
        binary_mask[binary_mask >= 90] = 255
        
        # Calculate severity
        severity_pct, severity_label = calculate_severity(fused_gray, confidence)
        
        # Convert all images to base64
        response_data = {
            "success": True,
            "message": "Prediction completed successfully",
            "fused_mask": numpy_to_base64(results['fused']),
            "binary_mask": numpy_to_base64(binary_mask),
            "severity_percentage": round(severity_pct, 2),
            "severity_label": severity_label,
            "crack_confidence": round(confidence, 4)
        }
        
        # Add side outputs if available
        if opt.display_sides:
            for i in range(1, 6):
                side_key = f'side{i}'
                if side_key in results:
                    response_data[side_key] = numpy_to_base64(results[side_key])
        
        return JSONResponse(content=response_data)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/predict_with_contours")
async def predict_with_contours(file: UploadFile = File(...)):
    """
    Crack segmentation with contour analysis (uses full cv2_utils)
    
    Args:
        file: Uploaded image file
    
    Returns:
        Enhanced prediction with contour measurements
    """
    try:
        from inference_utils import inference
        
        # Validate model is loaded
        if model is None:
            raise HTTPException(status_code=500, detail="Model not loaded")
        
        # Read uploaded file
        contents = await file.read()
        
        # Decode image to get dimensions
        nparr = np.frombuffer(contents, np.uint8)
        img_original = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        original_h, original_w = img_original.shape[:2]
        
        # Run inference with contour analysis
        contour_img, visuals = inference(
            model, 
            contents, 
            dim=(original_w, original_h),
            unit='mm'
        )
        
        # Extract confidence
        confidence = visuals['fused'].max().item()
        
        # Convert fused mask
        fused_gray = cv2.cvtColor(visuals['fused'], cv2.COLOR_BGR2GRAY)
        binary_mask = fused_gray.copy()
        binary_mask[binary_mask < 90] = 0
        binary_mask[binary_mask >= 90] = 255
        
        # Calculate severity
        severity_pct, severity_label = calculate_severity(fused_gray, confidence)
        
        # Prepare response
        response_data = {
            "success": True,
            "message": "Prediction with contours completed",
            "fused_mask": numpy_to_base64(visuals['fused']),
            "contour_visualization": numpy_to_base64(contour_img),
            "binary_mask": numpy_to_base64(binary_mask),
            "severity_percentage": round(severity_pct, 2),
            "severity_label": severity_label,
            "crack_confidence": round(confidence, 4)
        }
        
        # Add side outputs
        if opt.display_sides:
            for i in range(1, 6):
                side_key = f'side{i}'
                if side_key in visuals:
                    response_data[side_key] = numpy_to_base64(visuals[side_key])
        
        return JSONResponse(content=response_data)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    print(f"🚀 Starting Hazard Detection API on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
