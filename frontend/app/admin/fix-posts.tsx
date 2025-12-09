import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';
import { COLORS } from '../../constants/styles';
import { useRouter } from 'expo-router';

export default function FixPostsScreen() {
    const router = useRouter();
    const [log, setLog] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const addLog = (message: string) => {
        console.log(message);
        setLog(prev => [...prev, message]);
    };

    const fixPosts = async () => {
        if (isRunning) return;
        
        setIsRunning(true);
        setLog([]);
        
        try {
            addLog('🔍 Starting fix process...');
            
            // Get all posts without URLs
            const postsSnapshot = await getDocs(collection(db, 'posts'));
            addLog(`📦 Found ${postsSnapshot.size} total posts`);
            
            const postsToFix: any[] = [];
            postsSnapshot.forEach((doc) => {
                const data = doc.data();
                if (!data.mediaUrl && !data.videoUrl) {
                    postsToFix.push({ id: doc.id, ...data });
                }
            });
            
            addLog(`🔧 Need to fix ${postsToFix.length} posts`);
            
            // Get all photos from Firebase Storage
            addLog('📸 Fetching photos from Storage...');
            const storage = getStorage();
            const photosRef = ref(storage, 'photos');
            
            try {
                const photosList = await listAll(photosRef);
                addLog(`Found ${photosList.items.length} photos in storage`);
                
                // Group photos by userId
                const userPhotos: { [key: string]: any[] } = {};
                
                for (const itemRef of photosList.items) {
                    const fileName = itemRef.name; // e.g., "911234567890_1765278521997.jpg"
                    const match = fileName.match(/^([^_]+)_(\d+)\.(jpg|png|jpeg)$/i);
                    
                    if (match) {
                        const userId = match[1];
                        const timestamp = parseInt(match[2]);
                        const url = await getDownloadURL(itemRef);
                        
                        if (!userPhotos[userId]) {
                            userPhotos[userId] = [];
                        }
                        
                        userPhotos[userId].push({
                            url,
                            timestamp,
                            fileName
                        });
                    }
                }
                
                // Sort photos by timestamp for each user
                for (const userId in userPhotos) {
                    userPhotos[userId].sort((a, b) => a.timestamp - b.timestamp);
                }
                
                addLog(`👥 Found photos for ${Object.keys(userPhotos).length} users`);
                
                // Fix each post
                let fixedCount = 0;
                for (const post of postsToFix) {
                    const userId = post.userId;
                    
                    if (userPhotos[userId] && userPhotos[userId].length > 0) {
                        const photo = userPhotos[userId].shift();
                        
                        await updateDoc(doc(db, 'posts', post.id), {
                            mediaUrl: photo.url,
                            videoUrl: photo.url,
                            videoType: 'photo'
                        });
                        
                        addLog(`✅ Fixed post ${post.id.substring(0, 8)}... with ${photo.fileName}`);
                        fixedCount++;
                    } else {
                        addLog(`⚠️ No photos for user ${userId}`);
                    }
                }
                
                addLog(`\n✨ Complete! Fixed ${fixedCount}/${postsToFix.length} posts`);
                
                Alert.alert(
                    'Success! 🎉',
                    `Fixed ${fixedCount} posts. Check your profile now!`,
                    [
                        {
                            text: 'Go to Profile',
                            onPress: () => router.push('/miner/Profile')
                        },
                        { text: 'OK' }
                    ]
                );
                
            } catch (storageError) {
                addLog(`❌ Storage error: ${storageError}`);
                Alert.alert('Error', 'Could not access Firebase Storage. Make sure photos are uploaded.');
            }
            
        } catch (error) {
            addLog(`❌ Error: ${error}`);
            Alert.alert('Error', 'Failed to fix posts');
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Fix Posts URLs</Text>
                <Text style={styles.subtitle}>
                    This will add image URLs to posts that are missing them
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.button, isRunning && styles.buttonDisabled]}
                onPress={fixPosts}
                disabled={isRunning}
            >
                <Text style={styles.buttonText}>
                    {isRunning ? 'Running...' : 'Fix My Posts'}
                </Text>
            </TouchableOpacity>

            <ScrollView style={styles.logContainer}>
                {log.map((line, index) => (
                    <Text key={index} style={styles.logText}>
                        {line}
                    </Text>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 20,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    logContainer: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
    },
    logText: {
        fontSize: 12,
        color: COLORS.text,
        fontFamily: 'monospace',
        marginBottom: 4,
    },
});
