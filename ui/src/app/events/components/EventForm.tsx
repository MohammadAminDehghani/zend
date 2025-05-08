import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, ScrollView, Platform, PanResponder, Animated, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MapPressEvent } from 'react-native-maps';
import { colors, typography, spacing, commonStyles } from '../../theme';
import Tag from '../../components/Tag';
import { SectionHeader } from '../../../components/forms/SectionHeader';
import { FormInput } from '../../../components/forms/FormInput';
import { LocationPicker } from './LocationPicker';
import { DateTimePickerField } from './DateTimePickerField';
import { CapacitySelector } from './CapacitySelector';
import { EventForm as EventFormType, EventLocation } from '../../hooks/useEventForm';

// Common tags for events
const COMMON_TAGS = [
  'Work', 'Personal', 'Meeting', 'Social', 'Family',
  'Health', 'Education', 'Sports', 'Entertainment', 'Shopping',
  'Travel', 'Food', 'Hobby', 'Exercise', 'Relaxation',
  'Business', 'Party', 'Appointment', 'Task', 'Other'
];

interface EventFormProps {
  form: EventFormType;
  setForm: (form: EventFormType) => void;
  errors: {
    title?: string;
    description?: string;
    location?: string;
    date?: string;
    time?: string;
  };
  isLoading: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  locationPermissionStatus: 'granted' | 'denied' | 'pending';
  requestLocationPermission: () => Promise<void>;
  onSubmit: () => Promise<void>;
  isEditing?: boolean;
}

export const EventForm: React.FC<EventFormProps> = ({
  form,
  setForm,
  errors,
  isLoading,
  userLocation,
  locationPermissionStatus,
  requestLocationPermission,
  onSubmit,
  isEditing = false
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState('');
  const [draggingLocationIndex, setDraggingLocationIndex] = useState<number | null>(null);
  const pan = useRef(new Animated.ValueXY()).current;
  const scrollViewRef = useRef<ScrollView>(null);

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
      setForm({
        ...form,
        locations: [...form.locations, { ...currentLocation, name: locationName }]
      });
      setCurrentLocation(null);
      setLocationName('');
    }
  };

  const removeLocation = (index: number) => {
    setForm({
      ...form,
      locations: form.locations.filter((_, i) => i !== index)
    });
  };

  const toggleTag = (tag: string) => {
    setForm({
      ...form,
      tags: form.tags.includes(tag)
        ? form.tags.filter(t => t !== tag)
        : [...form.tags, tag]
    });
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
      const moveThreshold = 50;
      
      if (moveDistance > moveThreshold && draggingLocationIndex !== null) {
        const itemHeight = 80;
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
          setForm({ ...form, locations: newLocations });
        }
      }
      
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
          padding: spacing.base,
          paddingTop: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.gray[200],
          marginBottom: spacing.sm,
        }}>
          <View style={[commonStyles.row, { justifyContent: 'space-between' }]}>
            <Text style={[commonStyles.title, { color: colors.gray[900] }]}>
              {isEditing ? 'Edit Event' : 'Create New Event'}
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
                  setForm({ ...form, title: text });
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
                onPress={() => setForm({ ...form, type: 'one-time' })}
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
                onPress={() => setForm({ ...form, type: 'recurring' })}
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
                        onPress={() => setForm({ ...form, repeatFrequency: freq as any })}
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
                            setForm({
                              ...form,
                              repeatDays: form.repeatDays?.includes(day)
                                ? form.repeatDays.filter(d => d !== day)
                                : [...(form.repeatDays || []), day]
                            });
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
              onIncrease={() => setForm({
                ...form,
                capacity: Math.min(99, (form.capacity || 10) + 1)
              })}
              onDecrease={() => setForm({
                ...form,
                capacity: Math.max(1, (form.capacity || 10) - 1)
              })}
              onChange={(text) => {
                const num = parseInt(text);
                if (!isNaN(num) && num >= 1 && num <= 99) {
                  setForm({ ...form, capacity: num });
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
                onPress={() => setForm({ ...form, status: 'open' })}
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
                onPress={() => setForm({ ...form, status: 'verification_required' })}
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
                  setForm({ ...form, description: text });
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
            onPress={onSubmit}
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
                {isEditing ? 'Update Event' : 'Create Event'}
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
              setForm({ ...form, startDate: date });
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
              setForm({ ...form, endDate: date });
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
              setForm({
                ...form,
                [showTimePicker === 'start' ? 'startTime' : 'endTime']: timeString
              });
            }
          }}
        />
      )}
    </View>
  );
}; 