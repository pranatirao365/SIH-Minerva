# Video Distribution Script

This script distributes the 10 local demo videos from `assets/videos/reels/` to test miners in Firebase, making them appear as if miners uploaded them.

## 📋 Prerequisites

1. Node.js installed
2. Firebase credentials configured
3. 10 video files in `frontend/assets/videos/reels/`:
   - `emergency_exit_procedure_20251207_174801.mp4`
   - `mining_related_diseases_20251208_163507.mp4`
   - `test_video_generation_20251208_093146.mp4`
   - `proper_ventilation_systems_20251207_204747.mp4`
   - `the_tipper_content_should_be_unloaded_20251207_220332.mp4`
   - `VID-20251209-WA0001.mp4`
   - `VID-20251209-WA0002.mp4`
   - `VID-20251209-WA0003.mp4`
   - `VID-20251209-WA0004.mp4`
   - `VID-20251209-WA0005.mp4`

## 🚀 Running the Script

### Step 1: Navigate to frontend directory
```powershell
cd frontend
```

### Step 2: Install dependencies (if not already installed)
```powershell
npm install firebase
```

### Step 3: Run the distribution script
```powershell
node scripts/distributeReelsToMiners.js
```

## 📊 What the Script Does

1. **Creates demo users** (if they don't exist):
   - safety_officer_1
   - health_expert_1
   - trainer_amit
   - engineer_sunita
   - supervisor_vikram
   - miner_arjun
   - miner_pooja
   - miner_ravi
   - miner_meera
   - miner_deepak

2. **Distributes 10 videos** across 10 test miners:
   - Each video gets: userId, userName, caption, hashtags
   - Videos are marked with `isAssetVideo: true`
   - VideoUrl uses special `asset://` prefix for local loading
   - All videos pre-approved: `moderationStatus: 'approved'`

3. **Creates Firebase posts** in `posts` collection:
   - Real-time sync enabled
   - Appears in all users' Reels feed
   - Social features work (likes, comments, shares)

## 📱 How Videos Load in App

1. **Reels.tsx loads posts** from Firebase
2. **Detects asset videos** by `isAssetVideo` flag
3. **Maps `asset://` URLs** to local `require()` statements
4. **Displays seamlessly** with Firebase videos
5. **Social interactions** work with optimistic updates

## 🔄 Video-User Mapping

| Video | Assigned To | Count |
|-------|-------------|-------|
| emergency_exit_procedure... | Miner Arun Singh (800000001) | 1 |
| mining_related_diseases... | Miner Rakesh Sharma (800000002) | 1 |
| test_video_generation... | Miner Rakesh Sharma (800000002) | 1 |
| proper_ventilation_systems... | Miner Mahesh Reddy (800000003) | 1 |
| the_tipper_content... | Miner Deepak Verma (800000004) | 1 |
| VID-20251209-WA0001 | Miner Imran Khan (800000005) | 1 |
| VID-20251209-WA0002 | Miner Imran Khan (800000005) | 1 |
| VID-20251209-WA0003 | Miner Harish Kumar (800000006) | 1 |
| VID-20251209-WA0004 | Miner Vijay Patil (800000007) | 1 |
| VID-20251209-WA0005 | Miner Santosh Rao (800000008) | 1 |

## ✅ Expected Output

```
🎬 Distributing Reels to Test Miners
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 Ensuring demo users exist...

✅ Created demo user: Safety Officer Rajesh
✅ Created demo user: Dr. Priya Sharma
...

📤 Uploading reels to Firebase...

✅ Reel 1/10: emergency_exit_procedure_20251207_174801.mp4
   Uploaded by: Miner Arun Singh
   Post ID: abc123xyz
   Caption: 🚨 Emergency Exit Procedures - Know your escape routes...

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Successfully uploaded 10 reels!

📊 Distribution Summary:

Reels per miner:
   Miner Arun Singh: 1 reel(s)
   Miner Rakesh Sharma: 2 reel(s)
   Miner Mahesh Reddy: 1 reel(s)
   Miner Deepak Verma: 1 reel(s)
   Miner Imran Khan: 2 reel(s)
   Miner Harish Kumar: 1 reel(s)
   Miner Vijay Patil: 1 reel(s)
   Miner Santosh Rao: 1 reel(s)

💡 These videos will now appear in the Reels feed for all users
💡 Videos are loaded from local assets (no Firebase Storage needed)
```

## 🔧 Troubleshooting

### Issue: "User not found"
**Solution**: Run the script again, it will create missing users automatically.

### Issue: "Cannot find module 'firebase'"
**Solution**: Run `npm install firebase` in frontend directory.

### Issue: "Videos not appearing in app"
**Solution**: 
1. Check Firestore `posts` collection for new documents
2. Verify `isAssetVideo: true` field exists
3. Restart the app to refresh Firebase connection

### Issue: "Permission denied"
**Solution**: Check Firebase Firestore rules allow writes:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🎯 Next Steps After Running

1. **Login to app** as any test user
2. **Navigate to Reels** tab
3. **Verify videos appear** with miner names
4. **Test social features**:
   - Like videos ❤️
   - Save videos 💾
   - Share videos 📤
   - Comment on videos 💬
5. **Upload new video** as miner to test AI moderation

## 🧹 Cleanup (Optional)

To remove all distributed videos and start fresh:

```javascript
// Create scripts/cleanupDistributedReels.js
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc, doc } = require('firebase/firestore');

// ... firebase config ...

async function cleanup() {
  const db = getFirestore(app, 'minerva1');
  const q = query(collection(db, 'posts'), where('isAssetVideo', '==', true));
  const snapshot = await getDocs(q);
  
  for (const document of snapshot.docs) {
    await deleteDoc(doc(db, 'posts', document.id));
    console.log(`Deleted: ${document.id}`);
  }
  
  console.log(`✅ Deleted ${snapshot.size} asset videos`);
}

cleanup();
```

Run: `node scripts/cleanupDistributedReels.js`

## 📝 Notes

- **No Firebase Storage upload needed** - videos load from local assets
- **Pre-approved content** - bypasses AI moderation for demo
- **Demo users** vs **Test users** - Different account types with different OTPs
- **Optimistic UI** - Social features update instantly
- **Real-time sync** - All users see videos immediately

## 🔗 Related Files

- `frontend/app/miner/Reels.tsx` - Main reels feed
- `frontend/services/videoModerationService.ts` - AI moderation
- `frontend/app/miner/UploadContent.tsx` - Upload with moderation
- `frontend/config/firebase.ts` - Firebase configuration
- `frontend/assets/videos/reels/` - Local video files
