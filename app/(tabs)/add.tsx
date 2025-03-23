import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert, ScrollView, Platform, PanResponder, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { API_URL } from '../config/api';
import { useAuth } from '../context/auth';
import MapView, { Marker, MapPressEvent, PROVIDER_GOOGLE } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors, typography, spacing, borderRadius, commonStyles } from '../theme';
import Tag from '../components/Tag';

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
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
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

  // Load event data if editing
  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) return;

      try {
        const response = await fetch(`${API_URL}/api/events/${eventId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch event');
        }

        const event = await response.json();
        setForm({
          title: event.title || '',
          description: event.description || '',
          type: event.type || 'one-time',
          locations: event.locations || [],
          startDate: event.startDate ? new Date(event.startDate) : new Date(),
          endDate: event.endDate ? new Date(event.endDate) : undefined,
          startTime: event.startTime || '09:00',
          endTime: event.endTime || '17:00',
          repeatFrequency: event.repeatFrequency,
          repeatDays: event.repeatDays || [],
          tags: event.tags || [],
          capacity: typeof event.capacity === 'number' ? event.capacity : 10,
          status: event.status || 'open'
        });
      } catch (error) {
        console.error('Error loading event:', error);
        Alert.alert('Error', 'Failed to load event details');
      }
    };

    loadEvent();
  }, [eventId, token]);

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

      const url = eventId 
        ? `${API_URL}/api/events/${eventId}`
        : `${API_URL}/api/events`;

      const method = eventId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${eventId ? 'update' : 'create'} event`);
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
      
      Alert.alert('Success', `Event ${eventId ? 'updated' : 'created'} successfully`, [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/manage'),
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

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={commonStyles.container}
      scrollEnabled={draggingLocationIndex === null}
    >
      <View style={[commonStyles.row, { justifyContent: 'space-between', marginBottom: spacing.lg }]}>
        <Text style={commonStyles.title}>{eventId ? 'Edit Event' : 'Create Event'}</Text>
      </View>

      <TextInput
        style={commonStyles.input}
        placeholder="Event Title"
        value={form.title}
        onChangeText={(text) => setForm(prev => ({ ...prev, title: text }))}
        autoCapitalize="words"
      />

      <TextInput
        style={[commonStyles.input, commonStyles.textArea]}
        placeholder="Event Description"
        value={form.description}
        onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
        multiline
        numberOfLines={4}
      />

      <View style={commonStyles.section}>
        <Text style={commonStyles.subtitle}>Date & Time</Text>
        <TouchableOpacity 
          style={[commonStyles.input, { marginBottom: spacing.sm }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={commonStyles.text}>Start Date: {form.startDate.toLocaleDateString()}</Text>
        </TouchableOpacity>

        <View style={[commonStyles.row, { gap: spacing.sm }]}>
          <TouchableOpacity 
            style={[commonStyles.input, { flex: 1 }]}
            onPress={() => setShowTimePicker('start')}
          >
            <Text style={commonStyles.text}>Start Time: {form.startTime}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[commonStyles.input, { flex: 1 }]}
            onPress={() => setShowTimePicker('end')}
          >
            <Text style={commonStyles.text}>End Time: {form.endTime}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={commonStyles.section}>
        <Text style={commonStyles.subtitle}>Add Location</Text>
        <TextInput
          style={commonStyles.input}
          placeholder="Location Name"
          value={locationName}
          onChangeText={setLocationName}
        />
        <View style={[commonStyles.card, { height: 200, marginVertical: spacing.sm }]}>
          {locationPermissionStatus === 'pending' ? (
            <View style={[commonStyles.center, { padding: spacing.lg }]}>
              <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: spacing.base }]}>
                We need your location to show nearby places
              </Text>
              <TouchableOpacity
                style={[commonStyles.button, commonStyles.buttonPrimary]}
                onPress={requestLocationPermission}
              >
                <Text style={commonStyles.buttonText}>Grant Location Access</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ width: '100%', height: '100%' }}
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
          style={[commonStyles.button, commonStyles.buttonSuccess]} 
          onPress={addLocation}
          disabled={!currentLocation || !locationName}
        >
          <Text style={commonStyles.buttonText}>Add Location</Text>
        </TouchableOpacity>

        {form.locations.length > 0 && (
          <View style={commonStyles.section}>
            <Text style={commonStyles.subtitle}>Added Locations</Text>
            <Text style={[commonStyles.textSecondary, { fontStyle: 'italic', marginBottom: spacing.sm }]}>
              Hold and drag ≡ to reorder locations
            </Text>
            {form.locations.map((loc, index) => (
              <Animated.View
                key={index}
                style={[
                  commonStyles.card,
                  draggingLocationIndex === index && {
                    transform: [{ translateY: pan.y }],
                    shadowColor: colors.shadow.color,
                    shadowOffset: colors.shadow.offset,
                    shadowOpacity: colors.shadow.opacity,
                    shadowRadius: colors.shadow.radius,
                    elevation: 8,
                  }
                ]}
                {...(draggingLocationIndex === index ? panResponder.panHandlers : {})}
              >
                <View style={commonStyles.row}>
                  <TouchableOpacity
                    onPressIn={() => handleLocationDragStart(index)}
                    style={{ marginRight: spacing.sm }}
                  >
                    <Ionicons name="menu" size={24} color={colors.gray[600]} />
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={commonStyles.text}>{loc.name}</Text>
                    <Text style={commonStyles.textSecondary}>
                      {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => removeLocation(index)}
                    style={{ padding: spacing.xs }}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </View>
        )}
      </View>

      <View style={commonStyles.section}>
        <Text style={commonStyles.subtitle}>Event Type</Text>
        <View style={[commonStyles.row, { gap: spacing.sm }]}>
          <TouchableOpacity
            style={[
              commonStyles.button,
              {
                flex: 1,
                backgroundColor: form.type === 'one-time' ? colors.primary : colors.background.primary,
                borderWidth: 1,
                borderColor: colors.border,
              }
            ]}
            onPress={() => setForm(prev => ({ ...prev, type: 'one-time' }))}
          >
            <Text style={[
              commonStyles.text,
              form.type === 'one-time' && { color: colors.white }
            ]}>
              One-time Event
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              commonStyles.button,
              {
                flex: 1,
                backgroundColor: form.type === 'recurring' ? colors.primary : colors.background.primary,
                borderWidth: 1,
                borderColor: colors.border,
              }
            ]}
            onPress={() => setForm(prev => ({ ...prev, type: 'recurring' }))}
          >
            <Text style={[
              commonStyles.text,
              form.type === 'recurring' && { color: colors.white }
            ]}>
              Recurring Event
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {form.type === 'recurring' && (
        <View style={commonStyles.section}>
          <Text style={commonStyles.subtitle}>Repeat Frequency</Text>
          <View style={[commonStyles.row, { gap: spacing.sm }]}>
            {['daily', 'weekly', 'monthly'].map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[
                  commonStyles.button,
                  {
                    flex: 1,
                    backgroundColor: form.repeatFrequency === freq ? colors.primary : colors.background.primary,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => setForm(prev => ({ ...prev, repeatFrequency: freq as any }))}
              >
                <Text style={[
                  commonStyles.text,
                  form.repeatFrequency === freq && { color: colors.white }
                ]}>
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {form.repeatFrequency === 'weekly' && (
            <View style={commonStyles.section}>
              <Text style={commonStyles.subtitle}>Repeat Days</Text>
              <View style={[commonStyles.row, { flexWrap: 'wrap', gap: spacing.xs }]}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      commonStyles.button,
                      {
                        backgroundColor: form.repeatDays?.includes(day) ? colors.primary : colors.background.primary,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: spacing.sm,
                        minWidth: 40,
                      }
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
                      commonStyles.text,
                      form.repeatDays?.includes(day) && { color: colors.white }
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={[commonStyles.input, { marginBottom: spacing.sm }]}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={commonStyles.text}>
              End Date: {form.endDate?.toLocaleDateString() || 'Select End Date'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={commonStyles.section}>
        <Text style={commonStyles.subtitle}>Tags</Text>
        <View style={[commonStyles.row, { flexWrap: 'wrap', gap: spacing.xs }]}>
          {COMMON_TAGS.map((tag) => (
            <Tag
              key={tag}
              label={tag}
              isSelected={form.tags.includes(tag)}
              onPress={() => toggleTag(tag)}
            />
          ))}
        </View>
      </View>

      <View style={commonStyles.section}>
        <Text style={commonStyles.subtitle}>Capacity</Text>
        <View style={[commonStyles.row, { justifyContent: 'center', gap: spacing.sm }]}>
          <TouchableOpacity
            style={[commonStyles.button, { padding: spacing.sm }]}
            onPress={() => setForm(prev => ({
              ...prev,
              capacity: Math.max(1, (prev.capacity || 10) - 1)
            }))}
          >
            <Ionicons name="remove" size={24} color={colors.gray[600]} />
          </TouchableOpacity>
          <TextInput
            style={[commonStyles.input, { width: 60, textAlign: 'center' }]}
            value={String(form.capacity || 10)}
            keyboardType="number-pad"
            onChangeText={(text) => {
              const num = parseInt(text);
              if (!isNaN(num) && num >= 1 && num <= 99) {
                setForm(prev => ({ ...prev, capacity: num }));
              }
            }}
          />
          <TouchableOpacity
            style={[commonStyles.button, { padding: spacing.sm }]}
            onPress={() => setForm(prev => ({
              ...prev,
              capacity: Math.min(99, (prev.capacity || 10) + 1)
            }))}
          >
            <Ionicons name="add" size={24} color={colors.gray[600]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={commonStyles.section}>
        <Text style={commonStyles.subtitle}>Event Access</Text>
        <View style={{ gap: spacing.sm }}>
          <TouchableOpacity
            style={[
              commonStyles.card,
              form.status === 'open' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setForm(prev => ({ ...prev, status: 'open' }))}
          >
            <Text style={[
              commonStyles.text,
              form.status === 'open' && { color: colors.white }
            ]}>
              Open Access
            </Text>
            <Text style={[
              commonStyles.textSecondary,
              form.status === 'open' && { color: colors.white }
            ]}>
              Anyone can join this event
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              commonStyles.card,
              form.status === 'verification_required' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setForm(prev => ({ ...prev, status: 'verification_required' }))}
          >
            <Text style={[
              commonStyles.text,
              form.status === 'verification_required' && { color: colors.white }
            ]}>
              Verification Required
            </Text>
            <Text style={[
              commonStyles.textSecondary,
              form.status === 'verification_required' && { color: colors.white }
            ]}>
              Creator must approve join requests
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={[
          commonStyles.button,
          commonStyles.buttonPrimary,
          { marginBottom: spacing.xl }
        ]} 
        onPress={handleSubmit}
        disabled={!form.title || !form.description || form.locations.length === 0}
      >
        <Text style={commonStyles.buttonText}>
          {eventId ? 'Update Event' : 'Create Event'}
        </Text>
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