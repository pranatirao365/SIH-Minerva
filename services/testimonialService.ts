import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Testimonial {
  id?: string;
  userId: string;
  userName: string;
  userRole: string;
  userPhone: string;
  videoUri: string;
  thumbnailUri?: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
  likedBy: string[];
  createdAt?: any;
  approvedAt?: any;
  approvedBy?: string;
  rejectedAt?: any;
  rejectedBy?: string;
  rejectionReason?: string;
}

const TESTIMONIALS_COLLECTION = 'testimonials';

/**
 * Submit a new testimonial (by miner)
 * Status: pending (awaits safety officer approval)
 */
export async function submitTestimonial(testimonialData: Omit<Testimonial, 'id' | 'createdAt'>): Promise<string> {
  try {
    const testimonialRef = await addDoc(collection(db, TESTIMONIALS_COLLECTION), {
      ...testimonialData,
      createdAt: serverTimestamp(),
      status: 'pending',
    });
    
    console.log('✅ Testimonial submitted for review:', testimonialRef.id);
    return testimonialRef.id;
  } catch (error) {
    console.error('❌ Error submitting testimonial:', error);
    throw error;
  }
}

/**
 * Get all approved testimonials (visible to all miners)
 */
export async function getApprovedTestimonials(): Promise<Testimonial[]> {
  try {
    const q = query(
      collection(db, TESTIMONIALS_COLLECTION),
      where('status', '==', 'approved'),
      orderBy('approvedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const testimonials: Testimonial[] = [];
    
    querySnapshot.forEach((doc) => {
      testimonials.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toMillis() || Date.now(),
      } as Testimonial);
    });
    
    console.log(`✅ Loaded ${testimonials.length} approved testimonials`);
    return testimonials;
  } catch (error) {
    console.error('❌ Error loading approved testimonials:', error);
    throw error;
  }
}

/**
 * Get pending testimonials (for safety officer review)
 */
export async function getPendingTestimonials(): Promise<Testimonial[]> {
  try {
    const q = query(
      collection(db, TESTIMONIALS_COLLECTION),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const testimonials: Testimonial[] = [];
    
    querySnapshot.forEach((doc) => {
      testimonials.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toMillis() || Date.now(),
      } as Testimonial);
    });
    
    console.log(`✅ Loaded ${testimonials.length} pending testimonials`);
    return testimonials;
  } catch (error) {
    console.error('❌ Error loading pending testimonials:', error);
    throw error;
  }
}

/**
 * Get user's own testimonials (all statuses)
 */
export async function getMyTestimonials(userId: string): Promise<Testimonial[]> {
  try {
    const q = query(
      collection(db, TESTIMONIALS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const testimonials: Testimonial[] = [];
    
    querySnapshot.forEach((doc) => {
      testimonials.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toMillis() || Date.now(),
      } as Testimonial);
    });
    
    console.log(`✅ Loaded ${testimonials.length} user testimonials`);
    return testimonials;
  } catch (error) {
    console.error('❌ Error loading user testimonials:', error);
    throw error;
  }
}

/**
 * Approve a testimonial (by safety officer)
 */
export async function approveTestimonial(
  testimonialId: string, 
  approvedBy: string
): Promise<void> {
  try {
    const testimonialRef = doc(db, TESTIMONIALS_COLLECTION, testimonialId);
    
    await updateDoc(testimonialRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      approvedBy: approvedBy,
    });
    
    console.log('✅ Testimonial approved:', testimonialId);
  } catch (error) {
    console.error('❌ Error approving testimonial:', error);
    throw error;
  }
}

/**
 * Reject a testimonial (by safety officer)
 */
export async function rejectTestimonial(
  testimonialId: string, 
  rejectedBy: string, 
  reason?: string
): Promise<void> {
  try {
    const testimonialRef = doc(db, TESTIMONIALS_COLLECTION, testimonialId);
    
    await updateDoc(testimonialRef, {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
      rejectedBy: rejectedBy,
      rejectionReason: reason || 'Does not meet guidelines',
    });
    
    console.log('✅ Testimonial rejected:', testimonialId);
  } catch (error) {
    console.error('❌ Error rejecting testimonial:', error);
    throw error;
  }
}

/**
 * Toggle like on a testimonial
 */
export async function toggleLikeTestimonial(
  testimonialId: string, 
  userId: string
): Promise<void> {
  try {
    const testimonialRef = doc(db, TESTIMONIALS_COLLECTION, testimonialId);
    const testimonialSnap = await getDoc(testimonialRef);
    
    if (!testimonialSnap.exists()) {
      throw new Error('Testimonial not found');
    }
    
    const data = testimonialSnap.data();
    const likedBy = data.likedBy || [];
    const alreadyLiked = likedBy.includes(userId);
    
    await updateDoc(testimonialRef, {
      likes: alreadyLiked ? data.likes - 1 : data.likes + 1,
      likedBy: alreadyLiked 
        ? likedBy.filter((id: string) => id !== userId)
        : [...likedBy, userId],
    });
    
    console.log(alreadyLiked ? '👎 Like removed' : '👍 Like added');
  } catch (error) {
    console.error('❌ Error toggling like:', error);
    throw error;
  }
}

/**
 * Get testimonial statistics (for safety officer dashboard)
 */
export async function getTestimonialStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}> {
  try {
    const allTestimonials = await getDocs(collection(db, TESTIMONIALS_COLLECTION));
    
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    
    allTestimonials.forEach((doc) => {
      const status = doc.data().status;
      if (status === 'pending') pending++;
      else if (status === 'approved') approved++;
      else if (status === 'rejected') rejected++;
    });
    
    return {
      total: allTestimonials.size,
      pending,
      approved,
      rejected,
    };
  } catch (error) {
    console.error('❌ Error getting testimonial stats:', error);
    throw error;
  }
}
