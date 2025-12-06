/**
 * Translation Service for Mining Incident Reporting System
 * 
 * Automatically translates incident descriptions to English (except Telugu)
 * Note: Using fallback implementation for React Native compatibility
 * For production, integrate with cloud translation API (Google Cloud Translation API)
 */

// Note: @vitalets/google-translate-api is Node.js only, not compatible with React Native
// This is a fallback implementation that returns original text
// TODO: Integrate with Google Cloud Translation API REST endpoint for production

interface TranslationResult {
  translatedText: string;
  detectedLanguage: string;
  wasTranslated: boolean;
}

/**
 * Translate incident description to English (Telugu exempt)
 * 
 * @param text - Original text from miner
 * @param declaredLanguage - Language code if known ('en' | 'hi' | 'te' | etc.)
 * @returns Supervisor-ready text (English or original Telugu)
 */
export async function translateIncidentForSupervisor(
  text: string,
  declaredLanguage?: string
): Promise<TranslationResult> {
  try {
    // Empty or whitespace-only text
    if (!text || !text.trim()) {
      return {
        translatedText: text,
        detectedLanguage: declaredLanguage || 'unknown',
        wasTranslated: false
      };
    }

    // If declared language is Telugu, return as-is
    if (declaredLanguage === 'te') {
      console.log('🇮🇳 Telugu content detected - no translation');
      return {
        translatedText: text,
        detectedLanguage: 'te',
        wasTranslated: false
      };
    }

    // If already English, return as-is
    if (declaredLanguage === 'en') {
      console.log('🇬🇧 English content - no translation needed');
      return {
        translatedText: text,
        detectedLanguage: 'en',
        wasTranslated: false
      };
    }

    // Fallback: Return original text (translation disabled for React Native compatibility)
    // TODO: Implement REST API call to Google Cloud Translation API for production
    console.log('ℹ️ Translation service running in fallback mode - returning original text');
    console.log('💡 For production: Integrate Google Cloud Translation API REST endpoint');
    
    return {
      translatedText: text,
      detectedLanguage: declaredLanguage || 'unknown',
      wasTranslated: false
    };

  } catch (error: any) {
    console.error('❌ Translation error:', error.message);
    
    // Fallback: return original text if translation fails
    return {
      translatedText: text,
      detectedLanguage: declaredLanguage || 'unknown',
      wasTranslated: false
    };
  }
}

/**
 * Batch translate multiple incident fields
 */
export async function translateIncidentBatch(
  title: string,
  description: string,
  transcript: string,
  language?: string
): Promise<{
  title: string;
  description: string;
  transcript: string;
  wasTranslated: boolean;
}> {
  try {
    const [titleResult, descResult, transcriptResult] = await Promise.all([
      translateIncidentForSupervisor(title, language),
      translateIncidentForSupervisor(description, language),
      transcript ? translateIncidentForSupervisor(transcript, language) : Promise.resolve({ translatedText: '', detectedLanguage: '', wasTranslated: false })
    ]);

    const wasTranslated = titleResult.wasTranslated || descResult.wasTranslated || transcriptResult.wasTranslated;

    return {
      title: titleResult.translatedText,
      description: descResult.translatedText,
      transcript: transcriptResult.translatedText,
      wasTranslated
    };
  } catch (error) {
    console.error('❌ Batch translation error:', error);
    // Return original text on error
    return {
      title,
      description,
      transcript,
      wasTranslated: false
    };
  }
}
