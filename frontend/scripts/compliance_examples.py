"""
Example: Generating Compliant Mining Safety Videos
Demonstrates Mines Rules 1955 compliance without displaying regulations
"""

import json
from mines_rules_compliance import ComplianceEngine, get_compliant_video_config


def example_1_first_aid_training():
    """Example: First-Aid Training Video"""
    print("\n" + "="*70)
    print("EXAMPLE 1: First-Aid Response in Underground Mining")
    print("="*70)
    
    engine = ComplianceEngine()
    topic = "first_aid"
    
    # Get compliant configuration
    config = get_compliant_video_config(topic, language='en')
    
    print("\n📋 COMPLIANCE CONTEXT (Internal Only):")
    print(json.dumps(config['context'], indent=2))
    
    print("\n🎬 SAMPLE SCENES (What viewers will see):")
    
    sample_scenes = [
        {
            "scene_number": 1,
            "scene_description": "Mining tunnel with worker sustaining minor cut on hand",
            "character_action": "miner examining bleeding hand",
            "voiceover_line": "In any workplace injury, quick action is essential for worker safety"
        },
        {
            "scene_number": 2,
            "scene_description": "Co-worker pointing to nearby first-aid station with clear signage",
            "character_action": "worker guiding injured colleague to first-aid point",
            "voiceover_line": "First-aid stations are located at accessible points throughout the mine"
        },
        {
            "scene_number": 3,
            "scene_description": "Trained personnel opening first-aid kit showing sterilized dressings",
            "character_action": "trained responder selecting appropriate dressing",
            "voiceover_line": "Trained first-aid providers are available during all shifts"
        },
        {
            "scene_number": 4,
            "scene_description": "Clean dressing being applied with antiseptic",
            "character_action": "careful application of sterilized bandage",
            "voiceover_line": "Always use sterilized dressings and antiseptic to prevent infection"
        },
        {
            "scene_number": 5,
            "scene_description": "Worker reporting incident to shift supervisor",
            "character_action": "miner showing treated hand to supervisor",
            "voiceover_line": "Every injury must be reported immediately to your supervisor"
        }
    ]
    
    for scene in sample_scenes:
        print(f"\nScene {scene['scene_number']}:")
        print(f"  Visual: {scene['scene_description']}")
        print(f"  Action: {scene['character_action']}")
        print(f"  Voiceover: \"{scene['voiceover_line']}\"")
    
    # Validate compliance
    print("\n🔍 COMPLIANCE VALIDATION:")
    is_valid, compliance_records = engine.validate_generated_scenes(sample_scenes, topic)
    
    for record in compliance_records:
        status = "✅" if record.validation_status else "❌"
        print(f"  {status} Scene {record.scene_id}: {record.validation_notes}")
    
    # Check specific guidance
    guidance = engine.get_topic_specific_guidance(topic)
    print("\n📊 REGULATORY REQUIREMENTS (Hidden from video):")
    print(json.dumps(guidance, indent=2))


def example_2_medical_examination():
    """Example: Medical Fitness Standards Video"""
    print("\n" + "="*70)
    print("EXAMPLE 2: Health Monitoring for Mine Workers")
    print("="*70)
    
    engine = ComplianceEngine()
    topic = "medical_examination"
    
    # Get guidance
    guidance = engine.get_topic_specific_guidance(topic)
    
    print("\n📋 WHAT REGULATIONS REQUIRE (Internal):")
    print(f"  • Vision: Better eye {guidance['vision_standards']['better_eye']}, Worse eye {guidance['vision_standards']['worse_eye']}")
    print(f"  • Exams: {guidance['examination_intervals']['general']}")
    print(f"  • Asbestos workers: {guidance['examination_intervals']['asbestos_workers']}")
    print(f"  • Tests: {guidance['lung_tests']}")
    
    print("\n🎬 WHAT WORKERS SEE IN VIDEO:")
    
    sample_scenes = [
        {
            "scene_number": 1,
            "scene_description": "Medical examination room with vision chart",
            "character_action": "worker reading eye chart from specified distance",
            "voiceover_line": "Regular vision tests ensure you can safely perform your duties"
        },
        {
            "scene_number": 2,
            "scene_description": "Healthcare professional explaining vision test results",
            "character_action": "doctor showing worker how to read the chart correctly",
            "voiceover_line": "Good vision is critical for identifying hazards and reading safety signs"
        },
        {
            "scene_number": 3,
            "scene_description": "Chest X-ray procedure in medical facility",
            "character_action": "worker positioning for chest radiograph",
            "voiceover_line": "Chest examinations monitor your respiratory health in dusty environments"
        },
        {
            "scene_number": 4,
            "scene_description": "Spirometry lung function test demonstration",
            "character_action": "worker breathing into spirometer device",
            "voiceover_line": "Lung function tests help detect early signs of respiratory issues"
        },
        {
            "scene_number": 5,
            "scene_description": "Worker receiving fitness certificate from doctor",
            "character_action": "satisfied worker reviewing health clearance",
            "voiceover_line": "Regular health monitoring protects you and your colleagues"
        }
    ]
    
    for scene in sample_scenes:
        print(f"\nScene {scene['scene_number']}: {scene['voiceover_line']}")
    
    # Validate
    is_valid, records = engine.validate_generated_scenes(sample_scenes, topic)
    print(f"\n✅ Compliance Status: {'PASS' if is_valid else 'NEEDS REVIEW'}")


def example_3_safety_committee():
    """Example: Workplace Safety Inspections Video"""
    print("\n" + "="*70)
    print("EXAMPLE 3: Workplace Safety Inspections")
    print("="*70)
    
    engine = ComplianceEngine()
    topic = "safety_committee"
    
    guidance = engine.get_topic_specific_guidance(topic)
    
    print("\n📋 REGULATORY FRAMEWORK (Hidden):")
    print(f"  • Committee required: {guidance['workforce_threshold']}")
    print(f"  • Inspector threshold: {guidance['workmen_inspector_threshold']}")
    print(f"  • Meeting frequency: {guidance['meeting_frequency']}")
    print(f"  • Action timeline: {guidance['response_timeline']}")
    
    print("\n🎬 TRAINING VIDEO CONTENT:")
    
    sample_scenes = [
        {
            "scene_number": 1,
            "scene_description": "Safety inspector with checklist at mine entrance",
            "character_action": "inspector reviewing inspection agenda",
            "voiceover_line": "Regular safety inspections identify potential hazards before they cause harm"
        },
        {
            "scene_number": 2,
            "scene_description": "Inspector examining shaft equipment and supports",
            "character_action": "careful inspection of structural components",
            "voiceover_line": "Inspectors check all critical areas including shafts, equipment, and workplaces"
        },
        {
            "scene_number": 3,
            "scene_description": "Inspector documenting findings in notebook",
            "character_action": "writing detailed observations",
            "voiceover_line": "Every inspection is documented to track improvements over time"
        },
        {
            "scene_number": 4,
            "scene_description": "Inspector discussing hazard with supervisor",
            "character_action": "pointing to identified issue, collaborative discussion",
            "voiceover_line": "Identified hazards are immediately communicated to management"
        },
        {
            "scene_number": 5,
            "scene_description": "Workers implementing suggested safety improvements",
            "character_action": "team installing improved safety equipment",
            "voiceover_line": "Prompt action on safety recommendations protects everyone"
        }
    ]
    
    for scene in sample_scenes:
        print(f"\nScene {scene['scene_number']}: {scene['scene_description']}")
        print(f"  → \"{scene['voiceover_line']}\"")
    
    # Show what's NOT included
    print("\n❌ WHAT'S NOT SHOWN (Regulatory Details):")
    print("  • Form U inspection register format")
    print("  • 15-day response requirement")
    print("  • Overman/Foreman certificate requirements")
    print("  • Rule 29Q, 29R, 29S references")
    print("  • Chief Inspector escalation procedures")


def example_4_accident_classification():
    """Example: Accident Reporting Awareness Video"""
    print("\n" + "="*70)
    print("EXAMPLE 4: Understanding Mining Accidents")
    print("="*70)
    
    engine = ComplianceEngine()
    topic = "accident_reporting"
    
    print("\n📋 FORM J/K CLASSIFICATION (Internal Use Only):")
    print("  By Place: Underground → Opencast → Aboveground")
    print("  By Cause: Ground movement → Machinery → Electrical → Falls")
    
    print("\n🎬 EDUCATIONAL VIDEO CONTENT:")
    
    sample_scenes = [
        {
            "scene_number": 1,
            "scene_description": "Overview of different mine work areas",
            "character_action": "aerial view transitioning through work zones",
            "voiceover_line": "Understanding your work environment helps identify potential hazards"
        },
        {
            "scene_number": 2,
            "scene_description": "Underground worker checking roof supports",
            "character_action": "miner inspecting overhead stability",
            "voiceover_line": "Ground stability is a primary concern in underground operations"
        },
        {
            "scene_number": 3,
            "scene_description": "Surface equipment operation with safety protocols",
            "character_action": "operator performing pre-start machinery check",
            "voiceover_line": "Equipment-related incidents can be prevented through proper procedures"
        },
        {
            "scene_number": 4,
            "scene_description": "Worker identifying and reporting hazard to supervisor",
            "character_action": "pointing out unsafe condition, immediate communication",
            "voiceover_line": "Report any hazardous condition immediately to prevent incidents"
        },
        {
            "scene_number": 5,
            "scene_description": "Safety team reviewing incident data on chart",
            "character_action": "analyzing patterns to improve safety measures",
            "voiceover_line": "Learning from past incidents makes our workplace safer for everyone"
        }
    ]
    
    for scene in sample_scenes:
        print(f"\nScene {scene['scene_number']}: {scene['voiceover_line']}")


def example_5_compliance_report():
    """Example: Internal Compliance Report Generation"""
    print("\n" + "="*70)
    print("EXAMPLE 5: Internal Compliance Report (Not for Video)")
    print("="*70)
    
    engine = ComplianceEngine()
    
    # Simulate generating a video
    topic = "first_aid"
    video_id = "first_aid_training_en_001"
    
    sample_scenes = [
        {
            "scene_number": 1,
            "scene_description": "First-aid station at mine entrance",
            "character_action": "worker identifying first-aid location",
            "voiceover_line": "Know where first-aid stations are located in your work area"
        },
        {
            "scene_number": 2,
            "scene_description": "Trained responder applying sterilized dressing",
            "character_action": "proper wound dressing technique demonstration",
            "voiceover_line": "Use clean, sterilized materials for all first-aid treatment"
        }
    ]
    
    is_valid, compliance_records = engine.validate_generated_scenes(sample_scenes, topic)
    
    # Generate compliance report
    report = engine.generate_compliance_report(
        topic=topic,
        video_id=video_id,
        scenes=sample_scenes,
        compliance_records=compliance_records
    )
    
    print("\n📄 COMPLIANCE CERTIFICATION REPORT:")
    print(json.dumps(report, indent=2))
    
    print("\n📁 This report would be saved as:")
    print(f"  → compliance_reports/{video_id}_compliance.json")
    print("\n💡 Report is for internal audit only, NOT embedded in video")


def show_forbidden_vs_allowed():
    """Show what's forbidden vs allowed in video content"""
    print("\n" + "="*70)
    print("CONTENT GUIDELINES: What to Include vs Avoid")
    print("="*70)
    
    examples = [
        {
            "category": "FIRST-AID",
            "forbidden": [
                "As per Rule 41 of Mines Rules 1955...",
                "Form requirements mandate...",
                "Third Schedule equipment list...",
                "St. John's Ambulance certificate number..."
            ],
            "allowed": [
                "Trained first-aid providers are available during all shifts",
                "First-aid stations contain sterilized dressings and antiseptic",
                "Access first-aid equipment at marked locations",
                "Report injuries immediately to your supervisor"
            ]
        },
        {
            "category": "MEDICAL EXAMINATION",
            "forbidden": [
                "Form P medical standards require...",
                "As specified in Form O certificate...",
                "Rule 29B mandates periodic examination...",
                "300mA X-ray machine as per regulations..."
            ],
            "allowed": [
                "Regular vision tests ensure workplace safety",
                "Good eyesight helps identify hazards",
                "Periodic health check-ups monitor your well-being",
                "Chest examinations protect respiratory health"
            ]
        },
        {
            "category": "SAFETY INSPECTIONS",
            "forbidden": [
                "Workmen's Inspector per Rule 29Q...",
                "Form U inspection register entries...",
                "15-day compliance requirement...",
                "Chief Inspector escalation..."
            ],
            "allowed": [
                "Regular safety inspections identify hazards",
                "Inspectors check all work areas systematically",
                "Hazards are documented and addressed promptly",
                "Your input improves workplace safety"
            ]
        }
    ]
    
    for example in examples:
        print(f"\n{'='*70}")
        print(f"  {example['category']}")
        print(f"{'='*70}")
        
        print("\n  ❌ NEVER SAY (Regulatory Language):")
        for forbidden in example['forbidden']:
            print(f"    • {forbidden}")
        
        print("\n  ✅ INSTEAD SAY (Practical Safety):")
        for allowed in example['allowed']:
            print(f"    • {allowed}")


# Main execution
if __name__ == "__main__":
    print("\n" + "="*70)
    print("    MINES RULES 1955 COMPLIANT VIDEO GENERATION")
    print("    Regulations Applied, Legal Text Hidden")
    print("="*70)
    
    # Run all examples
    example_1_first_aid_training()
    example_2_medical_examination()
    example_3_safety_committee()
    example_4_accident_classification()
    example_5_compliance_report()
    show_forbidden_vs_allowed()
    
    print("\n" + "="*70)
    print("✅ EXAMPLES COMPLETE")
    print("="*70)
    print("\nKEY TAKEAWAYS:")
    print("  1. Compliance engine validates all content")
    print("  2. Legal references are NEVER shown in video")
    print("  3. Viewers see practical safety guidance only")
    print("  4. Compliance reports track regulatory adherence")
    print("  5. Organizations maintain audit trail internally")
    print("="*70 + "\n")
