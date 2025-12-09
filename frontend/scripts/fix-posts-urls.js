// Script to fix existing posts without mediaUrl/videoUrl
// Run this with: node fix-posts-urls.js

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'sih-dec-2025.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function fixPostsWithMissingUrls() {
  try {
    console.log('🔍 Searching for posts without URLs...');
    
    // Get all posts
    const postsSnapshot = await db.collection('posts').get();
    console.log(`📦 Found ${postsSnapshot.size} total posts`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    // Get all files from photos directory
    console.log('📸 Fetching files from Firebase Storage...');
    const [files] = await bucket.getFiles({ prefix: 'photos/' });
    console.log(`Found ${files.length} files in photos/ directory`);
    
    // Create a map of userId to their photo URLs
    const userPhotos = {};
    for (const file of files) {
      const fileName = file.name; // e.g., "photos/911234567890_1765278521997.jpg"
      const match = fileName.match(/photos\/([^_]+)_(\d+)\.(jpg|png|jpeg)/);
      
      if (match) {
        const userId = match[1];
        const timestamp = parseInt(match[2]);
        
        // Get public URL
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
        
        if (!userPhotos[userId]) {
          userPhotos[userId] = [];
        }
        
        userPhotos[userId].push({
          url: publicUrl,
          timestamp: timestamp,
          fileName: fileName
        });
      }
    }
    
    console.log('👥 Found photos for users:', Object.keys(userPhotos));
    
    // Sort each user's photos by timestamp
    for (const userId in userPhotos) {
      userPhotos[userId].sort((a, b) => a.timestamp - b.timestamp);
    }
    
    // Process each post
    const batch = db.batch();
    let batchCount = 0;
    
    for (const doc of postsSnapshot.docs) {
      const data = doc.data();
      const hasUrl = data.mediaUrl || data.videoUrl;
      
      if (!hasUrl) {
        const userId = data.userId;
        
        if (userPhotos[userId] && userPhotos[userId].length > 0) {
          // Assign the first available photo for this user
          const photo = userPhotos[userId].shift();
          
          console.log(`✅ Fixing post ${doc.id} for user ${userId}`);
          console.log(`   Adding URL: ${photo.url}`);
          
          batch.update(doc.ref, {
            mediaUrl: photo.url,
            videoUrl: photo.url,
            videoType: 'photo'
          });
          
          fixedCount++;
          batchCount++;
          
          // Commit batch every 500 operations
          if (batchCount >= 500) {
            await batch.commit();
            console.log(`💾 Committed batch of ${batchCount} updates`);
            batchCount = 0;
          }
        } else {
          console.log(`⚠️ No photos available for user ${userId}, skipping post ${doc.id}`);
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }
    
    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`💾 Committed final batch of ${batchCount} updates`);
    }
    
    console.log('\n✨ Migration complete!');
    console.log(`✅ Fixed: ${fixedCount} posts`);
    console.log(`⏭️ Skipped: ${skippedCount} posts`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the migration
fixPostsWithMissingUrls();
