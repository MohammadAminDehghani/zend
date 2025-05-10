import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, Dimensions, Modal, Image, Animated, ScrollView } from 'react-native';
import { useEffect, useState, useCallback, useRef } from 'react';
import { API_URL, getImageUrl } from '../config/api';
import { useAuth } from '../../contexts/AuthContext';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import SocketService from '../services/socket';
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
    name?: string;
    pictures?: Array<{
      url: string;
      uploadedAt: string;
      _id: string;
    }>;
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

interface CreatorModalProps {
  visible: boolean;
  creator: Event['creator'];
  onClose: () => void;
}

interface ParticipantModalProps {
  visible: boolean;
  participant: {
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
  onClose: () => void;
}

const CreatorModal: React.FC<CreatorModalProps> = ({ visible, creator, onClose }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();
  const socketService = SocketService.getInstance();
  const { showAlert, alertConfig, show, hide } = useAlert();
  
  useEffect(() => {
    if (visible) {
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
    }
  }, [visible]);

  const handleSendMessage = () => {
    if (!user) {
      show({
        title: 'Error',
        message: 'You must be logged in to send messages',
        buttons: [{ text: 'OK', onPress: hide }]
      });
      return;
    }

    router.push({
      pathname: '/chat',
      params: {
        recipientId: creator.id,
        recipientName: creator.name,
        recipientPicture: creator.pictures[0]?.url,
        chatType: 'one-to-one'
      }
    });
    onClose();
  };

  const renderPaginationDots = () => {
    if (!creator.pictures || creator.pictures.length <= 1) return null;

    return (
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: spacing.sm,
        width: '100%',
      }}>
        {creator.pictures.map((_, index) => (
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

  const renderCreatorPhotos = () => {
    if (!creator.pictures || creator.pictures.length === 0) {
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
          data={creator.pictures}
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
            const imageUrl = item.url ? getImageUrl(item.url) : null;
            const imageSource = imageUrl ? { uri: imageUrl } : undefined;
            
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

  const renderInterests = () => {
    if (!creator.interests || creator.interests.length === 0) {
      return <Text style={styles.noInterests}>No interests added</Text>;
    }
    return (
      <View style={styles.interestsContainer}>
        {creator.interests.map((interest, index) => (
          <View key={index} style={styles.interestTag}>
            <Text style={styles.interestText}>{interest}</Text>
          </View>
        ))}
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
                    Creator Profile
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

                <ScrollView>
                  {renderCreatorPhotos()}
                  
                  <View style={{ padding: spacing.lg }}>
                    <View style={{ 
                      flexDirection: 'row', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: spacing.lg 
                    }}>
                      <View>
                        <Text style={[commonStyles.title, { marginBottom: spacing.xs }]}>{creator.name}</Text>
                        <Text style={[commonStyles.textSecondary]}>{creator.email}</Text>
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
                        onPress={handleSendMessage}
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

                    {creator.phone && (
                      <View style={[commonStyles.row, { marginBottom: spacing.sm }]}>
                        <Ionicons name="call-outline" size={20} color={colors.gray[600]} />
                        <Text style={[commonStyles.text, { marginLeft: spacing.sm, color: colors.gray[600] }]}>
                          {creator.phone}
                        </Text>
                      </View>
                    )}

                    {creator.gender && (
                      <View style={[commonStyles.row, { marginBottom: spacing.lg }]}>
                        <Ionicons name="person-outline" size={20} color={colors.gray[600]} />
                        <Text style={[commonStyles.text, { marginLeft: spacing.sm, color: colors.gray[600] }]}>
                          {creator.gender.charAt(0).toUpperCase() + creator.gender.slice(1)}
                        </Text>
                      </View>
                    )}

                    {creator.bio && (
                      <View style={{ marginBottom: spacing.lg }}>
                        <Text style={[commonStyles.subtitle]}>Bio</Text>
                        <Text style={[commonStyles.text, { color: colors.gray[600], lineHeight: typography.lineHeight.normal }]}>
                          {creator.bio}
                        </Text>
                      </View>
                    )}

                    {creator.interests && creator.interests.length > 0 && (
                      <View>
                        <Text style={[commonStyles.subtitle]}>Interests</Text>
                        <View style={[commonStyles.row, { flexWrap: 'wrap', gap: spacing.sm }]}>
                          {creator.interests.map((interest: string, index: number) => (
                            <Tag key={index} label={interest} isSelected={false} disabled={true} />
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Modal>
  );
};

const ParticipantModal: React.FC<ParticipantModalProps> = ({ visible, participant, onClose }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  
  useEffect(() => {
    if (visible) {
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
    }
  }, [visible]);

  const renderPaginationDots = () => {
    if (!participant.pictures || participant.pictures.length <= 1) return null;

    return (
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: spacing.sm,
        width: '100%',
      }}>
        {participant.pictures.map((_, index) => (
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

  const renderParticipantPhotos = () => {
    if (!participant.pictures || participant.pictures.length === 0) {
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
          data={participant.pictures}
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
            const imageUrl = getImageUrl(item.url);
            const imageSource = imageUrl ? { uri: imageUrl } : undefined;
            
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
                    Participant Profile
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

                <ScrollView>
                  {renderParticipantPhotos()}
                  
                  <View style={{ padding: spacing.lg }}>
                    <View style={{ marginBottom: spacing.lg }}>
                      <Text style={[commonStyles.title, { marginBottom: spacing.xs }]}>{participant.name}</Text>
                      <Text style={[commonStyles.textSecondary]}>{participant.email}</Text>
                    </View>

                    {participant.phone && (
                      <View style={[commonStyles.row, { marginBottom: spacing.sm }]}>
                        <Ionicons name="call-outline" size={20} color={colors.gray[600]} />
                        <Text style={[commonStyles.text, { marginLeft: spacing.sm, color: colors.gray[600] }]}>
                          {participant.phone}
                        </Text>
                      </View>
                    )}

                    {participant.gender && (
                      <View style={[commonStyles.row, { marginBottom: spacing.lg }]}>
                        <Ionicons name="person-outline" size={20} color={colors.gray[600]} />
                        <Text style={[commonStyles.text, { marginLeft: spacing.sm, color: colors.gray[600] }]}>
                          {participant.gender.charAt(0).toUpperCase() + participant.gender.slice(1)}
                        </Text>
                      </View>
                    )}

                    {participant.bio && (
                      <View style={{ marginBottom: spacing.lg }}>
                        <Text style={[commonStyles.subtitle]}>Bio</Text>
                        <Text style={[commonStyles.text, { color: colors.gray[600], lineHeight: typography.lineHeight.normal }]}>
                          {participant.bio}
                        </Text>
                      </View>
                    )}

                    {participant.interests && participant.interests.length > 0 && (
                      <View>
                        <Text style={[commonStyles.subtitle]}>Interests</Text>
                        <View style={[commonStyles.row, { flexWrap: 'wrap', gap: spacing.sm }]}>
                          {participant.interests.map((interest: string, index: number) => (
                            <Tag key={index} label={interest} isSelected={false} disabled={true} />
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Modal>
  );
};

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const isMounted = useRef(true);
  const { token, userId } = useAuth();
  const [selectedCreator, setSelectedCreator] = useState<Event['creator'] | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantModalProps['participant'] | null>(null);
  const { showAlert, alertConfig, show, hide } = useAlert();

  const fetchEvents = useCallback(async () => {
    const controller = new AbortController();
    
    try {
      const response = await fetch(`${API_URL}/api/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      
      // Fetch participant details for each event
      const eventsWithParticipantDetails = await Promise.all(
        data.map(async (event: Event) => {
          const participantsWithDetails = await Promise.all(
            event.participants.map(async (participant) => {
              try {
                const response = await fetch(`${API_URL}/api/auth/${participant.userId}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (response.ok) {
                  const details = await response.json();
                  return {
                    ...participant,
                    name: details.name,
                    pictures: details.pictures
                  };
                }
              } catch (error) {
                console.error('Error fetching participant details:', error);
              }
              return participant;
            })
          );
          
          return {
            ...event,
            participants: participantsWithDetails
          };
        })
      );

      if (isMounted.current) {
        setEvents(eventsWithParticipantDetails);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Error fetching events:', error);
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
      show({
        title: 'Success',
        message: 'Event deleted successfully',
        buttons: [{ text: 'OK', onPress: hide }]
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      show({
        title: 'Error',
        message: errorMessage,
        buttons: [{ text: 'OK', onPress: hide }]
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

  const handleJoinEvent = useCallback(async (event: Event) => {
    if (!userId) {
      show({
        title: 'Error',
        message: 'You must be logged in to join events',
        buttons: [{ text: 'OK', onPress: hide }]
      });
      return;
    }

    try {
      if (event.status === 'open') {
        const participants = event.participants || [];
        const approvedParticipants = participants.filter(p => p.status === 'approved').length;
        if (approvedParticipants >= (event.capacity || 0)) {
          show({
            title: 'Error',
            message: 'This event has reached its capacity',
            buttons: [{ text: 'OK', onPress: hide }]
          });
          return;
        }
      }

      const response = await fetch(`${API_URL}/api/events/${event._id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join event');
      }

      setEvents(prevEvents => prevEvents.map(e => {
        if (e._id === event._id) {
          const currentParticipants = e.participants || [];
          return {
            ...e,
            participants: [...currentParticipants, {
              userId,
              status: event.status === 'open' ? 'approved' : 'pending'
            }]
          };
        }
        return e;
      }));

      show({
        title: 'Success',
        message: event.status === 'open' 
          ? 'You have successfully joined the event!' 
          : 'Your join request has been submitted and is pending approval',
        buttons: [{ text: 'OK', onPress: hide }]
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      show({
        title: 'Error',
        message: errorMessage,
        buttons: [{ text: 'OK', onPress: hide }]
      });
    }
  }, [token, userId, show, hide]);

  const handleLeaveEvent = useCallback(async (eventId: string) => {
    if (!userId) {
      show({
        title: 'Error',
        message: 'You must be logged in to leave events',
        buttons: [{ text: 'OK', onPress: hide }]
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to leave event');
      }

      setEvents(prevEvents => prevEvents.map(e => {
        if (e._id === eventId) {
          const currentParticipants = e.participants || [];
          return {
            ...e,
            participants: currentParticipants.filter(p => p.userId !== userId)
          };
        }
        return e;
      }));

      show({
        title: 'Success',
        message: 'You have left the event',
        buttons: [{ text: 'OK', onPress: hide }]
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      show({
        title: 'Error',
        message: errorMessage,
        buttons: [{ text: 'OK', onPress: hide }]
      });
    }
  }, [token, userId, show, hide]);

  const fetchParticipantDetails = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch participant details');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching participant details:', error);
      return null;
    }
  }, [token]);

  const handleParticipantPress = useCallback(async (participant: { userId: string; status: string }) => {
    const details = await fetchParticipantDetails(participant.userId);
    if (details) {
      setSelectedParticipant(details);
      setEvents(prevEvents => prevEvents.map(event => ({
        ...event,
        participants: event.participants.map(p => 
          p.userId === participant.userId ? { ...p, name: details.name } : p
        )
      })));
    }
  }, [fetchParticipantDetails]);

  const renderParticipationButton = useCallback((event: Event) => {
    if (event.creator.id === userId) {
      return null;
    }

    const participants = event.participants || [];
    const userParticipation = participants.find(p => p.userId === userId);
    
    if (userParticipation) {
      if (userParticipation.status === 'rejected') {
        return (
          <View style={[commonStyles.button, { 
            backgroundColor: colors.danger + '10',
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            borderRadius: borderRadius.lg,
          }]}>
            <Ionicons name="close-circle" size={14} color={colors.danger} />
            <Text style={[commonStyles.text, { 
              color: colors.danger,
              fontSize: typography.fontSize.xs,
              fontWeight: '500'
            }]}>
              Rejected
            </Text>
          </View>
        );
      }
      
      if (userParticipation.status === 'approved') {
        return (
          <View style={[commonStyles.button, { 
            backgroundColor: colors.success + '10',
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            borderRadius: borderRadius.lg,
          }]}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={[commonStyles.text, { 
              color: colors.success,
              fontSize: typography.fontSize.xs,
              fontWeight: '500'
            }]}>
              Approved
            </Text>
          </View>
        );
      }

      return (
        <TouchableOpacity
          style={[commonStyles.button, { 
            backgroundColor: colors.warning + '10',
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            borderRadius: borderRadius.lg,
          }]}
          onPress={() => handleLeaveEvent(event._id)}
        >
          <Ionicons name="exit" size={14} color={colors.warning} />
          <Text style={[commonStyles.text, { 
            color: colors.warning,
            fontSize: typography.fontSize.xs,
            fontWeight: '500'
          }]}>
            Cancel Request
          </Text>
        </TouchableOpacity>
      );
    }

    return (
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
        onPress={() => handleJoinEvent(event)}
      >
        <Ionicons name="enter" size={14} color={colors.primary} />
        <Text style={[commonStyles.text, { 
          color: colors.primary,
          fontSize: typography.fontSize.xs,
          fontWeight: '500'
        }]}>
          Join Event
        </Text>
      </TouchableOpacity>
    );
  }, [handleJoinEvent, handleLeaveEvent, userId]);

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

    const renderParticipants = () => {
      const participants = item.participants || [];
      const approvedParticipants = participants.filter(p => p.status === 'approved');
      
      if (approvedParticipants.length === 0) return null;

      return (
        <View style={{ marginBottom: spacing.lg }}>
          <View style={[commonStyles.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }]}>
            <Text style={[commonStyles.subtitle]}>Participants</Text>
            <Text style={[commonStyles.textSecondary]}>
              {approvedParticipants.length}/{item.capacity}
            </Text>
          </View>
          
          <View style={{ gap: spacing.sm }}>
            {approvedParticipants.map((participant, index) => (
              <TouchableOpacity
                key={index}
                style={[commonStyles.row, { 
                  backgroundColor: colors.gray[100],
                  padding: spacing.sm,
                  borderRadius: borderRadius.lg,
                  alignItems: 'center'
                }]}
                onPress={() => handleParticipantPress(participant)}
              >
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.gray[100],
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: spacing.sm,
                  overflow: 'hidden',
                }}>
                  {participant.pictures?.[0]?.url ? (
                    <Image
                      source={{ uri: getImageUrl(participant.pictures[0].url) || undefined }}
                      style={{ width: '100%', height: '100%' }}
                      defaultSource={require('../assets/default-avatar.png')}
                    />
                  ) : (
                    <Ionicons name="person" size={16} color={colors.gray[400]} />
                  )}
                </View>
                <Text style={[commonStyles.text, { flex: 1 }]}>
                  {participant.userId === userId ? 'You' : participant.name || 'Anonymous'}
                </Text>
                {participant.userId === item.creator.id && (
                  <View style={{
                    backgroundColor: colors.primary + '10',
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: borderRadius.lg,
                  }}>
                    <Text style={[commonStyles.text, { 
                      color: colors.primary,
                      fontSize: typography.fontSize.xs,
                      fontWeight: '500'
                    }]}>
                      Creator
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    };

    return (
      <View style={{ 
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[200],
      }}>
        <View style={{ padding: spacing.sm }}>
          {/* Header Section */}
          <View style={{ marginBottom: spacing.lg }}>
            <TouchableOpacity 
              style={[commonStyles.row, { alignItems: 'center', marginBottom: spacing.sm }]}
              onPress={() => setSelectedCreator(item.creator)}
            >
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.gray[100],
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: spacing.sm,
                overflow: 'hidden',
              }}>
                {item.creator.pictures?.[0]?.url ? (
                  <Image
                    source={{ uri: getImageUrl(item.creator.pictures[0].url) || undefined }}
                    style={{ width: '100%', height: '100%' }}
                    defaultSource={require('../assets/default-avatar.png')}
                  />
                ) : (
                  <Ionicons name="person" size={16} color={colors.gray[400]} />
                )}
              </View>
              <Text style={[commonStyles.text, { color: colors.gray[600] }]}>
                Created by {item.creator.name}
              </Text>
            </TouchableOpacity>

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
            padding: spacing.base,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.lg,
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
              padding: spacing.base,
              borderRadius: borderRadius.lg,
              marginBottom: spacing.lg,
            }}>
              <Text style={[commonStyles.text, { color: colors.primary, fontWeight: '500' }]}>
                Repeats {item.repeatFrequency}ly
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

          {/* Event Status */}
          <View style={{
            backgroundColor: colors.gray[100],
            padding: spacing.base,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.lg,
          }}>
            <View style={[commonStyles.row, { justifyContent: 'space-between', marginBottom: spacing.xs }]}>
              <View style={[commonStyles.row, { alignItems: 'center' }]}>
                <Ionicons name="people-outline" size={20} color={colors.gray[600]} style={{ marginRight: spacing.xs }} />
                <Text style={[commonStyles.text, { color: colors.gray[600] }]}>
                  {item.participants?.filter(p => p.status === 'approved').length || 0} / {item.capacity} participants
                </Text>
              </View>
              <View style={[commonStyles.row, { alignItems: 'center' }]}>
                <Ionicons name="shield-outline" size={20} color={colors.gray[600]} style={{ marginRight: spacing.xs }} />
                <Text style={[commonStyles.text, { 
                  color: item.status === 'open' ? colors.success : colors.warning,
                  fontWeight: '500'
                }]}>
                  {item.status === 'open' ? 'Open' : 'Verification Required'}
                </Text>
              </View>
            </View>
          </View>

          {/* Participants List */}
          {(item.status === 'open' || item.participants?.some(p => p.userId === userId && p.status === 'approved')) && renderParticipants()}

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
          <View style={{ borderTopWidth: 1, borderTopColor: colors.gray[100], paddingTop: spacing.lg }}>
            <Text style={[commonStyles.textTertiary, { marginBottom: spacing.base }]}>
              Created {new Date(item.createdAt).toLocaleDateString()}
            </Text>

            <View style={[commonStyles.row, { justifyContent: 'flex-end', gap: spacing.sm }]}>
              {renderParticipationButton(item)}
              {item.creator.id === userId && (
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
              )}
            </View>
          </View>
        </View>
      </View>
    );
  }, [userId, handleDeleteEvent, renderParticipationButton, setSelectedCreator, setSelectedParticipant, handleParticipantPress]);

  const keyExtractor = useCallback((item: Event) => item._id, []);

  if (loading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[commonStyles.container, { backgroundColor: colors.white }]}>
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
        paddingHorizontal: spacing.sm,
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
      }}>
        <Text style={[commonStyles.title, { color: colors.gray[900], marginBottom: 0 }]}>
          Explore Events
        </Text>
      </View>
      
      {/* Content */}
      {events.length === 0 ? (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          paddingHorizontal: spacing.base,
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
            <Ionicons name="compass-outline" size={40} color={colors.gray[400]} />
          </View>
          <Text style={[commonStyles.subtitle, { 
            color: colors.gray[900],
            marginBottom: spacing.sm,
            textAlign: 'center'
          }]}>
            No Events Found
          </Text>
          <Text style={[commonStyles.text, { 
            color: colors.gray[600],
            marginBottom: spacing.xl,
            textAlign: 'center',
            lineHeight: typography.lineHeight.relaxed
          }]}>
            There are no events available at the moment. Check back later!
          </Text>
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
      
      <CreatorModal
        visible={!!selectedCreator}
        creator={selectedCreator!}
        onClose={() => setSelectedCreator(null)}
      />

      <ParticipantModal
        visible={!!selectedParticipant}
        participant={selectedParticipant!}
        onClose={() => setSelectedParticipant(null)}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
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
    color: '#0288D1',
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
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  creatorInfo: {
    marginBottom: 8,
  },
  creatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorThumb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  creatorThumbPlaceholder: {
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  creatorModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Dimensions.get('window').height * 0.8,
    width: '100%',
    overflow: 'hidden',
  },
  creatorModalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  creatorProfile: {
    alignItems: 'center',
    padding: 20,
  },
  creatorPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  creatorPhotoPlaceholder: {
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  creatorEmail: {
    fontSize: 16,
    color: '#666',
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
  noInterests: {
    color: '#666',
    fontStyle: 'italic',
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
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
  joinButton: {
    backgroundColor: '#4CAF50',
  },
  leaveButton: {
    backgroundColor: '#ff9800',
  },
  eventStatus: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  capacityLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openStatusBadge: {
    backgroundColor: '#e8f5e9',
  },
  verificationStatusBadge: {
    backgroundColor: '#fff3e0',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  capacityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  capacityAvailable: {
    color: '#4caf50',
  },
  capacityFull: {
    color: '#f44336',
  },
  rejectedButton: {
    backgroundColor: '#f44336',
    opacity: 0.8,
  },
  rejectedStatusBadge: {
    backgroundColor: '#ffebee',
  },
  rejectedStatusText: {
    color: '#d32f2f',
  },
  rejectionNote: {
    color: '#d32f2f',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  approvedButton: {
    backgroundColor: '#4CAF50',
    opacity: 0.8,
  },
  approvedStatusBadge: {
    backgroundColor: '#e8f5e9',
  },
  approvedStatusText: {
    color: '#2e7d32',
  },
  approvalNote: {
    color: '#2e7d32',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  sendMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    marginHorizontal: 16,
    gap: 8,
  },
  sendMessageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 