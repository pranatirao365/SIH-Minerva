import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  Alert,
  Modal,
  PanResponder,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/styles';

// Equipment database with work types and explanations
const EQUIPMENT_DATABASE = {
  'Hard Hat': {
    id: 1,
    name: 'Hard Hat',
    icon: '⛑️',
    usedFor: ['Blasting', 'Drilling', 'Transportation', 'Maintenance', 'Roof Bolting'],
    description: 'Protects head from falling objects and debris',
    isUniversal: true
  },
  'Safety Goggles': {
    id: 2,
    name: 'Safety Goggles',
    icon: '🥽',
    usedFor: ['Blasting', 'Drilling', 'Cutting', 'Welding'],
    description: 'Protects eyes from dust, debris, and sparks'
  },
  'Respirator': {
    id: 3,
    name: 'Respirator',
    icon: '😷',
    usedFor: ['Blasting', 'Drilling', 'Chemical Handling'],
    description: 'Filters harmful dust, gases, and fumes'
  },
  'Safety Gloves': {
    id: 4,
    name: 'Safety Gloves',
    icon: '🧤',
    usedFor: ['Drilling', 'Transportation', 'Maintenance', 'Chemical Handling'],
    description: 'Protects hands from cuts, abrasions, and chemicals'
  },
  'Steel-Toe Boots': {
    id: 5,
    name: 'Steel-Toe Boots',
    icon: '🥾',
    usedFor: ['Blasting', 'Drilling', 'Transportation', 'Maintenance', 'Roof Bolting'],
    description: 'Protects feet from heavy falling objects',
    isUniversal: true
  },
  'Ear Plugs': {
    id: 6,
    name: 'Ear Plugs',
    icon: '👂',
    usedFor: ['Blasting', 'Drilling', 'Heavy Machinery'],
    description: 'Protects hearing from loud noise'
  },
  'High-Vis Vest': {
    id: 7,
    name: 'High-Vis Vest',
    icon: '🦺',
    usedFor: ['Transportation', 'Maintenance', 'Outdoor Work'],
    description: 'Makes worker visible in low-light conditions',
    isUniversal: true
  },
  'Welding Helmet': {
    id: 8,
    name: 'Welding Helmet',
    icon: '🎭',
    usedFor: ['Welding', 'Cutting'],
    description: 'Protects face and eyes from welding arc and sparks',
    wrongFor: 'Only for welding operations'
  },
  'Harness': {
    id: 9,
    name: 'Safety Harness',
    icon: '🪢',
    usedFor: ['Roof Bolting', 'Height Work'],
    description: 'Prevents falls when working at heights',
    wrongFor: 'Only for work at heights'
  },
  'Fire Suit': {
    id: 10,
    name: 'Fire Resistant Suit',
    icon: '🧯',
    usedFor: ['Firefighting', 'Emergency Response'],
    description: 'Protects from fire and extreme heat',
    wrongFor: 'Only for firefighting and emergency situations'
  },
  'Gas Detector': {
    id: 11,
    name: 'Gas Detector',
    icon: '📟',
    usedFor: ['Chemical Handling', 'Underground Work'],
    description: 'Detects dangerous gases in the environment'
  },
  'Knee Pads': {
    id: 12,
    name: 'Knee Pads',
    icon: '🦵',
    usedFor: ['Maintenance', 'Roof Bolting'],
    description: 'Protects knees during kneeling work'
  }
};

// Work scenarios with required equipment
const WORK_SCENARIOS = [
  {
    id: 1,
    name: 'Blasting Operations',
    description: 'Preparing and executing controlled explosions',
    required: ['Hard Hat', 'Safety Goggles', 'Respirator', 'Ear Plugs', 'Steel-Toe Boots', 'High-Vis Vest'],
    danger: 'Flying debris, loud noise, dust, and shock waves'
  },
  {
    id: 2,
    name: 'Drilling Operations',
    description: 'Operating drilling machinery for rock excavation',
    required: ['Hard Hat', 'Safety Goggles', 'Respirator', 'Safety Gloves', 'Steel-Toe Boots', 'Ear Plugs'],
    danger: 'Dust, noise, flying rock chips, and heavy machinery'
  },
  {
    id: 3,
    name: 'Material Transportation',
    description: 'Moving materials and equipment around the mine',
    required: ['Hard Hat', 'Safety Gloves', 'Steel-Toe Boots', 'High-Vis Vest'],
    danger: 'Heavy loads, moving vehicles, and slips'
  },
  {
    id: 4,
    name: 'Equipment Maintenance',
    description: 'Repairing and maintaining mining equipment',
    required: ['Hard Hat', 'Safety Gloves', 'Steel-Toe Boots', 'High-Vis Vest', 'Knee Pads'],
    danger: 'Moving parts, oil spills, and heavy tools'
  },
  {
    id: 5,
    name: 'Roof Bolting',
    description: 'Installing support bolts in mine roof',
    required: ['Hard Hat', 'Steel-Toe Boots', 'Harness', 'Safety Gloves', 'Knee Pads'],
    danger: 'Working at heights and falling rocks'
  }
];

// Draggable Equipment Item Component
const DraggableEquipment = ({ equipment, position, isWrong, onSelect, onPositionChange, index }) => {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gesture) => {
        setIsDragging(false);
        pan.flattenOffset();
        
        // Check if it was a tap (not a drag)
        if (Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5) {
          onSelect(equipment);
        } else {
          // Update position after drag
          onPositionChange(index, {
            x: pan.x._value,
            y: pan.y._value
          });
        }
      }
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.scatteredItem,
        {
          top: position.top,
          left: position.left,
          transform: [
            { rotate: `${position.rotation}deg` },
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: isDragging ? 1.1 : 1 }
          ]
        },
        isWrong && styles.scatteredItemWrong
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.itemShadow, isWrong && styles.itemShadowWrong, isDragging && styles.itemDragging]}>
        <Text style={styles.scatteredIcon}>{equipment.icon}</Text>
        <Text style={styles.scatteredName}>{equipment.translatedName}</Text>
        {isWrong && <Text style={styles.wrongMark}>❌</Text>}
      </View>
    </Animated.View>
  );
};

export default function TheSecondSkinGame() {
  const router = useRouter();
  const [gameState, setGameState] = useState('intro'); // intro, playing, results
  const [currentScenario, setCurrentScenario] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [shuffledEquipment, setShuffledEquipment] = useState([]);
  const [equipmentPositions, setEquipmentPositions] = useState([]);
  const [wrongSelections, setWrongSelections] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackItem, setFeedbackItem] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [gameStarted, setGameStarted] = useState(false);
  const [language, setLanguage] = useState('en'); // en, hi, te

  // Translations
  const translations = {
    en: {
      gameTitle: 'The Second Skin Game',
      gameSubtitle: 'Safety Equipment Selection Challenge',
      howToPlay: 'How to Play:',
      instruction1: "You'll be assigned a mining work scenario",
      instruction2: 'Select ALL the correct safety equipment needed',
      instruction3: "Wrong selections will show you why they're incorrect",
      instruction4: 'Complete within 90 seconds for bonus points',
      instruction5: 'Aim for 100% accuracy to become a safety champion!',
      startGame: 'Start Game',
      back: 'Back',
      collected: 'Collected:',
      noItems: 'No items collected yet',
      finishCheck: 'Finish & Check Results',
      incorrectSelection: 'Incorrect Selection',
      gotIt: 'Got it!',
      correctUsage: 'Correct Usage:',
      why: 'Why:',
      gameResults: 'Game Results',
      perfect: 'Perfect! Safety Champion!',
      excellent: 'Excellent Work!',
      good: 'Good Effort!',
      needPractice: 'Need More Practice',
      summary: 'Summary',
      scenario: 'Scenario:',
      correctSelections: 'Correct Selections:',
      wrongSelections: 'Wrong Selections:',
      timeUsed: 'Time Used:',
      seconds: 'seconds',
      missed: 'You Missed These Essential Items:',
      withoutThis: 'Without this, you risk serious injury!',
      incorrect: 'Incorrect Selections:',
      usedFor: 'Used for:',
      safetyTips: 'Safety Tips:',
      tip1: 'Always assess the specific hazards of your assigned task',
      tip2: 'Universal PPE (Hard Hat, Steel-Toe Boots) are needed for most tasks',
      tip3: 'Blasting and drilling require respiratory and hearing protection',
      tip4: 'High visibility gear is crucial when vehicles are present',
      tip5: 'Height work always requires fall protection harness',
      playAgain: 'Play Again',
      exit: 'Exit',
      tapInstruction: 'Tap to pick up • Hold & drag to move items if overlapped',
      hazards: 'Hazards:',
      notRequired: 'is not required for',
      language: 'Language',
      // Equipment names
      hardHat: 'Hard Hat',
      safetyGoggles: 'Safety Goggles',
      respirator: 'Respirator',
      safetyGloves: 'Safety Gloves',
      steelToeBoots: 'Steel-Toe Boots',
      earPlugs: 'Ear Plugs',
      highVisVest: 'High-Vis Vest',
      weldingHelmet: 'Welding Helmet',
      safetyHarness: 'Safety Harness',
      fireResistantSuit: 'Fire Resistant Suit',
      gasDetector: 'Gas Detector',
      kneePads: 'Knee Pads',
      // Equipment descriptions
      hardHatDesc: 'Protects head from falling objects and debris',
      safetyGogglesDesc: 'Protects eyes from dust, debris, and sparks',
      respiratorDesc: 'Filters harmful dust, gases, and fumes',
      safetyGlovesDesc: 'Protects hands from cuts, abrasions, and chemicals',
      steelToeBootsDesc: 'Protects feet from heavy falling objects',
      earPlugsDesc: 'Protects hearing from loud noise',
      highVisVestDesc: 'Makes worker visible in low-light conditions',
      weldingHelmetDesc: 'Protects face and eyes from welding arc and sparks',
      safetyHarnessDesc: 'Prevents falls when working at heights',
      fireResistantSuitDesc: 'Protects from fire and extreme heat',
      gasDetectorDesc: 'Detects dangerous gases in the environment',
      kneePadsDesc: 'Protects knees during kneeling work',
      // Scenario names
      blastingOps: 'Blasting Operations',
      drillingOps: 'Drilling Operations',
      materialTransport: 'Material Transportation',
      equipmentMaintenance: 'Equipment Maintenance',
      roofBolting: 'Roof Bolting',
      // Scenario descriptions
      blastingOpsDesc: 'Preparing and executing controlled explosions',
      drillingOpsDesc: 'Operating drilling machinery for rock excavation',
      materialTransportDesc: 'Moving materials and equipment around the mine',
      equipmentMaintenanceDesc: 'Repairing and maintaining mining equipment',
      roofBoltingDesc: 'Installing support bolts in mine roof',
      // Scenario dangers
      blastingOpsDanger: 'Flying debris, loud noise, dust, and shock waves',
      drillingOpsDanger: 'Dust, noise, flying rock chips, and heavy machinery',
      materialTransportDanger: 'Heavy loads, moving vehicles, and slips',
      equipmentMaintenanceDanger: 'Moving parts, oil spills, and heavy tools',
      roofBoltingDanger: 'Working at heights and falling rocks',
      // Work types
      blasting: 'Blasting',
      drilling: 'Drilling',
      transportation: 'Transportation',
      maintenance: 'Maintenance',
      cutting: 'Cutting',
      welding: 'Welding',
      chemicalHandling: 'Chemical Handling',
      heavyMachinery: 'Heavy Machinery',
      outdoorWork: 'Outdoor Work',
      heightWork: 'Height Work',
      firefighting: 'Firefighting',
      emergencyResponse: 'Emergency Response',
      undergroundWork: 'Underground Work'
    },
    hi: {
      gameTitle: 'द सेकंड स्किन गेम',
      gameSubtitle: 'सुरक्षा उपकरण चयन चुनौती',
      howToPlay: 'कैसे खेलें:',
      instruction1: 'आपको एक खनन कार्य परिदृश्य सौंपा जाएगा',
      instruction2: 'सभी आवश्यक सुरक्षा उपकरण चुनें',
      instruction3: 'गलत चयन आपको बताएगा कि वे गलत क्यों हैं',
      instruction4: 'बोनस अंकों के लिए 90 सेकंड में पूरा करें',
      instruction5: 'सुरक्षा चैंपियन बनने के लिए 100% सटीकता का लक्ष्य रखें!',
      startGame: 'खेल शुरू करें',
      back: 'वापस',
      collected: 'एकत्रित:',
      noItems: 'अभी तक कोई वस्तु एकत्रित नहीं',
      finishCheck: 'समाप्त करें और परिणाम जांचें',
      incorrectSelection: 'गलत चयन',
      gotIt: 'समझ गया!',
      correctUsage: 'सही उपयोग:',
      why: 'क्यों:',
      gameResults: 'खेल परिणाम',
      perfect: 'बिल्कुल सही! सुरक्षा चैंपियन!',
      excellent: 'उत्कृष्ट काम!',
      good: 'अच्छा प्रयास!',
      needPractice: 'अधिक अभ्यास की आवश्यकता है',
      summary: 'सारांश',
      scenario: 'परिदृश्य:',
      correctSelections: 'सही चयन:',
      wrongSelections: 'गलत चयन:',
      timeUsed: 'उपयोग किया गया समय:',
      seconds: 'सेकंड',
      missed: 'आपने ये आवश्यक वस्तुएं छोड़ दीं:',
      withoutThis: 'इसके बिना, आप गंभीर चोट का जोखिम उठाते हैं!',
      incorrect: 'गलत चयन:',
      usedFor: 'के लिए उपयोग किया जाता है:',
      safetyTips: 'सुरक्षा सुझाव:',
      tip1: 'हमेशा अपने सौंपे गए कार्य के विशिष्ट खतरों का आकलन करें',
      tip2: 'अधिकांश कार्यों के लिए सार्वभौमिक पीपीई (हार्ड हैट, स्टील-टो बूट्स) की आवश्यकता होती है',
      tip3: 'विस्फोट और ड्रिलिंग के लिए श्वसन और श्रवण सुरक्षा की आवश्यकता होती है',
      tip4: 'वाहन मौजूद होने पर उच्च दृश्यता गियर महत्वपूर्ण है',
      tip5: 'ऊंचाई पर काम के लिए हमेशा गिरावट सुरक्षा हार्नेस की आवश्यकता होती है',
      playAgain: 'फिर से खेलें',
      exit: 'बाहर निकलें',
      tapInstruction: 'उठाने के लिए टैप करें • ओवरलैप होने पर आइटम को होल्ड करें और ड्रैग करें',
      hazards: 'खतरे:',
      notRequired: 'के लिए आवश्यक नहीं है',
      language: 'भाषा'
    },
    te: {
      gameTitle: 'ది సెకండ్ స్కిన్ గేమ్',
      gameSubtitle: 'భద్రతా పరికరాల ఎంపిక సవాలు',
      howToPlay: 'ఎలా ఆడాలి:',
      instruction1: 'మీకు ఒక మైనింగ్ పని దృశ్యం కేటాయించబడుతుంది',
      instruction2: 'అవసరమైన అన్ని సరైన భద్రతా పరికరాలను ఎంచుకోండి',
      instruction3: 'తప్పు ఎంపికలు అవి ఎందుకు తప్పు అని మీకు చూపిస్తాయి',
      instruction4: 'బోనస్ పాయింట్ల కోసం 90 సెకన్లలో పూర్తి చేయండి',
      instruction5: 'భద్రతా ఛాంపియన్ కావడానికి 100% ఖచ్చితత్వం లక్ష్యంగా పెట్టుకోండి!',
      startGame: 'గేమ్ ప్రారంభించండి',
      back: 'వెనుకకు',
      collected: 'సేకరించినవి:',
      noItems: 'ఇంకా ఏ వస్తువులు సేకరించబడలేదు',
      finishCheck: 'ముగించండి & ఫలితాలను తనిఖీ చేయండి',
      incorrectSelection: 'తప్పు ఎంపిక',
      gotIt: 'అర్థమైంది!',
      correctUsage: 'సరైన వినియోగం:',
      why: 'ఎందుకు:',
      gameResults: 'గేమ్ ఫలితాలు',
      perfect: 'పరిపూర్ణం! భద్రతా ఛాంపియన్!',
      excellent: 'అద్భుతమైన పని!',
      good: 'మంచి ప్రయత్నం!',
      needPractice: 'మరింత అభ్యాసం అవసరం',
      summary: 'సారాంశం',
      scenario: 'దృశ్యం:',
      correctSelections: 'సరైన ఎంపికలు:',
      wrongSelections: 'తప్పు ఎంపికలు:',
      timeUsed: 'ఉపయోగించిన సమయం:',
      seconds: 'సెకన్లు',
      missed: 'మీరు ఈ ముఖ్యమైన వస్తువులను వదిలిపెట్టారు:',
      withoutThis: 'ఇది లేకుండా, మీరు తీవ్రమైన గాయం ప్రమాదంలో ఉన్నారు!',
      incorrect: 'తప్పు ఎంపికలు:',
      usedFor: 'దీని కోసం ఉపయోగించబడుతుంది:',
      safetyTips: 'భద్రతా చిట్కాలు:',
      tip1: 'మీ కేటాయించిన పని యొక్క నిర్దిష్ట ప్రమాదాలను ఎల్లప్పుడూ అంచనా వేయండి',
      tip2: 'చాలా పనులకు యూనివర్సల్ PPE (హార్డ్ హ్యాట్, స్టీల్-టో బూట్స్) అవసరం',
      tip3: 'బ్లాస్టింగ్ మరియు డ్రిల్లింగ్‌కు శ్వాసకోశ మరియు వినికిడి రక్షణ అవసరం',
      tip4: 'వాహనాలు ఉన్నప్పుడు అధిక దృశ్యమానత గేర్ కీలకం',
      tip5: 'ఎత్తులో పని చేసేటప్పుడు ఎల్లప్పుడూ పతన రక్షణ హార్నెస్ అవసరం',
      playAgain: 'మళ్లీ ఆడండి',
      exit: 'నిష్క్రమించండి',
      tapInstruction: 'తీయడానికి ట్యాప్ చేయండి • అతివ్యాప్తి చెందితే వస్తువులను పట్టుకుని లాగండి',
      hazards: 'ప్రమాదాలు:',
      notRequired: 'దీని కోసం అవసరం లేదు',
      language: 'భాష',
      // Equipment names in Telugu
      hardHat: 'హార్డ్ హ్యాట్',
      safetyGoggles: 'సేఫ్టీ గాగుల్స్',
      respirator: 'రెస్పిరేటర్',
      safetyGloves: 'సేఫ్టీ గ్లవ్స్',
      steelToeBoots: 'స్టీల్-టో బూట్స్',
      earPlugs: 'ఇయర్ పట్లగ్స్',
      highVisVest: 'హై-విజ్ వెస్ట్',
      weldingHelmet: 'వెల్డింగ్ హెల్మెట్',
      safetyHarness: 'సేఫ్టీ హార్నెస్',
      fireResistantSuit: 'ఫైర్ రెసిస్టెంట్ సూట్',
      gasDetector: 'గ్యాస్ డిటెక్టర్',
      kneePads: 'నీ ప్యాడ్స్',
      // Equipment descriptions in Telugu
      hardHatDesc: 'పడిపోయే వస్తువులు మరియు శిధిలాల నుండి తలను రక్షిస్తుంది',
      safetyGogglesDesc: 'ధూళి, శిధిలాలు మరియు స్పార్క్స్ నుండి కళ్ళను రక్షిస్తుంది',
      respiratorDesc: 'హానికరమైన ధూళి, వాయువులు మరియు పొగలను ఫిల్టర్ చేస్తుంది',
      safetyGlovesDesc: 'కోతలు, రాపిడి మరియు రసాయనాల నుండి చేతులను రక్షిస్తుంది',
      steelToeBootsDesc: 'భారీ పడిపోయే వస్తువుల నుండి పాదాలను రక్షిస్తుంది',
      earPlugsDesc: 'బిగ్గరగా శబ్దం నుండి వినికిడిని రక్షిస్తుంది',
      highVisVestDesc: 'తక్కువ-కాంతి పరిస్థితుల్లో కార్మికుడిని కనిపించేలా చేస్తుంది',
      weldingHelmetDesc: 'వెల్డింగ్ ఆర్క్ మరియు స్పార్క్స్ నుండి ముఖం మరియు కళ్ళను రక్షిస్తుంది',
      safetyHarnessDesc: 'ఎత్తులో పని చేసేటప్పుడు పతనాలను నివారిస్తుంది',
      fireResistantSuitDesc: 'అగ్ని మరియు విపరీతమైన వేడి నుండి రక్షిస్తుంది',
      gasDetectorDesc: 'వాతావరణంలో ప్రమాదకరమైన వాయువులను గుర్తిస్తుంది',
      kneePadsDesc: 'మోకాళ్లపై పని చేసేటప్పుడు మోకాళ్లను రక్షిస్తుంది',
      // Scenario names in Telugu
      blastingOps: 'బ్లాస్టింగ్ కార్యకలాపాలు',
      drillingOps: 'డ్రిల్లింగ్ కార్యకలాపాలు',
      materialTransport: 'మెటీరియల్ రవాణా',
      equipmentMaintenance: 'పరికరాల నిర్వహణ',
      roofBolting: 'రూఫ్ బోల్టింగ్',
      // Scenario descriptions in Telugu
      blastingOpsDesc: 'నియంత్రిత పేలుళ్లను సిద్ధం చేయడం మరియు అమలు చేయడం',
      drillingOpsDesc: 'రాక్ త్రవ్వకం కోసం డ్రిల్లింగ్ యంత్రాలను నడపడం',
      materialTransportDesc: 'గని చుట్టూ పదార్థాలు మరియు పరికరాలను తరలించడం',
      equipmentMaintenanceDesc: 'మైనింగ్ పరికరాలను మరమ్మత్తు చేయడం మరియు నిర్వహించడం',
      roofBoltingDesc: 'గని పైకప్పులో సపోర్ట్ బోల్ట్‌లను వ్యవస్థాపించడం',
      // Scenario dangers in Telugu
      blastingOpsDanger: 'ఎగిరే శిధిలాలు, బిగ్గరగా శబ్దం, ధూళి మరియు షాక్ వేవ్స్',
      drillingOpsDanger: 'ధూళి, శబ్దం, ఎగిరే రాక్ చిప్స్ మరియు భారీ యంత్రాలు',
      materialTransportDanger: 'భారీ భారాలు, కదిలే వాహనాలు మరియు జారిపోవడం',
      equipmentMaintenanceDanger: 'కదిలే భాగాలు, నూనె చిందులు మరియు భారీ సాధనాలు',
      roofBoltingDanger: 'ఎత్తులో పని చేయడం మరియు పడిపోయే రాళ్ళు',
      // Work types in Telugu
      blasting: 'బ్లాస్టింగ్',
      drilling: 'డ్రిల్లింగ్',
      transportation: 'రవాణా',
      maintenance: 'నిర్వహణ',
      cutting: 'కట్టింగ్',
      welding: 'వెల్డింగ్',
      chemicalHandling: 'రసాయన నిర్వహణ',
      heavyMachinery: 'భారీ యంత్రాలు',
      outdoorWork: 'బహిరంగ పని',
      heightWork: 'ఎత్తు పని',
      firefighting: 'అగ్నిమాపక',
      emergencyResponse: 'అత్యవసర ప్రతిస్పందన',
      undergroundWork: 'భూగర్భ పని'
    }
  };

  const t = translations[language];

  // Function to get translated equipment name
  const getEquipmentName = (name) => {
    const nameMap = {
      'Hard Hat': t.hardHat,
      'Safety Goggles': t.safetyGoggles,
      'Respirator': t.respirator,
      'Safety Gloves': t.safetyGloves,
      'Steel-Toe Boots': t.steelToeBoots,
      'Ear Plugs': t.earPlugs,
      'High-Vis Vest': t.highVisVest,
      'Welding Helmet': t.weldingHelmet,
      'Safety Harness': t.safetyHarness,
      'Fire Resistant Suit': t.fireResistantSuit,
      'Gas Detector': t.gasDetector,
      'Knee Pads': t.kneePads
    };
    return nameMap[name] || name;
  };

  // Function to get translated equipment description
  const getEquipmentDesc = (name) => {
    const descMap = {
      'Hard Hat': t.hardHatDesc,
      'Safety Goggles': t.safetyGogglesDesc,
      'Respirator': t.respiratorDesc,
      'Safety Gloves': t.safetyGlovesDesc,
      'Steel-Toe Boots': t.steelToeBootsDesc,
      'Ear Plugs': t.earPlugsDesc,
      'High-Vis Vest': t.highVisVestDesc,
      'Welding Helmet': t.weldingHelmetDesc,
      'Safety Harness': t.safetyHarnessDesc,
      'Fire Resistant Suit': t.fireResistantSuitDesc,
      'Gas Detector': t.gasDetectorDesc,
      'Knee Pads': t.kneePadsDesc
    };
    return descMap[name] || EQUIPMENT_DATABASE[name]?.description || '';
  };

  // Function to get translated scenario name
  const getScenarioName = (name) => {
    const nameMap = {
      'Blasting Operations': t.blastingOps,
      'Drilling Operations': t.drillingOps,
      'Material Transportation': t.materialTransport,
      'Equipment Maintenance': t.equipmentMaintenance,
      'Roof Bolting': t.roofBolting
    };
    return nameMap[name] || name;
  };

  // Function to get translated scenario description
  const getScenarioDesc = (name) => {
    const descMap = {
      'Blasting Operations': t.blastingOpsDesc,
      'Drilling Operations': t.drillingOpsDesc,
      'Material Transportation': t.materialTransportDesc,
      'Equipment Maintenance': t.equipmentMaintenanceDesc,
      'Roof Bolting': t.roofBoltingDesc
    };
    return descMap[name] || '';
  };

  // Function to get translated scenario danger
  const getScenarioDanger = (name) => {
    const dangerMap = {
      'Blasting Operations': t.blastingOpsDanger,
      'Drilling Operations': t.drillingOpsDanger,
      'Material Transportation': t.materialTransportDanger,
      'Equipment Maintenance': t.equipmentMaintenanceDanger,
      'Roof Bolting': t.roofBoltingDanger
    };
    return dangerMap[name] || '';
  };

  // Function to get translated work type
  const getWorkType = (type) => {
    const typeMap = {
      'Blasting': t.blasting,
      'Drilling': t.drilling,
      'Transportation': t.transportation,
      'Maintenance': t.maintenance,
      'Cutting': t.cutting,
      'Welding': t.welding,
      'Chemical Handling': t.chemicalHandling,
      'Heavy Machinery': t.heavyMachinery,
      'Outdoor Work': t.outdoorWork,
      'Height Work': t.heightWork,
      'Roof Bolting': t.roofBolting,
      'Firefighting': t.firefighting,
      'Emergency Response': t.emergencyResponse,
      'Underground Work': t.undergroundWork
    };
    return typeMap[type] || type;
  };

  // Timer
  useEffect(() => {
    let interval;
    // Timer pauses when feedback modal is shown
    if (gameStarted && timeLeft > 0 && gameState === 'playing' && !showFeedback) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, timeLeft, gameState, showFeedback]);

  const startGame = () => {
    const randomScenario = WORK_SCENARIOS[Math.floor(Math.random() * WORK_SCENARIOS.length)];
    setCurrentScenario(randomScenario);
    
    // Shuffle equipment
    const equipmentArray = Object.values(EQUIPMENT_DATABASE);
    const shuffled = equipmentArray.sort(() => Math.random() - 0.5);
    setShuffledEquipment(shuffled);
    
    // Generate random positions for each equipment item with better spacing
    const positions = shuffled.map(() => ({
      top: `${Math.random() * 65 + 5}%`, // 5% to 70% from top
      left: `${Math.random() * 65 + 5}%`, // 5% to 70% from left
      rotation: Math.random() * 40 - 20, // -20 to 20 degrees
      x: 0, // Track drag offset
      y: 0
    }));
    setEquipmentPositions(positions);
    
    setSelectedEquipment([]);
    setWrongSelections([]);
    setScore(0);
    setTimeLeft(90);
    setGameState('playing');
    setGameStarted(true);
  };

  const handleEquipmentSelect = (equipment) => {
    if (!currentScenario) return;
    
    const isRequired = currentScenario.required.includes(equipment.name);
    const alreadySelected = selectedEquipment.some(item => item.name === equipment.name);
    const isAlreadyWrong = wrongSelections.some(item => item.name === equipment.name);

    // Don't allow selecting already marked wrong items
    if (isAlreadyWrong) return;

    if (alreadySelected) {
      // Only allow deselecting correct items
      if (isRequired) {
        setSelectedEquipment(prev => prev.filter(item => item.name !== equipment.name));
      }
      return;
    }

    if (isRequired) {
      // Correct selection - add to collected items
      setSelectedEquipment(prev => {
        const newSelected = [...prev, equipment];
        
        // Check if all required equipment is selected
        if (newSelected.length === currentScenario.required.length) {
          setTimeout(() => finishGame(), 500);
        }
        
        return newSelected;
      });
    } else {
      // Wrong selection - mark as wrong but DON'T add to selectedEquipment
      setFeedbackItem({
        equipment: equipment,
        reason: `${equipment.name} is not required for ${currentScenario.name}`,
        correctUse: `This is used for: ${equipment.usedFor.join(', ')}`,
        explanation: equipment.description
      });
      setShowFeedback(true);
      setWrongSelections(prev => [...prev, equipment]);
    }
  };

  const handlePositionChange = (index, offset) => {
    setEquipmentPositions(prevPositions => {
      const newPositions = [...prevPositions];
      if (newPositions[index]) {
        newPositions[index] = {
          ...newPositions[index],
          x: offset.x,
          y: offset.y
        };
      }
      return newPositions;
    });
  };

  const finishGame = () => {
    if (!currentScenario) return;
    
    setGameStarted(false);
    
    // Use the latest selectedEquipment state
    setSelectedEquipment(currentSelected => {
      setWrongSelections(currentWrong => {
        const correctCount = currentSelected.length; // All items in selectedEquipment are correct
        const wrongCount = currentWrong.length;
        const totalRequired = currentScenario.required.length;
        
        // Calculate score: correct answers add points, wrong answers subtract points
        // Formula: (correct / total) * 100 - (wrong * penalty)
        const baseScore = (correctCount / totalRequired) * 100;
        const wrongPenalty = (wrongCount * 10); // 10% penalty per wrong answer
        const percentage = Math.max(0, Math.round(baseScore - wrongPenalty)); // Don't go below 0
        
        setScore(percentage);
        setGameState('results');
        return currentWrong; // Return unchanged
      });
      return currentSelected; // Return unchanged
    });
  };

  const getMissedEquipment = () => {
    if (!currentScenario) return [];
    
    return currentScenario.required.filter(reqItem => 
      !selectedEquipment.some(selected => selected.name === reqItem)
    );
  };

  const renderIntro = () => (
    <View style={styles.introContainer}>
      <Text style={styles.gameTitle}>🎮 {t.gameTitle}</Text>
      <Text style={styles.gameSubtitle}>{t.gameSubtitle}</Text>
      
      {/* Language Selector */}
      <View style={styles.languageSelector}>
        <Text style={styles.languageLabel}>🌐 {t.language}:</Text>
        <View style={styles.languageButtons}>
          <TouchableOpacity 
            style={[styles.langButton, language === 'en' && styles.langButtonActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langButtonText, language === 'en' && styles.langButtonTextActive]}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.langButton, language === 'hi' && styles.langButtonActive]}
            onPress={() => setLanguage('hi')}
          >
            <Text style={[styles.langButtonText, language === 'hi' && styles.langButtonTextActive]}>हिन्दी</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.langButton, language === 'te' && styles.langButtonActive]}
            onPress={() => setLanguage('te')}
          >
            <Text style={[styles.langButtonText, language === 'te' && styles.langButtonTextActive]}>తెలుగు</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.instructionsBox}>
        <Text style={styles.instructionsTitle}>📋 {t.howToPlay}</Text>
        <Text style={styles.instructionText}>1. {t.instruction1}</Text>
        <Text style={styles.instructionText}>2. {t.instruction2}</Text>
        <Text style={styles.instructionText}>3. {t.instruction3}</Text>
        <Text style={styles.instructionText}>4. {t.instruction4}</Text>
        <Text style={styles.instructionText}>5. {t.instruction5}</Text>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={startGame}>
        <Text style={styles.startButtonText}>{t.startGame}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← {t.back}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGame = () => {
    if (!currentScenario) return null;
    
    return (
      <View style={styles.gameContainer}>
        <View style={styles.header}>
          <View style={styles.timerBox}>
            <Text style={styles.timerText}>⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</Text>
          </View>
          <View style={styles.progressBox}>
            <Text style={styles.progressText}>
              {selectedEquipment.length}/{currentScenario.required.length}
            </Text>
          </View>
        </View>

        <View style={styles.scenarioBox}>
          <Text style={styles.scenarioTitle}>{getScenarioName(currentScenario.name)}</Text>
          <Text style={styles.scenarioDescription}>{getScenarioDesc(currentScenario.name)}</Text>
          <Text style={styles.dangerText}>⚠️ {t.hazards} {getScenarioDanger(currentScenario.name)}</Text>
      </View>

      <Text style={styles.instructionLabel}>{t.tapInstruction}</Text>

      {/* Mining Site Background with Scattered Equipment */}
      <View style={styles.miningArea}>
        {/* Background representing mining site */}
        <View style={styles.miningBackground}>
          {/* Ground texture */}
          <View style={styles.groundLayer} />
          
          {/* Scattered Equipment Items - Now Draggable! */}
          {shuffledEquipment.map((equipment, index) => {
            const isSelected = selectedEquipment.some(item => item.name === equipment.name);
            const isWrong = wrongSelections.some(item => item.name === equipment.name);
            const position = equipmentPositions[index] || { top: '50%', left: '50%', rotation: 0, x: 0, y: 0 };
            
            // Hide correctly selected items (they're in the basket now)
            if (isSelected) {
              return null;
            }
            
            return (
              <DraggableEquipment
                key={`${equipment.name}-${index}`}
                equipment={{...equipment, translatedName: getEquipmentName(equipment.name)}}
                position={position}
                isWrong={isWrong}
                onSelect={handleEquipmentSelect}
                onPositionChange={handlePositionChange}
                index={index}
              />
            );
          })}
        </View>
        
        {/* Collection Basket - Shows collected items */}
        <View style={styles.collectionBasket}>
          {/* Sandy overlay layer matching mining area */}
          <View style={styles.basketOverlay} />
          <Text style={styles.basketTitle}>🧺 {t.collected}</Text>
          <View style={styles.basketItems}>
            {selectedEquipment.map((item, idx) => (
              <Text key={idx} style={styles.basketIcon}>{item.icon}</Text>
            ))}
            {selectedEquipment.length === 0 && (
              <Text style={styles.emptyBasketText}>{t.noItems}</Text>
            )}
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.finishButton} onPress={finishGame}>
        <Text style={styles.finishButtonText}>{t.finishCheck}</Text>
      </TouchableOpacity>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedback}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFeedback(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.feedbackModal}>
            <Text style={styles.feedbackTitle}>❌ {t.incorrectSelection}</Text>
            {feedbackItem && (
              <>
                <Text style={styles.feedbackIcon}>{feedbackItem.equipment.icon}</Text>
                <Text style={styles.feedbackEquipmentName}>{getEquipmentName(feedbackItem.equipment.name)}</Text>
                <Text style={styles.feedbackReason}>{getEquipmentName(feedbackItem.equipment.name)} {t.notRequired} {getScenarioName(currentScenario.name)}</Text>
                <View style={styles.feedbackDetails}>
                  <Text style={styles.feedbackLabel}>{t.correctUsage}</Text>
                  <Text style={styles.feedbackText}>{t.usedFor} {feedbackItem.equipment.usedFor.map(type => getWorkType(type)).join(', ')}</Text>
                  <Text style={styles.feedbackLabel}>{t.why}</Text>
                  <Text style={styles.feedbackText}>{getEquipmentDesc(feedbackItem.equipment.name)}</Text>
                </View>
              </>
            )}
            <TouchableOpacity 
              style={styles.feedbackButton}
              onPress={() => setShowFeedback(false)}
            >
              <Text style={styles.feedbackButtonText}>{t.gotIt}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
    );
  };

  const renderResults = () => {
    if (!currentScenario) return null;
    
    const missedItems = getMissedEquipment();
    const wrongItems = wrongSelections;
    
    let performanceLevel = '';
    let performanceColor = '';
    let performanceEmoji = '';
    
    if (score === 100) {
      performanceLevel = t.perfect;
      performanceColor = '#FFD700';
      performanceEmoji = '🏆';
    } else if (score >= 80) {
      performanceLevel = t.excellent;
      performanceColor = '#4CAF50';
      performanceEmoji = '⭐';
    } else if (score >= 60) {
      performanceLevel = t.good;
      performanceColor = '#FFC107';
      performanceEmoji = '👍';
    } else {
      performanceLevel = t.needPractice;
      performanceColor = '#F44336';
      performanceEmoji = '📚';
    }

    return (
      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>{t.gameResults}</Text>
        
        <View style={[styles.scoreBox, { borderColor: performanceColor }]}>
          <Text style={styles.scoreEmoji}>{performanceEmoji}</Text>
          <Text style={[styles.scorePercentage, { color: performanceColor }]}>{score}%</Text>
          <Text style={[styles.performanceLevel, { color: performanceColor }]}>{performanceLevel}</Text>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>📊 {t.summary}</Text>
          <Text style={styles.summaryText}>{t.scenario} {getScenarioName(currentScenario.name)}</Text>
          <Text style={styles.summaryText}>
            {t.correctSelections} {selectedEquipment.filter(item => currentScenario.required.includes(item.name)).length}/{currentScenario.required.length}
          </Text>
          <Text style={styles.summaryText}>{t.wrongSelections} {wrongItems.length}</Text>
          <Text style={styles.summaryText}>{t.timeUsed} {90 - timeLeft} {t.seconds}</Text>
        </View>

        {missedItems.length > 0 && (
          <View style={styles.missedBox}>
            <Text style={styles.missedTitle}>❗ {t.missed}</Text>
            {missedItems.map((itemName, index) => {
              const equipment = EQUIPMENT_DATABASE[itemName];
              return (
                <View key={index} style={styles.missedItem}>
                  <Text style={styles.missedIcon}>{equipment.icon}</Text>
                  <View style={styles.missedInfo}>
                    <Text style={styles.missedName}>{getEquipmentName(equipment.name)}</Text>
                    <Text style={styles.missedDescription}>{getEquipmentDesc(equipment.name)}</Text>
                    <Text style={styles.missedDanger}>⚠️ {t.withoutThis}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {wrongItems.length > 0 && (
          <View style={styles.wrongBox}>
            <Text style={styles.wrongTitle}>❌ {t.incorrect}</Text>
            {wrongItems.map((equipment, index) => (
              <View key={index} style={styles.wrongItem}>
                <Text style={styles.wrongIcon}>{equipment.icon}</Text>
                <View style={styles.wrongInfo}>
                  <Text style={styles.wrongName}>{getEquipmentName(equipment.name)}</Text>
                  <Text style={styles.wrongDescription}>{t.usedFor} {equipment.usedFor.map(type => getWorkType(type)).join(', ')}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {score < 80 && (
          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>💡 {t.safetyTips}</Text>
            <Text style={styles.tipText}>• {t.tip1}</Text>
            <Text style={styles.tipText}>• {t.tip2}</Text>
            <Text style={styles.tipText}>• {t.tip3}</Text>
            <Text style={styles.tipText}>• {t.tip4}</Text>
            <Text style={styles.tipText}>• {t.tip5}</Text>
          </View>
        )}

        <View style={styles.resultsButtons}>
          <TouchableOpacity style={styles.playAgainButton} onPress={startGame}>
            <Text style={styles.playAgainButtonText}>🔄 {t.playAgain}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.exitButton} onPress={() => router.back()}>
            <Text style={styles.exitButtonText}>{t.exit}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {gameState === 'intro' && renderIntro()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'results' && renderResults()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  // Intro Styles
  introContainer: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
  },
  gameSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 15,
  },
  instructionsBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 18,
  },
  startButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  // Game Styles
  gameContainer: {
    flex: 1,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  timerBox: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  progressBox: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  scenarioBox: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 5,
  },
  scenarioDescription: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 5,
  },
  dangerText: {
    fontSize: 11,
    color: '#FF6B35',
    fontWeight: '600',
  },
  instructionLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  languageSelector: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
    textAlign: 'center',
  },
  languageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  langButton: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#333333',
  },
  langButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  langButtonText: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    fontWeight: '600',
  },
  langButtonTextActive: {
    color: '#FFFFFF',
  },
  miningArea: {
    flex: 1,
    position: 'relative',
  },
  miningBackground: {
    flex: 1,
    backgroundColor: '#8B7355', // Brown dirt color
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 280,
    borderWidth: 2,
    borderColor: '#5D4E37',
  },
  groundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#eec57fff', // Sandy/dirt color
    opacity: 0.6,
  },
  scatteredItem: {
    position: 'absolute',
    zIndex: 10,
  },
  itemShadow: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    minWidth: 65,
  },
  itemShadowWrong: {
    borderColor: '#F44336',
    backgroundColor: 'rgba(255, 100, 100, 0.9)',
  },
  itemDragging: {
    borderColor: '#00BCD4',
    borderWidth: 4,
    shadowColor: '#00BCD4',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
  },
  scatteredIcon: {
    fontSize: 28,
    marginBottom: 3,
  },
  scatteredName: {
    fontSize: 8,
    color: '#000',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  scatteredItemWrong: {
    opacity: 0.6,
  },
  wrongMark: {
    position: 'absolute',
    top: -5,
    right: -5,
    fontSize: 24,
  },
  collectionBasket: {
    backgroundColor: '#8B7355', // Brown dirt color matching mining area
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#5D4E37', // Dark brown border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  basketTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFD700', // Gold color for better contrast
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    zIndex: 2,
  },
  basketOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#CD853F', // Sandy/dirt color overlay
    opacity: 0.5,
    borderRadius: 12,
    zIndex: 1,
  },
  basketItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    zIndex: 2,
  },
  basketIcon: {
    fontSize: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  emptyBasketText: {
    fontSize: 11,
    color: '#D4A574', // Lighter sandy color
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  finishButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  finishButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  feedbackModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 18,
    width: '100%',
    maxWidth: 380,
    borderWidth: 2,
    borderColor: '#F44336',
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 12,
  },
  feedbackIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  feedbackEquipmentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  feedbackReason: {
    fontSize: 13,
    color: '#FF6B35',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '600',
  },
  feedbackDetails: {
    backgroundColor: '#0a0a0a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  feedbackLabel: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 12,
    color: '#CCCCCC',
    lineHeight: 16,
  },
  feedbackButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  // Results Styles
  resultsContainer: {
    flex: 1,
    padding: 15,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 15,
  },
  scoreBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
  },
  scoreEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  scorePercentage: {
    fontSize: 56,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  performanceLevel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#333333',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  missedBox: {
    backgroundColor: '#3a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#F44336',
  },
  missedTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 12,
  },
  missedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 8,
  },
  missedIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  missedInfo: {
    flex: 1,
  },
  missedName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  missedDescription: {
    fontSize: 11,
    color: '#CCCCCC',
    marginBottom: 3,
  },
  missedDanger: {
    fontSize: 11,
    color: '#FF6B35',
    fontWeight: '600',
  },
  wrongBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#F44336',
  },
  wrongTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 12,
  },
  wrongItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#0a0a0a',
    padding: 10,
    borderRadius: 8,
  },
  wrongIcon: {
    fontSize: 26,
    marginRight: 10,
  },
  wrongInfo: {
    flex: 1,
  },
  wrongName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  wrongDescription: {
    fontSize: 11,
    color: '#CCCCCC',
  },
  tipsBox: {
    backgroundColor: '#1a2a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 6,
    lineHeight: 16,
  },
  resultsButtons: {
    marginTop: 8,
    marginBottom: 20,
  },
  playAgainButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  playAgainButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000000',
  },
  exitButton: {
    backgroundColor: '#333333',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  exitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
