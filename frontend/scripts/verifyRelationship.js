/**
 * Verify Supervisor-Miner Relationship
 * Run: node scripts/verifyRelationship.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');

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

async function verifyRelationship() {
  console.log('🔍 Verifying Supervisor-Miner Relationship\n');
  console.log('━'.repeat(60));
  
  try {
    // Check Supervisor
    console.log('\n👷 SUPERVISOR CHECK:');
    const supervisorRef = doc(db, 'users', SUPERVISOR_ID);
    const supervisorSnap = await getDoc(supervisorRef);
    
    if (supervisorSnap.exists()) {
      const supervisorData = supervisorSnap.data();
      console.log('  ✅ Supervisor exists');
      console.log('  📋 Data:', {
        name: supervisorData.name,
        phone: supervisorData.phone,
        phoneNumber: supervisorData.phoneNumber,
        role: supervisorData.role,
        empId: supervisorData.empId,
        department: supervisorData.department,
        assignedMiners: supervisorData.assignedMiners || []
      });
      
      // Test query by phoneNumber (what the context uses)
      if (supervisorData.phoneNumber) {
        console.log('\n  🔍 Testing query by phoneNumber...');
        const usersRef = collection(db, 'users');
        const supervisorQuery = query(
          usersRef,
          where('phoneNumber', '==', supervisorData.phoneNumber),
          where('role', '==', 'supervisor')
        );
        const queryResult = await getDocs(supervisorQuery);
        console.log(`  ${queryResult.empty ? '❌' : '✅'} Query result: ${queryResult.empty ? 'NOT FOUND' : 'FOUND'}`);
      }
    } else {
      console.log('  ❌ Supervisor NOT found');
    }
    
    // Check Miner
    console.log('\n⛏️  MINER CHECK:');
    const minerRef = doc(db, 'users', MINER_ID);
    const minerSnap = await getDoc(minerRef);
    
    if (minerSnap.exists()) {
      const minerData = minerSnap.data();
      console.log('  ✅ Miner exists');
      console.log('  📋 Data:', {
        name: minerData.name,
        phone: minerData.phone,
        phoneNumber: minerData.phoneNumber,
        role: minerData.role,
        department: minerData.department,
        supervisorId: minerData.supervisorId || 'none'
      });
    } else {
      console.log('  ❌ Miner NOT found');
    }
    
    // Verify relationship
    console.log('\n🔗 RELATIONSHIP VERIFICATION:');
    if (supervisorSnap.exists() && minerSnap.exists()) {
      const supervisorData = supervisorSnap.data();
      const minerData = minerSnap.data();
      
      const supervisorHasMiner = (supervisorData.assignedMiners || []).includes(MINER_ID);
      const minerHasSupervisor = minerData.supervisorId === SUPERVISOR_ID;
      
      console.log(`  ${supervisorHasMiner ? '✅' : '❌'} Supervisor has miner in assignedMiners: ${supervisorHasMiner}`);
      console.log(`  ${minerHasSupervisor ? '✅' : '❌'} Miner has correct supervisorId: ${minerHasSupervisor}`);
      
      if (supervisorHasMiner && minerHasSupervisor) {
        console.log('\n  🎉 Relationship is CORRECTLY established!');
      } else {
        console.log('\n  ⚠️  Relationship has issues!');
      }
      
      // Check if phoneNumber fields exist (required for context queries)
      console.log('\n📱 PHONE NUMBER FIELDS:');
      console.log(`  ${supervisorData.phoneNumber ? '✅' : '❌'} Supervisor has phoneNumber: ${supervisorData.phoneNumber || 'MISSING'}`);
      console.log(`  ${minerData.phoneNumber ? '✅' : '❌'} Miner has phoneNumber: ${minerData.phoneNumber || 'MISSING'}`);
    }
    
    console.log('\n' + '━'.repeat(60));
    console.log('\n✅ Verification complete!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

verifyRelationship();
