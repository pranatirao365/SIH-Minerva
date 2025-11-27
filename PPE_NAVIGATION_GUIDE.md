# 🚀 PPE Scan Module - Navigation Integration

## ✅ Files Created

All files are **100% NEW** - no old code reused.

### Backend
```
backend_ppe/
├── main.py              # NEW FastAPI with /ppe-scan endpoint
├── requirements.txt     # Updated dependencies
└── model/              # ⚠️ YOU MUST ADD YOUR MODEL HERE
    └── yolov8s_custom.pt
```

### Frontend
```
screens/PPEScanScreen.tsx       # NEW camera screen
services/ppeApi.ts             # NEW API service
components/PPEPredictionCard.tsx  # NEW result card
```

---

## 🎯 Quick Setup

### 1. Move Your YOLO Model

**CRITICAL STEP:**
```bash
# Create model directory
cd backend_ppe
mkdir model

# Copy your model file
cp /path/to/your/yolov8s_custom.pt ./model/
```

Your model MUST be at: `backend_ppe/model/yolov8s_custom.pt`

### 2. Start Backend

```bash
cd backend_ppe
pip install -r requirements.txt
python main.py
```

Backend runs at: `http://localhost:8000`

Test it:
```bash
curl http://localhost:8000/
```

### 3. Install Frontend Dependencies

```bash
npx expo install expo-camera
```

### 4. Configure Backend URL

Open `services/ppeApi.ts` and update:

```typescript
const BACKEND_URL = 'http://localhost:8000'; // For local testing
// OR
const BACKEND_URL = 'https://your-deployed-backend.com'; // For production
```

---

## 📱 Add to Navigation

### Option 1: React Navigation Stack

```typescript
// In your navigation file (e.g., app/_layout.tsx or navigation/AppNavigator.tsx)
import PPEScanScreen from '../screens/PPEScanScreen';

// Add to your Stack Navigator:
<Stack.Screen 
  name="PPEScan" 
  component={PPEScanScreen}
  options={{ 
    title: 'PPE Scanner',
    headerShown: true 
  }}
/>
```

### Option 2: Expo Router (File-based)

Create a new file:
```
app/ppe-scan.tsx
```

With content:
```typescript
import PPEScanScreen from '../screens/PPEScanScreen';
export default PPEScanScreen;
```

### Option 3: Add Button to Navigate

In your existing screen (e.g., `app/miner/MinerHome.tsx`):

```typescript
import { useRouter } from 'expo-router';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MinerHome() {
  const router = useRouter();
  
  return (
    <View>
      {/* Your existing content */}
      
      <TouchableOpacity 
        style={styles.ppeScanButton}
        onPress={() => router.push('/ppe-scan')}
      >
        <Ionicons name="scan" size={24} color="#FFF" />
        <Text style={styles.buttonText}>Scan PPE</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  ppeScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    margin: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
```

---

## 🔐 Camera Permissions

Update `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access camera for PPE scanning"
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "Camera access is required to scan PPE equipment"
      }
    },
    "android": {
      "permissions": ["CAMERA"]
    }
  }
}
```

After updating `app.json`, rebuild:
```bash
npx expo prebuild --clean
```

---

## 🧪 Test the Module

1. **Start Backend:**
   ```bash
   cd backend_ppe
   python main.py
   ```

2. **Start Expo:**
   ```bash
   npx expo start
   ```

3. **Navigate to PPE Scan screen**

4. **Grant camera permission**

5. **Capture photo with PPE equipment**

6. **Click "Scan PPE"**

7. **View detection results**

---

## 📡 Deploy Backend

### Render.com

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new **Web Service**
4. Connect repo
5. Settings:
   - **Root Directory:** `backend_ppe`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add model file to deployment
7. Deploy

### Railway.app

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select repo
4. Set root directory: `backend_ppe`
5. Deploy

### After Deployment

Update `services/ppeApi.ts`:
```typescript
const BACKEND_URL = 'https://your-app.onrender.com';
```

---

## 🎨 What You Get

### Camera Screen Features
- ✅ Live camera preview
- ✅ Flip camera (front/back)
- ✅ Visual frame guidelines
- ✅ Professional capture button
- ✅ Clean UI

### Results Screen Features
- ✅ Image preview
- ✅ Loading animation
- ✅ Detection count
- ✅ Individual PPE cards
- ✅ Confidence percentages
- ✅ Color-coded confidence bars
- ✅ Bounding box info
- ✅ Scan again button

### Backend Features
- ✅ `/ppe-scan` endpoint
- ✅ multipart/form-data support
- ✅ YOLO inference
- ✅ JSON response with class, confidence, bbox
- ✅ Full CORS support
- ✅ Error handling

---

## 🔧 API Details

### Endpoint: POST `/ppe-scan`

**Request:**
```
Content-Type: multipart/form-data
Field: file (image file)
```

**Response:**
```json
{
  "success": true,
  "detections": [
    {
      "class": "helmet",
      "confidence": 0.95,
      "bbox": {
        "x1": 120.5,
        "y1": 50.2,
        "x2": 220.8,
        "y2": 180.3
      }
    }
  ],
  "count": 1
}
```

---

## ⚠️ Important Notes

1. **No old code used** - Everything is fresh
2. **Model path is hardcoded** - Must be at `model/yolov8s_custom.pt`
3. **No external dependencies** - Model loads locally
4. **CORS enabled** - Accepts requests from any origin
5. **FormData required** - Field name must be "file"

---

## 🐛 Troubleshooting

**Model not found:**
```
FileNotFoundError: model/yolov8s_custom.pt
```
→ Ensure model is at correct path in backend_ppe/model/

**Network error in app:**
```
Network request failed
```
→ Check BACKEND_URL in services/ppeApi.ts
→ Ensure backend is running and accessible

**Camera permission denied:**
→ Update app.json with camera permissions
→ Run `npx expo prebuild --clean`
→ Reinstall app

---

## ✅ Final Checklist

- [ ] Model at `backend_ppe/model/yolov8s_custom.pt`
- [ ] Backend dependencies installed
- [ ] Backend running (`python main.py`)
- [ ] expo-camera installed
- [ ] BACKEND_URL configured in ppeApi.ts
- [ ] Camera permissions in app.json
- [ ] PPE Scan screen added to navigation
- [ ] App rebuilt after permission changes
- [ ] Tested on device

---

## 🎉 Done!

Your PPE Scan module is ready. Navigate to the screen, scan PPE equipment, and get instant AI detection results!

**Everything is NEW. No old endpoints. No old code.**
