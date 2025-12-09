export const mockSafetyVideos = [
  {
    id: '1',
    title: 'Blasting Safety Procedures',
    duration: '5:45',
    thumbnail: 'https://via.placeholder.com/300x180?text=Blasting+Safety',
    completed: false,
    videoUrl: require('@/assets/videos/reels/VID-20251209-WA0001.mp4'),
  },
  {
    id: '2',
    title: 'Mine Safety Basics',
    duration: '5:30',
    thumbnail: 'https://via.placeholder.com/300x180?text=Safety+Basics',
    completed: false,
  },
  {
    id: '3',
    title: 'PPE Equipment Guide',
    duration: '4:15',
    thumbnail: 'https://via.placeholder.com/300x180?text=PPE+Guide',
    completed: false,
  },
  {
    id: '4',
    title: 'Emergency Procedures',
    duration: '6:20',
    thumbnail: 'https://via.placeholder.com/300x180?text=Emergency',
    completed: false,
  },
];

export const mockVoiceBriefings = [
  {
    id: '1',
    title: 'Daily Safety Briefing',
    duration: 180,
    transcript: 'Good morning miners. Today we focus on proper ventilation checks and monitoring gas levels...',
    completed: false,
  },
];

export const mockQuizQuestions = [
  {
    id: '1',
    question: 'What is the minimum safe distance from a blasting area during detonation?',
    options: [
      '50 meters',
      '100 meters',
      '200 meters',
      '500 meters',
    ],
    correctAnswer: 2,
  },
  {
    id: '2',
    question: 'Before blasting operations, what is the first safety measure?',
    options: [
      'Sound the alarm and evacuate all personnel',
      'Check weather conditions',
      'Turn off all lights',
      'Call supervisor',
    ],
    correctAnswer: 0,
  },
  {
    id: '3',
    question: 'What type of explosive is commonly used in coal mining?',
    options: [
      'TNT only',
      'Permissible explosives',
      'Black powder',
      'Nitroglycerin',
    ],
    correctAnswer: 1,
  },
  {
    id: '4',
    question: 'Who is authorized to handle explosives in a mine?',
    options: [
      'Any experienced miner',
      'The supervisor only',
      'Licensed blasting personnel only',
      'All miners after basic training',
    ],
    correctAnswer: 2,
  },
  {
    id: '5',
    question: 'After blasting, how long must you wait before re-entering the area?',
    options: [
      '5 minutes',
      'Wait for all-clear signal after ventilation',
      '1 hour regardless',
      'Immediately if no smoke visible',
    ],
    correctAnswer: 1,
  },
  {
    id: '6',
    question: 'What should be checked immediately after a blast misfires?',
    options: [
      'Rush to fix it immediately',
      'Wait prescribed time, then investigate with blaster',
      'Call police',
      'Try blasting again',
    ],
    correctAnswer: 1,
  },
  {
    id: '7',
    question: 'Explosives must be stored in:',
    options: [
      'Any locked room',
      'Near the working area',
      'Approved magazine away from work areas',
      'Supervisor office',
    ],
    correctAnswer: 2,
  },
  {
    id: '8',
    question: 'What protective equipment is mandatory during blasting operations?',
    options: [
      'Helmet only',
      'Full PPE including hearing protection',
      'Safety boots only',
      'Gloves and goggles',
    ],
    correctAnswer: 1,
  },
];

export const mockHazards = [
  { id: '1', type: 'Gas Leak', severity: 'high', location: 'Shaft A' },
  { id: '2', type: 'Structural Crack', severity: 'medium', location: 'Tunnel B' },
  { id: '3', type: 'Water Seepage', severity: 'low', location: 'Level 3' },
];

export const mockIncidents = [
  {
    id: '1',
    type: 'Near Miss',
    date: '2025-11-20',
    location: 'Shaft C',
    status: 'resolved',
  },
  {
    id: '2',
    type: 'Equipment Failure',
    date: '2025-11-22',
    location: 'Level 2',
    status: 'investigating',
  },
];

export const mockWorkers = [
  { id: '1', name: 'Ramesh Kumar', role: 'Miner', status: 'active', safetyScore: 92 },
  { id: '2', name: 'Suresh Reddy', role: 'Miner', status: 'active', safetyScore: 88 },
  { id: '3', name: 'Vijay Singh', role: 'Miner', status: 'break', safetyScore: 95 },
  { id: '4', name: 'Anil Sharma', role: 'Miner', status: 'active', safetyScore: 85 },
];

export const mockTasks = [
  { id: '1', title: 'Inspect Shaft A', assignedTo: 'Ramesh Kumar', priority: 'high', status: 'pending' },
  { id: '2', title: 'Repair Ventilation', assignedTo: 'Suresh Reddy', priority: 'medium', status: 'in-progress' },
  { id: '3', title: 'Equipment Check', assignedTo: 'Vijay Singh', priority: 'low', status: 'completed' },
];

export const mockEnvironmentalData = {
  temperature: 28,
  humidity: 65,
  airQuality: 'Good',
  gasLevels: {
    oxygen: 20.8,
    methane: 0.3,
    carbonMonoxide: 5,
  },
};

export const mockCaseStudies = [
  {
    id: '1',
    title: 'Preventing Rock Falls',
    summary: 'Learn how proper rock bolting prevented a major incident in 2024.',
    date: '2024-08-15',
  },
  {
    id: '2',
    title: 'Gas Detection Success',
    summary: 'Early detection system saved lives during methane buildup.',
    date: '2024-10-10',
  },
];

export const mockTestimonials = [
  {
    id: '1',
    author: 'Rajesh M.',
    role: 'Senior Miner',
    text: 'The safety training has made me more aware of potential hazards.',
    rating: 5,
  },
  {
    id: '2',
    author: 'Priya S.',
    role: 'Safety Officer',
    text: 'This app streamlines our entire safety protocol management.',
    rating: 5,
  },
];

export const mockNotifications = [
  { id: '1', title: 'Safety Alert', message: 'High methane levels detected in Shaft B', time: '10 mins ago', read: false },
  { id: '2', title: 'Training Reminder', message: 'Complete your weekly quiz by tomorrow', time: '2 hours ago', read: false },
  { id: '3', title: 'Equipment Update', message: 'New helmets available in storage', time: '1 day ago', read: true },
];
