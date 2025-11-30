# MAX30100 Pulse Oximeter - Wiring Guide

## 🔌 Pin Connections

### ESP32 to MAX30100

```
MAX30100 Module    →    ESP32 DevKit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VIN (or VCC)       →    3.3V
GND                →    GND
SDA                →    GPIO21 (I2C Data)
SCL                →    GPIO22 (I2C Clock)
```

## 📋 Detailed Wiring

```
┌─────────────────┐         ┌──────────────────┐
│   MAX30100      │         │    ESP32 DEV     │
│   Module        │         │    MODULE        │
├─────────────────┤         ├──────────────────┤
│                 │         │                  │
│  ● VIN (3.3V)   ├─────────┤ 3.3V ●          │
│                 │   RED   │                  │
│  ● GND          ├─────────┤ GND  ●          │
│                 │  BLACK  │                  │
│  ● SDA          ├─────────┤ GPIO21 (SDA) ●  │
│                 │  BLUE   │                  │
│  ● SCL          ├─────────┤ GPIO22 (SCL) ●  │
│                 │  YELLOW │                  │
└─────────────────┘         └──────────────────┘
```

## ⚠️ Important Notes

### Power Supply
- **Use 3.3V ONLY** - MAX30100 is NOT 5V tolerant
- Do NOT connect to 5V pin on ESP32
- Current draw: ~50mA when LEDs are active

### Pull-up Resistors
- MAX30100 modules usually have **built-in 4.7kΩ pull-up resistors** on SDA/SCL
- If your module doesn't have them, add external 4.7kΩ resistors:
  ```
  SDA ──[4.7kΩ]── 3.3V
  SCL ──[4.7kΩ]── 3.3V
  ```

### I2C Address
- Default address: **0x57** (fixed, not configurable)
- ESP32 I2C pins: GPIO21 (SDA), GPIO22 (SCL) are default hardware I2C

## 🔧 Sensor Placement

### How to Use MAX30100

1. **Finger Placement:**
   - Place your **index finger** gently on top of the sensor
   - The red LED should be **underneath** your fingertip
   - Cover the sensor completely to block ambient light

2. **Pressure:**
   - Apply **gentle, steady pressure**
   - Don't press too hard (restricts blood flow)
   - Don't press too light (poor signal)

3. **Stay Still:**
   - Keep finger **motionless** for 10-15 seconds
   - Movement causes noise in readings
   - Avoid talking or moving during measurement

## 📊 Expected Readings

### Normal Values
- **Heart Rate:** 60-100 BPM (resting adult)
- **SpO2:** 95-100% (healthy adult)

### Warning Signs
- Heart Rate < 60 BPM = Bradycardia (low)
- Heart Rate > 100 BPM = Tachycardia (high)
- SpO2 < 90% = Hypoxemia (low oxygen - seek medical help)
- SpO2 90-94% = Borderline (monitor closely)

## 🛠️ Troubleshooting

### Sensor Not Detected (Initialization Failed)

**Problem:** Serial Monitor shows "MAX30100 FAILED!"

**Solutions:**
1. Check all 4 wire connections (VIN, GND, SDA, SCL)
2. Verify you're using 3.3V, not 5V
3. Try different I2C pins:
   ```cpp
   Wire.begin(21, 22); // SDA=21, SCL=22 (explicit)
   ```
4. Test with I2C scanner to verify address 0x57
5. Some modules need pull-up resistors - add 4.7kΩ to SDA and SCL

### Readings Show 0 or Random Values

**Problem:** BPM = 0.0, SpO2 = 0

**Solutions:**
1. Place finger correctly on sensor (cover completely)
2. Wait 10-15 seconds for initialization
3. Keep finger still
4. Check if red LED is glowing under finger
5. Try different finger (index finger works best)
6. Ensure room is not too bright (blocks IR sensor)

### Erratic Readings

**Problem:** Values jump around wildly

**Solutions:**
1. Reduce pressure on sensor
2. Keep hand and arm still
3. Rest elbow on table for stability
4. Avoid fluorescent lighting interference
5. Wait longer for sensor to stabilize (15-20 seconds)

## 🧪 Testing the Sensor

### Step 1: Upload Code
```bash
1. Open ESP32_SmartHelmet_Code.ino in Arduino IDE
2. Install library: Sketch → Manage Libraries → Search "MAX30100lib"
3. Select board: Tools → Board → ESP32 Dev Module
4. Select port: Tools → Port → COM# (your ESP32 port)
5. Click Upload
```

### Step 2: Open Serial Monitor
```bash
Tools → Serial Monitor
Baud Rate: 115200
```

### Step 3: Check Output
You should see:
```
✓ MAX30100 pulse oximeter initialized
💓 Heart Rate: 72.5 BPM | SpO2: 98 %
💓 Beat detected!
```

## 📱 Mobile App Integration

The React Native app automatically receives MAX30100 data via WebSocket:

```json
{
  "env": {"temp": 28.5, "hum": 65.0},
  "helmet": {"worn": true},
  "pulse": {
    "bpm": 72.5,
    "spo2": 98
  },
  "emergency": false
}
```

### App Updates Required

The mobile app already has `PulseWaveform` component that displays BPM. You need to update interfaces to include SpO2:

**File:** `app/miner/MinerHome.tsx`
```typescript
interface HelmetData {
  pulse: {
    bpm: number;
    spo2: number;  // ← Add this
    signal?: number; // ← Optional (not used with MAX30100)
  };
}
```

## 🔗 Additional Resources

- **MAX30100 Datasheet:** [maxim-ic.com/MAX30100](https://datasheets.maximintegrated.com/en/ds/MAX30100.pdf)
- **Arduino Library:** [oxullo/Arduino-MAX30100](https://github.com/oxullo/Arduino-MAX30100)
- **Alternative Library:** SparkFun MAX3010x Sensor Library

## ⚡ Quick Reference

| Parameter | Value |
|-----------|-------|
| Operating Voltage | 3.3V |
| I2C Address | 0x57 (fixed) |
| Communication | I2C (Wire) |
| Current Draw | ~50mA |
| Measurement Time | 10-15 seconds |
| Update Rate | 1 Hz (1 reading/sec) |
| Heart Rate Range | 40-180 BPM |
| SpO2 Range | 0-100% |

---

**✅ Checklist Before Testing:**
- [ ] MAX30100 connected to 3.3V (NOT 5V)
- [ ] SDA connected to GPIO21
- [ ] SCL connected to GPIO22
- [ ] GND connected to ESP32 GND
- [ ] Library "MAX30100lib" installed
- [ ] Code uploaded successfully
- [ ] Serial Monitor open at 115200 baud
- [ ] Finger placed gently on sensor
- [ ] Staying still for 15 seconds
