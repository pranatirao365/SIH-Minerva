"""
Scene Script Generator Module
Uses Gemini 2.0 Flash to generate educational scene breakdowns based on user topic
WITH MINES RULES 1955 COMPLIANCE (hidden from video output)
"""

import os
import json
from typing import List, Dict, Optional
import google.generativeai as genai

# Import compliance engine
try:
    from mines_rules_compliance import ComplianceEngine, get_compliant_video_config
    COMPLIANCE_ENABLED = True
except ImportError:
    print("⚠️  Compliance engine not available, running without regulatory validation")
    COMPLIANCE_ENABLED = False


def configure_gemini(config: Dict) -> genai.GenerativeModel:
    """Configure Gemini API with credentials"""
    api_key = os.getenv(config['models']['llm']['api_key_env'])
    
    if not api_key:
        raise ValueError(
            f"API key not found. Please set {config['models']['llm']['api_key_env']} "
            f"environment variable."
        )
    
    genai.configure(api_key=api_key)
    
    model = genai.GenerativeModel(
        model_name=config['models']['llm']['model'],
        generation_config={
            "temperature": config['models']['llm']['temperature'],
            "max_output_tokens": config['models']['llm']['max_tokens'],
        }
    )
    
    return model


def create_scene_prompt(topic: str, scene_count: int, language: str = 'en', compliance_context: Optional[Dict] = None) -> str:
    """Create detailed prompt for scene generation with hidden compliance requirements"""
    
    language_instructions = {
        'en': 'in English',
        'hi': 'in Hindi (हिंदी)',
        'te': 'in Telugu (తెలుగు)'
    }
    
    lang_instruction = language_instructions.get(language, 'in English')
    
    # Build compliance guidance (if available)
    compliance_guidance = ""
    if compliance_context:
        key_points = compliance_context.get('key_points', [])
        visual_elements = compliance_context.get('visual_elements', [])
        
        if key_points:
            compliance_guidance = f"""

SAFETY BEST PRACTICES TO NATURALLY INCLUDE:
{chr(10).join(f"- {point}" for point in key_points[:5])}

SUGGESTED VISUAL DEMONSTRATIONS:
{chr(10).join(f"- {element}" for element in visual_elements[:5])}
"""
    
    prompt = f"""You are an expert mining safety training content creator.

Generate a detailed scene breakdown for an educational mining safety video on the topic: "{topic}"

CRITICAL REQUIREMENTS:
- All voiceover_line text must be {lang_instruction}
- Present information as practical safety best practices
- DO NOT mention any legal rules, regulations, acts, or compliance requirements
- DO NOT reference forms, schedules, certificates, or government bodies
- DO NOT use terms like "Rule", "Act", "Form", "Schedule", "Inspector", "DGMS"
- Focus on WHAT workers should do and WHY it matters for their safety
{compliance_guidance}

Create exactly {scene_count} scenes that form a complete training video.

Requirements:
- Each scene should be 3-5 seconds long
- Scenes should progress logically (introduction → demonstration → safety measures → proper procedure → conclusion)
- Focus on practical, actionable safety information
- Include specific visual details for animation
- Voiceover should be clear, professional, and instructional

Return ONLY a valid JSON array with this exact structure:

[
  {{
    "scene_number": 1,
    "scene_description": "Detailed visual description of the scene setting and environment",
    "character_action": "Specific action the miner character performs (e.g., 'miner inspecting helmet', 'worker pointing at gas detector')",
    "voiceover_line": "Exact spoken narration for this scene"
  }},
  ...
]

Example for "PPE Safety in Mines":
[
  {{
    "scene_number": 1,
    "scene_description": "Mine entrance with safety signage, well-lit industrial setting",
    "character_action": "miner walking toward entrance wearing full PPE",
    "voiceover_line": "Personal protective equipment is your first line of defense in mining operations"
  }},
  {{
    "scene_number": 2,
    "scene_description": "Close-up of miner adjusting hard hat with chinstrap",
    "character_action": "miner demonstrating proper hard hat fit and adjustment",
    "voiceover_line": "Always ensure your hard hat fits properly and the chinstrap is secured"
  }}
]

Now generate {scene_count} scenes for: "{topic}"

Return ONLY the JSON array, no additional text.
"""
    
    return prompt


def parse_scene_response(response_text: str) -> List[Dict]:
    """Parse and validate the scene JSON response"""
    
    # Try to extract JSON from the response
    response_text = response_text.strip()
    
    # Remove markdown code blocks if present
    if response_text.startswith("```json"):
        response_text = response_text[7:]
    if response_text.startswith("```"):
        response_text = response_text[3:]
    if response_text.endswith("```"):
        response_text = response_text[:-3]
    
    response_text = response_text.strip()
    
    try:
        scenes = json.loads(response_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse scene JSON: {e}\nResponse: {response_text[:200]}")
    
    # Validate structure
    if not isinstance(scenes, list):
        raise ValueError("Scene response must be a JSON array")
    
    # Handle nested array structure (sometimes Gemini wraps scenes in extra array)
    if len(scenes) == 1 and isinstance(scenes[0], list):
        scenes = scenes[0]
    
    required_fields = [
        "scene_number", "scene_description", 
        "character_action", "voiceover_line"
    ]
    
    for i, scene in enumerate(scenes):
        if not isinstance(scene, dict):
            raise ValueError(f"Scene {i+1} must be a dictionary, got {type(scene)}")
        for field in required_fields:
            if field not in scene:
                raise ValueError(f"Scene {i+1} missing required field: {field}")
    
    return scenes


def generate_scene_breakdown(topic: str, config: Dict, language: str = 'en') -> tuple[List[Dict], Optional[Dict]]:
    """
    Main function to generate scene breakdown using Gemini with Mines Rules compliance
    
    Args:
        topic: User-provided mining safety topic
        config: Configuration dictionary
        language: Language code ('en', 'hi', 'te')
        
    Returns:
        Tuple of (scenes_list, compliance_report)
        compliance_report is None if compliance engine not available
    """
    
    lang_names = {'en': 'English', 'hi': 'Hindi', 'te': 'Telugu'}
    print(f"   📝 Topic: {topic}")
    print(f"   🌐 Language: {lang_names.get(language, 'English')}")
    print(f"   🤖 Using: {config['models']['llm']['model']}")
    
    # Initialize compliance engine
    compliance_engine = None
    compliance_context = None
    
    if COMPLIANCE_ENABLED:
        try:
            compliance_engine = ComplianceEngine()
            compliance_context = compliance_engine.prepare_topic_context(topic)
            print(f"   ✅ Mines Rules 1955 compliance enabled (hidden from video)")
        except Exception as e:
            print(f"   ⚠️  Compliance engine error: {e}")
    
    # Configure Gemini
    model = configure_gemini(config)
    
    # Generate prompt with compliance context
    scene_count = config['pipeline']['scene_count']
    prompt = create_scene_prompt(topic, scene_count, language, compliance_context)
    
    print(f"   🔄 Generating {scene_count} compliance-aware scenes...")
    
    # Generate scenes
    response = model.generate_content(prompt)
    
    # Parse response
    scenes = parse_scene_response(response.text)
    
    # Validate scene count
    if len(scenes) != scene_count:
        print(f"   ⚠️  Warning: Expected {scene_count} scenes, got {len(scenes)}")
    
    # Validate compliance (if engine available)
    compliance_report = None
    if compliance_engine:
        print(f"   🔍 Validating scenes for compliance...")
        is_valid, compliance_records = compliance_engine.validate_generated_scenes(scenes, topic)
        
        if is_valid:
            print(f"   ✅ All scenes compliant (no explicit legal references)")
        else:
            print(f"   ⚠️  Some scenes need review - check compliance report")
        
        # Generate compliance report (for internal audit only)
        compliance_report = compliance_engine.generate_compliance_report(
            topic=topic,
            video_id=f"{topic.replace(' ', '_')}_{language}",
            scenes=scenes,
            compliance_records=compliance_records
        )
    
    # Display preview
    print(f"\n   Preview of scenes:")
    for scene in scenes[:2]:  # Show first 2 scenes
        print(f"   • Scene {scene['scene_number']}: {scene['scene_description'][:60]}...")
    
    if len(scenes) > 2:
        print(f"   • ... and {len(scenes) - 2} more scenes")
    
    return scenes, compliance_report


# Fallback function for testing without API key
def generate_mock_scenes(topic: str, scene_count: int = 5) -> List[Dict]:
    """Generate mock scenes for testing purposes"""
    
    print("   ⚠️  Using mock scene generation (for testing)")
    
    return [
        {
            "scene_number": i + 1,
            "scene_description": f"Mining safety scene {i+1} for {topic}",
            "character_action": f"miner demonstrating safety procedure {i+1}",
            "voiceover_line": f"Safety instruction {i+1} for {topic}"
        }
        for i in range(scene_count)
    ]
