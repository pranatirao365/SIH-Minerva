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
 * - Emergency Push Button
 * - Buzzer (Active/Passive)
 * 
 * Pin Configuration:
 * - DHT11: DATA=GPIO4
 * - IR Sensor: DOUT=GPIO27
 * - MAX30100: SDA=GPIO21, SCL=GPIO22 (I2C)
 * - Emergency Button: GPIO14 (with internal pull-up)
 * - Buzzer: GPIO5 (Output)
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
  digitalWrite(BUZZER_PIN, LOW);  // Buzzer off initially
  Serial.println("✓ GPIO pins configured");
  Serial.println("✓ IR sensor initialized for helmet detection");
  Serial.println("✓ Buzzer initialized on GPIO5");

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

    // Emergency status
    json += "\"emergency\":" + String(emergencyPressed ? "true" : "false");

    json += "}";

    // ---- Send via WebSocket ----
    webSocket.broadcastTXT(json);

    // Optional: Print to Serial Monitor for debugging
    Serial.println(json);
  }
}
