/**
 * Script to create test users in Firestore
 * Run with: npx ts-node scripts/create-test-users.ts
 * Or: node -r esbuild-register scripts/create-test-users.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJZRgI_Zpp2iyeqBvreMhQCzvFxfHL2W0",
  authDomain: "sih-dec-2025.firebaseapp.com",
  databaseURL: "https://sih-dec-2025-default-rtdb.firebaseio.com",
  projectId: "sih-dec-2025",
  storageBucket: "sih-dec-2025.firebasestorage.app",
  messagingSenderId: "163692260644",
  appId: "1:163692260644:web:6cc4eac7446557182317b1",
  measurementId: "G-KN1E0ZQLW1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'minerva1');

// Test users to create
const testUsers = [
  {
    phone: '9032017652', // Your number
    name: 'Pranati Rao',
    role: 'miner',
    email: 'pranati@example.com',
    department: 'Blasting',
    shiftTiming: 'Morning',
    safetyScore: 95,
    totalPoints: 2500,
    videosCompleted: 18,
    quizzesCompleted: 15,
    trainingHours: 42,
    streak: 7,
    level: 10,
    badges: ['🏆', '⭐'],
    joinedDate: new Date().toISOString(),
  },
  {
    phone: '1234567890',
    name: 'Rajesh Kumar',
    role: 'miner',
    department: 'Excavation',
    shiftTiming: 'Morning',
    safetyScore: 92,
    totalPoints: 2200,
    videosCompleted: 16,
    quizzesCompleted: 12,
    trainingHours: 38,
    streak: 5,
    level: 9,
    badges: ['🏆'],
    joinedDate: new Date().toISOString(),
  },
  {
    phone: '1234567891',
    name: 'Amit Sharma',
    role: 'engineer',
    department: 'Safety Engineering',
    safetyScore: 98,
    joinedDate: new Date().toISOString(),
  },
  {
    phone: '1234567892',
    name: 'Suresh Patel',
    role: 'supervisor',
    department: 'Operations',
    safetyScore: 96,
    joinedDate: new Date().toISOString(),
  },
  {
    phone: '1234567893',
    name: 'Anita Verma',
    role: 'safety-officer',
    department: 'Safety Compliance',
    safetyScore: 99,
    joinedDate: new Date().toISOString(),
  },
  {
    phone: '1234567894',
    name: 'Admin User',
    role: 'admin',
    department: 'Administration',
    safetyScore: 100,
    joinedDate: new Date().toISOString(),
  },
  // Additional miners for leaderboard
  {
    phone: '8000000001',
    name: 'Arun Singh',
    role: 'miner',
    department: 'Drilling',
    shiftTiming: 'Morning',
    safetyScore: 88,
    totalPoints: 1800,
    videosCompleted: 14,
    quizzesCompleted: 10,
    trainingHours: 32,
    streak: 4,
    level: 7,
    badges: ['⭐'],
    joinedDate: new Date().toISOString(),
  },
  {
    phone: '8000000002',
    name: 'Rakesh Mehta',
    role: 'miner',
    department: 'Loading',
    shiftTiming: 'Evening',
    safetyScore: 90,
    totalPoints: 2000,
    videosCompleted: 15,
    quizzesCompleted: 11,
    trainingHours: 35,
    streak: 6,
    level: 8,
    badges: ['⭐'],
    joinedDate: new Date().toISOString(),
  },
  {
    phone: '8000000003',
    name: 'Mahesh Kumar',
    role: 'miner',
    department: 'Transport',
    shiftTiming: 'Night',
    safetyScore: 85,
    totalPoints: 1600,
    videosCompleted: 12,
    quizzesCompleted: 9,
    trainingHours: 28,
    streak: 3,
    level: 6,
    badges: [],
    joinedDate: new Date().toISOString(),
  },
  {
    phone: '8000000004',
    name: 'Deepak Rao',
    role: 'miner',
    department: 'Maintenance',
    shiftTiming: 'Morning',
    safetyScore: 93,
    totalPoints: 2300,
    videosCompleted: 17,
    quizzesCompleted: 13,
    trainingHours: 40,
    streak: 8,
    level: 9,
    badges: ['🏆'],
    joinedDate: new Date().toISOString(),
  },
];

async function createTestUsers() {
  console.log('🚀 Starting to create test users...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const user of testUsers) {
    try {
      const userRef = doc(db, 'users', user.phone);
      await setDoc(userRef, user);
      console.log(`✅ Created user: ${user.name} (${user.phone}) - Role: ${user.role}`);
      successCount++;
    } catch (error: any) {
      console.error(`❌ Error creating user ${user.phone}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Failed: ${errorCount} users`);
  console.log('\n🎉 Done! You can now login with any of these phone numbers:');
  console.log('   OTP for test mode: 123456\n');
  
  testUsers.forEach(user => {
    console.log(`   +91${user.phone} - ${user.name} (${user.role})`);
  });

  process.exit(0);
}

// Run the script
createTestUsers().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
