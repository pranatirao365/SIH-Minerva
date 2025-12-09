# Setup Users in Firebase

## Option 1: Quick Setup - Use Firebase Console (Recommended) ✅

### Step-by-Step:

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/project/sih-dec-2025/firestore/databases/-default-/data/~2Fusers

2. **Create Users Collection:**
   - Click **Start collection**
   - Collection ID: `users`
   - Click **Next**

3. **Add Your First User:**
   - Document ID: `9032017652` (your phone without +91)
   - Click **Add field** for each:
     ```
     Field: name          Type: string    Value: Pranati Rao
     Field: role          Type: string    Value: miner
     Field: phone         Type: string    Value: 9032017652
     Field: email         Type: string    Value: pranati@example.com
     Field: department    Type: string    Value: Blasting
     Field: safetyScore   Type: number    Value: 95
     Field: totalPoints   Type: number    Value: 2500
     Field: joinedDate    Type: string    Value: 2025-12-09
     ```
   - Click **Save**

4. **Add More Users** (Optional - for testing leaderboard):
   - Click **Add document**
   - Document ID: `1234567890`
   - Fields:
     ```
     name: Rajesh Kumar
     role: miner
     phone: 1234567890
     department: Excavation
     safetyScore: 92
     totalPoints: 2200
     ```
   - Click **Save**
   - Repeat for more users

### Quick Test Users:

| Phone | Name | Role | OTP |
|-------|------|------|-----|
| +919032017652 | Pranati Rao | miner | 123456 |
| +911234567890 | Rajesh Kumar | miner | 123456 |
| +911234567891 | Amit Sharma | engineer | 123456 |
| +911234567892 | Suresh Patel | supervisor | 123456 |

---

## Option 2: Run Automated Script (Advanced)

### Prerequisites:
```bash
cd frontend
npm install -D ts-node typescript
```

### Run Script:
```bash
npx ts-node scripts/create-test-users.ts
```

This will automatically create 10 test users in Firestore.

---

## Option 3: Manual Import via Firebase Console

1. Go to: https://console.firebase.google.com/project/sih-dec-2025/firestore/databases/-default-/data
2. Click **Import**
3. Upload JSON file with user data

---

## ✅ Verify Users Created

After adding users:

1. Reload your app
2. The log should show:
   ```
   ✅ Users collection accessible
   Found X user(s)
   ```

3. Try logging in with:
   - Phone: `+919032017652`
   - OTP: `123456`
   - Should take you to Miner Dashboard

---

## 📋 Minimum Required Fields

For each user document:
```typescript
{
  phone: "9032017652",        // Required - without +91
  name: "User Name",          // Required
  role: "miner",              // Required - miner|engineer|supervisor|safety-officer|admin
  
  // Optional but recommended:
  department: "Blasting",
  safetyScore: 95,
  totalPoints: 2500,
  email: "user@example.com"
}
```

---

## 🎯 Next Steps

1. Add your user first (use Option 1)
2. Test login with your phone
3. Add more users later for testing leaderboard
4. Users can also self-register (if you implement signup flow)

---

## 🔧 Troubleshooting

**"No users found"**
- Make sure you're using database: `minerva1` (not default)
- Check document ID matches phone without +91
- Verify collection name is exactly `users`

**Login fails after adding user**
- Reload app completely
- Check Firestore rules allow read access
- Verify phone number format in document

**Can't find Firestore**
- Go to: https://console.firebase.google.com/project/sih-dec-2025/firestore
- If not created, click **Create database**
- Choose Production mode
- Select region (asia-south1 for India)
