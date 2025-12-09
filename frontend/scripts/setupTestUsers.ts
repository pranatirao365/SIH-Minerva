/**
 * Setup Test Users in Firebase
 * Run this script to create test supervisor and miners with proper social profiles
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

const testUsers = [
  // Test Supervisor
  {
    id: '900000001',
    name: 'Supervisor Ravi Kumar',
    phone: '+91900000001',
    role: 'supervisor',
    empId: 'SUP001',
    department: 'Operations',
    otp: '123456',
  },
  {
    id: '900000002',
    name: 'Supervisor Suresh Patel',
    phone: '+91900000002',
    role: 'supervisor',
    empId: 'SUP002',
    department: 'Safety',
    otp: '234567',
  },
  
  // Test Miners
  {
    id: '800000001',
    name: 'Miner Arun Singh',
    phone: '+91800000001',
    role: 'miner',
    department: 'Mining Operations',
    otp: '345678',
  },
  {
    id: '800000002',
    name: 'Miner Rakesh Sharma',
    phone: '+91800000002',
    role: 'miner',
    department: 'Mining Operations',
    otp: '456789',
  },
  {
    id: '800000003',
    name: 'Miner Mahesh Reddy',
    phone: '+91800000003',
    role: 'miner',
    department: 'Mining Operations',
    otp: '567890',
  },
  {
    id: '800000004',
    name: 'Miner Deepak Verma',
    phone: '+91800000004',
    role: 'miner',
    department: 'Mining Operations',
    otp: '678901',
  },
  {
    id: '800000005',
    name: 'Miner Imran Khan',
    phone: '+91800000005',
    role: 'miner',
    department: 'Mining Operations',
    otp: '789012',
  },
  {
    id: '800000006',
    name: 'Miner Harish Kumar',
    phone: '+91800000006',
    role: 'miner',
    department: 'Mining Operations',
    otp: '890123',
  },
  {
    id: '800000007',
    name: 'Miner Vijay Patil',
    phone: '+91800000007',
    role: 'miner',
    department: 'Mining Operations',
    otp: '901234',
  },
  {
    id: '800000008',
    name: 'Miner Santosh Rao',
    phone: '+91800000008',
    role: 'miner',
    department: 'Mining Operations',
    otp: '012345',
  },
  {
    id: '800000009',
    name: 'Miner Sunil Joshi',
    phone: '+91800000009',
    role: 'miner',
    department: 'Mining Operations',
    otp: '123789',
  },
  {
    id: '800000010',
    name: 'Miner Gopal Nair',
    phone: '+91800000010',
    role: 'miner',
    department: 'Mining Operations',
    otp: '234890',
  },
  
  // Test Safety Officer
  {
    id: '700000001',
    name: 'Safety Officer Anita Desai',
    phone: '+91700000001',
    role: 'safety_officer',
    empId: 'SO001',
    department: 'Safety Department',
    otp: '345901',
  },
];

async function setupTestUsers() {
  console.log('🔧 Setting up test users in Firebase...\n');
  
  for (const user of testUsers) {
    try {
      const userData: any = {
        name: user.name,
        phone: user.phone,
        role: user.role,
        department: user.department,
        
        // Social profile fields
        followers: [],
        following: [],
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        likesCount: 0,
        bio: `Test ${user.role} account for development`,
        avatar: null,
        
        // Metadata
        createdAt: serverTimestamp(),
        createdBy: 'setup_script',
        status: 'active',
      };
      
      // Add empId for non-miner roles
      if (user.empId) {
        userData.empId = user.empId;
      }
      
      await setDoc(doc(db, 'users', user.id), userData);
      
      console.log(`✅ Created: ${user.name} (${user.role})`);
      console.log(`   Phone: ${user.phone} | OTP: ${user.otp}`);
      console.log(`   ID: ${user.id}\n`);
    } catch (error) {
      console.error(`❌ Failed to create ${user.name}:`, error);
    }
  }
  
  console.log('\n🎉 Test users setup complete!\n');
  console.log('📱 Login Credentials:\n');
  console.log('SUPERVISORS:');
  console.log('  Phone: +91900000001 | OTP: 123456 (Ravi Kumar)');
  console.log('  Phone: +91900000002 | OTP: 234567 (Suresh Patel)\n');
  console.log('MINERS:');
  console.log('  Phone: +91800000001 | OTP: 345678 (Arun Singh)');
  console.log('  Phone: +91800000002 | OTP: 456789 (Rakesh Sharma)');
  console.log('  Phone: +91800000003 | OTP: 567890 (Mahesh Reddy)');
  console.log('  ...and 7 more miners\n');
  console.log('SAFETY OFFICER:');
  console.log('  Phone: +91700000001 | OTP: 345901 (Anita Desai)\n');
  
  process.exit(0);
}

setupTestUsers().catch(console.error);
