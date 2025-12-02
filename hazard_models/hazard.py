"""
# Required files:
# hazard_models/fire_model.pt
# hazard_models/pretrained_net_G.pth
# hazard_models/models/deepcrack_model.py
# hazard_models/models/deepcrack_networks.py
# hazard_models/models/base_model.py
# hazard_models/models/networks.py
# hazard_models/inference_utils.py (for crack model)

FastAPI Hazard Detection Backend - Fire & Crack Models
Supports: Fire detection (YOLO) and Crack segmentation (DeepCrack)
"""

import io
import cv2
import base64
import torch
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from PIL import Image
import torchvision.transforms as transforms

# Import ultralytics for fire model
from ultralytics import YOLO

# Import DeepCrack model utilities
from models.deepcrack_model import DeepCrackModel

# ===========================
# Configuration
# ===========================
class CrackModelOptions:
    """Options for DeepCrack model initialization"""
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
class HazardResponse(BaseModel):
    hazard_type: str
    severity_label: str
    severity_percent: float
    processed_image: str  # base64 encoded
    extra_outputs: Optional[dict] = None


# ===========================
# FastAPI App
# ===========================
app = FastAPI(
    title="Mining Hazard Detection API",
    description="Unified API for Fire and Crack detection using YOLO and DeepCrack models",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instances
fire_model = None
crack_model = None
crack_opt = None
device = None


# ===========================
# Model Loading
# ===========================
@app.on_event("startup")
async def load_models():
    """Load both Fire (YOLO) and Crack (DeepCrack) models on startup"""
    global fire_model, crack_model, crack_opt, device
    
    print("=" * 80)
    print("LOADING HAZARD DETECTION MODELS")
    print("=" * 80)
    
    # Get the directory where this script is located
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"✓ Script directory: {script_dir}")
    
    # Setup device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"✓ Using device: {device}")
    
    # ========== Load Fire Model (YOLO) ==========
    try:
        print("\n[1/2] Loading Fire Detection Model (YOLO)...")
        fire_model_path = os.path.join(script_dir, 'fire_model.pt')
        fire_model = YOLO(fire_model_path)
        fire_model.to(device)
        print("✓ Fire model loaded successfully!")
    except Exception as e:
        print(f"✗ Failed to load fire model: {e}")
        fire_model = None
    
    # ========== Load Crack Model (DeepCrack) ==========
    try:
        print("\n[2/2] Loading Crack Detection Model (DeepCrack)...")
        crack_opt = CrackModelOptions()
        crack_model = DeepCrackModel(crack_opt)
        
        # Load pretrained weights
        checkpoint_path = os.path.join(script_dir, 'pretrained_net_G.pth')
        checkpoint = torch.load(checkpoint_path, map_location=device)
        if hasattr(crack_model.netG, 'module'):
            crack_model.netG.module.load_state_dict(checkpoint, strict=False)
        else:
            crack_model.netG.load_state_dict(checkpoint, strict=False)
        
        crack_model.eval()
        print("✓ Crack model loaded successfully!")
    except Exception as e:
        print(f"✗ Failed to load crack model: {e}")
        crack_model = None
    
    print("\n" + "=" * 80)
    print("MODEL LOADING COMPLETE")
    print(f"Fire Model: {'✓ Ready' if fire_model else '✗ Not Available'}")
    print(f"Crack Model: {'✓ Ready' if crack_model else '✗ Not Available'}")
    print("=" * 80 + "\n")


# ===========================
# Helper Functions
# ===========================
def numpy_to_base64(img: np.ndarray) -> str:
    """Convert numpy array to base64 encoded PNG"""
    if img is None:
        return ""
    _, buffer = cv2.imencode('.png', img)
    return base64.b64encode(buffer).decode('utf-8')


def tensor2im(input_image, imtype=np.uint8):
    """Convert tensor to numpy image"""
    if not isinstance(input_image, np.ndarray):
        if isinstance(input_image, torch.Tensor):
            image_tensor = input_image.data
        else:
            return input_image
        image_numpy = image_tensor[0].cpu().float().numpy()
        if image_numpy.shape[0] == 1:
            image_numpy = np.tile(image_numpy, (3, 1, 1))
        image_numpy = (np.transpose(image_numpy, (1, 2, 0)) + 1) / 2.0 * 255.0
    else:
        image_numpy = input_image
    return image_numpy.astype(imtype)


def preprocess_image_for_crack(img_bytes: bytes, dim=(512, 512)) -> torch.Tensor:
    """Preprocess image for DeepCrack model"""
    img_transforms = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
    ])
    
    img = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(img, cv2.IMREAD_COLOR)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    w, h = dim
    if w > 0 and h > 0:
        img = cv2.resize(img, (w, h), interpolation=cv2.INTER_CUBIC)
    
    img = img_transforms(Image.fromarray(img.copy()))
    return img


# ===========================
# Fire Detection Logic
# ===========================
def detect_fire(img_bytes: bytes) -> dict:
    """Run fire detection using YOLO model"""
    if fire_model is None:
        raise HTTPException(status_code=503, detail="Fire model not loaded")
    
    # Decode image
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Run YOLO inference
    results = fire_model(img, verbose=False)
    
    # Extract detections
    detections = results[0].boxes
    max_confidence = 0.0
    
    if len(detections) > 0:
        confidences = detections.conf.cpu().numpy()
        max_confidence = float(np.max(confidences))
    
    # Determine severity based on confidence
    if max_confidence < 0.30:
        severity_label = "LOW"
    elif max_confidence < 0.60:
        severity_label = "MEDIUM"
    elif max_confidence < 0.85:
        severity_label = "HIGH"
    else:
        severity_label = "CRITICAL"
    
    # Draw boxes on image
    annotated_img = results[0].plot()
    
    return {
        "hazard_type": "fire",
        "severity_label": severity_label,
        "severity_percent": round(max_confidence * 100, 2),
        "processed_image": numpy_to_base64(annotated_img),
        "extra_outputs": {
            "num_detections": len(detections),
            "max_confidence": round(max_confidence, 4)
        }
    }


# ===========================
# Crack Detection Logic
# ===========================
def detect_crack(img_bytes: bytes) -> dict:
    """Run crack detection using DeepCrack model"""
    if crack_model is None:
        raise HTTPException(status_code=503, detail="Crack model not loaded")
    
    # Preprocess image (resize to 512x512 as per requirements)
    image_tensor = preprocess_image_for_crack(img_bytes, dim=(512, 512))
    image_tensor = image_tensor.unsqueeze(0)  # Add batch dimension
    
    # Set input for model
    crack_model.set_input({
        'image': image_tensor,
        'label': torch.zeros_like(image_tensor),
        'A_paths': 'uploaded_image'
    })
    
    # Run inference
    crack_model.test()
    
    # Get visual results
    visuals = crack_model.get_current_visuals()
    
    # Convert fused output to numpy
    fused_output = tensor2im(visuals['fused'])
    
    # Convert to grayscale for analysis
    fused_gray = cv2.cvtColor(fused_output, cv2.COLOR_BGR2GRAY)
    
    # Calculate severity percentage
    binary_mask = (fused_gray > 90).astype(np.uint8) * 255
    total_pixels = binary_mask.size
    crack_pixels = np.sum(binary_mask) / 255
    severity_percent = (crack_pixels / total_pixels) * 100
    
    # Determine severity label based on crack pixel percentage
    if severity_percent < 1.0:
        severity_label = "LOW"
    elif severity_percent < 5.0:
        severity_label = "MEDIUM"
    elif severity_percent < 10.0:
        severity_label = "HIGH"
    else:
        severity_label = "CRITICAL"
    
    # Prepare extra outputs with all side outputs and fused mask
    extra_outputs = {
        "fused": numpy_to_base64(fused_output),
        "binary_mask": numpy_to_base64(binary_mask),
        "crack_pixels": int(crack_pixels),
        "total_pixels": int(total_pixels)
    }
    
    # Add all side outputs
    if crack_opt.display_sides:
        for i in range(1, 6):
            side_key = f'side{i}'
            if side_key in visuals:
                extra_outputs[side_key] = numpy_to_base64(tensor2im(visuals[side_key]))
    
    return {
        "hazard_type": "crack",
        "severity_label": severity_label,
        "severity_percent": round(severity_percent, 2),
        "processed_image": numpy_to_base64(fused_output),
        "extra_outputs": extra_outputs
    }


# ===========================
# API Endpoints
# ===========================
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Mining Hazard Detection API",
        "version": "2.0.0",
        "status": "running",
        "models": {
            "fire": fire_model is not None,
            "crack": crack_model is not None
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "device": str(device),
        "models_loaded": {
            "fire": fire_model is not None,
            "crack": crack_model is not None
        }
    }


@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    hazard_type: str = Form(...)
):
    """
    Unified hazard detection endpoint
    
    Args:
        file: Uploaded image file
        hazard_type: Type of hazard ("fire", "crack", "gas", "obstruction", etc.)
    
    Returns:
        JSON response with detection results or development status
    """
    try:
        # Read uploaded file
        contents = await file.read()
        
        # Normalize hazard type to lowercase
        hazard_type_lower = hazard_type.lower()
        
        # Route to appropriate model
        if hazard_type_lower == "fire":
            result = detect_fire(contents)
            return JSONResponse(content=result)
        
        elif hazard_type_lower == "crack":
            result = detect_crack(contents)
            return JSONResponse(content=result)
        
        else:
            # Placeholder for models under development (gas, obstruction, etc.)
            return JSONResponse(
                status_code=200,
                content={
                    "hazard_type": hazard_type,
                    "message": "Model under development"
                }
            )
    
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
