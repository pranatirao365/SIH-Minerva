/**
 * Add blasting safety reel to test miner's profile
 * Run: node scripts/addBlastingReelToTestMiner.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAJZRgI_Zpp2iyeqBvreMhQCzvFxfHL2W0",
  authDomain: "sih-dec-2025.firebaseapp.com",
  databaseURL: "https://sih-dec-2025-default-rtdb.firebaseio.com",
  projectId: "sih-dec-2025",
  storageBucket: "sih-dec-2025.firebasestorage.app",
  messagingSenderId: "163692260644",
  appId: "1:163692260644:web:6cc4eac7446557182317b1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'minerva1');

// Test miner ID (using phone number as ID)
const TEST_MINER_ID = '+1234567890';
const TEST_MINER_NAME = 'Test Miner';

async function addBlastingReel() {
  try {
    console.log('🎬 Adding blasting safety reel to test miner...');

    // Create reel document
    const reelData = {
      userId: TEST_MINER_ID,
      userName: TEST_MINER_NAME,
      userRole: 'miner',
      videoUrl: 'asset://videos/reels/VID-20251209-WA0001.mp4',
      isAssetVideo: true,
      caption: '🧨 Blasting Safety Procedures - Essential safety protocols for mining blast operations! Minimum safe distance, proper evacuation, and licensed handling only. Stay safe! 💥 #BlastingSafety #Mining #SafetyFirst',
      hashtags: ['BlastingSafety', 'Mining', 'SafetyFirst'],
      likes: 0,
      comments: [],
      shares: 0,
      views: 0,
      likedBy: [],
      savedBy: [],
      timestamp: serverTimestamp(),
    };

    // Add to reels collection
    const reelsRef = collection(db, 'reels');
    const docRef = await addDoc(reelsRef, reelData);
    console.log('✅ Reel added with ID:', docRef.id);

    // Update test miner's posts count
    const userRef = doc(db, 'users', TEST_MINER_ID);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      await updateDoc(userRef, {
        postsCount: increment(1),
      });
      const newCount = (userDoc.data().postsCount || 0) + 1;
      console.log('✅ Updated test miner posts count:', newCount);
    } else {
      console.log('⚠️ Test miner user document not found');
    }

    console.log('🎉 Blasting reel successfully added to test miner!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding blasting reel:', error);
    process.exit(1);
  }
}

addBlastingReel();
