# Firebase Authentication Testing Guide

## Overview
The app now uses Firebase Authentication with phone number OTP verification and Firestore for user role management.

## Phone Number Format
- **Input**: 10-digit phone number (e.g., `9876543210`)
- **Internal Format**: `+91XXXXXXXXXX` (e.g., `+919876543210`)

## Testing the Authentication Flow

### 1. Phone Login Screen
- Enter a 10-digit phone number
- The system will format it to `+91XXXXXXXXXX`
- Click "Send OTP"
- You'll see a confirmation that OTP was sent

### 2. OTP Verification Screen
- **For Testing**: Enter any 6-digit code (e.g., `123456`)
- The system will verify and check Firestore for the user

### 3. Firestore Database Structure

Your Firestore database should have the following structure:

```
users (collection)
  └── 9876543210 (document - phone number WITHOUT +91)
      ├── role: "miner" | "engineer" | "safety-officer" | "supervisor"
      ├── name: "User Name" (optional)
      └── ... other user fields
```

**Example Documents:**

```javascript
// Document ID: 9876543210
{
  role: "miner",
  name: "John Doe",
  createdAt: timestamp
}

// Document ID: 9876543211
{
  role: "engineer",
  name: "Jane Smith",
  createdAt: timestamp
}

// Document ID: 9876543212
{
  role: "safety-officer",
  name: "Bob Wilson",
  createdAt: timestamp
}

// Document ID: 9876543213
{
  role: "supervisor",
  name: "Alice Brown",
  createdAt: timestamp
}
```

## Role-Based Navigation

After OTP verification, users are automatically routed based on their role:

- **miner** → `/miner/MinerHome`
- **engineer** → `/engineer/EngineerHome`
- **safety-officer** → `/safety-officer/SafetyOfficerHome`
- **supervisor** → `/supervisor/SupervisorHome`

If the user doesn't exist in Firestore, they'll be directed to the Role Selection screen.

## Setting Up Test Users in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `sihtut-1`
3. Navigate to **Firestore Database**
4. Create a collection named `users`
5. Add documents with phone numbers as IDs:
   - Click "Add document"
   - Document ID: `9876543210` (without +91)
   - Add field: `role` (type: string) = `"miner"`
   - Add field: `name` (type: string) = `"Test Miner"`
   - Save

## Testing Checklist

- [ ] Phone number validation (must be 10 digits)
- [ ] Phone number formatting (+91 prefix)
- [ ] OTP sending (mock for testing)
- [ ] OTP verification (accepts any 6-digit code in testing)
- [ ] Firestore connection
- [ ] User role fetching
- [ ] Role-based navigation
- [ ] New user handling (role selection)

## Known Limitations (Development Mode)

1. **Mock OTP**: Currently accepts any 6-digit code for testing
2. **No Real SMS**: OTP is not actually sent via SMS
3. **No reCAPTCHA**: For production, you'll need to implement:
   - `expo-firebase-recaptcha` package
   - Backend service for phone auth
   - Firebase Admin SDK on backend

## Production Requirements

For production deployment, you must:

1. Install and configure `expo-firebase-recaptcha`
2. Set up proper Firebase Phone Authentication with reCAPTCHA
3. Implement proper OTP sending via Firebase
4. Add error handling for network failures
5. Implement resend OTP functionality
6. Add OTP expiration handling
7. Secure Firestore rules

## Firebase Security Rules

Add these rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Troubleshooting

### "Failed to fetch user data"
- Check Firestore connection
- Verify document ID matches phone number (without +91)
- Check Firebase rules allow reading

### "Invalid user role"
- Ensure role field exists in Firestore document
- Verify role value is one of: `miner`, `engineer`, `safety-officer`, `supervisor`

### Phone number format issues
- Always enter 10 digits only
- System automatically adds +91 prefix
- Firestore uses 10 digits (no +91) as document ID

## Console Logs

Enable console logging to debug:
- Phone number formatting
- OTP sending status
- Verification process
- Firestore queries
- Role detection
- Navigation flow
