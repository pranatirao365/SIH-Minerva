/**
 * Script to add test miner-2 (Equipment Maintenance) to Firebase Firestore
 * 
 * Usage: node scripts/add-test-miner-2.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebase-service-account.json');

// Check if already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

/**
 * Add test miner-2 to Firestore
 */
async function addTestMiner2() {
  try {
    console.log('🚀 Adding test miner-2 (Equipment Maintenance) to Firebase...\n');

    // Test miner data
    const minerData = {
      name: 'miner-2',
      phoneNumber: '+919876543211',
      role: 'miner',
      department: 'equipment_maintenance',  // Using lowercase to match backend API
      employeeId: 'MINER002',
      email: 'miner2@test.com',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true,
      testUser: true,  // Flag to identify test users
      metadata: {
        createdBy: 'test_script',
        notes: 'Test miner for PPE scanning - Department: Equipment Maintenance'
      }
    };

    // Document ID as phone number without + prefix (919876543211)
    const docId = minerData.phoneNumber.replace('+', '');

    console.log('📝 Test Miner Details:');
    console.log('   Name:', minerData.name);
    console.log('   Phone:', minerData.phoneNumber);
    console.log('   Department:', minerData.department);
    console.log('   Role:', minerData.role);
    console.log('   Document ID:', docId);
    console.log('   Test OTP: 123456\n');

    // Add to Firestore
    await db.collection('users').doc(docId).set(minerData);

    console.log('✅ Test miner-2 added successfully!\n');
    console.log('📱 Login Instructions:');
    console.log('   1. Open the app');
    console.log('   2. Enter phone: +919876543211');
    console.log('   3. Click "Send OTP"');
    console.log('   4. Enter OTP: 123456');
    console.log('   5. You will be logged in as miner-2\n');
    
    console.log('🔬 PPE Scanning:');
    console.log('   Department: Equipment Maintenance');
    console.log('   Required PPE (Set A - Standard):');
    console.log('     • Helmet');
    console.log('     • Gloves');
    console.log('     • Eye Protection');
    console.log('     • Safety Boots');
    console.log('   Note: Only 4 items required (no vest, no protective suit)\n');

    // Verify the document was created
    const verifyDoc = await db.collection('users').doc(docId).get();
    if (verifyDoc.exists) {
      console.log('✅ Verification: Document exists in Firestore');
      console.log('📊 Document Data:', JSON.stringify(verifyDoc.data(), null, 2));
    } else {
      console.log('❌ Verification failed: Document not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding test miner-2:', error);
    process.exit(1);
  }
}

// Run the script
addTestMiner2();
