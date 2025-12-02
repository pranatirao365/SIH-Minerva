// Roof Fall & Ground Instability Safety Simulation - Game Data
// React Native + TypeScript

export const ROOF_PHASES = {
  BRIEFING: 'briefing',
  SCAN: 'scan',
  ACTIVE_INSTABILITY: 'active_instability',
  SUPPORT: 'support',
  DEBRIEF: 'debrief'
} as const;

export type RoofInstabilityPhase = typeof ROOF_PHASES[keyof typeof ROOF_PHASES];

// Phase 1: Scenario Briefing
export const BRIEFING_DATA = {
  duration: 15,
  sageIntro: {
    en: "Welcome, Ground Inspector! 🧱 Today you're inspecting a development heading for signs of ground instability.\n\nYour critical tasks:\n1. Spot early warning signs (cracks, spalling, floor heave)\n2. Mark unsafe zones\n3. Stop work when necessary\n4. Call support teams\n5. Reclassify hazardous areas\n\nEvery second counts. Ground failure can happen FAST. Ready? Let's inspect! ⚡",
    hi: "स्वागत है, ग्राउंड इंस्पेक्टर! 🧱 आज आप जमीन की अस्थिरता के संकेतों के लिए विकास शीर्ष का निरीक्षण कर रहे हैं।\n\nआपके महत्वपूर्ण कार्य:\n1. प्रारंभिक चेतावनी संकेत खोजें (दरारें, स्पॉलिंग, फर्श उभार)\n2. असुरक्षित क्षेत्रों को चिह्नित करें\n3. आवश्यक होने पर काम बंद करें\n4. सहायता टीमों को बुलाएं\n5. खतरनाक क्षेत्रों को पुनर्वर्गीकृत करें\n\nहर सेकंड मायने रखता है। जमीन की विफलता तेजी से हो सकती है। तैयार हैं? आइए निरीक्षण करें! ⚡"
  },
  xpReward: 0
};

// Phase 2: Early Warning Scan
export const SCAN_DATA = {
  duration: 30,
  
  warningSignLocations: [
    {
      id: 'crack_roof_1',
      type: 'crack',
      x: 45,
      y: 15,
      width: 60,
      height: 3,
      severity: 'high',
      label: { en: 'Hairline crack in roof beam', hi: 'छत बीम में बाल रेखा दरार' },
      isCorrect: true,
      xpReward: 20
    },
    {
      id: 'crack_wall_left',
      type: 'crack',
      x: 10,
      y: 30,
      width: 3,
      height: 40,
      severity: 'medium',
      label: { en: 'Crack in left rib', hi: 'बाएं रिब में दरार' },
      isCorrect: true,
      xpReward: 15
    },
    {
      id: 'spalling_zone',
      type: 'spalling',
      x: 70,
      y: 20,
      radius: 15,
      severity: 'high',
      label: { en: 'Fresh spalling zone', hi: 'ताजा स्पॉलिंग क्षेत्र' },
      isCorrect: true,
      xpReward: 25
    },
    {
      id: 'floor_bulge',
      type: 'floor_heave',
      x: 50,
      y: 85,
      width: 40,
      height: 8,
      severity: 'medium',
      label: { en: 'Floor bulging upward', hi: 'फर्श ऊपर की ओर उभार' },
      isCorrect: true,
      xpReward: 20
    },
    {
      id: 'bolt_bend',
      type: 'bolt_failure',
      x: 35,
      y: 18,
      radius: 8,
      severity: 'high',
      label: { en: 'Roof bolt bending', hi: 'छत बोल्ट झुक रहा है' },
      isCorrect: true,
      xpReward: 25
    },
    // Decoy/false positive zones
    {
      id: 'water_stain',
      type: 'decoy',
      x: 85,
      y: 60,
      radius: 12,
      severity: 'low',
      label: { en: 'Old water stain', hi: 'पुराना पानी का दाग' },
      isCorrect: false,
      xpReward: -10
    },
    {
      id: 'paint_mark',
      type: 'decoy',
      x: 20,
      y: 70,
      radius: 8,
      severity: 'low',
      label: { en: 'Survey paint mark', hi: 'सर्वेक्षण पेंट चिह्न' },
      isCorrect: false,
      xpReward: -10
    }
  ],
  
  audioEvents: [
    { id: 'rock_pop_1', time: 8, label: { en: '🔊 Rock popping sound', hi: '🔊 चट्टान फटने की आवाज' } },
    { id: 'small_fall', time: 18, label: { en: '🔊 Small rocks falling', hi: '🔊 छोटी चट्टानें गिर रही हैं' } },
    { id: 'crack_extend', time: 25, label: { en: '🔊 Crack extending', hi: '🔊 दरार विस्तारित हो रही है' } }
  ],
  
  targetDetections: 5, // Need to find 5 real warning signs
  xpReward: 100,
  badge: {
    en: '🎖 Early Spotter',
    hi: '🎖 प्रारंभिक स्पॉटर'
  }
};

// Phase 3: Active Instability Management
export const ACTIVE_INSTABILITY_DATA = {
  duration: 40,
  
  tasks: [
    {
      id: 'mark_unsafe_zone',
      title: {
        en: 'Mark Unsafe Zone Boundaries',
        hi: 'असुरक्षित क्षेत्र सीमाएं चिह्नित करें'
      },
      sagePrompt: {
        en: "The roof is deteriorating! Mark the danger zone boundaries NOW.",
        hi: "छत खराब हो रही है! खतरे के क्षेत्र की सीमाओं को अभी चिह्नित करें।"
      },
      instructions: {
        en: "Tap corners to draw RED boundary around unstable area",
        hi: "अस्थिर क्षेत्र के चारों ओर लाल सीमा खींचने के लिए कोनों पर टैप करें"
      },
      targetCoverage: 80, // Minimum 80% coverage of danger zone
      xpReward: 50,
      timeLimit: 20
    },
    {
      id: 'place_barricade',
      title: {
        en: 'Place "DO NOT ENTER" Barricade',
        hi: '"प्रवेश न करें" बैरिकेड लगाएं'
      },
      sagePrompt: {
        en: "Block access to the heading entrance immediately!",
        hi: "शीर्ष प्रवेश द्वार तक पहुंच को तुरंत अवरुद्ध करें!"
      },
      buttonText: {
        en: 'PLACE BARRICADE',
        hi: 'बैरिकेड लगाएं'
      },
      xpReward: 30
    },
    {
      id: 'stop_work_decision',
      title: {
        en: 'Critical Decision: Stop Work?',
        hi: 'महत्वपूर्ण निर्णय: काम रोकें?'
      },
      sagePrompt: {
        en: "Cracks are growing and rocks falling. What's your call?",
        hi: "दरारें बढ़ रही हैं और चट्टानें गिर रही हैं। आपका निर्णय क्या है?"
      },
      options: [
        {
          id: 'stop_evacuate',
          label: { en: '🚫 STOP WORK & EVACUATE', hi: '🚫 काम बंद करें और निकासी करें' },
          isCorrect: true,
          xpReward: 50,
          feedback: {
            en: '✅ CORRECT! Safety first. Evacuation initiated.',
            hi: '✅ सही! सुरक्षा पहले। निकासी शुरू की गई।'
          }
        },
        {
          id: 'continue_work',
          label: { en: '⚙ CONTINUE WORK', hi: '⚙ काम जारी रखें' },
          isCorrect: false,
          xpReward: -50,
          feedback: {
            en: '❌ WRONG! Continuing work risks lives. Major safety violation.',
            hi: '❌ गलत! काम जारी रखने से जीवन जोखिम में है। प्रमुख सुरक्षा उल्लंघन।'
          }
        }
      ]
    }
  ],
  
  anomalies: [
    {
      id: 'rock_fall_1',
      triggerTime: 10,
      message: {
        en: '⚠ ALERT: Small rock fall in front of you!',
        hi: '⚠ अलर्ट: आपके सामने छोटी चट्टान गिरी!'
      },
      severity: 'warning'
    },
    {
      id: 'crack_growth',
      triggerTime: 20,
      message: {
        en: '⚠ CRITICAL: Roof crack extending rapidly!',
        hi: '⚠ गंभीर: छत की दरार तेजी से बढ़ रही है!'
      },
      severity: 'critical'
    },
    {
      id: 'bolt_failure',
      triggerTime: 30,
      message: {
        en: '⚠ DANGER: Roof bolt failed! Plate hanging loose!',
        hi: '⚠ खतरा: छत का बोल्ट टूट गया! प्लेट ढीली लटकी हुई है!'
      },
      severity: 'critical'
    }
  ],
  
  xpReward: 130,
  badge: {
    en: '🎖 Ground Guardian',
    hi: '🎖 ग्राउंड गार्डियन'
  }
};

// Phase 4: Call Support & Reclassify Area
export const SUPPORT_DATA = {
  duration: 30,
  
  supportOptions: [
    {
      id: 'ground_control',
      label: { en: 'Ground Control Team', hi: 'ग्राउंड कंट्रोल टीम' },
      icon: '👷‍♂️',
      isRequired: true
    },
    {
      id: 'supervisor',
      label: { en: 'Mine Supervisor', hi: 'खान पर्यवेक्षक' },
      icon: '👨‍💼',
      isRequired: true
    },
    {
      id: 'engineer',
      label: { en: 'Mining Engineer', hi: 'खनन इंजीनियर' },
      icon: '👷',
      isRequired: false
    },
    {
      id: 'rescue',
      label: { en: 'Rescue Team', hi: 'बचाव दल' },
      icon: '🚨',
      isRequired: false
    }
  ],
  
  supportActions: [
    {
      id: 'install_support',
      label: { en: 'Install additional roof support', hi: 'अतिरिक्त छत समर्थन स्थापित करें' },
      icon: '🔩',
      isRecommended: true
    },
    {
      id: 'reclassify',
      label: { en: 'Reclassify heading as "No Entry"', hi: 'शीर्ष को "प्रवेश नहीं" के रूप में पुनर्वर्गीकृत करें' },
      icon: '🚫',
      isRecommended: true
    },
    {
      id: 'monitoring',
      label: { en: 'Install monitoring instruments', hi: 'निगरानी उपकरण स्थापित करें' },
      icon: '📊',
      isRecommended: true
    },
    {
      id: 'wait',
      label: { en: 'Wait and monitor only', hi: 'केवल प्रतीक्षा करें और निगरानी करें' },
      icon: '⏳',
      isRecommended: false
    }
  ],
  
  riskLevels: [
    { id: 'low', label: { en: 'LOW', hi: 'कम' }, color: '#10B981', isCorrect: false },
    { id: 'medium', label: { en: 'MEDIUM', hi: 'मध्यम' }, color: '#F59E0B', isCorrect: false },
    { id: 'high', label: { en: 'HIGH', hi: 'उच्च' }, color: '#EF4444', isCorrect: true },
    { id: 'critical', label: { en: 'CRITICAL', hi: 'गंभीर' }, color: '#991B1B', isCorrect: true }
  ],
  
  xpReward: 100,
  badge: {
    en: '🎖 Support Coordinator',
    hi: '🎖 समर्थन समन्वयक'
  }
};

// Phase 5: Debrief & Performance Review
export const DEBRIEF_DATA = {
  duration: 20,
  
  sageDebrief: {
    en: "Inspection complete! Let's review your performance:",
    hi: "निरीक्षण पूर्ण! आइए आपके प्रदर्शन की समीक्षा करें:"
  },
  
  performanceMetrics: [
    {
      id: 'warning_detection',
      label: { en: 'Early Warning Detection', hi: 'प्रारंभिक चेतावनी पहचान' },
      unit: 'signs',
      target: 5
    },
    {
      id: 'boundary_coverage',
      label: { en: 'Unsafe Zone Marking', hi: 'असुरक्षित क्षेत्र चिह्नन' },
      unit: '%',
      target: 80
    },
    {
      id: 'decision_time',
      label: { en: 'Decision Time (Stop Work)', hi: 'निर्णय समय (काम रोकें)' },
      unit: 'sec',
      target: 15
    },
    {
      id: 'support_accuracy',
      label: { en: 'Support Call Accuracy', hi: 'समर्थन कॉल सटीकता' },
      unit: '%',
      target: 100
    },
    {
      id: 'risk_classification',
      label: { en: 'Risk Level Classification', hi: 'जोखिम स्तर वर्गीकरण' },
      unit: '',
      target: 'Correct'
    }
  ],
  
  grades: {
    'A+': {
      min: 95,
      label: { en: 'Excellent - Master Inspector', hi: 'उत्कृष्ट - मास्टर इंस्पेक्टर' },
      xpBonus: 100
    },
    'A': {
      min: 85,
      label: { en: 'Very Good - Expert Inspector', hi: 'बहुत अच्छा - विशेषज्ञ इंस्पेक्टर' },
      xpBonus: 75
    },
    'B': {
      min: 75,
      label: { en: 'Good - Competent Inspector', hi: 'अच्छा - सक्षम इंस्पेक्टर' },
      xpBonus: 50
    },
    'C': {
      min: 65,
      label: { en: 'Satisfactory - Needs Practice', hi: 'संतोषजनक - अभ्यास की आवश्यकता' },
      xpBonus: 25
    },
    'D': {
      min: 0,
      label: { en: 'Poor - Requires Retraining', hi: 'खराब - पुनः प्रशिक्षण आवश्यक' },
      xpBonus: 0
    }
  },
  
  badges: [
    {
      id: 'early_spotter',
      name: { en: '🎖 Early Spotter', hi: '🎖 प्रारंभिक स्पॉटर' },
      requirement: 'Detect all warning signs quickly'
    },
    {
      id: 'ground_guardian',
      name: { en: '🎖 Ground Guardian', hi: '🎖 ग्राउंड गार्डियन' },
      requirement: 'Perfect unsafe zone marking'
    },
    {
      id: 'zero_exposure',
      name: { en: '🎖 Zero Exposure', hi: '🎖 शून्य एक्सपोजर' },
      requirement: 'Stop work immediately when needed'
    },
    {
      id: 'roof_master',
      name: { en: '🎖 Roof Fall Master', hi: '🎖 छत गिरने का मास्टर' },
      requirement: 'Complete simulation with A+ grade'
    }
  ],
  
  certificationMessage: {
    en: "Ready to certify your ground inspection competency?",
    hi: "अपनी जमीन निरीक्षण क्षमता को प्रमाणित करने के लिए तैयार हैं?"
  }
};

// Visual themes and colors (aligned with app's design system)
export const THEME_COLORS = {
  primary: '#FF6B00',    // App's primary orange
  safe: '#10B981',       // App's accent/success green
  suspicious: '#F59E0B', // Warning amber
  danger: '#EF4444',     // App's destructive red
  critical: '#991B1B',   // Dark red
  info: '#3B82F6',       // Info blue
  neutral: '#6B7280',    // Neutral gray
  background: '#0A0A0A', // App's background
  card: '#1A1A1A',       // App's card background
  border: '#27272A',     // App's border
  text: '#FAFAFA',       // App's text color
  textMuted: '#A1A1AA'   // App's muted text
};

export const XP_REWARDS = {
  phaseCompletion: 50,
  perfectDetection: 100,
  quickDecision: 50,
  correctSupport: 50,
  zeroExposure: 100
};

// Tunnel dimensions for visualization
export const TUNNEL_DIMENSIONS = {
  width: 100,
  height: 100,
  dangerZoneRadius: 40
};

// Image URLs (using Unsplash for underground mine tunnels - darker, more suitable images)
export const IMAGE_URLS = {
  tunnel_stable: 'https://images.unsplash.com/photo-1601024445121-e5b82f020549?w=1920&q=80&fit=crop',
  tunnel_cracks: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1920&q=80&fit=crop',
  tunnel_damaged: 'https://images.unsplash.com/photo-1504197832061-98356e3dcdcf?w=1920&q=80&fit=crop',
  office: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80&fit=crop',
  support_crew: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=80&fit=crop'
};
