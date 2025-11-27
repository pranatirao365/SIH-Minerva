"""
Voiceover Generator Module
Generates voiceover audio using ElevenLabs TTS
"""

import os
from typing import List, Dict
from pathlib import Path
import requests


def configure_elevenlabs_api(config: Dict) -> str:
    """Get ElevenLabs API key from environment"""
    api_key = os.getenv(config['models']['voiceover']['api_key_env'])
    
    if not api_key:
        raise ValueError(
            f"API key not found. Please set "
            f"{config['models']['voiceover']['api_key_env']} environment variable."
        )
    
    return api_key


def generate_voiceover_elevenlabs(text: str, api_key: str, config: Dict, output_path: Path, language: str = 'en') -> Path:
    """Generate voiceover using ElevenLabs API with language-specific voices"""
    
    # Select voice based on language
    if language == 'hi':
        voice_id = config['models']['voiceover'].get('voice_id_hindi', config['models']['voiceover']['voice_id'])
    elif language == 'te':
        voice_id = config['models']['voiceover'].get('voice_id_telugu', config['models']['voiceover']['voice_id'])
    else:
        voice_id = config['models']['voiceover']['voice_id']
    
    # Use multilingual model for better language support
    model_id = config['models']['voiceover']['model']
    
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key
    }
    
    data = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "stability": config['models']['voiceover']['stability'],
            "similarity_boost": config['models']['voiceover']['similarity_boost']
        }
    }
    
    # Add language specification for multilingual model
    if language != 'en':
        data["model_id"] = "eleven_multilingual_v2"
    
    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code != 200:
        raise Exception(f"ElevenLabs API error: {response.status_code} - {response.text}")
    
    # Save audio
    with open(output_path, 'wb') as f:
        f.write(response.content)
    
    return output_path


def generate_mock_voiceover(text: str, output_path: Path, config: Dict) -> Path:
    """Generate mock voiceover using pyttsx3 (offline TTS)"""
    
    try:
        import pyttsx3
        
        # Initialize TTS engine
        engine = pyttsx3.init()
        
        # Set properties
        engine.setProperty('rate', 150)  # Speed of speech
        engine.setProperty('volume', 1.0)  # Volume (0.0 to 1.0)
        
        # Try to set a professional voice
        voices = engine.getProperty('voices')
        # Prefer male voice for professional training content
        for voice in voices:
            if 'david' in voice.name.lower() or 'mark' in voice.name.lower():
                engine.setProperty('voice', voice.id)
                break
        
        # Save to file
        engine.save_to_file(text, str(output_path))
        engine.runAndWait()
        
    except Exception as e:
        print(f"       Warning: pyttsx3 failed ({e}), creating silent audio")
        # Create silent audio as fallback
        from scipy.io import wavfile
        import numpy as np
        
        # Estimate duration based on text length (rough estimate: 150 words per minute)
        words = len(text.split())
        duration = max(2, int((words / 150) * 60))  # Minimum 2 seconds
        
        sample_rate = 44100
        samples = np.zeros(int(sample_rate * duration), dtype=np.int16)
        wavfile.write(str(output_path), sample_rate, samples)
    
    return output_path


def generate_voiceovers(scenes: List[Dict], config: Dict, language: str = 'en') -> List[Path]:
    """
    Generate voiceover audio for all scenes
    
    Args:
        scenes: List of scene dictionaries
        config: Configuration dictionary
        language: Language code ('en', 'hi', 'te')
        
    Returns:
        List of paths to generated audio files
    """
    
    base_path = Path(__file__).parent.parent
    audio_dir = base_path / config['paths']['audio']
    audio_dir.mkdir(parents=True, exist_ok=True)
    
    audio_paths = []
    
    lang_names = {'en': 'English', 'hi': 'Hindi', 'te': 'Telugu'}
    print(f"   🌐 Voiceover language: {lang_names.get(language, 'English')}")
    
    # Try to get API key, fall back to mock generation
    try:
        api_key = configure_elevenlabs_api(config)
        use_api = True
        print(f"   🎤 Using ElevenLabs API")
    except ValueError:
        use_api = False
        print(f"   ⚠️  No API key found, using offline TTS")
    
    for i, scene in enumerate(scenes, 1):
        output_path = audio_dir / f"scene_{scene['scene_number']:02d}.wav"
        voiceover_text = scene.get('voiceover_line', '')
        
        if not voiceover_text:
            print(f"   [{i}/{len(scenes)}] No voiceover for scene {scene['scene_number']}, skipping")
            continue
        
        print(f"   [{i}/{len(scenes)}] Generating voiceover for scene {scene['scene_number']}...")
        print(f"       Text: {voiceover_text[:60]}...")
        
        try:
            if use_api:
                generate_voiceover_elevenlabs(voiceover_text, api_key, config, output_path, language)
            else:
                generate_mock_voiceover(voiceover_text, output_path, config)
            
            audio_paths.append(output_path)
            print(f"       ✓ Saved: {output_path.name}")
            
        except Exception as e:
            print(f"       ⚠️  Error generating voiceover: {e}")
            # Fall back to mock voiceover
            try:
                generate_mock_voiceover(voiceover_text, output_path, config)
                audio_paths.append(output_path)
                print(f"       ✓ Saved mock voiceover: {output_path.name}")
            except Exception as e2:
                print(f"       ❌ Failed to generate voiceover: {e2}")
                # Create empty placeholder
                audio_paths.append(None)
    
    return audio_paths
