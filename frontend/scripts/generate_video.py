"""
Automated Video Generation Wrapper
Executes video generation with pre-configured inputs
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import run_pipeline, load_config, setup_directories


def main():
    """Execute video generation with command line arguments"""
    
    if len(sys.argv) < 3:
        print("Usage: python generate_video.py <language_code> <topic>")
        print("Language codes: en, hi, te")
        sys.exit(1)
    
    language = sys.argv[1]
    topic = ' '.join(sys.argv[2:])  # Join all remaining args as topic
    
    # Validate language
    if language not in ['en', 'hi', 'te']:
        print(f"Invalid language: {language}")
        print("Supported languages: en (English), hi (Hindi), te (Telugu)")
        sys.exit(1)
    
    try:
        # Load config and setup
        config = load_config()
        setup_directories(config)
        
        print(f"Starting video generation:")
        print(f"  Topic: {topic}")
        print(f"  Language: {language}")
        print()
        
        # Run pipeline
        final_video = run_pipeline(topic, language, config)
        
        print("\n" + "="*60)
        print("✅ VIDEO GENERATION COMPLETE!")
        print("="*60)
        print(f"Output: {final_video}")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
