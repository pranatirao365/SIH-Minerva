# 🧪 Add Test Users to Firestore

## Quick Setup Guide

Follow these steps to add 5 test users to your Firebase Firestore database.

---

## Method 1: Using Firebase Console (Manual)

### Step-by-Step:

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com
   - Select your project

2. **Navigate to Firestore**
   - Click "Firestore Database" in left sidebar
   - If you don't have a `users` collection, click "Start collection"
   - If you have it, open the `users` collection

3. **Add Each Test User**
   - Click "Add document" button
   - Enter the details below for each user

---

## Test Users to Add

### 1️⃣ Test Miner
```
Document ID: 911234567890

Fields:
  role: "miner"
  phone: "+911234567890"
  name: "Test Miner"
  createdAt: (Timestamp - current date)
```

### 2️⃣ Test Engineer
```
Document ID: 911234567891

Fields:
  role: "engineer"
  phone: "+911234567891"
  name: "Test Engineer"
  createdAt: (Timestamp - current date)
```

### 3️⃣ Test Supervisor
```
Document ID: 911234567892

Fields:
  role: "supervisor"
  phone: "+911234567892"
  name: "Test Supervisor"
  createdAt: (Timestamp - current date)
```

### 4️⃣ Test Safety Officer
```
Document ID: 911234567893

Fields:
  role: "safety_officer"
  phone: "+911234567893"
  name: "Test Safety Officer"
  createdAt: (Timestamp - current date)
```

### 5️⃣ Test Admin
```
Document ID: 911234567894

Fields:
  role: "admin"
  phone: "+911234567894"
  name: "Test Admin"
  createdAt: (Timestamp - current date)
```

---

## Method 2: Using Firebase Console (Fast Copy-Paste)

### Create JSON Documents:

For each user, click "Add document", switch to "JSON" mode and paste:

#### Miner (911234567890)
```json
{
  "role": "miner",
  "phone": "+911234567890",
  "name": "Test Miner",
  "createdAt": {"_seconds": 1732579200, "_nanoseconds": 0}
}
```

#### Engineer (911234567891)
```json
{
  "role": "engineer",
  "phone": "+911234567891",
  "name": "Test Engineer",
  "createdAt": {"_seconds": 1732579200, "_nanoseconds": 0}
}
```

#### Supervisor (911234567892)
```json
{
  "role": "supervisor",
  "phone": "+911234567892",
  "name": "Test Supervisor",
  "createdAt": {"_seconds": 1732579200, "_nanoseconds": 0}
}
```

#### Safety Officer (911234567893)
```json
{
  "role": "safety_officer",
  "phone": "+911234567893",
  "name": "Test Safety Officer",
  "createdAt": {"_seconds": 1732579200, "_nanoseconds": 0}
}
```

#### Admin (911234567894)
```json
{
  "role": "admin",
  "phone": "+911234567894",
  "name": "Test Admin",
  "createdAt": {"_seconds": 1732579200, "_nanoseconds": 0}
}
```

---

## Method 3: Using Firebase Admin SDK (Automated)

If you want to add all users at once, create a script:

```javascript
// addTestUsers.js
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const testUsers = [
  {
    id: '911234567890',
    role: 'miner',
    phone: '+911234567890',
    name: 'Test Miner'
  },
  {
    id: '911234567891',
    role: 'engineer',
    phone: '+911234567891',
    name: 'Test Engineer'
  },
  {
    id: '911234567892',
    role: 'supervisor',
    phone: '+911234567892',
    name: 'Test Supervisor'
  },
  {
    id: '911234567893',
    role: 'safety_officer',
    phone: '+911234567893',
    name: 'Test Safety Officer'
  },
  {
    id: '911234567894',
    role: 'admin',
    phone: '+911234567894',
    name: 'Test Admin'
  }
];

async function addTestUsers() {
  for (const user of testUsers) {
    await db.collection('users').doc(user.id).set({
      role: user.role,
      phone: user.phone,
      name: user.name,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ Added ${user.name} (${user.phone})`);
  }
  console.log('🎉 All test users added successfully!');
}

addTestUsers().then(() => process.exit());
```

Run with: `node addTestUsers.js`

---

## Testing Each Role

After adding all users, you can test each role:

| Phone Number | Enter in App | OTP | Role |
|-------------|--------------|-----|------|
| +911234567890 | 1234567890 | 123456 | Miner |
| +911234567891 | 1234567891 | 123456 | Engineer |
| +911234567892 | 1234567892 | 123456 | Supervisor |
| +911234567893 | 1234567893 | 123456 | Safety Officer |
| +911234567894 | 1234567894 | 123456 | Admin |

---

## Verification Checklist

After adding users, verify in Firebase Console:

- [ ] Collection `users` exists
- [ ] 5 documents created (911234567890 through 911234567894)
- [ ] Each document has `role`, `phone`, `name` fields
- [ ] Role values match exactly: `miner`, `engineer`, `supervisor`, `safety_officer`, `admin`
- [ ] Phone numbers have `+91` prefix

---

## Troubleshooting

### "User not found in database"
- Check document IDs are without `+` (e.g., `911234567890` not `+911234567890`)
- Verify `role` field exists and matches expected values
- Make sure you're in the correct Firebase project

### Wrong screen after login
- Check the `role` field value
- Valid roles: `miner`, `engineer`, `supervisor`, `safety_officer`, `admin`
- Role is case-sensitive!

### Test mode not working
- Verify `IS_TEST_MODE = true` in both PhoneLogin.tsx and OTPVerification.tsx
- Check phone number matches exactly (with +91)

---

## Security Reminder

⚠️ **Before Production:**
1. Delete all test users from Firestore
2. Set `IS_TEST_MODE = false` in both files
3. Remove test phone arrays from code

---

**Happy Testing! 🚀**

All test users use the same OTP: **123456**
