import { Video } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    Clock,
    User,
    Video as VideoIcon,
    X,
    XCircle
} from '../../components/Icons';
import { COLORS } from '../../constants/styles';
import { useRoleStore } from '../../hooks/useRoleStore';
import {
    approveTestimonial,
    getPendingTestimonials,
    getTestimonialStats,
    rejectTestimonial,
    Testimonial
} from '../../services/testimonialService';

const { width } = Dimensions.get('window');

export default function TestimonialReview() {
  const router = useRouter();
  const { user } = useRoleStore();
  const [pendingTestimonials, setPendingTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pending, statistics] = await Promise.all([
        getPendingTestimonials(),
        getTestimonialStats()
      ]);
      setPendingTestimonials(pending);
      setStats(statistics);
      console.log(`✅ Loaded ${pending.length} pending testimonials`);
    } catch (error) {
      console.error('❌ Error loading data:', error);
      Alert.alert('Error', 'Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (testimonialId: string) => {
    if (!testimonialId) return;

    Alert.alert(
      'Approve Testimonial',
      'This testimonial will be visible to all miners. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setProcessing(testimonialId);
              const approverIdentifier = user.phone || user.id || 'safety_officer';
              await approveTestimonial(testimonialId, approverIdentifier);
              
              Alert.alert('✅ Approved', 'Testimonial has been approved and is now visible to all miners.');
              await loadData();
            } catch (error) {
              console.error('❌ Error approving:', error);
              Alert.alert('Error', 'Failed to approve testimonial');
            } finally {
              setProcessing(null);
            }
          }
        }
      ]
    );
  };

  const handleRejectClick = (testimonialId: string) => {
    setRejectingId(testimonialId);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId) return;

    try {
      setProcessing(rejectingId);
      const rejecterIdentifier = user.phone || user.id || 'safety_officer';
      await rejectTestimonial(
        rejectingId, 
        rejecterIdentifier, 
        rejectionReason.trim() || 'Does not meet safety guidelines'
      );
      
      setShowRejectModal(false);
      setRejectingId(null);
      setRejectionReason('');
      
      Alert.alert('Rejected', 'Testimonial has been rejected. The miner will be notified.');
      await loadData();
    } catch (error) {
      console.error('❌ Error rejecting:', error);
      Alert.alert('Error', 'Failed to reject testimonial');
    } finally {
      setProcessing(null);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Testimonial Review</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Clock size={24} color="#F59E0B" />
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <CheckCircle size={24} color="#10B981" />
          <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.approved}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
          <AlertCircle size={24} color="#EF4444" />
          <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.rejected}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading testimonials...</Text>
          </View>
        ) : pendingTestimonials.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyStateText}>All Caught Up!</Text>
            <Text style={styles.emptyStateSubtext}>
              No pending testimonials to review
            </Text>
          </View>
        ) : (
          pendingTestimonials.map((testimonial) => (
            <View key={testimonial.id} style={styles.testimonialCard}>
              {/* User Info */}
              <View style={styles.userSection}>
                <View style={styles.userAvatar}>
                  <User size={20} color="#FFFFFF" />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{testimonial.userName}</Text>
                  <Text style={styles.userRole}>{testimonial.userRole}</Text>
                  <Text style={styles.timestamp}>{formatTimestamp(testimonial.timestamp)}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Clock size={14} color="#F59E0B" />
                  <Text style={styles.statusText}>Pending</Text>
                </View>
              </View>

              {/* Video Preview */}
              <View style={styles.videoContainer}>
                {testimonial.videoUri ? (
                  <Video
                    source={{ uri: testimonial.videoUri }}
                    style={styles.videoPreview}
                    useNativeControls
                    resizeMode="contain"
                    isLooping
                    shouldPlay={false}
                    onError={(error) => console.error('Video error:', error)}
                    onLoad={() => console.log('Video loaded:', testimonial.videoUri)}
                  />
                ) : (
                  <View style={styles.videoPreviewPlaceholder}>
                    <VideoIcon size={48} color={COLORS.textMuted} />
                    <Text style={styles.videoPreviewText}>No Video Available</Text>
                  </View>
                )}
              </View>

              {/* Caption */}
              <View style={styles.captionSection}>
                <Text style={styles.captionLabel}>Caption:</Text>
                <Text style={styles.caption}>{testimonial.caption}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApprove(testimonial.id!)}
                  disabled={processing === testimonial.id}
                >
                  {processing === testimonial.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <CheckCircle size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleRejectClick(testimonial.id!)}
                  disabled={processing === testimonial.id}
                >
                  <XCircle size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Rejection Modal */}
      <Modal
        visible={showRejectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Testimonial</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Reason for Rejection (Optional)</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Explain why this testimonial is being rejected..."
                placeholderTextColor={COLORS.textMuted}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
                maxLength={200}
              />
              <Text style={styles.charCount}>{rejectionReason.length}/200</Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowRejectModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmRejectButton]}
                  onPress={handleRejectConfirm}
                  disabled={!!processing}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Confirm Rejection</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  testimonialCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  userRole: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  videoContainer: {
    marginBottom: 16,
  },
  videoPreview: {
    backgroundColor: '#000000',
    borderRadius: 12,
    height: 250,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  videoPreviewPlaceholder: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  videoPreviewText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  captionSection: {
    marginBottom: 16,
  },
  captionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  reasonInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  confirmRejectButton: {
    backgroundColor: '#EF4444',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
