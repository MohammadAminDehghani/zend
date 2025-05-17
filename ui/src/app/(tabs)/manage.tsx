import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Dimensions, Modal, Image, ScrollView, Animated } from 'react-native';
import { useEffect, useState, useCallback, useRef } from 'react';
import { API_URL, getImageUrl } from '../config/api';
import { useAuth } from '../../contexts/AuthContext';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, typography, spacing, borderRadius, commonStyles } from '../theme';
import CustomAlert from '../components/CustomAlert';
import { useAlert } from '../utils/alert';
import { BlurView } from 'expo-blur';
import Tag from '../components/Tag';
import { LinearGradient } from 'expo-linear-gradient';

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
    } finally {
      setLoading(false);
    }
  };

  const renderPaginationDots = () => {
    if (!userDetails?.pictures || userDetails.pictures.length <= 1) return null;

    return (
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: spacing.sm,
        width: '100%',
      }}>
        {userDetails.pictures.map((_: any, index: number) => (
          <View
            key={index}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: index === activeSlide ? colors.white : `rgba(255, 255, 255, 0.5)`,
              marginHorizontal: 4,
            }}
          />
        ))}
      </View>
    );
  };

  const renderUserPhotos = () => {
    if (!userDetails?.pictures || userDetails.pictures.length === 0) {
      return (
        <View style={{
          width: '100%',
          aspectRatio: 1,
          backgroundColor: colors.gray[100],
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Ionicons name="person" size={60} color={colors.gray[400]} />
        </View>
      );
    }

    const imageSize = Dimensions.get('window').width;

    return (
      <View style={{ width: '100%', aspectRatio: 1 }}>
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
          renderItem={({ item }) => {
            let imageSource = undefined;
            if (item.url) {
              const url = getImageUrl(item.url);
              if (url) {
                imageSource = { uri: url };
              }
            }
            
            return (
              <View style={{ width: imageSize, aspectRatio: 1 }}>
                <Image
                  source={imageSource || require('../assets/default-avatar.png')}
                  style={{ width: '100%', height: '100%' }}
                  defaultSource={require('../assets/default-avatar.png')}
                />
              </View>
            );
          }}
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
        style={{ flex: 1 }}
        activeOpacity={1}
        onPress={onClose}
      >
        <BlurView intensity={20} style={{ flex: 1 }}>
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            justifyContent: 'flex-end',
          }}>
            <TouchableOpacity 
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <Animated.View
                style={[
                  {
                    backgroundColor: colors.white,
                    borderTopLeftRadius: borderRadius.xl,
                    borderTopRightRadius: borderRadius.xl,
                    height: Dimensions.get('window').height * 0.8,
                    width: '100%',
                    overflow: 'hidden',
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
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.05)', 'transparent']}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 100,
                    zIndex: 1,
                  }}
                />
                
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: spacing.lg,
                  zIndex: 2,
                }}>
                  <Text style={[commonStyles.subtitle, { marginBottom: 0, fontSize: typography.fontSize.xl }]}>
                    User Details
                  </Text>
                  <TouchableOpacity
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.gray[100],
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={onClose}
                  >
                    <Ionicons name="close" size={20} color={colors.gray[600]} />
                  </TouchableOpacity>
                </View>

                {loading ? (
                  <View style={commonStyles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[commonStyles.text, { marginTop: spacing.base, color: colors.gray[600] }]}>
                      Loading user details...
                    </Text>
                  </View>
                ) : error ? (
                  <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: spacing.xl,
                  }}>
                    <Ionicons name="alert-circle" size={48} color={colors.danger} />
                    <Text style={[commonStyles.text, { marginTop: spacing.base, color: colors.danger, textAlign: 'center' }]}>
                      {error}
                    </Text>
                    <TouchableOpacity
                      style={[commonStyles.button, commonStyles.buttonPrimary, { marginTop: spacing.lg }]}
                      onPress={fetchUserDetails}
                    >
                      <Text style={commonStyles.buttonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : userDetails ? (
                  <ScrollView>
                    {renderUserPhotos()}
                    
                    <View style={{ padding: spacing.lg }}>
                      <View style={{ 
                        flexDirection: 'row', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: spacing.lg 
                      }}>
                        <View>
                          <Text style={[commonStyles.title, { marginBottom: spacing.xs }]}>{userDetails.name}</Text>
                          <Text style={[commonStyles.textSecondary]}>{userDetails.email}</Text>
                        </View>
                        <TouchableOpacity
                          style={[commonStyles.button, {
                            backgroundColor: colors.primary + '10',
                            paddingVertical: spacing.xs,
                            paddingHorizontal: spacing.sm,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: spacing.xs,
                            borderRadius: borderRadius.lg,
                          }]}
                          onPress={() => {
                            onClose();
                            router.push({
                              pathname: '/chat',
                              params: { 
                                recipientId: userDetails.id,
                                recipientName: userDetails.name,
                                recipientPicture: userDetails.pictures?.[0]?.url,
                                chatType: 'one-to-one'
                              }
                            });
                          }}
                        >
                          <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
                          <Text style={[commonStyles.text, { 
                            color: colors.primary,
                            fontSize: typography.fontSize.xs,
                            fontWeight: '500'
                          }]}>
                            Message
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {userDetails.phone && (
                        <View style={[commonStyles.row, { marginBottom: spacing.sm }]}>
                          <Ionicons name="call-outline" size={20} color={colors.gray[600]} />
                          <Text style={[commonStyles.text, { marginLeft: spacing.sm, color: colors.gray[600] }]}>
                            {userDetails.phone}
                          </Text>
                        </View>
                      )}

                      {userDetails.gender && (
                        <View style={[commonStyles.row, { marginBottom: spacing.lg }]}>
                          <Ionicons name="person-outline" size={20} color={colors.gray[600]} />
                          <Text style={[commonStyles.text, { marginLeft: spacing.sm, color: colors.gray[600] }]}>
                            {userDetails.gender.charAt(0).toUpperCase() + userDetails.gender.slice(1)}
                          </Text>
                        </View>
                      )}

                      {userDetails.bio && (
                        <View style={{ marginBottom: spacing.lg }}>
                          <Text style={[commonStyles.subtitle]}>Bio</Text>
                          <Text style={[commonStyles.text, { color: colors.gray[600], lineHeight: typography.lineHeight.normal }]}>
                            {userDetails.bio}
                          </Text>
                        </View>
                      )}

                      {userDetails.interests && userDetails.interests.length > 0 && (
                        <View>
                          <Text style={[commonStyles.subtitle]}>Interests</Text>
                          <View style={[commonStyles.row, { flexWrap: 'wrap', gap: spacing.sm }]}>
                            {userDetails.interests.map((interest: string, index: number) => (
                              <Tag key={index} label={interest} isSelected={false} disabled={true} />
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  </ScrollView>
                ) : null}
              </Animated.View>
            </TouchableOpacity>
          </View>
        </BlurView>
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
  const { token } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { showAlert, alertConfig, show, hide } = useAlert();

  const fetchEvents = useCallback(async () => {
    const controller = new AbortController();
    
    try {
      setLoading(true);
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      show({
        title: 'Error',
        message: errorMessage,
        buttons: [
          {
            text: 'OK',
            onPress: hide,
          }
        ]
      });
    }
  }, [token, show, hide]);

  const handleDeleteEvent = useCallback((eventId: string, eventTitle: string) => {
    show({
      title: 'Delete Event',
      message: `Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          onPress: hide,
          style: 'destructive'
        },
        {
          text: 'Delete',
          onPress: () => {
            hide();
            deleteEvent(eventId);
          }
        }
      ]
    });
  }, [deleteEvent, show, hide]);

  const handleStatusChange = useCallback(async (eventId: string, userId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      let response;
      
      if (newStatus === 'pending') {
        // First, have the user leave the event
        response = await fetch(`${API_URL}/api/events/${eventId}/leave`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to leave event');
        }

        // Then, have them rejoin to get pending status
        response = await fetch(`${API_URL}/api/events/${eventId}/join`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        });
      } else {
        // For approved/rejected statuses, use existing endpoints
        const endpoint = newStatus === 'approved' ? 'accept-request' : 'reject-request';
        response = await fetch(`${API_URL}/api/events/${eventId}/${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to update participant status`);
      }

      // Fetch the updated event with full participant details
      const eventResponse = await fetch(`${API_URL}/api/events/managed`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!eventResponse.ok) {
        throw new Error('Failed to fetch updated event data');
      }

      const managedEvents: Event[] = await eventResponse.json();
      const updatedEventData = managedEvents.find((event) => event._id === eventId);
      
      if (!updatedEventData) {
        throw new Error('Failed to find updated event');
      }

      setEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === eventId ? updatedEventData : event
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      show({
        title: 'Error',
        message: errorMessage,
        buttons: [
          {
            text: 'OK',
            onPress: hide,
          }
        ]
      });
    }
  }, [token, show, hide]);

  const renderParticipants = useCallback((item: Event) => {
    if (!item.participants || item.participants.length === 0) return null;

    const statusColors = {
      pending: colors.warning,
      approved: colors.success,
      rejected: colors.danger
    };

    const statusLabels = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected'
    };

    return (
      <View style={{
        marginBottom: spacing.lg,
      }}>
        <Text style={[commonStyles.subtitle, { marginBottom: spacing.sm }]}>
          Participants ({item.participants.length})
        </Text>
        {item.participants.map((participant, index) => (
          <View key={index} style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: spacing.sm,
            borderBottomWidth: index < item.participants.length - 1 ? 1 : 0,
            borderBottomColor: colors.gray[200],
          }}>
            <TouchableOpacity 
              style={{ flex: 1, padding: spacing.xs }}
              onPress={() => setSelectedUserId(participant.userId)}
            >
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: spacing.xs
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                  <Text style={[commonStyles.text, { fontWeight: '500' }]}>
                    {participant.user?.name || 'Unknown User'}
                  </Text>
                  {item.status === 'verification_required' && (
                    <TouchableOpacity
                      style={{
                        backgroundColor: statusColors[participant.status] + '10',
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xs,
                        borderRadius: borderRadius.lg,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.xs,
                      }}
                      onPress={() => {
                        show({
                          title: 'Change Status',
                          message: `Change status:`,
                          buttons: [
                            {
                              text: '✓ Approve',
                              onPress: () => {
                                hide();
                                handleStatusChange(item._id, participant.userId, 'approved');
                              }
                            },
                            {
                              text: '✕ Reject',
                              onPress: () => {
                                hide();
                                handleStatusChange(item._id, participant.userId, 'rejected');
                              },
                              style: 'destructive'
                            }
                          ]
                        });
                      }}
                    >
                      <Text style={[commonStyles.textSecondary, { 
                        fontSize: typography.fontSize.xs,
                        color: statusColors[participant.status],
                        fontWeight: '500'
                      }]}>
                        {statusLabels[participant.status]}
                      </Text>
                      <Ionicons 
                        name="chevron-down" 
                        size={12} 
                        color={statusColors[participant.status]} 
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: borderRadius.sm,
                    backgroundColor: colors.primary + '10',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                  }}
                  onPress={() => {
                    router.push({
                      pathname: '/chat',
                      params: { 
                        recipientId: participant.userId,
                        recipientName: participant.user?.name || 'Unknown User',
                        recipientPicture: participant.user?.pictures?.[0]?.url,
                        chatType: 'one-to-one'
                      }
                    });
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
                  <Text style={[commonStyles.text, { 
                    color: colors.primary,
                    fontSize: typography.fontSize.xs,
                    fontWeight: '500'
                  }]}>
                    Message
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={[commonStyles.textSecondary, { fontSize: typography.fontSize.sm }]}>
                {participant.user?.email}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  }, [handleStatusChange, show, hide]);

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

    return (
      <View style={[{ 
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[200],
      }]}>
        <View style={{ padding: spacing.base }}>
          {/* Header Section */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={[commonStyles.subtitle, { 
              fontSize: typography.fontSize.xl,
              marginBottom: spacing.xs,
              color: colors.gray[900]
            }]}>
              {item.title}
            </Text>
            <Text style={[commonStyles.text, { 
              color: colors.gray[600],
              marginBottom: spacing.base,
              lineHeight: typography.lineHeight.relaxed
            }]}>
              {item.description}
            </Text>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <View style={[commonStyles.row, { flexWrap: 'wrap', gap: spacing.xs }]}>
                {item.tags.map((tag, index) => (
                  <Tag key={index} label={tag} isSelected={false} disabled />
                ))}
              </View>
            )}
          </View>

          {/* Date & Time */}
          <View style={{
            backgroundColor: colors.gray[100],
            padding: spacing.sm,
            borderRadius: borderRadius.sm,
            marginBottom: spacing.sm,
          }}>
            <View style={[commonStyles.row, { marginBottom: spacing.xs }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.gray[600]} style={{ marginRight: spacing.xs }} />
              <Text style={[commonStyles.text, { color: colors.gray[900], fontWeight: '500' }]}>
                {formatDate(item.startDate)}
              </Text>
            </View>
            <View style={commonStyles.row}>
              <Ionicons name="time-outline" size={20} color={colors.gray[600]} style={{ marginRight: spacing.xs }} />
              <Text style={[commonStyles.text, { color: colors.gray[600] }]}>
                {formatTime(item.startTime)} - {formatTime(item.endTime)}
              </Text>
            </View>
          </View>

          {/* Recurring Info */}
          {item.type === 'recurring' && (
            <View style={{
              backgroundColor: colors.primary + '10',
              padding: spacing.sm,
              borderRadius: borderRadius.sm,
              marginBottom: spacing.xl,
            }}>
              <Text style={[commonStyles.text, { color: colors.primary, fontWeight: '500' }]}>
                Repeats {item.repeatFrequency}
                {item.repeatDays && item.repeatDays.length > 0 && 
                  ` on ${item.repeatDays.join(', ')}`}
              </Text>
              {item.endDate && (
                <Text style={[commonStyles.textSecondary, { 
                  fontSize: typography.fontSize.sm,
                  marginTop: spacing.xs,
                  color: colors.primary + '99'
                }]}>
                  Until {formatDate(item.endDate)}
                </Text>
              )}
            </View>
          )}

          {/* Participant Requests */}
          {renderParticipants(item)}

          {/* Locations */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={[commonStyles.subtitle, { marginBottom: spacing.base }]}>
              Locations
            </Text>
            {item.locations.map((location, index) => (
              <View key={index} style={{ marginBottom: index < item.locations.length - 1 ? spacing.base : 0 }}>
                <Text style={[commonStyles.text, { 
                  fontWeight: '500',
                  marginBottom: spacing.xs,
                  color: colors.gray[900]
                }]}>
                  📍 {location.name}
                </Text>
                <View style={{ 
                  height: 120,
                  borderRadius: borderRadius.lg,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: colors.gray[200],
                }}>
                  <MapView
                    style={{ width: '100%', height: '100%' }}
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

          {/* Footer */}
            <View style={[commonStyles.row, { justifyContent: 'flex-end', gap: spacing.sm }]}>
              <TouchableOpacity
                style={[commonStyles.button, { 
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                }]}
                onPress={() => {
                  router.push({
                    pathname: '/events/edit/[id]',
                    params: { id: item._id }
                  });
                }}
              >
                <Ionicons name="pencil" size={16} color={colors.primary} />
                <Text style={[commonStyles.text, { 
                  color: colors.primary,
                  fontSize: typography.fontSize.sm,
                  fontWeight: '500'
                }]}>
                  Edit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[commonStyles.button, { 
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.danger,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                }]}
                onPress={() => handleDeleteEvent(item._id, item.title)}
              >
                <Ionicons name="trash" size={16} color={colors.danger} />
                <Text style={[commonStyles.text, { 
                  color: colors.danger,
                  fontSize: typography.fontSize.sm,
                  fontWeight: '500'
                }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          
        </View>
      </View>
    );
  }, [handleDeleteEvent, renderParticipants]);

  const keyExtractor = useCallback((item: Event) => item._id, []);

  if (loading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[ { backgroundColor: colors.white } ]}>
      {alertConfig && (
        <CustomAlert
          visible={showAlert}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
        />
      )}

      {/* Header */}
      <View style={{
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[200],
        paddingHorizontal: spacing.base,
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
      }}>
        <View style={[commonStyles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
          <Text style={[commonStyles.title, { color: colors.gray[900], marginBottom: 0 }]}>
            Manage Events
          </Text>
          <TouchableOpacity 
            style={[commonStyles.button, { 
              backgroundColor: colors.primary,
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              borderRadius: borderRadius.sm,
            }]}
            onPress={() => router.push('/events/add')}
          >
            <Ionicons name="add-circle-outline" size={14} color={colors.white} />
            <Text style={[commonStyles.text, { 
              color: colors.white,
              fontSize: typography.fontSize.xs,
              fontWeight: '500'
            }]}>
              Add Event
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Content */}
      {events.length === 0 ? (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          paddingHorizontal: spacing.xl,
          backgroundColor: colors.white,
        }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.gray[100],
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing.lg,
          }}>
            <Ionicons name="calendar-outline" size={40} color={colors.gray[400]} />
          </View>
          <Text style={[commonStyles.subtitle, { 
            color: colors.gray[900],
            marginBottom: spacing.sm,
            textAlign: 'center'
          }]}>
            No Events Yet
          </Text>
          <Text style={[commonStyles.text, { 
            color: colors.gray[600],
            marginBottom: spacing.xl,
            textAlign: 'center',
            lineHeight: typography.lineHeight.relaxed
          }]}>
            You haven't created any events yet. Start by creating your first event!
          </Text>
          <TouchableOpacity
            style={[commonStyles.button, { 
              backgroundColor: colors.primary,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.xl,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            }]}
            onPress={() => router.push('/events/add')}
          >
            <Ionicons name="add-circle" size={20} color={colors.white} />
            <Text style={[commonStyles.buttonText]}>Create Event</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={events}
          renderItem={renderEvent}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ 
            backgroundColor: colors.white,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
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