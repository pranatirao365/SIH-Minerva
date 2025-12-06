"""
Local OpenCV Animation System
Creates professional motion animations for mining safety videos using OpenCV
"""

import os
import cv2
import numpy as np
from pathlib import Path
from PIL import Image

def generate_animation(image_path: str, prompt: str, output_path: str) -> str:
    """
    Generate animation using local OpenCV processing (no APIs, no complex models)

    Args:
        image_path: Path to input image
        prompt: Animation description prompt
        output_path: Where to save the output video

    Returns:
        Path to generated animation file
    """
    # Ensure output directory exists
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    print(f"🎬 Generating local animation...")
    print(f"   Input: {image_path}")
    print(f"   Prompt: {prompt}")
    print(f"   Output: {output_path}")

    # Load image
    img = Image.open(image_path)
    img_array = np.array(img)

    # Video settings
    fps = 30
    duration = 4  # seconds
    total_frames = fps * duration
    height, width = img_array.shape[:2]

    # Create video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    # Analyze prompt for animation type - enhanced for mining safety
    prompt_lower = prompt.lower()

    # Mining-specific animation types
    if any(word in prompt_lower for word in ['walk', 'move', 'running', 'walking', 'miner moving']):
        animation_type = "pan"  # Horizontal movement through tunnel
    elif any(word in prompt_lower for word in ['inspect', 'check', 'examine', 'look']):
        animation_type = "zoom_in_out"  # Zoom in to inspect equipment
    elif any(word in prompt_lower for word in ['demonstrate', 'show', 'point', 'safety procedure']):
        animation_type = "subtle_pan"  # Gentle pan to show procedures
    elif any(word in prompt_lower for word in ['emergency', 'alert', 'warning', 'hazard']):
        animation_type = "quick_pan"  # Faster pan for urgency
    elif any(word in prompt_lower for word in ['equipment', 'machinery', 'drill', 'tools']):
        animation_type = "rotate_subtle"  # Slight rotation to show equipment
    else:
        # Default dynamic animation
        animation_type = "dynamic"

    print(f"   Animation type: {animation_type}")

    # Generate frames based on animation type
    for frame_num in range(total_frames):
        progress = frame_num / total_frames

        if animation_type == "pan":
            # Horizontal pan for walking through tunnels
            pan_distance = int(width * 0.15)  # Increased pan distance
            x_offset = int(pan_distance * progress * 2 - pan_distance)  # Oscillate
            frame = img_array[:, max(0, x_offset):max(0, x_offset)+width]

            if frame.shape[1] < width:
                remainder = width - frame.shape[1]
                if x_offset >= 0:
                    frame = np.concatenate([frame, img_array[:, :remainder]], axis=1)
                else:
                    frame = np.concatenate([img_array[:, -remainder:], frame], axis=1)

        elif animation_type == "zoom_in_out":
            # Zoom in and out for inspection
            zoom = 1.0 + 0.3 * np.sin(progress * 2 * np.pi)  # Sine wave zoom
            new_width = int(width * zoom)
            new_height = int(height * zoom)

            zoomed = cv2.resize(img_array, (new_width, new_height))
            x_offset = (new_width - width) // 2
            y_offset = (new_height - height) // 2
            frame = zoomed[y_offset:y_offset+height, x_offset:x_offset+width]

        elif animation_type == "subtle_pan":
            # Gentle pan for demonstrations
            pan_distance = int(width * 0.08)
            x_offset = int(pan_distance * np.sin(progress * 2 * np.pi))
            frame = img_array[:, max(0, x_offset):max(0, x_offset)+width]

            if frame.shape[1] < width:
                remainder = width - frame.shape[1]
                frame = np.concatenate([frame, img_array[:, :remainder]], axis=1)

        elif animation_type == "quick_pan":
            # Faster pan for emergencies
            pan_distance = int(width * 0.2)
            x_offset = int(pan_distance * progress * 3 - pan_distance * 1.5)
            frame = img_array[:, max(0, x_offset):max(0, x_offset)+width]

            if frame.shape[1] < width:
                remainder = width - frame.shape[1]
                if x_offset >= 0:
                    frame = np.concatenate([frame, img_array[:, :remainder]], axis=1)
                else:
                    frame = np.concatenate([img_array[:, -remainder:], frame], axis=1)

        elif animation_type == "rotate_subtle":
            # Subtle rotation for equipment viewing
            angle = 5 * np.sin(progress * 4 * np.pi)  # Gentle oscillating rotation
            center = (width // 2, height // 2)
            rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
            frame = cv2.warpAffine(img_array, rotation_matrix, (width, height))

        else:  # dynamic (default)
            # Dynamic combination: zoom + pan + slight rotation
            zoom = 1.0 + 0.15 * np.sin(progress * 2 * np.pi)
            pan = int(width * 0.05 * np.sin(progress * 3 * np.pi))
            angle = 2 * np.sin(progress * 4 * np.pi)

            # Apply zoom
            new_width = int(width * zoom)
            new_height = int(height * zoom)
            zoomed = cv2.resize(img_array, (new_width, new_height))

            # Apply pan
            x_offset = (new_width - width) // 2 + pan
            y_offset = (new_height - height) // 2
            frame = zoomed[y_offset:y_offset+height, x_offset:x_offset+width]

            # Apply rotation
            center = (width // 2, height // 2)
            rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
            frame = cv2.warpAffine(frame, rotation_matrix, (width, height))

        # Ensure frame is correct size
        if frame.shape[:2] != (height, width):
            frame = cv2.resize(frame, (width, height))

        # Convert RGB to BGR for OpenCV
        if frame.shape[2] == 3:  # RGB image
            frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

        out.write(frame)

    out.release()
    print("✅ Animation generated successfully!")
    return output_path

def generate_animations_batch(image_paths: list, prompts: list, config: dict) -> list:
    """
    Generate animations for multiple scenes using local processing

    Args:
        image_paths: List of input image paths
        prompts: List of animation prompts
        config: Configuration dictionary

    Returns:
        List of generated animation file paths
    """
    animation_paths = []
    base_path = Path(__file__).parent.parent
    animations_dir = base_path / config['paths']['animations']
    animations_dir.mkdir(parents=True, exist_ok=True)

    print("🎬 Generating animations with local processing...")

    for i, (image_path, prompt) in enumerate(zip(image_paths, prompts), 1):
        output_path = animations_dir / f"animation_{i:02d}.mp4"

        print(f"   [{i}/{len(image_paths)}] Processing scene {i}...")

        try:
            animation_path = generate_animation(
                image_path=str(image_path),
                prompt=prompt,
                output_path=str(output_path)
            )
            animation_paths.append(animation_path)
            print(f"       ✅ Saved: {Path(animation_path).name}")

        except Exception as e:
            print(f"       ❌ Failed: {e}")
            continue

    return animation_paths