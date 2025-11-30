# AI Video Generation Module - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Native App                          │
│                    (Expo / React Navigation)                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      Express Backend                             │
│                    (Node.js + TypeScript)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │  Controller  │──│   Service    │──│  Python Executor    │   │
│  │  (Routes)    │  │  (Business)  │  │  (Child Process)    │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ exec() / spawn()
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    Python Pipeline                               │
│                    (main.py + scripts/)                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Stage 1: Scene Breakdown (Gemini AI)                   │   │
│  │  ├─> Generate 6 scenes with descriptions                │   │
│  │  └─> Multilingual support (EN/HI/TE)                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Stage 2: Image Generation (HuggingFace)                │   │
│  │  ├─> Generate mining environment images                 │   │
│  │  └─> Character poses and safety equipment               │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Stage 3: Animation Creation (OpenCV)                   │   │
│  │  ├─> Apply motion effects to images                     │   │
│  │  └─> Pan, zoom, rotate based on context                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Stage 4: Voiceover Generation (ElevenLabs)             │   │
│  │  ├─> Text-to-speech for each scene                      │   │
│  │  └─> Language-specific voice models                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Stage 5: Video Assembly (FFmpeg/MoviePy)               │   │
│  │  ├─> Combine animations with audio                      │   │
│  │  └─> Add transitions and effects                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ File System
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Output Storage                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │   output/    │  │   images/    │  │      audio/          │ │
│  │  (Videos)    │  │  (Generated) │  │   (Voiceovers)       │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

```
User Action                Frontend                Backend                  Python
─────────────────────────────────────────────────────────────────────────────
                            
1. Select Language      [Language Modal]
   & Enter Topic        [Topic Input]
                              │
                              │
2. Click Generate             │
   Button                     │
                              ├──POST /api/video/generate───────>
                              │  {topic, language}
                              │                              
                              │                         [Create Job]
                              │                         [Start Python]
                              │                              │
                              │<─────{jobId}─────────────────┤
                              │                              │
                              │                              ▼
3. Start Polling              │                    [Execute Pipeline]
                              │                              │
   Every 2 seconds:           │                              │
                              │                              │
                              ├──GET /status/:jobId───────>  │
                              │                              │
                              │                     [Parse Progress]
                              │                              │
                              │<─────{stage, message}────────┤
                              │                              │
   [Update Progress UI]       │                              │
   Stage 0: ⏳────────────────┤                              │
   Stage 1: ○                 │                              │
   Stage 2: ○                 │                              ▼
   ...                        │                    [Stage 1: Scenes]
                              │                    [Stage 2: Images]
                              │                    [Stage 3: Animate]
4. Completion                 │                    [Stage 4: Audio]
                              │                    [Stage 5: Video]
                              │                              │
                              │                              │
                              ├──GET /status/:jobId───────>  │
                              │                              │
                              │<─────{status: "completed"}───┤
                              │      {videoUrl}              │
                              │                              │
   [Show Download Button]     │                              │
   ✓ Video Ready! ────────────┤                              │
                              │                              │
5. Download                   │                              │
                              │                              │
                              ├──GET /videos/filename────────>
                              │                              
                              │<─────[Video File]────────────
                              │
   [Play/Download Video] ─────┘
```

## Data Flow Diagram

```
┌─────────────────────┐
│  User Input         │
│  ─────────────      │
│  • Language: "hi"   │
│  • Topic: "PPE..."  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Backend API        │
│  ─────────────      │
│  • Validate input   │
│  • Create job ID    │
│  • Execute Python   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│         Python Pipeline                  │
│  ───────────────────────────────────    │
│                                          │
│  Input: "PPE Safety", "hi"               │
│     │                                    │
│     ▼                                    │
│  [Gemini AI]                             │
│     Scene 1: "खान प्रवेश पर..."        │
│     Scene 2: "हेलमेट पहने..."           │
│     ...                                  │
│     │                                    │
│     ▼                                    │
│  [HuggingFace]                           │
│     scene_01.png ─┐                      │
│     scene_02.png  │                      │
│     ...          ├── images/             │
│                  │                       │
│     ▼            │                       │
│  [OpenCV]        │                       │
│     animation_01.mp4 ─┐                  │
│     animation_02.mp4  │                  │
│     ...              ├── animations/     │
│                      │                   │
│     ▼                │                   │
│  [ElevenLabs]        │                   │
│     scene_01.wav ─┐  │                   │
│     scene_02.wav  │  │                   │
│     ...          ├───┤── audio/          │
│                  │   │                   │
│     ▼            │   │                   │
│  [Video Assembly]│   │                   │
│     final_video.mp4  │                   │
│                 └────┼── output/         │
│                      │                   │
└──────────────────────┼───────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────┐
│         Backend Serves Video             │
│  ───────────────────────────────────    │
│  Static route: /videos/final_video.mp4  │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│       Frontend Displays Video            │
│  ───────────────────────────────────    │
│  • Show preview                          │
│  • Enable download                       │
│  • Allow re-generation                   │
└─────────────────────────────────────────┘
```

## File Organization

```
SIH-Minerva/
│
├── app/
│   └── safety-officer/
│       ├── SafetyOfficerHome.tsx          ← Dashboard entry
│       └── VideoGenerationModule.tsx       ← Main UI component
│
├── backend/
│   └── src/
│       ├── app.ts                          ← Express setup + static files
│       ├── routes/
│       │   ├── index.ts                    ← Main router
│       │   └── videoGeneration.routes.ts   ← Video API routes
│       ├── controllers/
│       │   └── videoGeneration.controller.ts ← Request handlers
│       └── services/
│           └── videoGeneration.service.ts  ← Business logic
│
├── scripts/
│   ├── generate_video.py                  ← CLI wrapper
│   ├── script_generator.py                ← Scene generation
│   ├── image_generator.py                 ← Image generation
│   ├── animation_generator.py             ← Animation creation
│   ├── voiceover_generator.py             ← TTS generation
│   └── video_assembler.py                 ← Final assembly
│
├── output/                                 ← Generated videos
├── images/                                 ← Generated images
├── audio/                                  ← Generated audio
├── animations/                             ← Generated animations
│
├── config.json                             ← Pipeline configuration
├── .env                                    ← API keys (not in git)
└── main.py                                 ← Main pipeline orchestrator
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
├─────────────────────────────────────────────────────────────┤
│  React Native        │  UI framework                         │
│  Expo                │  Development platform                 │
│  TypeScript          │  Type safety                          │
│  React Navigation    │  Routing                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
├─────────────────────────────────────────────────────────────┤
│  Node.js             │  Runtime environment                  │
│  Express.js          │  Web framework                        │
│  TypeScript          │  Type safety                          │
│  Child Process       │  Python execution                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Python Pipeline                          │
├─────────────────────────────────────────────────────────────┤
│  Gemini 2.0 Flash    │  Scene script generation              │
│  HuggingFace FLUX    │  Image generation                     │
│  OpenCV              │  Animation & video processing         │
│  ElevenLabs          │  Multilingual text-to-speech          │
│  MoviePy/FFmpeg      │  Video assembly                       │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints Reference

```
┌────────────────────────────────────────────────────────────────┐
│  POST /api/video/generate                                      │
├────────────────────────────────────────────────────────────────┤
│  Request Body:                                                 │
│    {                                                           │
│      "topic": "PPE Safety in Mines",                           │
│      "language": "en"                                          │
│    }                                                           │
│                                                                │
│  Response (202 Accepted):                                      │
│    {                                                           │
│      "success": true,                                          │
│      "jobId": "job_1234567890_xyz",                            │
│      "message": "Video generation started"                     │
│    }                                                           │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  GET /api/video/status/:jobId                                  │
├────────────────────────────────────────────────────────────────┤
│  Response (Processing):                                        │
│    {                                                           │
│      "success": true,                                          │
│      "status": "processing",                                   │
│      "currentStage": 2,                                        │
│      "message": "Creating animations...",                      │
│      "videoUrl": null                                          │
│    }                                                           │
│                                                                │
│  Response (Completed):                                         │
│    {                                                           │
│      "success": true,                                          │
│      "status": "completed",                                    │
│      "currentStage": 5,                                        │
│      "message": "Video generation completed!",                 │
│      "videoUrl": "/videos/mining_safety_20231127.mp4"          │
│    }                                                           │
└────────────────────────────────────────────────────────────────┘
```

## Stage Progression

```
Stage 0: Scene Breakdown
─────────────────────────
Input:   Topic + Language
API:     Gemini 2.0 Flash
Output:  JSON with 6 scenes
Time:    ~15 seconds
Status:  "Generating scene breakdown..."

Stage 1: Image Generation
──────────────────────────
Input:   Scene descriptions
API:     HuggingFace FLUX.1
Output:  6 PNG images (512x512)
Time:    ~60 seconds
Status:  "Generating images..."

Stage 2: Animation Creation
────────────────────────────
Input:   Generated images
Process: OpenCV transformations
Output:  6 MP4 animations (4s each)
Time:    ~90 seconds
Status:  "Creating animations..."

Stage 3: Voiceover Generation
──────────────────────────────
Input:   Scene voiceover text
API:     ElevenLabs TTS
Output:  6 WAV audio files
Time:    ~30 seconds
Status:  "Generating voiceovers..."

Stage 4: Video Assembly
───────────────────────
Input:   Animations + Audio
Process: FFmpeg/MoviePy
Output:  Final MP4 video
Time:    ~60 seconds
Status:  "Assembling final video..."

Total Time: 3-5 minutes
```

---

**This architecture enables scalable, maintainable, and user-friendly AI video generation!**
