/**
 * Fix Test Supervisor → Test Miner Relationship
 * 
 * This script ensures the Test Supervisor's assignedMiners array includes the Test Miner
 * Run this to fix the database relationship
 */

import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function fixTestSupervisorMinerRelationship() {
  console.log('🔧 Starting relationship fix...\n');

  try {
    // Step 1: Find Test Supervisor by empId
    console.log('📋 Step 1: Finding Test Supervisor...');
    const usersRef = collection(db, 'users');
    const supervisorQuery = query(
      usersRef,
      where('role', '==', 'supervisor'),
      where('empId', '==', 'SUP-TEST')
    );
    
    const supervisorSnapshot = await getDocs(supervisorQuery);
    
    if (supervisorSnapshot.empty) {
      console.error('❌ Test Supervisor not found with empId: SUP-TEST');
      return { success: false, error: 'Supervisor not found' };
    }

    const supervisorDoc = supervisorSnapshot.docs[0];
    const supervisorId = supervisorDoc.id;
    const supervisorData = supervisorDoc.data();
    
    console.log('✅ Found Test Supervisor:');
    console.log(`   Document ID: ${supervisorId}`);
    console.log(`   Name: ${supervisorData.name}`);
    console.log(`   Phone: ${supervisorData.phoneNumber}`);
    console.log(`   Current assignedMiners: ${JSON.stringify(supervisorData.assignedMiners || [])}`);

    // Step 2: Find Test Miner by supervisorId
    console.log('\n📋 Step 2: Finding Test Miner...');
    const minerQuery = query(
      usersRef,
      where('role', '==', 'miner'),
      where('supervisorId', '==', 'SUP-TEST')
    );
    
    const minerSnapshot = await getDocs(minerQuery);
    
    if (minerSnapshot.empty) {
      console.error('❌ Test Miner not found with supervisorId: SUP-TEST');
      return { success: false, error: 'Miner not found' };
    }

    const minerDoc = minerSnapshot.docs[0];
    const minerId = minerDoc.id;
    const minerData = minerDoc.data();
    
    console.log('✅ Found Test Miner:');
    console.log(`   Document ID: ${minerId}`);
    console.log(`   Name: ${minerData.name}`);
    console.log(`   Phone: ${minerData.phoneNumber}`);
    console.log(`   supervisorId: ${minerData.supervisorId}`);

    // Step 3: Check if relationship already exists
    const currentAssignedMiners = supervisorData.assignedMiners || [];
    
    if (currentAssignedMiners.includes(minerId)) {
      console.log('\n✅ Relationship already exists! No update needed.');
      return { 
        success: true, 
        message: 'Relationship already correct',
        supervisorId,
        minerId 
      };
    }

    // Step 4: Update supervisor's assignedMiners array
    console.log('\n📝 Step 3: Updating supervisor\'s assignedMiners array...');
    const updatedAssignedMiners = [...currentAssignedMiners, minerId];
    
    const supervisorRef = doc(db, 'users', supervisorId);
    await updateDoc(supervisorRef, {
      assignedMiners: updatedAssignedMiners
    });

    console.log('✅ Updated assignedMiners array:');
    console.log(`   Old: ${JSON.stringify(currentAssignedMiners)}`);
    console.log(`   New: ${JSON.stringify(updatedAssignedMiners)}`);

    // Step 5: Verify the update
    console.log('\n🔍 Step 4: Verifying update...');
    const verifyDoc = await getDoc(supervisorRef);
    const verifiedData = verifyDoc.data();
    
    if (verifiedData && verifiedData.assignedMiners.includes(minerId)) {
      console.log('✅ Verification successful!');
      console.log(`   Supervisor ${supervisorData.name} now has ${verifiedData.assignedMiners.length} assigned miner(s)`);
      
      return {
        success: true,
        message: 'Relationship fixed successfully',
        supervisorId,
        supervisorName: supervisorData.name,
        minerId,
        minerName: minerData.name,
        assignedMiners: verifiedData.assignedMiners
      };
    } else {
      console.error('❌ Verification failed - update did not persist');
      return { success: false, error: 'Update verification failed' };
    }

  } catch (error: any) {
    console.error('\n❌ Error fixing relationship:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to display the relationship status
export async function checkSupervisorMinerRelationship() {
  console.log('🔍 Checking Test Supervisor → Test Miner relationship...\n');

  try {
    const usersRef = collection(db, 'users');

    // Get supervisor
    const supervisorQuery = query(
      usersRef,
      where('role', '==', 'supervisor'),
      where('empId', '==', 'SUP-TEST')
    );
    const supervisorSnapshot = await getDocs(supervisorQuery);
    
    if (supervisorSnapshot.empty) {
      console.log('❌ Test Supervisor not found');
      return;
    }

    const supervisorDoc = supervisorSnapshot.docs[0];
    const supervisorData = supervisorDoc.data();
    
    console.log('👤 Test Supervisor:');
    console.log(`   ID: ${supervisorDoc.id}`);
    console.log(`   Name: ${supervisorData.name}`);
    console.log(`   assignedMiners: ${JSON.stringify(supervisorData.assignedMiners || [])}`);
    console.log(`   Count: ${(supervisorData.assignedMiners || []).length}`);

    // Get miners
    const minerQuery = query(
      usersRef,
      where('role', '==', 'miner'),
      where('supervisorId', '==', 'SUP-TEST')
    );
    const minerSnapshot = await getDocs(minerQuery);
    
    console.log(`\n⛏️  Miners with supervisorId='SUP-TEST': ${minerSnapshot.size}`);
    minerSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   - ${doc.id}: ${data.name} (${data.phoneNumber})`);
    });

    // Check if relationship is correct
    const minerIds = minerSnapshot.docs.map(d => d.id);
    const assignedMiners = supervisorData.assignedMiners || [];
    const missingMiners = minerIds.filter(id => !assignedMiners.includes(id));
    
    if (missingMiners.length > 0) {
      console.log(`\n⚠️  ISSUE FOUND: ${missingMiners.length} miner(s) not in assignedMiners array`);
      console.log('   Missing miners:', missingMiners);
      console.log('\n💡 Run fixTestSupervisorMinerRelationship() to fix this');
    } else {
      console.log('\n✅ Relationship is correct!');
    }

  } catch (error) {
    console.error('❌ Error checking relationship:', error);
  }
}
