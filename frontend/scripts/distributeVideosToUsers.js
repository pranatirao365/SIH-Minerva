/**
 * Distribute Demo Videos to Test Users
 * This script uploads the demo videos to Firebase as if test users uploaded them
 * Run: node scripts/distributeVideosToUsers.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc } = require('firebase/firestore');

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

// Test users who will "upload" these videos
const testUsers = [
  { id: '1234567890', name: 'Miner Test User' },
  { id: '800000001', name: 'Miner Arun Singh' },
  { id: '800000002', name: 'Miner Rakesh Sharma' },
  { id: '800000003', name: 'Miner Mahesh Reddy' },
  { id: '800000004', name: 'Miner Deepak Verma' },
  { id: '800000005', name: 'Miner Imran Khan' },
  { id: '800000006', name: 'Miner Harish Kumar' },
  { id: '800000007', name: 'Miner Vijay Patil' },
];

// Demo videos to distribute (these are the local videos we had)
const demoVideos = [
  {
    caption: '🚨 Emergency Response Training - Quick evacuation procedures for underground mining emergencies #SafetyFirst #Mining',
    videoUrl: require('../../assets/videos/emergency_response.mp4'),
    hashtags: ['SafetyFirst', 'Mining', 'Emergency', 'Training'],
  },
  {
    caption: '👷‍♂️ Proper PPE Equipment Usage - Essential safety gear every miner must wear #PPE #SafetyGear',
    videoUrl: require('../../assets/videos/ppe_training.mp4'),
    hashtags: ['PPE', 'SafetyGear', 'Mining', 'Protection'],
  },
  {
    caption: '⚠️ Hazard Identification - Learn to spot potential dangers in mining sites #HazardAwareness #SafetyTraining',
    videoUrl: require('../../assets/videos/hazard_awareness.mp4'),
    hashtags: ['HazardAwareness', 'SafetyTraining', 'Mining'],
  },
  {
    caption: '💪 Health & Wellness - Maintaining physical fitness for demanding mining work #HealthFirst #Fitness',
    videoUrl: require('../../assets/videos/health_wellness.mp4'),
    hashtags: ['HealthFirst', 'Fitness', 'Wellness', 'Mining'],
  },
  {
    caption: '🔧 Equipment Safety - Proper handling of mining tools and machinery #EquipmentSafety #Tools',
    videoUrl: require('../../assets/videos/equipment_safety.mp4'),
    hashtags: ['EquipmentSafety', 'Tools', 'Mining', 'Machinery'],
  },
  {
    caption: '🌡️ Heat Stress Prevention - Staying safe in high-temperature mining environments #HeatSafety #Prevention',
    videoUrl: require('../../assets/videos/heat_stress.mp4'),
    hashtags: ['HeatSafety', 'Prevention', 'Mining', 'Health'],
  },
  {
    caption: '🔦 Lighting Best Practices - Ensuring proper visibility in underground mines #Lighting #Visibility',
    videoUrl: require('../../assets/videos/lighting_safety.mp4'),
    hashtags: ['Lighting', 'Visibility', 'Mining', 'Safety'],
  },
  {
    caption: '🚧 Ground Control - Preventing rock falls and maintaining stable working areas #GroundControl #Safety',
    videoUrl: require('../../assets/videos/ground_control.mp4'),
    hashtags: ['GroundControl', 'Safety', 'Mining', 'Prevention'],
  },
];

async function distributeVideos() {
  console.log('📤 Distributing demo videos to test users...\n');
  console.log('━'.repeat(70));
  
  try {
    let videoIndex = 0;
    
    for (const video of demoVideos) {
      // Assign to a user (rotate through users)
      const user = testUsers[videoIndex % testUsers.length];
      
      // Check if user exists
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (!userDoc.exists()) {
        console.log(`⚠️  User ${user.id} not found, skipping...`);
        videoIndex++;
        continue;
      }
      
      const userData = userDoc.data();
      
      // Create post as if this user uploaded it
      const postData = {
        userId: user.id,
        userName: userData.name || user.name,
        userRole: userData.role || 'miner',
        userPhone: userData.phoneNumber || userData.phone,
        videoType: 'video',
        videoUrl: video.videoUrl, // Will use local require path
        caption: video.caption,
        hashtags: video.hashtags,
        likedBy: [],
        savedBy: [],
        comments: [],
        shares: 0,
        views: 0,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        status: 'active',
        moderationStatus: 'approved', // Pre-approved demo content
        moderatedAt: serverTimestamp(),
        moderatedBy: 'system',
      };
      
      const docRef = await addDoc(collection(db, 'posts'), postData);
      console.log(`✅ Video ${videoIndex + 1} uploaded by ${user.name}`);
      console.log(`   Post ID: ${docRef.id}`);
      console.log(`   Caption: ${video.caption.substring(0, 50)}...`);
      console.log('');
      
      videoIndex++;
    }
    
    console.log('━'.repeat(70));
    console.log(`\n✅ Successfully distributed ${demoVideos.length} videos!`);
    console.log('\n📱 All miners can now see these videos in their Reels feed');
    console.log('💡 These videos appear as if uploaded by test miners');
    console.log('\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

distributeVideos();
