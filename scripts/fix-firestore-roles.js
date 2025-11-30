/**
 * Fix Firestore Roles Script
 * 
 * This script updates the roles in Firestore database to match the correct test users.
 * Run this once to set up proper test data.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase configuration (from your config/firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyDqIX3T-bwmrY7kePQhQg1X4s6Z-JaXyQA",
  authDomain: "sihtut-1.firebaseapp.com",
  projectId: "sihtut-1",
  storageBucket: "sihtut-1.firebasestorage.app",
  messagingSenderId: "841607044309",
  appId: "1:841607044309:web:3dc01f09c3cb9dcda63015",
  measurementId: "G-5ZVKG45EB9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test users data with correct roles
const testUsers = [
  {
    docId: '911234567890',
    data: {
      phoneNumber: '+911234567890',
      role: 'miner',
      name: 'Test Miner',
      createdAt: new Date().toISOString(),
      createdBy: 'admin-script'
    }
  },
  {
    docId: '911234567891',
    data: {
      phoneNumber: '+911234567891',
      role: 'engineer',
      name: 'Test Engineer',
      createdAt: new Date().toISOString(),
      createdBy: 'admin-script'
    }
  },
  {
    docId: '911234567892',
    data: {
      phoneNumber: '+911234567892',
      role: 'supervisor',
      name: 'Test Supervisor',
      createdAt: new Date().toISOString(),
      createdBy: 'admin-script'
    }
  },
  {
    docId: '911234567893',
    data: {
      phoneNumber: '+911234567893',
      role: 'safety_officer',
      name: 'Test Safety Officer',
      createdAt: new Date().toISOString(),
      createdBy: 'admin-script'
    }
  },
  {
    docId: '911234567894',
    data: {
      phoneNumber: '+911234567894',
      role: 'admin',
      name: 'Test Admin',
      createdAt: new Date().toISOString(),
      createdBy: 'admin-script'
    }
  }
];

async function fixFirestoreRoles() {
  console.log('🔧 Starting Firestore role fix...\n');
  
  try {
    for (const user of testUsers) {
      console.log(`📝 Updating user: ${user.data.phoneNumber}`);
      console.log(`   Document ID: ${user.docId}`);
      console.log(`   Role: ${user.data.role}`);
      
      const userRef = doc(db, 'users', user.docId);
      await setDoc(userRef, user.data, { merge: true });
      
      console.log(`   ✅ Successfully updated\n`);
    }
    
    console.log('✅ All roles fixed successfully!\n');
    console.log('📋 Summary of test users:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Phone Number      | Role            | Dashboard');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('+911234567890    | miner           | /miner/MinerHome');
    console.log('+911234567891    | engineer        | /engineer/EngineerHome');
    console.log('+911234567892    | supervisor      | /supervisor/SupervisorHome');
    console.log('+911234567893    | safety_officer  | /safety-officer/SafetyOfficerHome');
    console.log('+911234567894    | admin           | /admin/AdminHome');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🧪 Test OTP for all users: 123456\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing roles:', error);
    process.exit(1);
  }
}

// Run the fix
fixFirestoreRoles();
