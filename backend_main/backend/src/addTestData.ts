import { initFirebase } from './services/firebase';

const testData = {
  supervisors: [
    {
      name: "Ravi",
      email: "ravi@mine.com",
      phoneNumber: "9000000001",
      empId: "SUP-001",
      department: "Mining Operations",
      shift: "Morning",
      teamSize: 5,
      assignedMiners: ["MIN-001", "MIN-002", "MIN-003", "MIN-004", "MIN-005"],
      role: "supervisor"
    },
    {
      name: "Suresh",
      email: "suresh@mine.com",
      phoneNumber: "9000000002",
      empId: "SUP-002",
      department: "Development / Drivage",
      shift: "Night",
      teamSize: 5,
      assignedMiners: ["MIN-006", "MIN-007", "MIN-008", "MIN-009", "MIN-010"],
      role: "supervisor"
    },
    {
      name: "Test Supervisor",
      email: "supervisor@test.com",
      phoneNumber: "1234567892",
      empId: "SUP-TEST",
      department: "Test Department",
      shift: "Morning",
      teamSize: 3,
      assignedMiners: [],
      role: "supervisor"
    }
  ],
  miners: [
    {
      minerId: "MIN-001",
      name: "Arun",
      phoneNumber: "8000000001",
      age: 30,
      shift: "Morning",
      trainingCompleted: true,
      experience: 3,
      department: "Mining Operations",
      role: "miner",
      supervisorId: "SUP-001"
    },
    {
      minerId: "MIN-002",
      name: "Rakesh",
      phoneNumber: "8000000002",
      age: 28,
      shift: "Morning",
      trainingCompleted: true,
      experience: 2,
      department: "Mining Operations",
      role: "miner",
      supervisorId: "SUP-001"
    },
    {
      minerId: "MIN-003",
      name: "Mahesh",
      phoneNumber: "8000000003",
      age: 32,
      shift: "Morning",
      trainingCompleted: false,
      experience: 4,
      department: "Production Support",
      role: "miner",
      supervisorId: "SUP-001"
    },
    {
      minerId: "MIN-004",
      name: "Deepak",
      phoneNumber: "8000000004",
      age: 27,
      shift: "Morning",
      trainingCompleted: true,
      experience: 2,
      department: "Loading & Haulage",
      role: "miner",
      supervisorId: "SUP-001"
    },
    {
      minerId: "MIN-005",
      name: "Imran",
      phoneNumber: "8000000005",
      age: 31,
      shift: "Morning",
      trainingCompleted: true,
      experience: 5,
      department: "Blasting Support",
      role: "miner",
      supervisorId: "SUP-001"
    },
    {
      minerId: "MIN-006",
      name: "Harish",
      phoneNumber: "8000000006",
      age: 30,
      shift: "Night",
      trainingCompleted: true,
      experience: 3,
      department: "Development / Drivage",
      role: "miner",
      supervisorId: "SUP-002"
    },
    {
      minerId: "MIN-007",
      name: "Vijay",
      phoneNumber: "8000000007",
      age: 26,
      shift: "Night",
      trainingCompleted: false,
      experience: 2,
      department: "Ventilation Support",
      role: "miner",
      supervisorId: "SUP-002"
    },
    {
      minerId: "MIN-008",
      name: "Santosh",
      phoneNumber: "8000000008",
      age: 28,
      shift: "Night",
      trainingCompleted: true,
      experience: 2,
      department: "Machinery Support",
      role: "miner",
      supervisorId: "SUP-002"
    },
    {
      minerId: "MIN-009",
      name: "Sunil",
      phoneNumber: "8000000009",
      age: 33,
      shift: "Night",
      trainingCompleted: true,
      experience: 6,
      department: "Production Support",
      role: "miner",
      supervisorId: "SUP-002"
    },
    {
      minerId: "MIN-010",
      name: "Gopal",
      phoneNumber: "8000000010",
      age: 29,
      shift: "Night",
      trainingCompleted: true,
      experience: 3,
      department: "Loading & Haulage",
      role: "miner",
      supervisorId: "SUP-002"
    },
    {
      minerId: "MIN-TEST",
      name: "Test Miner",
      phoneNumber: "1234567890",
      age: 25,
      shift: "Morning",
      trainingCompleted: true,
      experience: 1,
      department: "Test Department",
      role: "miner",
      supervisorId: "SUP-TEST"
    }
  ],
  engineers: [
    {
      name: "Test Engineer",
      email: "engineer@test.com",
      phoneNumber: "1234567891",
      empId: "ENG-TEST",
      department: "Engineering",
      shift: "Morning",
      role: "engineer"
    }
  ],
  safety_officers: [
    {
      name: "Anita",
      email: "anita@mine.com",
      phoneNumber: "7000000001",
      empId: "SOF-001",
      age: 36,
      role: "safety_officer"
    },
    {
      name: "Test Safety Officer",
      email: "safety@test.com",
      phoneNumber: "1234567893",
      empId: "SOF-TEST",
      age: 35,
      role: "safety_officer"
    }
  ],
  admins: [
    {
      name: "Test Admin",
      email: "admin@test.com",
      phoneNumber: "1234567894",
      empId: "ADM-TEST",
      department: "Administration",
      role: "admin"
    }
  ]
};

async function addTestData() {
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

    // Add supervisors (only add if not exists)
    for (const supervisor of testData.supervisors) {
      const phone = '91' + supervisor.phoneNumber;
      const docRef = db.collection('users').doc(phone);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        console.log('Adding supervisor with ID:', phone);
        await docRef.set(supervisor);
      } else {
        console.log('Supervisor already exists with ID:', phone);
      }
    }

    // Add miners (only add if not exists)
    for (const miner of testData.miners) {
      const phone = '91' + miner.phoneNumber;
      const docRef = db.collection('users').doc(phone);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        console.log('Adding miner with ID:', phone);
        await docRef.set(miner);
      } else {
        console.log('Miner already exists with ID:', phone);
      }
    }

    // Add engineers (only add if not exists)
    for (const engineer of testData.engineers) {
      const phone = '91' + engineer.phoneNumber;
      const docRef = db.collection('users').doc(phone);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        console.log('Adding engineer with ID:', phone);
        await docRef.set(engineer);
      } else {
        console.log('Engineer already exists with ID:', phone);
      }
    }

    // Add safety officers (only add if not exists)
    for (const safetyOfficer of testData.safety_officers) {
      const phone = '91' + safetyOfficer.phoneNumber;
      const docRef = db.collection('users').doc(phone);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        console.log('Adding safety officer with ID:', phone);
        await docRef.set(safetyOfficer);
      } else {
        console.log('Safety officer already exists with ID:', phone);
      }
    }

    // Add admins (only add if not exists)
    for (const admin of testData.admins) {
      const phone = '91' + admin.phoneNumber;
      const docRef = db.collection('users').doc(phone);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        console.log('Adding admin with ID:', phone);
        await docRef.set(admin);
      } else {
        console.log('Admin already exists with ID:', phone);
      }
    }

    console.log('Test data added successfully');
  } catch (error) {
    console.error('Error adding test data:', error);
  }
}

addTestData();