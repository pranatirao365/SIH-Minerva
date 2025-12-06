"""
Test client for DeepCrack Segmentation API
"""

import requests
import base64
import cv2
import numpy as np
from pathlib import Path
from io import BytesIO
from PIL import Image


def base64_to_image(base64_string: str) -> np.ndarray:
    """Convert base64 string to OpenCV image"""
    img_data = base64.b64decode(base64_string)
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img


def test_health(base_url: str = "http://localhost:8000"):
    """Test health endpoint"""
    print("=" * 60)
    print("Testing Health Endpoint")
    print("=" * 60)
    
    response = requests.get(f"{base_url}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    print()


def test_predict(image_path: str, base_url: str = "http://localhost:8000", save_outputs: bool = True):
    """Test basic prediction endpoint"""
    print("=" * 60)
    print("Testing Prediction Endpoint")
    print("=" * 60)
    
    # Check if image exists
    if not Path(image_path).exists():
        print(f"Error: Image file '{image_path}' not found!")
        return
    
    # Upload image
    with open(image_path, 'rb') as f:
        files = {'file': (Path(image_path).name, f, 'image/jpeg')}
        response = requests.post(f"{base_url}/predict", files=files)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        
        print(f"Success: {result['success']}")
        print(f"Message: {result['message']}")
        print(f"Severity: {result['severity_label']} ({result['severity_percentage']:.2f}%)")
        print(f"Confidence: {result['crack_confidence']:.4f}")
        
        if save_outputs:
            # Save fused mask
            fused_img = base64_to_image(result['fused_mask'])
            cv2.imwrite('output_fused_mask.png', fused_img)
            print("✓ Saved: output_fused_mask.png")
            
            # Save binary mask
            binary_img = base64_to_image(result['binary_mask'])
            cv2.imwrite('output_binary_mask.png', binary_img)
            print("✓ Saved: output_binary_mask.png")
            
            # Save side outputs
            for i in range(1, 6):
                side_key = f'side{i}'
                if side_key in result and result[side_key]:
                    side_img = base64_to_image(result[side_key])
                    cv2.imwrite(f'output_side{i}.png', side_img)
                    print(f"✓ Saved: output_side{i}.png")
            
            print(f"\nAll outputs saved successfully!")
    else:
        print(f"Error: {response.text}")
    
    print()


def test_predict_with_contours(image_path: str, base_url: str = "http://localhost:8000", save_outputs: bool = True):
    """Test prediction with contours endpoint"""
    print("=" * 60)
    print("Testing Prediction with Contours Endpoint")
    print("=" * 60)
    
    # Check if image exists
    if not Path(image_path).exists():
        print(f"Error: Image file '{image_path}' not found!")
        return
    
    # Upload image
    with open(image_path, 'rb') as f:
        files = {'file': (Path(image_path).name, f, 'image/jpeg')}
        response = requests.post(f"{base_url}/predict_with_contours", files=files)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        
        print(f"Success: {result['success']}")
        print(f"Message: {result['message']}")
        print(f"Severity: {result['severity_label']} ({result['severity_percentage']:.2f}%)")
        print(f"Confidence: {result['crack_confidence']:.4f}")
        
        if save_outputs:
            # Save fused mask
            fused_img = base64_to_image(result['fused_mask'])
            cv2.imwrite('output_contour_fused.png', fused_img)
            print("✓ Saved: output_contour_fused.png")
            
            # Save contour visualization
            contour_img = base64_to_image(result['contour_visualization'])
            cv2.imwrite('output_contour_visualization.png', contour_img)
            print("✓ Saved: output_contour_visualization.png")
            
            # Save binary mask
            binary_img = base64_to_image(result['binary_mask'])
            cv2.imwrite('output_contour_binary.png', binary_img)
            print("✓ Saved: output_contour_binary.png")
            
            print(f"\nAll outputs saved successfully!")
    else:
        print(f"Error: {response.text}")
    
    print()


def create_side_by_side_comparison(image_path: str):
    """Create a side-by-side comparison of all outputs"""
    print("=" * 60)
    print("Creating Side-by-Side Comparison")
    print("=" * 60)
    
    try:
        # Load original image
        original = cv2.imread(image_path)
        original = cv2.resize(original, (256, 256))
        
        # Load outputs
        fused = cv2.imread('output_fused_mask.png')
        binary = cv2.imread('output_binary_mask.png')
        
        # Create comparison grid
        row1 = np.hstack([original, fused, binary])
        
        # Try to load side outputs
        sides = []
        for i in range(1, 6):
            side_path = f'output_side{i}.png'
            if Path(side_path).exists():
                side_img = cv2.imread(side_path)
                sides.append(side_img)
        
        if len(sides) == 5:
            row2 = np.hstack(sides)
            comparison = np.vstack([row1, row2])
        else:
            comparison = row1
        
        cv2.imwrite('output_comparison.png', comparison)
        print("✓ Saved: output_comparison.png")
        print()
    except Exception as e:
        print(f"Error creating comparison: {str(e)}")
        print()


if __name__ == "__main__":
    # Configuration
    BASE_URL = "http://localhost:8000"
    IMAGE_PATH = "test.jpg"  # Change this to your test image path
    
    print("\n" + "=" * 60)
    print("DeepCrack Segmentation API Test Client")
    print("=" * 60 + "\n")
    
    # Test health endpoint
    test_health(BASE_URL)
    
    # Test basic prediction
    test_predict(IMAGE_PATH, BASE_URL, save_outputs=True)
    
    # Test prediction with contours
    test_predict_with_contours(IMAGE_PATH, BASE_URL, save_outputs=True)
    
    # Create comparison
    if Path(IMAGE_PATH).exists():
        create_side_by_side_comparison(IMAGE_PATH)
    
    print("=" * 60)
    print("All tests completed!")
    print("=" * 60)
