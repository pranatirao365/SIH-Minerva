# Training Videos Directory

This folder contains all training videos for the 5 worlds with 5 levels each.

## Directory Structure

Place your training videos in this directory with the following naming convention:

```
frontend/assets/videos/training/
├── w1l1.mp4   (Hazard Spotting - Level 1)
├── w1l2.mp4   (Hazard Spotting - Level 2)
├── w1l3.mp4   (Hazard Spotting - Level 3)
├── w1l4.mp4   (Hazard Spotting - Level 4)
├── w1l5.mp4   (Hazard Spotting - Level 5)
├── w2l1.mp4   (Equipment Handling - Level 1)
├── w2l2.mp4   (Equipment Handling - Level 2)
├── w2l3.mp4   (Equipment Handling - Level 3)
├── w2l4.mp4   (Equipment Handling - Level 4)
├── w2l5.mp4   (Equipment Handling - Level 5)
├── w3l1.mp4   (Situational Safety - Level 1)
├── w3l2.mp4   (Situational Safety - Level 2)
├── w3l3.mp4   (Situational Safety - Level 3)
├── w3l4.mp4   (Situational Safety - Level 4)
├── w3l5.mp4   (Situational Safety - Level 5)
├── w4l1.mp4   (Emergency Response - Level 1)
├── w4l2.mp4   (Emergency Response - Level 2)
├── w4l3.mp4   (Emergency Response - Level 3)
├── w4l4.mp4   (Emergency Response - Level 4)
├── w4l5.mp4   (Emergency Response - Level 5)
├── w5l1.mp4   (Safety Mindset - Level 1)
├── w5l2.mp4   (Safety Mindset - Level 2)
├── w5l3.mp4   (Safety Mindset - Level 3)
├── w5l4.mp4   (Safety Mindset - Level 4)
└── w5l5.mp4   (Safety Mindset - Level 5)
```

## Video Requirements

- **Format**: MP4 (H.264)
- **Orientation**: Vertical (9:16 or similar) - optimized for mobile viewing
- **Resolution**: 1080x1920 recommended (Full HD vertical)
- **Duration**: ~1 minute per level (short and focused)
- **File Size**: Keep under 20MB per video for better performance

## Training World Topics

### World 1: Hazard Spotting (Orange - #D97706)
1. Basic hazards every miner must see
2. Roof and side danger signs
3. Mechanical danger zones
4. Slip, trip and fall hazards
5. Gas and ventilation hazard indicators

### World 2: Equipment Handling (Blue - #0369A1)
1. PPE and Basic Tools
2. Drilling Equipment
3. Blasting Equipment
4. Heavy Machinery
5. Equipment Safety Checks and Reporting

### World 3: Situational Safety (Green - #047857)
1. What to do during blasting
2. Safe behavior around moving machinery
3. Roof scaling safety
4. Low visibility movement safety
5. Poor ventilation and emergency steps

### World 4: Emergency Response (Red - #DC2626)
1. How to react when something goes wrong
2. Escape route understanding
3. Fire emergency basics
4. Gas exposure immediate steps
5. Helping an injured coworker safely

### World 5: Safety Mindset (Purple - #7C3AED)
1. Why shortcuts kill
2. Overconfidence traps
3. Team accountability
4. Ignoring PPE consequences
5. How to build a safe daily routine

## How Videos are Used

1. **All levels are unlocked** - Miners can access any level directly
2. Miner clicks on a level in the Training Module
3. Full-screen vertical video plays **automatically**
4. Video has native controls (play, pause, seek, fullscreen)
5. When video finishes (~1 minute), "Complete Level & Continue" button appears
6. Clicking the button returns to training menu
7. No quizzes, no XP - just focused video learning

## Adding New Videos

1. Export your video in MP4 format (vertical orientation preferred)
2. Name it according to the convention: `wXlY.mp4` (e.g., w1l1.mp4, w2l3.mp4)
3. Place it in this directory: `frontend/assets/videos/training/`
4. The app will automatically load it when that level is accessed

## Placeholder Behavior

If a video file doesn't exist, the app will show:
- "Training video coming soon" message
- Level number information
- User can still navigate back

This allows for gradual content addition without breaking the app.

## Notes

- Videos are bundled with the app (not streamed)
- Consider video file sizes for app bundle size
- Compress videos if needed while maintaining quality
- Test on actual devices for performance
- Vertical format works best for mobile training experience
