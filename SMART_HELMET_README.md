# Smart Mining Helmet - ESP32 Integration Guide

## 🎯 Overview
This guide will help you integrate the ESP32-based Smart Mining Helmet with your React Native app.

---

## 📋 Hardware Requirements

### **Main Components:**
1. **ESP32 Development Board** (NodeMCU-32S or similar)
2. **MPU6050 IMU Module** (Accelerometer + Gyroscope)
3. **DHT11/DHT22** Temperature & Humidity Sensor
4. **MQ-5 Gas Sensor** (LPG, Natural Gas, Coal Gas detection)
5. **Emergency Push Button**
6. **Jumper Wires & Breadboard**

### **Wiring Diagram:**

```
ESP32          →  MPU6050
GPIO 21 (SDA)  →  SDA
GPIO 22 (SCL)  →  SCL
3.3V           →  VCC
GND            →  GND

ESP32          →  DHT11
GPIO 4         →  DATA
3.3V           →  VCC
GND            →  GND

ESP32          →  MQ-5
GPIO 27        →  DOUT
5V             →  VCC
GND            →  GND

ESP32          →  Emergency Button
GPIO 14        →  One terminal of button
GND            →  Other terminal (internal pull-up enabled)
```

---

## 🔧 ESP32 Setup

### **Step 1: Install Arduino IDE**
1. Download Arduino IDE from https://www.arduino.cc/en/software
2. Install ESP32 board support:
   - Go to **File → Preferences**
   - Add this URL to "Additional Board Manager URLs":
     ```
     https://dl.espressif.com/dl/package_esp32_index.json
     ```
   - Go to **Tools → Board → Boards Manager**
   - Search for "ESP32" and install **"ESP32 by Espressif Systems"**

### **Step 2: Install Required Libraries**
Go to **Sketch → Include Library → Manage Libraries** and install:
- **WebSockets by Markus Sattler** (for WebSocket server)
- **DHT sensor library by Adafruit**
- **Adafruit Unified Sensor**

### **Step 3: Configure WiFi**
In the ESP32 code, update these lines:
```cpp
const char* ssid     = "YOUR_WIFI_NETWORK_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
```

### **Step 4: Upload Code**
1. Connect ESP32 to your computer via USB
2. Select **Board**: "ESP32 Dev Module" (or your specific board)
3. Select **Port**: (e.g., COM3 on Windows, /dev/ttyUSB0 on Linux)
4. Click **Upload** button
5. Wait for upload to complete
6. Open **Serial Monitor** (115200 baud) to see the ESP32's IP address

**Example Serial Monitor Output:**
```
Smart Mining Helmet - WebSocket Live Stream
IMU WHO_AM_I: 0x68
IMU configured.
DHT initialized.
Connecting to WiFi....
Connected! IP address: 192.168.1.100
HTTP server started on port 80.
WebSocket server started on port 81.
```

---

## 📱 React Native App Configuration

### **Step 1: Update ESP32 IP Address**
Open `app/miner/SmartHelmetStatus.tsx` and update line 31:

```typescript
const ESP32_IP = '192.168.1.100'; // Replace with your ESP32's actual IP
```

**How to find ESP32 IP:**
- Check the Arduino Serial Monitor after ESP32 boots
- OR open your router's admin page and look for connected devices
- OR use a network scanner app

### **Step 2: Ensure Same WiFi Network**
⚠️ **IMPORTANT**: Your phone and ESP32 must be on the **same WiFi network** for WebSocket connection to work.

### **Step 3: Test Connection**
1. Make sure ESP32 is powered on and connected to WiFi
2. Open your app and navigate to **Miner Home**
3. Tap on **"Smart Helmet"** button
4. You should see:
   - **Connection Status**: "Connected" (green)
   - Real-time sensor data updating every 500ms

---

## 🌐 WebSocket Data Format

The ESP32 sends JSON data in this format every 500ms:

```json
{
  "imu": {
    "ax": 0.012,    // Acceleration X (g)
    "ay": -0.003,   // Acceleration Y (g)
    "az": 1.002,    // Acceleration Z (g)
    "gx": 2.45,     // Gyroscope X (°/s)
    "gy": -1.23,    // Gyroscope Y (°/s)
    "gz": 0.56,     // Gyroscope Z (°/s)
    "temp": 28.45   // IMU Temperature (°C)
  },
  "env": {
    "temp": 26.5,   // Environment Temperature (°C)
    "hum": 65.2     // Humidity (%)
  },
  "gas": {
    "detected": false  // true = gas detected, false = safe
  },
  "emergency": false   // true = button pressed, false = normal
}
```

---

## 🧪 Testing

### **Test 1: Web Dashboard**
Before testing the app, verify ESP32 is working:
1. Open a web browser
2. Go to `http://[ESP32_IP]` (e.g., `http://192.168.1.100`)
3. You should see a live dashboard with real-time data

### **Test 2: Gas Detection**
- Bring a lighter near the MQ-5 sensor (don't light it!)
- You should see "GAS DETECTED!" on both dashboard and app

### **Test 3: Emergency Button**
- Press the emergency button
- Alert should appear on both dashboard and app

### **Test 4: Motion Detection**
- Move the ESP32/IMU sensor
- Watch acceleration and gyroscope values change in real-time

---

## 🔍 Troubleshooting

### **Problem: "WebSocket Disconnected"**
**Solutions:**
1. Verify ESP32 is powered on and WiFi connected (check Serial Monitor)
2. Ensure phone and ESP32 are on the same WiFi network
3. Check IP address is correct in `SmartHelmetStatus.tsx`
4. Disable VPN on your phone
5. Check if firewall is blocking WebSocket connections

### **Problem: "Waiting for helmet data..."**
**Solutions:**
1. WebSocket connection is not established
2. ESP32 may have crashed - press the reset button
3. Check Serial Monitor for errors

### **Problem: DHT sensor shows "N/A"**
**Solutions:**
1. Check DHT11/DHT22 wiring (especially DATA pin to GPIO 4)
2. Verify DHT sensor is working (swap with a known good one)
3. Add a 10kΩ pull-up resistor between DATA and VCC

### **Problem: MQ-5 always shows "GAS DETECTED"**
**Solutions:**
1. MQ-5 needs 24-48 hours of warm-up time for first use
2. Check if DOUT pin is LOW by default (this is normal)
3. Calibrate sensor by adjusting the potentiometer on the module

### **Problem: IMU shows zeros or weird values**
**Solutions:**
1. Check I2C connections (SDA/SCL to GPIO 21/22)
2. Verify MPU6050 address (should be 0x68)
3. Try lower I2C clock speed: `Wire.setClock(100000);`

---

## 🚀 Advanced Features (Future Enhancements)

### **1. Heart Rate Monitoring**
- Add **MAX30102** pulse oximeter module
- Wiring: SDA→GPIO21, SCL→GPIO22
- Update ESP32 code to include heart rate and SpO2 data

### **2. GPS Location Tracking**
- Add **NEO-6M GPS Module**
- Wiring: TX→GPIO16, RX→GPIO17
- Track miner's location underground (if GPS signal available)

### **3. Light Intensity Sensor**
- Add **BH1750** light sensor
- Monitor helmet lamp status and ambient light

### **4. Battery Monitoring**
- Add voltage divider circuit to read battery voltage
- Alert when battery is low

### **5. Data Logging to SD Card**
- Add **SD card module**
- Log all sensor data for offline analysis

---

## 📊 App Features

### **Real-time Monitoring:**
- ✅ IMU motion tracking (acceleration & gyroscope)
- ✅ Temperature & humidity monitoring
- ✅ Gas detection alerts
- ✅ Emergency button status
- ✅ Auto-reconnect on connection loss

### **Safety Alerts:**
- 🚨 Emergency button press → Red alert with sound
- ⚠️ Gas detection → Warning alert
- 🌡️ High temperature warning (>35°C)

### **Placeholders for Future Sensors:**
- Heart Rate (BPM)
- Blood Oxygen (SpO2 %)
- GPS Location (Lat/Long)
- Light Intensity (Lux)

---

## 📝 Configuration Checklist

- [ ] ESP32 board installed in Arduino IDE
- [ ] All libraries installed (WebSockets, DHT, Adafruit)
- [ ] Hardware components wired correctly
- [ ] WiFi credentials updated in ESP32 code
- [ ] Code uploaded to ESP32 successfully
- [ ] ESP32 IP address noted from Serial Monitor
- [ ] IP address updated in `SmartHelmetStatus.tsx`
- [ ] Phone connected to same WiFi network as ESP32
- [ ] App tested and receiving real-time data

---

## 🆘 Support

If you encounter issues:
1. Check Serial Monitor output for error messages
2. Verify all connections with a multimeter
3. Test each sensor individually
4. Use the web dashboard to isolate app vs hardware issues

---

## 📄 License

This project is part of the SIH-Minerva smart mining safety system.

**Hardware Used:**
- ESP32-DevKitC V4
- MPU6050 6-Axis IMU
- DHT11 Temperature & Humidity Sensor
- MQ-5 Gas Sensor
- Push Button for Emergency

**WebSocket Protocol:**
- Port 81 for real-time data streaming
- JSON format for all sensor readings
- 500ms update interval
