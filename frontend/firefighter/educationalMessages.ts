/**
 * Educational messages for fire extinguisher game
 * Provides context-aware feedback based on fire type and selected extinguisher
 */

import { FireType, ExtinguisherType } from './types';

export interface EducationalMessage {
  correct: string;
  incorrect: Record<ExtinguisherType, string>;
}

/**
 * Educational feedback messages for each fire type
 * Explains why certain extinguishers work or don't work
 */
export const EDUCATIONAL_MESSAGES: Record<FireType, EducationalMessage> = {
  ELECTRICAL: {
    correct: '✅ CO₂ is non-conductive and perfect for electrical fires!',
    incorrect: {
      CO2: '', // This won't be used
      DRY_CHEMICAL: '❌ While ABC works on some fires, CO₂ is safer for electrical',
      FOAM: '❌ Never use foam on electrical! It conducts electricity',
      WATER: '❌ DANGER! Water conducts electricity and can electrocute you',
      WET_CHEMICAL: '❌ Wet chemicals conduct electricity - very dangerous!',
    },
  },
  OIL: {
    correct: '✅ Foam or Dry Chemical smothers oil fires effectively!',
    incorrect: {
      CO2: '❌ CO₂ can spread oil fires. Use foam or ABC instead',
      DRY_CHEMICAL: '', // This is correct
      FOAM: '', // This is correct
      WATER: '❌ NEVER use water on oil! It causes explosive spreading',
      WET_CHEMICAL: '❌ Wet chemical is for grease, not oil fires',
    },
  },
  WOOD: {
    correct: '✅ Water or ABC Dry Chemical work great on wood fires!',
    incorrect: {
      CO2: '❌ CO₂ is too weak for wood fires. Use water or ABC',
      DRY_CHEMICAL: '', // This is correct
      FOAM: '❌ Foam works but water or ABC are more effective',
      WATER: '', // This is correct
      WET_CHEMICAL: '❌ Wet chemical is for grease fires, not wood',
    },
  },
  GAS: {
    correct: '✅ ABC Dry Chemical stops gas fires by breaking the chain reaction!',
    incorrect: {
      CO2: '❌ CO₂ can work but ABC is more effective for gas fires',
      DRY_CHEMICAL: '', // This is correct
      FOAM: '❌ Foam is ineffective on gas flames',
      WATER: '❌ Water cannot extinguish gas fires',
      WET_CHEMICAL: '❌ Wet chemical won\'t work on gas fires',
    },
  },
  GREASE: {
    correct: '✅ Wet Chemical creates a barrier that cools grease fires!',
    incorrect: {
      CO2: '❌ CO₂ is too weak for grease. Use wet chemical',
      DRY_CHEMICAL: '❌ ABC can work but wet chemical is specifically for grease',
      FOAM: '❌ Foam won\'t cool grease enough. Use wet chemical',
      WATER: '❌ EXTREME DANGER! Water explodes grease fires!',
      WET_CHEMICAL: '', // This is correct
    },
  },
};

/**
 * Get educational feedback message based on fire type and selected extinguisher
 */
export const getEducationalFeedback = (
  fireType: FireType,
  selectedExtinguisher: ExtinguisherType,
  isCorrect: boolean
): string => {
  if (isCorrect) {
    return EDUCATIONAL_MESSAGES[fireType].correct;
  }
  return EDUCATIONAL_MESSAGES[fireType].incorrect[selectedExtinguisher];
};

/**
 * General safety tips shown during game
 */
export const SAFETY_TIPS = [
  '💡 Always check the fire class before selecting an extinguisher',
  '💡 In mines, electrical fires are common near equipment',
  '💡 Never use water on electrical or oil fires',
  '💡 ABC extinguishers are most versatile but not always best',
  '💡 Grease fires need wet chemical - nothing else!',
  '💡 Call for backup if fire is larger than manageable',
];

/**
 * Get a random safety tip
 */
export const getRandomSafetyTip = (): string => {
  return SAFETY_TIPS[Math.floor(Math.random() * SAFETY_TIPS.length)];
};
