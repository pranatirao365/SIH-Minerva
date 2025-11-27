"""
Video Assembler Module
Combines animations, icons, subtitles, and voiceovers into final video using MoviePy
"""

import os
from typing import List, Dict, Optional
from pathlib import Path
from datetime import datetime
from moviepy.editor import (
    VideoFileClip, AudioFileClip, ImageClip,
    CompositeVideoClip, concatenate_videoclips,
    CompositeAudioClip, ColorClip, transfx
)

try:
    from moviepy.editor import TextClip  # Requires ImageMagick
    IMAGEMAGICK_AVAILABLE = True
except Exception:
    TextClip = None
    IMAGEMAGICK_AVAILABLE = False


def create_subtitle_clip(text: str, duration: float, video_size: tuple):
    """Create a subtitle text clip - always tries to render subtitles"""
    
    # First try with TextClip if ImageMagick is available
    if IMAGEMAGICK_AVAILABLE and TextClip is not None:
        try:
            txt_clip = TextClip(
                text,
                fontsize=40,
                color='white',
                font='Arial-Bold',
                stroke_color='black',
                stroke_width=2,
                method='caption',
                size=(video_size[0] - 200, None),
                align='center'
            )
            txt_clip = txt_clip.set_duration(duration)
            txt_clip = txt_clip.set_position(('center', video_size[1] - 150))
            return txt_clip
        except Exception as e:
            pass  # Fall through to PIL-based subtitle
    
    # Fallback: Create subtitle using PIL (Pillow) - always works
    try:
        from PIL import Image, ImageDraw, ImageFont
        import numpy as np
        
        # Create a transparent image for subtitle background
        img_width, img_height = video_size
        subtitle_height = 200
        img = Image.new('RGBA', (img_width, subtitle_height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Draw semi-transparent black background
        bg_padding = 20
        draw.rectangle(
            [(bg_padding, 50), (img_width - bg_padding, subtitle_height - 20)],
            fill=(0, 0, 0, 180)
        )
        
        # Use default font with reasonable size
        try:
            font = ImageFont.truetype("arial.ttf", 36)
        except:
            font = ImageFont.load_default()
        
        # Word wrap text
        words = text.split()
        lines = []
        current_line = []
        
        for word in words:
            test_line = ' '.join(current_line + [word])
            bbox = draw.textbbox((0, 0), test_line, font=font)
            if bbox[2] - bbox[0] < img_width - 100:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
        if current_line:
            lines.append(' '.join(current_line))
        
        # Draw text lines
        y_offset = 70
        for line in lines[:3]:  # Max 3 lines
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
            x = (img_width - text_width) // 2
            # Draw outline
            for dx, dy in [(-2,-2), (-2,2), (2,-2), (2,2)]:
                draw.text((x+dx, y_offset+dy), line, font=font, fill=(0, 0, 0, 255))
            # Draw main text
            draw.text((x, y_offset), line, font=font, fill=(255, 255, 255, 255))
            y_offset += 40
        
        # Convert to ImageClip
        img_array = np.array(img)
        subtitle_clip = ImageClip(img_array, transparent=True)
        subtitle_clip = subtitle_clip.set_duration(duration)
        subtitle_clip = subtitle_clip.set_position(('center', video_size[1] - subtitle_height - 20))
        
        return subtitle_clip
    except Exception as e:
        print(f"       ⚠️  Could not create subtitle: {e}")
        return None


def add_icon_overlay(video: VideoFileClip, icon_path: Path, position: str = 'top-right') -> CompositeVideoClip:
    """Add icon overlay to video"""
    
    if not icon_path.exists():
        return video
    
    # Load icon
    icon = ImageClip(str(icon_path), transparent=True)
    
    # Resize icon
    icon_size = 120
    icon = icon.resize(height=icon_size)
    icon = icon.set_duration(video.duration)
    
    # Set position
    if position == 'top-right':
        icon = icon.set_position((video.w - icon.w - 30, 30))
    elif position == 'top-left':
        icon = icon.set_position((30, 30))
    elif position == 'bottom-right':
        icon = icon.set_position((video.w - icon.w - 30, video.h - icon.h - 30))
    else:  # bottom-left
        icon = icon.set_position((30, video.h - icon.h - 30))
    
    # Composite
    return CompositeVideoClip([video, icon])


def create_checkbox_image(checked: bool, size: int = 80) -> ImageClip:
    """Create a checkbox image (checked or unchecked)"""
    
    try:
        from PIL import Image, ImageDraw
        import numpy as np
        
        # Create square image
        img = Image.new('RGBA', (size, size), (255, 255, 255, 0))  # Transparent background
        draw = ImageDraw.Draw(img)
        
        # Draw checkbox border
        border_color = (0, 150, 0, 255) if checked else (150, 0, 0, 255)  # Green for checked, red for unchecked
        draw.rectangle([5, 5, size-5, size-5], outline=border_color, width=4)
        
        if checked:
            # Draw checkmark
            check_color = (0, 150, 0, 255)
            # Draw checkmark as two lines
            draw.line([15, size//2, size//2-5, size-15], fill=check_color, width=4)
            draw.line([size//2-5, size-15, size-15, 15], fill=check_color, width=4)
        
        # Convert to ImageClip
        img_array = np.array(img)
        checkbox_clip = ImageClip(img_array, transparent=True)
        
        return checkbox_clip
        
    except Exception as e:
        print(f"       ⚠️  Error creating checkbox: {e}")
        return None


def add_checkbox_overlay(video: VideoFileClip, checked: bool, position: str = 'top-left', duration: float = None) -> CompositeVideoClip:
    """Add checkbox overlay to video"""
    
    checkbox = create_checkbox_image(checked)
    if checkbox is None:
        return video
    
    # Set duration to match video or specified duration
    if duration is None:
        duration = video.duration
    
    checkbox = checkbox.set_duration(duration)
    
    # Set position
    if position == 'top-left':
        checkbox = checkbox.set_position((50, 50))
    elif position == 'top-right':
        checkbox = checkbox.set_position((video.w - 130, 50))
    elif position == 'bottom-left':
        checkbox = checkbox.set_position((50, video.h - 130))
    elif position == 'bottom-right':
        checkbox = checkbox.set_position((video.w - 130, video.h - 130))
    else:
        checkbox = checkbox.set_position((50, 50))  # Default top-left
    
    # Composite
    return CompositeVideoClip([video, checkbox])


def create_title_card(title: str, duration: float, video_size: tuple) -> VideoFileClip:
    """Create an opening title card using PIL (always works)"""
    
    try:
        from PIL import Image, ImageDraw, ImageFont
        import numpy as np
        
        # Create background image
        img = Image.new('RGB', video_size, (26, 26, 46))  # Dark blue background
        draw = ImageDraw.Draw(img)
        
        # Try to use a nice font
        try:
            title_font = ImageFont.truetype("arial.ttf", 60)
            subtitle_font = ImageFont.truetype("arial.ttf", 45)
        except:
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
        
        # Draw title text
        title_text = "MINING SAFETY TRAINING"
        bbox = draw.textbbox((0, 0), title_text, font=title_font)
        title_width = bbox[2] - bbox[0]
        title_x = (video_size[0] - title_width) // 2
        title_y = video_size[1] // 3
        
        # White outline
        for dx, dy in [(-3,-3), (-3,3), (3,-3), (3,3)]:
            draw.text((title_x+dx, title_y+dy), title_text, font=title_font, fill=(255, 255, 255, 255))
        # Main text
        draw.text((title_x, title_y), title_text, font=title_font, fill=(255, 255, 255, 255))
        
        # Draw subtitle (topic)
        subtitle_text = title.upper()
        bbox = draw.textbbox((0, 0), subtitle_text, font=subtitle_font)
        subtitle_width = bbox[2] - bbox[0]
        subtitle_x = (video_size[0] - subtitle_width) // 2
        subtitle_y = video_size[1] // 2
        
        # Yellow outline
        for dx, dy in [(-2,-2), (-2,2), (2,-2), (2,2)]:
            draw.text((subtitle_x+dx, subtitle_y+dy), subtitle_text, font=subtitle_font, fill=(255, 214, 0, 255))
        # Main text
        draw.text((subtitle_x, subtitle_y), subtitle_text, font=subtitle_font, fill=(255, 214, 0, 255))
        
        # Convert to ImageClip
        img_array = np.array(img)
        title_clip = ImageClip(img_array, duration=duration)
        
        return title_clip
        
    except Exception as e:
        print(f"       ⚠️  Error creating title card: {e}")
        # Ultimate fallback: solid color clip
        from moviepy.video.VideoClip import ColorClip
        return ColorClip(size=video_size, color=(26, 26, 46), duration=duration)


def process_scene(
    scene: Dict,
    animation_path: Path,
    config: Dict
) -> VideoFileClip:
    """Process a single scene with overlays (no audio or subtitles - added later)"""

    # Load animation and ensure it's properly resized
    video = VideoFileClip(str(animation_path))
    
    # Resize to target resolution to avoid black bars
    video_size = tuple(config['pipeline']['output_resolution'])
    video = video.resize(video_size)
    
    # Set fps to match target
    video = video.set_fps(config['pipeline']['fps'])
    
    # Ensure the video has no transparency issues
    if video.mask is not None:
        video = video.set_opacity(1.0)

    # Analyze scene content to determine checkbox state
    scene_desc = scene.get('description', '').lower()
    voiceover = scene.get('voiceover_line', '').lower()
    character_action = scene.get('character_action', '').lower()

    # Determine if this scene shows something that SHOULD be done (checked) or SHOULD NOT be done (unchecked)
    should_do_keywords = [
        'must', 'should', 'always', 'proper', 'correct', 'required', 'essential',
        'wear', 'use', 'check', 'inspect', 'follow', 'adhere', 'comply',
        'safe', 'safety', 'procedure', 'protocol', 'standard'
    ]

    should_not_do_keywords = [
        'never', 'don\'t', 'do not', 'avoid', 'dangerous', 'hazard', 'risk',
        'prohibited', 'forbidden', 'not allowed', 'unsafe', 'wrong', 'incorrect'
    ]

    # Check for positive/negative indicators
    should_do_score = sum(1 for keyword in should_do_keywords if keyword in scene_desc or keyword in voiceover or keyword in character_action)
    should_not_do_score = sum(1 for keyword in should_not_do_keywords if keyword in scene_desc or keyword in voiceover or keyword in character_action)

    # Add checkbox overlay if we have a clear indication
    if should_do_score > should_not_do_score:
        # Should do - show checked box
        video = add_checkbox_overlay(video, checked=True, position='top-right')
        print(f"       ✅ Added checked checkbox (should do)")
    elif should_not_do_score > should_do_score:
        # Should not do - show unchecked box
        video = add_checkbox_overlay(video, checked=False, position='top-right')
        print(f"       ❌ Added unchecked checkbox (should not do)")
    else:
        # Neutral - no checkbox
        print(f"       ➖ No checkbox (neutral content)")

    return video


def assemble_final_video(
    scenes: List[Dict],
    animation_paths: List[Path],
    audio_paths: List[Path],
    topic: str,
    language: str,
    config: Dict
) -> Path:
    """
    Assemble final video from all components
    
    Args:
        scenes: List of scene dictionaries
        animation_paths: List of animation video paths
        audio_paths: List of audio paths
        topic: The mining safety topic
        language: Language code ('en', 'hi', 'te')
        config: Configuration dictionary
        
    Returns:
        Path to final assembled video
    """
    
    base_path = Path(__file__).parent.parent
    output_dir = base_path / config['paths']['output']
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate output filename with topic name and timestamp
    import re
    # Sanitize topic name for filename (remove special characters, replace spaces with underscores)
    safe_topic = re.sub(r'[^\w\s-]', '', topic)  # Remove special chars
    safe_topic = re.sub(r'[-\s]+', '_', safe_topic)  # Replace spaces/hyphens with underscore
    safe_topic = safe_topic.strip('_').lower()  # Clean up and lowercase
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = output_dir / f"{safe_topic}_{timestamp}.mp4"
    
    video_clips = []
    
    # Resolution from config
    video_size = tuple(config['pipeline']['output_resolution'])
    fps = config['pipeline']['fps']
    
    # Create title card
    print(f"   📺 Creating title card...")
    title_card = create_title_card(topic, 3.0, video_size)
    video_clips.append(title_card)
    
    # Load all audio clips first to get total duration
    print(f"   🎤 Loading audio tracks...")
    valid_audio_clips = []
    audio_durations = []
    for ap in audio_paths:
        if ap and ap.exists():
            try:
                audio_clip = AudioFileClip(str(ap))
                valid_audio_clips.append(audio_clip)
                audio_durations.append(audio_clip.duration)
            except Exception as e:
                print(f"       ⚠️  Skipping audio file {ap.name}: {e}")
                audio_durations.append(5.0)  # Default duration if audio fails
        else:
            audio_durations.append(5.0)  # Default duration if no audio
    
    # Calculate total duration needed (title + all audio)
    title_duration = 3.0
    total_audio_duration = sum(audio_durations)
    total_video_duration = title_duration + total_audio_duration
    
    # Calculate duration per scene to fill the entire video
    num_scenes = len(scenes)
    scene_duration = total_audio_duration / num_scenes if num_scenes > 0 else 5.0
    
    print(f"   📊 Video planning: {total_video_duration:.1f}s total ({title_duration:.1f}s title + {total_audio_duration:.1f}s scenes)")
    print(f"   📸 Each of {num_scenes} scenes will be ~{scene_duration:.1f}s to fill the video")
    
    # Process each scene and set equal duration
    for i, (scene, animation_path) in enumerate(zip(scenes, animation_paths), 1):
        print(f"   [{i}/{len(scenes)}] Processing scene {scene['scene_number']}...")
        
        try:
            scene_clip = process_scene(
                scene=scene,
                animation_path=animation_path,
                config=config
            )
            
            # Use the corresponding audio duration for this specific scene
            target_duration = audio_durations[i-1] if i-1 < len(audio_durations) else scene_duration
            
            if scene_clip.duration < target_duration:
                # Loop the animation to match duration
                scene_clip = scene_clip.loop(duration=target_duration)
                print(f"       🔄 Extended scene to {target_duration:.1f}s")
            elif scene_clip.duration > target_duration:
                # Trim the animation to match duration
                scene_clip = scene_clip.subclip(0, target_duration)
                print(f"       ✂️  Trimmed scene to {target_duration:.1f}s")
            
            video_clips.append(scene_clip)
            print(f"       ✓ Scene processed ({target_duration:.1f}s)")
        except Exception as e:
            print(f"       ⚠️  Error processing scene: {e}")
            # Try to add just the animation with duration adjustment
            try:
                video = VideoFileClip(str(animation_path))
                target_duration = audio_durations[i-1] if i-1 < len(audio_durations) else scene_duration
                if video.duration < target_duration:
                    video = video.loop(duration=target_duration)
                elif video.duration > target_duration:
                    video = video.subclip(0, target_duration)
                video_clips.append(video)
            except:
                print(f"       ❌ Skipping scene due to errors")
    
    # Concatenate all clips with crossfade transitions
    print(f"   🎬 Concatenating {len(video_clips)} clips with smooth transitions...")
    
    if len(video_clips) > 1:
        # Apply crossfade transition between consecutive clips
        crossfade_duration = 0.7
        
        # Create a list to hold clips with transitions
        clips_with_transitions = [video_clips[0]]
        
        for i in range(1, len(video_clips)):
            # Apply fade in to current clip
            clips_with_transitions.append(video_clips[i].crossfadein(crossfade_duration))
        
        # Concatenate without padding to ensure no gaps
        final_video = concatenate_videoclips(clips_with_transitions, method="compose", bg_color=(0, 0, 0))
    else:
        final_video = concatenate_videoclips(video_clips, method="compose", bg_color=(0, 0, 0))
    
    print(f"       ✓ Smooth transitions applied")
    
    # Attach audio track
    if valid_audio_clips:
        print(f"   🎤 Attaching audio track...")
        # Stack sequentially in time, starting after the 3-second title card
        title_duration = 3.0
        current_start = title_duration
        placed = []
        for ac in valid_audio_clips:
            placed.append(ac.set_start(current_start))
            current_start += ac.duration
        composite_audio = CompositeAudioClip(placed)
        
        final_video = final_video.set_audio(composite_audio)
        print(f"       ✓ Audio track attached ({len(valid_audio_clips)} voiceovers)")
    else:
        print("       ℹ️  No valid audio clips found, exporting silent video")
    
    # Add synchronized subtitles after audio is attached
    print(f"   📝 Adding subtitles...")
    if valid_audio_clips:
        subtitle_clips = []
        current_time = title_duration  # Start after title card
        
        for scene, audio_clip in zip(scenes, valid_audio_clips):
            voiceover_text = scene.get('voiceover_line', '')
            if voiceover_text:
                subtitle = create_subtitle_clip(voiceover_text, audio_clip.duration, (final_video.w, final_video.h))
                if subtitle is not None:
                    subtitle = subtitle.set_start(current_time)
                    subtitle_clips.append(subtitle)
            current_time += audio_clip.duration
        
        if subtitle_clips:
            final_video = CompositeVideoClip([final_video] + subtitle_clips)
            print(f"       ✓ Subtitles added ({len(subtitle_clips)} clips)")
        else:
            print("       ℹ️  No subtitles to add")
    else:
        print("       ℹ️  No audio, skipping subtitles")
    
    # Write final video
    print(f"   💾 Writing final video...")
    print(f"       Resolution: {video_size[0]}x{video_size[1]}")
    print(f"       FPS: {fps}")
    print(f"       Duration: {final_video.duration:.1f} seconds")
    
    final_video.write_videofile(
        str(output_path),
        fps=fps,
        codec='libx264',
        audio_codec='aac',
        temp_audiofile='temp-audio.m4a',
        remove_temp=True,
        logger=None  # Suppress moviepy progress bar for cleaner output
    )
    
    # Clean up
    for clip in video_clips:
        clip.close()
    final_video.close()
    
    # Get file size
    file_size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"       ✓ Video saved: {output_path.name} ({file_size_mb:.1f} MB)")
    
    return output_path
