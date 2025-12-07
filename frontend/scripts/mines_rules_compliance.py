"""
Mines Rules 1955 Compliance Engine
Ensures video content follows regulations without displaying the act
"""

import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime


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
    
    def _initialize_rules(self) -> Dict[str, ComplianceRule]:
        """Initialize comprehensive rules database"""
        return {
            # Chapter VI - First-Aid and Medical Appliances
            "rule_40": ComplianceRule(
                rule_number="40",
                chapter="VI",
                title="Arrangements for training persons in first-aid",
                key_requirements=[
                    "Adequate training arrangements for first-aid personnel",
                    "Provision of prescribed equipment",
                    "Speedy removal arrangements to dispensary/hospital",
                    "Proper ambulance van or suitable vehicle"
                ],
                visual_elements=[
                    "First-aid training session",
                    "Equipment demonstration",
                    "Ambulance vehicle",
                    "Emergency response drill"
                ],
                forbidden_terms=["Rule 40", "Mines Rules 1955"]
            ),
            
            "rule_41": ComplianceRule(
                rule_number="41",
                chapter="VI",
                title="First-aid qualifications",
                key_requirements=[
                    "St. John's Ambulance Association (India) certificate",
                    "Qualified nurse, dresser, compounder-cum-dresser or medical practitioner",
                    "Valid first-aid certificate holder"
                ],
                visual_elements=[
                    "Certificate display (generic, not actual)",
                    "Trained personnel providing first-aid",
                    "Demonstration of proper techniques"
                ],
                forbidden_terms=["Rule 41", "St. John's certificate number"]
            ),
            
            "rule_44": ComplianceRule(
                rule_number="44",
                chapter="VI",
                title="First-aid stations",
                key_requirements=[
                    "Above ground: at shaft tops, workshops, screening plants, every 50+ workers",
                    "Opencast: 1 station per 50 persons",
                    "Below ground: shaft bottoms, haulage drives, district entrances",
                    "Equipment as per Third Schedule"
                ],
                applicable_forms=["Third Schedule"],
                visual_elements=[
                    "First-aid station signage",
                    "Equipment layout",
                    "Accessible location markers",
                    "Worker approaching station"
                ],
                forbidden_terms=["Rule 44", "Third Schedule"]
            ),
            
            "rule_45": ComplianceRule(
                rule_number="45",
                chapter="VI",
                title="Carrying of first-aid outfit by officials",
                key_requirements=[
                    "Overman, foreman, sirdar, mate, shot-firer, blaster, electrician, mechanic must carry",
                    "Outfit contents: 1 large sterilised dressing, 1 small sterilised dressing, iodine/antiseptic",
                    "Securely packed against dirt and water"
                ],
                visual_elements=[
                    "Official checking first-aid kit",
                    "Contents display (generic)",
                    "Waterproof packaging",
                    "Proper carrying method"
                ],
                forbidden_terms=["Rule 45", "specific official titles"]
            ),
            
            "rule_45a": ComplianceRule(
                rule_number="45A",
                chapter="VI",
                title="Medical attention in case of injury",
                key_requirements=[
                    "Immediate reporting of injury to official",
                    "Official arranges first-aid",
                    "Medical practitioner called if necessary",
                    "Person in charge of nearest first-aid station to render aid"
                ],
                visual_elements=[
                    "Worker reporting injury",
                    "Official responding",
                    "First-aid being administered",
                    "Communication with medical personnel"
                ],
                forbidden_terms=["Rule 45A", "specific reporting forms"]
            ),
            
            # Chapter IV-A - Medical Examination
            "rule_29b": ComplianceRule(
                rule_number="29B",
                chapter="IV-A",
                title="Initial and periodical medical examinations",
                key_requirements=[
                    "Initial exam within 5 years for current employees",
                    "Initial exam for new employees",
                    "Periodic exams every 5 years",
                    "Asbestos workers: every 12 months",
                    "X-ray every 3 years for asbestos workers"
                ],
                applicable_forms=["Form M", "Form N", "Form O", "Form P"],
                visual_elements=[
                    "Medical examination process",
                    "Vision testing (6/12, 6/18 standards)",
                    "Chest X-ray procedure",
                    "Lung function testing"
                ],
                forbidden_terms=["Rule 29B", "Form M", "Form N", "Form O", "Form P"]
            ),
            
            "rule_29f": ComplianceRule(
                rule_number="29F",
                chapter="IV-A",
                title="Standard and report of medical examination",
                key_requirements=[
                    "Initial exam per Form P standards",
                    "New employee exam per Form P-I standards",
                    "Medical certificate in Form O issued",
                    "Copy to person examined via registered post",
                    "Copy to mine manager"
                ],
                applicable_forms=["Form O", "Form P", "Form P-I"],
                visual_elements=[
                    "Medical examination checklist",
                    "Vision test: 6/12 better eye, 6/18 worse eye",
                    "Hearing test",
                    "Chest measurement",
                    "Fitness certification process"
                ],
                forbidden_terms=["Form O", "Form P", "Form P-I", "certificate number"]
            ),
            
            # Form P Standards (embedded in Rule 29F)
            "form_p": ComplianceRule(
                rule_number="Form P",
                chapter="IV-A",
                title="Medical Standard of fitness for Persons Employed",
                key_requirements=[
                    "Vision: Better eye 6/12, Worse eye 6/18",
                    "No night blindness for underground/shift workers",
                    "Good hearing, no progressive deafness",
                    "Chest X-ray: 300mA machine, PA view",
                    "Lung function tests: FVC and FEV1",
                    "No active pulmonary disease",
                    "Skeletal/nervous system: well-formed limbs, no deformity",
                    "Circulatory system: no heart/vascular disease"
                ],
                visual_elements=[
                    "Eye chart testing (6/12, 6/18 lines)",
                    "Audiometry testing",
                    "Chest X-ray imaging",
                    "Spirometry lung test",
                    "Physical examination"
                ],
                forbidden_terms=["Form P", "specific medical codes"]
            ),
            
            # Chapter IV-B - Workmen's Inspector and Safety Committee
            "rule_29q": ComplianceRule(
                rule_number="29Q",
                chapter="IV-B",
                title="Workmen's Inspector",
                key_requirements=[
                    "500+ employees: 3 inspectors (mining, electrical, mechanical)",
                    "1500+: additional inspector per 1000 workers",
                    "Qualifications: Overman/Foreman certificate",
                    "5 years experience, 2 years in current mine",
                    "30-lecture orientation training course",
                    "Inspection 2 days per week"
                ],
                visual_elements=[
                    "Inspector conducting workplace examination",
                    "Checking shafts and equipment",
                    "Documenting findings",
                    "Consulting with workers"
                ],
                forbidden_terms=["Rule 29Q", "Overman certificate number"]
            ),
            
            "rule_29r": ComplianceRule(
                rule_number="29R",
                chapter="IV-B",
                title="Duties of Workmen's Inspector",
                key_requirements=[
                    "Inspect shafts, inclines, roads, workplaces, equipment",
                    "Report urgent/immediate dangers",
                    "Suggest remedial measures",
                    "Accompany Inspector during mine inspections",
                    "Record findings in Form U register"
                ],
                applicable_forms=["Form U"],
                visual_elements=[
                    "Systematic inspection routine",
                    "Hazard identification",
                    "Documentation process",
                    "Communication with management"
                ],
                forbidden_terms=["Rule 29R", "Form U"]
            ),
            
            "rule_29s": ComplianceRule(
                rule_number="29S",
                chapter="IV-B",
                title="Action on the report of Workmen's Inspector",
                key_requirements=[
                    "Owner/agent/manager enters remarks in Form U register within 15 days",
                    "Show remedial measures taken and date",
                    "Differences of opinion referred to Chief Inspector"
                ],
                applicable_forms=["Form U"],
                visual_elements=[
                    "Management reviewing inspection report",
                    "Implementing corrective actions",
                    "Follow-up verification",
                    "Timeline tracking (15 days)"
                ],
                forbidden_terms=["Rule 29S", "Form U", "Chief Inspector name"]
            ),
            
            "rule_29t": ComplianceRule(
                rule_number="29T",
                chapter="IV-B",
                title="Safety Committee",
                key_requirements=[
                    "100+ employees: Safety Committee required",
                    "Promotes safety in the mine",
                    "Group Safety Committee option for multiple mines"
                ],
                visual_elements=[
                    "Committee meeting",
                    "Safety discussions",
                    "Collaborative problem-solving",
                    "Documentation review"
                ],
                forbidden_terms=["Rule 29T", "Committee composition details"]
            ),
            
            "rule_29u": ComplianceRule(
                rule_number="29U",
                chapter="IV-B",
                title="Composition of Safety Committee",
                key_requirements=[
                    "Manager as Chairman",
                    "5 officials/competent persons nominated by Chairman",
                    "5 workers nominated by workers/trade union",
                    "Workmen's Inspector included",
                    "Safety Officer or senior official as Secretary"
                ],
                visual_elements=[
                    "Committee members (generic representation)",
                    "Balanced worker-management participation",
                    "Meeting structure",
                    "Collaborative environment"
                ],
                forbidden_terms=["Rule 29U", "specific names/titles"]
            ),
            
            "rule_29v": ComplianceRule(
                rule_number="29V",
                chapter="IV-B",
                title="Functions of Safety Committee",
                key_requirements=[
                    "Discuss remedial measures for unsafe conditions",
                    "Review new district/equipment/technique safety measures",
                    "Discuss accident inquiry reports",
                    "Formulate safety campaigns based on accident analysis",
                    "Meet at least once in 30 days",
                    "Forum for safety and health communication"
                ],
                visual_elements=[
                    "Committee discussing hazard reports",
                    "Reviewing accident data",
                    "Planning safety campaigns",
                    "Monthly meeting schedule"
                ],
                forbidden_terms=["Rule 29V", "30-day requirement"]
            ),
            
            # Accident Reporting
            "rule_76": ComplianceRule(
                rule_number="76",
                chapter="X",
                title="Registers of reportable and minor accidents",
                key_requirements=[
                    "Reportable accidents in Form J",
                    "Minor accidents in Form K",
                    "Classification by place (underground/opencast/aboveground)",
                    "Classification by cause (ground movement/machinery/electrical/etc)"
                ],
                applicable_forms=["Form J", "Form K", "Annexure I", "Annexure II"],
                visual_elements=[
                    "Accident location categories",
                    "Cause classification system",
                    "Immediate reporting steps",
                    "Documentation process"
                ],
                forbidden_terms=["Rule 76", "Form J", "Form K", "Annexure"]
            ),
            
            # Health & Sanitation
            "rule_30": ComplianceRule(
                rule_number="30",
                chapter="V",
                title="Quantity of drinking water",
                key_requirements=[
                    "Minimum 2 liters per person per shift",
                    "Readily available at accessible points",
                    "100+ workers: mechanically cooled if required by Inspector",
                    "No charge for drinking water"
                ],
                visual_elements=[
                    "Water dispenser/tap locations",
                    "Worker accessing clean water",
                    "Cooling mechanism (if applicable)",
                    "Adequate quantity availability"
                ],
                forbidden_terms=["Rule 30", "2 liter requirement", "Inspector order"]
            ),
            
            "rule_33": ComplianceRule(
                rule_number="33",
                chapter="V",
                title="Surface latrines and urinals",
                key_requirements=[
                    "Adequate latrine and urinal accommodation",
                    "Separate for males and females",
                    "1 seat per 50 males",
                    "1 seat per 50 females",
                    "Conveniently accessible places"
                ],
                visual_elements=[
                    "Separate facility signage",
                    "Clean and maintained facilities",
                    "Accessible locations",
                    "Adequate number of units"
                ],
                forbidden_terms=["Rule 33", "50:1 ratio"]
            ),
            
            "rule_35": ComplianceRule(
                rule_number="35",
                chapter="V",
                title="Sign-boards to be displayed",
                key_requirements=[
                    "Signboard outside each latrine",
                    "'For Males' or 'For Females'",
                    "Language understood by majority",
                    "Figure of man or woman on signboard"
                ],
                visual_elements=[
                    "Clear signage with male/female symbols",
                    "Multilingual text",
                    "Visible placement",
                    "Universal pictograms"
                ],
                forbidden_terms=["Rule 35", "specific language requirements"]
            ),
        }
    
    def get_rule(self, rule_id: str) -> Optional[ComplianceRule]:
        """Get rule by ID"""
        return self.rules.get(rule_id)
    
    def get_rules_by_topic(self, topic: str) -> List[ComplianceRule]:
        """Get all rules relevant to a topic using keyword matching"""
        topic_lower = topic.lower()
        
        # Keyword-based mapping for broader topic coverage
        topic_keywords = {
            "emergency": ["rule_40", "rule_44", "rule_45", "rule_45a"],  # First-aid and emergency response
            "exit": ["rule_40", "rule_44", "rule_45", "rule_45a"],  # Emergency exits and first-aid
            "evacuation": ["rule_40", "rule_44", "rule_45", "rule_45a"],  # Emergency evacuation
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
            "ppe": ["rule_47", "rule_48"],  # Personal Protective Equipment
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
            return [self.rules[rid] for rid in ["rule_40", "rule_44", "rule_45"] if rid in self.rules]
        
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
