import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, Dimensions, Modal, Image, ScrollView, Animated } from 'react-native';
import { useEffect, useState, useCallback, useRef } from 'react';
import { API_URL } from '../config/api';
import { useAuth } from '../context/auth';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
    pictures: Array<{
      url: string;
      uploadedAt: string;
      _id: string;
    }>;
    phone: string;
    gender: 'man' | 'woman' | 'other';
    interests: string[];
    bio: string;
  };
  type: 'one-time' | 'recurring';
  status: 'open' | 'verification_required';
  capacity: number;
  participants: Array<{
    userId: string;
    status: 'pending' | 'approved' | 'rejected';
    user?: {
      name: string;
      email: string;
      pictures: Array<{
        url: string;
        uploadedAt: string;
        _id: string;
      }>;
    };
  }>;
  locations: Location[];
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  repeatFrequency?: 'daily' | 'weekly' | 'monthly';
  repeatDays?: string[];
  tags: string[];
}

interface UserDetailsModalProps {
  visible: boolean;
  userId: string;
  onClose: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ visible, userId, onClose }) => {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { token } = useAuth();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      fetchUserDetails();
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      // Reset state when modal closes
      setUserDetails(null);
      setError(null);
      setActiveSlide(0);
    }
  }, [visible, userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/auth/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch user details');
      }
      const data = await response.json();
      setUserDetails(data);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError(error instanceof Error ? error.message : 'Failed to load user details');
      Alert.alert('Error', 'Failed to load user details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPaginationDots = () => {
    if (!userDetails?.pictures || userDetails.pictures.length <= 1) return null;

    return (
      <View style={styles.paginationDots}>
        {userDetails.pictures.map((_: any, index: number) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === activeSlide && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderUserPhotos = () => {
    if (!userDetails?.pictures || userDetails.pictures.length === 0) {
      return (
        <View style={[styles.userPhoto, styles.userPhotoPlaceholder]}>
          <Ionicons name="person" size={60} color="#666" />
        </View>
      );
    }

    const imageSize = Math.min(Dimensions.get('window').width, Dimensions.get('window').width);

    return (
      <View style={styles.sliderContainer}>
        <FlatList
          ref={flatListRef}
          data={userDetails.pictures}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const currentIndex = Math.floor(
              event.nativeEvent.contentOffset.x / imageSize
            );
            setActiveSlide(currentIndex);
          }}
          renderItem={({ item }) => (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: `${API_URL}${item.url}` }}
                style={styles.sliderImage}
                defaultSource={require('../assets/default-avatar.png')}
              />
            </View>
          )}
          keyExtractor={(item) => item._id}
        />
        {renderPaginationDots()}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[
            styles.userModal,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
              ],
            },
          ]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.loadingText}>Loading user details...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#ff4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchUserDetails}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : userDetails ? (
            <ScrollView style={styles.userModalContent}>
              <View style={styles.userProfile}>
                {renderUserPhotos()}
                
                <Text style={styles.userName}>{userDetails.name}</Text>
                <Text style={styles.userEmail}>{userDetails.email}</Text>

                {userDetails.phone && (
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>{userDetails.phone}</Text>
                  </View>
                )}

                {userDetails.gender && (
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>
                      {userDetails.gender.charAt(0).toUpperCase() + userDetails.gender.slice(1)}
                    </Text>
                  </View>
                )}

                {userDetails.bio && (
                  <View style={styles.bioContainer}>
                    <Text style={styles.sectionTitle}>Bio</Text>
                    <Text style={styles.bioText}>{userDetails.bio}</Text>
                  </View>
                )}

                {userDetails.interests && userDetails.interests.length > 0 && (
                  <View style={styles.interestsSection}>
                    <Text style={styles.sectionTitle}>Interests</Text>
                    <View style={styles.interestsContainer}>
                      {userDetails.interests.map((interest: string, index: number) => (
                        <View key={index} style={styles.interestTag}>
                          <Text style={styles.interestText}>{interest}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          ) : null}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default function ManageScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const isMounted = useRef(true);
  const { token, userId } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    const controller = new AbortController();
    
    try {
      const response = await fetch(`${API_URL}/api/events/managed`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      if (isMounted.current) {
        setEvents(data);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        console.error('Error fetching events:', error);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }

    return () => {
      controller.abort();
    };
  }, [token]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const loadEvents = async () => {
      cleanup = await fetchEvents();
    };

    loadEvents();

    return () => {
      isMounted.current = false;
      if (cleanup) {
        cleanup();
      }
    };
  }, [fetchEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
  }, [fetchEvents]);

  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete event');
      }

      setEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
      Alert.alert('Success', 'Event deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      Alert.alert('Error', errorMessage);
    }
  }, [token]);

  const handleAcceptRequest = useCallback(async (eventId: string, userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}/accept-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to accept request');
      }

      const updatedEvent = await response.json();
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === eventId ? updatedEvent : event
        )
      );
      Alert.alert('Success', 'Request accepted');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      Alert.alert('Error', errorMessage);
    }
  }, [token]);

  const handleRejectRequest = useCallback(async (eventId: string, userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}/reject-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject request');
      }

      const updatedEvent = await response.json();
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === eventId ? updatedEvent : event
        )
      );
      Alert.alert('Success', 'Request rejected');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      Alert.alert('Error', errorMessage);
    }
  }, [token]);

  const renderParticipantRequests = useCallback((item: Event) => {
    const pendingRequests = (item.participants || []).filter(p => p.status === 'pending');
    
    if (pendingRequests.length === 0) return null;

    return (
      <View style={styles.requestsSection}>
        <Text style={styles.requestsTitle}>Pending Requests ({pendingRequests.length})</Text>
        {pendingRequests.map((participant, index) => (
          <View key={index} style={styles.requestItem}>
            <TouchableOpacity 
              style={styles.requestInfo}
              onPress={() => setSelectedUserId(participant.userId)}
            >
              <Text style={styles.requestName}>{participant.user?.name || 'Unknown User'}</Text>
              <Text style={styles.requestEmail}>{participant.user?.email}</Text>
            </TouchableOpacity>
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={[styles.requestButton, styles.acceptButton]}
                onPress={() => handleAcceptRequest(item._id, participant.userId)}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.requestButton, styles.rejectButton]}
                onPress={() => handleRejectRequest(item._id, participant.userId)}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  }, [handleAcceptRequest, handleRejectRequest]);

  const renderEvent = useCallback(({ item }: { item: Event }) => {
    if (!item || !item._id) return null;
    
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatTime = (timeString: string) => {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    const renderTags = () => (
      <View style={styles.tagsContainer}>
        {(item.tags || []).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    );

    const renderRecurringInfo = () => {
      if (item.type !== 'recurring') return null;

      return (
        <View style={styles.recurringInfo}>
          <Text style={styles.recurringText}>
            Repeats {item.repeatFrequency}ly
            {item.repeatDays && item.repeatDays.length > 0 && 
              ` on ${item.repeatDays.join(', ')}`}
          </Text>
          {item.endDate && (
            <Text style={styles.endDateText}>
              Until {formatDate(item.endDate)}
            </Text>
          )}
        </View>
      );
    };

    return (
      <View style={styles.eventCard}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDescription}>{item.description}</Text>
        
        {renderParticipantRequests(item)}
        
        <View style={styles.dateTimeInfo}>
          <Text style={styles.dateTimeText}>
            {formatDate(item.startDate)}
          </Text>
          <Text style={styles.dateTimeText}>
            {formatTime(item.startTime)} - {formatTime(item.endTime)}
          </Text>
        </View>

        {renderRecurringInfo()}

        <View style={styles.locationsContainer}>
          <Text style={styles.locationsTitle}>Locations:</Text>
          {item.locations.map((location, index) => (
            <View key={index} style={styles.locationItem}>
              <Text style={styles.locationName}>
                📍 {location.name}
              </Text>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }}
                    title={location.name}
                  />
                </MapView>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.createdAt}>
          Created {new Date(item.createdAt).toLocaleDateString()}
        </Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => {
              router.push({
                pathname: '/(tabs)/add',
                params: { eventId: item._id }
              });
            }}
          >
            <Ionicons name="pencil" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteEvent(item._id)}
          >
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [deleteEvent, handleAcceptRequest, handleRejectRequest]);

  const keyExtractor = useCallback((item: Event) => item._id, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Events</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/add')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#666" />
          <Text style={styles.emptyText}>You haven't created any events yet</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/(tabs)/add')}
          >
            <Text style={styles.createButtonText}>Create Your First Event</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={events}
          renderItem={renderEvent}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContainer}
          removeClippedSubviews={false}
          maxToRenderPerBatch={5}
          windowSize={3}
          initialNumToRender={5}
          onEndReachedThreshold={0.5}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0000ff']}
              tintColor="#0000ff"
            />
          }
        />
      )}
      <UserDetailsModal
        visible={!!selectedUserId}
        userId={selectedUserId || ''}
        onClose={() => setSelectedUserId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  eventDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  dateTimeInfo: {
    marginBottom: 12,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  recurringInfo: {
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  recurringText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
  endDateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#e1f5fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#0288d1',
    fontWeight: '500',
  },
  locationsContainer: {
    marginBottom: 12,
  },
  locationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  locationItem: {
    marginBottom: 12,
  },
  locationName: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
    fontWeight: '500',
  },
  mapContainer: {
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  createdAt: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestsSection: {
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  requestsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  requestInfo: {
    flex: 1,
    padding: 8,
  },
  requestName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  requestEmail: {
    fontSize: 12,
    color: '#666',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  requestButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#ff4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  userModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Dimensions.get('window').height * 0.8,
    width: '100%',
    overflow: 'hidden',
  },
  userModalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
  },
  userProfile: {
    alignItems: 'center',
    padding: 20,
  },
  userPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  userPhotoPlaceholder: {
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  bioContainer: {
    width: '100%',
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  interestsSection: {
    width: '100%',
    padding: 16,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  interestTag: {
    backgroundColor: '#E1F5FE',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  interestText: {
    color: '#0288D1',
  },
  sliderContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 16,
  },
  imageWrapper: {
    width: Dimensions.get('window').width,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  sliderImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
    width: '100%',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
  },
}); 