/**
 * Firebase Video URL Migration Script
 * Migrates all video URLs from sihtut-1 bucket to sih-dec-2025 bucket
 * 
 * Run with: node migrate-video-urls.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./new-serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sih-dec-2025-default-rtdb.firebaseio.com',
  storageBucket: 'sih-dec-2025.firebasestorage.app'
});

const db = admin.firestore();
const oldBucket = 'sihtut-1.firebasestorage.app';
const newBucket = 'sih-dec-2025.firebasestorage.app';

// Use the minerva1 database
const minervaDb = admin.firestore();

/**
 * Update video URLs in the videoLibrary collection
 */
async function migrateVideoLibraryURLs() {
  console.log('\n🔄 Migrating videoLibrary URLs...\n');
  
  try {
    const videosRef = minervaDb.collection('videoLibrary');
    const snapshot = await videosRef.get();
    
    if (snapshot.empty) {
      console.log('⚠️  No videos found in videoLibrary');
      return { updated: 0, skipped: 0 };
    }
    
    let updated = 0;
    let skipped = 0;
    const batch = minervaDb.batch();
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const videoUrl = data.videoUrl;
      
      if (!videoUrl) {
        console.log(`⏭️  Skipping ${doc.id} - no videoUrl`);
        skipped++;
        continue;
      }
      
      if (videoUrl.includes(oldBucket)) {
        const newUrl = videoUrl.replace(oldBucket, newBucket);
        console.log(`✏️  Updating ${doc.id}:`);
        console.log(`   OLD: ${videoUrl.substring(0, 80)}...`);
        console.log(`   NEW: ${newUrl.substring(0, 80)}...`);
        
        batch.update(doc.ref, { videoUrl: newUrl });
        updated++;
        batchCount++;
        
        // Commit batch every 500 operations (Firestore limit)
        if (batchCount === 500) {
          await batch.commit();
          console.log(`\n✅ Committed batch of ${batchCount} updates\n`);
          batchCount = 0;
        }
      } else if (videoUrl.includes(newBucket)) {
        console.log(`✓  ${doc.id} - already using new bucket`);
        skipped++;
      } else {
        console.log(`⚠️  ${doc.id} - URL doesn't match expected patterns`);
        console.log(`   URL: ${videoUrl.substring(0, 80)}...`);
        skipped++;
      }
    }
    
    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`\n✅ Committed final batch of ${batchCount} updates\n`);
    }
    
    return { updated, skipped };
  } catch (error) {
    console.error('❌ Error migrating videoLibrary:', error);
    throw error;
  }
}

/**
 * Update thumbnail URLs in the videoLibrary collection
 */
async function migrateThumbnailURLs() {
  console.log('\n🔄 Migrating thumbnail URLs...\n');
  
  try {
    const videosRef = minervaDb.collection('videoLibrary');
    const snapshot = await videosRef.get();
    
    if (snapshot.empty) {
      console.log('⚠️  No videos found');
      return { updated: 0, skipped: 0 };
    }
    
    let updated = 0;
    let skipped = 0;
    const batch = minervaDb.batch();
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const thumbnailUrl = data.thumbnailUrl;
      
      if (!thumbnailUrl) {
        skipped++;
        continue;
      }
      
      if (thumbnailUrl.includes(oldBucket)) {
        const newUrl = thumbnailUrl.replace(oldBucket, newBucket);
        console.log(`✏️  Updating thumbnail for ${doc.id}`);
        
        batch.update(doc.ref, { thumbnailUrl: newUrl });
        updated++;
        batchCount++;
        
        if (batchCount === 500) {
          await batch.commit();
          console.log(`\n✅ Committed batch of ${batchCount} updates\n`);
          batchCount = 0;
        }
      } else {
        skipped++;
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
      console.log(`\n✅ Committed final batch of ${batchCount} updates\n`);
    }
    
    return { updated, skipped };
  } catch (error) {
    console.error('❌ Error migrating thumbnails:', error);
    throw error;
  }
}

/**
 * Check for any other collections that might have old bucket references
 */
async function checkOtherCollections() {
  console.log('\n🔍 Checking other collections for bucket references...\n');
  
  const collectionsToCheck = [
    'incidents',
    'videoRequests',
    'videoAnalytics'
  ];
  
  for (const collectionName of collectionsToCheck) {
    try {
      const snapshot = await minervaDb.collection(collectionName).limit(10).get();
      
      if (snapshot.empty) {
        console.log(`⏭️  ${collectionName} - empty or doesn't exist`);
        continue;
      }
      
      let foundOldBucket = false;
      snapshot.docs.forEach(doc => {
        const data = JSON.stringify(doc.data());
        if (data.includes(oldBucket)) {
          foundOldBucket = true;
        }
      });
      
      if (foundOldBucket) {
        console.log(`⚠️  ${collectionName} - contains references to old bucket`);
      } else {
        console.log(`✓  ${collectionName} - no old bucket references found`);
      }
    } catch (error) {
      console.log(`⚠️  ${collectionName} - error checking: ${error.message}`);
    }
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   Firebase Storage URL Migration Script       ║');
  console.log('║   From: sihtut-1.firebasestorage.app         ║');
  console.log('║   To:   sih-dec-2025.firebasestorage.app     ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  try {
    // Migrate video URLs
    const videoResults = await migrateVideoLibraryURLs();
    console.log('\n📊 Video URL Migration Results:');
    console.log(`   ✅ Updated: ${videoResults.updated}`);
    console.log(`   ⏭️  Skipped: ${videoResults.skipped}`);
    
    // Migrate thumbnail URLs
    const thumbnailResults = await migrateThumbnailURLs();
    console.log('\n📊 Thumbnail URL Migration Results:');
    console.log(`   ✅ Updated: ${thumbnailResults.updated}`);
    console.log(`   ⏭️  Skipped: ${thumbnailResults.skipped}`);
    
    // Check other collections
    await checkOtherCollections();
    
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   ✅ Migration Complete!                       ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    console.log('📝 Summary:');
    console.log(`   • Video URLs updated: ${videoResults.updated}`);
    console.log(`   • Thumbnail URLs updated: ${thumbnailResults.updated}`);
    console.log(`   • Total updates: ${videoResults.updated + thumbnailResults.updated}`);
    console.log('\n🚀 Next Steps:');
    console.log('   1. Rebuild the app: npx expo prebuild --clean');
    console.log('   2. Run on device: npx expo run:android (or ios)');
    console.log('   3. Test video playback in Assigned Videos');
    console.log('   4. Verify Watch Videos shows completed videos\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run migration
main();
