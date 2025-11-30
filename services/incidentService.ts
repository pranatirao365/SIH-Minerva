/**
 * Incident Reporting Service
 * Handles Firebase Storage uploads and Firestore incident management
 */

import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, QuerySnapshot, DocumentData, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

export interface Incident {
  incidentId?: string;
  reportedBy: string; // minerId
  minerName: string;
  timestamp: any;
  type: 'photo' | 'video' | 'audio' | 'text';
  mediaUrl?: string; // Optional - can report without media
  description: string; // Mandatory
  transcript: string; // Default to empty string, never undefined
  transcriptionStatus?: 'pending' | 'processing' | 'done' | 'error' | 'apikey_missing' | 'n/a';
  title: string;
  status: 'pending' | 'reviewed' | 'resolved';
  severity: 'Low' | 'Medium' | 'High' | 'Critical'; // Mandatory
  language?: 'en' | 'hi' | 'te'; // For audio transcription
}

/**
 * Upload media file to Firebase Storage
 * @param fileUri - Local file URI from ImagePicker
 * @param minerId - Miner's phone number (normalized)
 * @param incidentId - Incident ID
 * @param type - Media type (photo/video/audio)
 * @returns Download URL from Firebase Storage
 */
export async function uploadMediaToStorage(
  fileUri: string,
  minerId: string,
  incidentId: string,
  type: 'photo' | 'video' | 'audio'
): Promise<string> {
  try {
    console.log('\n📤 ===== STARTING FIREBASE STORAGE UPLOAD =====');
    console.log('📱 Miner ID:', minerId);
    console.log('🆔 Incident ID:', incidentId);
    console.log('📁 File URI:', fileUri);
    console.log('📷 Media Type:', type);

    // CRITICAL: Validate minerId is not null/undefined/"unknown"
    if (!minerId || minerId === 'unknown' || minerId === 'null' || minerId === 'undefined') {
      const errorMsg = `❌ CRITICAL ERROR: Invalid minerId = "${minerId}". Cannot upload to Firebase Storage.`;
      console.error(errorMsg);
      throw new Error('Invalid miner ID. Please ensure you are logged in correctly.');
    }

    // Determine file extension based on type and fileUri
    let extension = 'jpg'; // default
    if (type === 'video') {
      extension = 'mp4';
    } else if (type === 'audio') {
      extension = 'm4a';
    } else if (fileUri.toLowerCase().includes('.png')) {
      extension = 'png';
    } else if (fileUri.toLowerCase().includes('.heic')) {
      extension = 'jpg'; // Convert HEIC to JPG
    }

    const fileName = `${type}_${Date.now()}.${extension}`;
    const storagePath = `incidents/${minerId}/${incidentId}/${fileName}`;

    console.log('📦 Storage Path:', storagePath);
    console.log('📄 File Name:', fileName);

    // Create storage reference
    const storageRef = ref(storage, storagePath);

    console.log('🔄 Fetching file as blob from URI...');
    
    // CRITICAL FIX: Properly handle iOS file URIs
    // Fetch the file as a blob for Expo compatibility
    const response = await fetch(fileUri);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    
    console.log('✅ Blob created successfully');
    console.log('📊 Blob size:', blob.size, 'bytes');
    console.log('📊 Blob type:', blob.type);

    if (blob.size === 0) {
      throw new Error('File is empty (0 bytes). Cannot upload.');
    }

    console.log('⬆️ Uploading to Firebase Storage...');

    // Upload blob to Firebase Storage
    const snapshot = await uploadBytes(storageRef, blob);

    console.log('✅ Upload successful!');
    console.log('📍 Full path:', snapshot.ref.fullPath);

    // Get download URL
    console.log('🔗 Fetching download URL...');
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log('✅ Download URL obtained:', downloadURL);
    console.log('===== UPLOAD COMPLETE =====\n');

    return downloadURL;
  } catch (error: any) {
    console.error('\n❌ ===== UPLOAD FAILED =====');
    console.error('❌ Error Message:', error.message);
    console.error('❌ Error Code:', error.code);
    console.error('❌ Error Details:', JSON.stringify(error, null, 2));
    console.error('===== END ERROR LOG =====\n');
    
    // Provide user-friendly error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('Permission denied. Please check Firebase Storage rules.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Unknown storage error. Check Firebase configuration and network connection.');
    }
    
    throw error;
  }
}

/**
 * Create incident report in Firestore
 * @param incident - Incident data
 * @returns Incident document ID
 */
export async function createIncidentReport(incident: Omit<Incident, 'incidentId' | 'timestamp'>): Promise<string> {
  try {
    console.log('📝 Creating incident report in Firestore...');

    const incidentData = {
      ...incident,
      timestamp: serverTimestamp(),
      status: incident.status || 'pending'
    };

    const docRef = await addDoc(collection(db, 'incidents'), incidentData);

    console.log('✅ Incident report created with ID:', docRef.id);

    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating incident report:', error);
    throw error;
  }
}

/**
 * Submit complete incident with media
 * @param minerId - Miner's ID
 * @param minerName - Miner's name
 * @param type - Incident type
 * @param title - Incident title
 * @param text - Description or transcript
 * @param severity - Severity level
 * @param mediaUri - Local media file URI
 * @returns Incident ID
 */
export async function submitIncident(
  minerId: string,
  minerName: string,
  type: 'photo' | 'video' | 'audio' | 'text',
  title: string,
  description: string,
  severity: 'Low' | 'Medium' | 'High' | 'Critical',
  mediaUri?: string,
  transcript?: string,
  language?: 'en' | 'hi' | 'te'
): Promise<string> {
  try {
    console.log('\n🚨 ===== SUBMITTING INCIDENT REPORT =====');
    console.log('👤 Miner ID:', minerId);
    console.log('👤 Miner Name:', minerName);
    console.log('📷 Type:', type);
    console.log('⚠️ Severity:', severity);
    console.log('📄 Title:', title);
    console.log('📝 Description:', description.substring(0, 50) + '...');
    console.log('🖼️ Has media:', !!mediaUri);
    console.log('🎤 Has transcript:', !!transcript);
    console.log('🌐 Language:', language || 'N/A');

    // CRITICAL: Validate minerId before proceeding
    if (!minerId || minerId === 'unknown' || minerId === 'null' || minerId === 'undefined') {
      const errorMsg = `❌ CRITICAL: Invalid minerId = "${minerId}"`;
      console.error(errorMsg);
      throw new Error('Invalid miner ID. Please log in again.');
    }

    // Generate temporary incident ID
    const tempIncidentId = `incident_${Date.now()}`;
    console.log('🆔 Generated Incident ID:', tempIncidentId);

    // Upload media if provided
    let mediaUrl: string | undefined;
    if (mediaUri && type !== 'text') {
      console.log('\n📤 Starting media upload...');
      mediaUrl = await uploadMediaToStorage(mediaUri, minerId, tempIncidentId, type as 'photo' | 'video' | 'audio');
    } else {
      console.log('\n📝 No media to upload (text-only report)');
    }

    console.log('📝 Creating incident document...');
    
    // CRITICAL: Ensure NO undefined values
    // If transcript is already provided (client-side STT), mark as 'done'
    // Otherwise if audio type with no transcript, mark as 'pending' (for old flow compatibility)
    let transcriptionStatus: 'pending' | 'processing' | 'done' | 'error' | 'apikey_missing' | 'n/a' = 'n/a';
    if (type === 'audio') {
      if (transcript && transcript.trim().length > 0) {
        transcriptionStatus = 'done'; // Client-side STT already completed
        console.log('✅ Using client-side STT transcript - status: done');
      } else {
        transcriptionStatus = 'n/a'; // No transcript provided
        console.log('⏭️ No transcript provided - status: n/a');
      }
    }
    
    const incidentId = await createIncidentReport({
      reportedBy: minerId,
      minerName,
      type,
      mediaUrl: mediaUrl || '',
      description,
      transcript: transcript || '', // Always string, never undefined
      transcriptionStatus,
      title,
      status: 'pending',
      severity,
      language: language || 'en'
    });

    console.log('✅ Incident submitted successfully!');
    console.log('Incident ID:', incidentId);

    return incidentId;
  } catch (error) {
    console.error('❌ Error submitting incident:', error);
    throw error;
  }
}

/**
 * Listen to all incidents in real-time
 * @param callback - Callback function with incidents data
 * @param minerId - Optional filter by miner ID
 * @returns Unsubscribe function
 */
export function subscribeToIncidents(
  callback: (incidents: Incident[]) => void,
  minerId?: string
): () => void {
  try {
    console.log('👂 Setting up real-time incident listener...');

    let q = query(collection(db, 'incidents'), orderBy('timestamp', 'desc'));
    
    if (minerId) {
      q = query(collection(db, 'incidents'), where('minerId', '==', minerId), orderBy('timestamp', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
      const incidents: Incident[] = [];

      querySnapshot.forEach((doc) => {
        incidents.push({
          incidentId: doc.id,
          ...doc.data()
        } as Incident);
      });

      console.log(`📊 Received ${incidents.length} incidents`);
      callback(incidents);
    }, (error) => {
      console.error('❌ Error listening to incidents:', error);
    });

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up incident listener:', error);
    throw error;
  }
}

/**
 * Convert audio to text using AssemblyAI speech-to-text API
 * Supports English, Hindi, and Telugu
 */
export async function convertAudioToText(
  audioUri: string,
  language: 'en' | 'hi' | 'te' = 'en'
): Promise<{ transcript: string; detectedLanguage: string; status: 'done' | 'apikey_missing' | 'error' }> {
  try {
    console.log('\n🎤 ===== AUDIO TO TEXT CONVERSION =====');
    console.log('📁 Audio URI:', audioUri);
    console.log('🌐 Language:', language);

    // ⏭️ TELUGU STT SKIP - Disable transcription completely for Telugu
    if (language === 'te') {
      console.log('⏭️ Telugu transcription disabled - uploading audio only, no STT');
      console.log('📝 Returning null transcript for Telugu - no API call made');
      return {
        transcript: '',
        detectedLanguage: language,
        status: 'done'
      };
    }

    // AssemblyAI API Key (replace with your actual key)
    const ASSEMBLYAI_API_KEY = process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY || 'YOUR_API_KEY_HERE';

    if (!ASSEMBLYAI_API_KEY || ASSEMBLYAI_API_KEY === 'YOUR_API_KEY_HERE') {
      console.warn('⚠️ AssemblyAI API key not configured');
      return {
        transcript: '',
        detectedLanguage: language,
        status: 'apikey_missing'
      };
    }

    // Language code mapping
    const languageCodeMap: Record<string, string> = {
      'en': 'en',
      'hi': 'hi',
      'te': 'te'
    };

    console.log('📤 Uploading audio for transcription...');

    // Upload audio file
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'authorization': ASSEMBLYAI_API_KEY,
      },
      body: await (await fetch(audioUri)).blob()
    });

    const { upload_url } = await uploadResponse.json();
    console.log('✅ Audio uploaded');

    // Request transcription
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': ASSEMBLYAI_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: upload_url,
        language_code: languageCodeMap[language],
        language_detection: true
      })
    });

    const { id } = await transcriptResponse.json();

    // Poll for completion
    let transcript = null;
    while (!transcript) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
        headers: { 'authorization': ASSEMBLYAI_API_KEY }
      });

      const data = await pollingResponse.json();

      if (data.status === 'completed') {
        transcript = data.text;
        break;
      } else if (data.status === 'error') {
        throw new Error(`Transcription failed: ${data.error}`);
      }
    }

    console.log('✅ Transcription complete');
    return { 
      transcript: transcript || '[Transcription failed]', 
      detectedLanguage: language,
      status: 'done'
    };
  } catch (error: any) {
    console.error('❌ Error converting audio to text:', error);
    return { 
      transcript: '', 
      detectedLanguage: language,
      status: 'error'
    };
  }
}

/**
 * Update incident status (for supervisor review/resolve actions)
 */
export async function updateIncidentStatus(
  incidentId: string,
  status: 'pending' | 'reviewed' | 'resolved'
): Promise<void> {
  try {
    console.log(`🔄 Updating incident ${incidentId} status to: ${status}`);
    
    const { doc, updateDoc } = await import('firebase/firestore');
    const incidentRef = doc(db, 'incidents', incidentId);
    
    await updateDoc(incidentRef, {
      status,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Status updated successfully');
  } catch (error: any) {
    console.error('❌ Error updating incident status:', error);
    
    // Handle specific Firestore errors without causing logout
    if (error.code === 'permission-denied') {
      console.error('🔒 Permission Denied:', error.message);
      throw new Error('Permission denied: You do not have permission to update this incident.');
    } else if (error.code === 'not-found') {
      console.error('🔍 Incident not found:', error.message);
      throw new Error('Incident not found. It may have been deleted.');
    } else if (error.code === 'unavailable') {
      console.error('⚠️ Service unavailable:', error.message);
      throw new Error('Service temporarily unavailable. Please try again.');
    }
    
    // For any other error, throw with meaningful message
    throw new Error(error.message || 'Failed to update incident status. Please try again.');
  }
}
