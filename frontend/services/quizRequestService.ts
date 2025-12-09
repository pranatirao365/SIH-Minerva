import { db } from '@/config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  updateDoc,
  setDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

// Quiz Request Document Interface (parallel to VideoRequestDocument)
export interface QuizRequestDocument {
  id: string;
  topic: string;
  language: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  targetAudience: 'miner' | 'supervisor' | 'all';
  questionsCount: number;
  requestedBy: string; // supervisor ID
  requestedByName: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  minerIds?: string[]; // miners to assign quiz to when completed
  quizId?: string; // populated when quiz is created
  requestedAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

export class QuizRequestService {
  /**
   * Create a new quiz generation request (parallel to createVideoRequest)
   */
  static async createQuizRequest(requestData: {
    topic: string;
    language: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    targetAudience: 'miner' | 'supervisor' | 'all';
    questionsCount: number;
    requestedBy: string;
    requestedByName: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    minerIds?: string[];
  }): Promise<string> {
    try {
      console.log('📝 Creating quiz request with data:', requestData);
      
      const requestId = `quiz_request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const requestRef = doc(db, 'quizRequests', requestId);
      
      const requestDoc: QuizRequestDocument = {
        ...requestData,
        id: requestId,
        status: 'pending',
        requestedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      await setDoc(requestRef, requestDoc);
      console.log('✅ Quiz request document created:', requestId);

      try {
        console.log('🔍 Searching for safety officers...');
        const usersRef = collection(db, 'users');
        const safetyOfficerQuery1 = query(usersRef, where('role', '==', 'safety-officer'));
        const safetyOfficerQuery2 = query(usersRef, where('role', '==', 'safety_officer'));

        const [snapshot1, snapshot2] = await Promise.all([
          getDocs(safetyOfficerQuery1),
          getDocs(safetyOfficerQuery2),
        ]);

        const safetyOfficerDocs = new Map();
        snapshot1.docs.forEach(d => safetyOfficerDocs.set(d.id, d));
        snapshot2.docs.forEach(d => safetyOfficerDocs.set(d.id, d));
        const safetyOfficers = Array.from(safetyOfficerDocs.values());
        
        console.log(`📋 Found ${safetyOfficers.length} safety officers`);

        const notificationPromises = safetyOfficers.map((officerDoc) => {
          const officer = officerDoc.data();
          const priorityEmoji = requestData.priority === 'urgent' ? '🚨' : requestData.priority === 'high' ? '⚠️' : requestData.priority === 'medium' ? '📝' : '✏️';
          
          console.log(`📧 Creating notification for: ${officerDoc.id}`);
          
          return addDoc(collection(db, 'notifications'), {
            recipientId: officerDoc.id,
            recipientName: officer.name || 'Safety Officer',
            senderId: requestData.requestedBy,
            senderName: requestData.requestedByName,
            userId: officerDoc.id,
            type: 'quiz_request',
            title: `${priorityEmoji} New Quiz Request`,
            message: `${requestData.requestedByName} requested a quiz on "${requestData.topic}". ${requestData.description}`,
            priority: requestData.priority,
            read: false,
            actionRequired: true,
            createdAt: Timestamp.now(),
            metadata: {
              requestId,
              quizTopic: requestData.topic,
              requestPriority: requestData.priority,
              requestDescription: requestData.description,
              requestLanguage: requestData.language,
              difficulty: requestData.difficulty,
              questionsCount: requestData.questionsCount,
            },
          });
        });

        await Promise.all(notificationPromises);
        console.log(`✅ Quiz notifications sent to ${safetyOfficers.length} officers`);
      } catch (notificationError) {
        console.error('❌ Error creating notifications:', notificationError);
      }

      console.log('✅ Quiz request created successfully:', requestId);
      return requestId;
    } catch (error) {
      console.error('❌ Error creating quiz request:', error);
      throw error;
    }
  }

  /**
   * Get all quiz requests (with optional status filter)
   */
  static async getAllQuizRequests(
    statusFilter?: 'pending' | 'in-progress' | 'completed' | 'rejected'
  ): Promise<QuizRequestDocument[]> {
    try {
      const requestsRef = collection(db, 'quizRequests');
      let q;

      if (statusFilter) {
        q = query(
          requestsRef,
          where('status', '==', statusFilter),
          orderBy('requestedAt', 'desc')
        );
      } else {
        q = query(requestsRef, orderBy('requestedAt', 'desc'));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as QuizRequestDocument[];
    } catch (error) {
      console.error('❌ Error fetching quiz requests:', error);
      throw error;
    }
  }

  /**
   * Get pending quiz requests for safety officers
   */
  static async getPendingQuizRequests(): Promise<QuizRequestDocument[]> {
    return this.getAllQuizRequests('pending');
  }

  /**
   * Update quiz request status (e.g., when safety officer accepts/rejects)
   */
  static async updateQuizRequest(
    requestId: string,
    updates: Partial<QuizRequestDocument>
  ): Promise<void> {
    try {
      const requestRef = doc(db, 'quizRequests', requestId);
      await updateDoc(requestRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Quiz request updated successfully:', requestId);
    } catch (error) {
      console.error('❌ Error updating quiz request:', error);
      throw error;
    }
  }

  /**
   * Accept a quiz request (safety officer starts working on it)
   */
  static async acceptQuizRequest(requestId: string, assignedTo: string): Promise<void> {
    await this.updateQuizRequest(requestId, {
      status: 'in-progress',
      assignedTo,
    } as any);
  }

  /**
   * Reject a quiz request
   */
  static async rejectQuizRequest(requestId: string, notes?: string): Promise<void> {
    await this.updateQuizRequest(requestId, {
      status: 'rejected',
      notes,
    } as any);
  }

  /**
   * Complete a quiz request (when safety officer creates the quiz)
   */
  static async completeQuizRequest(
    requestId: string,
    quizId: string
  ): Promise<void> {
    await this.updateQuizRequest(requestId, {
      status: 'completed',
      quizId,
      completedAt: Timestamp.now(),
    });
  }

  /**
   * Get a specific quiz request by ID
   */
  static async getQuizRequestById(
    requestId: string
  ): Promise<QuizRequestDocument | null> {
    try {
      const requestRef = doc(db, 'quizRequests', requestId);
      const requestSnap = await getDoc(requestRef);

      if (requestSnap.exists()) {
        return {
          id: requestSnap.id,
          ...requestSnap.data(),
        } as QuizRequestDocument;
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching quiz request:', error);
      return null;
    }
  }

  /**
   * Check if both video and quiz requests are completed for auto-assignment
   */
  static async checkPairedRequests(requestId: string): Promise<{
    videoCompleted: boolean;
    quizCompleted: boolean;
    minerIds?: string[];
  }> {
    try {
      // Get quiz request
      const quizRequest = await this.getQuizRequestById(requestId);
      if (!quizRequest) {
        return { videoCompleted: false, quizCompleted: false };
      }

      // Look for paired video request with same requestedBy and similar topic
      const videoRequestsRef = collection(db, 'videoRequests');
      const videoQuery = query(
        videoRequestsRef,
        where('requestedBy', '==', quizRequest.requestedBy),
        where('topic', '==', quizRequest.topic)
      );

      const videoSnapshot = await getDocs(videoQuery);
      const videoRequest = videoSnapshot.docs[0]?.data();

      return {
        videoCompleted: videoRequest?.status === 'completed',
        quizCompleted: quizRequest.status === 'completed',
        minerIds: quizRequest.minerIds || videoRequest?.minerIds,
      };
    } catch (error) {
      console.error('❌ Error checking paired requests:', error);
      return { videoCompleted: false, quizCompleted: false };
    }
  }

  /**
   * Auto-assign quiz to miners when completed
   */
  static async autoAssignQuizToMiners(
    quizId: string,
    minerIds: string[]
  ): Promise<void> {
    try {
      const assignmentPromises = minerIds.map(async (minerId) => {
        // Create quiz assignment for miner
        await addDoc(collection(db, 'quizAssignments'), {
          quizId,
          minerId,
          assignedAt: serverTimestamp(),
          status: 'pending',
          score: null,
          completedAt: null,
        });

        // Send notification to miner
        await addDoc(collection(db, 'notifications'), {
          userId: minerId,
          type: 'quiz_assigned',
          title: 'New Quiz Assigned',
          message: 'A new training quiz has been assigned to you',
          read: false,
          createdAt: serverTimestamp(),
          metadata: {
            quizId,
          },
        });
      });

      await Promise.all(assignmentPromises);
      console.log(`✅ Quiz auto-assigned to ${minerIds.length} miners`);
    } catch (error) {
      console.error('❌ Error auto-assigning quiz:', error);
      throw error;
    }
  }
}
