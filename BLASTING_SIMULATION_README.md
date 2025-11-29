# Blasting Safety Simulation - React Native Implementation

## Overview

Complete implementation of the Blasting Safety training simulation, converted from the React web app (sihsim) to React Native for the SIH-Minerva mobile application. This simulation trains miners on proper blasting operation procedures through 4 interactive phases.

## Features

- **4 Interactive Phases**: Briefing, Pre-Blast Inspection, Blast Sequence Monitoring, Post-Blast Verification
- **Real-time Task Management**: Step-by-step guided tasks with XP rewards
- **Performance Tracking**: Grade system (A+ to D) based on performance metrics
- **Animated Feedback**: Explosion animations, shake effects, confetti celebrations
- **Safety Protocol Training**: Perimeter checks, evacuation procedures, blast monitoring
- **Achievement System**: Badges for zero incidents, fast evacuation, and completion

## Architecture

### File Structure

```
SIH-Minerva/
├── app/miner/
│   └── BlastingScreen.tsx              # Main phase orchestrator
├── components/blasting/
│   ├── BlastingBriefing.tsx            # Phase 1: Mission briefing & objectives
│   ├── PreBlastInspection.tsx          # Phase 2: Perimeter, evacuation, shelters
│   ├── BlastSequenceMonitoring.tsx     # Phase 3: Countdown & blast execution
│   ├── PostBlastVerification.tsx       # Phase 4: Crater, flyrock, re-entry
│   ├── BlastingCompletion.tsx          # Results, grades, achievements
│   └── index.ts                        # Export barrel
├── stores/
│   └── blastingGameStore.ts            # Zustand state management
└── assets/images/
    └── (blast-site backgrounds)
```

## Phase Details

### Phase 1: Blasting Briefing
**Purpose**: Introduce mission objectives and safety protocols
- Display critical safety warnings
- List 4 main objectives (perimeter, evacuation, monitoring, verification)
- Show safety protocols (500m perimeter, 3 horn blasts, seismic monitoring, flyrock check)
- Start button transitions to Phase 2

**Components**:
- Animated pulse on warning badge
- Scrollable content with mission objectives
- Safety protocol checklist
- Prominent start button

### Phase 2: Pre-Blast Inspection
**Purpose**: Execute pre-blast safety tasks
- **Task 1**: Perimeter Check - Verify danger zone is clear
- **Task 2**: Evacuation Alarm - Sound 3 horn blasts
- **Task 3**: Shelter Verification - Confirm all workers in shelters

**Features**:
- Countdown timer to detonation (300 seconds)
- Task-specific interactive UI
- XP rewards (50 XP per task)
- Real-time evacuation progress
- Shelter status indicators

**Animations**:
- Alarm button pulse animation
- Evacuation progress bars
- Task completion badges

### Phase 3: Blast Sequence Monitoring
**Purpose**: Monitor the controlled blast execution
- **Safety Checklist**: Verify all 5 safety items
- **Countdown Phase**: 180-second countdown to blast
- **Blasting Phase**: Sequential detonation of 5 blast holes

**Features**:
- Safety checklist confirmation
- Large countdown display
- Blast hole sequence indicators
- Seismic magnitude readings (1-4 Richter scale)
- Explosion animations with shake effects

**Metrics**:
- Holes detonated counter
- Real-time seismic readings
- Automatic progression through blast sequence

### Phase 4: Post-Blast Verification
**Purpose**: Verify blast safety and authorize re-entry
- **Task 1**: Crater Inspection - Check depth, fragment quality, target range
- **Task 2**: Flyrock Check - Verify containment within 160m
- **Task 3**: Re-entry Clearance - Authorize zones (Red/Yellow/Green)

**Features**:
- Detailed metrics display
- Zone-based safety clearance
- Flyrock distance monitoring
- +25 XP per task

### Phase 5: Completion & Debrief
**Purpose**: Display performance summary and achievements
- Grade calculation (A+ to D based on XP)
- Performance stats (XP, evacuation time, compliance, incidents)
- Achievement badges
- Confetti animation
- Restart and exit options

**Grading System**:
- A+ (95%+): Excellent
- A (85-94%): Great
- B (75-84%): Good
- C (65-74%): Satisfactory
- D (<65%): Needs Improvement

## State Management

### Zustand Store (`blastingGameStore.ts`)

**State Variables**:
```typescript
- currentPhase: BlastingPhase
- totalXP: number
- currentTaskIndex: number
- timeToDetonation: number
- evacuationStarted: boolean
- alarmBlasts: number
- workersEvacuated: number
- blastCountdown: number
- currentBlastHole: number
- seismicMagnitude: number
- flyrockDistance: number
- evacuationTime: number
- safetyCompliance: number
- workerIncidents: number
```

**Actions**:
```typescript
- setPhase(phase)
- addXP(amount)
- startEvacuation()
- soundAlarm()
- completeTask()
- nextTask()
- startBlastSequence()
- detonateHole()
- detectAnomaly()
- inspectCrater()
- verifyFlyrock()
- authorizeReentry()
- resetGame()
```

## Game Data

### Pre-Blast Tasks (3 tasks, 50 XP each)
1. **Perimeter Check** - Verify blast perimeter (15s limit)
2. **Evacuation Alarm** - Sound 3 horn blasts (10s limit)
3. **Shelter Verification** - Check 3 shelters (A, B, C)

### Blast Holes (5 total)
- Sequential detonation (2 seconds between blasts)
- Random seismic readings (1-4 Richter)
- Random flyrock distance (130-160m)

### Post-Blast Tasks (3 tasks, 25 XP each)
1. **Crater Inspection** - Verify depth, quality, target
2. **Flyrock Check** - Confirm containment ≤160m
3. **Re-entry Clearance** - Authorize 3 zones

### Total XP Possible
- Pre-Blast: 150 XP (3 × 50)
- Blast Sequence: 100 XP (base)
- Anomaly Detection: 25 XP (bonus)
- Post-Blast: 75 XP (3 × 25)
- **Maximum**: ~350 XP

## Usage

### Navigation
From Miner Home, tap the "Blasting" quick action button to launch the simulation.

### Workflow
1. Read mission briefing and objectives
2. Complete 3 pre-blast inspection tasks
3. Monitor countdown and blast sequence
4. Verify post-blast safety conditions
5. View performance summary and restart/exit

## Animations

- **Pulse**: Warning badges, alarm button
- **Confetti**: Completion screen celebration
- **Explosion**: Flash overlay on blast detonation
- **Shake**: Screen shake during blasting
- **Progress Bars**: Evacuation and shelter status

## Technical Implementation

### React Native Components Used
- `Animated` API for all animations
- `ImageBackground` for realistic backgrounds
- `ScrollView` for long content areas
- `TouchableOpacity` for interactive buttons
- `SafeAreaView` for mobile-safe layouts

### TypeScript Integration
- Fully typed Zustand store
- Type-safe component props
- Enum-based phase management

### Styling
- Dark theme with high contrast
- Color-coded zones (Red/Yellow/Green)
- Glassmorphism effects
- Responsive layouts for all screen sizes

## Testing Checklist

- [ ] All 4 phases transition correctly
- [ ] XP accumulates properly
- [ ] Countdown timers work accurately
- [ ] Alarm blasts count correctly
- [ ] Blast sequence auto-progresses
- [ ] Metrics display accurate values
- [ ] Grade calculation matches performance
- [ ] Restart button resets all state
- [ ] Exit button returns to Miner Home
- [ ] Animations run smoothly
- [ ] No TypeScript errors
- [ ] All touchable elements respond

## Performance Considerations

- Animations use `useNativeDriver` where possible
- Timers cleaned up on unmount
- Store reset on screen exit
- Images loaded from CDN (reduce bundle size)

## Future Enhancements

- [ ] Sound effects (alarm, explosion, success)
- [ ] Haptic feedback on actions
- [ ] Difficulty levels (trainee, experienced, expert)
- [ ] Multi-language support (English/Hindi)
- [ ] Save progress and high scores
- [ ] Leaderboard integration
- [ ] Advanced anomaly scenarios
- [ ] Weather conditions impact

## Credits

Based on the original React web simulation from sihsim. Converted to React Native with full feature parity and mobile-optimized UI/UX.
