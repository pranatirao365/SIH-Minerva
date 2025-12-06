"""
Voiceover Generator Module
Generates voiceover audio using ElevenLabs TTS or Google Cloud TTS
"""

import os
from typing import List, Dict
from pathlib import Path
import requests


def configure_voiceover_api(config: Dict) -> tuple[str, str]:
    """Get API key and provider from config"""
    provider = config['models']['voiceover']['provider']
    
    if provider == 'google_cloud_tts':
        api_key = config['models']['voiceover']['api_key']
        if not api_key:
            raise ValueError("Google Cloud TTS API key not found in config.")
    elif provider == 'elevenlabs':
        api_key_env = config['models']['voiceover']['api_key_env']
        api_key = os.getenv(api_key_env)
        if not api_key:
            raise ValueError(
                f"API key not found. Please set {api_key_env} environment variable."
            )
    else:
        raise ValueError(f"Unsupported voiceover provider: {provider}")
    
    return api_key, provider


def generate_voiceover_google(text: str, api_key: str, config: Dict, output_path: Path, language: str = 'en') -> Path:
    """Generate voiceover using Google Cloud Text-to-Speech API"""
    
    # Select voice based on language
    if language == 'hi':
        voice_name = config['models']['voiceover'].get('voice_name_hindi', 'hi-IN-Neural2-D')
        language_code = 'hi-IN'
    elif language == 'te':
        voice_name = config['models']['voiceover'].get('voice_name_telugu', 'te-IN-Standard-A')
        language_code = 'te-IN'
    else:
        voice_name = config['models']['voiceover'].get('voice_name', 'en-US-Neural2-D')
        language_code = config['models']['voiceover'].get('language_code', 'en-US')
    
    url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={api_key}"
    
    data = {
        "input": {
            "text": text
        },
        "voice": {
            "languageCode": language_code,
            "name": voice_name
        },
        "audioConfig": {
            "audioEncoding": config['models']['voiceover'].get('audio_encoding', 'MP3'),
            "speakingRate": config['models']['voiceover'].get('speaking_rate', 1.0),
            "pitch": config['models']['voiceover'].get('pitch', 0.0)
        }
    }
    
    response = requests.post(url, json=data)
    
    if response.status_code != 200:
        raise Exception(f"Google TTS API error: {response.status_code} - {response.text}")
    
    # Decode base64 audio content
    import base64
    audio_content = response.json()['audioContent']
    audio_data = base64.b64decode(audio_content)
    
    # Save audio
    with open(output_path, 'wb') as f:
        f.write(audio_data)
    
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
    
    # Try to get API key and provider
    try:
        api_key, provider = configure_voiceover_api(config)
        use_api = True
        print(f"   🎤 Using {provider} API")
    except ValueError as e:
        use_api = False
        provider = None
        print(f"   ⚠️  {e}, using offline TTS")
    
    for i, scene in enumerate(scenes, 1):
        # Choose extension based on provider
        if use_api and provider == 'google_cloud_tts':
            ext = 'mp3'
        else:
            ext = 'wav'
        output_path = audio_dir / f"scene_{scene['scene_number']:02d}.{ext}"
        voiceover_text = scene.get('voiceover_line', '')
        
        if not voiceover_text:
            print(f"   [{i}/{len(scenes)}] No voiceover for scene {scene['scene_number']}, skipping")
            continue
        
        print(f"   [{i}/{len(scenes)}] Generating voiceover for scene {scene['scene_number']}...")
        print(f"       Text: {voiceover_text[:60]}...")
        
        try:
            if use_api:
                if provider == 'google_cloud_tts':
                    generate_voiceover_google(voiceover_text, api_key, config, output_path, language)
                elif provider == 'elevenlabs':
                    generate_voiceover_elevenlabs(voiceover_text, api_key, config, output_path, language)
                else:
                    raise ValueError(f"Unsupported provider: {provider}")
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
