"""
Image Generator Module
Generates character images and mining environments using Hugging Face Router API
"""

import os
import io
from typing import List, Dict
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from scripts.hf_image_client import generate_image


def create_fallback_image(scene: Dict, output_path: Path) -> None:
    """Create a simple fallback image when API fails"""
    # Create a 1080x1080 image with mining colors (dark background) - matches video aspect ratio
    img = Image.new('RGB', (1080, 1080), color='#1a1a1a')
    draw = ImageDraw.Draw(img)

    # Add a gradient background
    for y in range(1080):
        for x in range(1080):
            # Create mining tunnel effect
            distance_from_center = abs(x - 540) + abs(y - 540)
            brightness = max(20, min(80, 60 - distance_from_center // 20))
            img.putpixel((x, y), (brightness, brightness, max(brightness-10, 0)))

    # Try to load a font
    try:
        font_large = ImageFont.truetype("arial.ttf", 48)  # Scaled up for higher resolution
        font_small = ImageFont.truetype("arial.ttf", 32)  # Scaled up for higher resolution
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()

    # Add scene information
    scene_title = f"Scene {scene['scene_number']}"
    scene_desc = scene.get('scene_description', 'Mining safety scene')
    topic_text = scene_desc[:80] + "..." if len(scene_desc) > 80 else scene_desc  # More characters for larger image
    fallback_notice = "API UNAVAILABLE - FALLBACK IMAGE"

    # Center the text
    bbox = draw.textbbox((0, 0), scene_title, font=font_large)
    text_width = bbox[2] - bbox[0]
    draw.text(((1080 - text_width) // 2, 360), scene_title, fill='white', font=font_large)

    bbox = draw.textbbox((0, 0), topic_text, font=font_small)
    text_width = bbox[2] - bbox[0]
    draw.text(((1080 - text_width) // 2, 440), topic_text, fill='yellow', font=font_small)

    bbox = draw.textbbox((0, 0), fallback_notice, font=font_small)
    text_width = bbox[2] - bbox[0]
    draw.text(((1080 - text_width) // 2, 900), fallback_notice, fill='red', font=font_small)

    # Add some mining-themed elements - scaled for 1080x1080
    # Draw a simple hard hat silhouette
    draw.ellipse([400, 600, 500, 700], fill='#FFD700', outline='black', width=4)
    draw.rectangle([420, 680, 480, 720], fill='#FFD700')

    # Draw a simple pickaxe
    draw.line([600, 640, 700, 740], fill='#8B4513', width=8)
    draw.line([640, 660, 660, 640], fill='#8B4513', width=6)
    draw.line([640, 660, 620, 680], fill='#8B4513', width=6)

    # Save the image
    img.save(output_path)


def create_image_prompt(scene: Dict, topic: str) -> str:
    """Create detailed image generation prompt for a scene"""

    base_style = (
        "professional mining safety training illustration, "
        "educational style, clear lighting, industrial setting, "
        "miner wearing full PPE (hard hat, safety vest, boots), "
        "realistic but clean art style, high detail, "
        "photorealistic, 4k quality, "
        "no icons, no symbols, no checkmarks, no UI elements"
    )

    prompt = f"{scene['scene_description']}, {scene['character_action']}, {base_style}"

    return prompt


def generate_images(scenes: List[Dict], topic: str, config: Dict) -> List[Path]:
    """
    Generate character images for all scenes using Hugging Face Router API

    Args:
        scenes: List of scene dictionaries
        topic: The mining safety topic
        config: Configuration dictionary

    Returns:
        List of paths to generated images
    """

    base_path = Path(__file__).parent.parent
    images_dir = base_path / config['paths']['images']
    images_dir.mkdir(parents=True, exist_ok=True)

    image_paths = []

    print(f"   🎨 Using Hugging Face Router API ({config['models']['image_generation']['model']})")

    for i, scene in enumerate(scenes, 1):
        output_path = images_dir / f"scene_{scene['scene_number']:02d}.png"

        print(f"   [{i}/{len(scenes)}] Generating image for scene {scene['scene_number']}...")

        try:
            prompt = create_image_prompt(scene, topic)
            print(f"       Prompt: {prompt[:80]}...")

            # Generate image using HF Router API
            image_bytes = generate_image(prompt, config)

            # Save image bytes to file
            image = Image.open(io.BytesIO(image_bytes))
            image.save(output_path)

            image_paths.append(output_path)
            print(f"       ✓ Saved: {output_path.name}")

        except Exception as e:
            print(f"       ❌ Error generating image: {e}")
            print(f"       🔄 Creating fallback image...")

            # Create a simple fallback image
            create_fallback_image(scene, output_path)

            image_paths.append(output_path)
            print(f"       ✓ Saved fallback: {output_path.name}")

    return image_paths
