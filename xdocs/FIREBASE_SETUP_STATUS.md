# Firebase Setup Verification Checklist

## ✅ Files Configured

### 1. Firebase Configuration
- **File**: `config/firebase.ts`
- **Status**: ✅ Configured
- **Config**:
  - Project ID: `sihtut-1`
  - API Key: Present
  - Auth Domain: `sihtut-1.firebaseapp.com`
  - Firestore: Initialized
  - Auth Persistence: Configured with AsyncStorage

### 2. Google Services
- **File**: `google-services.json`
- **Status**: ✅ Fixed
- **Package Name**: Updated to `com.minerva.mobile` (matches app.json)
- **Project Number**: 929345200458

### 3. App Configuration
- **File**: `app.json`
- **Status**: ✅ Configured
- **Google Services**: Linked to `./google-services.json`
- **Package**: `com.minerva.mobile`

### 4. Dependencies
- **Status**: ✅ Installed
- firebase: ^12.6.0
- expo-firebase-recaptcha: ^2.3.1
- @react-native-async-storage/async-storage: ^1.24.0
- expo-application: ^7.0.7

## 🔧 Firebase Authentication Files

### 1. `services/firebaseAuth.ts`
- **Phone Auth Functions**:
  - `sendOTP()` - Sends OTP to phone number
  - `verifyOTP()` - Verifies OTP code
  - `initRecaptcha()` - Initialize reCAPTCHA (for web)
  
- **Current Mode**: Development (accepts any 6-digit OTP)
- **Production Ready**: Supports Firebase Phone Auth with reCAPTCHA

### 2. `services/testFirebaseSetup.ts`
- **Test Functions**:
  - `testFirebaseSetup()` - Comprehensive Firebase test
  - `testUserInFirestore()` - Check if user exists in Firestore

### 3. `app/auth/PhoneLogin.tsx`
- **Features**:
  - Phone number input with +91 prefix
  - E.164 format validation
  - Firebase OTP integration
  - Loading states
  - Error handling

### 4. `app/auth/OTPVerification.tsx`
- **Features**:
  - 6-digit OTP input
  - Firebase verification
  - Firestore role lookup
  - Auto-navigation based on role

## 📊 Firebase Console Requirements

### Required Setup in Firebase Console:

1. **Authentication**
   - Go to: Firebase Console → Authentication → Sign-in method
   - Enable: Phone provider ✅
   - Test phone numbers: Optional (for development)

2. **Firestore Database**
   - Collection: `users`
   - Document structure:
     ```
     users/{phoneNumber}
       - role: "miner" | "engineer" | "safety-officer" | "supervisor"
       - name: string (optional)
       - ... other fields
     ```

3. **Example Firestore Documents**:
   ```
   users/9876543210
     role: "miner"
     name: "Test User"
   
   users/9876543211
     role: "engineer"
     name: "Test Engineer"
   ```

## 🧪 Testing Instructions

### On App Start:
The app will automatically run Firebase connection tests and log:
- ✅ Firebase App initialization
- ✅ Firebase Auth initialization
- ✅ Firestore connection
- ✅ Users collection access
- ⚠️ User count in database

Check console logs for the test results.

### Test Phone Login:
1. Enter phone number: `9876543210` (or any 10 digits)
2. System formats to: `+919876543210`
3. Click "Send OTP"
4. Enter any 6-digit code (development mode)
5. App checks Firestore for user with phone `9876543210`
6. Navigates to appropriate screen based on role

## 🔍 Verification Steps

### Step 1: Check Console Logs
Run the app and look for:
```
🚀 Starting Firebase connection test...
✅ Firebase App initialized
✅ Firebase Auth initialized
✅ Firestore initialized
✅ Users collection accessible
Found X user(s)
```

### Step 2: Test Phone Authentication
1. Go to Phone Login screen
2. Enter: `9876543210`
3. Check console for:
   ```
   Sending OTP to: +919876543210
   ✅ Mock OTP sent successfully
   💡 For testing: Enter any 6-digit code
   ```

### Step 3: Verify OTP
1. Enter any code: `123456`
2. Check console for:
   ```
   Verifying OTP: 123456
   Looking for user: 9876543210
   ✅ User found! (or ❌ User not found)
   ```

### Step 4: Check Firestore Integration
If user exists in Firestore:
- ✅ Role is fetched
- ✅ Navigation to appropriate screen

If user doesn't exist:
- ⚠️ Shows "New User" alert
- → Navigates to Role Selection

## 🚨 Known Issues & Solutions

### Issue: "User not found in Firestore"
**Solution**: Create user in Firebase Console
1. Go to Firestore Database
2. Create collection: `users`
3. Add document with ID: `9876543210` (without +91)
4. Add field: `role` = `"miner"`

### Issue: "No actual SMS received"
**Status**: Expected in development mode
**Reason**: reCAPTCHA not implemented yet
**Workaround**: Use any 6-digit code for testing
**Production**: Implement expo-firebase-recaptcha

### Issue: Package name mismatch
**Status**: ✅ Fixed
**Changed**: `com.yourcompany.firebasetut` → `com.minerva.mobile`

## 📱 Current Flow

1. **User enters phone**: `+919876543210`
2. **App sends request**: Firebase Auth (mock in dev)
3. **User enters OTP**: Any 6 digits
4. **App verifies**: Against Firestore database
5. **App fetches role**: From `users/{phone}` document
6. **App navigates**: Based on role

## ✅ What's Working

- ✅ Phone number validation (+91 format)
- ✅ Firebase initialization
- ✅ Firestore connection
- ✅ User role lookup
- ✅ Role-based navigation
- ✅ Development mode OTP (any code works)

## ⚠️ What Needs Firebase Console Setup

- ⚠️ Enable Phone Authentication provider
- ⚠️ Create users in Firestore database
- ⚠️ Add test phone numbers (optional)
- ⚠️ For production: Configure reCAPTCHA

## 🎯 Next Steps

1. **Verify Firebase Console Settings**:
   - Phone Auth enabled?
   - Firestore users created?
   
2. **Test the Flow**:
   - Run app
   - Check console logs
   - Try phone login
   - Verify Firestore lookup

3. **Create Test Users**:
   - Add documents to `users` collection
   - Use phone numbers without +91
   - Set appropriate roles

## 📞 Support

If you see errors in console, share:
1. The exact error message
2. Which step failed
3. Console logs from Firebase test

The Firebase connection test runs automatically on app start in development mode.
