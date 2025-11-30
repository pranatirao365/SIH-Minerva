# MINERVA Setup & Run Instructions

## Quick Start

### 1. Install Dependencies
```bash
cd my-expo-app
npm install
```

### 2. Start Development Server
```bash
npx expo start
```

### 3. Run the App
- **On Physical Device**: Scan QR code with Expo Go app
- **iOS Simulator**: Press `i` in terminal (Mac only)
- **Android Emulator**: Press `a` in terminal
- **Web**: Press `w` in terminal (limited functionality)

## App Flow

### First Launch
1. **Language Selection** - Choose English, Hindi, or Telugu
2. **Phone Login** - Enter any 10-digit number
3. **OTP Verification** - Enter any 6 digits (simulated)
4. **Role Selection** - Choose your role:
   - **Miner** (recommended for full demo)
   - Supervisor
   - Safety Officer
   - Engineer

### Miner Demo Path
1. Click "Watch Video" → Mark complete
2. Click "Voice Briefing" → Mark complete
3. Click "Take Quiz" → Answer questions → Get score
4. Click "Play Game" → Tap hazards for points

### Key Features to Test
- **Heat Map** - View hazard distribution
- **Hazard Scan** - Simulated camera detection
- **PPE Scan** - Equipment compliance check
- **Incident Report** - Quick reporting form
- **Emergency SOS** - Big red button (non-functional alert)
- **Chat** - Team messaging (offline simulation)
- **Profile** - View details and logout

## Troubleshooting

### Dependencies Not Installing
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Metro Bundler Issues
```bash
npx expo start --clear
```

### TypeScript Errors
These are expected until dependencies are installed. Run `npm install` first.

### Camera Not Working
- Grant camera permissions when prompted
- Camera features are simulated in demo mode
- Real device testing recommended

## File Structure Overview

```
app/
├── index.tsx              # Entry point
├── _layout.tsx            # Root layout
├── auth/                  # 4 authentication screens
├── miner/                 # 21 miner role screens
├── supervisor/            # 7 supervisor screens
├── safety-officer/        # 8 safety officer screens
├── engineer/              # 5 engineer screens
├── profile/               # Profile management
└── chat/                  # Messaging system

components/
├── BottomNav.tsx          # Role-based navigation
├── EmergencyButton.tsx    # Floating SOS button
├── OfflineBanner.tsx      # Network status
├── Placeholder.tsx        # Template component
└── ui/                    # Reusable UI components

hooks/
├── useChat.ts             # Chat state management
├── useNetwork.ts          # Network detection
└── useRoleStore.ts        # Global state (Zustand)

services/
├── socket.ts              # Offline chat simulation
├── translator.ts          # i18n service
└── mockData.ts            # Demo data

constants/
├── roles.ts               # Role definitions
├── colors.ts              # Theme colors
└── translations.ts        # Language strings
```

## Key Technologies

- **React Native** 0.81.5
- **Expo SDK** 54
- **TypeScript** 5.9
- **NativeWind** 4.1 (Tailwind for RN)
- **Zustand** 5.0 (State management)
- **Expo Router** 6.0 (File-based routing)
- **Lucide Icons** 0.454 (Icon library)

## Important Notes

1. **Offline First**: All features work without internet
2. **Camera Features**: Require device permissions
3. **Charts**: Victory Native setup needed for full analytics
4. **Module Unlocking**: Complete modules in order (Video → Briefing → Quiz → Game)
5. **Emergency Button**: Appears on all screens except auth/fullscreen

## Testing Credentials

- **Phone**: Any 10-digit number (e.g., 9876543210)
- **OTP**: Any 6 digits (e.g., 123456)
- **All features**: Fully accessible in demo mode

## Production Deployment

### Android APK
```bash
npx expo build:android
```

### iOS App
```bash
npx expo build:ios
```

### EAS Build (Recommended)
```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

## Support

For issues or questions:
1. Check this documentation
2. Review error messages in terminal
3. Verify all dependencies installed correctly
4. Test on physical device if emulator issues occur

---

**Ready to explore MINERVA! Start with `npx expo start`**
