# YOLO Model Directory

This directory should contain your custom YOLOv8 PPE detection model.

## Required File
- `yolov8s_custom.pt` - Custom trained YOLOv8 model for PPE detection

## If Model is Missing
The application will automatically download and use YOLOv8n (nano) as a fallback model.
This fallback model is the standard COCO dataset model and may not detect PPE items accurately.

## Getting the Custom Model

### Option 1: Train Your Own
```bash
# Install ultralytics
pip install ultralytics

# Train on your PPE dataset
yolo detect train data=ppe_dataset.yaml model=yolov8s.pt epochs=100
```

### Option 2: Download Pre-trained PPE Model
If you have a pre-trained PPE detection model:
1. Download the `.pt` file
2. Rename it to `yolov8s_custom.pt`
3. Place it in this directory

### Option 3: Use Alternative Model
You can also modify `main.py` to use different model names:
- `yolov8n.pt` - Nano (fastest, least accurate)
- `yolov8s.pt` - Small (balanced)
- `yolov8m.pt` - Medium (more accurate)
- `yolov8l.pt` - Large (most accurate, slowest)

## Expected Classes
The custom model should detect PPE items like:
- Helmet/Hard Hat
- Safety Vest/Jacket
- Gloves
- Safety Boots
- Goggles/Glasses
- Mask/Respirator

## Current Status
⚠️ **No custom model found** - Using fallback YOLOv8n model
