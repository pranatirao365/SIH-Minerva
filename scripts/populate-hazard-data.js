/**
 * Populate Firestore with Sample Hazard Data
 * 
 * Run this script to create test data for the Heat Map:
 * node scripts/populate-hazard-data.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');

try {
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
  
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Error: firebase-service-account.json not found!');
  console.error('Download it from Firebase Console → Project Settings → Service Accounts');
  process.exit(1);
}

const db = admin.firestore();

// Sample data
const sampleData = {
  // Manual Hazards
  hazards: [
    {
      type: 'blasting',
      coordinates: { x: 45, y: 30 },
      riskLevel: 'high',
      description: 'Scheduled blasting operation in Zone A. All personnel must evacuate by 14:00.',
      causes: ['Controlled demolition', 'Rock excavation for tunnel expansion'],
      controls: [
        'Safety perimeter established (500m radius)',
        'Warning sirens activated 15 minutes prior',
        'All entry points locked and guarded',
        'Blast shelter available at checkpoint'
      ],
      ppeRequired: ['Hard hat', 'Safety vest', 'Ear protection', 'Safety boots', 'Eye protection'],
      lastInspection: admin.firestore.Timestamp.fromDate(new Date('2025-12-03T10:00:00Z')),
      assignedOfficer: 'Officer Rajesh Kumar',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    },
    {
      type: 'gas',
      coordinates: { x: 70, y: 55 },
      riskLevel: 'critical',
      description: 'Methane gas detected above safe levels (2.8%). Immediate evacuation required.',
      causes: ['Natural gas pocket breach', 'Poor ventilation in Level 3'],
      controls: [
        'Area sealed and marked',
        'Ventilation system running at maximum',
        'Gas monitors deployed',
        'No entry without Level A PPE'
      ],
      ppeRequired: ['Gas mask', 'Full protective suit', 'Hard hat', 'Gloves', 'Boots'],
      lastInspection: admin.firestore.Timestamp.fromDate(new Date('2025-12-03T11:30:00Z')),
      assignedOfficer: 'Officer Priya Sharma',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    },
    {
      type: 'equipment',
      coordinates: { x: 25, y: 65 },
      riskLevel: 'medium',
      description: 'Conveyor belt malfunction detected. Maintenance in progress.',
      causes: ['Worn bearings', 'Belt misalignment'],
      controls: [
        'Equipment tagged out',
        'Maintenance crew dispatched',
        'Alternate route established'
      ],
      ppeRequired: ['Hard hat', 'Safety vest', 'Gloves', 'Safety boots'],
      lastInspection: admin.firestore.Timestamp.fromDate(new Date('2025-12-02T16:00:00Z')),
      assignedOfficer: 'Officer Amit Singh',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    },
    {
      type: 'electrical',
      coordinates: { x: 85, y: 40 },
      riskLevel: 'high',
      description: 'Exposed high-voltage cable near drill site. Repair scheduled for tonight.',
      causes: ['Cable insulation damage', 'Heavy equipment contact'],
      controls: [
        'Danger zone marked with barriers',
        'Power isolated to affected section',
        'Electrician team notified'
      ],
      ppeRequired: ['Insulated gloves', 'Hard hat', 'Safety vest', 'Insulated boots'],
      lastInspection: admin.firestore.Timestamp.fromDate(new Date('2025-12-03T09:00:00Z')),
      assignedOfficer: 'Officer Suresh Patel',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    }
  ],

  // ML Detected Hazards
  mlHazards: [
    {
      hazardType: 'fire',
      coordinates: { x: 35, y: 45 },
      confidence: 0.94,
      riskLevel: 'critical',
      severityScore: 88.5,
      boundingBox: { x: 320, y: 180, width: 150, height: 120 },
      imagePreviewUrl: '', // Base64 image would go here
      timestamp: admin.firestore.Timestamp.now(),
      detectedBy: 'YOLO Fire Detection v8',
      cameraId: 'CAM-A-023',
      notes: 'Fire detected near electrical panel. Emergency response activated.'
    },
    {
      hazardType: 'fire',
      coordinates: { x: 15, y: 75 },
      confidence: 0.87,
      riskLevel: 'high',
      severityScore: 76.2,
      boundingBox: { x: 150, y: 280, width: 100, height: 90 },
      imagePreviewUrl: '',
      timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 60000)), // 5 mins ago
      detectedBy: 'YOLO Fire Detection v8',
      cameraId: 'CAM-B-015',
      notes: 'Small fire near storage area. Fire team dispatched.'
    },
    {
      hazardType: 'crack',
      coordinates: { x: 60, y: 25 },
      confidence: 0.91,
      riskLevel: 'high',
      severityScore: 82.3,
      crackArea: 450, // pixels
      maskUrl: '', // Segmentation mask URL
      imagePreviewUrl: '',
      timestamp: admin.firestore.Timestamp.now(),
      detectedBy: 'DeepCrack Segmentation',
      cameraId: 'CAM-C-007',
      notes: 'Structural crack detected in tunnel ceiling. Structural engineer notified.'
    },
    {
      hazardType: 'crack',
      coordinates: { x: 50, y: 85 },
      confidence: 0.79,
      riskLevel: 'medium',
      severityScore: 65.8,
      crackArea: 320,
      maskUrl: '',
      imagePreviewUrl: '',
      timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 15 * 60000)), // 15 mins ago
      detectedBy: 'DeepCrack Segmentation',
      cameraId: 'CAM-D-012',
      notes: 'Wall crack detected. Monitoring for expansion.'
    }
  ],

  // Miners (Live Locations)
  miners: [
    {
      name: 'Rajesh Kumar',
      coordinates: { x: 40, y: 50 },
      PPEStatus: {
        helmet: true,
        vest: true,
        boots: true,
        gloves: true,
        goggles: true
      },
      lastCheck: admin.firestore.Timestamp.now(),
      assignedZone: 'Zone A - Drilling Section',
      status: 'safe',
      department: 'Drilling',
      shift: 'Morning',
      employeeId: 'EMP-001',
      contactNumber: '+91-9876543210'
    },
    {
      name: 'Amit Singh',
      coordinates: { x: 65, y: 35 },
      PPEStatus: {
        helmet: true,
        vest: true,
        boots: true,
        gloves: false, // Missing gloves!
        goggles: false  // Missing goggles!
      },
      lastCheck: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 60000)), // 2 mins ago
      assignedZone: 'Zone B - Excavation',
      status: 'missingPPE',
      department: 'Excavation',
      shift: 'Morning',
      employeeId: 'EMP-002',
      contactNumber: '+91-9876543211'
    },
    {
      name: 'Priya Sharma',
      coordinates: { x: 30, y: 70 },
      PPEStatus: {
        helmet: true,
        vest: true,
        boots: true,
        gloves: true,
        goggles: true
      },
      lastCheck: admin.firestore.Timestamp.now(),
      assignedZone: 'Zone C - Transport',
      status: 'safe',
      department: 'Transport',
      shift: 'Morning',
      employeeId: 'EMP-003',
      contactNumber: '+91-9876543212'
    },
    {
      name: 'Suresh Patel',
      coordinates: { x: 75, y: 60 },
      PPEStatus: {
        helmet: false, // Missing helmet - CRITICAL!
        vest: true,
        boots: true,
        gloves: true,
        goggles: false
      },
      lastCheck: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 30000)), // 30 secs ago
      assignedZone: 'Zone D - Maintenance',
      status: 'missingPPE',
      department: 'Maintenance',
      shift: 'Morning',
      employeeId: 'EMP-004',
      contactNumber: '+91-9876543213'
    },
    {
      name: 'Vikram Rao',
      coordinates: { x: 55, y: 45 },
      PPEStatus: {
        helmet: true,
        vest: true,
        boots: true,
        gloves: true,
        goggles: true
      },
      lastCheck: admin.firestore.Timestamp.now(),
      assignedZone: 'Zone A - Drilling Section',
      status: 'safe',
      department: 'Drilling',
      shift: 'Morning',
      employeeId: 'EMP-005',
      contactNumber: '+91-9876543214'
    }
  ],

  // Equipment Hazards
  equipmentHazards: [
    {
      name: 'Excavator EXC-2024-005',
      coordinates: { x: 80, y: 35 },
      riskLevel: 'medium',
      status: 'maintenance_required',
      description: 'Hydraulic system leaking. Scheduled for repair during night shift.',
      lastInspection: admin.firestore.Timestamp.fromDate(new Date('2025-11-28T14:00:00Z')),
      assignedOfficer: 'Officer Sharma',
      equipmentType: 'Heavy Machinery',
      serialNumber: 'EXC-2024-005',
      manufacturer: 'Caterpillar',
      model: '320D',
      nextInspection: admin.firestore.Timestamp.fromDate(new Date('2025-12-10T08:00:00Z'))
    },
    {
      name: 'Ventilation Fan VF-12',
      coordinates: { x: 20, y: 55 },
      riskLevel: 'high',
      status: 'critical',
      description: 'Main ventilation fan motor overheating. Emergency backup activated.',
      lastInspection: admin.firestore.Timestamp.fromDate(new Date('2025-12-03T08:00:00Z')),
      assignedOfficer: 'Officer Kumar',
      equipmentType: 'Ventilation',
      serialNumber: 'VF-12-2023',
      manufacturer: 'Industrial Fans Ltd',
      model: 'IF-5000',
      nextInspection: admin.firestore.Timestamp.fromDate(new Date('2025-12-04T08:00:00Z'))
    },
    {
      name: 'Hoist System HS-A3',
      coordinates: { x: 45, y: 80 },
      riskLevel: 'low',
      status: 'operational',
      description: 'Routine maintenance completed. All systems operational.',
      lastInspection: admin.firestore.Timestamp.fromDate(new Date('2025-12-02T10:00:00Z')),
      assignedOfficer: 'Officer Singh',
      equipmentType: 'Lifting Equipment',
      serialNumber: 'HS-A3-2022',
      manufacturer: 'MineHoist Co',
      model: 'MH-2000',
      nextInspection: admin.firestore.Timestamp.fromDate(new Date('2025-12-16T10:00:00Z'))
    }
  ],

  // Map Configuration
  mapConfig: [
    {
      id: 'default-mine-map',
      backgroundImageUrl: 'mine-location1.jpeg', // Local asset
      mapWidth: 1920,
      mapHeight: 1080,
      scale: 1.0,
      coordinateSystem: 'percentage', // x: 0-100, y: 0-100
      updatedAt: admin.firestore.Timestamp.now(),
      createdBy: 'System',
      notes: 'Main mine layout with percentage-based coordinate system'
    }
  ]
};

// Function to add data to Firestore
async function populateData() {
  console.log('\n🚀 Starting data population...\n');

  try {
    // Add Manual Hazards
    console.log('📍 Adding manual hazards...');
    for (const hazard of sampleData.hazards) {
      await db.collection('hazards').add(hazard);
    }
    console.log(`✅ Added ${sampleData.hazards.length} manual hazards`);

    // Add ML Hazards
    console.log('🤖 Adding ML-detected hazards...');
    for (const mlHazard of sampleData.mlHazards) {
      await db.collection('mlHazards').add(mlHazard);
    }
    console.log(`✅ Added ${sampleData.mlHazards.length} ML hazards`);

    // Add Miners
    console.log('👷 Adding miner locations...');
    for (const miner of sampleData.miners) {
      await db.collection('miners').add(miner);
    }
    console.log(`✅ Added ${sampleData.miners.length} miners`);

    // Add Equipment Hazards
    console.log('🔧 Adding equipment hazards...');
    for (const equipment of sampleData.equipmentHazards) {
      await db.collection('equipmentHazards').add(equipment);
    }
    console.log(`✅ Added ${sampleData.equipmentHazards.length} equipment hazards`);

    // Add Map Config
    console.log('🗺️  Adding map configuration...');
    for (const config of sampleData.mapConfig) {
      await db.collection('mapConfig').doc(config.id).set(config);
    }
    console.log(`✅ Added ${sampleData.mapConfig.length} map config`);

    console.log('\n✨ Sample data population complete!\n');
    console.log('📊 Summary:');
    console.log(`   - ${sampleData.hazards.length} Manual Hazards`);
    console.log(`   - ${sampleData.mlHazards.length} ML Hazards (2 fires, 2 cracks)`);
    console.log(`   - ${sampleData.miners.length} Miners (2 with PPE violations)`);
    console.log(`   - ${sampleData.equipmentHazards.length} Equipment Hazards`);
    console.log(`   - ${sampleData.mapConfig.length} Map Configuration`);
    console.log('\n🎉 Refresh your Heat Map to see the data!\n');

  } catch (error) {
    console.error('❌ Error populating data:', error);
    process.exit(1);
  }
}

// Run the script
populateData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
