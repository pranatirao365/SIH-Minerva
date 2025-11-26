import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Test Firebase Firestore connection
 */
export const testFirestoreConnection = async () => {
  try {
    console.log('Testing Firestore connection...');
    
    // Try to read from users collection
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    console.log('✅ Firestore connection successful!');
    console.log(`Found ${snapshot.size} user(s) in database`);
    
    snapshot.forEach(doc => {
      console.log(`- User: ${doc.id}, Role: ${doc.data().role}`);
    });
    
    return {
      success: true,
      userCount: snapshot.size
    };
  } catch (error: any) {
    console.error('❌ Firestore connection failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Test fetching a specific user
 */
export const testGetUser = async (phoneNumber: string) => {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    
    // Remove +91 if present
    const phone = phoneNumber.replace('+91', '');
    
    console.log(`Testing user fetch for: ${phone}`);
    
    const userDoc = await getDoc(doc(db, 'users', phone));
    
    if (userDoc.exists()) {
      console.log('✅ User found!');
      console.log('User data:', userDoc.data());
      return {
        success: true,
        userData: userDoc.data()
      };
    } else {
      console.log('❌ User not found in database');
      return {
        success: false,
        error: 'User not found'
      };
    }
  } catch (error: any) {
    console.error('❌ Error fetching user:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
