# PPE Detection Backend

FastAPI backend for PPE (Personal Protective Equipment) detection using YOLO.

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Model Location

Ensure your YOLO model is located at:
```
backend_ppe/model/yolov8s_custom.pt
```

### 3. Run Locally

```bash
python main.py
```

The server will start at `http://localhost:8000`

### 4. Test the API

```bash
curl -X POST "http://localhost:8000/ppe-scan" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/image.jpg"
```

## API Endpoints

### GET `/`
Health check endpoint.

**Response:**
```json
{
  "status": "PPE Detection API is running",
  "endpoint": "/ppe-scan"
}
```

### POST `/ppe-scan`
Detect PPE in uploaded image.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Field name: `file`
- File type: Image (jpg, png, etc.)

**Response:**
```json
{
  "success": true,
  "detections": [
    {
      "class": "helmet",
      "confidence": 0.95,
      "bbox": {
        "x1": 100.5,
        "y1": 50.2,
        "x2": 200.8,
        "y2": 150.3
      }
    }
  ],
  "count": 1
}
```

## Deployment

### Option 1: Render.com

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory:** `backend_ppe`

### Option 2: Railway.app

1. Create a new project on Railway
2. Connect your GitHub repository
3. Set root directory to `backend_ppe`
4. Railway will auto-detect the Python app

### Option 3: Heroku

1. Create a `Procfile` in `backend_ppe`:
   ```
   web: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
2. Deploy using Heroku CLI

## CORS Configuration

The API currently allows all origins (`*`). For production, update the CORS settings in `main.py`:

```python
allow_origins=["https://your-frontend-domain.com"]
```

## Environment Variables

For production deployment, consider adding:

- `MODEL_PATH`: Path to your YOLO model
- `MAX_FILE_SIZE`: Maximum upload file size
- `ALLOWED_ORIGINS`: Specific frontend URLs for CORS
