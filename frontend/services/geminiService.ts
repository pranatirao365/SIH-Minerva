/**
 * Gemini AI Service
 * Handles AI-powered description generation for training videos
 */

// Use Gemini 2.0 Flash API
const GEMINI_API_KEY = 'AIzaSyA47y_mmOfzKL1jo4ce8qmK2RyY9_mk4sk';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface VideoDescriptionRequest {
  topic: string;
  language: string;
  videoUrl?: string;
}

export interface VideoDescriptionResponse {
  description: string;
  tags: string[];
  keyPoints: string[];
  transcript?: string;
}

/**
 * Generate comprehensive description for a safety training video using Gemini AI
 */
export async function generateVideoDescription(
  request: VideoDescriptionRequest
): Promise<VideoDescriptionResponse> {
  try {
    const languageNames: Record<string, string> = {
      en: 'English',
      hi: 'Hindi (हिंदी)',
      te: 'Telugu (తెలుగు)',
    };

    const languageName = languageNames[request.language] || 'English';

    const prompt = `You are an expert in mining safety training content. Generate a comprehensive description for a training video on the following topic:

**Topic**: ${request.topic}
**Language**: ${languageName}

Please provide a detailed JSON response with the following structure:

{
  "description": "A comprehensive 2-3 paragraph description explaining what this training video covers, its importance for mining safety, and what miners will learn. Write in ${languageName}.",
  "tags": ["List of 5-7 relevant tags for categorization and search"],
  "keyPoints": ["5-7 key learning objectives or takeaways from this training"],
  "transcript": "A brief overview of what the video narration covers (1-2 sentences in ${languageName})"
}

Make the description professional, informative, and emphasize the safety aspects. Tags should be in English for search consistency. Key points should be actionable and clear.`;

    console.log('🔑 Using Gemini API Key:', GEMINI_API_KEY.substring(0, 20) + '...');
    console.log('🌐 API URL:', GEMINI_API_URL);

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
          temperature: 0.7,
          maxOutputTokens: 1024,
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

    const parsedResponse: VideoDescriptionResponse = JSON.parse(cleanedText);

    // Validate response structure
    if (!parsedResponse.description || !parsedResponse.tags || !parsedResponse.keyPoints) {
      throw new Error('Invalid response structure from Gemini API');
    }

    console.log('✅ Video description generated successfully');
    return parsedResponse;

  } catch (error) {
    console.error('❌ Error generating video description:', error);
    
    // Fallback response if AI generation fails
    return {
      description: `This comprehensive safety training video covers essential aspects of ${request.topic}. The video provides practical demonstrations and clear guidelines to ensure miners understand and follow proper safety protocols. Through visual examples and expert narration, miners will learn the critical steps needed to maintain a safe working environment.`,
      tags: [
        'mining safety',
        'training',
        request.topic.toLowerCase(),
        'safety protocol',
        'workplace safety',
        'miners',
      ],
      keyPoints: [
        `Understanding the basics of ${request.topic}`,
        'Identifying potential hazards and risks',
        'Following proper safety procedures',
        'Using appropriate protective equipment',
        'Responding to emergency situations',
      ],
      transcript: `This training video provides comprehensive coverage of ${request.topic} with practical demonstrations and safety guidelines.`,
    };
  }
}

/**
 * Generate tags for video categorization
 */
export async function generateVideoTags(topic: string): Promise<string[]> {
  try {
    const prompt = `Generate 7 relevant tags for a mining safety training video about: "${topic}".
Return only a JSON array of tags (strings), no additional text.
Example: ["mining safety", "ppe", "hard hat", "protective gear", "training", "compliance", "safety protocol"]`;

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
          temperature: 0.5,
          maxOutputTokens: 200,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No tags generated');
    }

    // Parse the JSON array
    const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const tags: string[] = JSON.parse(cleanedText);

    return tags;

  } catch (error) {
    console.error('Error generating tags:', error);
    // Fallback tags
    return ['mining safety', 'training', topic.toLowerCase(), 'safety protocol', 'workplace safety'];
  }
}
