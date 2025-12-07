const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with target project
// Replace this with your NEW service account key
const serviceAccount = require('./new-serviceAccountKey.json');

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'sih-dec-2025'
});

// Connect to the minerva1 named database
const db = admin.firestore(app);
// Configure to use minerva1 database
db.settings({ databaseId: 'minerva1' });

async function importCollection(collectionName, documents) {
  console.log(`Importing collection: ${collectionName}`);
  const batch = db.batch();
  let count = 0;
  
  for (const doc of documents) {
    const docRef = db.collection(collectionName).doc(doc.id);
    batch.set(docRef, doc.data);
    count++;
    
    // Firestore batch limit is 500 operations
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`  - Committed ${count} documents`);
    }
  }
  
  // Commit remaining documents
  if (count % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`  - Total imported: ${count} documents`);
}

async function importAllCollections() {
  console.log('Starting Firestore import...');
  
  // Read backup file
  const backupPath = path.join(__dirname, 'firestore-backup.json');
  const allData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  
  for (const [collectionName, documents] of Object.entries(allData)) {
    await importCollection(collectionName, documents);
  }
  
  console.log('\n✅ Import complete!');
  console.log(`Total collections imported: ${Object.keys(allData).length}`);
}

importAllCollections()
  .then(() => {
    console.log('\n✅ Import successful!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });
