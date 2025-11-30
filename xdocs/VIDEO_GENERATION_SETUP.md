# AI Video Generation Module - Setup Guide

## Overview
The AI Video Generation Module allows Safety Officers to create custom mining safety training videos using AI. The system integrates with your existing Python pipeline and provides a beautiful, user-friendly interface.

## Architecture

```
Frontend (React Native)
    ↓
Backend API (Express/Node.js)
    ↓
Python Pipeline (main.py)
    ↓
Generated Videos (output/)
```

## Prerequisites

### Python Environment
1. Python 3.8 or higher installed
2. Required Python packages (install via pip):
   ```bash
   pip install -r requirements.txt
   ```

### Environment Variables
Create a `.env` file in the project root with:
```env
GEMINI_API_KEY=your_gemini_api_key_here
HF_TOKEN=your_huggingface_token_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### Node.js Backend
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

## Running the System

### 1. Start the Backend Server
```bash
cd backend
npm start
```
The server will run on `http://localhost:4000`

### 2. Start the Expo App
In a new terminal:
```bash
npx expo start
```

### 3. Access the Video Generation Module
1. Login as a Safety Officer
2. Navigate to Safety Officer Dashboard
3. Click on "AI Video Generator"
4. Select language (English, Hindi, or Telugu)
5. Enter a mining safety topic
6. Click "Generate Video"

## API Endpoints

### Start Video Generation
```
POST /api/video/generate
Content-Type: application/json

{
  "topic": "PPE Safety in Mines",
  "language": "en"
}

Response:
{
  "success": true,
  "jobId": "job_1234567890_xyz",
  "message": "Video generation started"
}
```

### Check Generation Status
```
GET /api/video/status/:jobId

Response:
{
  "success": true,
  "status": "processing",
  "currentStage": 2,
  "message": "Creating animations...",
  "videoUrl": null
}
```

## File Structure

```
project-root/
├── app/
│   └── safety-officer/
│       ├── SafetyOfficerHome.tsx        # Dashboard with module access
│       └── VideoGenerationModule.tsx    # Main UI component
├── backend/
│   └── src/
│       ├── controllers/
│       │   └── videoGeneration.controller.ts
│       ├── routes/
│       │   └── videoGeneration.routes.ts
│       └── services/
│           └── videoGeneration.service.ts
├── scripts/
│   ├── generate_video.py               # CLI wrapper for automation
│   ├── script_generator.py             # Scene generation
│   ├── image_generator.py              # Image generation
│   ├── animation_generator.py          # Animation creation
│   ├── voiceover_generator.py          # TTS voiceover
│   └── video_assembler.py              # Final assembly
├── output/                              # Generated videos
├── images/                              # Generated images
├── audio/                               # Generated audio
└── main.py                              # Main pipeline
```

## Features

### 1. Language Support
- English
- Hindi (हिंदी)
- Telugu (తెలుగు)

### 2. Real-time Progress Tracking
The UI shows 5 stages:
1. Scene Breakdown (AI script generation)
2. Image Generation (Character & environment creation)
3. Animation Creation (Motion effects)
4. Voiceover Generation (Multilingual TTS)
5. Video Assembly (Final compilation)

### 3. Example Topics
- PPE Safety in Mines
- Gas Leak Protocol
- Hazard Detection Underground
- Emergency Exit Procedure
- Proper Ventilation Systems
- Rock Fall Prevention

## Troubleshooting

### Backend can't find Python
Update the `pythonPath` in `videoGeneration.service.ts`:
```typescript
this.pythonPath = 'python3'; // or full path to python executable
```

### API Connection Failed
- Ensure backend is running on port 4000
- Check if `http://localhost:4000/api/ping` returns `{"ok": true}`
- Update the API URL in `VideoGenerationModule.tsx` if using different port

### Python Dependencies Missing
```bash
pip install google-generativeai requests pillow opencv-python numpy scipy pyttsx3 python-dotenv
```

### Video Not Found After Generation
Check:
1. Output directory exists: `E:\SIH\AUTHTUT\SIH-Minerva\output`
2. Backend static file serving is configured (check `app.ts`)
3. File permissions allow reading generated videos

## Production Considerations

1. **Authentication**: Add proper authentication to video generation endpoints
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Queue System**: Use Redis/Bull for job queue management
4. **Storage**: Store generated videos in cloud storage (S3, GCS)
5. **Caching**: Cache generated videos for common topics
6. **Monitoring**: Add logging and monitoring for pipeline failures
7. **Cleanup**: Schedule periodic cleanup of old generated files

## Performance

- Average generation time: 3-5 minutes per video
- Depends on:
  - API response times (Gemini, HuggingFace, ElevenLabs)
  - Scene count (configurable in config.json)
  - Animation complexity
  - Video length

## Support

For issues or questions:
1. Check backend logs: `backend/` terminal output
2. Check Python logs: Look for error messages in generation output
3. Verify API keys are valid and have sufficient quota
4. Check network connectivity to API services

## License

Part of the SIH-Minerva project.
