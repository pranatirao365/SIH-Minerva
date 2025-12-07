const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with source project
// Make sure you have serviceAccountKey.json in this directory
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  console.error('Please download your service account key from:');
  console.error('https://console.firebase.google.com/project/sihtut-1/settings/serviceaccounts/adminsdk');
  console.error('And save it as serviceAccountKey.json in this directory.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'sihtut-1'
});

// Export from default database - change databaseId if your data is in a different database
const db = admin.firestore();
// Uncomment and set the database ID if needed:
// db.settings({ databaseId: 'your-database-id' });

async function exportCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const data = [];
  
  snapshot.forEach(doc => {
    data.push({
      id: doc.id,
      data: doc.data()
    });
  });
  
  return data;
}

async function exportAllCollections() {
  console.log('Starting Firestore export from project: sihtut-1');
  console.log('Database: (default)\n');
  
  // Get all collections from the database
  const collections = await db.listCollections();
  const allData = {};

  if (collections.length === 0) {
    console.log('⚠️  No collections found in the default database.');
    return {};
  }
  
  for (const collection of collections) {
    const collectionName = collection.id;
    console.log(`Exporting collection: ${collectionName}`);
    try {
      allData[collectionName] = await exportCollection(collectionName);
      console.log(`  - Exported ${allData[collectionName].length} documents`);
    } catch (error) {
      console.error(`  - Failed to export ${collectionName}:`, error.message);
    }
  }
  
  // Save to JSON file
  const outputPath = path.join(__dirname, 'firestore-backup.json');
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
  
  console.log(`\nExport complete! Data saved to: ${outputPath}`);
  console.log(`Total collections: ${Object.keys(allData).length}`);
  
  return allData;
}

exportAllCollections()
  .then(() => {
    console.log('\n✅ Export successful!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Export failed:', error);
    process.exit(1);
  });
