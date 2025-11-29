import { create } from 'zustand';

// Phase definitions
export const BLASTING_PHASES = {
  BRIEFING: 'briefing',
  PRE_BLAST: 'pre_blast',
  BLAST_SEQUENCE: 'blast_sequence',
  POST_BLAST: 'post_blast',
  COMPLETION: 'completion'
} as const;

export type BlastingPhase = typeof BLASTING_PHASES[keyof typeof BLASTING_PHASES];

// Pre-Blast Tasks
export const PRE_BLAST_TASKS = [
  {
    id: 'perimeter_check',
    title: 'Verify Blast Perimeter',
    description: 'Check if all workers are outside the danger zone',
    xpReward: 50,
    timeLimit: 15
  },
  {
    id: 'evacuation_alarm',
    title: 'Sound Evacuation Alarm',
    description: 'Sound three evacuation horn blasts to alert all workers',
    xpReward: 50,
    timeLimit: 10,
    requiredBlasts: 3
  },
  {
    id: 'shelter_verification',
    title: 'Check Shelter Readiness',
    description: 'Confirm all workers are in protected areas',
    xpReward: 50,
    shelters: [
      { id: 'A', workers: 12, status: 'safe' },
      { id: 'B', workers: 8, status: 'safe' },
      { id: 'C', workers: 5, status: 'safe' }
    ]
  }
];

// Blast Sequence Data
export const BLAST_HOLES = [
  { id: 1, sequence: 1, status: 'primed' },
  { id: 2, sequence: 2, status: 'primed' },
  { id: 3, sequence: 3, status: 'primed' },
  { id: 4, sequence: 4, status: 'primed' },
  { id: 5, sequence: 5, status: 'primed' }
];

export const SAFETY_CHECKLIST = [
  { id: 'perimeter', label: 'Perimeter secure', status: 'complete' },
  { id: 'shelters', label: 'Shelters manned', status: 'complete' },
  { id: 'blast_holes', label: 'Blast holes primed', status: 'complete' },
  { id: 'detonators', label: 'Detonators checked', status: 'complete' },
  { id: 'signal_line', label: 'Signal line clear', status: 'complete' }
];

// Post-Blast Tasks
export const POST_BLAST_TASKS = [
  {
    id: 'crater_inspection',
    title: 'Check Blast Crater',
    description: 'Verify blast went as planned',
    metrics: {
      depth: '15m',
      fragmentQuality: '80%',
      targetRange: true
    }
  },
  {
    id: 'flyrock_check',
    title: 'Verify Flyrock Containment',
    description: 'Check for hazards outside perimeter',
    metrics: {
      maxDistance: 145,
      expectedDistance: 160,
      controlled: true
    }
  },
  {
    id: 'reentry_clearance',
    title: 'Clear Safe Re-entry',
    description: 'Authorize worker re-entry to safe zones only',
    zones: [
      { id: 'red', label: 'RED ZONE: Blast crater (no entry)', color: '#EF4444' },
      { id: 'yellow', label: 'YELLOW ZONE: Flyrock field (limited entry with PPE)', color: '#F59E0B' },
      { id: 'green', label: 'GREEN ZONE: Safe work resumption area', color: '#10B981' }
    ]
  }
];

interface BlastingGameState {
  // Current phase
  currentPhase: BlastingPhase;
  
  // XP tracking
  totalXP: number;
  
  // Pre-Blast phase state
  currentTaskIndex: number;
  timeToDetonation: number;
  evacuationStarted: boolean;
  alarmBlasts: number;
  workersEvacuated: number;
  totalWorkers: number;
  
  // Blast Sequence phase state
  blastCountdown: number;
  currentBlastHole: number;
  seismicMagnitude: number;
  flyrockDistance: number;
  anomalyDetected: boolean;
  
  // Post-Blast phase state
  postBlastTaskIndex: number;
  craterInspected: boolean;
  flyrockVerified: boolean;
  reentryAuthorized: boolean;
  
  // Performance metrics
  evacuationTime: number;
  safetyCompliance: number;
  workerIncidents: number;
  anomaliesDetected: number;
  
  // Actions
  setPhase: (phase: BlastingPhase) => void;
  addXP: (amount: number) => void;
  
  // Pre-Blast actions
  startEvacuation: () => void;
  soundAlarm: () => void;
  completeTask: () => void;
  nextTask: () => void;
  
  // Blast Sequence actions
  startBlastSequence: () => void;
  detonateHole: () => void;
  detectAnomaly: () => void;
  
  // Post-Blast actions
  inspectCrater: () => void;
  verifyFlyrock: () => void;
  authorizeReentry: () => void;
  nextPostTask: () => void;
  
  // Reset
  resetGame: () => void;
}

const useBlastingGameStore = create<BlastingGameState>((set, get) => ({
  // Initial state
  currentPhase: BLASTING_PHASES.BRIEFING,
  totalXP: 0,
  
  // Pre-Blast initial state
  currentTaskIndex: 0,
  timeToDetonation: 300, // 5 minutes
  evacuationStarted: false,
  alarmBlasts: 0,
  workersEvacuated: 0,
  totalWorkers: 25,
  
  // Blast Sequence initial state
  blastCountdown: 180, // 3 minutes
  currentBlastHole: 0,
  seismicMagnitude: 0,
  flyrockDistance: 0,
  anomalyDetected: false,
  
  // Post-Blast initial state
  postBlastTaskIndex: 0,
  craterInspected: false,
  flyrockVerified: false,
  reentryAuthorized: false,
  
  // Performance metrics initial state
  evacuationTime: 0,
  safetyCompliance: 100,
  workerIncidents: 0,
  anomaliesDetected: 0,
  
  // Actions
  setPhase: (phase) => set({ currentPhase: phase }),
  
  addXP: (amount) => set((state) => ({ totalXP: state.totalXP + amount })),
  
  // Pre-Blast actions
  startEvacuation: () => set({ evacuationStarted: true }),
  
  soundAlarm: () => set((state) => {
    const newBlasts = state.alarmBlasts + 1;
    if (newBlasts >= 3) {
      return { alarmBlasts: newBlasts, evacuationStarted: true };
    }
    return { alarmBlasts: newBlasts };
  }),
  
  completeTask: () => {
    const state = get();
    const task = PRE_BLAST_TASKS[state.currentTaskIndex];
    if (task) {
      set({ totalXP: state.totalXP + task.xpReward });
    }
  },
  
  nextTask: () => set((state) => {
    const nextIndex = state.currentTaskIndex + 1;
    if (nextIndex >= PRE_BLAST_TASKS.length) {
      return {
        currentTaskIndex: nextIndex,
        currentPhase: BLASTING_PHASES.BLAST_SEQUENCE,
        evacuationTime: 300 - state.timeToDetonation
      };
    }
    return { currentTaskIndex: nextIndex };
  }),
  
  // Blast Sequence actions
  startBlastSequence: () => set({ 
    currentPhase: BLASTING_PHASES.BLAST_SEQUENCE,
    blastCountdown: 180 
  }),
  
  detonateHole: () => set((state) => {
    const nextHole = state.currentBlastHole + 1;
    const magnitude = 1 + Math.random() * 3; // 1-4 Richter scale
    const distance = 130 + Math.random() * 30; // 130-160m flyrock
    
    if (nextHole >= BLAST_HOLES.length) {
      return {
        currentBlastHole: nextHole,
        seismicMagnitude: magnitude,
        flyrockDistance: distance,
        currentPhase: BLASTING_PHASES.POST_BLAST
      };
    }
    
    return {
      currentBlastHole: nextHole,
      seismicMagnitude: magnitude,
      flyrockDistance: distance
    };
  }),
  
  detectAnomaly: () => set((state) => ({
    anomalyDetected: true,
    anomaliesDetected: state.anomaliesDetected + 1,
    totalXP: state.totalXP + 25
  })),
  
  // Post-Blast actions
  inspectCrater: () => set((state) => ({ 
    craterInspected: true,
    totalXP: state.totalXP + 25
  })),
  
  verifyFlyrock: () => set((state) => ({ 
    flyrockVerified: true,
    totalXP: state.totalXP + 25
  })),
  
  authorizeReentry: () => set((state) => ({ 
    reentryAuthorized: true,
    totalXP: state.totalXP + 25
  })),
  
  nextPostTask: () => set((state) => {
    const nextIndex = state.postBlastTaskIndex + 1;
    if (nextIndex >= POST_BLAST_TASKS.length) {
      return {
        postBlastTaskIndex: nextIndex,
        currentPhase: BLASTING_PHASES.COMPLETION
      };
    }
    return { postBlastTaskIndex: nextIndex };
  }),
  
  // Reset game
  resetGame: () => set({
    currentPhase: BLASTING_PHASES.BRIEFING,
    totalXP: 0,
    currentTaskIndex: 0,
    timeToDetonation: 300,
    evacuationStarted: false,
    alarmBlasts: 0,
    workersEvacuated: 0,
    totalWorkers: 25,
    blastCountdown: 180,
    currentBlastHole: 0,
    seismicMagnitude: 0,
    flyrockDistance: 0,
    anomalyDetected: false,
    postBlastTaskIndex: 0,
    craterInspected: false,
    flyrockVerified: false,
    reentryAuthorized: false,
    evacuationTime: 0,
    safetyCompliance: 100,
    workerIncidents: 0,
    anomaliesDetected: 0
  })
}));

export default useBlastingGameStore;
