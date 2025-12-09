/**
 * Social Service - Handles all social interactions
 * Features: Follow/Unfollow, Likes, Comments, Shares, User Profiles
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ==================== INTERFACES ====================

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: string;
  avatar?: string;
  bio?: string;
  department?: string;
  followers: string[]; // User IDs who follow this user
  following: string[]; // User IDs this user follows
  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'reel' | 'post' | 'story';
  content: {
    videoUrl?: string;
    imageUrl?: string;
    caption: string;
    hashtags: string[];
  };
  likes: string[]; // User IDs who liked
  comments: PostComment[];
  shares: number;
  saves: string[]; // User IDs who saved
  views: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PostComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  likes: string[];
  replies: PostComment[];
  createdAt: Timestamp;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'share';
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  postId?: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
}

// ==================== USER PROFILE ====================

/**
 * Get user profile with social stats
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.log('User not found:', userId);
      return null;
    }

    const userData = userDoc.data();
    
    return {
      id: userDoc.id,
      name: userData.name || 'Unknown User',
      phone: userData.phone || '',
      role: userData.role || 'miner',
      avatar: userData.avatar,
      bio: userData.bio || '',
      department: userData.department,
      followers: userData.followers || [],
      following: userData.following || [],
      postsCount: userData.postsCount || 0,
      followersCount: userData.followersCount || 0,
      followingCount: userData.followingCount || 0,
      likesCount: userData.likesCount || 0,
      createdAt: userData.createdAt || Timestamp.now(),
      updatedAt: userData.updatedAt || Timestamp.now(),
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * Initialize social profile fields for existing user
 */
export const initializeSocialProfile = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      
      // Only update if social fields don't exist
      if (!data.followers) {
        await updateDoc(userRef, {
          followers: [],
          following: [],
          postsCount: 0,
          followersCount: 0,
          followingCount: 0,
          likesCount: 0,
          updatedAt: serverTimestamp(),
        });
        console.log('✅ Social profile initialized for:', userId);
      }
    }
  } catch (error) {
    console.error('Error initializing social profile:', error);
  }
};

// ==================== FOLLOW / UNFOLLOW ====================

/**
 * Follow a user
 */
export const followUser = async (
  currentUserId: string,
  targetUserId: string
): Promise<boolean> => {
  if (currentUserId === targetUserId) {
    console.log('Cannot follow yourself');
    return false;
  }

  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    // Get both user documents
    const [currentUserDoc, targetUserDoc] = await Promise.all([
      getDoc(currentUserRef),
      getDoc(targetUserRef),
    ]);

    if (!currentUserDoc.exists() || !targetUserDoc.exists()) {
      console.log('User not found');
      return false;
    }

    const currentUserData = currentUserDoc.data();
    const targetUserData = targetUserDoc.data();

    // Check if already following
    const following = currentUserData.following || [];
    if (following.includes(targetUserId)) {
      console.log('Already following this user');
      return false;
    }

    // Update both users
    await Promise.all([
      // Add to current user's following
      updateDoc(currentUserRef, {
        following: arrayUnion(targetUserId),
        followingCount: increment(1),
        updatedAt: serverTimestamp(),
      }),
      // Add to target user's followers
      updateDoc(targetUserRef, {
        followers: arrayUnion(currentUserId),
        followersCount: increment(1),
        updatedAt: serverTimestamp(),
      }),
    ]);

    // Create notification
    await createNotification({
      type: 'follow',
      fromUserId: currentUserId,
      fromUserName: currentUserData.name || 'Someone',
      toUserId: targetUserId,
      message: `${currentUserData.name || 'Someone'} started following you`,
    });

    console.log('✅ Successfully followed user');
    return true;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (
  currentUserId: string,
  targetUserId: string
): Promise<boolean> => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    // Update both users
    await Promise.all([
      // Remove from current user's following
      updateDoc(currentUserRef, {
        following: arrayRemove(targetUserId),
        followingCount: increment(-1),
        updatedAt: serverTimestamp(),
      }),
      // Remove from target user's followers
      updateDoc(targetUserRef, {
        followers: arrayRemove(currentUserId),
        followersCount: increment(-1),
        updatedAt: serverTimestamp(),
      }),
    ]);

    console.log('✅ Successfully unfollowed user');
    return true;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }
};

/**
 * Check if current user follows target user
 */
export const isFollowing = async (
  currentUserId: string,
  targetUserId: string
): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUserId));
    if (!userDoc.exists()) return false;

    const following = userDoc.data().following || [];
    return following.includes(targetUserId);
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
};

/**
 * Get user's followers list
 */
export const getFollowers = async (userId: string): Promise<UserProfile[]> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return [];

    const followerIds = userDoc.data().followers || [];
    if (followerIds.length === 0) return [];

    const followers = await Promise.all(
      followerIds.map((id: string) => getUserProfile(id))
    );

    return followers.filter((user) => user !== null) as UserProfile[];
  } catch (error) {
    console.error('Error fetching followers:', error);
    return [];
  }
};

/**
 * Get user's following list
 */
export const getFollowing = async (userId: string): Promise<UserProfile[]> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return [];

    const followingIds = userDoc.data().following || [];
    if (followingIds.length === 0) return [];

    const following = await Promise.all(
      followingIds.map((id: string) => getUserProfile(id))
    );

    return following.filter((user) => user !== null) as UserProfile[];
  } catch (error) {
    console.error('Error fetching following:', error);
    return [];
  }
};

// ==================== POST INTERACTIONS ====================

/**
 * Like a post
 */
export const likePost = async (
  postId: string,
  userId: string,
  userName: string,
  postOwnerId: string
): Promise<boolean> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      console.log('Post not found');
      return false;
    }

    const likes = postDoc.data().likedBy || [];
    
    if (likes.includes(userId)) {
      console.log('Already liked');
      return false;
    }

    // Update post
    await updateDoc(postRef, {
      likedBy: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });

    // Update post owner's like count (only if user exists)
    if (postOwnerId !== userId) {
      try {
        const ownerDoc = await getDoc(doc(db, 'users', postOwnerId));
        if (ownerDoc.exists()) {
          await updateDoc(doc(db, 'users', postOwnerId), {
            likesCount: increment(1),
          });

          // Create notification
          await createNotification({
            type: 'like',
            fromUserId: userId,
            fromUserName: userName,
            toUserId: postOwnerId,
            postId,
            message: `${userName} liked your post`,
          });
        } else {
          console.log('⚠️ Post owner not found, skipping notification');
        }
      } catch (ownerError) {
        console.warn('⚠️ Could not update post owner likes:', ownerError);
        // Continue anyway - the like on the post itself succeeded
      }
    }

    console.log('✅ Post liked');
    return true;
  } catch (error) {
    console.error('Error liking post:', error);
    return false;
  }
};

/**
 * Unlike a post
 */
export const unlikePost = async (
  postId: string,
  userId: string,
  postOwnerId: string
): Promise<boolean> => {
  try {
    const postRef = doc(db, 'posts', postId);

    // Update post
    await updateDoc(postRef, {
      likedBy: arrayRemove(userId),
      updatedAt: serverTimestamp(),
    });

    // Update post owner's like count (only if user exists)
    if (postOwnerId !== userId) {
      try {
        const ownerDoc = await getDoc(doc(db, 'users', postOwnerId));
        if (ownerDoc.exists()) {
          await updateDoc(doc(db, 'users', postOwnerId), {
            likesCount: increment(-1),
          });
        }
      } catch (ownerError) {
        console.warn('⚠️ Could not update post owner likes:', ownerError);
        // Continue anyway - the unlike on the post itself succeeded
      }
    }

    console.log('✅ Post unliked');
    return true;
  } catch (error) {
    console.error('Error unliking post:', error);
    return false;
  }
};

/**
 * Save a post
 */
export const savePost = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) return false;

    const saves = postDoc.data().savedBy || [];
    
    if (saves.includes(userId)) {
      // Unsave
      await updateDoc(postRef, {
        savedBy: arrayRemove(userId),
      });
      console.log('✅ Post unsaved');
    } else {
      // Save
      await updateDoc(postRef, {
        savedBy: arrayUnion(userId),
      });
      console.log('✅ Post saved');
    }

    return true;
  } catch (error) {
    console.error('Error saving post:', error);
    return false;
  }
};

/**
 * Add comment to post
 */
export const addComment = async (
  postId: string,
  userId: string,
  userName: string,
  commentText: string,
  postOwnerId: string
): Promise<boolean> => {
  try {
    const postRef = doc(db, 'posts', postId);
    
    const newComment: PostComment = {
      id: Date.now().toString(),
      userId,
      userName,
      text: commentText,
      likes: [],
      replies: [],
      createdAt: Timestamp.now(),
    };

    await updateDoc(postRef, {
      comments: arrayUnion(newComment),
      updatedAt: serverTimestamp(),
    });

    // Create notification (only if post owner exists)
    if (postOwnerId !== userId) {
      try {
        const ownerDoc = await getDoc(doc(db, 'users', postOwnerId));
        if (ownerDoc.exists()) {
          await createNotification({
            type: 'comment',
            fromUserId: userId,
            fromUserName: userName,
            toUserId: postOwnerId,
            postId,
            message: `${userName} commented on your post`,
          });
        }
      } catch (notifError) {
        console.warn('⚠️ Could not send notification to post owner:', notifError);
      }
    }

    console.log('✅ Comment added');
    return true;
  } catch (error) {
    console.error('Error adding comment:', error);
    return false;
  }
};

/**
 * Increment post share count
 */
export const sharePost = async (
  postId: string,
  userId: string,
  userName: string,
  postOwnerId: string
): Promise<boolean> => {
  try {
    const postRef = doc(db, 'posts', postId);
    
    await updateDoc(postRef, {
      shares: increment(1),
      updatedAt: serverTimestamp(),
    });

    // Create notification (only if post owner exists)
    if (postOwnerId !== userId) {
      try {
        const ownerDoc = await getDoc(doc(db, 'users', postOwnerId));
        if (ownerDoc.exists()) {
          await createNotification({
            type: 'share',
            fromUserId: userId,
            fromUserName: userName,
            toUserId: postOwnerId,
            postId,
            message: `${userName} shared your post`,
          });
        }
      } catch (notifError) {
        console.warn('⚠️ Could not send notification to post owner:', notifError);
      }
    }

    console.log('✅ Post shared');
    return true;
  } catch (error) {
    console.error('Error sharing post:', error);
    return false;
  }
};

/**
 * Increment post view count
 * Note: Frontend debounces this with viewedReels tracking to prevent duplicate counts
 */
export const incrementPostViews = async (postId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    
    // Increment view count
    await updateDoc(postRef, {
      views: increment(1),
    });
    
    console.log(`📊 View incremented for post: ${postId}`);
  } catch (error) {
    console.error('Error incrementing views:', error);
  }
};

// ==================== NOTIFICATIONS ====================

/**
 * Create a notification
 */
export const createNotification = async (
  notification: Omit<Notification, 'id' | 'read' | 'createdAt'>
): Promise<void> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    await setDoc(doc(notificationsRef), {
      ...notification,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

/**
 * Get user's notifications
 */
export const getUserNotifications = async (
  userId: string,
  limitCount: number = 20
): Promise<Notification[]> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('toUserId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const notifications: Notification[] = [];

    snapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
      } as Notification);
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

// ==================== DISCOVER USERS ====================

/**
 * Get suggested users to follow
 */
export const getSuggestedUsers = async (
  currentUserId: string,
  limitCount: number = 10
): Promise<UserProfile[]> => {
  try {
    // Get current user's following list
    const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
    const following = currentUserDoc.data()?.following || [];

    // Get all users
    const usersRef = collection(db, 'users');
    const q = query(usersRef, limit(50));
    const snapshot = await getDocs(q);

    const suggestedUsers: UserProfile[] = [];

    snapshot.forEach((doc) => {
      // Don't suggest current user or already following
      if (doc.id !== currentUserId && !following.includes(doc.id)) {
        const data = doc.data();
        suggestedUsers.push({
          id: doc.id,
          name: data.name || 'Unknown User',
          phone: data.phone || '',
          role: data.role || 'miner',
          avatar: data.avatar,
          bio: data.bio,
          department: data.department,
          followers: data.followers || [],
          following: data.following || [],
          postsCount: data.postsCount || 0,
          followersCount: data.followersCount || 0,
          followingCount: data.followingCount || 0,
          likesCount: data.likesCount || 0,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now(),
        });
      }
    });

    // Sort by followers count and return limited results
    return suggestedUsers
      .sort((a, b) => b.followersCount - a.followersCount)
      .slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching suggested users:', error);
    return [];
  }
};

/**
 * Search users by name or phone
 */
export const searchUsers = async (
  searchQuery: string,
  currentUserId: string
): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    const results: UserProfile[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    snapshot.forEach((doc) => {
      if (doc.id === currentUserId) return; // Skip current user

      const data = doc.data();
      const name = (data.name || '').toLowerCase();
      const phone = (data.phone || '').toLowerCase();

      if (name.includes(lowerQuery) || phone.includes(lowerQuery)) {
        results.push({
          id: doc.id,
          name: data.name || 'Unknown User',
          phone: data.phone || '',
          role: data.role || 'miner',
          avatar: data.avatar,
          bio: data.bio,
          department: data.department,
          followers: data.followers || [],
          following: data.following || [],
          postsCount: data.postsCount || 0,
          followersCount: data.followersCount || 0,
          followingCount: data.followingCount || 0,
          likesCount: data.likesCount || 0,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now(),
        });
      }
    });

    return results;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

// ==================== REAL-TIME LISTENERS ====================

/**
 * Listen to user profile changes
 */
export const subscribeToUserProfile = (
  userId: string,
  callback: (profile: UserProfile | null) => void
): (() => void) => {
  const userRef = doc(db, 'users', userId);
  
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback({
        id: doc.id,
        name: data.name || 'Unknown User',
        phone: data.phone || '',
        role: data.role || 'miner',
        avatar: data.avatar,
        bio: data.bio,
        department: data.department,
        followers: data.followers || [],
        following: data.following || [],
        postsCount: data.postsCount || 0,
        followersCount: data.followersCount || 0,
        followingCount: data.followingCount || 0,
        likesCount: data.likesCount || 0,
        createdAt: data.createdAt || Timestamp.now(),
        updatedAt: data.updatedAt || Timestamp.now(),
      });
    } else {
      callback(null);
    }
  });
};

/**
 * Listen to notifications
 */
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
): (() => void) => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('toUserId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications: Notification[] = [];
    snapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
      } as Notification);
    });
    callback(notifications);
  });
};
