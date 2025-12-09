/**
 * Distribute Asset Videos to Test Miners
 * This uploads local reel videos to Firebase as if miners uploaded them
 * Run: node scripts/distributeReelsToMiners.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, setDoc } = require('firebase/firestore');

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

// Videos from assets/videos/reels/ - distributed to miners
const reelVideos = [
  {
    userId: '800000001', // Miner Arun Singh
    userName: 'Miner Arun Singh',
    caption: '🚨 Emergency Exit Procedures - Know your escape routes! Every second counts in an emergency. Stay prepared, stay safe! 🏃‍♂️ #EmergencyPrep #MiningSafety #SafetyFirst',
    videoFileName: 'emergency_exit_procedure_20251207_174801.mp4',
    hashtags: ['EmergencyPrep', 'MiningSafety', 'SafetyFirst'],
  },
  {
    userId: '800000002', // Miner Rakesh Sharma
    userName: 'Miner Rakesh Sharma',
    caption: '⚕️ Mining Related Diseases - Prevention is better than cure! Learn about occupational health risks and how to protect yourself. Your health matters! 💪 #MiningHealth #OccupationalSafety #HealthAwareness',
    videoFileName: 'mining_related_diseases_20251208_163507.mp4',
    hashtags: ['MiningHealth', 'OccupationalSafety', 'HealthAwareness'],
  },
  {
    userId: '800000002', // Rakesh uploads another
    userName: 'Miner Rakesh Sharma',
    caption: '🦺 PPE & Basic Tools - Your first line of defense! Always wear proper protective equipment. Helmet, boots, gloves, and more. Safety never takes a day off! ✅ #PPE #SafetyGear #ProtectiveEquipment',
    videoFileName: 'test_video_generation_20251208_093146.mp4',
    hashtags: ['PPE', 'SafetyGear', 'ProtectiveEquipment'],
  },
  {
    userId: '800000003', // Miner Mahesh Reddy
    userName: 'Miner Mahesh Reddy',
    caption: '💨 Proper Ventilation Systems - Fresh air saves lives! Understanding ventilation is crucial for underground safety. Breathe easy, work safely! 🌬️ #Ventilation #AirQuality #MineSafety',
    videoFileName: 'proper_ventilation_systems_20251207_204747.mp4',
    hashtags: ['Ventilation', 'AirQuality', 'MineSafety'],
  },
  {
    userId: '800000004', // Miner Deepak Verma
    userName: 'Miner Deepak Verma',
    caption: '🚛 Tipper Safety Protocol - Safe unloading procedures prevent accidents! Watch how proper technique saves lives. Follow the guidelines always! ⚠️ #TipperSafety #LoadManagement #SafetyProtocol',
    videoFileName: 'the_tipper_content_should_be_unloaded_20251207_220332.mp4',
    hashtags: ['TipperSafety', 'LoadManagement', 'SafetyProtocol'],
  },
  {
    userId: '800000005', // Miner Imran Khan
    userName: 'Miner Imran Khan',
    caption: '⛏️ Daily safety check complete! Started my shift with proper inspection. Remember: Safety is not by accident, it\'s by choice! 🔒 #DailyCheck #MinerLife #SafetyFirst',
    videoFileName: 'VID-20251209-WA0001.mp4',
    hashtags: ['DailyCheck', 'MinerLife', 'SafetyFirst'],
  },
  {
    userId: '800000005', // Imran uploads another
    userName: 'Miner Imran Khan',
    caption: '🎯 Training completed! Level up with new safety certifications. Knowledge is power, safety is priority! 📚 #SafetyTraining #SkillDevelopment #MinerEducation',
    videoFileName: 'VID-20251209-WA0002.mp4',
    hashtags: ['SafetyTraining', 'SkillDevelopment', 'MinerEducation'],
  },
  {
    userId: '800000006', // Miner Harish Kumar
    userName: 'Miner Harish Kumar',
    caption: '🔦 Underground operations today! Proper lighting and communication are essential. Stay alert, stay connected! 💡 #UndergroundMining #TeamWork #SafeOps',
    videoFileName: 'VID-20251209-WA0003.mp4',
    hashtags: ['UndergroundMining', 'TeamWork', 'SafeOps'],
  },
  {
    userId: '800000007', // Miner Vijay Patil
    userName: 'Miner Vijay Patil',
    caption: '👷‍♂️ Team coordination in action! When we work together, we work safer. Communication is key to zero accidents! 🤝 #TeamCoordination #SafetyCollaboration #WorkTogether',
    videoFileName: 'VID-20251209-WA0004.mp4',
    hashtags: ['TeamCoordination', 'SafetyCollaboration', 'WorkTogether'],
  },
  {
    userId: '800000008', // Miner Santosh Rao
    userName: 'Miner Santosh Rao',
    caption: '⚙️ Equipment maintenance check! Well-maintained tools mean safer operations. Take care of your equipment, it takes care of you! 🔧 #Maintenance #ToolSafety #PreventiveCare',
    videoFileName: 'VID-20251209-WA0005.mp4',
    hashtags: ['Maintenance', 'ToolSafety', 'PreventiveCare'],
  },
];

async function ensureDemoUsers() {
  console.log('\n👥 Ensuring demo users exist...\n');
  
  const demoUsers = [
    { id: 'safety_officer_1', name: 'Safety Officer Rajesh', role: 'safety_officer' },
    { id: 'health_expert_1', name: 'Dr. Priya Sharma', role: 'engineer' },
    { id: 'trainer_amit', name: 'Trainer Amit Singh', role: 'supervisor' },
    { id: 'engineer_sunita', name: 'Engineer Sunita Devi', role: 'engineer' },
    { id: 'supervisor_vikram', name: 'Supervisor Vikram Rao', role: 'supervisor' },
    { id: 'miner_arjun', name: 'Arjun Kumar', role: 'miner' },
    { id: 'miner_pooja', name: 'Pooja Verma', role: 'miner' },
    { id: 'miner_ravi', name: 'Ravi Patel', role: 'miner' },
    { id: 'miner_meera', name: 'Meera Reddy', role: 'miner' },
    { id: 'miner_deepak', name: 'Deepak Joshi', role: 'miner' },
  ];
  
  for (const demoUser of demoUsers) {
    try {
      const userDoc = await getDoc(doc(db, 'users', demoUser.id));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', demoUser.id), {
          name: demoUser.name,
          role: demoUser.role,
          phone: `+91${demoUser.id.replace(/\D/g, '')}000`,
          phoneNumber: `+91${demoUser.id.replace(/\D/g, '')}000`,
          followers: [],
          following: [],
          postsCount: 0,
          followersCount: 0,
          followingCount: 0,
          likesCount: 0,
          bio: `Demo ${demoUser.role} account`,
          avatar: null,
          createdAt: serverTimestamp(),
        });
        console.log(`✅ Created demo user: ${demoUser.name}`);
      } else {
        console.log(`✓ User exists: ${demoUser.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating user ${demoUser.id}:`, error.message);
    }
  }
}

async function distributeReels() {
  console.log('🎬 Distributing Reels to Test Miners');
  console.log('━'.repeat(70));
  
  try {
    // Ensure demo users exist first
    await ensureDemoUsers();
    
    console.log('\n📤 Uploading reels to Firebase...\n');
    
    let uploadCount = 0;
    const timestamp = Date.now();
    
    for (let i = 0; i < reelVideos.length; i++) {
      const reel = reelVideos[i];
      
      // Check if user exists
      const userDoc = await getDoc(doc(db, 'users', reel.userId));
      if (!userDoc.exists()) {
        console.log(`⚠️  User ${reel.userId} not found, skipping...`);
        continue;
      }
      
      const userData = userDoc.data();
      
      // Create post with local video path (will be loaded from assets)
      const postData = {
        userId: reel.userId,
        userName: userData.name || reel.userName,
        userRole: userData.role || 'miner',
        userPhone: userData.phoneNumber || userData.phone,
        videoType: 'video',
        videoUrl: `asset://videos/reels/${reel.videoFileName}`, // Special prefix for asset videos
        caption: reel.caption,
        hashtags: reel.hashtags,
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
        isAssetVideo: true, // Flag to identify asset videos
      };
      
      const docRef = await addDoc(collection(db, 'posts'), postData);
      uploadCount++;
      
      console.log(`✅ Reel ${uploadCount}/${reelVideos.length}: ${reel.videoFileName}`);
      console.log(`   Uploaded by: ${userData.name}`);
      console.log(`   Post ID: ${docRef.id}`);
      console.log(`   Caption: ${reel.caption.substring(0, 60)}...`);
      console.log('');
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('━'.repeat(70));
    console.log(`\n✅ Successfully uploaded ${uploadCount} reels!`);
    console.log('\n📊 Distribution Summary:');
    
    // Count posts per user
    const userCounts = {};
    reelVideos.forEach(reel => {
      userCounts[reel.userId] = (userCounts[reel.userId] || 0) + 1;
    });
    
    console.log('\n📤 Reels uploaded by each miner:');
    console.log('   (These reels appear in EVERYONE\'s feed, but show the uploader\'s name)\n');
    for (const [userId, count] of Object.entries(userCounts)) {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userName = userDoc.exists() ? userDoc.data().name : userId;
      console.log(`   ${userName}: Uploaded ${count} reel(s)`);
    }
    
    console.log('\n✅ ALL 10 REELS VISIBLE TO ALL USERS');
    console.log('💡 Each reel displays the miner who uploaded it');
    console.log('💡 Videos are loaded from local assets (no Firebase Storage needed)');
    console.log('💡 Open the app and go to Reels to see all videos with uploader names');
    console.log('\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

distributeReels();
