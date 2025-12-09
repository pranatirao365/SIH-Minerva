/**
 * List all supervisor documents
 * Run: node scripts/listSupervisors.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

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

async function listSupervisors() {
  console.log('📋 Listing all supervisors in database...\n');
  console.log('━'.repeat(60));
  
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'supervisor'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('⚠️ No supervisors found');
      process.exit(0);
    }
    
    console.log(`\n✅ Found ${snapshot.size} supervisor(s):\n`);
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. Document ID: ${doc.id}`);
      console.log(`   Name: ${data.name}`);
      console.log(`   Phone: ${data.phone}`);
      console.log(`   PhoneNumber: ${data.phoneNumber}`);
      console.log(`   EmpId: ${data.empId}`);
      console.log(`   Department: ${data.department}`);
      console.log(`   Assigned Miners: ${JSON.stringify(data.assignedMiners || [])}`);
      console.log('');
    });
    
    console.log('━'.repeat(60));
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listSupervisors();
