import {
    ConfirmationResult,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from 'firebase/auth';
import { auth } from '../config/firebase';

// Storage for confirmation result
let confirmationResult: ConfirmationResult | null = null;

/**
 * Initialize reCAPTCHA verifier
 * Note: This is for web. For React Native, you need expo-firebase-recaptcha
 */
export const initRecaptcha = (containerId: string = 'recaptcha-container') => {
  try {
    const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: (response: any) => {
        console.log('reCAPTCHA verified');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });
    return recaptchaVerifier;
  } catch (error) {
    console.error('Error initializing reCAPTCHA:', error);
    return null;
  }
};

/**
 * Send OTP to phone number using Firebase Authentication
 */
export const sendOTP = async (phoneNumber: string, recaptchaVerifier?: any): Promise<{ success: boolean; verificationId?: string; error?: string }> => {
  try {
    console.log('Attempting to send OTP to:', phoneNumber);
    
    // Validate phone number format (E.164: +91XXXXXXXXXX)
    if (!phoneNumber.startsWith('+91') || phoneNumber.length !== 13) {
      throw new Error('Phone number must be in format +91XXXXXXXXXX');
    }
    
    // For React Native without reCAPTCHA implementation
    // This is a development workaround
    if (!recaptchaVerifier) {
      console.log('⚠️ Running in development mode without reCAPTCHA');
      console.log('📱 In production, you must implement expo-firebase-recaptcha');
      
      // Generate mock verification ID for testing
      const mockVerificationId = `verification_${Date.now()}_${phoneNumber.replace('+91', '')}`;
      
      console.log('✅ Mock OTP sent successfully');
      console.log('💡 For testing: Enter any 6-digit code (e.g., 123456)');
      
      return {
        success: true,
        verificationId: mockVerificationId
      };
    }
    
    // Production: Use Firebase Phone Auth with reCAPTCHA
    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      confirmationResult = confirmation;
      
      console.log('✅ OTP sent successfully via Firebase');
      
      return {
        success: true,
        verificationId: confirmation.verificationId
      };
    } catch (firebaseError: any) {
      console.error('Firebase Phone Auth Error:', firebaseError);
      
      // Handle specific Firebase errors
      if (firebaseError.code === 'auth/invalid-phone-number') {
        throw new Error('Invalid phone number format');
      } else if (firebaseError.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please try again later.');
      } else if (firebaseError.code === 'auth/quota-exceeded') {
        throw new Error('SMS quota exceeded. Please try again later.');
      }
      
      throw firebaseError;
    }
    
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      error: error.message || 'Failed to send OTP'
    };
  }
};

/**
 * Verify OTP code
 */
export const verifyOTP = async (verificationId: string, code: string) => {
  try {
    // Validate OTP code
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      throw new Error('OTP must be 6 digits');
    }
    
    console.log('Verifying OTP:', code);
    
    // Test data OTP mapping
    const testOTPs: { [key: string]: string } = {
      '9032017652': '123456', // Custom test number
      '900000001': '123456', // Ravi
      '900000002': '234567', // Suresh
      '800000001': '345678', // Arun
      '800000002': '456789', // Rakesh
      '800000003': '567890', // Mahesh
      '800000004': '678901', // Deepak
      '800000005': '789012', // Imran
      '800000006': '890123', // Harish
      '800000007': '901234', // Vijay
      '800000008': '012345', // Santosh
      '800000009': '123789', // Sunil
      '800000010': '234890', // Gopal
      '700000001': '345901'  // Anita
    };
    
    // Extract phone number from verificationId (for mock mode)
    const phoneMatch = verificationId.match(/verification_\d+_(\d{9,10})$/);
    const phoneNumber = phoneMatch ? phoneMatch[1] : null;
    
    // Check if it's a test phone number and OTP matches
    if (phoneNumber && testOTPs[phoneNumber] === code) {
      console.log('✅ Test OTP verified successfully for phone:', phoneNumber);
      return {
        success: true,
        user: {
          phoneNumber: `+91${phoneNumber}`
        }
      };
    }
    
    // If we have a confirmation result from Firebase, use it
    if (confirmationResult) {
      try {
        const result = await confirmationResult.confirm(code);
        console.log('✅ OTP verified successfully via Firebase');
        console.log('User:', result.user.phoneNumber);
        
        return {
          success: true,
          user: result.user
        };
      } catch (error: any) {
        if (error.code === 'auth/invalid-verification-code') {
          throw new Error('Invalid OTP code. Please try again.');
        }
        throw error;
      }
    }
    
    // Development mode: Accept any 6-digit code
    console.log('⚠️ Running in development mode - accepting any valid 6-digit code');
    console.log('✅ OTP accepted (development mode)');
    
    return {
      success: true,
      user: {
        phoneNumber: null // Will be fetched from Firestore
      }
    };
    
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

/**
 * Get stored confirmation result
 */
export const getConfirmationResult = () => confirmationResult;
