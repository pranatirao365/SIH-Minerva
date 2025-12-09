/**
 * AI Video Moderation Service
 * Validates videos before upload using multiple checks
 */

import { Alert } from 'react-native';

interface ModerationResult {
  approved: boolean;
  reason?: string;
  confidence?: number;
  issues?: string[];
}

/**
 * Check video duration - mining safety videos should be reasonable length
 */
const checkVideoDuration = (durationMs: number): { valid: boolean; reason?: string } => {
  const durationSeconds = durationMs / 1000;
  
  // Min 5 seconds, max 5 minutes for mining safety content
  if (durationSeconds < 5) {
    return { valid: false, reason: 'Video is too short (minimum 5 seconds)' };
  }
  
  if (durationSeconds > 300) {
    return { valid: false, reason: 'Video is too long (maximum 5 minutes)' };
  }
  
  return { valid: true };
};

/**
 * Check video file size
 */
const checkFileSize = (sizeBytes: number): { valid: boolean; reason?: string } => {
  const sizeMB = sizeBytes / (1024 * 1024);
  
  // Max 100MB
  if (sizeMB > 100) {
    return { valid: false, reason: `Video is too large (${sizeMB.toFixed(1)}MB, maximum 100MB)` };
  }
  
  return { valid: true };
};

/**
 * Check caption for inappropriate content
 */
const checkCaption = (caption: string): { valid: boolean; reason?: string; issues?: string[] } => {
  const issues: string[] = [];
  const lowerCaption = caption.toLowerCase();
  
  // Banned words for mining context
  const bannedWords = [
    'abuse', 'attack', 'violence', 'hate', 'discrimination',
    'illegal', 'drug', 'alcohol', 'weapon', 'dangerous prank'
  ];
  
  // Check for banned content
  for (const word of bannedWords) {
    if (lowerCaption.includes(word)) {
      issues.push(`Contains inappropriate content: "${word}"`);
    }
  }
  
  // Check minimum length
  if (caption.trim().length < 10) {
    issues.push('Caption is too short (minimum 10 characters)');
  }
  
  // Check for spam patterns
  if (/(.)\1{5,}/.test(caption)) {
    issues.push('Caption contains spam-like repetitive characters');
  }
  
  if (issues.length > 0) {
    return { valid: false, reason: 'Caption validation failed', issues };
  }
  
  return { valid: true };
};

/**
 * Check hashtags for appropriateness
 */
const checkHashtags = (hashtags: string[]): { valid: boolean; reason?: string } => {
  if (hashtags.length > 10) {
    return { valid: false, reason: 'Too many hashtags (maximum 10)' };
  }
  
  // Check for banned hashtags
  const bannedHashtags = ['nsfw', 'xxx', 'adult'];
  for (const tag of hashtags) {
    if (bannedHashtags.includes(tag.toLowerCase())) {
      return { valid: false, reason: `Inappropriate hashtag: #${tag}` };
    }
  }
  
  return { valid: true };
};

/**
 * AI-based content analysis (simulated)
 * In production, integrate with actual AI services like:
 * - Google Cloud Video Intelligence API
 * - AWS Rekognition Video
 * - Azure Video Indexer
 */
const aiContentAnalysis = async (videoUri: string): Promise<ModerationResult> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // In production, call actual AI API here
  // For now, we'll do basic checks
  
  // Simulated AI checks:
  // 1. Scene detection - check for mining/safety context
  // 2. Object detection - verify safety equipment
  // 3. Text detection - check for appropriate text overlays
  // 4. Explicit content detection
  
  // For demo, we approve all videos that pass basic checks
  // In production, replace with actual AI service
  
  return {
    approved: true,
    confidence: 0.95,
    reason: 'Content approved by AI moderation'
  };
};

/**
 * Main moderation function
 */
export const moderateVideo = async (
  videoUri: string,
  caption: string,
  hashtags: string[],
  durationMs: number,
  sizeBytes: number
): Promise<ModerationResult> => {
  console.log('🤖 Starting AI video moderation...');
  
  try {
    // Step 1: Basic validation checks
    const durationCheck = checkVideoDuration(durationMs);
    if (!durationCheck.valid) {
      return { approved: false, reason: durationCheck.reason };
    }
    
    const sizeCheck = checkFileSize(sizeBytes);
    if (!sizeCheck.valid) {
      return { approved: false, reason: sizeCheck.reason };
    }
    
    const captionCheck = checkCaption(caption);
    if (!captionCheck.valid) {
      return { 
        approved: false, 
        reason: captionCheck.reason,
        issues: captionCheck.issues 
      };
    }
    
    const hashtagCheck = checkHashtags(hashtags);
    if (!hashtagCheck.valid) {
      return { approved: false, reason: hashtagCheck.reason };
    }
    
    console.log('✅ Basic validation passed');
    
    // Step 2: AI Content Analysis
    console.log('🔍 Running AI content analysis...');
    const aiResult = await aiContentAnalysis(videoUri);
    
    if (!aiResult.approved) {
      return aiResult;
    }
    
    console.log('✅ AI moderation passed');
    
    // All checks passed
    return {
      approved: true,
      confidence: aiResult.confidence,
      reason: 'Video approved for upload'
    };
    
  } catch (error) {
    console.error('❌ Moderation error:', error);
    return {
      approved: false,
      reason: 'Moderation service error. Please try again.'
    };
  }
};

/**
 * Show moderation result to user
 */
export const showModerationResult = (result: ModerationResult): Promise<boolean> => {
  return new Promise((resolve) => {
    if (result.approved) {
      Alert.alert(
        '✅ Video Approved',
        result.reason || 'Your video passed all safety checks and will be uploaded.',
        [
          {
            text: 'Upload Now',
            onPress: () => resolve(true),
            style: 'default'
          },
          {
            text: 'Cancel',
            onPress: () => resolve(false),
            style: 'cancel'
          }
        ]
      );
    } else {
      let message = result.reason || 'Video did not pass moderation';
      
      if (result.issues && result.issues.length > 0) {
        message += '\n\nIssues found:\n• ' + result.issues.join('\n• ');
      }
      
      Alert.alert(
        '❌ Upload Blocked',
        message + '\n\nPlease fix these issues and try again.',
        [{ text: 'OK', onPress: () => resolve(false) }]
      );
    }
  });
};

/**
 * Get video metadata for moderation
 */
export const getVideoMetadata = async (videoUri: string): Promise<{
  duration: number;
  size: number;
}> => {
  try {
    // Get file info
    const response = await fetch(videoUri);
    const blob = await response.blob();
    
    // For duration, we would need to load the video
    // This is a simplified version
    return {
      duration: 30000, // 30 seconds default
      size: blob.size
    };
  } catch (error) {
    console.error('Error getting video metadata:', error);
    return { duration: 0, size: 0 };
  }
};
