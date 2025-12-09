# Firebase Phone Authentication Setup Guide

## 🚀 Quick Setup (5-10 minutes)

### Step 1: Enable Phone Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **sih-dec-2025**
3. Click **Authentication** in the left sidebar
4. Click **Sign-in method** tab
5. Click **Phone** in the providers list
6. Toggle **Enable** switch to ON
7. Click **Save**

### Step 2: Add Test Phone Numbers (Optional - for testing without SMS charges)

While in the Phone provider settings:

1. Scroll down to **Phone numbers for testing**
2. Click **Add phone number**
3. Add your test numbers:
   - Phone: `+919032017652` → Code: `123456`
   - Phone: `+911234567890` → Code: `123456`
4. Click **Save**

**Note:** Test numbers work instantly without billing setup, perfect for development!

### Step 3: Configure Authorized Domains

1. In Firebase Console → **Authentication** → **Settings** tab
2. Scroll to **Authorized domains**
3. Ensure these domains are listed:
   - `localhost`
   - `sih-dec-2025.firebaseapp.com`
4. For Expo Go, add your machine's IP (e.g., `192.168.x.x`)

### Step 4: Enable Billing (Required for Production SMS)

⚠️ **Only needed for real phone numbers (not test numbers)**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **sih-dec-2025**
3. Click **Billing** in left menu
4. Link a billing account or create new one
5. Upgrade to **Blaze Plan** (Pay as you go)

**SMS Pricing:**
- India: ~₹0.50 per SMS
- Free quota: First 10,000 verifications/month are FREE
- After free quota: Very cheap (fractions of a rupee per SMS)

### Step 5: Enable Identity Platform API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **sih-dec-2025**
3. Search for **Identity Platform API**
4. Click **Enable**

### Step 6: Update App Configuration

The app is already configured! Just change one line in the code:

```typescript
// In frontend/app/auth/PhoneLogin.tsx
const IS_TEST_MODE = false; // Change from true to false
```

---

## 🧪 Testing Without Billing (Recommended for Development)

**Best approach:** Use test phone numbers (Step 2 above)

Benefits:
- ✅ No billing setup needed
- ✅ No SMS charges
- ✅ Instant OTP delivery
- ✅ Works exactly like production
- ✅ Perfect for demos and testing

Just add your phone numbers as test numbers in Firebase Console!

---

## 📱 Using Real SMS (Production)

Once you complete Steps 1, 4, and 5:

1. Update `IS_TEST_MODE = false` in `PhoneLogin.tsx`
2. User enters their real phone number
3. Firebase sends SMS with 6-digit code
4. User enters code
5. Authentication complete!

**Cost:** ~₹0.50 per SMS after 10,000 free verifications/month

---

## 🔧 Current Configuration

Your Firebase project: **sih-dec-2025**
- Project ID: `sih-dec-2025`
- Region: Default (Global)
- Database: `minerva1`

---

## ⚠️ Important Notes

1. **Expo Go Limitation:** Real SMS auth works best with:
   - Expo Development Build
   - Production build (EAS Build)
   - For Expo Go, use test phone numbers

2. **reCAPTCHA:** Firebase automatically handles this on web. For React Native, it uses SafetyNet (Android) and App Attest (iOS).

3. **Rate Limiting:** Firebase has built-in rate limiting to prevent abuse.

---

## 🐛 Troubleshooting

**Error: "quota exceeded"**
- Solution: Enable billing (Step 4)

**Error: "auth/invalid-app-credential"**
- Solution: Enable Identity Platform API (Step 5)

**Error: "reCAPTCHA verification failed"**
- Solution: Add your domain to Authorized Domains (Step 3)

**SMS not received**
- Check phone number format: +91XXXXXXXXXX
- Verify Phone Auth is enabled
- Check billing is active (for real numbers)
- Try test phone numbers instead

---

## 📞 Support

- Firebase Console: https://console.firebase.google.com/project/sih-dec-2025
- Firebase Phone Auth Docs: https://firebase.google.com/docs/auth/web/phone-auth
- Pricing: https://firebase.google.com/pricing

---

## ✅ Quick Test

After setup, test with:
1. Add `+919032017652` as test number with code `123456`
2. Keep `IS_TEST_MODE = true` in code
3. Login with your number
4. Enter `123456`
5. Should work instantly! 🎉
