#!/usr/bin/env python3
"""
Test Firebase Video Generation
Quick test to verify Firebase integration works
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import load_config, setup_directories
from scripts.firebase_uploader import get_firebase_uploader

def test_firebase_connection():
    """Test Firebase connection and upload capability"""
    print("🔥 Testing Firebase Integration...")

    try:
        # Test Firebase uploader initialization
        uploader = get_firebase_uploader()
        print("✅ Firebase uploader initialized")

        # Test creating a simple video record
        test_video_data = {
            'videoId': 'test_video_001',
            'videoUrl': 'https://example.com/test-video.mp4',
            'thumbnailUrl': 'https://via.placeholder.com/320x180',
            'storagePath': 'videos/test_video_001.mp4',
            'fileSize': 1024000,  # 1MB
            'topic': 'Test Safety Video',
            'language': 'en'
        }

        # Create test record in Firestore
        video_id = uploader.create_video_record(test_video_data)
        print(f"✅ Test video record created: {video_id}")

        print("🎉 Firebase integration test PASSED!")
        return True

    except Exception as e:
        print(f"❌ Firebase integration test FAILED: {str(e)}")
        return False

def main():
    """Run Firebase integration test"""
    print("🧪 FIREBASE VIDEO GENERATION TEST")
    print("=" * 50)

    # Load config
    config = load_config()
    setup_directories(config)

    # Test Firebase
    success = test_firebase_connection()

    if success:
        print("\n✅ All tests passed! Firebase integration is working.")
        print("You can now generate videos that will be uploaded to Firebase Storage.")
    else:
        print("\n❌ Tests failed. Check your Firebase configuration.")
        sys.exit(1)

if __name__ == "__main__":
    main()