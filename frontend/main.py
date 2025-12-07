"""
AI Video Generation Pipeline for Mining Safety Training
Main orchestration script that coordinates all pipeline stages
"""

import os
import json
import sys
from pathlib import Path
from datetime import datetime

# Fix Windows console encoding for Unicode characters
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("[WARNING] python-dotenv not installed, using system environment variables only")

# Import pipeline modules
from scripts.script_generator import generate_scene_breakdown
from scripts.image_generator import generate_images
from scripts.animation_generator import generate_animations
from scripts.voiceover_generator import generate_voiceovers
from scripts.video_assembler import assemble_final_video


def load_config():
    """Load configuration from config.json"""
    config_path = Path(__file__).parent / "config.json"
    with open(config_path, 'r') as f:
        return json.load(f)


def setup_directories(config):
    """Create all required directories if they don't exist"""
    base_path = Path(__file__).parent
    
    directories = [
        config['paths']['scripts'],
        config['paths']['images'],
        config['paths']['animations'],
        config['paths']['icons'],
        config['paths']['audio'],
        config['paths']['output']
    ]
    
    for directory in directories:
        dir_path = base_path / directory
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"[OK] Directory ready: {directory}/")


def get_language_choice():
    """Get language selection from user"""
    print("\n" + "="*60)
    print("SELECT LANGUAGE / भाषा चुनें / భాష ఎంచుకోండి")
    print("="*60)
    print("\n1. English")
    print("2. हिंदी (Hindi)")
    print("3. తెలుగు (Telugu)")
    print("="*60)
    
    while True:
        choice = input("\nEnter language choice (1-3): ").strip()
        if choice in ['1', '2', '3']:
            lang_map = {'1': 'en', '2': 'hi', '3': 'te'}
            lang_names = {'1': 'English', '2': 'Hindi', '3': 'Telugu'}
            selected_lang = lang_map[choice]
            print(f"[OK] Language selected: {lang_names[choice]}")
            return selected_lang
        print("[ERROR] Invalid choice. Please enter 1, 2, or 3.")


def get_user_topic():
    """Get mining safety topic from user input"""
    print("\n" + "="*60)
    print("AI MINING SAFETY VIDEO GENERATOR")
    print("="*60)
    print("\nExamples:")
    print("  - PPE Safety in Mines")
    print("  - Gas Leak Protocol")
    print("  - Hazard Detection Underground")
    print("  - Emergency Exit Procedure")
    print("  - Proper Ventilation Systems")
    print("="*60)
    
    topic = input("\nEnter the mining topic for the video: ").strip()
    
    if not topic:
        print("[ERROR] Topic cannot be empty!")
        sys.exit(1)
    
    print(f"\n[OK] Topic selected: '{topic}'")
    return topic


def save_scene_data(scenes, topic):
    """Save scene breakdown to JSON file"""
    base_path = Path(__file__).parent
    scripts_dir = base_path / "scripts"
    
    output_data = {
        "topic": topic,
        "generated_at": datetime.now().isoformat(),
        "scenes": scenes
    }
    
    output_path = scripts_dir / "scene_breakdown.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"[OK] Scene breakdown saved to: {output_path}")
    return output_path


def run_pipeline(topic, language, config):
    """Execute the complete video generation pipeline"""
    
    print("\n" + "="*60)
    print("PIPELINE EXECUTION")
    print("="*60)
    
    # Stage 1: Scene Breakdown
    print("\n[1/5] Generating scene breakdown...")
    scenes, compliance_report = generate_scene_breakdown(topic, config, language)
    scene_file = save_scene_data(scenes, topic)
    print(f"[OK] Generated {len(scenes)} scenes")
    
    # Stage 2: Image Generation
    print("\n[2/5] Generating character images and environments...")
    image_paths = generate_images(scenes, topic, config)
    print(f"[OK] Generated {len(image_paths)} images")
    
    # Stage 3: Animation Generation
    print("\n[3/5] Generating animations...")
    animation_paths = generate_animations(scenes, image_paths, config)
    print(f"[OK] Generated {len(animation_paths)} animations")
    
    # Stage 4: Voiceover Generation
    print("\n[4/5] Generating voiceovers...")
    audio_paths = generate_voiceovers(scenes, config, language)
    print(f"[OK] Generated {len(audio_paths)} voiceover clips")
    
    # Stage 5: Video Assembly
    print("\n[5/5] Assembling final video...")
    final_video_path = assemble_final_video(
        scenes=scenes,
        animation_paths=animation_paths,
        audio_paths=audio_paths,
        topic=topic,
        language=language,
        config=config
    )
    print(f"[OK] Final video saved to: {final_video_path}")
    
    return final_video_path


def main():
    """Main entry point"""
    try:
        # Load configuration
        config = load_config()
        
        # Setup directories
        setup_directories(config)
        
        # Get language choice
        language = get_language_choice()
        
        # Get user input
        topic = get_user_topic()
        
        # Run pipeline
        final_video = run_pipeline(topic, language, config)
        
        # Success message
        print("\n" + "="*60)
        print("[SUCCESS] VIDEO GENERATION COMPLETE!")
        print("="*60)
        print(f"\nTopic: {topic}")
        print(f"Output: {final_video}")
        print("\nYour mining safety training video is ready!")
        print("="*60 + "\n")
        
    except KeyboardInterrupt:
        print("\n\n[ERROR] Pipeline interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n[ERROR] Pipeline error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
