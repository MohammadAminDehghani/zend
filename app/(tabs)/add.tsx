import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert, ScrollView, Platform, PanResponder, Animated, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { API_URL } from '../config/api';
import { useAuth } from '../context/auth';
import MapView, { Marker, MapPressEvent, PROVIDER_GOOGLE } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors, typography, spacing, borderRadius, commonStyles } from '../theme';
import Tag from '../components/Tag';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SectionHeader } from '../components/SectionHeader';
import { FormInput } from '../components/FormInput';
import { LocationPicker } from '../components/LocationPicker';
import { DateTimePickerField } from '../components/DateTimePickerField';
import { TagSelection } from '../components/TagSelection';
import { CapacitySelector } from '../components/CapacitySelector';
import { AccessControlSelector } from '../components/AccessControlSelector';

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
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    location?: string;
    date?: string;
    time?: string;
  }>({});

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

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!form.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!form.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (form.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    if (form.locations.length === 0) {
      newErrors.location = 'At least one location is required';
    }
    
    if (!form.startDate) {
      newErrors.date = 'Start date is required';
    }
    
    if (!form.startTime || !form.endTime) {
      newErrors.time = 'Start and end times are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
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

      Alert.alert('Success', `Event ${eventId ? 'updated' : 'created'} successfully`, [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/manage'),
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView 
        ref={scrollViewRef}
        style={[commonStyles.container, { backgroundColor: colors.white }]}
        scrollEnabled={draggingLocationIndex === null}
      >
        {/* Header Section */}
        <View style={{
          padding: spacing.md,
          paddingTop: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.gray[200],
          marginBottom: spacing.sm,
        }}>
          <View style={[commonStyles.row, { justifyContent: 'space-between' }]}>
            <Text style={[commonStyles.title, { color: colors.gray[900] }]}>
              {eventId ? 'Edit Event' : 'Create New Event'}
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={{ padding: spacing.sm }}>
          {/* Basic Information */}
          <View style={{ marginBottom: spacing.lg }}>
            <SectionHeader title="Basic Information" />
            <View style={{ gap: spacing.sm }}>
              <FormInput
                label="Event Title"
                required
                value={form.title}
                onChangeText={(text) => {
                  setForm(prev => ({ ...prev, title: text }));
                  setErrors(prev => ({ ...prev, title: undefined }));
                }}
                error={errors.title}
                placeholder="Enter event title"
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Date & Time Section */}
          <View style={{ marginBottom: spacing.lg }}>
            <SectionHeader title="Date & Time" />
            <View style={{ gap: spacing.sm }}>
              <DateTimePickerField
                label="Start Date"
                required
                value={form.startDate}
                onPress={() => setShowDatePicker(true)}
                error={errors.date}
              />

              <View style={[commonStyles.row, { gap: spacing.sm }]}>
                <DateTimePickerField
                  label="Start Time"
                  required
                  value={form.startTime}
                  onPress={() => setShowTimePicker('start')}
                  error={errors.time}
                  style={{ flex: 1 }}
                />
                <DateTimePickerField
                  label="End Time"
                  required
                  value={form.endTime}
                  onPress={() => setShowTimePicker('end')}
                  error={errors.time}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>

          {/* Location Section */}
          <View style={{ marginBottom: spacing.lg }}>
            <SectionHeader title="Location" required />
            <LocationPicker
              currentLocation={currentLocation}
              locationName={locationName}
              setLocationName={setLocationName}
              handleMapPress={handleMapPress}
              addLocation={addLocation}
              locations={form.locations}
              removeLocation={removeLocation}
              draggingLocationIndex={draggingLocationIndex}
              panResponder={panResponder}
              pan={pan}
              handleLocationDragStart={handleLocationDragStart}
              locationPermissionStatus={locationPermissionStatus}
              requestLocationPermission={requestLocationPermission}
              userLocation={userLocation}
              error={errors.location}
            />
          </View>

          {/* Event Type Section */}
          <View style={{ marginBottom: spacing.lg }}>
            <SectionHeader title="Event Type" />
            <View style={[commonStyles.row, { gap: spacing.xs }]}>
              <TouchableOpacity
                style={[
                  commonStyles.button,
                  {
                    flex: 1,
                    backgroundColor: form.type === 'one-time' ? colors.primary : colors.white,
                    borderWidth: 1,
                    borderColor: form.type === 'one-time' ? colors.primary : colors.gray[200],
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.sm,
                  }
                ]}
                onPress={() => setForm(prev => ({ ...prev, type: 'one-time' }))}
              >
                <Text style={[
                  commonStyles.text,
                  { 
                    color: form.type === 'one-time' ? colors.white : colors.gray[700],
                    fontSize: typography.fontSize.sm,
                  }
                ]}>
                  One-time Event
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  commonStyles.button,
                  {
                    flex: 1,
                    backgroundColor: form.type === 'recurring' ? colors.primary : colors.white,
                    borderWidth: 1,
                    borderColor: form.type === 'recurring' ? colors.primary : colors.gray[200],
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.sm,
                  }
                ]}
                onPress={() => setForm(prev => ({ ...prev, type: 'recurring' }))}
              >
                <Text style={[
                  commonStyles.text,
                  { 
                    color: form.type === 'recurring' ? colors.white : colors.gray[700],
                    fontSize: typography.fontSize.sm,
                  }
                ]}>
                  Recurring Event
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recurring Event Options */}
          {form.type === 'recurring' && (
            <View style={{ marginBottom: spacing.lg }}>
              <SectionHeader title="Recurring Options" />
              <View style={{ gap: spacing.sm }}>
                <View>
                  <Text style={[commonStyles.label, { marginBottom: spacing.xs, color: colors.gray[700] }]}>
                    Repeat Frequency
                  </Text>
                  <View style={[commonStyles.row, { gap: spacing.xs }]}>
                    {['daily', 'weekly', 'monthly'].map((freq) => (
                      <TouchableOpacity
                        key={freq}
                        style={[
                          commonStyles.button,
                          {
                            flex: 1,
                            backgroundColor: form.repeatFrequency === freq ? colors.primary : colors.white,
                            borderWidth: 1,
                            borderColor: form.repeatFrequency === freq ? colors.primary : colors.gray[200],
                            paddingVertical: spacing.xs,
                            paddingHorizontal: spacing.sm,
                          }
                        ]}
                        onPress={() => setForm(prev => ({ ...prev, repeatFrequency: freq as any }))}
                      >
                        <Text style={[
                          commonStyles.text,
                          { 
                            color: form.repeatFrequency === freq ? colors.white : colors.gray[700],
                            fontSize: typography.fontSize.sm,
                          }
                        ]}>
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {form.repeatFrequency === 'weekly' && (
                  <View>
                    <Text style={[commonStyles.label, { marginBottom: spacing.xs, color: colors.gray[700] }]}>
                      Repeat Days
                    </Text>
                    <View style={[commonStyles.row, { flexWrap: 'wrap', gap: spacing.xs }]}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            commonStyles.button,
                            {
                              backgroundColor: form.repeatDays?.includes(day) ? colors.primary : colors.white,
                              borderWidth: 1,
                              borderColor: form.repeatDays?.includes(day) ? colors.primary : colors.gray[200],
                              paddingVertical: spacing.xs,
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
                            { 
                              color: form.repeatDays?.includes(day) ? colors.white : colors.gray[700],
                              fontSize: typography.fontSize.sm,
                            }
                          ]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <DateTimePickerField
                  label="End Date"
                  value={form.endDate?.toLocaleDateString() || 'Select End Date'}
                  onPress={() => setShowEndDatePicker(true)}
                />
              </View>
            </View>
          )}

          {/* Tags Section */}
          <View style={{ marginBottom: spacing.lg }}>
            <SectionHeader title="Event Tags" />
            <View style={[commonStyles.row, { flexWrap: 'wrap', gap: spacing.sm }]}>
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

          {/* Capacity Section */}
          <View style={{ marginBottom: spacing.lg }}>
            <SectionHeader title="Event Capacity" />
            <CapacitySelector
              capacity={form.capacity}
              onIncrease={() => setForm(prev => ({
                ...prev,
                capacity: Math.min(99, (prev.capacity || 10) + 1)
              }))}
              onDecrease={() => setForm(prev => ({
                ...prev,
                capacity: Math.max(1, (prev.capacity || 10) - 1)
              }))}
              onChange={(text) => {
                const num = parseInt(text);
                if (!isNaN(num) && num >= 1 && num <= 99) {
                  setForm(prev => ({ ...prev, capacity: num }));
                }
              }}
            />
          </View>

          {/* Access Control Section */}
          <View style={{ marginBottom: spacing.lg }}>
            <SectionHeader title="Access Control" />
            <View style={[commonStyles.row, { gap: spacing.xs }]}>
              <TouchableOpacity
                style={[
                  commonStyles.button,
                  {
                    flex: 1,
                    backgroundColor: form.status === 'open' ? colors.primary : colors.white,
                    borderWidth: 1,
                    borderColor: form.status === 'open' ? colors.primary : colors.gray[200],
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.sm,
                  }
                ]}
                onPress={() => setForm(prev => ({ ...prev, status: 'open' }))}
              >
                <Text style={[
                  commonStyles.text,
                  { 
                    color: form.status === 'open' ? colors.white : colors.gray[700],
                    fontSize: typography.fontSize.sm,
                    textAlign: 'center',
                  }
                ]}>
                  Open
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  commonStyles.button,
                  {
                    flex: 1,
                    backgroundColor: form.status === 'verification_required' ? colors.primary : colors.white,
                    borderWidth: 1,
                    borderColor: form.status === 'verification_required' ? colors.primary : colors.gray[200],
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.sm,
                  }
                ]}
                onPress={() => setForm(prev => ({ ...prev, status: 'verification_required' }))}
              >
                <Text style={[
                  commonStyles.text,
                  { 
                    color: form.status === 'verification_required' ? colors.white : colors.gray[700],
                    fontSize: typography.fontSize.sm,
                    textAlign: 'center',
                  }
                ]}>
                  Verification Required
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description Section */}
          <View style={{ marginBottom: spacing.lg }}>
            <SectionHeader title="Description" required />
            <View>
              <TextInput
                style={[
                  commonStyles.input, 
                  commonStyles.textArea, 
                  { borderColor: errors.description ? colors.danger : colors.gray[200] }
                ]}
                placeholder="Tell us about your event..."
                value={form.description}
                onChangeText={(text) => {
                  setForm(prev => ({ ...prev, description: text }));
                  setErrors(prev => ({ ...prev, description: undefined }));
                }}
                multiline
                numberOfLines={4}
              />
              <View style={[commonStyles.row, { justifyContent: 'space-between', marginTop: spacing.xs }]}>
                {errors.description && (
                  <Text style={[commonStyles.textSecondary, { color: colors.danger }]}>
                    {errors.description}
                  </Text>
                )}
                <Text style={[commonStyles.textSecondary, { textAlign: 'right' }]}>
                  {form.description.length}/500
                </Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[
              commonStyles.button,
              { 
                backgroundColor: colors.white,
                borderWidth: 1,
                borderColor: colors.primary,
                marginBottom: spacing.lg,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.base,
              }
            ]} 
            onPress={handleSubmit}
            disabled={isLoading || !form.title || !form.description || form.locations.length === 0}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={[
                commonStyles.text, 
                { 
                  color: colors.primary, 
                  fontSize: typography.fontSize.base,
                  fontWeight: '500',
                }
              ]}>
                {eventId ? 'Update Event' : 'Create Event'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date/Time Pickers */}
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
    </View>
  );
} 