# Firebase Storage Setup Guide

## Error: "A required service account is missing"

This error occurs when Firebase Storage doesn't have the proper service account linked. Here's how to fix it:

## Solution 1: Enable Firebase Storage (Recommended)

1. **Go to Firebase Console**: https://console.firebase.google.com/project/sih-dec-2025/storage

2. **Enable Storage**:
   - Click "Get Started"
   - Choose a storage location (e.g., asia-south1 for India)
   - Click "Done"

3. **Update Storage Rules**:
   - Go to the "Rules" tab
   - Replace with these rules:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```
   - Click "Publish"

4. **Enable Billing (if needed)**:
   - Some Firebase features require Blaze plan
   - Go to: https://console.firebase.google.com/project/sih-dec-2025/usage/details
   - Upgrade to Blaze plan (pay-as-you-go, but has free tier)

## Solution 2: Use Fallback Mode (Temporary)

The app now includes a fallback mechanism:
- If Firebase Storage is not configured, posts will be saved with local URIs
- Posts will work on the same device but won't be visible to other users
- You'll see a warning alert when uploading

## Solution 3: Alternative Storage Services

If you can't enable Firebase Storage, consider:

1. **Cloudinary**: Free tier with 25GB storage
   - Sign up at: https://cloudinary.com
   - Get API credentials
   - Update upload code to use Cloudinary SDK

2. **AWS S3**: Requires AWS account
   - More complex setup but very reliable
   - Good for production apps

3. **ImgBB**: Free image hosting
   - Simple API
   - Good for images only (not videos)

## Current Workaround

The app will now:
✅ Try to upload to Firebase Storage
❌ If it fails (service account error), it will:
   - Show a warning alert
   - Save the post with local URI
   - Post will only be visible on the same device

## To Test After Setup

1. Login to the app
2. Go to Upload Content
3. Select a photo/video
4. Add caption and upload
5. Check if you see the "Storage Setup Required" alert
6. If no alert = Firebase Storage is working! 🎉

## Need Help?

Contact your Firebase project admin to:
- Enable Firebase Storage
- Set up proper IAM permissions
- Configure storage rules

---

**Note**: For production use, always configure Firebase Storage properly. The fallback mode is only for development/testing.
