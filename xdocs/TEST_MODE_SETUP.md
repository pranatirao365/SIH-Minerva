# 🧪 Test Mode Setup Guide

## Overview
Test mode allows you to bypass real Firebase phone authentication during development, making testing faster and easier.

## Test Credentials

### Test Phone Numbers (All use OTP: 123456)

| Phone Number | Enter in App | OTP | Role |
|-------------|--------------|-----|------|
| +911234567890 | 1234567890 | 123456 | Miner |
| +911234567891 | 1234567891 | 123456 | Engineer |
| +911234567892 | 1234567892 | 123456 | Supervisor |
| +911234567893 | 1234567893 | 123456 | Safety Officer |
| +911234567894 | 1234567894 | 123456 | Admin |

### Test OTP (Same for all)
**OTP:** `123456`

---

## How to Use

### Step 1: Login Screen
1. Open the app
2. On the phone login screen, enter any test number:
   - **1234567890** (Miner)
   - **1234567891** (Engineer)
   - **1234567892** (Supervisor)
   - **1234567893** (Safety Officer)
   - **1234567894** (Admin)
3. Click "Send OTP"
4. You'll see a popup showing which role you're testing

### Step 2: OTP Verification
1. Enter OTP: **123456**
2. Click "Verify"
3. You'll be logged in without real SMS!

---

## Setting Up Test Users in Firestore

You need to create 5 test user documents in Firestore.

### Quick Setup:
See **ADD_TEST_USERS_FIRESTORE.md** for detailed instructions!

### Firebase Console Steps:
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Click "Firestore Database" in the left sidebar
4. Click "Start Collection" or navigate to existing `users` collection
5. Add 5 documents (one for each test user)

### Test Users to Create:

| Document ID | Role | Phone | Name |
|------------|------|-------|------|
| 911234567890 | miner | +911234567890 | Test Miner |
| 911234567891 | engineer | +911234567891 | Test Engineer |
| 911234567892 | supervisor | +911234567892 | Test Supervisor |
| 911234567893 | safety_officer | +911234567893 | Test Safety Officer |
| 911234567894 | admin | +911234567894 | Test Admin |

### Example Firestore Structure:
```
users/
  ├─ 911234567890/
  │   ├─ role: "miner"
  │   ├─ phone: "+911234567890"
  │   ├─ name: "Test Miner"
  │   └─ createdAt: Timestamp
  ├─ 911234567891/
  │   ├─ role: "engineer"
  │   ├─ phone: "+911234567891"
  │   ├─ name: "Test Engineer"
  │   └─ createdAt: Timestamp
  └─ (and so on...)
```

---

## All Test Users Are Pre-configured!

All 5 test numbers are already configured in the code. Just add them to Firestore and start testing!

---

## Disabling Test Mode (For Production)

### Important: Before deploying to production, disable test mode!

**File:** `app/auth/PhoneLogin.tsx`
```typescript
// Change this line:
const IS_TEST_MODE = true;

// To:
const IS_TEST_MODE = false;
```

**File:** `app/auth/OTPVerification.tsx`
```typescript
// Change this line:
const IS_TEST_MODE = true;

// To:
const IS_TEST_MODE = false;
```

---

## Testing Different Roles

To test different roles, update your test user's role in Firestore:

1. Go to Firestore Console
2. Navigate to `users/911234567890`
3. Edit the `role` field
4. Available roles:
   - `miner` → MinerHome screen
   - `engineer` → EngineerHome screen
   - `safety_officer` → SafetyOfficerHome screen
   - `supervisor` → SupervisorHome screen
   - `admin` → AdminHome screen

---

## Troubleshooting

### "User not found in database"
- Make sure you created the test user document in Firestore
- Document ID must be `911234567890` (without the +)
- Check that the `role` field exists

### Test mode not working
- Verify `IS_TEST_MODE = true` in both files
- Check phone number is exactly `+911234567890`
- Check OTP is exactly `123456`

### Real phone still requires OTP
- This is expected! Only the test phone bypasses OTP
- Any other phone number will use real Firebase authentication

---

## Security Notes

⚠️ **Important Security Reminders:**

1. **NEVER** deploy with test mode enabled in production
2. **REMOVE** test mode code before submitting to app stores
3. **DELETE** test users from production Firestore database
4. Test mode should **ONLY** be used during development

---

## Quick Reference

| Item | Value |
|------|-------|
| Test Phones | `1234567890` to `1234567894` |
| Test OTP (All) | `123456` |
| Firestore Doc IDs | `911234567890` to `911234567894` |
| Enable Test Mode | `IS_TEST_MODE = true` |
| Disable Test Mode | `IS_TEST_MODE = false` |
| Setup Guide | See `ADD_TEST_USERS_FIRESTORE.md` |

---

**Happy Testing! 🚀**
