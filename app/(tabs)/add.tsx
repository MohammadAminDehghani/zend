import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ScrollView, Dimensions, Platform, PanResponder, Animated } from 'react-native';
import { router } from 'expo-router';
import { API_URL } from '../config/api';
import { useAuth } from '../context/auth';
import MapView, { Marker, MapPressEvent, PROVIDER_GOOGLE } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Common tags for events
const COMMON_TAGS = [
  'Work', 'Personal', 'Meeting', 'Social', 'Family',
  'Health', 'Education', 'Sports', 'Entertainment', 'Shopping',
  'Travel', 'Food', 'Hobby', 'Exercise', 'Relaxation',
  'Business', 'Party', 'Appointment', 'Task', 'Other'
];

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

interface EventForm {
  title: string;
  description: string;
  type: 'one-time' | 'recurring';
  locations: Location[];
  startDate: Date;
  endDate?: Date;
  startTime: string;
  endTime: string;
  repeatFrequency?: 'daily' | 'weekly' | 'monthly';
  repeatDays?: string[];
  tags: string[];
  capacity: number;
  status: 'open' | 'verification_required';
}

export default function AddScreen() {
  const [form, setForm] = useState<EventForm>({
    title: '',
    description: '',
    type: 'one-time',
    locations: [],
    startDate: new Date(),
    startTime: '09:00',
    endTime: '17:00',
    tags: [],
    capacity: 10,
    status: 'open'
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState('');
  const { token, userId } = useAuth();
  const [draggingLocationIndex, setDraggingLocationIndex] = useState<number | null>(null);
  const pan = useRef(new Animated.ValueXY()).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'granted' | 'denied' | 'pending'>('pending');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(status === 'granted' ? 'granted' : 'denied');
      
      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        } catch (error) {
          console.error('Error getting location:', error);
          Alert.alert(
            'Location Error',
            'Could not get your current location. Please try again or select manually.'
          );
        }
      }
    })();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermissionStatus(status === 'granted' ? 'granted' : 'denied');
    
    if (status === 'granted') {
      try {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      } catch (error) {
        Alert.alert(
          'Location Error',
          'Could not get your current location. Please try again or select manually.'
        );
      }
    }
  };

  const handleMapPress = useCallback((event: MapPressEvent) => {
    const { coordinate } = event.nativeEvent;
    setCurrentLocation({
      name: '',
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    });
  }, []);

  const addLocation = () => {
    if (currentLocation && locationName) {
      setForm(prev => ({
        ...prev,
        locations: [...prev.locations, { ...currentLocation, name: locationName }]
      }));
      setCurrentLocation(null);
      setLocationName('');
    }
  };

  const removeLocation = (index: number) => {
    setForm(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    try {
      const eventData = {
        ...form,
        creator: userId,
        type: form.type
      };

      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create event');
      }

      // Reset form
      setForm({
        title: '',
        description: '',
        type: 'one-time',
        locations: [],
        startDate: new Date(),
        startTime: '09:00',
        endTime: '17:00',
        tags: [],
        capacity: 10,
        status: 'open'
      });
      setCurrentLocation(null);
      setLocationName('');
      
      Alert.alert('Success', 'Event created successfully', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/events'),
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      Alert.alert('Error', errorMessage);
    }
  };

  const toggleTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (_, gesture) => {
      pan.setOffset({
        x: 0,
        y: gesture.dy
      });
      pan.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: (_, gesture) => {
      pan.setValue({ x: 0, y: gesture.dy });
    },
    onPanResponderRelease: (_, gesture) => {
      pan.flattenOffset();
      const moveDistance = Math.abs(gesture.dy);
      const moveThreshold = 50; // Minimum distance to trigger reorder
      
      if (moveDistance > moveThreshold && draggingLocationIndex !== null) {
        const itemHeight = 80; // Approximate height of each location item
        const moveDirection = gesture.dy > 0 ? 1 : -1;
        const newIndex = Math.max(
          0,
          Math.min(
            form.locations.length - 1,
            draggingLocationIndex + moveDirection
          )
        );
        
        if (newIndex !== draggingLocationIndex) {
          const newLocations = [...form.locations];
          const [movedItem] = newLocations.splice(draggingLocationIndex, 1);
          newLocations.splice(newIndex, 0, movedItem);
          setForm(prev => ({ ...prev, locations: newLocations }));
        }
      }
      
      // Reset animation
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
        tension: 40,
        friction: 5
      }).start(() => setDraggingLocationIndex(null));
    }
  });

  const handleLocationDragStart = (index: number) => {
    setDraggingLocationIndex(index);
  };

  const renderLocationInput = () => (
    <View style={styles.locationSection}>
      <Text style={styles.sectionTitle}>Add Location</Text>
      <TextInput
        style={styles.input}
        placeholder="Location Name"
        value={locationName}
        onChangeText={setLocationName}
      />
      <View style={styles.mapContainer}>
        {locationPermissionStatus === 'pending' ? (
          <View style={styles.locationPermissionContainer}>
            <Text style={styles.locationPermissionText}>
              We need your location to show nearby places
            </Text>
            <TouchableOpacity
              style={styles.locationPermissionButton}
              onPress={requestLocationPermission}
            >
              <Text style={styles.locationPermissionButtonText}>
                Grant Location Access
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: userLocation?.latitude || 37.78825,
              longitude: userLocation?.longitude || -122.4324,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation={locationPermissionStatus === 'granted'}
            onPress={handleMapPress}
          >
            {currentLocation && (
              <Marker
                coordinate={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }}
              />
            )}
          </MapView>
        )}
      </View>
      <TouchableOpacity 
        style={[styles.button, styles.addButton]} 
        onPress={addLocation}
        disabled={!currentLocation || !locationName}
      >
        <Text style={styles.buttonText}>Add Location</Text>
      </TouchableOpacity>

      {form.locations.length > 0 && (
        <View style={styles.locationsList}>
          <Text style={styles.sectionTitle}>Added Locations</Text>
          <Text style={styles.dragHint}>Hold and drag ≡ to reorder locations</Text>
          {form.locations.map((loc, index) => (
            <Animated.View
              key={index}
              style={[
                styles.locationItem,
                draggingLocationIndex === index && {
                  transform: [{ translateY: pan.y }],
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 8,
                }
              ]}
              {...(draggingLocationIndex === index ? panResponder.panHandlers : {})}
            >
              <View style={styles.locationItemContent}>
                <TouchableOpacity
                  onPressIn={() => handleLocationDragStart(index)}
                  style={styles.dragHandle}
                >
                  <Ionicons name="menu" size={24} color="#666" />
                </TouchableOpacity>
                <View style={styles.locationItemMain}>
                  <Text style={styles.locationItemName}>{loc.name}</Text>
                  <Text style={styles.locationItemCoords}>
                    {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => removeLocation(index)}
                  style={styles.removeLocationButton}
                >
                  <Ionicons name="close-circle" size={24} color="#ff4444" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))}
        </View>
      )}
    </View>
  );

  const renderRecurringOptions = () => (
    <View style={styles.recurringSection}>
      <View style={styles.frequencyContainer}>
        <Text>Repeat Frequency:</Text>
        <View style={styles.frequencyButtons}>
          {['daily', 'weekly', 'monthly'].map((freq) => (
            <TouchableOpacity
              key={freq}
              style={[
                styles.frequencyButton,
                form.repeatFrequency === freq && styles.frequencyButtonActive
              ]}
              onPress={() => setForm(prev => ({ ...prev, repeatFrequency: freq as any }))}
            >
              <Text style={[
                styles.frequencyButtonText,
                form.repeatFrequency === freq && styles.frequencyButtonTextActive
              ]}>
                {freq.charAt(0).toUpperCase() + freq.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {form.repeatFrequency === 'weekly' && (
        <View style={styles.daysContainer}>
          <Text>Repeat Days:</Text>
          <View style={styles.daysButtons}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  form.repeatDays?.includes(day) && styles.dayButtonActive
                ]}
                onPress={() => {
                  setForm(prev => ({
                    ...prev,
                    repeatDays: prev.repeatDays?.includes(day)
                      ? prev.repeatDays.filter(d => d !== day)
                      : [...(prev.repeatDays || []), day]
                  }));
                }}
              >
                <Text style={[
                  styles.dayButtonText,
                  form.repeatDays?.includes(day) && styles.dayButtonTextActive
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity 
        style={styles.dateButton}
        onPress={() => setShowEndDatePicker(true)}
      >
        <Text>End Date: {form.endDate?.toLocaleDateString() || 'Select End Date'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTags = () => (
    <View style={styles.tagsSection}>
      <Text style={styles.sectionTitle}>Tags</Text>
      <View style={styles.tagsContainer}>
        {COMMON_TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.tagButton,
              form.tags.includes(tag) && styles.tagButtonActive
            ]}
            onPress={() => toggleTag(tag)}
          >
            <Text style={[
              styles.tagButtonText,
              form.tags.includes(tag) && styles.tagButtonTextActive
            ]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCapacity = () => (
    <View style={styles.capacitySection}>
      <Text style={styles.sectionTitle}>Capacity</Text>
      <View style={styles.capacityContainer}>
        <TouchableOpacity
          style={styles.capacityButton}
          onPress={() => setForm(prev => ({
            ...prev,
            capacity: Math.max(1, prev.capacity - 1)
          }))}
        >
          <Ionicons name="remove" size={24} color="#666" />
        </TouchableOpacity>
        <TextInput
          style={styles.capacityInput}
          value={form.capacity.toString()}
          keyboardType="number-pad"
          onChangeText={(text) => {
            const num = parseInt(text);
            if (!isNaN(num) && num >= 1 && num <= 99) {
              setForm(prev => ({ ...prev, capacity: num }));
            }
          }}
        />
        <TouchableOpacity
          style={styles.capacityButton}
          onPress={() => setForm(prev => ({
            ...prev,
            capacity: Math.min(99, prev.capacity + 1)
          }))}
        >
          <Ionicons name="add" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEventStatus = () => (
    <View style={styles.eventStatusSection}>
      <Text style={styles.sectionTitle}>Event Access</Text>
      <View style={styles.eventStatusButtons}>
        <TouchableOpacity
          style={[
            styles.eventStatusButton,
            form.status === 'open' && styles.eventStatusButtonActive
          ]}
          onPress={() => setForm(prev => ({ ...prev, status: 'open' }))}
        >
          <Text style={[
            styles.eventStatusButtonText,
            form.status === 'open' && styles.eventStatusButtonTextActive
          ]}>
            Open Access
          </Text>
          <Text style={styles.eventStatusDescription}>
            Anyone can join this event
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.eventStatusButton,
            form.status === 'verification_required' && styles.eventStatusButtonActive
          ]}
          onPress={() => setForm(prev => ({ ...prev, status: 'verification_required' }))}
        >
          <Text style={[
            styles.eventStatusButtonText,
            form.status === 'verification_required' && styles.eventStatusButtonTextActive
          ]}>
            Verification Required
          </Text>
          <Text style={styles.eventStatusDescription}>
            Creator must approve join requests
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container}
      scrollEnabled={draggingLocationIndex === null}
    >
      <TextInput
        style={styles.input}
        placeholder="Event Title"
        value={form.title}
        onChangeText={(text) => setForm(prev => ({ ...prev, title: text }))}
        autoCapitalize="words"
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Event Description"
        value={form.description}
        onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
        multiline
        numberOfLines={4}
      />

      <View style={styles.dateTimeSection}>
        <Text style={styles.sectionTitle}>Date & Time</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>Start Date: {form.startDate.toLocaleDateString()}</Text>
        </TouchableOpacity>

        <View style={styles.timeContainer}>
          <TouchableOpacity 
            style={styles.timeButton}
            onPress={() => setShowTimePicker('start')}
          >
            <Text>Start Time: {form.startTime}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.timeButton}
            onPress={() => setShowTimePicker('end')}
          >
            <Text>End Time: {form.endTime}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderLocationInput()}

      <View style={styles.eventTypeSection}>
        <Text style={styles.sectionTitle}>Event Type</Text>
        <View style={styles.eventTypeButtons}>
          <TouchableOpacity
            style={[
              styles.eventTypeButton,
              form.type === 'one-time' && styles.eventTypeButtonActive
            ]}
            onPress={() => setForm(prev => ({ ...prev, type: 'one-time' }))}
          >
            <Text style={[
              styles.eventTypeButtonText,
              form.type === 'one-time' && styles.eventTypeButtonTextActive
            ]}>
              One-time Event
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.eventTypeButton,
              form.type === 'recurring' && styles.eventTypeButtonActive
            ]}
            onPress={() => setForm(prev => ({ ...prev, type: 'recurring' }))}
          >
            <Text style={[
              styles.eventTypeButtonText,
              form.type === 'recurring' && styles.eventTypeButtonTextActive
            ]}>
              Recurring Event
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {form.type === 'recurring' && renderRecurringOptions()}

      {renderTags()}

      {renderCapacity()}

      {renderEventStatus()}

      <TouchableOpacity 
        style={[styles.button, styles.submitButton]} 
        onPress={handleSubmit}
        disabled={!form.title || !form.description || form.locations.length === 0}
      >
        <Text style={styles.buttonText}>Create Event</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={form.startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: any, date?: Date) => {
            setShowDatePicker(false);
            if (date) {
              setForm(prev => ({ ...prev, startDate: date }));
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={form.endDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: any, date?: Date) => {
            setShowEndDatePicker(false);
            if (date) {
              setForm(prev => ({ ...prev, endDate: date }));
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={new Date(`2000-01-01T${showTimePicker === 'start' ? form.startTime : form.endTime}`)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: any, date?: Date) => {
            setShowTimePicker(null);
            if (date) {
              const timeString = date.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
              });
              setForm(prev => ({
                ...prev,
                [showTimePicker === 'start' ? 'startTime' : 'endTime']: timeString
              }));
            }
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dateTimeSection: {
    marginBottom: 20,
  },
  dateButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  locationSection: {
    marginBottom: 20,
  },
  mapContainer: {
    height: 200,
    marginVertical: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  locationsList: {
    marginTop: 10,
  },
  dragHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  locationItem: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  locationItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  dragHandle: {
    marginRight: 12,
  },
  locationItemMain: {
    flex: 1,
  },
  locationItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  locationItemCoords: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeLocationButton: {
    padding: 4,
  },
  recurringSection: {
    marginBottom: 20,
  },
  frequencyContainer: {
    marginBottom: 15,
  },
  frequencyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  frequencyButton: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  frequencyButtonText: {
    color: '#666',
  },
  frequencyButtonTextActive: {
    color: '#fff',
  },
  daysContainer: {
    marginBottom: 15,
  },
  daysButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  dayButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    margin: 5,
    minWidth: 40,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayButtonText: {
    color: '#666',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  button: {
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  eventTypeSection: {
    marginBottom: 20,
  },
  eventTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventTypeButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  eventTypeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  eventTypeButtonText: {
    color: '#666',
  },
  eventTypeButtonTextActive: {
    color: '#fff',
  },
  tagsSection: {
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  tagButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    margin: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  tagButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tagButtonText: {
    color: '#666',
  },
  tagButtonTextActive: {
    color: '#fff',
  },
  locationPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  locationPermissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  locationPermissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  locationPermissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  capacitySection: {
    marginBottom: 20,
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 5,
  },
  capacityButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  capacityInput: {
    width: 60,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    marginHorizontal: 10,
  },
  eventStatusSection: {
    marginBottom: 20,
  },
  eventStatusButtons: {
    flexDirection: 'column',
    gap: 10,
  },
  eventStatusButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    alignItems: 'flex-start',
  },
  eventStatusButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  eventStatusButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  eventStatusButtonTextActive: {
    color: '#fff',
  },
  eventStatusDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
}); 