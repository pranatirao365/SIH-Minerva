# Miner Call Center - Toll-Free Integration

## Overview
The Miner Call Center feature allows Safety Officers to make automated toll-free calls to miners with safety briefings. This integrates the existing toll-free system with the safety officer dashboard.

## Features

### 1. **Miner Selection**
- View complete list of registered miners
- Search by name, phone number, or department
- Multi-select miners for batch calling
- Select/Deselect all functionality
- Shows miner details: name, phone, department, shift

### 2. **Automated Calling**
- One-click toll-free calls to selected miners
- Real-time call status indicators:
  - 🟡 Yellow: Call in progress
  - 🟢 Green: Call successful
  - 🔴 Red: Call failed
- Batch calling support (call multiple miners simultaneously)

### 3. **Call Monitoring**
- Visual feedback for each call attempt
- Success/failure status for each miner
- Call count and confirmation dialogs

## Setup Instructions

### 1. Start the Toll-Free Server

```powershell
cd "Toll free"
node server.js
```

The server will start on `http://localhost:5000`

### 2. Configure IP Address

Make sure your IP address is correctly set in `.env`:
```
EXPO_PUBLIC_IP_ADDRESS=172.16.58.154
```

### 3. Twilio Configuration

The toll-free server uses Twilio credentials (already configured in `server.js`):
- Account SID: `AC0aa790a3a762d1b4f9329942c229712c`
- Auth Token: `677b573cc95c5b67bd1e5f6535a051a3`
- From Number: `+1 484 371 5640`

## Usage

### For Safety Officers:

1. **Access the Feature**
   - Open the Safety Officer dashboard
   - Tap on "Miner Call Center" card (green phone icon)

2. **Select Miners**
   - Browse the list of miners
   - Tap on miners to select them (checkmark appears)
   - Use search to filter by name/phone/department
   - Use "Select All" or "Clear" buttons for bulk selection

3. **Make Calls**
   - Tap the "Call X Miner(s)" button at the bottom
   - Confirm the action in the dialog
   - Wait for calls to be initiated
   - View real-time status updates

4. **Monitor Results**
   - Green checkmark: Call successfully initiated
   - Red alert icon: Call failed
   - Yellow spinner: Call in progress

## API Endpoint

### POST `/alert`

**Request Body:**
```json
{
  "phoneNumbers": ["+919876543210", "+919876543211"],
  "message": "Safety briefing from safety officer"
}
```

**Response:**
```json
{
  "message": "Alert calls sent to 2 miner(s)!",
  "count": 2,
  "callSids": ["CAxxxx", "CAxxxx"]
}
```

## Audio Content

The automated call plays a Hindi safety message about mine ventilation systems:
- Importance of proper ventilation
- How ventilation fans work
- Gas detector usage
- Reporting ventilation issues
- Maintaining ventilation curtains

## Customization

### Change Audio Message

Edit the `twiml` variable in `server.js`:

```javascript
const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="hi-IN">Your custom message here</Say>
</Response>`;
```

### Add Audio File Instead of TTS

Replace `<Say>` with `<Play>`:

```javascript
const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>https://your-server.com/audio/safety-briefing.mp3</Play>
</Response>`;
```

### Change Language

Modify the `language` attribute in `<Say>`:
- `en-IN` for English (India)
- `hi-IN` for Hindi
- `te-IN` for Telugu

## Troubleshooting

### Calls Not Working

1. **Check Server Status**
   ```powershell
   # Verify server is running
   curl http://localhost:5000/voice-test
   ```

2. **Check Network**
   - Ensure phone and server are on same network
   - Verify IP address in `.env` is correct
   - Check firewall settings allow port 5000

3. **Verify Twilio Balance**
   - Log into Twilio console
   - Check account balance and limits
   - Verify phone numbers are valid

### Phone Numbers Format

- Must include country code: `+91XXXXXXXXXX`
- Stored in Firestore user documents as `phoneNumber` field
- Invalid numbers are filtered out automatically

## Architecture

```
Safety Officer App (Frontend)
    ↓
[MinerCallCenter.tsx]
    ↓
HTTP POST to toll-free server
    ↓
[server.js] Port 5000
    ↓
Twilio API
    ↓
📞 Automated Calls to Miners
```

## Files Modified/Created

### New Files:
- `frontend/app/safety-officer/MinerCallCenter.tsx` - Main call center interface

### Modified Files:
- `frontend/app/safety-officer/SafetyOfficerHome.tsx` - Added call center card
- `Toll free/server.js` - Enhanced API to accept dynamic phone numbers

## Future Enhancements

1. **Call History**
   - Store call records in Firestore
   - View past calls and outcomes
   - Generate call reports

2. **Multiple Message Templates**
   - Select from pre-defined safety messages
   - Custom message composer
   - Multi-language support

3. **Scheduled Calls**
   - Schedule calls for specific times
   - Recurring call schedules
   - Timezone support

4. **Call Analytics**
   - Track call duration
   - Monitor answer rates
   - Generate usage reports

5. **Interactive IVR**
   - Allow miners to respond with keypad
   - Record miner feedback
   - Two-way communication

## Security Notes

⚠️ **Important**: The Twilio credentials in `server.js` are hardcoded for demo purposes. For production:

1. Move credentials to environment variables
2. Use Twilio's signature validation
3. Implement authentication middleware
4. Rate limit the API endpoint
5. Add request logging and monitoring

## Support

For issues or questions:
- Check logs in server console
- Verify Firestore has valid miner data
- Ensure proper role-based access (safety-officer only)
