"""
Animation Generator Module - Local OpenCV Animations
Creates professional motion animations for mining safety videos using OpenCV
"""

from typing import List, Dict
from pathlib import Path
import sys
import os

# Add current directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

def generate_animations(scenes: List[Dict], image_paths: List[Path], config: Dict) -> List[Path]:
    """
    Generate animations for all scenes using local OpenCV processing

    Args:
        scenes: List of scene dictionaries
        image_paths: List of paths to generated images
        config: Configuration dictionary

    Returns:
        List of paths to generated animation videos
    """

    base_path = Path(__file__).parent.parent

    # Create animation prompts from scenes - enhanced for mining safety
    animation_prompts = []
    for scene in scenes:
        # Create descriptive prompts based on scene content
        base_action = scene.get('character_action', 'professional mining safety scene')
        scene_desc = scene.get('description', '')[:150]  # More context

        # Mining-specific prompts for better animation types
        if 'inspect' in base_action.lower() or 'check' in scene_desc.lower():
            prompt = f"miner inspecting equipment carefully, safety inspection procedure, {scene_desc}"
        elif 'walk' in base_action.lower() or 'move' in base_action.lower():
            prompt = f"miner walking through tunnel safely, proper movement in mine, {scene_desc}"
        elif 'emergency' in scene_desc.lower() or 'alert' in scene_desc.lower():
            prompt = f"emergency safety procedure demonstration, urgent safety action, {scene_desc}"
        elif 'equipment' in scene_desc.lower() or 'machinery' in scene_desc.lower():
            prompt = f"industrial mining equipment operation, machinery demonstration, {scene_desc}"
        else:
            prompt = f"{base_action}, mining safety training animation, professional camera movement, {scene_desc}"

        animation_prompts.append(prompt)

    try:
        # Use local OpenCV animations with enhanced motion
        print("🎬 Generating animations with local OpenCV processing...")
        from scripts.local_animatediff import generate_animations_batch

        animation_paths = generate_animations_batch(
            image_paths=[str(p) for p in image_paths],
            prompts=animation_prompts,
            config=config
        )

        print(f"✓ Generated {len(animation_paths)} motion animations")
        return [Path(p) for p in animation_paths]

    except Exception as e:
        print(f"❌ Animation generation failed: {e}")
        raise  # Re-raise to stop pipeline
