# Firebase Phone Authentication Setup Guide

## Current Status
⚠️ **The app is currently in TESTING MODE** - No real SMS messages are sent.

## Why OTP is Not Coming

Firebase Phone Authentication in React Native/Expo requires additional setup that is not yet implemented:

### Current Implementation (Testing Mode)
- ✅ Phone number validation works
- ✅ UI and flow are functional
- ❌ **No actual SMS is sent**
- ✅ Any 6-digit code is accepted for testing

### What's Missing for Real OTP

Firebase Phone Auth requires one of these:

#### Option 1: expo-firebase-recaptcha (Client-Side) ⭐ Recommended for Expo
```bash
npm install expo-firebase-recaptcha
```

#### Option 2: Backend Service (Production Ready)
- Set up a Node.js/Express backend
- Use Firebase Admin SDK
- Handle phone auth server-side

#### Option 3: Firebase Test Phone Numbers (For Development)
- Add test phone numbers in Firebase Console
- Use predefined OTP codes

## Quick Setup for Testing with Firebase Console

### Step 1: Enable Phone Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `sihtut-1`
3. Go to **Authentication** → **Sign-in method**
4. Enable **Phone** provider
5. Add your domain to authorized domains

### Step 2: Add Test Phone Numbers (Optional)
1. In Authentication → Sign-in method
2. Scroll to **Phone numbers for testing**
3. Add phone numbers with static verification codes:
   - Phone: `+919876543210`
   - Code: `123456`

### Step 3: For Production - Set up reCAPTCHA

You need to either:
- Install `expo-firebase-recaptcha` package
- Or build a backend service

## Current Workaround for Development

**The app currently works in TESTING MODE:**

1. Enter any phone number (e.g., +918885648652)
2. Click "Send OTP"
3. Enter **any 6-digit code** (e.g., 123456)
4. The app will verify against Firestore database

**This works for development** because:
- The phone number is stored
- Firestore lookup works
- Role-based navigation works
- Only the SMS sending is mocked

## Firebase Console Configuration Needed

### Enable Phone Auth:
```
Firebase Console → Authentication → Sign-in method → Phone → Enable
```

### Check Firebase Quota:
- Free tier: 10K verifications/month
- Blaze plan: Pay as you go

## Next Steps for Production

Choose one implementation:

### A. Client-Side with reCAPTCHA (Easier)
```typescript
// Install: npm install expo-firebase-recaptcha
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { signInWithPhoneNumber } from 'firebase/auth';
```

### B. Backend Service (More Secure)
```javascript
// server.js
const admin = require('firebase-admin');
admin.initializeApp();

app.post('/send-otp', async (req, res) => {
  // Handle phone auth server-side
});
```

## Testing the Current Implementation

### What Works Now:
1. ✅ Phone number input (+91 format)
2. ✅ Format validation
3. ✅ Navigation flow
4. ✅ Firestore connection
5. ✅ Role-based routing
6. ✅ Mock OTP verification

### What Needs Firebase Setup:
1. ❌ Actual SMS sending
2. ❌ Real OTP generation
3. ❌ Firebase verification

## Recommended Solution

For your project, I recommend **implementing expo-firebase-recaptcha** as it:
- Works with Expo
- No backend needed
- Official Firebase solution
- Easy to implement

Would you like me to implement the full reCAPTCHA solution?
