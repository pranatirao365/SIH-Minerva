import { Video as VideoPlayer } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AudioPlayer from '../../components/AudioPlayer';
import { AlertTriangle, ArrowLeft, Camera, CheckSquare, FileText, Mic } from '../../components/Icons';
import type { Incident } from '../../services/incidentService';
import { subscribeToIncidents, updateIncidentStatus } from '../../services/incidentService';

export default function IncidentDashboard() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [updatingReviewed, setUpdatingReviewed] = useState(false);
  const [updatingResolved, setUpdatingResolved] = useState(false);

  useEffect(() => {
    console.log('📊 Subscribing to incidents...');
    
    // Set timeout to stop loading after 3 seconds
    const loadingTimeout = setTimeout(() => {
      console.log('⏱️ Loading timeout - using fallback');
      setLoading(false);
    }, 3000);

    const unsubscribe = subscribeToIncidents((newIncidents) => {
      console.log('📥 Received incidents:', newIncidents.length);
      clearTimeout(loadingTimeout);
      setIncidents(newIncidents);
      setLoading(false);
    });

    return () => {
      console.log('🔌 Unsubscribing from incidents');
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  const filteredIncidents = incidents.filter(incident => 
    filter === 'all' ? true : incident.status === filter
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Camera size={16} color="#FF6B00" />;
      case 'video': return <Camera size={16} color="#FF6B00" />;
      case 'audio': return <Mic size={16} color="#FF6B00" />;
      default: return <FileText size={16} color="#FF6B00" />;
    }
  };

  const handleUpdateStatus = async (incidentId: string, newStatus: 'reviewed' | 'resolved') => {
    if (newStatus === 'reviewed') {
      setUpdatingReviewed(true);
    } else {
      setUpdatingResolved(true);
    }
    try {
      console.log(`🔄 Updating incident ${incidentId} to ${newStatus}...`);
      await updateIncidentStatus(incidentId, newStatus);
      console.log('✅ Status update successful');
      Alert.alert('Success', `Incident marked as ${newStatus}`);
      // Refresh the incident in the modal if it's still open
      if (selectedIncident && selectedIncident.incidentId === incidentId) {
        setSelectedIncident(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error: any) {
      console.error('❌ Failed to update incident status:', error);
      Alert.alert('Error', error.message || 'Failed to update status');
    } finally {
      if (newStatus === 'reviewed') {
        setUpdatingReviewed(false);
      } else {
        setUpdatingResolved(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      pending: { bg: '#FEF3C7', text: '#92400E' },
      reviewed: { bg: '#DBEAFE', text: '#1E40AF' },
      resolved: { bg: '#D1FAE5', text: '#065F46' }
    };

    return (
      <View style={{ backgroundColor: colors[status]?.bg || '#F3F4F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start' }}>
        <Text style={{ color: colors[status]?.text || '#374151', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>
          {status.toUpperCase()}
        </Text>
      </View>
    );
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1F1F1F' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={{ color: '#FFFFFF', fontSize: 19, fontWeight: '700', marginLeft: 14 }}>Reported Incidents</Text>
      </View>

      {/* Filter Tabs - Modern Tab Bar */}
      <View style={{ backgroundColor: '#1F1F1F', borderBottomWidth: 1, borderBottomColor: '#2A2A2A' }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 0 }}>
          {(['all', 'pending', 'reviewed', 'resolved'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilter(tab)}
              style={{
                flex: 1,
                paddingVertical: 17,
                paddingHorizontal: 3,
                alignItems: 'center',
                justifyContent: 'center',
                borderBottomWidth: filter === tab ? 3 : 0,
                borderBottomColor: '#FF6B00'
              }}
            >
              <Text style={{ 
                color: filter === tab ? '#FF6B00' : '#737373', 
                fontSize: 13.5, 
                fontWeight: filter === tab ? '700' : '600',
                textTransform: 'capitalize'
              }}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats Card */}
      <View style={{ marginHorizontal: 24, marginVertical: 12, backgroundColor: '#1F1F1F', borderRadius: 12, padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#F59E0B', fontSize: 20, fontWeight: 'bold' }}>
              {incidents.filter(i => i.status === 'pending').length}
            </Text>
            <Text style={{ color: '#737373', fontSize: 13, marginTop: 4 }}>Pending</Text>
          </View>
          <View style={{ width: 1, backgroundColor: '#2A2A2A' }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#3B82F6', fontSize: 20, fontWeight: 'bold' }}>
              {incidents.filter(i => i.status === 'reviewed').length}
            </Text>
            <Text style={{ color: '#737373', fontSize: 13, marginTop: 4 }}>Reviewed</Text>
          </View>
          <View style={{ width: 1, backgroundColor: '#2A2A2A' }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#10B981', fontSize: 20, fontWeight: 'bold' }}>
              {incidents.filter(i => i.status === 'resolved').length}
            </Text>
            <Text style={{ color: '#737373', fontSize: 13, marginTop: 4 }}>Resolved</Text>
          </View>
        </View>
      </View>

      {/* Incidents List */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 24 }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48 }}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={{ color: '#737373', marginTop: 16 }}>Loading incidents...</Text>
          </View>
        ) : filteredIncidents.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48 }}>
            <AlertTriangle size={48} color="#737373" />
            <Text style={{ color: '#737373', marginTop: 16, fontSize: 16 }}>No incidents found</Text>
            <Text style={{ color: '#525252', marginTop: 4, fontSize: 14 }}>
              {filter === 'all' ? 'All incidents will appear here' : `No ${filter} incidents`}
            </Text>
          </View>
        ) : (
          filteredIncidents.map((incident) => (
            <TouchableOpacity
              key={incident.incidentId}
              onPress={() => setSelectedIncident(incident)}
              style={{
                backgroundColor: '#1F1F1F',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderLeftWidth: 4,
                borderLeftColor: '#FF6B00'
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    {getTypeIcon(incident.type)}
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 6 }}>
                      {incident.minerName || 'Unknown Miner'}
                    </Text>
                  </View>
                  <Text style={{ color: '#737373', fontSize: 13 }}>
                    {formatTimestamp(incident.timestamp)}
                  </Text>
                </View>
                {getStatusBadge(incident.status)}
              </View>

              <Text 
                style={{ color: '#E5E5E5', fontSize: 13, lineHeight: 20, marginBottom: 8 }}
                numberOfLines={3}
              >
                {incident.description}
              </Text>

              {incident.mediaUrl && (
                <View style={{ marginTop: 8 }}>
                  {incident.type === 'photo' ? (
                    <Image 
                      source={{ uri: incident.mediaUrl }} 
                      style={{ width: '100%', height: 150, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  ) : incident.type === 'video' ? (
                    <View style={{ backgroundColor: '#0A0A0A', borderRadius: 8, padding: 32, alignItems: 'center' }}>
                      <Camera size={32} color="#737373" />
                      <Text style={{ color: '#737373', marginTop: 8, fontSize: 12 }}>Video Attachment</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <Modal
          visible={!!selectedIncident}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedIncident(null)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#1F1F1F', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}>
              <View style={{ padding: 24, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' }}>Incident Details</Text>
                  <TouchableOpacity onPress={() => setSelectedIncident(null)}>
                    <Text style={{ color: '#FF6B00', fontSize: 24 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={{ padding: 24 }}>
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: '#737373', fontSize: 13, marginBottom: 4 }}>Reported By</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                    {selectedIncident.minerName || 'Unknown Miner'}
                  </Text>
                  <Text style={{ color: '#737373', fontSize: 12, marginTop: 2 }}>
                    ID: {selectedIncident.reportedBy}
                  </Text>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: '#737373', fontSize: 13, marginBottom: 4 }}>Timestamp</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 15 }}>
                    {selectedIncident.timestamp?.toDate ? 
                      selectedIncident.timestamp.toDate().toLocaleString() : 
                      'Just now'
                    }
                  </Text>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: '#737373', fontSize: 13, marginBottom: 4 }}>Type</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                      {getTypeIcon(selectedIncident.type)}
                      <Text style={{ color: '#FF6B00', fontSize: 13, fontWeight: '600', marginLeft: 6, textTransform: 'capitalize' }}>
                        {selectedIncident.type}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: '#737373', fontSize: 13, marginBottom: 8 }}>Description</Text>
                  <Text style={{ color: '#E5E5E5', fontSize: 15, lineHeight: 22 }}>
                    {selectedIncident.description}
                  </Text>
                </View>

                {/* Audio Transcript Section */}
                {selectedIncident.type === 'audio' && (
                  <View style={{ marginBottom: 20, backgroundColor: '#0A0A0A', borderRadius: 12, padding: 16, borderLeftWidth: 3, borderLeftColor: '#FF6B00' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Mic size={16} color="#FF6B00" />
                      <Text style={{ color: '#FF6B00', fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
                        Audio Transcript {selectedIncident.language && `(${selectedIncident.language.toUpperCase()})`}
                      </Text>
                    </View>
                    
                    {/* Handle transcription status */}
                    {selectedIncident.transcriptionStatus === 'pending' || selectedIncident.transcriptionStatus === 'processing' ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                        <ActivityIndicator size="small" color="#F59E0B" />
                        <Text style={{ color: '#F59E0B', fontSize: 14, marginLeft: 10 }}>
                          Transcription in progress...
                        </Text>
                      </View>
                    ) : selectedIncident.transcriptionStatus === 'apikey_missing' ? (
                      <Text style={{ color: '#737373', fontSize: 14, lineHeight: 20, fontStyle: 'italic' }}>
                        [Audio transcription unavailable – API key not configured]
                      </Text>
                    ) : selectedIncident.transcriptionStatus === 'error' ? (
                      <Text style={{ color: '#EF4444', fontSize: 14, lineHeight: 20 }}>
                        [Transcription failed - please check logs]
                      </Text>
                    ) : selectedIncident.transcript ? (
                      <Text style={{ color: '#E5E5E5', fontSize: 14, lineHeight: 20, fontStyle: 'italic' }}>
                        &quot;{selectedIncident.transcript}&quot;
                      </Text>
                    ) : (
                      <Text style={{ color: '#737373', fontSize: 14, lineHeight: 20, fontStyle: 'italic' }}>
                        [No transcript available]
                      </Text>
                    )}
                  </View>
                )}

                {selectedIncident.mediaUrl && selectedIncident.type !== 'audio' && (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ color: '#737373', fontSize: 13, marginBottom: 8 }}>Media Attachment</Text>
                    {selectedIncident.type === 'photo' ? (
                      <Image 
                        source={{ uri: selectedIncident.mediaUrl }} 
                        style={{ width: '100%', height: 300, borderRadius: 12 }}
                        resizeMode="cover"
                      />
                    ) : selectedIncident.type === 'video' ? (
                      <VideoPlayer
                        source={{ uri: selectedIncident.mediaUrl }}
                        style={{ width: '100%', height: 300, borderRadius: 12, backgroundColor: '#0A0A0A' }}
                        useNativeControls
                      />
                    ) : null}
                  </View>
                )}

                {selectedIncident.type === 'audio' && selectedIncident.mediaUrl && (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ color: '#737373', fontSize: 13, marginBottom: 8 }}>Audio Recording</Text>
                    <AudioPlayer
                      audioUri={selectedIncident.mediaUrl}
                      style={{ width: '100%' }}
                    />
                  </View>
                )}

                <View style={{ marginBottom: 24 }}>
                  <Text style={{ color: '#737373', fontSize: 13, marginBottom: 12 }}>Current Status</Text>
                  <View style={{ alignSelf: 'flex-start' }}>
                    {getStatusBadge(selectedIncident.status)}
                  </View>
                </View>

                {/* Review/Resolve Actions */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: '#737373', fontSize: 13, marginBottom: 12 }}>Update Status</Text>
                  
                  {selectedIncident.status === 'pending' && (
                    <TouchableOpacity
                      onPress={() => selectedIncident.incidentId && handleUpdateStatus(selectedIncident.incidentId, 'reviewed')}
                      disabled={updatingReviewed || updatingResolved}
                      style={{
                        backgroundColor: '#3B82F6',
                        borderRadius: 12,
                        paddingVertical: 14,
                        paddingHorizontal: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                        minWidth: '100%',
                        opacity: updatingReviewed || updatingResolved ? 0.6 : 1
                      }}
                    >
                      {updatingReviewed ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <CheckSquare size={20} color="#FFFFFF" />
                          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginLeft: 8, flexWrap: 'nowrap' }}>
                            Mark as Reviewed
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {(selectedIncident.status === 'pending' || selectedIncident.status === 'reviewed') && (
                    <TouchableOpacity
                      onPress={() => selectedIncident.incidentId && handleUpdateStatus(selectedIncident.incidentId, 'resolved')}
                      disabled={updatingReviewed || updatingResolved}
                      style={{
                        backgroundColor: '#10B981',
                        borderRadius: 12,
                        paddingVertical: 14,
                        paddingHorizontal: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: updatingReviewed || updatingResolved ? 0.6 : 1
                      }}
                    >
                      {updatingResolved ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <CheckSquare size={20} color="#FFFFFF" />
                          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginLeft: 8, flexWrap: 'nowrap' }}>
                            Mark as Resolved
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {selectedIncident.status === 'resolved' && (
                    <View style={{ backgroundColor: '#10B981' + '20', borderRadius: 12, padding: 16, alignItems: 'center' }}>
                      <CheckSquare size={24} color="#10B981" />
                      <Text style={{ color: '#10B981', fontSize: 15, fontWeight: '600', marginTop: 8 }}>
                        ✓ Incident Resolved
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}