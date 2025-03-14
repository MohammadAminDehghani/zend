import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, Dimensions, Modal, Image, Animated, ScrollView } from 'react-native';
import { useEffect, useState, useCallback, useRef } from 'react';
import { API_URL } from '../config/api';
import { useAuth } from '../context/auth';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

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

const CreatorModal: React.FC<CreatorModalProps> = ({ visible, creator, onClose }) => {
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
    return (
      <View style={styles.paginationDots}>
        {creator.pictures.map((_, index) => (
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

  const renderCreatorPhotos = () => {
    if (!creator.pictures || creator.pictures.length === 0) {
      return (
        <View style={[styles.creatorPhoto, styles.creatorPhotoPlaceholder]}>
          <Ionicons name="person" size={60} color="#666" />
        </View>
      );
    }

    const imageSize = Math.min(Dimensions.get('window').width, Dimensions.get('window').width);

    return (
      <View style={styles.sliderContainer}>
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
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[
            styles.creatorModal,
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
          <ScrollView style={styles.creatorModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Creator Profile</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.creatorProfile}>
              {renderCreatorPhotos()}
              <Text style={styles.creatorName}>{creator.name}</Text>
              <Text style={styles.creatorEmail}>{creator.email}</Text>
              
              {creator.phone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>{creator.phone}</Text>
                </View>
              )}

              {creator.gender && (
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    {creator.gender.charAt(0).toUpperCase() + creator.gender.slice(1)}
                  </Text>
                </View>
              )}

              {creator.bio && (
                <View style={styles.bioContainer}>
                  <Text style={styles.sectionTitle}>Bio</Text>
                  <Text style={styles.bioText}>{creator.bio}</Text>
                </View>
              )}

              <View style={styles.interestsSection}>
                <Text style={styles.sectionTitle}>Interests</Text>
                {renderInterests()}
              </View>
            </View>
          </ScrollView>
        </TouchableOpacity>
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
      if (isMounted.current) {
        setEvents(data);
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

  const handleDeletePress = useCallback((eventId: string) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          onPress: () => deleteEvent(eventId),
          style: 'destructive'
        }
      ]
    );
  }, [deleteEvent]);

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
        {item.tags.map((tag, index) => (
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

    const renderCreatorThumb = () => {
      if (item.creator.pictures && item.creator.pictures.length > 0) {
        return (
          <Image
            source={{ uri: `${API_URL}${item.creator.pictures[0].url}` }}
            style={styles.creatorThumb}
            defaultSource={require('../assets/default-avatar.png')}
          />
        );
      }
      return (
        <View style={[styles.creatorThumb, styles.creatorThumbPlaceholder]}>
          <Ionicons name="person" size={16} color="#666" />
        </View>
      );
    };

    return (
      <View style={styles.eventCard}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <TouchableOpacity 
          style={styles.creatorInfo}
          onPress={() => setSelectedCreator(item.creator)}
        >
          <View style={styles.creatorHeader}>
            {renderCreatorThumb()}
            <Text style={styles.creatorText}>Created by {item.creator.name}</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.eventDescription}>{item.description}</Text>
        
        <View style={styles.dateTimeInfo}>
          <Text style={styles.dateTimeText}>
            {formatDate(item.startDate)}
          </Text>
          <Text style={styles.dateTimeText}>
            {formatTime(item.startTime)} - {formatTime(item.endTime)}
          </Text>
        </View>

        {renderRecurringInfo()}

        {renderTags()}

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

        {item.creator.id === userId && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePress(item._id)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [userId, handleDeletePress]);

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
      <Text style={styles.title}>Events</Text>
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
      <CreatorModal
        visible={!!selectedCreator}
        creator={selectedCreator!}
        onClose={() => setSelectedCreator(null)}
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
}); 