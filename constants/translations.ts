export type Language = 'en' | 'hi' | 'te';

export const translations: Record<string, Record<Language, string>> = {
  // Auth
  selectLanguage: { en: 'Select Language', hi: 'भाषा चुनें', te: 'భాష ఎంచుకోండి' },
  continue: { en: 'Continue', hi: 'जारी रखें', te: 'కొనసాగించు' },
  phoneLogin: { en: 'Phone Login', hi: 'फोन लॉगिन', te: 'ఫోన్ లాగిన్' },
  enterPhone: { en: 'Enter Phone Number', hi: 'फोन नंबर दर्ज करें', te: 'ఫోన్ నంబర్ నమోదు చేయండి' },
  sendOTP: { en: 'Send OTP', hi: 'OTP भेजें', te: 'OTP పంపండి' },
  verifyOTP: { en: 'Verify OTP', hi: 'OTP सत्यापित करें', te: 'OTP ధృవీకరించండి' },
  enterOTP: { en: 'Enter 6-digit OTP', hi: '6 अंकों का OTP दर्ज करें', te: '6-అంకెల OTP నమోదు చేయండి' },
  verify: { en: 'Verify', hi: 'सत्यापित करें', te: 'ధృవీకరించండి' },
  selectRole: { en: 'Select Your Role', hi: 'अपनी भूमिका चुनें', te: 'మీ పాత్రను ఎంచుకోండి' },
  
  // Roles
  miner: { en: 'Miner', hi: 'खनिक', te: 'మైనర్' },
  supervisor: { en: 'Supervisor', hi: 'पर्यवेक्षक', te: 'సూపర్‌వైజర్' },
  safetyOfficer: { en: 'Safety Officer', hi: 'सुरक्षा अधिकारी', te: 'సేఫ్టీ ఆఫీసర్' },
  engineer: { en: 'Engineer', hi: 'अभियंता', te: 'ఇంజనీర్' },
  
  // Common
  home: { en: 'Home', hi: 'होम', te: 'హోమ్' },
  profile: { en: 'Profile', hi: 'प्रोफ़ाइल', te: 'ప్రొఫైల్' },
  chat: { en: 'Chat', hi: 'चैट', te: 'చాట్' },
  notifications: { en: 'Notifications', hi: 'सूचनाएं', te: 'నోటిఫికేషన్లు' },
  emergency: { en: 'Emergency', hi: 'आपातकाल', te: 'ఎమర్జెన్సీ' },
  back: { en: 'Back', hi: 'वापस', te: 'వెనక్కి' },
  submit: { en: 'Submit', hi: 'जमा करें', te: 'సమర్పించండి' },
  cancel: { en: 'Cancel', hi: 'रद्द करें', te: 'రద్దు చేయి' },
  save: { en: 'Save', hi: 'सहेजें', te: 'సేవ్ చేయి' },
  
  // Miner Module
  safetyScore: { en: 'Safety Score', hi: 'सुरक्षा स्कोर', te: 'సేఫ్టీ స్కోర్' },
  safetyTraining: { en: 'Safety Training', hi: 'सुरक्षा प्रशिक्षण', te: 'సేఫ్టీ శిక్షణ' },
  watchVideo: { en: 'Watch Video', hi: 'वीडियो देखें', te: 'వీడియో చూడండి' },
  voiceBriefing: { en: 'Voice Briefing', hi: 'वॉइस ब्रीफिंग', te: 'వాయిస్ బ్రీఫింగ్' },
  takeQuiz: { en: 'Take Quiz', hi: 'क्विज लें', te: 'క్విజ్ తీసుకోండి' },
  playGame: { en: 'Play Game', hi: 'खेल खेलें', te: 'గేమ్ ఆడండి' },
  heatMap: { en: 'Heat Map', hi: 'हीट मैप', te: 'హీట్ మ్యాప్' },
  hazardScan: { en: 'Hazard Scan', hi: 'खतरा स्कैन', te: 'హజార్డ్ స్కాన్' },
  ppeScan: { en: 'PPE Scan', hi: 'PPE स्कैन', te: 'PPE స్కాన్' },
  reportIncident: { en: 'Report Incident', hi: 'घटना रिपोर्ट करें', te: 'సంఘటనను నివేదించండి' },
  emergencySOS: { en: 'Emergency SOS', hi: 'आपातकालीन SOS', te: 'ఎమర్జెన్సీ SOS' },
  
  // Offline
  offline: { en: 'Offline Mode', hi: 'ऑफ़लाइन मोड', te: 'ఆఫ్‌లైన్ మోడ్' },
  offlineMessage: { en: 'You are currently offline. Some features may be limited.', hi: 'आप वर्तमान में ऑफ़लाइन हैं। कुछ सुविधाएं सीमित हो सकती हैं।', te: 'మీరు ప్రస్తుతం ఆఫ్‌లైన్‌లో ఉన్నారు. కొన్ని ఫీచర్లు పరిమితం కావచ్చు.' },
};
