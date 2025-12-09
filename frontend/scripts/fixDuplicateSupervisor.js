/**
 * Fix duplicate supervisor issue
 * Run: node scripts/fixDuplicateSupervisor.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, deleteDoc, getDoc } = require('firebase/firestore');

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

async function fixDuplicates() {
  console.log('🔧 Fixing duplicate supervisor issue...\n');
  console.log('━'.repeat(60));
  
  try {
    // Delete the duplicate/old document
    const oldDocId = '911234567892';
    console.log(`\n🗑️  Deleting old/duplicate document: ${oldDocId}`);
    
    const oldDocRef = doc(db, 'users', oldDocId);
    const oldDocSnap = await getDoc(oldDocRef);
    
    if (oldDocSnap.exists()) {
      const oldData = oldDocSnap.data();
      console.log('   Old document data:', {
        name: oldData.name,
        phoneNumber: oldData.phoneNumber,
        assignedMiners: oldData.assignedMiners || []
      });
      
      await deleteDoc(oldDocRef);
      console.log('   ✅ Old document deleted');
    } else {
      console.log('   ⚠️  Old document not found (already deleted?)');
    }
    
    // Verify the correct document exists
    const correctDocId = '1234567892';
    console.log(`\n✅ Verifying correct document: ${correctDocId}`);
    
    const correctDocRef = doc(db, 'users', correctDocId);
    const correctDocSnap = await getDoc(correctDocRef);
    
    if (correctDocSnap.exists()) {
      const correctData = correctDocSnap.data();
      console.log('   ✅ Correct document exists:', {
        name: correctData.name,
        phone: correctData.phone,
        phoneNumber: correctData.phoneNumber,
        assignedMiners: correctData.assignedMiners || []
      });
    } else {
      console.log('   ❌ Correct document not found!');
    }
    
    console.log('\n' + '━'.repeat(60));
    console.log('✅ Cleanup complete!');
    console.log('\n💡 Now you can login with:');
    console.log('   Phone: +911234567892');
    console.log('   OTP: 111111');
    console.log('\n   The supervisor should see 1 assigned miner (1234567890)\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDuplicates();
