"""
Test script for department-based PPE detection API
"""
import sys

import requests

API_URL = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing health check...")
    response = requests.get(f"{API_URL}/")
    if response.status_code == 200:
        print("✅ Health check passed")
        print(f"   Status: {response.json()['status']}")
    else:
        print(f"❌ Health check failed: {response.status_code}")
    print()

def test_get_departments():
    """Test the departments listing endpoint"""
    print("🔍 Testing departments endpoint...")
    response = requests.get(f"{API_URL}/departments")
    if response.status_code == 200:
        data = response.json()
        print("✅ Departments retrieved successfully")
        print(f"   Total departments: {data['total_departments']}")
        for dept, info in data['departments'].items():
            print(f"\n   📁 {dept}:")
            for set_name in info['available_sets']:
                ppe_items = info['ppe_requirements'][set_name]
                print(f"      • {set_name}: {', '.join(ppe_items)}")
    else:
        print(f"❌ Failed to get departments: {response.status_code}")
    print()

def test_ppe_scan(image_path, department, ppe_set=None):
    """Test PPE scan with a specific department"""
    print(f"🔍 Testing PPE scan for {department}" + (f" ({ppe_set})" if ppe_set else ""))
    
    try:
        with open(image_path, 'rb') as f:
            files = {'file': f}
            data = {'department': department}
            if ppe_set:
                data['ppe_set'] = ppe_set
            
            response = requests.post(f"{API_URL}/ppe-scan", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print("✅ PPE scan completed")
                print(f"   Department: {result['department']}")
                print(f"   PPE Set: {result['ppe_set']}")
                print(f"   Compliance: {result['compliance']['percentage']}% " +
                      f"({result['compliance']['items_present']}/{result['compliance']['items_required']})")
                
                print("\n   PPE Items:")
                for item_name, item_data in result['ppe_items'].items():
                    status = "✓ Present" if item_data['present'] else "✗ Missing"
                    print(f"      • {item_name}: {status}")
                
                if result['compliance']['is_compliant']:
                    print("\n   🎉 Worker is FULLY COMPLIANT!")
                else:
                    print(f"\n   ⚠️  Worker is NOT compliant ({result['compliance']['percentage']}%)")
            else:
                print(f"❌ PPE scan failed: {response.status_code}")
                print(f"   Error: {response.json().get('detail', 'Unknown error')}")
    except FileNotFoundError:
        print(f"❌ Image file not found: {image_path}")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API. Is the server running?")
    print()

def main():
    """Run all tests"""
    print("=" * 60)
    print("PPE Detection API - Department-Based Testing")
    print("=" * 60)
    print()
    
    # Test 1: Health check
    try:
        test_health_check()
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API. Please ensure the server is running:")
        print("   cd backend_ppe")
        print("   python main.py")
        sys.exit(1)
    
    # Test 2: Get departments
    test_get_departments()
    
    # Test 3: PPE scan examples
    # Note: Replace 'test_image.jpg' with an actual image path
    print("=" * 60)
    print("PPE Scan Examples (requires test image)")
    print("=" * 60)
    print()
    
    image_path = "test_image.jpg"
    
    print("Example 1: Mining Operations - Basic")
    print("   To test: test_ppe_scan('your_image.jpg', 'mining_operations', 'set_a_basic')")
    print()
    
    print("Example 2: Blasting - Full Protection")
    print("   To test: test_ppe_scan('your_image.jpg', 'blasting', 'set_b_full_protection')")
    print()
    
    print("Example 3: Equipment Maintenance - Standard")
    print("   To test: test_ppe_scan('your_image.jpg', 'equipment_maintenance', 'set_a_standard')")
    print()
    
    print("Example 4: Safety Inspection - Risky Zone")
    print("   To test: test_ppe_scan('your_image.jpg', 'safety_inspection', 'set_b_risky_zone')")
    print()
    
    print("=" * 60)
    print("✨ Basic tests completed!")
    print("=" * 60)

if __name__ == "__main__":
    main()
