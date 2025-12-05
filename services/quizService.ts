/**
 * Quiz Generation Service using Gemini AI
 * Handles daily quiz generation for mining safety training
 */

const GEMINI_API_KEY = 'AIzaSyA47y_mmOfzKL1jo4ce8qmK2RyY9_mk4sk';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface QuizGenerationRequest {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  numQuestions: number;
  language: string;
  targetAudience: 'miner' | 'supervisor' | 'all';
}

export interface GeneratedQuiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  createdAt: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  targetAudience: 'miner' | 'supervisor' | 'all';
  language: string;
}

/**
 * Generate a quiz using Gemini AI
 */
export async function generateQuiz(
  request: QuizGenerationRequest
): Promise<GeneratedQuiz> {
  try {
    const languageNames: Record<string, string> = {
      en: 'English',
      hi: 'Hindi (हिंदी)',
      te: 'Telugu (తెలుగు)',
    };

    const languageName = languageNames[request.language] || 'English';
    
    const audienceContext = {
      miner: 'frontline workers who work directly in mines',
      supervisor: 'supervisors who manage teams and oversee operations',
      all: 'both miners and supervisors',
    }[request.targetAudience];

    const prompt = `You are an expert in mining safety training and assessment. Generate a comprehensive safety quiz with the following requirements:

**Topic**: ${request.topic}
**Difficulty Level**: ${request.difficulty}
**Number of Questions**: ${request.numQuestions}
**Language**: ${languageName}
**Target Audience**: ${audienceContext}

Generate a quiz in JSON format with the following structure:

{
  "title": "A clear, engaging title for the quiz in ${languageName}",
  "description": "A brief 1-2 sentence description of what this quiz covers in ${languageName}",
  "questions": [
    {
      "id": "unique_id_1",
      "question": "The question text in ${languageName}",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation of why the correct answer is right and what miners/supervisors should know in ${languageName}",
      "difficulty": "${request.difficulty}",
      "category": "A specific category like 'PPE', 'Emergency Response', 'Equipment Safety', etc."
    }
  ]
}

**Important Guidelines**:
1. All question text should be in ${languageName}
2. Options should also be in ${languageName}
3. Make questions practical and scenario-based, not just theoretical
4. For difficulty level "${request.difficulty}":
   - easy: Basic safety knowledge, straightforward scenarios
   - medium: Requires understanding of procedures and protocols
   - hard: Complex scenarios requiring critical thinking and deep knowledge
5. Include diverse categories: PPE, Emergency Response, Equipment Safety, Hazard Recognition, First Aid, Mining Operations, Environmental Safety
6. Ensure correctAnswer is the index (0-3) of the correct option
7. Explanations should be educational and reinforce safety best practices
8. Make questions relevant to ${audienceContext}

Return ONLY the JSON object, no additional text.`;

    console.log('🎓 Generating quiz with Gemini AI...');
    console.log('📝 Topic:', request.topic);
    console.log('📊 Difficulty:', request.difficulty);
    console.log('🔢 Questions:', request.numQuestions);

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 4096,
          topP: 0.9,
        },
      }),
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('❌ Gemini API error response:', errorBody);
      throw new Error(`Gemini API error: ${response.status} - ${errorBody.substring(0, 200)}`);
    }

    const data = await response.json();
    
    // Extract the generated text
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No content generated from Gemini API');
    }

    // Parse the JSON response
    // Remove markdown code blocks if present
    const cleanedText = generatedText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsedQuiz = JSON.parse(cleanedText);

    // Validate response structure
    if (!parsedQuiz.title || !parsedQuiz.questions || !Array.isArray(parsedQuiz.questions)) {
      throw new Error('Invalid quiz structure from Gemini API');
    }

    // Create the final quiz object
    const quiz: GeneratedQuiz = {
      id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: parsedQuiz.title,
      description: parsedQuiz.description || `A ${request.difficulty} level quiz on ${request.topic}`,
      questions: parsedQuiz.questions.map((q: any, index: number) => ({
        id: q.id || `q_${index + 1}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty || request.difficulty,
        category: q.category || 'General Safety',
      })),
      createdAt: new Date().toISOString(),
      topic: request.topic,
      difficulty: request.difficulty,
      targetAudience: request.targetAudience,
      language: request.language,
    };

    console.log('✅ Quiz generated successfully');
    console.log(`📊 Generated ${quiz.questions.length} questions`);

    return quiz;

  } catch (error) {
    console.error('❌ Error generating quiz:', error);
    
    // Fallback quiz if AI generation fails
    return generateFallbackQuiz(request);
  }
}

/**
 * Generate fallback quiz when AI generation fails
 */
function generateFallbackQuiz(request: QuizGenerationRequest): GeneratedQuiz {
  const fallbackQuestions: QuizQuestion[] = [
    {
      id: 'fallback_1',
      question: 'What is the most important personal protective equipment (PPE) in a mine?',
      options: ['Safety Helmet', 'Gloves', 'Safety Boots', 'Vest'],
      correctAnswer: 0,
      explanation: 'A safety helmet is crucial as it protects the head from falling objects and impacts, which are common hazards in mining operations.',
      difficulty: request.difficulty,
      category: 'PPE',
    },
    {
      id: 'fallback_2',
      question: 'In case of a mine emergency, what should be your first priority?',
      options: ['Save equipment', 'Alert others and evacuate', 'Continue working', 'Take photos'],
      correctAnswer: 1,
      explanation: 'Safety of personnel is always the top priority. Alert others and follow evacuation procedures immediately.',
      difficulty: request.difficulty,
      category: 'Emergency Response',
    },
    {
      id: 'fallback_3',
      question: 'How often should safety equipment be inspected?',
      options: ['Once a year', 'Once a month', 'Before each use', 'Never'],
      correctAnswer: 2,
      explanation: 'Safety equipment should be inspected before each use to ensure it is in proper working condition and can provide adequate protection.',
      difficulty: request.difficulty,
      category: 'Equipment Safety',
    },
  ];

  return {
    id: `quiz_${Date.now()}_fallback`,
    title: `${request.topic} Safety Quiz`,
    description: `A ${request.difficulty} level safety quiz covering essential mining safety topics.`,
    questions: fallbackQuestions.slice(0, request.numQuestions),
    createdAt: new Date().toISOString(),
    topic: request.topic,
    difficulty: request.difficulty,
    targetAudience: request.targetAudience,
    language: request.language,
  };
}

/**
 * Quiz topics for mining safety
 */
export const QUIZ_TOPICS = [
  'Personal Protective Equipment (PPE)',
  'Emergency Response Procedures',
  'Hazard Recognition and Prevention',
  'Equipment Safety and Maintenance',
  'First Aid and Medical Response',
  'Mine Ventilation and Air Quality',
  'Explosive Handling and Blasting Safety',
  'Ground Control and Roof Support',
  'Electrical Safety in Mines',
  'Fire Prevention and Control',
  'Confined Space Entry',
  'Chemical Hazards and MSDS',
  'Noise and Hearing Protection',
  'Heat Stress and Environmental Conditions',
  'Communication Systems and Protocols',
];

/**
 * Get quiz categories
 */
export const QUIZ_CATEGORIES = [
  'PPE',
  'Emergency Response',
  'Equipment Safety',
  'Hazard Recognition',
  'First Aid',
  'Mining Operations',
  'Environmental Safety',
  'Communication',
  'Maintenance',
  'Compliance',
];
