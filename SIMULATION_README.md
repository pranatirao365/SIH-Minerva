# Mine Safety Simulation - React Native Implementation

## Overview

This is a complete React Native implementation of the coal mine safety training simulation originally built with React (from sihsim). The simulation has been fully converted to work natively in the SIH-Minerva mobile app under the miner role.

## Features

✅ **Complete Feature Parity** with the original React simulation:
- Interactive coal mine tunnel navigation (250 meters)
- 4 hazard events (Smoke, Fire, Blockage, Gas Leak)
- Real-time progress tracking with HUD
- Safety score calculation
- Event-based learning with mandatory reading timers
- Warning system (alerts 10m before events)
- Completion screen with performance metrics
- Detailed mini-map with event markers

## Architecture

### File Structure

```
SIH-Minerva/
├── app/miner/
│   └── SimulationScreen.tsx          # Main simulation screen
├── components/simulation/
│   ├── GameIntro.tsx                 # Welcome/intro screen
│   ├── GameEngine.tsx                # Main game loop & rendering
│   ├── GameCompletion.tsx            # Results/completion screen
│   ├── GameHUD.tsx                   # Head-up display (stats, mini-map)
│   ├── GameControls.tsx              # Move forward, pause, restart buttons
│   ├── EventModal.tsx                # Safety event popups
│   ├── WarningOverlay.tsx            # Warning alerts before events
│   ├── MinerCharacter.tsx            # Animated miner sprite
│   ├── TunnelBackground.tsx          # Mine tunnel environment
│   └── index.ts                      # Export barrel
├── stores/
│   └── gameStore.ts                  # Zustand state management
└── assets/images/
    ├── miner.png                     # Miner character sprite
    ├── mine-location1.jpeg           # Intro background
    ├── mine-location2.jpeg           # Tunnel background
    └── mine-location3.jpeg           # Completion background
```

### State Management

Uses **Zustand** for global game state:
- Game state (intro, playing, paused, event, completed)
- Character state (idle, walking, alert, danger)
- Progress tracking (0-250 meters)
- Event management (current, completed)
- Performance metrics (safety score, time, decisions)
- Warning system state

## Component Details

### 1. GameIntro
- Animated particle effects
- Background image with overlay
- Feature highlights (smoke, fire, blockage, gas)
- Instructions card
- Start button

### 2. GameEngine
- Main game loop (time tracking only, not auto-movement)
- Orchestrates all game components
- Handles game state transitions

### 3. GameHUD
- Distance progress bar
- Safety score with star rating
- Time elapsed counter
- Events handled counter
- Interactive mini-map with:
  - Tunnel path visualization
  - Event markers (color-coded by status)
  - Current position indicator
  - Distance markers (0-250m)
  - Warning indicators for nearby events

### 4. GameControls
- **Move Forward** button (moves 5m per click)
- Pause/Resume button
- Restart button
- Disabled state when paused or at event

### 5. EventModal
- Full-screen modal for hazard events
- Event-specific animations (smoke, fire, gas, blockage)
- Countdown timer (8-12 seconds based on severity)
- Safety instructions list
- Continue button (enabled only after reading)

### 6. WarningOverlay
- Appears 10m before events
- Pulsing animations
- Red flash overlay
- Corner alert indicators
- Event preview

### 7. MinerCharacter
- Positioned based on progress (8%-85% of screen)
- Walking animation (bouncing effect)
- Torch light beam animation
- Danger indicator when alerted

### 8. TunnelBackground
- Layered mine tunnel graphics
- Rock textures and coal seams
- Side walls and ceiling
- Emergency lights (pulsing)
- Dust particle animation (50 particles)
- Mine floor with rails and sleepers

### 9. GameCompletion
- Confetti animation
- Grade badge (A+, A, B, C, D)
- Performance stats grid
- Key learnings from completed events
- Play Again and Home buttons

## Game Flow

```
[GameIntro] 
    ↓ (Start Simulation)
[GameEngine]
    ├── TunnelBackground (environment)
    ├── MinerCharacter (player)
    ├── GameHUD (stats & map)
    ├── GameControls (buttons)
    ├── WarningOverlay (10m before event)
    └── EventModal (at event position)
    ↓ (Reach 250m)
[GameCompletion]
```

## Event System

### Event Positions:
- **50m**: Smoke Detection (Medium severity, 8s reading time)
- **100m**: Tunnel Blockage (High severity, 10s reading time)
- **150m**: Fire Detection (Critical severity, 12s reading time)
- **200m**: Gas Leak (Critical severity, 10s reading time)

### Event Flow:
1. **Warning Phase** (10m before): Yellow overlay, pulsing warning banner
2. **Trigger Phase** (at position): Modal appears, game pauses
3. **Reading Phase**: Countdown timer, instructions display
4. **Completion Phase**: Continue button enabled, resume walking

## Conversion Notes

### React to React Native Adaptations:

1. **HTML/CSS → React Native Components**:
   - `<div>` → `<View>`
   - `<span>`, `<p>` → `<Text>`
   - `className` → `style` prop with StyleSheet
   - CSS gradients → LinearGradient (simplified) or multiple layers
   - Framer Motion → React Native Animated API

2. **Animations**:
   - All Framer Motion animations converted to Animated API
   - `animate` props → `Animated.timing/spring`
   - `transition` → timing configuration
   - `whileHover`/`whileTap` → TouchableOpacity activeOpacity

3. **Images**:
   - Static imports: `require('../../assets/images/...')`
   - ImageBackground for hero sections
   - Image component with resizeMode

4. **Layout**:
   - Flexbox remains similar
   - Added SafeAreaView for notch/navigation handling
   - ScrollView for long content
   - Dimensions API for responsive sizing

5. **State Management**:
   - Zustand store kept identical (TypeScript)
   - Same state structure and actions

## Usage

### In the App:

1. Open the Minerva app
2. Login as a **Miner** role
3. Navigate to **Miner Home**
4. Tap **"Simulation"** in Quick Actions
5. Complete the training simulation

### Navigation:
```typescript
// From MinerHome
router.push('/miner/SimulationScreen');

// Exit simulation
router.back();
```

## Assets

All required images have been copied from sihsim:
- ✅ `miner.png` - Miner character sprite
- ✅ `mine-location1.jpeg` - Dark mine intro
- ✅ `mine-location2.jpeg` - Tunnel environment
- ✅ `mine-location3.jpeg` - Success/exit scene

## Performance Considerations

1. **Animations**: Using `useNativeDriver: true` wherever possible
2. **Particles**: Limited to 50 dust particles for performance
3. **State Updates**: Optimized with Zustand selectors
4. **Re-renders**: Minimized with proper component memoization
5. **Images**: Compressed JPEGs for backgrounds

## Future Enhancements

Potential improvements:
- [ ] Sound effects (explosion, alarm, footsteps)
- [ ] Haptic feedback on events and warnings
- [ ] Multiplayer mode with leaderboards
- [ ] Additional scenarios (equipment failure, rescue operation)
- [ ] VR/AR support for immersive training
- [ ] Offline progress saving with AsyncStorage
- [ ] Achievement system
- [ ] Language localization (English/Hindi)

## Testing

To test the simulation:

1. **Basic Flow**: 
   - Start simulation → Move forward → Complete 250m
   
2. **Event System**: 
   - Trigger each of 4 events
   - Verify reading timers work
   - Check safety score updates

3. **Warning System**: 
   - Approach events and verify 10m warnings

4. **UI/UX**: 
   - Test on different screen sizes
   - Verify all animations are smooth
   - Check touch targets are accessible

## Dependencies

Required packages (already in package.json):
- `zustand`: ^5.0.2 - State management
- `react-native-reanimated`: ~4.1.1 - Smooth animations
- `react-native-safe-area-context`: ~5.6.0 - Safe area handling
- `expo-router`: ~6.0.15 - Navigation

## License

MIT License - Same as parent project

## Credits

**Original React Implementation**: sihsim (https://sihsim.vercel.app/)  
**React Native Conversion**: SIH-Minerva Team  
**Based on**: DGMS Safety Guidelines
