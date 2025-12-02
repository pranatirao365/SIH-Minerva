/**
 * Translation Service for Mining Incident Reporting System
 * 
 * Automatically translates incident descriptions to English (except Telugu)
 * Uses Google Translate API for accurate translations
 */

import * as googleTranslate from '@vitalets/google-translate-api';

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

    // Perform translation
    console.log('🌐 Translating to English for supervisor view...');
    const result = await googleTranslate.translate(text, { to: 'en' });

    const detectedLang = (result as any).from?.language?.iso || declaredLanguage || 'unknown';

    // If detected language is Telugu, return original
    if (detectedLang === 'te') {
      console.log('🇮🇳 Detected Telugu - returning original text');
      return {
        translatedText: text,
        detectedLanguage: 'te',
        wasTranslated: false
      };
    }

    // Return translated English text
    console.log(`✅ Translated from ${detectedLang} to English`);
    return {
      translatedText: result.text,
      detectedLanguage: detectedLang,
      wasTranslated: true
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
