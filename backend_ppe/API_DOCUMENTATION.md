# PPE Detection API - Department-Based Documentation

## Overview
The PPE Detection API now supports department-specific PPE requirements. Each department has different PPE sets based on the work environment and risk level.

## Base URL
```
http://localhost:8000
```

## Endpoints

### 1. Health Check
**GET /** 

Check if the API is running and view model information.

**Response:**
```json
{
  "status": "running",
  "message": "PPE Detection API is online",
  "endpoint": "/ppe-scan",
  "model_classes": {...}
}
```

---

### 2. Get Departments
**GET /departments**

List all available departments and their PPE requirements.

**Response:**
```json
{
  "departments": {
    "mining_operations": {
      "available_sets": ["set_a_basic", "set_b_dust_drilling"],
      "ppe_requirements": {
        "set_a_basic": ["helmet", "gloves", "vest", "eye_protection", "safety_boots"],
        "set_b_dust_drilling": ["helmet", "gloves", "vest", "eye_protection", "safety_boots", "protective_suit"]
      }
    },
    "blasting": {...},
    "equipment_maintenance": {...},
    "safety_inspection": {...}
  },
  "total_departments": 4
}
```

---

### 3. PPE Scan (Department-Specific)
**POST /ppe-scan**

Scan an image for PPE compliance based on department requirements.

**Request:**
- Content-Type: `multipart/form-data`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | Yes | Image file to scan |
| `department` | String | Yes | Department name (see available departments) |
| `ppe_set` | String | No | Specific PPE set (defaults to first set if omitted) |

**Valid Departments:**
- `mining_operations`
- `blasting`
- `equipment_maintenance`
- `safety_inspection`

**Example Request (cURL):**
```bash
curl -X POST "http://localhost:8000/ppe-scan" \
  -F "file=@worker_photo.jpg" \
  -F "department=mining_operations" \
  -F "ppe_set=set_a_basic"
```

**Example Request (JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('department', 'mining_operations');
formData.append('ppe_set', 'set_a_basic');

const response = await fetch('http://localhost:8000/ppe-scan', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

**Response:**
```json
{
  "department": "mining_operations",
  "ppe_set": "set_a_basic",
  "ppe_items": {
    "helmet": {
      "required": true,
      "present": true
    },
    "gloves": {
      "required": true,
      "present": false
    },
    "vest": {
      "required": true,
      "present": true
    },
    "eye_protection": {
      "required": true,
      "present": true
    },
    "safety_boots": {
      "required": true,
      "present": true
    }
  },
  "compliance": {
    "is_compliant": false,
    "percentage": 80.0,
    "items_present": 4,
    "items_required": 5
  }
}
```

---

## Department PPE Requirements

### 1. Mining Operations
#### Set A - Basic
- Helmet
- Gloves
- Vest
- Eye Protection
- Safety Boots

#### Set B - Dust/Drilling
- All items from Set A
- **+ Protective Suit**

---

### 2. Blasting
#### Set A - Mandatory
- Helmet
- Gloves
- Vest
- Eye Protection
- Safety Boots

#### Set B - Full Protection
- All items from Set A
- **+ Protective Suit**

---

### 3. Equipment Maintenance
#### Set A - Standard
- Helmet
- Gloves
- Eye Protection
- Safety Boots

#### Set B - Chemical/Oil
- All items from Set A
- **+ Protective Suit**
- **+ Vest**

---

### 4. Safety Inspection
#### Set A - Inspection
- Helmet
- Vest
- Safety Boots

#### Set B - Risky Zone
- All items from Set A
- **+ Eye Protection**
- **+ Gloves**

---

## Integration with Admin System

When an admin assigns a miner to a department, store the department name in the miner's profile. When performing a PPE scan:

1. **Retrieve miner's department** from the database
2. **Call the /ppe-scan endpoint** with:
   - The captured image
   - The miner's assigned department
   - (Optional) Specific PPE set if required

**Example Flow:**
```javascript
// 1. Get miner info from database
const miner = await getMinerById(minerId);
const department = miner.department; // e.g., "mining_operations"

// 2. Perform PPE scan
const formData = new FormData();
formData.append('file', capturedImage);
formData.append('department', department);

const result = await fetch('http://localhost:8000/ppe-scan', {
  method: 'POST',
  body: formData
});

const scanResult = await result.json();

// 3. Check compliance
if (scanResult.compliance.is_compliant) {
  console.log('✅ Miner is PPE compliant');
} else {
  console.log(`⚠️ Compliance: ${scanResult.compliance.percentage}%`);
  console.log('Missing items:', 
    Object.entries(scanResult.ppe_items)
      .filter(([_, item]) => !item.present)
      .map(([name]) => name)
  );
}
```

---

## Error Responses

### Invalid Department
```json
{
  "detail": "Invalid department. Valid departments: mining_operations, blasting, equipment_maintenance, safety_inspection"
}
```

### Invalid PPE Set
```json
{
  "detail": "Invalid PPE set for mining_operations. Valid sets: set_a_basic, set_b_dust_drilling"
}
```

### Invalid File Type
```json
{
  "detail": "Invalid file type. Please upload an image file."
}
```

---

## Running the API

```bash
# Navigate to backend_ppe directory
cd backend_ppe

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

Server will start on `http://0.0.0.0:8000`

---

## Testing the API

You can test the API using the provided test script or any HTTP client:

```bash
# Test with cURL
curl -X POST "http://localhost:8000/ppe-scan" \
  -F "file=@test_image.jpg" \
  -F "department=mining_operations"

# View available departments
curl http://localhost:8000/departments
```
