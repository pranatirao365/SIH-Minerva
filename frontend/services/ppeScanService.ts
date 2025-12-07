/**
 * PPE Scan Service - Department-Based Integration
 * 
 * This service integrates with the department-based PPE detection API.
 * Use this in your React Native app to perform PPE scans based on miner's assigned department.
 */

const API_BASE_URL = `http://${process.env.EXPO_PUBLIC_IP_ADDRESS || '172.20.10.2'}:8888`;

/**
 * Get all available departments and their PPE requirements
 */
export async function getDepartments() {
  try {
    const response = await fetch(`${API_BASE_URL}/departments`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
}

/**
 * Perform PPE scan for a specific department
 * 
 * @param {File|Blob} imageFile - The image file to scan
 * @param {string} department - Department name (e.g., 'mining_operations')
 * @param {string} ppeSet - Optional PPE set (e.g., 'set_a_basic')
 * @returns {Promise<Object>} PPE scan results with compliance information
 */
export async function performPPEScan(imageFile, department, ppeSet = null) {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('department', department);
    
    if (ppeSet) {
      formData.append('ppe_set', ppeSet);
    }

    const response = await fetch(`${API_BASE_URL}/ppe-scan`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error performing PPE scan:', error);
    throw error;
  }
}

/**
 * Get miner's department from Firebase and perform PPE scan
 * 
 * @param {string} minerId - The miner's ID
 * @param {File|Blob} imageFile - The image file to scan
 * @param {Object} firebaseDb - Firebase database instance
 * @returns {Promise<Object>} PPE scan results
 */
export async function scanMinerPPE(minerId, imageFile, firebaseDb) {
  try {
    // 1. Get miner's assigned department from Firebase
    const minerDoc = await firebaseDb.collection('users').doc(minerId).get();
    
    if (!minerDoc.exists) {
      throw new Error('Miner not found');
    }

    const minerData = minerDoc.data();
    const department = minerData.department;
    const ppeSet = minerData.ppeSet; // Optional: specific PPE set for the miner

    if (!department) {
      throw new Error('Miner has no assigned department');
    }

    // 2. Perform PPE scan with the miner's department
    const scanResult = await performPPEScan(imageFile, department, ppeSet);

    // 3. Store scan result in Firebase (optional)
    await firebaseDb.collection('ppe_scans').add({
      minerId: minerId,
      department: department,
      ppeSet: scanResult.ppe_set,
      timestamp: new Date(),
      compliance: scanResult.compliance,
      ppeItems: scanResult.ppe_items,
    });

    return scanResult;
  } catch (error) {
    console.error('Error scanning miner PPE:', error);
    throw error;
  }
}

/**
 * React Native example usage in a component
 */
export const PPEScanExample = () => {
  const scanWorker = async (minerId, imageUri) => {
    try {
      // Convert image URI to blob/file
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Create file from blob
      const file = new File([blob], 'ppe_scan.jpg', { type: 'image/jpeg' });
      
      // Perform scan
      const result = await scanMinerPPE(minerId, file, firebaseDb);
      
      // Handle result
      if (result.compliance.is_compliant) {
        alert('✅ Worker is PPE compliant!');
      } else {
        const missingItems = Object.entries(result.ppe_items)
          .filter(([_, item]) => !item.present)
          .map(([name]) => name);
        
        alert(`⚠️ Worker is missing: ${missingItems.join(', ')}`);
      }
      
      return result;
    } catch (error) {
      alert(`Error: ${error.message}`);
      console.error(error);
    }
  };
  
  return { scanWorker };
};

/**
 * Format PPE scan results for display
 */
export function formatPPEResults(scanResult) {
  const { department, ppe_set, ppe_items, compliance } = scanResult;
  
  const missingItems = Object.entries(ppe_items)
    .filter(([_, item]) => !item.present)
    .map(([name]) => name.replace('_', ' ').toUpperCase());
  
  const presentItems = Object.entries(ppe_items)
    .filter(([_, item]) => item.present)
    .map(([name]) => name.replace('_', ' ').toUpperCase());
  
  return {
    department: department.replace('_', ' ').toUpperCase(),
    set: ppe_set.replace('_', ' ').toUpperCase(),
    compliancePercentage: compliance.percentage,
    isCompliant: compliance.is_compliant,
    missingItems,
    presentItems,
    summary: compliance.is_compliant
      ? `✅ Fully compliant with ${department} requirements`
      : `⚠️ ${compliance.percentage}% compliant - Missing: ${missingItems.join(', ')}`,
  };
}

/**
 * Department mapping for UI display
 */
export const DEPARTMENT_DISPLAY_NAMES = {
  mining_operations: 'Mining Operations',
  blasting: 'Blasting',
  equipment_maintenance: 'Equipment Maintenance',
  safety_inspection: 'Safety Inspection',
};

export const PPE_SET_DISPLAY_NAMES = {
  set_a_basic: 'Basic Protection',
  set_b_dust_drilling: 'Dust/Drilling Protection',
  set_a_mandatory: 'Mandatory Protection',
  set_b_full_protection: 'Full Protection',
  set_a_standard: 'Standard Protection',
  set_b_chemical_oil: 'Chemical/Oil Protection',
  set_a_inspection: 'Inspection Protection',
  set_b_risky_zone: 'Risky Zone Protection',
};

export default {
  getDepartments,
  performPPEScan,
  scanMinerPPE,
  formatPPEResults,
  DEPARTMENT_DISPLAY_NAMES,
  PPE_SET_DISPLAY_NAMES,
};
