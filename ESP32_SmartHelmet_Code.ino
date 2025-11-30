/*
 * ============================================
 * SMART MINING HELMET - ESP32 WebSocket Server
 * ============================================
 * 
 * Hardware Requirements:
 * - ESP32 Development Board
 * - DHT11 Temperature & Humidity Sensor
 * - IR Sensor (Helmet Detection)
 * - MAX30100 Pulse Oximeter (Heart Rate & SpO2)
 * - MQ-4 Methane Gas Sensor (CH4 Detection)
 * - Emergency Push Button
 * - Buzzer (Active/Passive)
 * 
 * Pin Configuration:
 * - DHT11: DATA=GPIO4
 * - IR Sensor: DOUT=GPIO27
 * - MAX30100: SDA=GPIO21, SCL=GPIO22 (I2C)
 * - MQ-4 Sensor: AOUT=GPIO34 (Analog), DOUT=GPIO35 (Digital - Optional)
 * - Emergency Button: GPIO14 (with internal pull-up)
 * - Buzzer: GPIO5 (Output)
 * 
 * MQ-4 Gas Sensor Wiring:
 * - VCC → 5V (MQ-4 requires 5V for heater)
 * - GND → GND
 * - AOUT (Analog Output) → GPIO34 (ADC1_CH6)
 * - DOUT (Digital Output) → GPIO35 (Optional - threshold detection)
 * 
 * Note: MQ-4 requires 24-48 hours preheating for accurate readings.
 * The sensor detects methane (CH4), natural gas, and CNG.
 * Typical detection range: 300-10000 ppm
 * 
 * Gas Level Thresholds:
 * - Safe: < 1000 ppm (< 25% LEL)
 * - Warning: 1000-2500 ppm (25-50% LEL)
 * - Danger: > 2500 ppm (> 50% LEL)
 * - Critical: > 5000 ppm (> 100% LEL - Explosive!)
 * 
 * Required Libraries (Install from Arduino Library Manager):
 * - WebSockets by Markus Sattler
 * - DHT sensor library by Adafruit
 * - Adafruit Unified Sensor
 * - MAX30100lib by oxullo (or MAX30100 by Gabriel Notman)
 * 
 * Setup Instructions:
 * 1. Update WiFi SSID and PASSWORD below (lines 41-42)
 * 2. Upload code to ESP32
 * 3. Open Serial Monitor (115200 baud)
 * 4. Note the IP address printed
 * 5. Update IP in React Native app: config/smartHelmetConfig.ts
 * 
 * ============================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <Wire.h>
#include "DHT.h"
#include "MAX30100_PulseOximeter.h"

// ============================================
// WiFi CONFIGURATION - UPDATE THESE!
// ============================================
const char* ssid     = "omenn";                 // ← Change this to your WiFi network name
const char* password = "12345678@";             // ← Change this to your WiFi password

// ============================================
// WEB SERVER & WEBSOCKET
// ============================================
WebServer server(80);
WebSocketsServer webSocket = WebSocketsServer(81);

// ============================================
// DHT SENSOR CONFIGURATION
// ============================================
#define DHTPIN   4
#define DHTTYPE  DHT11   // Change to DHT22 if using DHT22
DHT dht(DHTPIN, DHTTYPE);

// ============================================
// IR SENSOR (HELMET DETECTION) & EMERGENCY BUTTON
// ============================================
#define IR_SENSOR_PIN  27  // IR sensor for helmet worn detection
#define EMERGENCY_PIN  14
#define BUZZER_PIN     5   // Buzzer for emergency alerts

// ============================================
// MQ-4 METHANE GAS SENSOR CONFIGURATION
// ============================================
#define MQ4_ANALOG_PIN  34  // Analog output from MQ-4 (ADC1_CH6)
#define MQ4_DIGITAL_PIN 35  // Digital output from MQ-4 (optional threshold detection)

// MQ-4 Gas detection thresholds (in ppm)
#define GAS_SAFE_THRESHOLD     1000   // < 1000 ppm = Safe
#define GAS_WARNING_THRESHOLD  2500   // 1000-2500 ppm = Warning
#define GAS_DANGER_THRESHOLD   5000   // 2500-5000 ppm = Danger, > 5000 = Critical

// MQ-4 calibration values (adjust based on sensor calibration)
#define MQ4_RL_VALUE           10.0   // Load resistance in kOhms (typically 10K)
#define MQ4_RO_CLEAN_AIR_FACTOR 4.4   // Rs/Ro in clean air (from datasheet)

// MQ-4 sensor variables
float mq4_ro = 10.0;  // Sensor resistance in clean air (will be calibrated)
int gasLevel = 0;     // Current gas reading (ppm)
int gasAnalogRaw = 0; // Raw ADC value

// Buzzer control variables
bool buzzerActive = false;
unsigned long buzzerStartTime = 0;
const unsigned long buzzerDuration = 5000; // Buzzer on for 5 seconds

// ============================================
// MAX30100 PULSE OXIMETER CONFIGURATION
// ============================================
#define REPORTING_PERIOD_MS  1000  // Report every 1 second

// Create MAX30100 object
PulseOximeter pox;

// MAX30100 sensor variables
float heartRate = 0;
uint8_t spO2 = 0;
uint32_t lastReport = 0;
bool sensorReady = false;

// ============================================
// WEB DASHBOARD HTML PAGE
// ============================================
const char MAIN_page[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Mining Helmet Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); 
      color: #eee; 
      padding: 20px; 
      min-height: 100vh;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { 
      text-align: center; 
      color: #00d4ff; 
      margin-bottom: 10px;
      font-size: 2em;
      text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    }
    .subtitle {
      text-align: center;
      color: #888;
      margin-bottom: 30px;
      font-size: 0.9em;
    }
    #conn { 
      text-align: center; 
      padding: 12px; 
      background: rgba(255,255,255,0.1); 
      border-radius: 8px;
      margin-bottom: 20px;
      font-weight: bold;
    }
    .status-connected { color: #4caf50; }
    .status-disconnected { color: #f44336; }
    
    .grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
      gap: 20px; 
      margin-bottom: 20px;
    }
    .card { 
      background: rgba(255,255,255,0.05); 
      backdrop-filter: blur(10px);
      padding: 20px; 
      border-radius: 12px; 
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
      border: 1px solid rgba(255,255,255,0.1);
      transition: transform 0.3s ease;
    }
    .card:hover { transform: translateY(-5px); }
    .card-title { 
      font-size: 1.2em; 
      margin-bottom: 15px; 
      color: #00d4ff;
      border-bottom: 2px solid rgba(0, 212, 255, 0.3);
      padding-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .card-icon { font-size: 1.5em; }
    .value-group { 
      margin: 15px 0;
      padding: 15px;
      background: rgba(0,0,0,0.3);
      border-radius: 8px;
    }
    .value-label { 
      font-size: 0.85em; 
      color: #aaa; 
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .value { 
      font-family: 'Courier New', monospace; 
      font-size: 1.3em;
      font-weight: bold;
      color: #fff;
    }
    .triple-value {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 10px;
    }
    .axis-box {
      text-align: center;
      padding: 12px;
      background: rgba(0, 212, 255, 0.1);
      border-radius: 6px;
      border: 1px solid rgba(0, 212, 255, 0.3);
    }
    .axis-label {
      font-size: 0.8em;
      color: #00d4ff;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .axis-value {
      font-family: 'Courier New', monospace;
      font-size: 1.1em;
      color: #fff;
    }
    
    .status-ok { color: #4caf50; }
    .status-warn { color: #ff9800; }
    .status-danger { 
      color: #f44336; 
      font-weight: bold;
      animation: pulse 1s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    .big-status {
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      font-size: 1.5em;
      font-weight: bold;
      margin-top: 10px;
    }
    .status-safe {
      background: rgba(76, 175, 80, 0.2);
      border: 2px solid #4caf50;
      color: #4caf50;
    }
    .status-emergency {
      background: rgba(244, 67, 54, 0.3);
      border: 2px solid #f44336;
      color: #f44336;
      animation: blink 0.5s infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    
    footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
      color: #666;
      font-size: 0.85em;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⛑️ Smart Mining Helmet</h1>
    <p class="subtitle">Real-Time Sensor Monitoring Dashboard</p>
    <div id="conn" class="status-disconnected">Connecting to WebSocket...</div>

    <div class="grid">
      <!-- Environment Card -->
      <div class="card">
        <div class="card-title">
          <span class="card-icon">🌡️</span>
          Environment
        </div>
        <div class="value-group">
          <div class="value-label">Temperature</div>
          <div class="value" id="env_temp">- °C</div>
        </div>
        <div class="value-group">
          <div class="value-label">Humidity</div>
          <div class="value" id="env_hum">- %</div>
        </div>
      </div>

      <!-- Helmet Detection Card -->
      <div class="card">
        <div class="card-title">
          <span class="card-icon">🪖</span>
          Helmet Status
        </div>
        <div class="big-status status-safe" id="helmet_status">
          Checking...
        </div>
      </div>

      <!-- Emergency Card -->
      <div class="card">
        <div class="card-title">
          <span class="card-icon">🚨</span>
          Emergency Status
        </div>
        <div class="big-status status-safe" id="em_status">
          Normal Operation
        </div>
      </div>

      <!-- Heart Rate & SpO2 Card -->
      <div class="card">
        <div class="card-title">
          <span class="card-icon">❤️</span>
          MAX30100 Vitals Monitor
        </div>
        <div class="value-group">
          <div class="value-label">Heart Rate</div>
          <div class="value" id="pulse_bpm" style="font-size: 2.5em; color: #ff4757;">- BPM</div>
        </div>
        <div class="value-group">
          <div class="value-label">Blood Oxygen (SpO2)</div>
          <div class="value" id="spo2" style="font-size: 2.0em; color: #00d4ff;">- %</div>
        </div>
      </div>

      <!-- Methane Gas Card -->
      <div class="card">
        <div class="card-title">
          <span class="card-icon">💨</span>
          MQ-4 Gas Detector
        </div>
        <div class="value-group">
          <div class="value-label">Methane Level</div>
          <div class="value" id="gas_level" style="font-size: 2.0em; color: #2ecc71;">- ppm</div>
        </div>
        <div class="big-status status-safe" id="gas_status">
          Checking...
        </div>
      </div>
    </div>

    <footer>
      Smart Mining Helmet System | ESP32 WebSocket Server
    </footer>
  </div>

<script>
  let gateway = `ws://${window.location.hostname}:81/`;
  let websocket;

  function initWebSocket() {
    websocket = new WebSocket(gateway);
    websocket.onopen = function() { 
      document.getElementById('conn').innerText = "✓ WebSocket Connected"; 
      document.getElementById('conn').className = "status-connected";
    };
    websocket.onclose = function() { 
      document.getElementById('conn').innerText = "✗ WebSocket Disconnected - Retrying..."; 
      document.getElementById('conn').className = "status-disconnected";
      setTimeout(initWebSocket, 2000); 
    };
    websocket.onmessage = onMessage;
    websocket.onerror = function(error) {
      console.error('WebSocket Error:', error);
    };
  }

  function onMessage(event) {
    try {
      let data = JSON.parse(event.data);

      // Environment Data
      if (data.env) {
        if (data.env.temp !== null) {
          let tempEl = document.getElementById('env_temp');
          tempEl.innerText = `${data.env.temp.toFixed(1)} °C`;
          tempEl.className = data.env.temp > 35 ? 'value status-danger' : 'value';
        } else {
          document.getElementById('env_temp').innerText = 'N/A';
        }
        
        if (data.env.hum !== null) {
          document.getElementById('env_hum').innerText = `${data.env.hum.toFixed(1)} %`;
        } else {
          document.getElementById('env_hum').innerText = 'N/A';
        }
      }

      // Helmet Detection
      if (data.helmet) {
        let helmetEl = document.getElementById('helmet_status');
        if (data.helmet.worn) {
          helmetEl.innerText = "✓ Helmet Worn";
          helmetEl.className = "big-status status-safe";
        } else {
          helmetEl.innerText = "⚠️ Helmet Not Worn";
          helmetEl.className = "big-status status-emergency";
        }
      }

      // Emergency Status
      if (data.emergency !== undefined) {
        let emEl = document.getElementById('em_status');
        if (data.emergency) {
          emEl.innerText = "🚨 EMERGENCY ACTIVATED!";
          emEl.className = "big-status status-emergency";
        } else {
          emEl.innerText = "Normal Operation";
          emEl.className = "big-status status-safe";
        }
      }

      // MAX30100 Pulse Oximeter Data
      if (data.pulse) {
        let bpmEl = document.getElementById('pulse_bpm');
        let spo2El = document.getElementById('spo2');
        
        if (data.pulse.bpm > 0) {
          bpmEl.innerText = data.pulse.bpm.toFixed(1) + " BPM";
          // Color coding: Red if abnormal (< 60 or > 100), green if normal
          bpmEl.style.color = (data.pulse.bpm < 60 || data.pulse.bpm > 100) ? '#ff6348' : '#2ecc71';
        } else {
          bpmEl.innerText = "-- BPM";
          bpmEl.style.color = '#888';
        }
        
        if (data.pulse.spo2 > 0) {
          spo2El.innerText = data.pulse.spo2 + " %";
          // Color coding: Red if low (<90%), yellow if borderline (90-94%), green if good (>94%)
          spo2El.style.color = data.pulse.spo2 < 90 ? '#ff6348' : data.pulse.spo2 < 95 ? '#f39c12' : '#2ecc71';
        } else {
          spo2El.innerText = "-- %";
          spo2El.style.color = '#888';
        }
      }

      // MQ-4 Gas Sensor Data
      if (data.gas) {
        let gasLevelEl = document.getElementById('gas_level');
        let gasStatusEl = document.getElementById('gas_status');
        
        if (data.gas.ppm !== undefined) {
          gasLevelEl.innerText = data.gas.ppm + " ppm";
          
          // Color coding based on danger level
          if (data.gas.ppm < 1000) {
            gasLevelEl.style.color = '#2ecc71'; // Green - Safe
            gasStatusEl.innerText = "✓ Safe - Normal Levels";
            gasStatusEl.className = "big-status status-safe";
          } else if (data.gas.ppm < 2500) {
            gasLevelEl.style.color = '#f39c12'; // Yellow - Warning
            gasStatusEl.innerText = "⚠️ WARNING - Elevated Gas";
            gasStatusEl.className = "big-status status-emergency";
            gasStatusEl.style.background = "rgba(243, 156, 18, 0.3)";
            gasStatusEl.style.borderColor = "#f39c12";
            gasStatusEl.style.color = "#f39c12";
          } else if (data.gas.ppm < 5000) {
            gasLevelEl.style.color = '#ff6348'; // Orange-Red - Danger
            gasStatusEl.innerText = "🚨 DANGER - High Gas Level!";
            gasStatusEl.className = "big-status status-emergency";
          } else {
            gasLevelEl.style.color = '#e74c3c'; // Red - Critical
            gasStatusEl.innerText = "💀 CRITICAL - EVACUATE NOW!";
            gasStatusEl.className = "big-status status-emergency";
          }
        } else {
          gasLevelEl.innerText = "-- ppm";
          gasLevelEl.style.color = '#888';
          gasStatusEl.innerText = "Sensor Warming Up...";
          gasStatusEl.className = "big-status status-safe";
        }
      }

    } catch (e) {
      console.error("Invalid JSON:", e, event.data);
    }
  }

  window.addEventListener('load', initWebSocket);
</script>
</body>
</html>
)rawliteral";

// ============================================
// MQ-4 GAS SENSOR FUNCTIONS
// ============================================
// Calculate sensor resistance from analog reading
float MQResistanceCalculation(int raw_adc) {
  if (raw_adc == 0) return 0;
  return (((float)MQ4_RL_VALUE * (4095 - raw_adc) / raw_adc));
}

// Calibrate sensor - call this in clean air during setup
float MQCalibration() {
  float val = 0;
  // Take 50 samples
  for (int i = 0; i < 50; i++) {
    val += MQResistanceCalculation(analogRead(MQ4_ANALOG_PIN));
    delay(50);
  }
  val = val / 50;  // Average
  val = val / MQ4_RO_CLEAN_AIR_FACTOR;  // Calculate Ro
  return val;
}

// Read methane concentration in ppm
int MQGetGasPercentage(float rs_ro_ratio) {
  // MQ-4 curve equation for methane: ppm = 1000 * pow(10, (log10(rs_ro_ratio) - 0.36) / -0.38)
  // Simplified approximation for methane detection
  if (rs_ro_ratio <= 0) return 0;
  
  float ppm = 1000.0 * pow(10.0, ((log10(rs_ro_ratio) - 0.36) / -0.38));
  
  // Limit to reasonable range
  if (ppm < 0) ppm = 0;
  if (ppm > 10000) ppm = 10000;
  
  return (int)ppm;
}

// Read current gas level
int readMQ4GasLevel() {
  gasAnalogRaw = analogRead(MQ4_ANALOG_PIN);
  float rs = MQResistanceCalculation(gasAnalogRaw);
  float rs_ro_ratio = rs / mq4_ro;
  return MQGetGasPercentage(rs_ro_ratio);
}

// ============================================
// MAX30100 CALLBACK - BEAT DETECTION
// ============================================
void onBeatDetected() {
  Serial.println("💓 Beat detected!");
}

// ============================================
// WEBSOCKET EVENT HANDLER
// ============================================
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.print("✓ WebSocket client connected: ");
      Serial.println(ip);
      break;
    }
    case WStype_DISCONNECTED:
      Serial.printf("✗ WebSocket client %u disconnected\n", num);
      break;

    case WStype_TEXT: {
      Serial.printf("Message from client %u: %s\n", num, payload);
      
      // Parse command from mobile app (from supervisor/safety officer)
      String message = String((char*)payload);
      if (message == "ALERT_MINER") {
        // Activate buzzer - command from supervisor/safety officer
        buzzerActive = true;
        buzzerStartTime = millis();
        digitalWrite(BUZZER_PIN, HIGH);
        Serial.println("🚨 Alert buzzer activated by supervisor/safety officer!");
      } else if (message == "ALERT_MINER_STOP") {
        // Deactivate buzzer
        buzzerActive = false;
        digitalWrite(BUZZER_PIN, LOW);
        Serial.println("✓ Alert buzzer deactivated");
      }
      break;
    }

    default:
      break;
  }
}

// ============================================
// SETUP FUNCTION
// ============================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("============================================");
  Serial.println("   SMART MINING HELMET - ESP32 Server");
  Serial.println("============================================");

  // Initialize I2C for MAX30100
  Wire.begin();

  // Initialize DHT sensor
  dht.begin();
  Serial.println("✓ DHT sensor initialized");

  // Initialize GPIO pins
  pinMode(IR_SENSOR_PIN, INPUT);
  pinMode(EMERGENCY_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(MQ4_ANALOG_PIN, INPUT);
  pinMode(MQ4_DIGITAL_PIN, INPUT);
  digitalWrite(BUZZER_PIN, LOW);  // Buzzer off initially
  Serial.println("✓ GPIO pins configured");
  Serial.println("✓ IR sensor initialized for helmet detection");
  Serial.println("✓ Buzzer initialized on GPIO5");
  
  // Calibrate MQ-4 sensor
  Serial.print("Calibrating MQ-4 gas sensor...");
  mq4_ro = MQCalibration();
  Serial.print(" Done! Ro = ");
  Serial.print(mq4_ro);
  Serial.println(" kOhms");
  Serial.println("✓ MQ-4 methane sensor initialized on GPIO34");
  Serial.println("   Note: MQ-4 requires 24-48hrs preheating for accuracy");
  Serial.println("   Gas thresholds: Safe<1000, Warning<2500, Danger<5000, Critical>5000 ppm");

  // Initialize MAX30100 sensor
  Serial.print("Initializing MAX30100...");
  if (!pox.begin()) {
    Serial.println(" FAILED!");
    Serial.println("⚠️ MAX30100 not found. Check wiring:");
    Serial.println("   SDA → GPIO21");
    Serial.println("   SCL → GPIO22");
    Serial.println("   VIN → 3.3V");
    Serial.println("   GND → GND");
    sensorReady = false;
  } else {
    Serial.println(" SUCCESS!");
    pox.setIRLedCurrent(MAX30100_LED_CURR_7_6MA);
    pox.setOnBeatDetectedCallback(onBeatDetected);
    sensorReady = true;
    Serial.println("✓ MAX30100 pulse oximeter initialized");
  }

  // Connect to WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("✓ WiFi connected!");
    Serial.print("   IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("   Web Dashboard: http://");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("✗ WiFi connection failed!");
    Serial.println("   Check SSID and password, then reset ESP32");
  }

  // Start HTTP server
  server.on("/", []() {
    server.send_P(200, "text/html", MAIN_page);
  });
  server.begin();
  Serial.println("✓ HTTP server started on port 80");

  // Start WebSocket server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("✓ WebSocket server started on port 81");

  Serial.println("============================================");
  Serial.println("   System Ready - Streaming Data");
  Serial.println("============================================");
}

// ============================================
// MAIN LOOP
// ============================================
unsigned long lastSend = 0;
const unsigned long sendInterval = 500; // Send data every 500ms

void loop() {
  server.handleClient();
  webSocket.loop();

  // Buzzer control - auto shutoff after duration
  if (buzzerActive && (millis() - buzzerStartTime > buzzerDuration)) {
    buzzerActive = false;
    digitalWrite(BUZZER_PIN, LOW);
    Serial.println("✓ Buzzer auto-shutoff after 5 seconds");
  }

  // Update MAX30100 sensor (must be called frequently)
  if (sensorReady) {
    pox.update();
    
    // Read sensor values periodically
    if (millis() - lastReport > REPORTING_PERIOD_MS) {
      heartRate = pox.getHeartRate();
      spO2 = pox.getSpO2();
      
      // Debug output
      Serial.print("💓 Heart Rate: ");
      Serial.print(heartRate);
      Serial.print(" BPM | SpO2: ");
      Serial.print(spO2);
      Serial.println(" %");
      
      lastReport = millis();
    }
  }

  unsigned long now = millis();
  if (now - lastSend >= sendInterval) {
    lastSend = now;

    // ---- Read DHT11 ----
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    bool dht_ok = !(isnan(h) || isnan(t));

    // ---- Read IR Sensor (Helmet Detection) ----
    int irStatus = digitalRead(IR_SENSOR_PIN);
    bool helmetWorn = (irStatus == LOW);  // LOW = helmet detected/worn

    // ---- Read Emergency Button ----
    int buttonState = digitalRead(EMERGENCY_PIN);
    bool emergencyPressed = (buttonState == LOW);  // LOW = button pressed
    
    // Note: Hardware emergency button does NOT activate buzzer
    // It only sends emergency status in JSON for app notification

    // ---- Read MQ-4 Gas Sensor ----
    gasLevel = readMQ4GasLevel();
    int gasDigital = digitalRead(MQ4_DIGITAL_PIN);  // Optional: threshold trigger
    String gasStatus = "safe";
    
    if (gasLevel >= GAS_DANGER_THRESHOLD) {
      gasStatus = "critical";
    } else if (gasLevel >= GAS_WARNING_THRESHOLD) {
      gasStatus = "danger";
    } else if (gasLevel >= GAS_SAFE_THRESHOLD) {
      gasStatus = "warning";
    }

    // ---- Build JSON String ----
    String json = "{";

    // Environment data
    json += "\"env\":{";
    if (dht_ok) {
      json += "\"temp\":" + String(t, 1) + ",";
      json += "\"hum\":" + String(h, 1);
    } else {
      json += "\"temp\":null,\"hum\":null";
    }
    json += "},";

    // Helmet detection
    json += "\"helmet\":{";
    json += "\"worn\":" + String(helmetWorn ? "true" : "false");
    json += "},";

    // MAX30100 pulse oximeter data
    json += "\"pulse\":{";
    json += "\"bpm\":" + String(heartRate, 1) + ",";
    json += "\"spo2\":" + String(spO2);
    json += "},";

    // MQ-4 gas sensor data
    json += "\"gas\":{";
    json += "\"ppm\":" + String(gasLevel) + ",";
    json += "\"raw\":" + String(gasAnalogRaw) + ",";
    json += "\"status\":\"" + gasStatus + "\"";
    json += "},";

    // Emergency status
    json += "\"emergency\":" + String(emergencyPressed ? "true" : "false");

    json += "}";

    // ---- Send via WebSocket ----
    webSocket.broadcastTXT(json);

    // Optional: Print to Serial Monitor for debugging
    Serial.println(json);
  }
}
