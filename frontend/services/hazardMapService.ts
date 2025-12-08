/**
 * Hazard Map Service
 * Real-time Firestore integration for Safety Officer Heat Map
 */

import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

// ===========================
// TYPE DEFINITIONS
// ===========================

export interface ManualHazard {
  id: string;
  type: 'blasting' | 'gas' | 'equipment' | 'electrical' | 'haulage' | 'slopeFailure';
  coordinates: { x: number; y: number; zoomLevel?: number };
  riskLevel: 'high' | 'medium' | 'low';
  description: string;
  causes: string[];
  controls: string[];
  ppeRequired: string[];
  lastInspection: Timestamp;
  assignedOfficer: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MLHazard {
  id: string;
  hazardType: 'fire' | 'crack';
  
  // Fire (YOLO) specific
  boundingBox?: { x: number; y: number; width: number; height: number };
  
  // Crack (DeepCrack) specific
  maskUrl?: string;
  severityScore?: number;
  crackArea?: number;
  
  confidence: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  imagePreviewUrl: string;
  coordinates: { x: number; y: number };
  timestamp: Timestamp;
  status?: 'active' | 'resolved' | 'false_positive';
  verifiedBy?: string;
  verifiedAt?: Timestamp;
}

export interface MinerLocation {
  id: string;
  name: string;
  coordinates: { x: number; y: number };
  PPEStatus: {
    helmet: boolean;
    vest: boolean;
    boots: boolean;
    gloves: boolean;
    mask?: boolean;
  };
  lastCheck: Timestamp;
  assignedZone: string;
  status: 'safe' | 'inDanger' | 'missingPPE';
  department?: string;
  shift?: string;
}

export interface EquipmentHazard {
  id: string;
  name: string;
  coordinates: { x: number; y: number };
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  status: 'operational' | 'faulty' | 'under_maintenance' | 'decommissioned';
  description: string;
  lastInspection: Timestamp;
  assignedOfficer: string;
  equipmentType?: string;
  serialNumber?: string;
}

export interface MapConfig {
  id: string;
  backgroundImageUrl: string;
  mapWidth: number;
  mapHeight: number;
  scale: number;
  coordinateSystem: 'pixel' | 'percentage' | 'geographic';
  overlayOpacity?: number;
  updatedAt: Timestamp;
}

// ===========================
// MANUAL HAZARDS
// ===========================

export const subscribeToManualHazards = (
  callback: (hazards: ManualHazard[]) => void,
  onError?: (error: Error) => void
) => {
  try {
    const hazardsRef = collection(db, 'hazards');
    const q = query(hazardsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hazards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ManualHazard));
      callback(hazards);
    }, (error) => {
      console.error('Error subscribing to manual hazards:', error);
      if (onError) onError(error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up manual hazards subscription:', error);
    if (onError) onError(error as Error);
    return () => {};
  }
};

export const createManualHazard = async (hazardData: Omit<ManualHazard, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const hazardId = `hazard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const hazardRef = doc(db, 'hazards', hazardId);
    
    await setDoc(hazardRef, {
      ...hazardData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    console.log('✅ Manual hazard created:', hazardId);
    return hazardId;
  } catch (error) {
    console.error('❌ Error creating manual hazard:', error);
    throw error;
  }
};

// ===========================
// ML HAZARDS (Fire + Crack)
// ===========================

export const subscribeToMLHazards = (
  callback: (mlHazards: MLHazard[]) => void,
  onError?: (error: Error) => void
) => {
  try {
    const mlHazardsRef = collection(db, 'mlHazards');
    const q = query(
      mlHazardsRef, 
      where('status', '!=', 'false_positive'),
      orderBy('status'),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mlHazards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MLHazard));
      callback(mlHazards);
    }, (error) => {
      console.error('Error subscribing to ML hazards:', error);
      if (onError) onError(error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up ML hazards subscription:', error);
    if (onError) onError(error as Error);
    return () => {};
  }
};

export const createMLHazard = async (mlHazardData: Omit<MLHazard, 'id' | 'timestamp'>): Promise<string> => {
  try {
    const mlHazardId = `ml_hazard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mlHazardRef = doc(db, 'mlHazards', mlHazardId);
    
    await setDoc(mlHazardRef, {
      ...mlHazardData,
      timestamp: Timestamp.now(),
      status: 'active'
    });
    
    console.log('✅ ML hazard created:', mlHazardId);
    return mlHazardId;
  } catch (error) {
    console.error('❌ Error creating ML hazard:', error);
    throw error;
  }
};

export const updateMLHazardStatus = async (
  mlHazardId: string, 
  status: 'active' | 'resolved' | 'false_positive',
  verifiedBy?: string
): Promise<void> => {
  try {
    const mlHazardRef = doc(db, 'mlHazards', mlHazardId);
    await updateDoc(mlHazardRef, {
      status,
      verifiedBy,
      verifiedAt: Timestamp.now()
    });
    console.log('✅ ML hazard status updated:', mlHazardId);
  } catch (error) {
    console.error('❌ Error updating ML hazard status:', error);
    throw error;
  }
};

// ===========================
// MINERS
// ===========================

export const subscribeToMiners = (
  callback: (miners: MinerLocation[]) => void,
  onError?: (error: Error) => void
) => {
  try {
    const minersRef = collection(db, 'miners');
    
    const unsubscribe = onSnapshot(minersRef, (snapshot) => {
      const miners = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MinerLocation));
      callback(miners);
    }, (error) => {
      console.error('Error subscribing to miners:', error);
      if (onError) onError(error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up miners subscription:', error);
    if (onError) onError(error as Error);
    return () => {};
  }
};

export const updateMinerLocation = async (
  minerId: string,
  coordinates: { x: number; y: number },
  assignedZone: string
): Promise<void> => {
  try {
    const minerRef = doc(db, 'miners', minerId);
    await updateDoc(minerRef, {
      coordinates,
      assignedZone,
      lastCheck: Timestamp.now()
    });
    console.log('✅ Miner location updated:', minerId);
  } catch (error) {
    console.error('❌ Error updating miner location:', error);
    throw error;
  }
};

// ===========================
// EQUIPMENT HAZARDS
// ===========================

export const subscribeToEquipmentHazards = (
  callback: (equipment: EquipmentHazard[]) => void,
  onError?: (error: Error) => void
) => {
  try {
    const equipmentRef = collection(db, 'equipmentHazards');
    const q = query(equipmentRef, orderBy('lastInspection', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const equipment = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as EquipmentHazard));
      callback(equipment);
    }, (error) => {
      console.error('Error subscribing to equipment hazards:', error);
      if (onError) onError(error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up equipment hazards subscription:', error);
    if (onError) onError(error as Error);
    return () => {};
  }
};

// ===========================
// MAP CONFIG
// ===========================

export const getMapConfig = async (): Promise<MapConfig | null> => {
  try {
    const mapConfigRef = doc(db, 'mapConfig', 'default_map');
    const mapConfigSnap = await getDoc(mapConfigRef);
    
    if (mapConfigSnap.exists()) {
      return {
        id: mapConfigSnap.id,
        ...mapConfigSnap.data()
      } as MapConfig;
    } else {
      console.warn('⚠️ No map config found, using defaults');
      return {
        id: 'default_map',
        backgroundImageUrl: require('../assets/images/mine-location1.jpeg'),
        mapWidth: 1920,
        mapHeight: 1080,
        scale: 1,
        coordinateSystem: 'percentage',
        overlayOpacity: 0.7,
        updatedAt: Timestamp.now()
      };
    }
  } catch (error) {
    console.error('❌ Error fetching map config:', error);
    return null;
  }
};

export const updateMapConfig = async (configData: Partial<MapConfig>): Promise<void> => {
  try {
    const mapConfigRef = doc(db, 'mapConfig', 'default_map');
    await setDoc(mapConfigRef, {
      ...configData,
      updatedAt: Timestamp.now()
    }, { merge: true });
    console.log('✅ Map config updated');
  } catch (error) {
    console.error('❌ Error updating map config:', error);
    throw error;
  }
};

// ===========================
// ML BACKEND API INTEGRATION
// ===========================

const ML_BACKEND_URL = `http://${process.env.EXPO_PUBLIC_IP_ADDRESS || '192.168.137.122'}:8080`;

export interface FireDetectionResult {
  hazard_type: 'fire';
  severity_label: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  severity_percent: number;
  processed_image: string; // base64
  extra_outputs: {
    num_detections: number;
    max_confidence: number;
  };
}

export interface CrackDetectionResult {
  hazard_type: 'crack';
  severity_label: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  severity_percent: number;
  processed_image: string; // base64
  extra_outputs: {
    fused: string;
    binary_mask: string;
    side1?: string;
    side2?: string;
    side3?: string;
    side4?: string;
    side5?: string;
    crack_pixels: number;
    total_pixels: number;
  };
}

export const detectFire = async (imageUri: string): Promise<FireDetectionResult> => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: 'fire_detection.jpg',
      type: 'image/jpeg'
    } as any);
    formData.append('hazard_type', 'fire');
    
    const response = await fetch(`${ML_BACKEND_URL}/predict`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Fire detection failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Fire detection complete:', result.severity_label);
    return result;
  } catch (error) {
    console.error('❌ Fire detection error:', error);
    throw error;
  }
};

export const detectCrack = async (imageUri: string): Promise<CrackDetectionResult> => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: 'crack_detection.jpg',
      type: 'image/jpeg'
    } as any);
    formData.append('hazard_type', 'crack');
    
    const response = await fetch(`${ML_BACKEND_URL}/predict`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Crack detection failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Crack detection complete:', result.severity_label);
    return result;
  } catch (error) {
    console.error('❌ Crack detection error:', error);
    throw error;
  }
};

// ===========================
// UTILITY FUNCTIONS
// ===========================

export const calculatePPECompliance = (ppeStatus: MinerLocation['PPEStatus']): number => {
  const items = Object.values(ppeStatus);
  const compliant = items.filter(Boolean).length;
  return Math.round((compliant / items.length) * 100);
};

export const getRiskLevelColor = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'critical':
      return '#FF3B30';
    case 'high':
      return '#FF2D55';
    case 'medium':
      return '#FF9500';
    case 'low':
      return '#FFD60A';
    default:
      return '#6C6C70';
  }
};

export const getHazardTypeColor = (type: string): string => {
  switch (type) {
    case 'fire':
      return '#FF3B30';
    case 'crack':
      return '#FF2D55';
    case 'blasting':
      return '#FF9500';
    case 'gas':
      return '#0A84FF';
    case 'equipment':
    case 'electrical':
      return '#FFD60A';
    default:
      return '#6C6C70';
  }
};
