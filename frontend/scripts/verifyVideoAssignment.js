/**
 * Verify Video Assignment for Miner
 * Run: node scripts/verifyVideoAssignment.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, getDoc } = require('firebase/firestore');

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

const SUPERVISOR_ID = '1234567892';
const MINER_ID = '1234567890';

async function verifyVideoAssignment() {
  console.log('🔍 Verifying Video Assignment System\n');
  console.log('━'.repeat(70));
  
  try {
    // 1. Check if miner user exists
    console.log('\n1️⃣  CHECKING MINER USER');
    const minerRef = doc(db, 'users', MINER_ID);
    const minerSnap = await getDoc(minerRef);
    
    if (minerSnap.exists()) {
      const minerData = minerSnap.data();
      console.log('   ✅ Miner exists');
      console.log('   📋 Name:', minerData.name);
      console.log('   📋 Phone:', minerData.phoneNumber);
      console.log('   📋 Role:', minerData.role);
      console.log('   📋 SupervisorId:', minerData.supervisorId);
    } else {
      console.log('   ❌ Miner NOT found');
      return;
    }
    
    // 2. Check if supervisor exists
    console.log('\n2️⃣  CHECKING SUPERVISOR');
    const supervisorRef = doc(db, 'users', SUPERVISOR_ID);
    const supervisorSnap = await getDoc(supervisorRef);
    
    if (supervisorSnap.exists()) {
      const supervisorData = supervisorSnap.data();
      console.log('   ✅ Supervisor exists');
      console.log('   📋 Name:', supervisorData.name);
      console.log('   📋 Assigned Miners:', supervisorData.assignedMiners);
    } else {
      console.log('   ❌ Supervisor NOT found');
      return;
    }
    
    // 3. Check video assignments for this miner
    console.log('\n3️⃣  CHECKING VIDEO ASSIGNMENTS');
    const assignmentsRef = collection(db, 'videoAssignments');
    const assignmentsQuery = query(
      assignmentsRef,
      where('assignedTo', 'array-contains', MINER_ID),
      where('status', '==', 'active')
    );
    
    const assignmentsSnap = await getDocs(assignmentsQuery);
    console.log(`   📊 Found ${assignmentsSnap.size} active assignment(s)`);
    
    if (assignmentsSnap.empty) {
      console.log('   ⚠️  No assignments found for this miner');
      console.log('\n💡 TO CREATE ASSIGNMENT:');
      console.log('   1. Login as supervisor (+911234567892, OTP: 111111)');
      console.log('   2. Go to Smart Work Assignment');
      console.log('   3. Enter work description and assign to miner');
    } else {
      console.log('\n   📝 Assignment Details:');
      
      for (const assignmentDoc of assignmentsSnap.docs) {
        const assignmentData = assignmentDoc.data();
        console.log('\n   ' + '─'.repeat(60));
        console.log('   📄 Assignment ID:', assignmentDoc.id);
        console.log('   🎬 Video ID:', assignmentData.videoId);
        console.log('   📚 Topic:', assignmentData.videoTopic || assignmentData.workTitle);
        console.log('   👥 Assigned To:', assignmentData.assignedTo);
        console.log('   👤 Assigned By:', assignmentData.assignedBy);
        console.log('   📅 Deadline:', assignmentData.deadline ? new Date(assignmentData.deadline.toMillis()).toLocaleDateString() : 'N/A');
        console.log('   ⚡ Status:', assignmentData.status);
        
        // 4. Check if video exists in videoLibrary
        console.log('\n   🔍 Checking video in library...');
        const videoRef = doc(db, 'videoLibrary', assignmentData.videoId);
        const videoSnap = await getDoc(videoRef);
        
        if (videoSnap.exists()) {
          const videoData = videoSnap.data();
          console.log('   ✅ Video exists in library');
          console.log('   📋 Title:', videoData.topic);
          console.log('   🌐 Language:', videoData.language);
          console.log('   🔗 Video URL:', videoData.videoUrl ? '✓ Present' : '✗ Missing');
        } else {
          console.log('   ❌ Video NOT found in library');
          console.log('   ⚠️  This assignment won\'t appear for the miner!');
        }
        
        // 5. Check assignment progress
        console.log('\n   📊 Checking progress...');
        const progressRef = doc(db, 'assignmentProgress', `${assignmentDoc.id}_${MINER_ID}`);
        const progressSnap = await getDoc(progressRef);
        
        if (progressSnap.exists()) {
          const progressData = progressSnap.data();
          console.log('   📈 Progress:', progressData.progress || 0, '%');
          console.log('   ✓ Watched:', progressData.watched || false);
          console.log('   📅 Completed At:', progressData.completedAt ? new Date(progressData.completedAt.toMillis()).toLocaleString() : 'Not completed');
        } else {
          console.log('   📝 No progress yet (video not started)');
        }
      }
    }
    
    // 6. Check notifications
    console.log('\n4️⃣  CHECKING NOTIFICATIONS');
    const notificationsRef = collection(db, 'notifications');
    const notificationsQuery = query(
      notificationsRef,
      where('recipientId', '==', MINER_ID),
      where('type', '==', 'video_assignment')
    );
    
    const notificationsSnap = await getDocs(notificationsQuery);
    console.log(`   📬 Found ${notificationsSnap.size} video assignment notification(s)`);
    
    if (!notificationsSnap.empty) {
      const latestNotif = notificationsSnap.docs[0].data();
      console.log('   📩 Latest:', latestNotif.title);
      console.log('   📝 Message:', latestNotif.message);
      console.log('   ✉️  Read:', latestNotif.read ? 'Yes' : 'No');
    }
    
    // 7. Summary
    console.log('\n' + '━'.repeat(70));
    console.log('\n📊 SUMMARY:');
    console.log(`   👤 Miner: ${minerSnap.exists() ? '✅' : '❌'}`);
    console.log(`   👷 Supervisor: ${supervisorSnap.exists() ? '✅' : '❌'}`);
    console.log(`   📋 Assignments: ${assignmentsSnap.size}`);
    console.log(`   📬 Notifications: ${notificationsSnap.size}`);
    
    if (assignmentsSnap.size > 0) {
      console.log('\n✅ System is working! Miner should see assignments.');
      console.log('\n📱 TO VIEW ON APP:');
      console.log('   1. Login as miner (+911234567890, OTP: 222222)');
      console.log('   2. Go to Miner Dashboard');
      console.log('   3. Click "Watch Video" button');
      console.log('   4. Assigned videos will be listed');
    } else {
      console.log('\n⚠️  No assignments yet. Create one from supervisor dashboard.');
    }
    
    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

verifyVideoAssignment();
