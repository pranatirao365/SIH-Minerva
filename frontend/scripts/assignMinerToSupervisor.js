/**
 * Assign Miner to Supervisor in Firebase
 * Run: node scripts/assignMinerToSupervisor.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } = require('firebase/firestore');

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

async function assignMinerToSupervisor() {
  console.log('🔗 Assigning miner to supervisor...\n');
  
  try {
    // Check if supervisor exists
    const supervisorRef = doc(db, 'users', SUPERVISOR_ID);
    const supervisorSnap = await getDoc(supervisorRef);
    
    if (!supervisorSnap.exists()) {
      console.log(`⚠️  Supervisor ${SUPERVISOR_ID} not found. Creating...`);
      await setDoc(supervisorRef, {
        name: 'Supervisor Test User',
        phone: '+911234567892',
        phoneNumber: '+911234567892', // For query compatibility
        role: 'supervisor',
        empId: 'SUP_' + SUPERVISOR_ID,
        department: 'Operations',
        
        // Assigned miners
        assignedMiners: [MINER_ID],
        
        // Social profile
        followers: [],
        following: [],
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        likesCount: 0,
        bio: 'Test supervisor account',
        avatar: null,
        
        createdAt: new Date(),
        createdBy: 'assignment_script',
        status: 'active',
      });
      console.log('✅ Supervisor created with assigned miner\n');
    } else {
      // Update existing supervisor - add phoneNumber field if missing
      await updateDoc(supervisorRef, {
        assignedMiners: arrayUnion(MINER_ID),
        phoneNumber: '+911234567892' // Ensure phoneNumber field exists
      });
      console.log('✅ Miner assigned to existing supervisor\n');
    }
    
    // Check if miner exists
    const minerRef = doc(db, 'users', MINER_ID);
    const minerSnap = await getDoc(minerRef);
    
    if (!minerSnap.exists()) {
      console.log(`⚠️  Miner ${MINER_ID} not found. Creating...`);
      await setDoc(minerRef, {
        name: 'Miner Test User',
        phone: '+911234567890',
        phoneNumber: '+911234567890', // For query compatibility
        role: 'miner',
        department: 'Mining Operations',
        
        // Supervisor assignment
        supervisorId: SUPERVISOR_ID,
        
        // Social profile
        followers: [],
        following: [],
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        likesCount: 0,
        bio: 'Test miner account',
        avatar: null,
        
        createdAt: new Date(),
        createdBy: 'assignment_script',
        status: 'active',
      });
      console.log('✅ Miner created with supervisor assignment\n');
    } else {
      // Update existing miner - add phoneNumber field if missing
      await updateDoc(minerRef, {
        supervisorId: SUPERVISOR_ID,
        phoneNumber: '+911234567890' // Ensure phoneNumber field exists
      });
      console.log('✅ Supervisor assigned to existing miner\n');
    }
    
    console.log('━'.repeat(60));
    console.log('✨ Assignment Complete!\n');
    console.log(`👷 Supervisor: ${SUPERVISOR_ID}`);
    console.log(`⛏️  Miner: ${MINER_ID}`);
    console.log('\nRelationship established:');
    console.log(`  • Supervisor has miner in assignedMiners array`);
    console.log(`  • Miner has supervisorId field set`);
    console.log('━'.repeat(60));
    
    // Verify the relationship
    const updatedSupervisor = await getDoc(supervisorRef);
    const updatedMiner = await getDoc(minerRef);
    
    console.log('\n📋 Verification:');
    console.log(`  Supervisor's assignedMiners:`, updatedSupervisor.data()?.assignedMiners || []);
    console.log(`  Miner's supervisorId:`, updatedMiner.data()?.supervisorId || 'none');
    console.log('\n✅ Ready to assign work and track progress!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignMinerToSupervisor();
