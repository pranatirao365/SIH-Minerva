"""
Mines Rules 1955 Compliance Engine
Ensures video content follows regulations without displaying the act
"""

import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path


@dataclass
class ComplianceRule:
    """Represents a single rule from Mines Rules 1955"""
    rule_number: str
    chapter: str
    title: str
    key_requirements: List[str]
    applicable_forms: List[str] = field(default_factory=list)
    visual_elements: List[str] = field(default_factory=list)
    forbidden_terms: List[str] = field(default_factory=list)


@dataclass
class SceneCompliance:
    """Tracks compliance for a single scene"""
    scene_id: int
    rules_covered: List[str]
    forms_referenced: List[str]
    validation_status: bool
    validation_notes: str


class MinesRulesDatabase:
    """Database of Mines Rules 1955 requirements"""
    
    def __init__(self):
        self.rules = self._initialize_rules()
        self.topic_keywords = self._initialize_topic_keywords()
    
    def _initialize_rules(self) -> Dict[str, ComplianceRule]:
        """Load rules from JSON configuration file"""
        try:
            config_path = Path(__file__).parent / "compliance_rules.json"
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            rules = {}
            for rule_id, rule_data in config['rules'].items():
                rules[rule_id] = ComplianceRule(
                    rule_number=rule_data['rule_number'],
                    chapter=rule_data['chapter'],
                    title=rule_data['title'],
                    key_requirements=rule_data['key_requirements'],
                    applicable_forms=rule_data.get('applicable_forms', []),
                    visual_elements=rule_data.get('visual_elements', []),
                    forbidden_terms=rule_data.get('forbidden_terms', [])
                )
            return rules
        except FileNotFoundError:
            print("Warning: compliance_rules.json not found, using minimal fallback rules")
            return self._get_fallback_rules()
        except Exception as e:
            print(f"Warning: Error loading compliance rules: {e}, using fallback rules")
            return self._get_fallback_rules()
    
    def _initialize_topic_keywords(self) -> Dict[str, List[str]]:
        """Load topic keywords from JSON configuration file"""
        try:
            config_path = Path(__file__).parent / "compliance_rules.json"
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            return config.get('topic_keywords', {})
        except Exception:
            return {}
    
    def _get_fallback_rules(self) -> Dict[str, ComplianceRule]:
        """Minimal fallback rules if JSON loading fails"""
        return {
            "rule_emergency_prep": ComplianceRule(
                rule_number="Emergency Preparedness",
                chapter="General",
                title="Emergency preparedness and evacuation procedures",
                key_requirements=[
                    "Familiarize yourself with all emergency exit routes",
                    "Follow emergency exit signs during evacuation",
                    "Assist injured colleagues when safe to do so"
                ],
                visual_elements=[
                    "Emergency exit sign",
                    "Mine map with escape routes",
                    "Miner assisting injured colleague"
                ],
                forbidden_terms=["Rule", "Act", "Mines Rules 1955"]
            )
        }
    
    def get_rule(self, rule_id: str) -> Optional[ComplianceRule]:
        """Get rule by ID"""
        return self.rules.get(rule_id)
    
    def get_rules_by_topic(self, topic: str) -> List[ComplianceRule]:
        """Get all rules relevant to a topic using keyword matching"""
        topic_lower = topic.lower()
        
        # Use topic keywords from JSON if available, otherwise use hardcoded mapping
        if self.topic_keywords:
            topic_keywords = self.topic_keywords
        else:
            # Fallback hardcoded mapping
            topic_keywords = {
                "emergency": ["rule_40", "rule_44", "rule_45", "rule_45a", "rule_emergency_prep"],
                "exit": ["rule_40", "rule_44", "rule_45", "rule_45a", "rule_emergency_prep"],
                "evacuation": ["rule_40", "rule_44", "rule_45", "rule_45a", "rule_emergency_prep"],
                "first_aid": ["rule_40", "rule_41", "rule_44", "rule_45", "rule_45a"],
                "medical": ["rule_29b", "rule_29f", "rule_40", "rule_41", "rule_44", "rule_45", "rule_45a"],
                "examination": ["rule_29b", "rule_29f"],
                "safety_committee": ["rule_29q", "rule_29r", "rule_29s", "rule_29t", "rule_29u", "rule_29v"],
                "accident": ["rule_76", "rule_40", "rule_45a"],
                "reporting": ["rule_76"],
                "sanitation": ["rule_30", "rule_33", "rule_35"],
                "workmen": ["rule_29q", "rule_29r", "rule_29s"],
                "inspector": ["rule_29q", "rule_29r", "rule_29s"],
                "ventilation": ["rule_37", "rule_38", "rule_39"],
                "gas": ["rule_37", "rule_38", "rule_39"],
                "explosives": ["rule_99", "rule_100", "rule_101"],
                "blasting": ["rule_99", "rule_100", "rule_101"],
                "machinery": ["rule_47", "rule_48", "rule_49"],
                "equipment": ["rule_47", "rule_48", "rule_49", "rule_45"],
                "ppe": ["rule_47", "rule_48"],
                "training": ["rule_40", "rule_41"],
                "supervisor": ["rule_29q", "rule_29r", "rule_29s"]
            }
        
        # Find matching rules based on keywords
        matching_rule_ids = set()
        for keyword, rules in topic_keywords.items():
            if keyword in topic_lower:
                matching_rule_ids.update(rules)
        
        # If no keywords match, return general safety rules
        if not matching_rule_ids:
            return [self.rules[rid] for rid in ["rule_emergency_prep"] if rid in self.rules]
        
        return [self.rules[rid] for rid in matching_rule_ids if rid in self.rules]


class ComplianceValidator:
    """Validates scene content for compliance without explicit mentions"""
    
    def __init__(self, rules_db: MinesRulesDatabase):
        self.rules_db = rules_db
    
    def validate_scene(
        self, 
        scene: Dict, 
        applicable_rules: List[str]
    ) -> Tuple[bool, str]:
        """
        Validate scene against applicable rules
        Returns (is_valid, validation_notes)
        """
        voiceover = scene.get('voiceover_line', '').lower()
        description = scene.get('description', '').lower()
        visual_prompt = scene.get('visual_prompt', '').lower()
        
        all_text = f"{voiceover} {description} {visual_prompt}"
        
        # Check for forbidden terms
        for rule_id in applicable_rules:
            rule = self.rules_db.get_rule(rule_id)
            if not rule:
                continue
            
            for forbidden_term in rule.forbidden_terms:
                if forbidden_term.lower() in all_text:
                    return False, f"Contains forbidden term: '{forbidden_term}'"
        
        # Check for required elements (at least one visual element should be present)
        has_visual_element = False
        for rule_id in applicable_rules:
            rule = self.rules_db.get_rule(rule_id)
            if not rule:
                continue
            
            for visual_element in rule.visual_elements:
                if any(word in all_text for word in visual_element.lower().split()):
                    has_visual_element = True
                    break
            
            if has_visual_element:
                break
        
        if not has_visual_element:
            return False, "Missing required visual compliance elements"
        
        return True, "Scene compliant - no explicit rule references, includes required elements"
    
    def check_explicit_references(self, text: str) -> List[str]:
        """Check for any explicit legal references"""
        forbidden_patterns = [
            "mines rules",
            "1955 act",
            "rule 29",
            "rule 30",
            "rule 33",
            "rule 40",
            "rule 41",
            "rule 44",
            "rule 45",
            "rule 76",
            "form j",
            "form k",
            "form m",
            "form n",
            "form o",
            "form p",
            "form u",
            "annexure",
            "schedule",
            "chief inspector",
            "inspector of mines",
            "dgms",
            "directorate general"
        ]
        
        found_references = []
        text_lower = text.lower()
        
        for pattern in forbidden_patterns:
            if pattern in text_lower:
                found_references.append(pattern)
        
        return found_references


class ComplianceEngine:
    """Main compliance engine for video generation"""
    
    def __init__(self):
        self.rules_db = MinesRulesDatabase()
        self.validator = ComplianceValidator(self.rules_db)
        self.scene_compliance_records = []
    
    def prepare_topic_context(self, topic: str) -> Dict:
        """
        Prepare compliance context for a topic without exposing legal text
        Returns natural language requirements and visual guidance
        """
        relevant_rules = self.rules_db.get_rules_by_topic(topic)
        
        if not relevant_rules:
            return {
                "topic": topic,
                "guidance": "General mining safety principles",
                "visual_elements": [],
                "key_points": []
            }
        
        # Extract natural language guidance
        key_points = []
        visual_elements = []
        
        for rule in relevant_rules:
            key_points.extend(rule.key_requirements)
            visual_elements.extend(rule.visual_elements)
        
        return {
            "topic": topic,
            "guidance": f"Educational content on {topic} following best safety practices",
            "key_points": key_points,
            "visual_elements": visual_elements,
            "scene_count": max(5, len(key_points))
        }
    
    def generate_compliant_prompt(self, topic: str, language: str = 'en') -> str:
        """
        Generate AI prompt that embeds compliance without explicit mentions
        """
        context = self.prepare_topic_context(topic)
        
        prompt = f"""You are an expert mining safety training content creator.

Generate a detailed scene breakdown for an educational video on: "{topic}"

CRITICAL REQUIREMENTS:
- All content must be in {language} language
- Present information as practical safety best practices
- Use clear, accessible language for workers
- DO NOT mention any legal rules, acts, or regulations
- DO NOT reference forms, schedules, or government bodies
- Focus on WHAT to do and WHY, not legal compliance

The video should naturally demonstrate these practices:
{chr(10).join(f"- {point}" for point in context['key_points'])}

Include these types of visual demonstrations:
{chr(10).join(f"- {element}" for element in context['visual_elements'][:5])}

Generate {context['scene_count']} scenes with:
1. Scene description (what happens)
2. Visual prompt (for image generation)
3. Voiceover line (worker-friendly explanation)
4. Duration (5-10 seconds)

Format as JSON array of scenes.
Keep tone encouraging, practical, and safety-focused.
"""
        
        return prompt
    
    def validate_generated_scenes(
        self, 
        scenes: List[Dict], 
        topic: str
    ) -> Tuple[bool, List[SceneCompliance]]:
        """
        Validate all scenes for compliance
        Returns (all_valid, compliance_records)
        """
        relevant_rules = self.rules_db.get_rules_by_topic(topic)
        rule_ids = [rule.rule_number.lower().replace(" ", "_") for rule in relevant_rules]
        
        all_valid = True
        compliance_records = []
        
        for idx, scene in enumerate(scenes):
            is_valid, notes = self.validator.validate_scene(scene, rule_ids)
            
            # Check entire scene text for explicit references
            scene_text = f"{scene.get('description', '')} {scene.get('voiceover_line', '')} {scene.get('visual_prompt', '')}"
            explicit_refs = self.validator.check_explicit_references(scene_text)
            
            if explicit_refs:
                is_valid = False
                notes += f" | Found explicit references: {', '.join(explicit_refs)}"
            
            compliance_record = SceneCompliance(
                scene_id=idx + 1,
                rules_covered=rule_ids,
                forms_referenced=[form for rule in relevant_rules for form in rule.applicable_forms],
                validation_status=is_valid,
                validation_notes=notes
            )
            
            compliance_records.append(compliance_record)
            
            if not is_valid:
                all_valid = False
        
        return all_valid, compliance_records
    
    def generate_compliance_report(
        self, 
        topic: str,
        video_id: str,
        scenes: List[Dict],
        compliance_records: List[SceneCompliance]
    ) -> Dict:
        """
        Generate internal compliance report (NOT for video display)
        This is for audit/certification purposes only
        """
        relevant_rules = self.rules_db.get_rules_by_topic(topic)
        
        report = {
            "video_id": video_id,
            "topic": topic,
            "generation_timestamp": datetime.now().isoformat(),
            "compliance_certification": "Mines Rules 1955",
            "total_scenes": len(scenes),
            "rules_addressed": {
                rule.rule_number: {
                    "chapter": rule.chapter,
                    "title": rule.title,
                    "key_requirements": rule.key_requirements,
                    "forms": rule.applicable_forms
                }
                for rule in relevant_rules
            },
            "scene_validation": [
                {
                    "scene_id": rec.scene_id,
                    "valid": rec.validation_status,
                    "notes": rec.validation_notes,
                    "rules_covered": rec.rules_covered
                }
                for rec in compliance_records
            ],
            "overall_compliance": all(rec.validation_status for rec in compliance_records),
            "disclaimer": "This report is for internal compliance tracking only. Video content does not display legal references."
        }
        
        return report
    
    def get_topic_specific_guidance(self, topic: str) -> Dict:
        """Get specific numerical requirements for a topic"""
        
        guidance = {
            "first_aid": {
                "numbers": {
                    "station_frequency_aboveground": "Every 50 workers",
                    "station_frequency_opencast": "1 per 50 persons",
                    "kit_contents": "1 large dressing, 1 small dressing, antiseptic"
                },
                "qualifications": "St. John's Ambulance Association standard",
                "location_requirements": "Accessible points near work areas"
            },
            
            "medical_examination": {
                "vision_standards": {
                    "better_eye": "6/12",
                    "worse_eye": "6/18"
                },
                "examination_intervals": {
                    "general": "Every 5 years",
                    "asbestos_workers": "Every 12 months",
                    "xray_asbestos": "Every 3 years"
                },
                "lung_tests": "FVC and FEV1 spirometry",
                "xray_equipment": "300mA minimum strength, PA chest radiograph"
            },
            
            "safety_committee": {
                "workforce_threshold": "100+ employees",
                "workmen_inspector_threshold": "500+ employees",
                "inspector_types": "Mining, Electrical, Mechanical",
                "meeting_frequency": "At least once in 30 days",
                "response_timeline": "15 days for remedial actions"
            },
            
            "sanitation": {
                "drinking_water": "2 liters per person per shift",
                "latrine_ratio_male": "1 seat per 50 males",
                "latrine_ratio_female": "1 seat per 50 females",
                "signage": "Male/Female with pictograms"
            }
        }
        
        return guidance.get(topic.lower(), {})


# Convenience function for integration
def get_compliant_video_config(topic: str, language: str = 'en') -> Dict:
    """
    Single function to get complete compliant video configuration
    Use this in your video generation pipeline
    """
    engine = ComplianceEngine()
    
    return {
        "prompt": engine.generate_compliant_prompt(topic, language),
        "context": engine.prepare_topic_context(topic),
        "guidance": engine.get_topic_specific_guidance(topic),
        "validator": engine.validator,
        "engine": engine
    }


# Example usage
if __name__ == "__main__":
    # Initialize engine
    engine = ComplianceEngine()
    
    # Test topics
    topics = [
        "first_aid",
        "medical_examination", 
        "safety_committee",
        "accident_reporting"
    ]
    
    for topic in topics:
        print(f"\n{'='*60}")
        print(f"TOPIC: {topic.upper()}")
        print('='*60)
        
        # Get compliant prompt
        prompt = engine.generate_compliant_prompt(topic)
        print("\nGENERATED PROMPT:")
        print(prompt[:500] + "...")
        
        # Get guidance
        guidance = engine.get_topic_specific_guidance(topic)
        print(f"\nSPECIFIC GUIDANCE:")
        print(json.dumps(guidance, indent=2))
        
        # Show relevant rules (internal only)
        context = engine.prepare_topic_context(topic)
        print(f"\nKEY POINTS TO COVER:")
        for point in context['key_points'][:3]:
            print(f"  - {point}")
