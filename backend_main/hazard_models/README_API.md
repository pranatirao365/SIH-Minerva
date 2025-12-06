# DeepCrack Segmentation Backend

Complete FastAPI backend for crack detection and segmentation using the pretrained DeepCrack model.

## 📁 Required Files

Ensure the following files are present in your project root:

```
Hazardmodels/
├── main.py                    # FastAPI backend (main file)
├── pretrained_net_G.pth      # Pretrained DeepCrack weights
├── inference_utils.py         # Inference utilities
├── cv2_utils.py              # OpenCV utilities for contour analysis
├── requirements.txt          # Python dependencies
├── models/                   # Model architecture files
│   ├── __init__.py
│   ├── base_model.py
│   ├── deepcrack_model.py
│   ├── deepcrack_networks.py
│   ├── networks.py
│   ├── roadnet_model.py
│   └── roadnet_networks.py
```

## 🚀 Installation

1. **Create and activate virtual environment:**
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

## ▶️ Running the Backend

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

The server will start at: `http://localhost:8000`

## 📡 API Endpoints

### 1. **Root Endpoint**
```
GET /
```
Returns API status and model load state.

### 2. **Health Check**
```
GET /health
```
Returns health status and device information.

### 3. **Basic Prediction**
```
POST /predict
```

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: file (image upload)

**Response:**
```json
{
  "success": true,
  "message": "Prediction completed successfully",
  "fused_mask": "base64_encoded_png_string",
  "side1": "base64_encoded_png_string",
  "side2": "base64_encoded_png_string",
  "side3": "base64_encoded_png_string",
  "side4": "base64_encoded_png_string",
  "side5": "base64_encoded_png_string",
  "binary_mask": "base64_encoded_png_string",
  "severity_percentage": 2.34,
  "severity_label": "MEDIUM",
  "crack_confidence": 0.8765
}
```

### 4. **Prediction with Contours**
```
POST /predict_with_contours
```

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: file (image upload)

**Response:**
```json
{
  "success": true,
  "message": "Prediction with contours completed",
  "fused_mask": "base64_encoded_png_string",
  "contour_visualization": "base64_encoded_png_string",
  "binary_mask": "base64_encoded_png_string",
  "severity_percentage": 2.34,
  "severity_label": "MEDIUM",
  "crack_confidence": 0.8765,
  "side1": "...",
  "side2": "...",
  "side3": "...",
  "side4": "...",
  "side5": "..."
}
```

## 🧪 Testing the API

### Using cURL:
```bash
curl -X POST "http://localhost:8000/predict" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.jpg"
```

### Using Python:
```python
import requests
import base64
from PIL import Image
from io import BytesIO

# Upload image
with open('test.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/predict',
        files={'file': f}
    )

result = response.json()

# Decode and save the fused mask
mask_data = base64.b64decode(result['fused_mask'])
mask_image = Image.open(BytesIO(mask_data))
mask_image.save('output_fused.png')

# Print severity
print(f"Severity: {result['severity_label']} ({result['severity_percentage']:.2f}%)")
print(f"Confidence: {result['crack_confidence']:.4f}")
```

### Using Swagger UI:
Navigate to `http://localhost:8000/docs` for interactive API documentation.

## 📊 Severity Labels

The API classifies crack severity into four categories:

- **LOW**: < 0.5% crack coverage or confidence < 0.3
- **MEDIUM**: 0.5-2.0% crack coverage or confidence 0.3-0.5
- **HIGH**: 2.0-5.0% crack coverage or confidence 0.5-0.7
- **CRITICAL**: > 5.0% crack coverage or confidence > 0.7

## 🔧 Model Architecture

The backend uses the **DeepCrackModel** architecture from:
- Paper: [DeepCrack: Learning Hierarchical Convolutional Features for Crack Detection](https://www.sciencedirect.com/science/article/pii/S0925231219300566)
- Architecture: `models/deepcrack_model.py`
- Network: `models/deepcrack_networks.py`

The model outputs:
- **5 side outputs** (multi-scale feature maps)
- **1 fused output** (final prediction)

## ⚙️ Configuration

The model uses the following default settings:
- Input channels: 3 (RGB)
- Output classes: 1 (binary segmentation)
- Base filters (ngf): 64
- Normalization: Batch normalization
- Input size: 256×256 (automatically resized)
- Normalization: [-1, 1] range

## 📝 Notes

1. **Image Preprocessing**: Images are automatically resized to 256×256 and normalized to [-1, 1] range.

2. **GPU Acceleration**: The model automatically uses CUDA if available, otherwise falls back to CPU.

3. **Binary Threshold**: Pixels with intensity < 90 are classified as background, >= 90 as crack.

4. **Base64 Output**: All images are returned as base64-encoded PNG strings for easy transmission and storage.

## 🐛 Troubleshooting

### ImportError: No module named 'models'
Make sure you're running the server from the project root directory.

### Model not loaded
Check that `pretrained_net_G.pth` exists in the project root.

### CUDA out of memory
Reduce batch size or use CPU mode by setting `gpu_ids = []` in Options class.

## 📄 License

This implementation uses the DeepCrack architecture. Please cite the original paper if used in research.
