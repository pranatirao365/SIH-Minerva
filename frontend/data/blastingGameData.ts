// Blasting Hazard Safety Simulation - Game Data
// Converted from sihsim React version to React Native

export const BLASTING_PHASES = {
  BRIEFING: 'briefing',
  PRE_BLAST: 'pre_blast',
  BLAST_SEQUENCE: 'blast_sequence',
  POST_BLAST: 'post_blast',
  DEBRIEF: 'debrief'
} as const;

export const LANGUAGES = {
  EN: 'en',
  HI: 'hi'
} as const;

// Phase 1: Scenario Briefing
export const BRIEFING_DATA = {
  duration: 20,
  sageIntro: {
    en: "Hey there, Blaster! 💥 Today we're running a controlled blast operation.\nYour job is CRITICAL:\n1. Check the blast zone perimeter\n2. Sound evacuation alarms\n3. Guide workers to safe shelters\n4. Monitor the blast sequence\n5. Verify all-clear status\n\nYou have LIMITED TIME to make decisions. Ready? Let's go! ⚡",
    hi: "नमस्ते, ब्लास्टर! 💥 आज हम एक नियंत्रित विस्फोट ऑपरेशन चला रहे हैं।\nआपका काम महत्वपूर्ण है:\n1. ब्लास्ट ज़ोन की परिधि की जाँच करें\n2. निकासी अलार्म बजाएं\n3. कर्मचारियों को सुरक्षित आश्रयों में ले जाएं\n4. ब्लास्ट अनुक्रम की निगरानी करें\n5. सभी-स्पष्ट स्थिति सत्यापित करें\n\nनिर्णय लेने के लिए आपके पास सीमित समय है। तैयार हैं? चलिए! ⚡"
  },
  xpReward: 0
};

// Phase 2: Pre-Blast Inspection
export const PRE_BLAST_DATA = {
  duration: 40,
  timeToDetonation: 300, // 5 minutes
  
  tasks: [
    {
      id: 'perimeter_check',
      title: {
        en: 'Verify Blast Perimeter',
        hi: 'ब्लास्ट परिधि सत्यापित करें'
      },
      sagePrompt: {
        en: "First things first—check the blast perimeter! Are all workers outside the danger zone?",
        hi: "सबसे पहले—ब्लास्ट परिधि की जाँच करें! क्या सभी कर्मचारी खतरे के क्षेत्र से बाहर हैं?"
      },
      buttonText: {
        en: 'CHECK PERIMETER',
        hi: 'परिधि जाँचें'
      },
      safeCondition: true, // Will be randomized
      alertMessage: {
        en: "WORKERS TOO CLOSE! Issue evacuation order immediately!",
        hi: "कर्मचारी बहुत पास हैं! तुरंत निकासी आदेश जारी करें!"
      },
      xpReward: 50,
      timeLimit: 15
    },
    {
      id: 'evacuation_alarm',
      title: {
        en: 'Sound Evacuation Alarm',
        hi: 'निकासी अलार्म बजाएं'
      },
      sagePrompt: {
        en: "Sound three evacuation horn blasts to alert all workers!",
        hi: "सभी कर्मचारियों को सचेत करने के लिए तीन निकासी हॉर्न बजाएं!"
      },
      buttonText: {
        en: 'SOUND ALARM',
        hi: 'अलार्म बजाएं'
      },
      alarmBlasts: 3,
      xpReward: 50,
      timeLimit: 10
    },
    {
      id: 'shelter_verification',
      title: {
        en: 'Check Shelter Readiness',
        hi: 'आश्रय तैयारी जाँचें'
      },
      sagePrompt: {
        en: "Confirm all workers are in protected areas. Check each shelter!",
        hi: "पुष्टि करें कि सभी कर्मचारी संरक्षित क्षेत्रों में हैं। प्रत्येक आश्रय की जाँच करें!"
      },
      buttonText: {
        en: 'VERIFY SHELTERS',
        hi: 'आश्रय सत्यापित करें'
      },
      shelters: [
        { id: 'A', workers: 12, status: 'safe' },
        { id: 'B', workers: 8, status: 'safe' },
        { id: 'C', workers: 5, status: 'safe' }
      ],
      xpReward: 50,
      badge: {
        en: '🎖 Swift Evacuator',
        hi: '🎖 त्वरित निकासी विशेषज्ञ'
      }
    }
  ]
};

// Phase 3: Blast Sequence Monitoring
export const BLAST_SEQUENCE_DATA = {
  duration: 60,
  blastCountdown: 180, // 3 minutes
  
  blastHoles: [
    { id: 1, sequence: 1, status: 'primed' },
    { id: 2, sequence: 2, status: 'primed' },
    { id: 3, sequence: 3, status: 'primed' },
    { id: 4, sequence: 4, status: 'primed' },
    { id: 5, sequence: 5, status: 'primed' }
  ],
  
  safetyChecklist: [
    {
      id: 'perimeter',
      label: { en: 'Perimeter secure', hi: 'परिधि सुरक्षित' },
      status: 'complete'
    },
    {
      id: 'shelters',
      label: { en: 'Shelters manned', hi: 'आश्रय तैयार' },
      status: 'complete'
    },
    {
      id: 'blast_holes',
      label: { en: 'Blast holes primed', hi: 'ब्लास्ट होल तैयार' },
      status: 'complete'
    },
    {
      id: 'detonators',
      label: { en: 'Detonators checked', hi: 'डेटोनेटर जाँचे गए' },
      status: 'complete'
    },
    {
      id: 'signal_line',
      label: { en: 'Signal line clear', hi: 'सिग्नल लाइन स्पष्ट' },
      status: 'complete'
    }
  ],
  
  possibleAnomalies: [
    {
      id: 'high_seismic',
      message: {
        en: '⚠ Unusually high seismic reading on Hole #3!',
        hi: '⚠ होल #3 पर असामान्य रूप से उच्च भूकंपीय रीडिंग!'
      },
      severity: 'warning',
      triggerTime: 120
    },
    {
      id: 'flyrock_detected',
      message: {
        en: '⚠ Flyrock detected outside perimeter!',
        hi: '⚠ परिधि के बाहर फ्लाईरॉक का पता चला!'
      },
      severity: 'critical',
      triggerTime: 30
    }
  ],
  
  xpReward: 100,
  timeBonus: 20,
  badge: {
    en: '🎖 Blast Commander',
    hi: '🎖 ब्लास्ट कमांडर'
  }
};

// Phase 4: Post-Blast Verification
export const POST_BLAST_DATA = {
  duration: 40,
  
  tasks: [
    {
      id: 'crater_inspection',
      title: {
        en: 'Check Blast Crater',
        hi: 'ब्लास्ट क्रेटर जाँचें'
      },
      sagePrompt: {
        en: "The blast is done! Let's verify everything went as planned.",
        hi: "ब्लास्ट हो गया! आइए सत्यापित करें कि सब कुछ योजना के अनुसार हुआ।"
      },
      buttonText: {
        en: 'INSPECT CRATER',
        hi: 'क्रेटर निरीक्षण करें'
      },
      metrics: {
        depth: '15m',
        fragmentQuality: '80%',
        targetRange: true
      }
    },
    {
      id: 'flyrock_check',
      title: {
        en: 'Verify Flyrock Containment',
        hi: 'फ्लाईरॉक नियंत्रण सत्यापित करें'
      },
      sagePrompt: {
        en: "Check the flyrock field. Any hazards outside the perimeter?",
        hi: "फ्लाईरॉक क्षेत्र की जाँच करें। परिधि के बाहर कोई खतरा?"
      },
      buttonText: {
        en: 'CHECK FLYROCK ZONE',
        hi: 'फ्लाईरॉक क्षेत्र जाँचें'
      },
      metrics: {
        maxDistance: 145,
        expectedDistance: 160,
        controlled: true
      }
    },
    {
      id: 'reentry_clearance',
      title: {
        en: 'Clear Safe Re-entry',
        hi: 'सुरक्षित पुनः प्रवेश स्पष्ट करें'
      },
      sagePrompt: {
        en: "All clear? Authorize worker re-entry to safe zones only.",
        hi: "सब ठीक है? केवल सुरक्षित क्षेत्रों में कर्मचारी पुनः प्रवेश को अधिकृत करें।"
      },
      buttonText: {
        en: 'AUTHORIZE RE-ENTRY',
        hi: 'पुनः प्रवेश अधिकृत करें'
      },
      zones: [
        {
          id: 'red',
          label: { en: 'RED ZONE: Blast crater (no entry)', hi: 'लाल क्षेत्र: ब्लास्ट क्रेटर (प्रवेश नहीं)' },
          color: '#EF4444'
        },
        {
          id: 'yellow',
          label: { en: 'YELLOW ZONE: Flyrock field (limited entry with PPE)', hi: 'पीला क्षेत्र: फ्लाईरॉक फ़ील्ड (PPE के साथ सीमित प्रवेश)' },
          color: '#F59E0B'
        },
        {
          id: 'green',
          label: { en: 'GREEN ZONE: Safe work resumption area', hi: 'हरा क्षेत्र: सुरक्षित कार्य पुनरारंभ क्षेत्र' },
          color: '#10B981'
        }
      ]
    }
  ],
  
  xpReward: 75,
  perfectBonus: 50,
  badge: {
    en: '🎖 Safety Certified',
    hi: '🎖 सुरक्षा प्रमाणित'
  }
};

// Phase 5: Debrief & Performance Review
export const DEBRIEF_DATA = {
  duration: 30,
  
  sageDebrief: {
    en: "Excellent work today! Let's review what you did right:",
    hi: "आज उत्कृष्ट कार्य! आइए समीक्षा करें कि आपने क्या सही किया:"
  },
  
  achievements: [
    {
      id: 'evacuation',
      label: { en: '✅ Evacuated all workers in record time', hi: '✅ रिकॉर्ड समय में सभी कर्मचारियों को निकाला' }
    },
    {
      id: 'monitoring',
      label: { en: '✅ Monitored blast sequence without incidents', hi: '✅ बिना घटना के ब्लास्ट अनुक्रम की निगरानी की' }
    },
    {
      id: 'perimeters',
      label: { en: '✅ Verified safety perimeters perfectly', hi: '✅ सुरक्षा परिधियों को पूरी तरह से सत्यापित किया' }
    },
    {
      id: 'procedures',
      label: { en: '✅ Managed post-blast procedures flawlessly', hi: '✅ ब्लास्ट के बाद की प्रक्रियाओं को त्रुटिहीन रूप से प्रबंधित किया' }
    }
  ],
  
  performanceMetrics: [
    {
      id: 'evacuation_time',
      label: { en: 'Evacuation Time', hi: 'निकासी समय' },
      target: 40,
      unit: 'sec'
    },
    {
      id: 'safety_compliance',
      label: { en: 'Safety Compliance', hi: 'सुरक्षा अनुपालन' },
      target: 95,
      unit: '%'
    },
    {
      id: 'anomaly_response',
      label: { en: 'Anomaly Response', hi: 'विसंगति प्रतिक्रिया' },
      target: 'All critical',
      unit: ''
    },
    {
      id: 'worker_safety',
      label: { en: 'Worker Safety', hi: 'कर्मचारी सुरक्षा' },
      target: 0,
      unit: ' incidents'
    }
  ],
  
  grades: {
    'A+': { min: 95, label: { en: 'Excellent', hi: 'उत्कृष्ट' } },
    'A': { min: 85, label: { en: 'Very Good', hi: 'बहुत अच्छा' } },
    'B': { min: 75, label: { en: 'Good', hi: 'अच्छा' } },
    'C': { min: 65, label: { en: 'Satisfactory', hi: 'संतोषजनक' } },
    'D': { min: 50, label: { en: 'Needs Improvement', hi: 'सुधार की आवश्यकता' } }
  },
  
  xpBreakdown: {
    base: 100,
    speedrun: 50,
    perfectSafety: 50
  },
  
  badges: [
    {
      id: 'blast_master_1',
      name: { en: '🎖 Blast Master (Level 1)', hi: '🎖 ब्लास्ट मास्टर (स्तर 1)' },
      requirement: 'Complete blasting simulation'
    }
  ],
  
  certificationMessage: {
    en: "Ready to certify your blasting competency?",
    hi: "अपनी ब्लास्टिंग क्षमता को प्रमाणित करने के लिए तैयार हैं?"
  }
};

// Worker NPC positions and behaviors
export const WORKER_NPCS = [
  { id: 1, initialX: 45, initialY: 30, targetShelter: 'A', speed: 1.5 },
  { id: 2, initialX: 52, initialY: 45, targetShelter: 'A', speed: 1.3 },
  { id: 3, initialX: 38, initialY: 38, targetShelter: 'B', speed: 1.4 },
  { id: 4, initialX: 48, initialY: 55, targetShelter: 'B', speed: 1.6 },
  { id: 5, initialX: 60, initialY: 40, targetShelter: 'C', speed: 1.2 },
  { id: 6, initialX: 55, initialY: 50, targetShelter: 'C', speed: 1.5 },
  { id: 7, initialX: 42, initialY: 42, targetShelter: 'A', speed: 1.4 },
  { id: 8, initialX: 50, initialY: 35, targetShelter: 'B', speed: 1.7 }
];

// Shelter locations
export const SHELTERS = [
  { id: 'A', x: 15, y: 20, capacity: 15 },
  { id: 'B', x: 15, y: 50, capacity: 12 },
  { id: 'C', x: 15, y: 75, capacity: 10 }
];

// Blast zone danger radius
export const DANGER_ZONE = {
  centerX: 50,
  centerY: 50,
  radius: 25,
  flyrockRadius: 40
};

// Visual themes and colors
export const THEME_COLORS = {
  safe: '#10B981',
  caution: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  neutral: '#6B7280'
};

export const XP_REWARDS = {
  phaseCompletion: 50,
  perfectExecution: 50,
  speedBonus: 20,
  anomalyDetection: 25,
  zeroIncidents: 100
};

export const DIFFICULTY_LEVELS = {
  trainee: {
    label: { en: 'Trainee', hi: 'प्रशिक्षु' },
    timeMultiplier: 1.5,
    anomalyChance: 0.2
  },
  experienced: {
    label: { en: 'Experienced', hi: 'अनुभवी' },
    timeMultiplier: 1.0,
    anomalyChance: 0.5
  },
  expert: {
    label: { en: 'Expert', hi: 'विशेषज्ञ' },
    timeMultiplier: 0.7,
    anomalyChance: 0.8
  }
};
