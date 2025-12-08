# Toll-Free Interactive Voice Experience

This project provides a prototype for delivering video/explainer content to callers who dial a toll-free number, with interactive voice and keypad (DTMF) responses.

## Core Idea
Callers dial a toll-free number and hear an audio adaptation of a video (script split into segments). They can:
- Press digits or speak commands (e.g., "next", "repeat", "question")
- Ask simple questions (speech recognition)
- Navigate sections

## Tech Stack
- Twilio Programmable Voice (Toll-Free Number + Webhook)
- Flask (Python) for IVR logic
- Twilio <Gather> with `input="speech dtmf"`
- Optional: Ngrok for local tunneling

## Features (Prototype)
- Intro message
- Segment-by-segment playback of video script
- DTMF and speech commands
- Minimal in-memory session state (per CallSid)

## Limitations
- Memory state resets if app restarts (use Redis/DB for production)
- Basic speech command parsing (no NLP)
- No persistent analytics yet

## Setup
1. Install Python 3.10+
2. Create virtual environment
3. Install dependencies
4. Populate `.env` with script segments
5. Run Flask server
6. Expose via ngrok and configure Twilio Voice webhook

### Environment Variables (`.env`)
Provide segments per language (pipe `|` delimited). Hindi & Telugu examples are placeholders; replace with real localized script. If Twilio TTS voice for Telugu is insufficient, record audio and switch to `<Play>`.
```
VIDEO_SEGMENTS_EN=Welcome to our service|We help users access information without smartphones|You can navigate using keypad or voice|Thank you for exploring the demo
VIDEO_SEGMENTS_HI=हमारी सेवा में आपका स्वागत है|हम स्मार्टफ़ोन के बिना सूचना पहुँच प्रदान करते हैं|आप कुंजीपैड या आवाज़ से नेविगेट कर सकते हैं|डेमो देखने के लिए धन्यवाद
VIDEO_SEGMENTS_TE=మా సేవకు స్వాగతం|స్మార్ట్‌ఫోన్ లేకుండానే సమాచారాన్ని అందిస్తాము|మీరు కీప్యాడ్ లేదా వాయిస్‌తో నావిగేట్ చేయవచ్చు|డెమోకి ధన్యవాదాలు
TWILIO_LANG_EN=en-IN
TWILIO_LANG_HI=hi-IN
TWILIO_LANG_TE=en-IN
ANI_LANG_MAP=+9140:te,+9111:hi,+9180:en
```
Note: Telugu currently falls back to `en-IN` for `<Say>`; consider pre-recorded audio for natural Telugu.

### Install & Run
```powershell
python -m venv .venv; .\.venv\Scripts\activate; pip install -r requirements.txt; flask --app app run --host 0.0.0.0 --port 5000
```

Expose with ngrok (after installing it):
```powershell
ngrok http 5000
```

Set Twilio Voice webhook (Incoming Call) to:
```
https://<your-ngrok-subdomain>.ngrok.io/voice
```

## Basic Call Flow
1. Caller dials number
2. If ANI prefix matches a mapping in `ANI_LANG_MAP`, language auto-selected and first segment plays; otherwise language selection: Press 1 English, 2 Hindi, 3 Telugu (or speak language name)
3. First segment plays with navigation instructions
4. `1` / "next" → next segment
5. `2` / "repeat" → repeat segment
6. `9` / "help" → help menu
7. "finish" (speech) → end call
8. At last segment, user hears completion and call ends

## Extending
- Dynamic content source (DB, CMS)
- ANI-based default language selection (caller region)
	- Current implementation uses static prefix matching; improve with external lookup API for circle/state if needed.
- Use recorded `<Play>` audio for higher quality Telugu
- NLP for open questions (intent classification)
- Persist responses & events (Redis/PostgreSQL)
- Outbound call campaigns (reminders / updates)

## Security & Compliance Considerations
- Store consent for recordings if recording enabled
- Regional telecom regulations (DNC lists, privacy)
- Data retention policies for transcripts

## Next Roadmap Ideas
- Session persistence & analytics dashboard
- Automatic transcript segmentation tool
- Voice rate customization for accessibility
- SMS fallback (send summary if mobile reachable)
- Call quality/error monitoring

## License
Prototype provided as-is; integrate according to your compliance context.
