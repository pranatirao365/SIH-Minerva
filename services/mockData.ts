export const mockSafetyVideos = [
  {
    id: '1',
    title: 'Mine Safety Basics',
    duration: '5:30',
    thumbnail: 'https://via.placeholder.com/300x180?text=Safety+Basics',
    completed: false,
  },
  {
    id: '2',
    title: 'PPE Equipment Guide',
    duration: '4:15',
    thumbnail: 'https://via.placeholder.com/300x180?text=PPE+Guide',
    completed: false,
  },
  {
    id: '3',
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
    question: 'What is the first step when entering a mine?',
    options: [
      'Check oxygen levels',
      'Turn on torch',
      'Report to supervisor',
      'Wear helmet',
    ],
    correctAnswer: 0,
  },
  {
    id: '2',
    question: 'How often should PPE be inspected?',
    options: [
      'Once a week',
      'Before every shift',
      'Once a month',
      'Only when damaged',
    ],
    correctAnswer: 1,
  },
  {
    id: '3',
    question: 'What should you do if you detect gas?',
    options: [
      'Continue working',
      'Open windows',
      'Evacuate immediately',
      'Call a friend',
    ],
    correctAnswer: 2,
  },
  {
    id: '4',
    question: 'Maximum continuous working hours underground?',
    options: [
      '6 hours',
      '8 hours',
      '10 hours',
      '12 hours',
    ],
    correctAnswer: 1,
  },
  {
    id: '5',
    question: 'What does a red tag on equipment indicate?',
    options: [
      'New equipment',
      'Do not operate',
      'Requires maintenance',
      'High priority',
    ],
    correctAnswer: 1,
  },
  {
    id: '6',
    question: 'Minimum distance from blasting area?',
    options: [
      '50 meters',
      '100 meters',
      '200 meters',
      '500 meters',
    ],
    correctAnswer: 2,
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
