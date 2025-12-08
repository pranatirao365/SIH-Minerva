/**
 * Utility to clear old/dummy quizzes from Firestore
 * Run this once to clean up the database
 */

import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function clearOldQuizzes() {
  try {
    console.log('🗑️  Starting to clear old quizzes...');
    
    const quizzesSnapshot = await getDocs(collection(db, 'dailyQuizzes'));
    
    if (quizzesSnapshot.empty) {
      console.log('✅ No quizzes found to delete');
      return true;
    }

    let deletedCount = 0;
    
    for (const quizDoc of quizzesSnapshot.docs) {
      try {
        await deleteDoc(doc(db, 'dailyQuizzes', quizDoc.id));
        deletedCount++;
        console.log(`🗑️  Deleted quiz: ${quizDoc.id}`);
      } catch (error) {
        console.error(`❌ Failed to delete quiz ${quizDoc.id}:`, error);
      }
    }

    console.log(`✅ Successfully deleted ${deletedCount} quizzes`);
    return true;
  } catch (error) {
    console.error('❌ Error clearing quizzes:', error);
    return false;
  }
}
