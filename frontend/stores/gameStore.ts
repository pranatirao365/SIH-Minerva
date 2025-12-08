import { create } from 'zustand';

// Event definitions - position in meters where events occur
export const GAME_EVENTS = [
  {
    id: 'smoke_1',
    position: 50,
    type: 'smoke',
    title: 'Smoke Detected',
    description: 'Dense smoke ahead. Stay low and move carefully.',
    instructions: [
      'Get down on hands and knees',
      'Breathe through cloth if available',
      'Feel walls for guidance',
      'Move slowly and deliberately'
    ],
    duration: 8,
    severity: 'medium'
  },
  {
    id: 'blockage_1',
    position: 100,
    type: 'blockage',
    title: 'Tunnel Blocked',
    description: 'Partial cave-in blocking the path.',
    instructions: [
      'Do not attempt to move debris alone',
      'Check for alternative routes',
      'Signal for help',
      'Wait for rescue team'
    ],
    duration: 10,
    severity: 'high'
  },
  {
    id: 'fire_1',
    position: 150,
    type: 'fire',
    title: 'Fire Detected',
    description: 'Fire hazard ahead! Emergency protocol activated.',
    instructions: [
      'Activate emergency alarm',
      'Use fire extinguisher if trained',
      'Evacuate immediately if fire spreads',
      'Follow emergency exit signs'
    ],
    duration: 12,
    severity: 'critical'
  },
  {
    id: 'gas_1',
    position: 200,
    type: 'gas',
    title: 'Gas Leak Detected',
    description: 'Dangerous gas levels detected.',
    instructions: [
      'Put on breathing apparatus immediately',
      'Do not create sparks or flames',
      'Evacuate the area quickly',
      'Report to surface immediately'
    ],
    duration: 10,
    severity: 'critical'
  },
  {
    id: 'exit',
    position: 250,
    type: 'exit',
    title: 'Tunnel Exit Reached',
    description: 'Congratulations! You have safely reached the exit.',
    instructions: [
      'Exit completed successfully',
      'All safety protocols followed',
      'Report to surface control',
      'Log the incident details'
    ],
    duration: 5,
    severity: 'safe'
  }
];

const TOTAL_DISTANCE = 250; // meters

export type GameState = 'intro' | 'playing' | 'paused' | 'event' | 'completed';
export type CharacterState = 'idle' | 'walking' | 'alert' | 'danger';

interface GameEvent {
  id: string;
  position: number;
  type: string;
  title: string;
  description: string;
  instructions: string[];
  duration: number;
  severity: string;
}

interface GameStoreState {
  // Game state
  gameState: GameState;
  progress: number;
  totalDistance: number;
  
  // Character state
  characterState: CharacterState;
  
  // Current event
  currentEvent: GameEvent | null;
  completedEvents: string[];
  
  // Performance metrics
  safetyScore: number;
  decisionsCorrect: number;
  decisionsTotal: number;
  timeElapsed: number;
  
  // UI state
  showHUD: boolean;
  isPaused: boolean;
  
  // Warning state
  warningEvent: GameEvent | null;
  isWarningActive: boolean;
  
  // Actions
  startGame: () => void;
  updateProgress: (delta: number) => void;
  triggerEvent: (event: GameEvent) => void;
  completeEvent: (wasCorrect?: boolean) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
  updateTime: (delta: number) => void;
  adjustSafetyScore: (amount: number) => void;
}

const useGameStore = create<GameStoreState>((set, get) => ({
  // Game state - explicitly initialize progress at 0
  gameState: 'intro',
  progress: 0,
  totalDistance: TOTAL_DISTANCE,
  
  // Character state
  characterState: 'idle',
  
  // Current event
  currentEvent: null,
  completedEvents: [],
  
  // Performance metrics
  safetyScore: 100,
  decisionsCorrect: 0,
  decisionsTotal: 0,
  timeElapsed: 0,
  
  // UI state
  showHUD: true,
  isPaused: false,
  
  // Warning state
  warningEvent: null,
  isWarningActive: false,
  
  // Actions
  startGame: () => {
    // Explicitly reset progress to 0 at game start
    set({
      gameState: 'playing',
      progress: 0,
      characterState: 'walking',
      completedEvents: [],
      safetyScore: 100,
      decisionsCorrect: 0,
      decisionsTotal: 0,
      timeElapsed: 0,
      currentEvent: null,
      warningEvent: null,
      isWarningActive: false,
      isPaused: false,
    });
  },
  
  updateProgress: (delta: number) => {
    const state = get();
    if (state.gameState !== 'playing') return;
    
    const newProgress = Math.min(state.progress + delta, TOTAL_DISTANCE);
    set({ progress: newProgress });
    
    // Check for warning zone (10m before event)
    const upcomingEvent = GAME_EVENTS.find(
      event => {
        const distanceToEvent = event.position - newProgress;
        return distanceToEvent > 0 && 
               distanceToEvent <= 10 && 
               !state.completedEvents.includes(event.id) &&
               !state.currentEvent;
      }
    );
    
    if (upcomingEvent && !state.isWarningActive) {
      set({ 
        warningEvent: upcomingEvent, 
        isWarningActive: true,
        characterState: 'alert'
      });
    } else if (!upcomingEvent && state.isWarningActive) {
      set({ 
        warningEvent: null, 
        isWarningActive: false,
        characterState: 'walking'
      });
    }
    
    // Check for events
    const triggeredEvent = GAME_EVENTS.find(
      event => 
        event.position <= newProgress && 
        event.position > state.progress &&
        !state.completedEvents.includes(event.id)
    );
    
    if (triggeredEvent) {
      get().triggerEvent(triggeredEvent);
    }
    
    // Check for completion
    if (newProgress >= TOTAL_DISTANCE) {
      set({ gameState: 'completed', characterState: 'idle' });
    }
  },
  
  triggerEvent: (event: GameEvent) => {
    set({
      gameState: 'event',
      currentEvent: event,
      characterState: 'alert',
      isPaused: true
    });
  },
  
  completeEvent: (wasCorrect = true) => {
    const state = get();
    if (!state.currentEvent) return;
    
    const eventId = state.currentEvent.id;
    const scoreChange = wasCorrect ? 0 : -10;
    
    set({
      gameState: 'playing',
      characterState: 'walking',
      currentEvent: null,
      completedEvents: [...state.completedEvents, eventId],
      safetyScore: Math.max(0, state.safetyScore + scoreChange),
      decisionsCorrect: state.decisionsCorrect + (wasCorrect ? 1 : 0),
      decisionsTotal: state.decisionsTotal + 1,
      isPaused: false,
      warningEvent: null,
      isWarningActive: false
    });
  },
  
  pauseGame: () => {
    set({ 
      gameState: 'paused', 
      characterState: 'idle',
      isPaused: true 
    });
  },
  
  resumeGame: () => {
    set({ 
      gameState: 'playing', 
      characterState: 'walking',
      isPaused: false 
    });
  },
  
  resetGame: () => {
    set({
      gameState: 'intro',
      progress: 0,
      characterState: 'idle',
      currentEvent: null,
      completedEvents: [],
      safetyScore: 100,
      decisionsCorrect: 0,
      decisionsTotal: 0,
      timeElapsed: 0,
      isPaused: false,
      warningEvent: null,
      isWarningActive: false,
    });
  },
  
  updateTime: (delta: number) => {
    const state = get();
    if (state.gameState === 'playing') {
      set({ timeElapsed: state.timeElapsed + delta });
    }
  },
  
  adjustSafetyScore: (amount: number) => {
    set({ safetyScore: Math.max(0, Math.min(100, get().safetyScore + amount)) });
  }
}));

export default useGameStore;
