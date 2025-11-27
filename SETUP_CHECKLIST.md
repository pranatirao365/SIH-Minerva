# Video Generation Module - Setup Checklist

## Pre-Setup Requirements

### Python Environment
- [ ] Python 3.8+ installed and accessible via `python` command
- [ ] pip package manager available

### API Keys Required
- [ ] Google Gemini API key (for scene generation)
- [ ] Hugging Face token (for image generation)
- [ ] ElevenLabs API key (for voiceovers)

### Node.js Environment
- [ ] Node.js 16+ installed
- [ ] npm or pnpm package manager

## Setup Steps

### 1. Environment Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Add `GEMINI_API_KEY` to `.env`
- [ ] Add `HF_TOKEN` to `.env`
- [ ] Add `ELEVENLABS_API_KEY` to `.env`
- [ ] Save `.env` file

### 2. Python Dependencies
- [ ] Run: `pip install -r requirements.txt`
- [ ] Verify: `python -c "import google.generativeai"`
- [ ] Verify: `python -c "import PIL"`
- [ ] Verify: `python -c "import cv2"`

### 3. Backend Setup
- [ ] Navigate to `backend` directory
- [ ] Run: `npm install` or `pnpm install`
- [ ] Verify: Check for `node_modules` folder

### 4. Directory Structure
- [ ] Verify `output` directory exists (created automatically)
- [ ] Verify `images` directory exists (created automatically)
- [ ] Verify `audio` directory exists (created automatically)
- [ ] Verify `animations` directory exists (created automatically)

### 5. Test Backend
- [ ] Start backend: `cd backend && npm start`
- [ ] Verify running on port 4000
- [ ] Test endpoint: Open `http://localhost:4000/api/ping` in browser
- [ ] Should see: `{"ok": true}`

### 6. Test Expo App
- [ ] In new terminal: `npx expo start`
- [ ] Open app on device/emulator
- [ ] Login as Safety Officer
- [ ] Navigate to Safety Officer Dashboard
- [ ] Verify "AI Video Generator" module appears

## First Test Run

### Generate Test Video
- [ ] Click on "AI Video Generator"
- [ ] Select language: English
- [ ] Enter topic: "PPE Safety in Mines"
- [ ] Click "Generate Video"
- [ ] Watch progress indicators
- [ ] Wait for completion (~3-5 minutes)
- [ ] Verify video appears in preview
- [ ] Check video file in `output` folder

## Troubleshooting Checklist

### If Backend Won't Start
- [ ] Check if port 3000 is already in use
- [ ] Verify `node_modules` installed correctly
- [ ] Check for syntax errors in console
- [ ] Review `backend/src` files for any issues

### If Python Execution Fails
- [ ] Verify Python is in system PATH
- [ ] Check `.env` file has correct API keys
- [ ] Test: `python scripts/generate_video.py en "test topic"`
- [ ] Review backend terminal logs for errors

### If No Video Generated
- [ ] Check `output` folder exists
- [ ] Verify file permissions
- [ ] Check backend logs for completion message
- [ ] Verify Python script completed without errors

### If Progress Not Updating
- [ ] Refresh app (pull to refresh)
- [ ] Check network connectivity
- [ ] Verify backend is still running
- [ ] Check browser/app console for errors

## Production Readiness Checklist

### Security
- [ ] Add authentication to video generation endpoints
- [ ] Implement rate limiting
- [ ] Add input validation and sanitization
- [ ] Set up CORS properly
- [ ] Move API keys to secure vault

### Performance
- [ ] Implement Redis for job queue
- [ ] Add video generation queue management
- [ ] Set up background job processing
- [ ] Implement caching for common topics
- [ ] Add CDN for video delivery

### Monitoring
- [ ] Add logging for all operations
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor API usage and quotas
- [ ] Track generation success/failure rates
- [ ] Set up alerts for failures

### Storage
- [ ] Move videos to cloud storage (S3/GCS)
- [ ] Implement video lifecycle management
- [ ] Set up automatic cleanup of old videos
- [ ] Add video compression/optimization
- [ ] Configure backup strategy

### User Experience
- [ ] Add video preview player in app
- [ ] Implement video sharing
- [ ] Add video library integration
- [ ] Allow customization of video parameters
- [ ] Add progress notifications

## Quick Reference

### Important URLs
- Backend API: `http://localhost:4000`
- API Ping: `http://localhost:4000/api/ping`
- Generate Video: `POST http://localhost:3000/api/video/generate`
- Check Status: `GET http://localhost:3000/api/video/status/:jobId`

### Important Paths
- Output Videos: `E:\SIH\AUTHTUT\SIH-Minerva\output`
- Generated Images: `E:\SIH\AUTHTUT\SIH-Minerva\images`
- Audio Files: `E:\SIH\AUTHTUT\SIH-Minerva\audio`
- Backend Code: `E:\SIH\AUTHTUT\SIH-Minerva\backend\src`
- Frontend Component: `E:\SIH\AUTHTUT\SIH-Minerva\app\safety-officer\VideoGenerationModule.tsx`

### Key Files
- Main Pipeline: `main.py`
- CLI Wrapper: `scripts/generate_video.py`
- Backend Service: `backend/src/services/videoGeneration.service.ts`
- Frontend UI: `app/safety-officer/VideoGenerationModule.tsx`
- Config: `config.json`
- Environment: `.env`

## Support Resources

- Setup Guide: `VIDEO_GENERATION_SETUP.md`
- Implementation Summary: `VIDEO_MODULE_SUMMARY.md`
- Quick Start: `start-video-gen.ps1`
- Backend README: `backend/README.md`

---

**Next Steps**: Follow the setup steps in order, check off each item, and test the system with a simple video generation.
