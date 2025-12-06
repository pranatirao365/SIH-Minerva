# 🛡️ MINERVA - Mining Safety Platform

**MINERVA** is a comprehensive mining safety platform designed to enhance worker safety, hazard detection, and compliance monitoring in mining operations. The platform combines mobile applications, AI-powered detection systems, and real-time monitoring to create a safer mining environment.

## 📋 Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
  - [PPE Detection Service](#ppe-detection-service)
  - [Hazard Detection Service](#hazard-detection-service)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

MINERVA is a Smart India Hackathon (SIH) project that addresses critical safety challenges in the mining industry through:

- **AI-Powered Safety Detection**: Real-time PPE compliance and hazard detection using YOLOv8 and DeepCrack models
- **Multi-Role Mobile Platform**: Dedicated interfaces for Miners, Supervisors, Safety Officers, Engineers, and Admins
- **Smart Helmet Integration**: ESP32-based IoT helmets for real-time monitoring and emergency alerts
- **Training & Compliance**: Interactive safety training modules with videos, quizzes, and gamification
- **Emergency Response**: One-tap SOS system with automatic location tracking and team notifications
- **Multi-Language Support**: Available in English, Hindi, and Telugu for accessibility

## 📁 Project Structure

```
SIH-Minerva/
├── frontend/                          # React Native + Expo mobile application
│   ├── app/                          # File-based routing (Expo Router)
│   │   ├── (tabs)/                   # Tab navigation screens
│   │   ├── admin/                    # Admin dashboard & features
│   │   ├── auth/                     # Authentication screens
│   │   ├── chat/                     # Real-time team chat
│   │   ├── engineer/                 # Engineer-specific screens
│   │   ├── miner/                    # Miner dashboard & features
│   │   ├── safety-officer/           # Safety officer screens
│   │   ├── supervisor/               # Supervisor dashboard
│   │   └── shared/                   # Shared screens across roles
│   ├── components/                   # Reusable UI components
│   ├── services/                     # API & business logic
│   ├── hooks/                        # Custom React hooks
│   ├── config/                       # Configuration files
│   └── assets/                       # Images, fonts, media
│
├── backend_main/
│   ├── backend/                      # Main Express + TypeScript API
│   │   ├── src/
│   │   │   ├── controllers/          # Route controllers
│   │   │   ├── middleware/           # Auth & role-based middleware
│   │   │   ├── routes/               # API route definitions
│   │   │   ├── services/             # Firebase & external services
│   │   │   └── utils/                # Helper utilities
│   │   └── package.json
│   │
│   ├── backend_ppe/                  # PPE Detection FastAPI Service
│   │   ├── main.py                   # FastAPI server
│   │   ├── model/                    # YOLOv8 custom model
│   │   └── requirements.txt
│   │
│   └── hazard_models/                # Hazard Detection FastAPI Service
│       ├── main.py                   # FastAPI server
│       ├── models/                   # DeepCrack model architecture
│       ├── pretrained_net_G.pth     # Pre-trained weights
│       ├── fire_model.pt            # Fire detection model
│       └── requirements.txt
│
└── README.md                         # This file
```

## ✨ Features

### 🔐 Authentication & Authorization
- Phone number + OTP authentication via Firebase
- Role-based access control (RBAC)
- Multi-role support: Miner, Supervisor, Safety Officer, Engineer, Admin

### 📱 Mobile Application
- **Cross-platform**: iOS, Android, and Web support
- **Offline-first**: Works without internet connectivity
- **Multi-language**: English, Hindi, Telugu
- **Dark/Light Mode**: Adaptive theming
- **Real-time Updates**: Firebase Firestore integration

### 🎓 Training & Education
- **Video Training Modules**: Safety procedures and protocols
- **Interactive Quizzes**: Knowledge assessment
- **Gamification**: Blasting safety game, roof instability simulations
- **Voice Training**: Audio-based learning modules
- **Progress Tracking**: Training completion analytics

### 🔍 AI-Powered Detection
- **PPE Detection**: Hard hat, safety vest, gloves, boots, goggles detection
- **Hazard Detection**: Crack detection, fire detection, structural analysis
- **Real-time Scanning**: Camera-based instant analysis
- **Compliance Reports**: Automated safety compliance documentation

### 🆘 Emergency Features
- **One-Tap SOS**: Instant emergency alert system
- **Automatic Location Tracking**: GPS-based incident location
- **Team Notifications**: Real-time alerts to supervisors and safety officers
- **Incident Reporting**: Detailed incident documentation

### 📊 Dashboards & Analytics
- **Role-Specific Dashboards**: Customized for each user role
- **Safety Metrics**: Compliance rates, incident statistics
- **Hazard Heatmaps**: Geographical hazard mapping
- **Team Monitoring**: Real-time worker status tracking
- **Testimonial System**: Worker feedback and safety reports

### 💬 Communication
- **Team Chat**: Real-time messaging with Gemini AI integration
- **Notifications**: Push notifications for incidents and alerts
- **Voice Messages**: Audio communication support

### 🎮 Smart Helmet Integration (ESP32)
- **Real-time Monitoring**: Heart rate, temperature, GPS tracking
- **Emergency Detection**: Automatic fall detection
- **Communication**: Built-in emergency button
- **Data Logging**: Continuous health and safety monitoring

## 🛠️ Technology Stack

### Frontend
- **Framework**: React Native 19.1.0
- **Navigation**: Expo Router 6.0 (File-based routing)
- **UI Library**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand
- **Backend Integration**: Firebase (Firestore, Auth, Storage)
- **AI Integration**: Google Gemini API
- **Media Processing**: Expo AV, Camera, Image Picker
- **Networking**: Axios, Socket.io

### Backend (Main API)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Admin SDK
- **Package Manager**: pnpm (recommended) or npm

### Backend (PPE Detection)
- **Framework**: FastAPI
- **Language**: Python 3.8+
- **AI Model**: YOLOv8 (Custom trained)
- **Computer Vision**: OpenCV, Ultralytics

### Backend (Hazard Detection)
- **Framework**: FastAPI
- **Language**: Python 3.8+
- **AI Models**: 
  - DeepCrack (Crack detection & segmentation)
  - Fire detection model
- **Computer Vision**: OpenCV, PyTorch

### IoT Hardware
- **Microcontroller**: ESP32
- **Sensors**: GPS, Heart Rate, Temperature
- **Communication**: WiFi, Bluetooth

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18 or higher ([Download](https://nodejs.org/))
- **Python**: v3.8 or higher ([Download](https://www.python.org/))
- **pnpm**: `npm install -g pnpm` (recommended) or use npm
- **Expo CLI**: `npm install -g expo-cli`
- **Git**: Version control
- **Firebase Project**: Create a project at [Firebase Console](https://console.firebase.google.com/)

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure Firebase**:
   - Create a Firebase project
   - Download `google-services.json` (Android) and place in `frontend/`
   - Download `firebase-service-account.json` and place in `frontend/`
   - Update `frontend/config/firebase.ts` with your Firebase config

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your API keys:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   # or
   npx expo start
   ```

6. **Run on device/simulator**:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend_main/backend
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure Firebase credentials**:
   - Download your Firebase service account JSON from Firebase Console
   - Save as `backend_main/backend/serviceAccountKey.json`
   - **IMPORTANT**: Never commit this file to version control

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```
   PORT=4000
   SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
   FIREBASE_PROJECT_ID=your-project-id
   NODE_ENV=development
   ```

5. **Build TypeScript**:
   ```bash
   npm run build
   ```

6. **Start the development server**:
   ```bash
   npm start
   ```
   Server will run at `http://localhost:4000`

7. **Verify server is running**:
   ```bash
   curl http://localhost:4000/
   ```
   Expected response: `{"ok":true,"service":"minerva-backend"}`

### PPE Detection Service

1. **Navigate to PPE backend**:
   ```bash
   cd backend_main/backend_ppe
   ```

2. **Create virtual environment** (recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # macOS/Linux
   # or
   venv\Scripts\activate     # Windows
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Ensure model is present**:
   - Verify `backend_ppe/model/yolov8s_custom.pt` exists
   - If missing, download or train your custom YOLOv8 model

5. **Start the service**:
   ```bash
   python3 main.py
   ```
   Service will run on port specified in `.env` file (default: `http://localhost:8888`)

6. **Test the API**:
   ```bash
   curl -X POST "http://localhost:8888/ppe-scan" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@/path/to/test/image.jpg"
   ```

### Hazard Detection Service

1. **Navigate to hazard models directory**:
   ```bash
   cd backend_main/hazard_models
   ```

2. **Create virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # macOS/Linux
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Verify model files exist**:
   - `pretrained_net_G.pth` (DeepCrack weights)
   - `fire_model.pt` (Fire detection model)
   - `models/` directory with architecture files

5. **Start the service**:
   ```bash
   python3 main.py
   ```
   Service will run on port specified in `.env` file (default: `http://localhost:8080`)

6. **Test the API**:
   ```bash
   curl -X POST "http://localhost:8080/detect-cracks" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@/path/to/test/image.jpg"
   ```

## 🏗️ Architecture

### System Architecture

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │
         ├──────────────────────┐
         │                      │
         ▼                      ▼
┌─────────────────┐    ┌──────────────────┐
│  Main Backend   │    │  Firebase        │
│  (Express/TS)   │◄───┤  - Firestore     │
│  Port: 4000     │    │  - Auth          │
└────────┬────────┘    │  - Storage       │
         │             └──────────────────┘
         │
         ├──────────────────────┐
         │                      │
         ▼                      ▼
┌─────────────────┐    ┌──────────────────┐
│  PPE Detection  │    │  Hazard Detection│
│  (FastAPI)      │    │  (FastAPI)       │
│  Port: 8000     │    │  Port: 8001      │
│  - YOLOv8       │    │  - DeepCrack     │
└─────────────────┘    │  - Fire Model    │
                       └──────────────────┘
```

### Data Flow

1. **User Authentication**: Mobile app → Firebase Auth → Firestore user document
2. **API Requests**: Mobile app → Main Backend → Firebase/External Services
3. **PPE Detection**: Mobile app → Main Backend → PPE Service → YOLOv8 Model
4. **Hazard Detection**: Mobile app → Main Backend → Hazard Service → AI Models
5. **Real-time Updates**: Firestore → Mobile app (listeners)

## 📚 API Documentation

### Main Backend Endpoints

**Base URL**: `http://localhost:4000`

#### Public Endpoints
- `GET /` - Health check
- `POST /auth/login` - User authentication

#### Protected Endpoints (require Firebase ID token)

**Miner Routes** (`/api/miner`)
- `GET /dashboard` - Miner dashboard data
- `GET /training` - Training modules
- `POST /sos` - Trigger emergency SOS
- `GET /tasks` - Assigned tasks

**Supervisor Routes** (`/api/supervisor`)
- `GET /team` - Team member list
- `GET /incidents` - Incident reports
- `POST /assign-task` - Assign task to miner
- `GET /safety-metrics` - Safety statistics

**Safety Officer Routes** (`/api/safety`)
- `GET /compliance` - Compliance reports
- `GET /hazards` - Hazard map data
- `POST /inspection` - Submit inspection
- `GET /incidents` - All incidents

**Admin Routes** (`/api/admin`)
- `GET /users` - User management
- `POST /create-user` - Create new user
- `GET /analytics` - System analytics
- `POST /assign-role` - Assign user roles

### PPE Detection API

**Base URL**: `http://localhost:8888` (configured in `backend_ppe/.env`)

- `GET /` - Health check
- `POST /ppe-scan` - Upload image for PPE detection
  - **Input**: multipart/form-data with `file` field
  - **Output**: JSON with detected PPE items, confidence scores, bounding boxes

### Hazard Detection API

**Base URL**: `http://localhost:8001`

- `GET /` - Health check
- `POST /detect-cracks` - Upload image for crack detection
- `POST /detect-fire` - Upload image for fire detection
- `POST /analyze-structure` - Comprehensive structural analysis

## 🔧 Development

### Code Structure Guidelines

- **Frontend**: Follow Expo Router conventions for file-based routing
- **Backend**: Use controller → service → repository pattern
- **Type Safety**: Use TypeScript interfaces and types
- **Error Handling**: Centralized error handling middleware
- **Logging**: Use structured logging (development and production)

### Testing

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend_main/backend
npm test

# Python service tests
cd backend_main/backend_ppe
pytest
```

### Environment Variables

Never commit sensitive data. Use `.env` files and add them to `.gitignore`.

### Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "Add feature"`
3. Push to remote: `git push origin feature/your-feature`
4. Create Pull Request for review

## 🚀 Deployment

### Frontend (Expo)
```bash
cd frontend
eas build --platform android
eas build --platform ios
eas submit
```

### Backend Services
- Use Docker containers for consistent deployment
- Deploy to cloud platforms (AWS, GCP, Azure)
- Configure environment variables in production
- Set up CI/CD pipelines (GitHub Actions, GitLab CI)

### Recommended Infrastructure
- **Frontend**: Expo EAS / App Store / Google Play
- **Main Backend**: AWS EC2 / Google Cloud Run
- **AI Services**: GPU-enabled instances (AWS P3, GCP with GPU)
- **Database**: Firebase Firestore (managed)
- **Storage**: Firebase Storage / AWS S3

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is developed for Smart India Hackathon (SIH). All rights reserved.

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact the development team
- Check documentation in respective service folders

---

**Built with ❤️ for Mining Safety**
