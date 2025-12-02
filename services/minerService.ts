import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Miner {
  id: string;
  name: string;
  email?: string;
  role: string;
  department?: string;
  status?: string;
  [key: string]: any;
}

/**
 * Get all registered miners from Firestore
 */
export async function getRegisteredMiners(): Promise<Miner[]> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'miner'));
    const querySnapshot = await getDocs(q);
    
    const miners: Miner[] = [];
    querySnapshot.forEach((doc) => {
      miners.push({
        id: doc.id,
        ...doc.data(),
      } as Miner);
    });
    
    return miners;
  } catch (error) {
    console.error('Error fetching miners:', error);
    return [];
  }
}

/**
 * Get a miner by ID from Firestore
 */
export async function getMinerById(minerId: string): Promise<Miner | null> {
  try {
    const minerRef = doc(db, 'users', minerId);
    const minerDoc = await getDoc(minerRef);
    
    if (minerDoc.exists() && minerDoc.data().role === 'miner') {
      return {
        id: minerDoc.id,
        ...minerDoc.data(),
      } as Miner;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching miner by ID:', error);
    return null;
  }
}

/**
 * Get miners by status from Firestore
 */
export async function getMinersByStatus(status: string): Promise<Miner[]> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('role', '==', 'miner'),
      where('status', '==', status)
    );
    const querySnapshot = await getDocs(q);
    
    const miners: Miner[] = [];
    querySnapshot.forEach((doc) => {
      miners.push({
        id: doc.id,
        ...doc.data(),
      } as Miner);
    });
    
    return miners;
  } catch (error) {
    console.error('Error fetching miners by status:', error);
    return [];
  }
}

/**
 * Get all active miners from Firestore
 */
export async function getActiveMiners(): Promise<Miner[]> {
  return getMinersByStatus('active');
}

/**
 * Get miners assigned to a specific supervisor from Firestore
 * Supports multiple assignment methods:
 * 1. supervisor.assignedMiners array (list of miner document IDs)
 * 2. miner.supervisorId field (empId reference)
 */
export async function getMinersBySupervisor(supervisorId: string): Promise<Miner[]> {
  try {
    console.log(`🔍 Fetching miners for supervisor ID: ${supervisorId}`);
    
    // Get the supervisor document
    const supervisorRef = doc(db, 'users', supervisorId);
    const supervisorDoc = await getDoc(supervisorRef);
    
    if (!supervisorDoc.exists()) {
      console.log(`❌ Supervisor not found: ${supervisorId}`);
      return [];
    }
    
    const supervisorData = supervisorDoc.data();
    const supervisorEmpId = supervisorData.empId || supervisorId;
    const assignedMiners = supervisorData.assignedMiners || [];
    
    console.log(`👤 Supervisor empId: ${supervisorEmpId}`);
    console.log(`📋 Assigned miners array: ${assignedMiners.length} miners`);
    
    const miners: Miner[] = [];
    const minerIds = new Set<string>(); // Prevent duplicates
    
    // Method 1: Check supervisor's assignedMiners array
    if (assignedMiners.length > 0) {
      console.log(`📊 Method 1: Fetching miners from assignedMiners array...`);
      for (const minerId of assignedMiners) {
        try {
          const minerRef = doc(db, 'users', minerId);
          const minerDoc = await getDoc(minerRef);
          
          if (minerDoc.exists() && minerDoc.data().role === 'miner') {
            if (!minerIds.has(minerDoc.id)) {
              miners.push({
                id: minerDoc.id,
                ...minerDoc.data(),
              } as Miner);
              minerIds.add(minerDoc.id);
            }
          }
        } catch (error) {
          console.error(`Error fetching miner ${minerId}:`, error);
        }
      }
      console.log(`✅ Found ${miners.length} miners from assignedMiners array`);
    }
    
    // Method 2: Query miners by supervisorId field (empId)
    console.log(`📊 Method 2: Querying miners by supervisorId field...`);
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('role', '==', 'miner'),
      where('supervisorId', '==', supervisorEmpId)
    );
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((doc) => {
      if (!minerIds.has(doc.id)) {
        miners.push({
          id: doc.id,
          ...doc.data(),
        } as Miner);
        minerIds.add(doc.id);
      }
    });
    
    console.log(`✅ Total unique miners loaded: ${miners.length}`);
    
    // Method 3: Fallback - try with document ID if still no miners
    if (miners.length === 0 && supervisorEmpId !== supervisorId) {
      console.log(`🔄 Method 3: Fallback - trying with document ID...`);
      const q2 = query(
        usersRef,
        where('role', '==', 'miner'),
        where('supervisorId', '==', supervisorId)
      );
      const querySnapshot2 = await getDocs(q2);
      
      querySnapshot2.forEach((doc) => {
        if (!minerIds.has(doc.id)) {
          miners.push({
            id: doc.id,
            ...doc.data(),
          } as Miner);
          minerIds.add(doc.id);
        }
      });
      
      console.log(`✅ Found ${miners.length} miners with document ID fallback`);
    }
    
    return miners;
  } catch (error) {
    console.error('Error fetching miners by supervisor:', error);
    return [];
  }
}