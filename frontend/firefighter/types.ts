/**
 * Fire Extinguisher Game Types
 */

export type ExtinguisherType = 'CO2' | 'DRY_CHEMICAL' | 'FOAM' | 'WATER' | 'WET_CHEMICAL';

export type FireType = 'ELECTRICAL' | 'OIL' | 'WOOD' | 'GAS' | 'GREASE';

export interface Extinguisher {
  id: ExtinguisherType;
  name: string;
  color: string;
  icon: string;
  label: string;
}

export interface FireHurdle {
  id: string;
  type: FireType;
  position: number;
  description: string;
  correctExtinguishers: ExtinguisherType[];
}

export interface Booster {
  id: string;
  type: 'TIME' | 'LIFE';
  position: number;
  collected: boolean;
}

export interface GameState {
  lives: number;
  score: number;
  timeRemaining: number;
  currentHurdleIndex: number;
  isRunning: boolean;
  isGameOver: boolean;
  isVictory: boolean;
}

export const EXTINGUISHERS: Extinguisher[] = [
  {
    id: 'CO2',
    name: 'CO₂ Extinguisher',
    color: '#EF4444',
    icon: '🟥',
    label: 'CO₂',
  },
  {
    id: 'DRY_CHEMICAL',
    name: 'Dry Chemical (ABC)',
    color: '#F97316',
    icon: '🟧',
    label: 'ABC Dry',
  },
  {
    id: 'FOAM',
    name: 'Foam Extinguisher',
    color: '#EAB308',
    icon: '🟨',
    label: 'Foam',
  },
  {
    id: 'WATER',
    name: 'Water Extinguisher',
    color: '#3B82F6',
    icon: '🟦',
    label: 'Water',
  },
  {
    id: 'WET_CHEMICAL',
    name: 'Wet Chemical',
    color: '#10B981',
    icon: '🟩',
    label: 'Wet Chem',
  },
];

export const FIRE_TYPES: Record<FireType, { description: string; correctExtinguishers: ExtinguisherType[] }> = {
  ELECTRICAL: {
    description: '⚡ Electrical Panel Fire',
    correctExtinguishers: ['CO2'],
  },
  OIL: {
    description: '🛢️ Oil Spill Fire',
    correctExtinguishers: ['FOAM', 'DRY_CHEMICAL'],
  },
  WOOD: {
    description: '🪵 Wood & Trash Fire',
    correctExtinguishers: ['WATER', 'DRY_CHEMICAL'],
  },
  GAS: {
    description: '💥 Gas Flame Fire',
    correctExtinguishers: ['DRY_CHEMICAL'],
  },
  GREASE: {
    description: '🍳 Grease/Kitchen Fire',
    correctExtinguishers: ['WET_CHEMICAL'],
  },
};

export const GAME_CONFIG = {
  INITIAL_LIVES: 2, // Only 2 lives to reach safe zone
  INITIAL_TIME: 50, // More time since it's checkpoint-based
  POINTS_PER_CORRECT: 25, // Higher points per checkpoint
  TIME_BOOSTER: 5,
  CHECKPOINT_COUNT: 4, // 4 checkpoints between start and safe zone
  MINER_START_POSITION: 0, // Start from left end (0%)
  MINER_SAFE_ZONE: 100, // Safe zone at right end (100%)
  MINER_SPEED: 2,
  FEEDBACK_DURATION: 1500, // ms - how long to show correct/incorrect popup
  MIN_TIME_WARNING: 15, // seconds - when to show red warning
  MEDIUM_TIME_WARNING: 30, // seconds - when to show yellow warning
};

// Checkpoint positions (percentage across screen)
export const CHECKPOINT_POSITIONS = [20, 40, 60, 80]; // 4 checkpoints at 20%, 40%, 60%, 80%

/**
 * Helper function to get extinguisher info by ID
 */
export const getExtinguisherById = (id: ExtinguisherType): Extinguisher | undefined => {
  return EXTINGUISHERS.find(ext => ext.id === id);
};

/**
 * Helper function to validate if an extinguisher is correct for a fire type
 */
export const isCorrectExtinguisher = (fireType: FireType, extinguisherId: ExtinguisherType): boolean => {
  return FIRE_TYPES[fireType].correctExtinguishers.includes(extinguisherId);
};

/**
 * Get all fire types as an array
 */
export const getAllFireTypes = (): FireType[] => {
  return Object.keys(FIRE_TYPES) as FireType[];
};

/**
 * Calculate final score with time bonus (future feature)
 */
export const calculateFinalScore = (baseScore: number, timeRemaining: number, perfectRun: boolean): number => {
  let finalScore = baseScore;
  
  // Time bonus (not implemented yet)
  // finalScore += timeRemaining;
  
  // Perfect run bonus
  if (perfectRun) {
    finalScore += 50; // Bonus for completing without losing lives
  }
  
  return finalScore;
};
