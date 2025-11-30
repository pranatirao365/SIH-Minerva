# 🚀 Quick Start Guide - AI Video Generation Module

## ⚡ 1-Minute Setup

```powershell
# Run this script for automated setup
.\start-video-gen.ps1
```

## 📋 Prerequisites

✅ Python 3.8+  
✅ Node.js 16+  
✅ 3 API Keys (see below)

## 🔑 Get Your API Keys

1. **Gemini**: https://makersuite.google.com/app/apikey
2. **HuggingFace**: https://huggingface.co/settings/tokens  
3. **ElevenLabs**: https://elevenlabs.io/

## 🎬 How to Use

### Step 1: Start Backend
```powershell
cd backend
npm start
```
✅ Wait for: "Server is running on port 4000"

### Step 2: Start App
```powershell
# New terminal
npx expo start
```

### Step 3: Generate Video
1. Login as **Safety Officer**
2. Click **"AI Video Generator"** (top-left card)
3. Select **Language** (🇬🇧 English / 🇮🇳 Hindi / 🇮🇳 Telugu)
4. Enter **Topic** (e.g., "PPE Safety in Mines")
5. Click **"Generate Video"**
6. Wait **3-5 minutes** ⏱️
7. **Download** when complete! 🎉

## 🎯 Example Topics

- PPE Safety in Mines
- Gas Leak Protocol
- Emergency Exit Procedure
- Hazard Detection Underground
- Proper Ventilation Systems
- Rock Fall Prevention

## 📍 Important Locations

### Generated Files
- Videos: `E:\SIH\AUTHTUT\SIH-Minerva\output\`
- Images: `E:\SIH\AUTHTUT\SIH-Minerva\images\`
- Audio: `E:\SIH\AUTHTUT\SIH-Minerva\audio\`

### Code Files
- UI: `app\safety-officer\VideoGenerationModule.tsx`
- Backend: `backend\src\services\videoGeneration.service.ts`
- Python: `scripts\generate_video.py`

## 🔧 Troubleshooting

### ❌ "Backend not responding"
```powershell
# Test backend is running
curl http://localhost:4000/api/ping
# Should return: {"ok":true}
```

### ❌ "Python error"
```powershell
# Check Python
python --version

# Install dependencies
pip install -r requirements.txt
```

### ❌ "API key error"
Check `.env` file has all 3 keys:
```env
GEMINI_API_KEY=your_key_here
HF_TOKEN=your_token_here
ELEVENLABS_API_KEY=your_key_here
```

## 📊 Generation Progress

**Stage 1**: Scene Breakdown (15s)  
**Stage 2**: Image Generation (60s)  
**Stage 3**: Animation Creation (90s)  
**Stage 4**: Voiceover Generation (30s)  
**Stage 5**: Video Assembly (60s)  

**Total**: ~3-5 minutes ⏰

## 🎨 UI Features

✨ **Beautiful Dark Theme**  
🌍 **3 Languages Supported**  
📊 **Real-time Progress**  
🎬 **Video Preview**  
💾 **Download Option**  
🔄 **Generate Multiple Videos**

## 🆘 Need Help?

📖 **Detailed Guide**: `VIDEO_GENERATION_SETUP.md`  
📝 **Full Summary**: `VIDEO_MODULE_SUMMARY.md`  
☑️ **Checklist**: `SETUP_CHECKLIST.md`

## 🎯 API Endpoints

### Generate Video
```http
POST http://localhost:4000/api/video/generate
Content-Type: application/json

{
  "topic": "PPE Safety in Mines",
  "language": "en"
}
```

### Check Status
```http
GET http://localhost:4000/api/video/status/{jobId}
```

## ✅ Quick Test

```powershell
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Test API
curl -X POST http://localhost:4000/api/video/generate `
  -H "Content-Type: application/json" `
  -d '{"topic":"Test Video","language":"en"}'

# Terminal 3: Start app
npx expo start
```

## 🎉 Success Indicators

✅ Backend shows: "Starting video generation..."  
✅ UI shows progress bars moving  
✅ Video appears in `output/` folder  
✅ Download button becomes active  

---

**🚀 Ready to create amazing safety training videos!**

*For detailed documentation, see `VIDEO_GENERATION_SETUP.md`*
