import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface DetectionImagePreviewProps {
  imageUri: string;
}

export default function DetectionImagePreview({ imageUri }: DetectionImagePreviewProps) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: imageUri }}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
