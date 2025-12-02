"""
Firebase Storage Uploader Module
Handles uploading generated content directly to Firebase Storage
"""

import os
import json
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore, storage

class FirebaseUploader:
    """Handles uploading files directly to Firebase Storage"""

    def __init__(self):
        """Initialize Firebase connection"""
        try:
            # Check if Firebase is already initialized
            if not firebase_admin._apps:
                # Try to initialize with service account key
                cred_path = os.path.join(os.path.dirname(__file__), '..', 'firebase-service-account.json')
                if os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred, {
                        'storageBucket': 'sihtut-1.firebasestorage.app'
                    })
                    print("🔥 Firebase initialized with service account key")
                else:
                    # Fallback to environment variables (less secure but works for development)
                    print("⚠️  No service account key found at:", cred_path)
                    print("   Expected path:", os.path.abspath(cred_path))
                    print("   For production, ensure firebase-service-account.json exists")
                    raise FileNotFoundError("Firebase service account key not found")

            self.db = firestore.client()
            self.bucket = storage.bucket()
            print("✅ Firebase uploader initialized successfully")

            # Ensure videos collection exists by creating a test document temporarily
            self._ensure_collections_exist()

        except Exception as e:
            print(f"❌ Firebase initialization failed: {e}")
            print("🔧 Falling back to mock mode for development")
            self.db = None
            self.bucket = None
            self.mock_mode = True

    def _ensure_collections_exist(self):
        """Ensure required Firestore collections exist by creating them if needed"""
        try:
            # Create a temporary document to ensure the videos collection exists
            temp_doc_ref = self.db.collection('videos').document('_temp_init_doc')
            temp_doc_ref.set({
                '_init': True,
                'createdAt': datetime.now().isoformat(),
                'purpose': 'Initialize videos collection'
            })

            # Immediately delete the temp document
            temp_doc_ref.delete()
            print("📁 Ensured 'videos' collection exists in Firestore")

        except Exception as e:
            print(f"⚠️  Could not ensure collections exist: {e}")
            # This is not critical, continue with upload

    def upload_file(self, local_path: str, storage_path: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Upload file to Firebase Storage
        """
        if self.bucket is None:
            # Mock mode
            mock_url = f"https://firebasestorage.googleapis.com/v0/b/sihtut-1.firebasestorage.app/o/{storage_path.replace('/', '%2F')}?alt=media"
            print(f"📤 Mock upload: {local_path} -> {storage_path}")
            print(f"🔗 Mock URL: {mock_url}")
            return mock_url

        try:
            # Upload to Firebase Storage
            blob = self.bucket.blob(storage_path)

            # Set metadata if provided
            if metadata:
                blob.metadata = metadata

            # Upload the file
            blob.upload_from_filename(local_path)

            # Make the file publicly accessible
            blob.make_public()

            print(f"📤 Uploaded: {local_path} -> {storage_path}")
            print(f"🔗 Public URL: {blob.public_url}")

            return blob.public_url

        except Exception as e:
            print(f"❌ Upload failed: {e}")
            raise

    def upload_video(self, local_video_path: str, video_id: str, topic: str, language: str) -> Dict[str, Any]:
        """
        Upload video to Firebase Storage and return metadata
        """
        print(f"🎬 Uploading video: {video_id} - {topic}")

        # Create storage path
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        storage_path = f"videos/{video_id}_{timestamp}.mp4"

        # Get file size
        file_size = os.path.getsize(local_video_path)

        # Upload video
        video_url = self.upload_file(local_video_path, storage_path, {
            'contentType': 'video/mp4',
            'metadata': {
                'videoId': video_id,
                'topic': topic,
                'language': language,
                'uploadedAt': datetime.now().isoformat()
            }
        })

        # Generate thumbnail URL (placeholder for now)
        thumbnail_url = f"https://via.placeholder.com/320x180/000000/FFFFFF?text={topic.replace(' ', '+')}"

        return {
            'videoId': video_id,
            'videoUrl': video_url,
            'thumbnailUrl': thumbnail_url,
            'storagePath': storage_path,
            'fileSize': file_size,
            'topic': topic,
            'language': language,
            'uploadedAt': datetime.now().isoformat()
        }

    def create_video_record(self, video_data: Dict[str, Any], created_by: str = 'system') -> str:
        """
        Create a record in Firestore database
        """
        if self.db is None:
            # Mock mode
            print(f"📝 Mock Firestore record: {video_data['videoId']}")
            print(f"   Topic: {video_data['topic']}")
            print(f"   Language: {video_data['language']}")
            print(f"   Size: {video_data['fileSize']} bytes")
            return video_data['videoId']

        try:
            # Create video record in Firestore
            video_ref = self.db.collection('videos').document(video_data['videoId'])

            record_data = {
                'videoId': video_data['videoId'],
                'videoUrl': video_data['videoUrl'],
                'thumbnailUrl': video_data.get('thumbnailUrl'),
                'storagePath': video_data['storagePath'],
                'fileSize': video_data['fileSize'],
                'topic': video_data['topic'],
                'language': video_data['language'],
                'uploadedAt': video_data['uploadedAt'],
                'createdBy': created_by,
                'status': 'completed',
                'viewCount': 0,
                'downloadCount': 0
            }

            video_ref.set(record_data)

            print(f"📝 Created Firestore record: {video_data['videoId']}")
            print(f"   Collection: videos")
            print(f"   Document ID: {video_data['videoId']}")

            return video_data['videoId']

        except Exception as e:
            print(f"❌ Failed to create Firestore record: {e}")
            raise

    def cleanup_local_file(self, file_path: str):
        """Remove local file after successful upload"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"🗑️  Cleaned up local file: {file_path}")
        except Exception as e:
            print(f"⚠️  Could not remove local file {file_path}: {str(e)}")


# Global uploader instance
_uploader = None

def get_firebase_uploader() -> FirebaseUploader:
    """Get or create Firebase uploader instance"""
    global _uploader
    if _uploader is None:
        _uploader = FirebaseUploader()
    return _uploader