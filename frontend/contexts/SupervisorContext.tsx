import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, doc, getDoc, onSnapshot, query, where, getDocs, Unsubscribe } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useRoleStore } from '@/hooks/useRoleStore';

interface Miner {
  id: string;
  name: string;
  phone: string;
  age?: number;
  department?: string;
  shift?: string;
  location?: string;
  hazardHistory?: any[];
  safetyScore?: number;
  role: string;
}

interface SupervisorContextType {
  assignedMiners: Miner[];
  loading: boolean;
  error: string | null;
  refreshMiners: () => Promise<void>;
}

const SupervisorContext = createContext<SupervisorContextType | undefined>(undefined);

export const useSupervisor = () => {
  const context = useContext(SupervisorContext);
  if (!context) {
    throw new Error('useSupervisor must be used within SupervisorProvider');
  }
  return context;
};

interface SupervisorProviderProps {
  children: ReactNode;
}

export const SupervisorProvider: React.FC<SupervisorProviderProps> = ({ children }) => {
  const { user } = useRoleStore();
  const [assignedMiners, setAssignedMiners] = useState<Miner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignedMiners = async () => {
    if (!user || user.role !== 'supervisor') {
      setAssignedMiners([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 [SupervisorContext] Fetching miners for supervisor:', {
        id: user.id,
        phone: user.phone,
        role: user.role
      });

      // Strategy 1: Try to get supervisor by document ID first (most reliable)
      let supervisorDoc = null;
      let supervisorData = null;
      
      if (user.id) {
        console.log(`📋 [SupervisorContext] Strategy 1: Fetching supervisor by ID: ${user.id}`);
        const supervisorRef = doc(db, 'users', user.id);
        const docSnap = await getDoc(supervisorRef);
        
        if (docSnap.exists() && docSnap.data().role === 'supervisor') {
          supervisorDoc = docSnap;
          supervisorData = docSnap.data();
          console.log('✅ [SupervisorContext] Supervisor found by ID');
        }
      }

      // Strategy 2: If not found by ID, query by phone number
      if (!supervisorDoc && user.phone) {
        console.log(`📋 [SupervisorContext] Strategy 2: Querying supervisor by phone: ${user.phone}`);
        const usersRef = collection(db, 'users');
        const supervisorQuery = query(
          usersRef,
          where('phoneNumber', '==', user.phone),
          where('role', '==', 'supervisor')
        );
        
        const supervisorSnapshot = await getDocs(supervisorQuery);
        
        if (!supervisorSnapshot.empty) {
          supervisorDoc = supervisorSnapshot.docs[0];
          supervisorData = supervisorDoc.data();
          console.log('✅ [SupervisorContext] Supervisor found by phone');
        }
      }

      // Check if supervisor was found
      if (!supervisorDoc || !supervisorData) {
        console.warn('⚠️ [SupervisorContext] No supervisor document found');
        setError('Supervisor profile not found');
        setAssignedMiners([]);
        setLoading(false);
        return;
      }

      const supervisorId = supervisorDoc.id;
      const assignedMinerIds = supervisorData.assignedMiners || [];

      console.log('✅ [SupervisorContext] Supervisor found:', {
        id: supervisorId,
        empId: supervisorData.empId,
        assignedMiners: assignedMinerIds
      });

      if (assignedMinerIds.length === 0) {
        console.log('ℹ️ No miners assigned to this supervisor');
        setAssignedMiners([]);
        setLoading(false);
        return;
      }

      // Fetch all assigned miners
      const minerPromises = assignedMinerIds.map(async (minerId: string) => {
        try {
          const minerDocRef = doc(db, 'users', minerId);
          const minerDoc = await getDoc(minerDocRef);
          
          if (minerDoc.exists()) {
            const minerData = minerDoc.data();
            return {
              id: minerDoc.id,
              name: minerData.name || 'Unknown',
              phone: minerData.phoneNumber || minerId,
              age: minerData.age,
              department: minerData.department,
              shift: minerData.shift,
              location: minerData.location,
              hazardHistory: minerData.hazardHistory || [],
              safetyScore: minerData.safetyScore || 0,
              role: minerData.role || 'miner',
            } as Miner;
          } else {
            console.warn(`⚠️ Miner document not found: ${minerId}`);
            return null;
          }
        } catch (err) {
          console.error(`❌ Error fetching miner ${minerId}:`, err);
          return null;
        }
      });

      const miners = (await Promise.all(minerPromises)).filter((m): m is Miner => m !== null);
      
      console.log(`✅ Fetched ${miners.length} miners out of ${assignedMinerIds.length} assigned`);
      setAssignedMiners(miners);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error fetching assigned miners:', err);
      setError(err.message || 'Failed to load assigned miners');
      setAssignedMiners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'supervisor') {
      fetchAssignedMiners();

      // Set up real-time listener for supervisor document
      let unsubscribe: Unsubscribe | null = null;

      const setupListener = async () => {
        // Prefer listening to specific document if we have the ID
        if (user.id) {
          console.log('🔔 [SupervisorContext] Setting up listener for supervisor ID:', user.id);
          const supervisorRef = doc(db, 'users', user.id);
          
          unsubscribe = onSnapshot(
            supervisorRef,
            (snapshot) => {
              if (snapshot.exists() && snapshot.data().role === 'supervisor') {
                console.log('🔔 [SupervisorContext] Supervisor document updated, refreshing miners...');
                fetchAssignedMiners();
              }
            },
            (error) => {
              console.error('❌ [SupervisorContext] Error in supervisor listener:', error);
            }
          );
        } else if (user.phone) {
          // Fallback to query listener if no ID
          console.log('🔔 [SupervisorContext] Setting up listener for supervisor phone:', user.phone);
          const usersRef = collection(db, 'users');
          const supervisorQuery = query(
            usersRef,
            where('phoneNumber', '==', user.phone),
            where('role', '==', 'supervisor')
          );

          unsubscribe = onSnapshot(
            supervisorQuery,
            (snapshot) => {
              if (!snapshot.empty) {
                console.log('🔔 [SupervisorContext] Supervisor data updated, refreshing miners...');
                fetchAssignedMiners();
              }
            },
            (error) => {
              console.error('❌ [SupervisorContext] Error in supervisor listener:', error);
            }
          );
        }
      };

      setupListener();

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } else {
      setAssignedMiners([]);
      setLoading(false);
    }
  }, [user?.id, user?.phone, user?.role]);

  const refreshMiners = async () => {
    await fetchAssignedMiners();
  };

  return (
    <SupervisorContext.Provider value={{ assignedMiners, loading, error, refreshMiners }}>
      {children}
    </SupervisorContext.Provider>
  );
};
