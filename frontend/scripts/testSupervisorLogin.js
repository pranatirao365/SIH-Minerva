/**
 * Test Login Flow for Supervisor
 * Run: node scripts/testSupervisorLogin.js
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

async function getUserByPhone(phoneWithPrefix) {
  const phone = phoneWithPrefix.replace('+', '');
  
  console.log('🔍 Searching for user with phone:', phoneWithPrefix);
  console.log('📊 Strategy 1: Direct document ID lookup with:', phone);
  
  // Strategy 1: Try direct document lookup
  try {
    const userDoc = await getDoc(doc(db, 'users', phone));
    if (userDoc.exists()) {
      console.log('✅ User found via document ID:', phone);
      return { id: userDoc.id, ...userDoc.data() };
    }
  } catch (error) {
    console.log('⚠️ Direct lookup failed:', error.message);
  }
  
  console.log('📊 Strategy 2: Query by phoneNumber field (with + prefix)');
  
  // Strategy 2: Query by phoneNumber field with prefix
  try {
    const q = query(collection(db, 'users'), where('phoneNumber', '==', phoneWithPrefix));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      console.log('✅ User found via phoneNumber query (with +):', userDoc.id);
      return { id: userDoc.id, ...userDoc.data() };
    }
  } catch (error) {
    console.log('⚠️ Query with + prefix failed:', error.message);
  }
  
  console.log('📊 Strategy 3: Query by phoneNumber field (without + prefix)');
  
  // Strategy 3: Query by phoneNumber field without + prefix
  try {
    const phoneWithoutPlus = phoneWithPrefix.replace('+', '');
    const q = query(collection(db, 'users'), where('phoneNumber', '==', phoneWithoutPlus));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      console.log('✅ User found via phoneNumber query (no +):', userDoc.id);
      return { id: userDoc.id, ...userDoc.data() };
    }
  } catch (error) {
    console.log('⚠️ Query without + prefix failed:', error.message);
  }
  
  console.log('❌ User not found with any strategy');
  return null;
}

async function testSupervisorContext(supervisorId) {
  console.log('\n🔍 Testing SupervisorContext logic...');
  console.log('━'.repeat(60));
  
  // Strategy 1: Try to get supervisor by document ID
  console.log(`\n📋 Strategy 1: Fetching supervisor by ID: ${supervisorId}`);
  let supervisorDoc = null;
  let supervisorData = null;
  
  try {
    const supervisorRef = doc(db, 'users', supervisorId);
    const docSnap = await getDoc(supervisorRef);
    
    if (docSnap.exists() && docSnap.data().role === 'supervisor') {
      supervisorDoc = docSnap;
      supervisorData = docSnap.data();
      console.log('✅ Supervisor found by ID');
    }
  } catch (error) {
    console.log('⚠️ Failed:', error.message);
  }
  
  if (!supervisorDoc) {
    console.log('❌ Supervisor not found by ID');
    return;
  }
  
  const assignedMinerIds = supervisorData.assignedMiners || [];
  console.log('\n✅ Supervisor found:', {
    id: supervisorDoc.id,
    empId: supervisorData.empId,
    assignedMiners: assignedMinerIds
  });
  
  if (assignedMinerIds.length === 0) {
    console.log('ℹ️ No miners assigned to this supervisor');
    return;
  }
  
  // Fetch all assigned miners
  console.log('\n👥 Fetching assigned miners...');
  for (const minerId of assignedMinerIds) {
    try {
      const minerDocRef = doc(db, 'users', minerId);
      const minerDoc = await getDoc(minerDocRef);
      
      if (minerDoc.exists()) {
        const minerData = minerDoc.data();
        console.log(`  ✅ Miner ${minerId}:`, {
          name: minerData.name,
          phone: minerData.phoneNumber,
          role: minerData.role
        });
      } else {
        console.log(`  ⚠️ Miner document not found: ${minerId}`);
      }
    } catch (err) {
      console.error(`  ❌ Error fetching miner ${minerId}:`, err.message);
    }
  }
}

async function testLogin() {
  console.log('🧪 Testing Supervisor Login Flow');
  console.log('━'.repeat(60));
  
  const supervisorPhone = '+911234567892';
  
  // Simulate getUserByPhone call
  console.log('\n📱 Step 1: Login with phone:', supervisorPhone);
  const userData = await getUserByPhone(supervisorPhone);
  
  if (!userData) {
    console.log('\n❌ Login failed: User not found');
    process.exit(1);
  }
  
  console.log('\n✅ Login successful!');
  console.log('User data:', {
    id: userData.id,
    name: userData.name,
    phone: userData.phone || userData.phoneNumber,
    role: userData.role
  });
  
  // Simulate SupervisorContext logic
  console.log('\n📊 Step 2: SupervisorContext will use user.id:', userData.id);
  await testSupervisorContext(userData.id);
  
  console.log('\n' + '━'.repeat(60));
  console.log('✅ Test complete!');
  console.log('\n💡 LOGIN CREDENTIALS:');
  console.log('  Phone: +911234567892');
  console.log('  OTP: 111111');
  console.log('\n');
  
  process.exit(0);
}

testLogin().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
