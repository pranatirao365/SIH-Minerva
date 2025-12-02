import { initFirebase } from '../services/firebase';

async function listUsersByRole() {
  try {
    // Set environment variables if not set
    if (!process.env.FIREBASE_PROJECT_ID) {
      process.env.FIREBASE_PROJECT_ID = 'sihtut-1';
    }
    if (!process.env.SERVICE_ACCOUNT_PATH) {
      process.env.SERVICE_ACCOUNT_PATH = '../firebase-service-account.json';
    }

    const app = await initFirebase();
    const db = app.firestore();

    console.log('🔍 Querying Firestore for users...\n');

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in Firestore database.\n');
      return;
    }

    console.log(`✅ Total users found: ${usersSnapshot.size}\n`);

    // Filter supervisors
    const supervisors: any[] = [];
    const miners: any[] = [];
    const others: any[] = [];

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      const user = { id: doc.id, ...data };
      
      if (data.role === 'supervisor') {
        supervisors.push(user);
      } else if (data.role === 'miner') {
        miners.push(user);
      } else {
        others.push(user);
      }
    });

    // Display Supervisors
    console.log('👷 SUPERVISORS:');
    console.log('═'.repeat(80));
    if (supervisors.length === 0) {
      console.log('  No supervisors found.\n');
    } else {
      supervisors.forEach((supervisor, index) => {
        console.log(`  ${index + 1}. ID: ${supervisor.id}`);
        console.log(`     Name: ${supervisor.name || 'N/A'}`);
        console.log(`     Email: ${supervisor.email || 'N/A'}`);
        console.log(`     Phone: ${supervisor.phone || 'N/A'}`);
        console.log(`     Status: ${supervisor.status || 'N/A'}`);
        console.log(`     Created: ${supervisor.createdAt ? new Date(supervisor.createdAt).toLocaleString() : 'N/A'}`);
        console.log('  ' + '-'.repeat(78));
      });
      console.log(`  Total Supervisors: ${supervisors.length}\n`);
    }

    // Display Miners
    console.log('⛏️  MINERS:');
    console.log('═'.repeat(80));
    if (miners.length === 0) {
      console.log('  No miners found.\n');
    } else {
      miners.forEach((miner, index) => {
        console.log(`  ${index + 1}. ID: ${miner.id}`);
        console.log(`     Name: ${miner.name || 'N/A'}`);
        console.log(`     Email: ${miner.email || 'N/A'}`);
        console.log(`     Phone: ${miner.phone || 'N/A'}`);
        console.log(`     Status: ${miner.status || 'N/A'}`);
        console.log(`     Assigned Supervisor: ${miner.supervisorId || 'N/A'}`);
        console.log(`     Created: ${miner.createdAt ? new Date(miner.createdAt).toLocaleString() : 'N/A'}`);
        console.log('  ' + '-'.repeat(78));
      });
      console.log(`  Total Miners: ${miners.length}\n`);
    }

    // Display Other Roles
    if (others.length > 0) {
      console.log('👥 OTHER ROLES:');
      console.log('═'.repeat(80));
      others.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}`);
        console.log(`     Name: ${user.name || 'N/A'}`);
        console.log(`     Role: ${user.role || 'N/A'}`);
        console.log(`     Email: ${user.email || 'N/A'}`);
        console.log('  ' + '-'.repeat(78));
      });
      console.log(`  Total Other Users: ${others.length}\n`);
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('═'.repeat(80));
    console.log(`  Total Users: ${usersSnapshot.size}`);
    console.log(`  Supervisors: ${supervisors.length}`);
    console.log(`  Miners: ${miners.length}`);
    console.log(`  Other Roles: ${others.length}`);
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ Error querying Firestore:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the function
listUsersByRole();
