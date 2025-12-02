import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Image as RNImage, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Upload } from '../Icons';

interface ImagePickerComponentProps {
  onImageSelected: (uri: string) => void;
  selectedImage?: string | null;
  loading?: boolean;
  onClear?: () => void;
}

export default function ImagePickerComponent({ 
  onImageSelected, 
  selectedImage, 
  loading = false,
  onClear 
}: ImagePickerComponentProps) {
  const [showBottomSheet, setShowBottomSheet] = React.useState(false);

  const pickFromGallery = async () => {
    setShowBottomSheet(false);
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        alert('Permission to access gallery is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      alert('Failed to pick image');
    }
  };

  const captureFromCamera = async () => {
    setShowBottomSheet(false);
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        alert('Permission to access camera is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error capturing image from camera:', error);
      alert('Failed to capture image');
    }
  };

  const isProcessing = loading;

  return (
    <View style={styles.container}>
      {/* Image Preview */}
      {selectedImage && (
        <View style={styles.previewContainer}>
          <RNImage
            source={{ uri: selectedImage }}
            style={styles.preview}
            resizeMode="cover"
          />
          {onClear && !isProcessing && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={onClear}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Single "Add Image" Button */}
      {!selectedImage && (
        <TouchableOpacity
          style={[styles.addButton, isProcessing && styles.addButtonDisabled]}
          onPress={() => setShowBottomSheet(true)}
          disabled={isProcessing}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FF6B00" />
          ) : (
            <>
              <Camera size={24} color="#FF6B00" />
              <Text style={styles.addButtonText}>Add Image</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Bottom Sheet Modal */}
      <Modal
        visible={showBottomSheet}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowBottomSheet(false)}
      >
        <TouchableOpacity
          style={styles.bottomSheetOverlay}
          activeOpacity={1}
          onPress={() => setShowBottomSheet(false)}
        >
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHandle} />
            
            <Text style={styles.bottomSheetTitle}>Add Image</Text>

            <TouchableOpacity
              style={styles.bottomSheetOption}
              onPress={pickFromGallery}
            >
              <Upload size={24} color="#FF6B00" />
              <Text style={styles.bottomSheetOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomSheetOption}
              onPress={captureFromCamera}
            >
              <Camera size={24} color="#FF6B00" />
              <Text style={styles.bottomSheetOptionText}>Capture with Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomSheetCancel}
              onPress={() => setShowBottomSheet(false)}
            >
              <Text style={styles.bottomSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  preview: {
    width: '100%',
    height: 220,
    backgroundColor: '#1A1A1A',
  },
  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#EF4444',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#E5E5E5',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: '#1F1F1F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 8,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#3A3A3A',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  bottomSheetTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  bottomSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  bottomSheetOptionText: {
    color: '#E5E5E5',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
  },
  bottomSheetCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  bottomSheetCancelText: {
    color: '#737373',
    fontSize: 16,
    fontWeight: '600',
  },
});
