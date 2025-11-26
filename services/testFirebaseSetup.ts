import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

/**
 * Comprehensive Firebase Connection Test
 */
export const testFirebaseSetup = async () => {
  const results = {
    firebaseApp: false,
    firebaseAuth: false,
    firestore: false,
    firestoreUsers: false,
    phoneAuthEnabled: false,
    errors: [] as string[]
  };

  try {
    // Test 1: Firebase App Initialization
    console.log('🔍 Testing Firebase App initialization...');
    try {
      const app = getApp();
      console.log('✅ Firebase App initialized');
      console.log('   Project ID:', app.options.projectId);
      console.log('   App ID:', app.options.appId);
      results.firebaseApp = true;
    } catch (error: any) {
      console.error('❌ Firebase App error:', error.message);
      results.errors.push(`Firebase App: ${error.message}`);
    }

    // Test 2: Firebase Authentication
    console.log('\n🔍 Testing Firebase Authentication...');
    try {
      const authInstance = getAuth();
      console.log('✅ Firebase Auth initialized');
      console.log('   Current user:', authInstance.currentUser?.phoneNumber || 'None');
      results.firebaseAuth = true;
    } catch (error: any) {
      console.error('❌ Firebase Auth error:', error.message);
      results.errors.push(`Firebase Auth: ${error.message}`);
    }

    // Test 3: Firestore Connection
    console.log('\n🔍 Testing Firestore connection...');
    try {
      const db = getFirestore();
      console.log('✅ Firestore initialized');
      results.firestore = true;

      // Test 4: Firestore Users Collection
      console.log('\n🔍 Testing Firestore users collection...');
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        
        console.log('✅ Users collection accessible');
        console.log(`   Found ${snapshot.size} user(s)`);
        
        if (snapshot.size > 0) {
          console.log('   Sample users:');
          let index = 0;
          snapshot.forEach((doc) => {
            if (index < 3) { // Show first 3 users
              const data = doc.data();
              console.log(`   - ${doc.id}: role = ${data.role}`);
              index++;
            }
          });
          results.firestoreUsers = true;
        } else {
          console.log('⚠️  No users found in database');
          console.log('   Create users in Firebase Console:');
          console.log('   Firestore → users collection → Add document');
          console.log('   Document ID: phone number (without +91)');
          console.log('   Fields: { role: "miner" | "engineer" | "safety-officer" | "supervisor" }');
        }
      } catch (error: any) {
        console.error('❌ Firestore users error:', error.message);
        results.errors.push(`Firestore users: ${error.message}`);
      }
    } catch (error: any) {
      console.error('❌ Firestore error:', error.message);
      results.errors.push(`Firestore: ${error.message}`);
    }

    // Test 5: Phone Auth Configuration
    console.log('\n🔍 Checking Phone Authentication setup...');
    console.log('⚠️  Phone Auth requires manual verification:');
    console.log('   1. Go to Firebase Console → Authentication');
    console.log('   2. Enable Phone provider');
    console.log('   3. Configure authorized domains');
    console.log('   4. For production: Set up billing (Blaze plan)');

    // Summary
    console.log('\n📊 Firebase Setup Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Firebase App:        ${results.firebaseApp ? '✅' : '❌'}`);
    console.log(`Firebase Auth:       ${results.firebaseAuth ? '✅' : '❌'}`);
    console.log(`Firestore:           ${results.firestore ? '✅' : '❌'}`);
    console.log(`Firestore Users:     ${results.firestoreUsers ? '✅' : '⚠️'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (results.errors.length > 0) {
      console.log('\n❌ Errors found:');
      results.errors.forEach(err => console.log(`   - ${err}`));
    }

    return results;
  } catch (error: any) {
    console.error('❌ Fatal error during Firebase testing:', error);
    return results;
  }
};

/**
 * Test phone number in Firestore
 */
export const testUserInFirestore = async (phoneNumber: string) => {
  try {
    const { getFirestore, doc, getDoc } = await import('firebase/firestore');
    const db = getFirestore();
    
    // Remove +91 prefix
    const phone = phoneNumber.replace('+91', '');
    
    console.log(`\n🔍 Looking for user: ${phone}`);
    const userDoc = await getDoc(doc(db, 'users', phone));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ User found!');
      console.log('   Phone:', phone);
      console.log('   Role:', userData.role);
      console.log('   Data:', JSON.stringify(userData, null, 2));
      return { exists: true, data: userData };
    } else {
      console.log('❌ User not found in Firestore');
      console.log('   Phone searched:', phone);
      console.log('   Create this user in Firebase Console:');
      console.log('   Collection: users');
      console.log(`   Document ID: ${phone}`);
      console.log('   Field: role = "miner" (or engineer/safety-officer/supervisor)');
      return { exists: false, data: null };
    }
  } catch (error: any) {
    console.error('❌ Error checking user:', error);
    return { exists: false, error: error.message };
  }
};
