import os
from io import BytesIO

import cv2
import numpy as np
import torch
import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

# Monkey-patch torch.load to use weights_only=False for compatibility with older YOLO models
_original_torch_load = torch.load
def patched_torch_load(*args, **kwargs):
    kwargs.setdefault('weights_only', False)
    return _original_torch_load(*args, **kwargs)
torch.load = patched_torch_load

from ultralytics import YOLO

# Department-based PPE Requirements
DEPARTMENT_PPE_SETS = {
    "mining_operations": {
        "set_a_basic": {
            "helmet": ["Helmet", "helmet", "hardhat", "hard-hat"],
            "gloves": ["Gloves", "glove"],
            "vest": ["Vest", "Safety-Vest", "vest", "jacket", "safety-vest"],
            "eye_protection": ["Goggles", "goggles", "Glasses", "glasses", "Glass", "glass", "eyewear"],
            "safety_boots": ["Safety-Boot", "Shoes", "shoes", "boots", "boot"]
        },
        "set_b_dust_drilling": {
            "helmet": ["Helmet", "helmet", "hardhat", "hard-hat"],
            "gloves": ["Gloves", "glove"],
            "vest": ["Vest", "Safety-Vest", "vest", "jacket", "safety-vest"],
            "eye_protection": ["Goggles", "goggles", "Glasses", "glasses", "Glass", "glass", "eyewear"],
            "safety_boots": ["Safety-Boot", "Shoes", "shoes", "boots", "boot"],
            "protective_suit": ["Suit", "suit", "coverall", "overall"]
        }
    },
    "blasting": {
        "set_a_mandatory": {
            "helmet": ["Helmet", "helmet", "hardhat", "hard-hat"],
            "gloves": ["Gloves", "glove"],
            "vest": ["Vest", "Safety-Vest", "vest", "jacket", "safety-vest"],
            "eye_protection": ["Goggles", "goggles", "Glasses", "glasses", "Glass", "glass", "eyewear"],
            "safety_boots": ["Safety-Boot", "Shoes", "shoes", "boots", "boot"]
        },
        "set_b_full_protection": {
            "helmet": ["Helmet", "helmet", "hardhat", "hard-hat"],
            "gloves": ["Gloves", "glove"],
            "vest": ["Vest", "Safety-Vest", "vest", "jacket", "safety-vest"],
            "eye_protection": ["Goggles", "goggles", "Glasses", "glasses", "Glass", "glass", "eyewear"],
            "safety_boots": ["Safety-Boot", "Shoes", "shoes", "boots", "boot"],
            "protective_suit": ["Suit", "suit", "coverall", "overall"]
        }
    },
    "equipment_maintenance": {
        "set_a_standard": {
            "helmet": ["Helmet", "helmet", "hardhat", "hard-hat"],
            "gloves": ["Gloves", "glove"],
            "eye_protection": ["Goggles", "goggles", "Glasses", "glasses", "Glass", "glass", "eyewear"],
            "safety_boots": ["Safety-Boot", "Shoes", "shoes", "boots", "boot"]
        },
        "set_b_chemical_oil": {
            "helmet": ["Helmet", "helmet", "hardhat", "hard-hat"],
            "gloves": ["Gloves", "glove"],
            "eye_protection": ["Goggles", "goggles", "Glasses", "glasses", "Glass", "glass", "eyewear"],
            "safety_boots": ["Safety-Boot", "Shoes", "shoes", "boots", "boot"],
            "protective_suit": ["Suit", "suit", "coverall", "overall"],
            "vest": ["Vest", "Safety-Vest", "vest", "jacket", "safety-vest"]
        }
    },
    "safety_inspection": {
        "set_a_inspection": {
            "helmet": ["Helmet", "helmet", "hardhat", "hard-hat"],
            "vest": ["Vest", "Safety-Vest", "vest", "jacket", "safety-vest"],
            "safety_boots": ["Safety-Boot", "Shoes", "shoes", "boots", "boot"]
        },
        "set_b_risky_zone": {
            "helmet": ["Helmet", "helmet", "hardhat", "hard-hat"],
            "vest": ["Vest", "Safety-Vest", "vest", "jacket", "safety-vest"],
            "safety_boots": ["Safety-Boot", "Shoes", "shoes", "boots", "boot"],
            "eye_protection": ["Goggles", "goggles", "Glasses", "glasses", "Glass", "glass", "eyewear"],
            "gloves": ["Gloves", "glove"]
        }
    }
}

# Helper function to get PPE requirements for a department/set
def get_ppe_requirements(department: str, ppe_set: str = None):
    """
    Get PPE requirements for a specific department and set.
    If ppe_set is not specified, returns the first set (basic/mandatory/standard).
    """
    if department not in DEPARTMENT_PPE_SETS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid department. Valid departments: {', '.join(DEPARTMENT_PPE_SETS.keys())}"
        )
    
    dept_sets = DEPARTMENT_PPE_SETS[department]
    
    # If no set specified, use the first available set
    if ppe_set is None:
        ppe_set = list(dept_sets.keys())[0]
    
    if ppe_set not in dept_sets:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid PPE set for {department}. Valid sets: {', '.join(dept_sets.keys())}"
        )
    
    return dept_sets[ppe_set]

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

@app.get("/departments")
def get_departments():
    """
    List all available departments and their PPE sets
    """
    departments_info = {}
    for dept, sets in DEPARTMENT_PPE_SETS.items():
        departments_info[dept] = {
            "available_sets": list(sets.keys()),
            "ppe_requirements": {
                set_name: list(set_config.keys())
                for set_name, set_config in sets.items()
            }
        }
    return {
        "departments": departments_info,
        "total_departments": len(DEPARTMENT_PPE_SETS)
    }

@app.post("/ppe-scan")
async def ppe_scan(
    file: UploadFile = File(...),
    department: str = Form(...),
    ppe_set: str = Form(None)
):
    """
    Department-Specific PPE Detection Endpoint
    
    Accepts: multipart/form-data with:
      - file: image file
      - department: one of [mining_operations, blasting, equipment_maintenance, safety_inspection]
      - ppe_set: optional specific set (e.g., set_a_basic, set_b_dust_drilling)
    
    Returns: PPE status based on department requirements with compliance flag
    """
    try:
        # Validate content type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Please upload an image file."
            )
        
        # Get department-specific PPE requirements
        ppe_requirements = get_ppe_requirements(department, ppe_set)
        
        # Determine which set is being used
        actual_set = ppe_set if ppe_set else list(DEPARTMENT_PPE_SETS[department].keys())[0]
        
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
        
        # Initialize PPE results based on department requirements
        ppe_results = {
            ppe_type: {"required": True, "present": False}
            for ppe_type in ppe_requirements.keys()
        }
        
        # Update with YOLO detections
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
                
                # Map to PPE category using department-specific requirements
                for ppe_type, variants in ppe_requirements.items():
                    if raw_class in variants:
                        # Mark as present (binary detection)
                        ppe_results[ppe_type]["present"] = True
                        print(f"✓ Detected: {ppe_type} -> {raw_class} ({confidence:.2%})")
                        break
        
        # Calculate compliance
        total_required = len(ppe_results)
        total_present = sum(1 for item in ppe_results.values() if item["present"])
        compliance_percentage = (total_present / total_required * 100) if total_required > 0 else 0
        is_compliant = compliance_percentage == 100
        
        print(f"\n📊 Department: {department} | Set: {actual_set}")
        print(f"📊 Raw Detections: {', '.join(detected_classes) if detected_classes else 'None'}")
        print("\n📊 Final Results (Department-Specific):")
        for ppe_type, data in ppe_results.items():
            status = "✓ PRESENT" if data["present"] else "✗ MISSING"
            print(f"  {ppe_type}: {status} (Required)")
        print(f"\n{'✓' if is_compliant else '✗'} Compliance: {compliance_percentage:.1f}% ({total_present}/{total_required})")
        
        return {
            "department": department,
            "ppe_set": actual_set,
            "ppe_items": ppe_results,
            "compliance": {
                "is_compliant": is_compliant,
                "percentage": round(compliance_percentage, 1),
                "items_present": total_present,
                "items_required": total_required
            }
        }
    
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
