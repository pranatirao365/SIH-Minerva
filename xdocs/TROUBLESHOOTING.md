# 🔧 Quick Fix Guide - Video Generation Module

## ✅ Issue: "Failed to start video generation. Please ensure backend is running."

### Solution Steps

#### 1. Start the Backend (Port 4000)

```powershell
cd backend
npm start
```

**Expected Output:**

```
Minerva backend running on http://localhost:4000
```

#### 2. Verify Backend is Running

```powershell
curl http://localhost:4000/api/ping
```

**Expected Response:**

```json
{"ok":true}
```

#### 3. Reload Your Expo App

Press `r` in the Expo terminal to reload the app

---

## 🚨 Common Issues & Fixes

### Issue: "ts-node-dev not recognized"

**Solution:**

```powershell
cd backend
npm install
```

### Issue: Backend crashes on startup

**Check:**

1. Port 4000 is not already in use
2. Firebase credentials are configured
3. `.env` file exists in project root

**Quick Fix:**

```powershell
# Check what's using port 4000
netstat -ano | findstr :4000

# Kill process if needed (replace PID)
taskkill /PID <PID> /F
```

### Issue: "Module not found" errors

**Solution:**

```powershell
# Clean install
cd backend
rm -r node_modules
rm package-lock.json
npm install
```

### Issue: Cannot connect from mobile device

**Fix:** Update API URL to use your computer's IP instead of localhost

1. Find your IP:

```powershell
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.5)
```

2. Update in `VideoGenerationModule.tsx`:

```typescript
// Change from:
const response = await fetch('http://localhost:4000/api/video/generate', ...

// To:
const response = await fetch('http://192.168.1.5:4000/api/video/generate', ...
```

---

## 📋 Pre-Flight Checklist

Before generating a video, ensure:

- [ ] ✅ Backend running on port 4000
- [ ] ✅ Backend responds to `/api/ping`
- [ ] ✅ `.env` file has API keys:
  - `GEMINI_API_KEY`
  - `HF_TOKEN`
  - `ELEVENLABS_API_KEY`
- [ ] ✅ Python installed and in PATH
- [ ] ✅ Python packages installed:

  ```powershell
  pip install -r requirements.txt
  ```

---

## 🧪 Quick Test

```powershell
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Test API
curl -X POST http://localhost:4000/api/video/generate `
  -H "Content-Type: application/json" `
  -d '{\"topic\":\"Test Video\",\"language\":\"en\"}'

# Should return:
# {"success":true,"jobId":"job_...","message":"Video generation started"}
```

---

## 📱 Mobile Device Testing

If testing on physical device:

1. **Ensure same network:** Both computer and device on same WiFi
2. **Disable firewall:** Temporarily disable Windows Firewall for testing
3. **Use computer IP:** Replace `localhost` with your computer's IP address
4. **Check port forwarding:** Ensure port 4000 is accessible

---

## 🔍 Debug Mode

Enable detailed logging:

1. **Backend:** Check terminal output for errors
2. **Frontend:** Check Expo console for network errors
3. **Python:** Check for errors in backend terminal when generation starts

---

## 💡 Quick Commands

```powershell
# Check if backend is running
curl http://localhost:4000/api/ping

# Check backend port
netstat -ano | findstr :4000

# Restart backend
cd backend
npm start

# Test Python
python --version
python -c "import google.generativeai"

# Check .env file
cat .env
```

---

## ✅ Success Indicators

When everything works correctly:

1. ✅ Backend shows: `Minerva backend running on http://localhost:4000`
2. ✅ Ping returns: `{"ok":true}`
3. ✅ App loads without errors
4. ✅ Can navigate to AI Video Generator
5. ✅ Generate button is enabled after selecting language and entering topic

---

## 🆘 Still Having Issues?

1. Check backend terminal for specific error messages
2. Check Expo terminal for React Native errors
3. Verify all files are saved
4. Try restarting both backend and Expo
5. Clear Expo cache: `npx expo start -c`

---

**Last Updated:** November 27, 2025
**Backend Port:** 4000
**API Base URL:** <http://localhost:4000/api>
