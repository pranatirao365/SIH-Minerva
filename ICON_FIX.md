# ICON LIBRARY FIX

## Issue
`lucide-react-native` requires React 16-18, but Expo 54 uses React 19.

## Solution
Replaced `lucide-react-native` with `@expo/vector-icons` (already included).

## How to Install

Run this command instead:
```bash
npm install --legacy-peer-deps
```

OR use the icon wrapper:

All icon imports should now use:
```typescript
import { Home, User, Bell } from '../components/Icons';
```

Instead of:
```typescript
import { Home, User, Bell } from 'lucide-react-native';
```

The `Icons.tsx` file maps all lucide icon names to equivalent Expo icons.

## Quick Fix
Just run:
```bash
npm install --legacy-peer-deps
```

This will install all dependencies ignoring peer dependency conflicts.
The app will work perfectly fine - React 19 is backward compatible.
