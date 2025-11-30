# Pulse Sensor Integration - Smart Helmet System

## Overview
The Smart Helmet system has been updated to include heart rate monitoring using a pulse sensor connected to the ESP32.

## Hardware Setup

### Pulse Sensor Connection
- **Sensor Type**: Analog pulse sensor (heart rate monitor)
- **Connection Pin**: GPIO34 (ADC1_CH6)
- **Power**: 3.3V from ESP32
- **Signal**: Analog output (0-3.3V)

### Wiring Diagram
```
Pulse Sensor          ESP32
------------          -----
   VCC      -------->  3.3V
   GND      -------->  GND
   Signal   -------->  GPIO34 (Analog Input)
```

## Code Changes

### 1. Arduino ESP32 Code (`ESP32_SmartHelmet_Code.ino`)

#### Added Pin Configuration
```cpp
#define PULSE_PIN      34  // Analog input (ADC1_CH6)
#define PULSE_THRESHOLD 550  // Threshold for beat detection
#define PULSE_SAMPLES  10    // Number of samples for averaging
```

#### Pulse Detection Variables
```cpp
int pulseReading = 0;
int lastPulseReading = 0;
unsigned long lastBeatTime = 0;
int beatsPerMinute = 0;
bool beatDetected = false;
```

#### Setup Configuration
- Added `pinMode(PULSE_PIN, INPUT)`
- Set ADC attenuation: `analogSetAttenuation(ADC_11db)` for full 0-3.3V range

#### Heartbeat Detection Algorithm
- **Method**: Simple threshold-based detection
- **Rising Edge Detection**: Pulse crosses threshold (550)
- **BPM Calculation**: `BPM = 60000 / timeSinceLastBeat`
- **Valid Range**: 30-220 BPM
- **Timeout**: Reset to 0 if no pulse for 3 seconds
- **Debounce**: Ignore beats faster than 200 BPM (300ms minimum interval)

#### JSON Output Structure
```json
{
  "imu": {...},
  "env": {...},
  "gas": {...},
  "pulse": {
    "bpm": 72,        // Beats per minute (0 if no signal)
    "signal": 650     // Raw analog reading (0-4095)
  },
  "emergency": false
}
```

### 2. Web Dashboard
- Added **Heart Rate Monitor** card with:
  - Large BPM display (2.5em font)
  - Color coding:
    - Red: Abnormal rate (< 60 or > 100 BPM)
    - Green: Normal rate (60-100 BPM)
    - Gray: No signal
  - Signal strength display

### 3. React Native Mobile App

#### Updated Type Definitions
**MinerHome.tsx & SmartHelmetStatus.tsx**:
```typescript
interface HelmetData {
  // ... other fields
  pulse: {
    bpm: number;
    signal: number;
  };
  emergency: boolean;
}
```

#### MinerHome Widget
Added compact heart rate display:
- Shows BPM with heart icon
- Color indicators:
  - Green: Normal (60-100 BPM)
  - Red: Abnormal (< 60 or > 100 BPM)
  - Gray: No signal
- Yellow alert background for abnormal rates

#### SmartHelmetStatus Detailed View
- Replaced "Not Connected" placeholder with live data
- Added warning alerts for abnormal heart rates
- Shows raw signal strength value

#### New Icons
Added `Heart` icon to `components/Icons.tsx`:
```typescript
export const Heart = (props: any) => <Ionicons name="heart" {...props} />;
```

## Usage Instructions

### 1. Hardware Setup
1. Connect pulse sensor to ESP32 GPIO34
2. Power sensor from 3.3V (NOT 5V)
3. Place sensor on fingertip or earlobe for best results
4. Ensure good contact between sensor and skin

### 2. Upload Arduino Code
```bash
1. Open ESP32_SmartHelmet_Code.ino in Arduino IDE
2. Select Board: ESP32 Dev Module
3. Select Port: (your ESP32 port)
4. Click Upload
5. Open Serial Monitor (115200 baud)
6. Verify pulse readings in JSON output
```

### 3. Testing
1. **Web Dashboard**: Navigate to `http://[ESP32_IP]`
   - Check Heart Rate Monitor card
   - Verify BPM updates every 500ms
   - Test signal quality indicator

2. **Mobile App**: 
   - Open Miner Home screen
   - Check Smart Helmet widget for pulse display
   - Tap "View Full Details" for expanded view
   - Verify color coding (red for abnormal, green for normal)

### 4. Calibration
If readings are inaccurate:
- Adjust `PULSE_THRESHOLD` (line 84) - default is 550
  - Increase if detecting false beats
  - Decrease if missing beats
- Check Serial Monitor for raw signal values
- Ensure sensor has good skin contact

## Troubleshooting

### "No Signal" or BPM = 0
- **Check Connections**: Verify GPIO34 wiring
- **Sensor Placement**: Ensure good skin contact
- **Light Pressure**: Don't press too hard on sensor
- **Adjust Threshold**: Try values between 500-700

### Erratic Readings
- **Clean Sensor**: Remove dirt/oil from sensor surface
- **Stable Placement**: Minimize movement during reading
- **Lighting**: Some sensors sensitive to ambient light
- **Threshold**: Fine-tune PULSE_THRESHOLD value

### BPM Out of Range
- System automatically filters readings outside 30-220 BPM
- If consistently out of range, check sensor connections
- Verify 3.3V power (NOT 5V)

### No WebSocket Data
- Check ESP32 Serial Monitor for JSON output
- Verify pulse data included in JSON
- Check mobile app WebSocket connection status
- Update IP in `config/smartHelmetConfig.ts`

## Technical Specifications

### Sensor Requirements
- **Type**: Analog pulse sensor (photoplethysmography)
- **Operating Voltage**: 3.3V
- **Output**: Analog signal (0-3.3V)
- **Wavelength**: Typically 525nm (green) or 650nm (red)
- **Response Time**: < 1 second
- **Accuracy**: ±2 BPM at normal heart rates

### Performance Characteristics
- **Update Rate**: 500ms (2 Hz)
- **Detection Method**: Rising edge threshold
- **Valid BPM Range**: 30-220 BPM
- **Timeout Period**: 3 seconds (no pulse)
- **Minimum Beat Interval**: 300ms (prevents false triggers)

### ESP32 ADC Configuration
- **Pin**: GPIO34 (ADC1_CH6)
- **Resolution**: 12-bit (0-4095)
- **Attenuation**: 11dB (0-3.3V full scale)
- **Sampling**: Continuous during loop execution

## Data Flow

```
Pulse Sensor (Analog)
        ↓
ESP32 GPIO34 (ADC)
        ↓
Beat Detection Algorithm
        ↓
BPM Calculation
        ↓
JSON Serialization
        ↓
WebSocket Broadcast (Port 81)
        ↓
┌───────────────┬───────────────┐
Web Dashboard   Mobile App
(Browser)       (React Native)
```

## Future Enhancements

### Potential Improvements
1. **Moving Average Filter**: Smooth out BPM fluctuations
2. **Heart Rate Variability (HRV)**: Calculate time between beats
3. **Trend Analysis**: Track BPM over time
4. **Alert Thresholds**: Customizable high/low BPM warnings
5. **Sensor Quality Indicator**: Signal quality percentage
6. **Automatic Calibration**: Self-adjusting threshold

### Additional Sensors (Future)
- SpO2 (Blood Oxygen): Dual-wavelength sensor on GPIO35
- GPS Location: NEO-6M or similar on UART
- Ambient Light: BH1750 on I2C
- Air Quality: BME680 on I2C

## References

### Component Documentation
- [ESP32 ADC Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/peripherals/adc.html)
- [Pulse Sensor Getting Started](https://pulsesensor.com/pages/getting-started)
- [Photoplethysmography Theory](https://en.wikipedia.org/wiki/Photoplethysmogram)

### Code Files Modified
1. `ESP32_SmartHelmet_Code.ino` - Arduino firmware
2. `app/miner/MinerHome.tsx` - Main dashboard
3. `app/miner/SmartHelmetStatus.tsx` - Detailed view
4. `components/Icons.tsx` - Heart icon
5. `PULSE_SENSOR_INTEGRATION.md` - This document

## Support
For issues or questions:
1. Check Serial Monitor output (115200 baud)
2. Verify JSON includes "pulse" object
3. Test sensor with simple analog read sketch
4. Check ESP32 WiFi connection and IP address

---
**Last Updated**: November 30, 2025  
**System Version**: Smart Helmet v2.0 with Pulse Monitoring
