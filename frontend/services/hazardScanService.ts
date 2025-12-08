/**
 * Hazard Scan Firebase Service
 * Save hazard detection results to Firebase Storage & Firestore
 * Frontend-only implementation using Firebase v9 modular SDK
 */

import { collection, doc, setDoc, Timestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../config/firebase';

// TypeScript interface for hazard scan results
export interface HazardScanResult {
  scanId: string;
  userId: string;
  imageUrl: string;
  hazardType: string;
  confidence: number;
  description: string;
  timestamp: Timestamp;
  severity?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  metadata?: {
    deviceInfo?: string;
    networkType?: string;
    processingTime?: number;
  };
}

/**
 * Save hazard scan results to Firebase
 * @param imageFile - File/Blob of the captured hazard image
 * @param hazardType - Type of hazard detected (e.g., 'crack', 'fire', 'leakage')
 * @param confidence - Detection confidence score (0-100)
 * @param description - Description of the hazard
 * @param userId - ID of the user performing the scan
 * @param additionalData - Optional metadata (severity, location, etc.)
 * @returns Promise with scanId and imageUrl on success
 */
export async function saveHazardScan(
  imageFile: Blob | File,
  hazardType: string,
  confidence: number,
  description: string,
  userId: string,
  additionalData?: {
    severity?: string;
    location?: {
      latitude?: number;
      longitude?: number;
      address?: string;
    };
    metadata?: {
      deviceInfo?: string;
      networkType?: string;
      processingTime?: number;
    };
  }
): Promise<{ success: boolean; scanId?: string; imageUrl?: string; error?: string }> {
  try {
    console.log('💾 Saving hazard scan to Firebase...');

    // Step 1: Generate unique scan ID
    const scanId = doc(collection(db, 'hazard_scans')).id;
    console.log('🆔 Generated scanId:', scanId);

    // Step 2: Upload image to Firebase Storage using Auth UID
    console.log('📤 Uploading image to Firebase Storage...');
    
    // ✅ Allow saving even when user is not authenticated (TEST MODE)
    let uid = "TEST_MODE_USER";
    
    const user = auth.currentUser;
    if (user) {
      uid = user.uid;   // use real UID if logged in
    }
    
    const imageExtension = imageFile.type?.split('/')[1] || 'jpg';
    const storagePath = `hazard_scans/${uid}/${scanId}.${imageExtension}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, imageFile, {
      contentType: imageFile.type || 'image/jpeg',
      customMetadata: {
        uploadedBy: userId,
        hazardType: hazardType,
        timestamp: new Date().toISOString(),
      },
    });

    console.log('✅ Image uploaded successfully');

    // Step 3: Get download URL
    const imageUrl = await getDownloadURL(storageRef);
    console.log('🔗 Image URL:', imageUrl);

    // Step 4: Create Firestore document
    console.log('📝 Creating Firestore document...');
    const hazardScanDoc: HazardScanResult = {
      scanId,
      userId: uid,  // Use uid instead of userId parameter
      imageUrl,
      hazardType,
      confidence,
      description,
      timestamp: Timestamp.now(),
      ...additionalData,
    };

    const docRef = doc(db, 'hazard_scans', scanId);
    await setDoc(docRef, hazardScanDoc);

    console.log('✅ Hazard scan saved successfully!');
    console.log('📊 Scan ID:', scanId);
    console.log('🖼️ Image URL:', imageUrl);

    return {
      success: true,
      scanId,
      imageUrl,
    };
  } catch (error: any) {
    console.error('❌ Error saving hazard scan:', error);
    return {
      success: false,
      error: error.message || 'Failed to save hazard scan',
    };
  }
}

/**
 * Get all hazard scans for a specific user
 * @param userId - User ID to fetch scans for
 * @param limitCount - Maximum number of scans to return (default: 50)
 * @returns Promise with array of hazard scan results
 */
export async function getUserHazardScans(
  userId: string,
  limitCount: number = 50
): Promise<HazardScanResult[]> {
  try {
    const scansRef = collection(db, 'hazard_scans');
    const q = query(
      scansRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const scans: HazardScanResult[] = [];

    querySnapshot.forEach((doc) => {
      scans.push(doc.data() as HazardScanResult);
    });

    console.log(`✅ Retrieved ${scans.length} hazard scans for user ${userId}`);
    return scans;
  } catch (error) {
    console.error('❌ Error fetching user hazard scans:', error);
    throw error;
  }
}

/**
 * Get a specific hazard scan by ID
 * @param scanId - Scan ID to retrieve
 * @returns Promise with hazard scan result or null if not found
 */
export async function getHazardScan(scanId: string): Promise<HazardScanResult | null> {
  try {
    const docRef = doc(db, 'hazard_scans', scanId);
    const docSnap = await getDocs(query(collection(db, 'hazard_scans'), where('__name__', '==', scanId)));

    if (!docSnap.empty) {
      return docSnap.docs[0].data() as HazardScanResult;
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching hazard scan:', error);
    throw error;
  }
}

/**
 * Get hazard scans by hazard type
 * @param userId - User ID
 * @param hazardType - Type of hazard to filter by
 * @param limitCount - Maximum number of scans to return
 * @returns Promise with array of filtered hazard scan results
 */
export async function getHazardScansByType(
  userId: string,
  hazardType: string,
  limitCount: number = 20
): Promise<HazardScanResult[]> {
  try {
    const scansRef = collection(db, 'hazard_scans');
    const q = query(
      scansRef,
      where('userId', '==', userId),
      where('hazardType', '==', hazardType),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const scans: HazardScanResult[] = [];

    querySnapshot.forEach((doc) => {
      scans.push(doc.data() as HazardScanResult);
    });

    console.log(`✅ Retrieved ${scans.length} ${hazardType} scans for user ${userId}`);
    return scans;
  } catch (error) {
    console.error('❌ Error fetching hazard scans by type:', error);
    throw error;
  }
}
