import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, ScrollView, Platform, PanResponder, Animated, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, typography, spacing, commonStyles } from '../../theme';
import Tag from '../../components/Tag';
import { SectionHeader } from '../../components/SectionHeader';
import { FormInput } from '../../components/FormInput';
import { LocationPicker } from '../../components/LocationPicker';
import { DateTimePickerField } from '../../components/DateTimePickerField';
import { CapacitySelector } from '../../components/CapacitySelector';
import { EventForm as EventFormType, EventLocation } from '../../../hooks/useEventForm';
import * as Location from 'expo-location';
import CustomAlert from '../../components/CustomAlert';

// Common tags for events
const COMMON_TAGS = [
  'Work', 'Personal', 'Meeting', 'Social', 'Family',
  'Health', 'Education', 'Sports', 'Entertainment', 'Shopping',
  'Travel', 'Food', 'Hobby', 'Exercise', 'Relaxation',
  'Business', 'Party', 'Appointment', 'Task', 'Other'
];

interface EventFormProps {
  formData: EventFormType;
  errors: {
    title?: string;
    description?: string;
    location?: string;
    date?: string;
    time?: string;
  };
  loading: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  locationPermissionStatus: 'granted' | 'denied' | 'pending';
  onSubmit: () => Promise<void>;
  onInputChange: (field: keyof EventFormType, value: string) => void;
  onDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onTimeChange: (time: Date) => void;
  onLocationChange: (locations: EventLocation[]) => void;
  onTypeChange: (type: 'one-time' | 'recurring') => void;
  onRecurringChange: (frequency: 'daily' | 'weekly' | 'monthly', days: string[]) => void;
  onTagToggle: (tag: string) => void;
  onCapacityChange: (capacity: number) => void;
  onAccessControlChange: (access: 'public' | 'private') => void;
  handleFocus: (field: keyof EventFormType) => void;
  handleBlur: (field: keyof EventFormType) => void;
  focusedFields: Set<keyof EventFormType>;
  hasSubmitted: boolean;
  isEditing?: boolean;
  showAlert: boolean;
  alertConfig: {
    title: string;
    message: string;
    buttons: { text: string; onPress: () => void; style?: 'default' | 'destructive' }[]
  } | null;
  setShowAlert: React.Dispatch<React.SetStateAction<boolean>>;
  setFormData: React.Dispatch<React.SetStateAction<EventFormType>>;
  setErrors: React.Dispatch<React.SetStateAction<{
    title?: string;
    description?: string;
    location?: string;
    date?: string;
    time?: string;
  }>>;
  setFocusedFields: React.Dispatch<React.SetStateAction<Set<keyof EventFormType>>>;
  setHasSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
  onStatusChange: (status: 'public' | 'private') => void;
  onCancel: () => void;
}

export const EventFormCreate: React.FC<EventFormProps> = ({
  formData,
  errors,
  loading,
  userLocation,
  locationPermissionStatus,
  onSubmit,
  onInputChange,
  onDateChange,
  onEndDateChange,
  onTimeChange,
  onLocationChange,
  onTypeChange,
  onRecurringChange,
  onTagToggle,
  onCapacityChange,
  onAccessControlChange,
  handleFocus,
  handleBlur,
  focusedFields,
  hasSubmitted,
  isEditing = false,
  showAlert,
  alertConfig,
  setShowAlert,
  setFormData,
  setErrors,
  setFocusedFields,
  setHasSubmitted,
  onStatusChange,
  onCancel
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleRecurringFrequencyChange = (frequency: 'daily' | 'weekly' | 'monthly') => {
    onRecurringChange(frequency, formData.repeatDays || []);
  };

  const handleRecurringDaysChange = (days: string[]) => {
    onRecurringChange(formData.repeatFrequency || 'daily', days);
  };

  const toggleTag = (tag: string) => {
    onTagToggle(tag);
  };

  const handleDateChange = (date: Date) => {
    if (showEndDatePicker) {
      onEndDateChange(date);
    } else {
      onDateChange(date);
    }
    setShowDatePicker(false);
    setShowEndDatePicker(false);
  };

  if (loading) {
    return (
      <View style={[commonStyles.loadingContainer, { flex: 1 }]}>
        <ActivityIndicator testID="loading-indicator" size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView 
        ref={scrollViewRef} 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        <View style={{ padding: spacing.sm }}>
          {/* Header Section */}
          <View style={{
            padding: spacing.xs,
            borderBottomWidth: 1,
            borderBottomColor: colors.gray[200],
            marginBottom: spacing.sm,
          }}>
            <View style={[commonStyles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
              <Text style={[commonStyles.title, { color: colors.gray[900] }]}>
                {isEditing ? 'Edit Event' : 'Create New Event'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setFormData({
                    title: '',
                    description: '',
                    type: 'one-time',
                    locations: [],
                    startDate: new Date(),
                    startTime: '09:00',
                    endTime: '17:00',
                    tags: [],
                    capacity: 4,
                    access: 'public',
                    status: 'public'
                  });
                  setErrors({});
                  setFocusedFields(new Set());
                  setHasSubmitted(false);
                }}
                style={{
                  padding: spacing.xs,
                  borderRadius: spacing.xs,
                  backgroundColor: colors.gray[100],
                }}
              >
                <Text style={[commonStyles.text, {
                  color: colors.gray[600],
                  fontSize: typography.fontSize.sm,
                }]}>
                  Clear Form
                </Text>
              </TouchableOpacity>
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
                  value={formData.title}
                  onChangeText={(text) => onInputChange('title', text)}
                  error={errors.title}
                  placeholder="Enter event title"
                  autoCapitalize="words"
                  onFocus={() => handleFocus('title')}
                  onBlur={() => handleBlur('title')}
                  isFocused={focusedFields.has('title')}
                  hasSubmitted={hasSubmitted}
                />
              </View>
            </View>

            {/* Date & Time Section */}
            <View style={{ marginBottom: spacing.lg }}>
              <SectionHeader title="Date & Time" />
              <View style={{ gap: spacing.sm }}>
                <DateTimePickerField
                  label="Start Date"
                  value={formData.startDate}
                  onPress={() => setShowDatePicker(true)}
                  error={errors.date}
                  onFocus={() => handleFocus('startDate')}
                  onBlur={() => handleBlur('startDate')}
                  isFocused={focusedFields.has('startDate')}
                  hasSubmitted={hasSubmitted}
                  minimumDate={isEditing ? undefined : new Date()}
                />

                <DateTimePickerField
                  label="End Date"
                  value={formData.endDate || formData.startDate}
                  onPress={() => setShowEndDatePicker(true)}
                  error={errors.date}
                  onFocus={() => handleFocus('endDate')}
                  onBlur={() => handleBlur('endDate')}
                  isFocused={focusedFields.has('endDate')}
                  hasSubmitted={hasSubmitted}
                  minimumDate={formData.startDate}
                />

                <View style={[commonStyles.row, { gap: spacing.sm }]}>
                  <DateTimePickerField
                    label="Start Time"
                    value={formData.startTime}
                    onPress={() => setShowTimePicker('start')}
                    error={errors.time}
                    style={{ flex: 1 }}
                    onFocus={() => handleFocus('startTime')}
                    onBlur={() => handleBlur('startTime')}
                    isFocused={focusedFields.has('startTime')}
                    hasSubmitted={hasSubmitted}
                  />
                  <DateTimePickerField
                    label="End Time"
                    value={formData.endTime}
                    onPress={() => setShowTimePicker('end')}
                    error={errors.time}
                    style={{ flex: 1 }}
                    onFocus={() => handleFocus('endTime')}
                    onBlur={() => handleBlur('endTime')}
                    isFocused={focusedFields.has('endTime')}
                    hasSubmitted={hasSubmitted}
                  />
                </View>
              </View>
            </View>

            {/* Location Section */}
            <View style={{ marginBottom: spacing.lg }}>
              <SectionHeader title="Location" />
              <LocationPicker
                locations={formData.locations}
                onLocationChange={onLocationChange}
                userLocation={userLocation}
                locationPermissionStatus={locationPermissionStatus}
                onRequestPermission={async () => {
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({});
                    onLocationChange([{
                      name: 'Current Location',
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude
                    }]);
                  }
                }}
                onFocus={() => handleFocus('locations')}
                onBlur={() => handleBlur('locations')}
                isFocused={focusedFields.has('locations')}
                hasSubmitted={hasSubmitted}
                error={errors.location}
              />
            </View>

            {/* Event Type */}
            <View style={{ marginBottom: spacing.lg }}>
              <SectionHeader title="Event Type" />
              <View style={[commonStyles.row, { gap: spacing.xs }]}>
                <TouchableOpacity
                  style={[
                    commonStyles.button,
                    {
                      flex: 1,
                      backgroundColor: formData.type === 'one-time' ? colors.primary : colors.white,
                      borderWidth: 1,
                      borderColor: colors.primary,
                      paddingVertical: spacing.xs,
                      paddingHorizontal: spacing.sm,
                    }
                  ]}
                  onPress={() => onTypeChange('one-time')}
                >
                  <Text style={[
                    commonStyles.text,
                    {
                      color: formData.type === 'one-time' ? colors.white : colors.primary,
                      fontSize: typography.fontSize.sm,
                    }
                  ]}>
                    One-time
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    commonStyles.button,
                    {
                      flex: 1,
                      backgroundColor: formData.type === 'recurring' ? colors.primary : colors.white,
                      borderWidth: 1,
                      borderColor: colors.primary,
                      paddingVertical: spacing.xs,
                      paddingHorizontal: spacing.sm,
                    }
                  ]}
                  onPress={() => onTypeChange('recurring')}
                >
                  <Text style={[
                    commonStyles.text,
                    {
                      color: formData.type === 'recurring' ? colors.white : colors.primary,
                      fontSize: typography.fontSize.sm,
                    }
                  ]}>
                    Recurring
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recurring Options Section */}
            {formData.type === 'recurring' && (
              <View style={{ marginBottom: spacing.lg }}>
                <SectionHeader title="Recurring Schedule" />
                <View style={{ gap: spacing.sm }}>
                  <View style={[commonStyles.row, { gap: spacing.xs }]}>
                    <TouchableOpacity
                      style={[
                        commonStyles.button,
                        {
                          flex: 1,
                          backgroundColor: formData.repeatFrequency === 'daily' ? colors.primary : colors.white,
                          borderWidth: 1,
                          borderColor: colors.primary,
                          paddingVertical: spacing.xs,
                          paddingHorizontal: spacing.sm,
                        }
                      ]}
                      onPress={() => onRecurringChange('daily', formData.repeatDays || [])}
                    >
                      <Text style={[
                        commonStyles.text,
                        {
                          color: formData.repeatFrequency === 'daily' ? colors.white : colors.primary,
                          fontSize: typography.fontSize.sm,
                        }
                      ]}>
                        Daily
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        commonStyles.button,
                        {
                          flex: 1,
                          backgroundColor: formData.repeatFrequency === 'weekly' ? colors.primary : colors.white,
                          borderWidth: 1,
                          borderColor: colors.primary,
                          paddingVertical: spacing.xs,
                          paddingHorizontal: spacing.sm,
                        }
                      ]}
                      onPress={() => onRecurringChange('weekly', formData.repeatDays || [])}
                    >
                      <Text style={[
                        commonStyles.text,
                        {
                          color: formData.repeatFrequency === 'weekly' ? colors.white : colors.primary,
                          fontSize: typography.fontSize.sm,
                        }
                      ]}>
                        Weekly
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        commonStyles.button,
                        {
                          flex: 1,
                          backgroundColor: formData.repeatFrequency === 'monthly' ? colors.primary : colors.white,
                          borderWidth: 1,
                          borderColor: colors.primary,
                          paddingVertical: spacing.xs,
                          paddingHorizontal: spacing.sm,
                        }
                      ]}
                      onPress={() => onRecurringChange('monthly', formData.repeatDays || [])}
                    >
                      <Text style={[
                        commonStyles.text,
                        {
                          color: formData.repeatFrequency === 'monthly' ? colors.white : colors.primary,
                          fontSize: typography.fontSize.sm,
                        }
                      ]}>
                        Monthly
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {formData.repeatFrequency === 'weekly' && (
                    <View style={{ gap: spacing.xs }}>
                      <Text style={[commonStyles.text, { color: colors.gray[600] }]}>Select Days</Text>
                      <View style={[commonStyles.row, { flexWrap: 'wrap', gap: spacing.xs }]}>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                          <TouchableOpacity
                            key={day}
                            style={[
                              commonStyles.button,
                              {
                                backgroundColor: formData.repeatDays?.includes(day) ? colors.primary : colors.white,
                                borderWidth: 1,
                                borderColor: colors.primary,
                                paddingVertical: spacing.xs,
                                paddingHorizontal: spacing.sm,
                              }
                            ]}
                            onPress={() => {
                              const currentDays = formData.repeatDays || [];
                              const newDays = currentDays.includes(day)
                                ? currentDays.filter(d => d !== day)
                                : [...currentDays, day];
                              onRecurringChange('weekly', newDays);
                            }}
                          >
                            <Text style={[
                              commonStyles.text,
                              {
                                color: formData.repeatDays?.includes(day) ? colors.white : colors.primary,
                                fontSize: typography.fontSize.sm,
                              }
                            ]}>
                              {day.slice(0, 3)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Access Control Section */}
            <View style={{ marginBottom: spacing.lg }}>
              <SectionHeader title="Access Control" />
              <View style={{ gap: spacing.xs }}>
                <View style={[commonStyles.row, { gap: spacing.xs }]}>
                  <TouchableOpacity
                    style={[
                      commonStyles.button,
                      {
                        flex: 1,
                        backgroundColor: formData.access === 'public' ? colors.primary : colors.white,
                        borderWidth: 1,
                        borderColor: colors.primary,
                        paddingVertical: spacing.xs,
                        paddingHorizontal: spacing.sm,
                      }
                    ]}
                    onPress={() => {
                      onAccessControlChange('public');
                      onStatusChange('public');
                    }}
                  >
                    <Text style={[
                      commonStyles.text,
                      {
                        color: formData.access === 'public' ? colors.white : colors.primary,
                        fontSize: typography.fontSize.sm,
                      }
                    ]}>
                      Public
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      commonStyles.button,
                      {
                        flex: 1,
                        backgroundColor: formData.access === 'private' ? colors.primary : colors.white,
                        borderWidth: 1,
                        borderColor: colors.primary,
                        paddingVertical: spacing.xs,
                        paddingHorizontal: spacing.sm,
                      }
                    ]}
                    onPress={() => {
                      onAccessControlChange('private');
                      onStatusChange('private');
                    }}
                  >
                    <Text style={[
                      commonStyles.text,
                      {
                        color: formData.access === 'private' ? colors.white : colors.primary,
                        fontSize: typography.fontSize.sm,
                      }
                    ]}>
                      Private
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[commonStyles.text, {
                  color: colors.gray[600],
                  fontSize: typography.fontSize.sm,
                  marginTop: spacing.xs
                }]}>
                  {formData.access === 'public'
                    ? 'Anyone can view and join this event'
                    : 'Participants need your approval to join this event'}
                </Text>
              </View>
            </View>

            {/* Capacity Section */}
            <View style={{ marginBottom: spacing.lg }}>
              <SectionHeader title="Event Capacity" />
              <CapacitySelector
                capacity={formData.capacity}
                onIncrease={() => onCapacityChange(Math.min(99, (formData.capacity || 10) + 1))}
                onDecrease={() => onCapacityChange(Math.max(1, (formData.capacity || 10) - 1))}
                onChange={(text) => {
                  const num = parseInt(text);
                  if (!isNaN(num) && num >= 1 && num <= 99) {
                    onCapacityChange(num);
                  }
                }}
              />
            </View>

            {/* Description Section */}
            <View style={{ marginBottom: spacing.lg }}>
              <SectionHeader title="Description" />
              <View>
                <TextInput
                  style={[
                    commonStyles.input,
                    commonStyles.textArea,
                    {
                      borderColor: (focusedFields.has('description') || hasSubmitted) && errors.description
                        ? colors.danger
                        : focusedFields.has('description')
                          ? colors.primary
                          : colors.gray[200]
                    }
                  ]}
                  placeholder="Tell us about your event..."
                  value={formData.description}
                  onChangeText={(text) => onInputChange('description', text)}
                  multiline
                  numberOfLines={4}
                  onFocus={() => handleFocus('description')}
                  onBlur={() => handleBlur('description')}
                />
                <View style={[commonStyles.row, { justifyContent: 'space-between', marginTop: spacing.xs }]}>
                  {(focusedFields.has('description') || hasSubmitted) && errors.description && (
                    <Text style={[commonStyles.textSecondary, { color: colors.danger }]}>
                      {errors.description}
                    </Text>
                  )}
                  <Text style={[commonStyles.textSecondary, { textAlign: 'right' }]}>
                    {formData.description.length}/500
                  </Text>
                </View>
              </View>
            </View>

            {/* Tags Section */}
            <View style={{ marginBottom: spacing.lg }}>
              <SectionHeader title="Event Tags" />
              <View style={[commonStyles.row, { flexWrap: 'wrap', gap: spacing.sm }]}>
                {COMMON_TAGS.map((tag) => (
                  <Tag
                    key={tag}
                    label={tag}
                    isSelected={formData.tags.includes(tag)}
                    onPress={() => toggleTag(tag)}
                  />
                ))}
              </View>
            </View>

            {/* Submit and Cancel Buttons */}
            <View style={[commonStyles.row, { gap: spacing.sm, marginBottom: spacing.lg }]}>
              <TouchableOpacity
                style={[
                  commonStyles.button,
                  {
                    flex: 1,
                    backgroundColor: colors.gray[200],
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.base,
                  }
                ]}
                onPress={onCancel}
              >
                <Text style={[
                  commonStyles.text,
                  {
                    color: colors.gray[700],
                    fontSize: typography.fontSize.base,
                    fontWeight: '500',
                    textAlign: 'center',
                  }
                ]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  commonStyles.button,
                  {
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.base,
                  }
                ]}
                onPress={onSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator testID="loading-indicator" color={colors.white} size="small" />
                ) : (
                  <Text style={[
                    commonStyles.text,
                    {
                      color: colors.white,
                      fontSize: typography.fontSize.base,
                      fontWeight: '500',
                      textAlign: 'center',
                    }
                  ]}>
                    {isEditing ? 'Update Event' : 'Create Event'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={isEditing ? undefined : new Date()}
          onChange={(event: any, date?: Date) => {
            setShowDatePicker(false);
            if (date) {
              onDateChange(date);
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={formData.endDate || formData.startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={formData.startDate}
          onChange={(event: any, date?: Date) => {
            setShowEndDatePicker(false);
            if (date) {
              onEndDateChange(date);
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={new Date(`2000-01-01T${showTimePicker === 'start' ? formData.startTime : formData.endTime}`)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: any, date?: Date) => {
            if (Platform.OS === 'android') {
              setShowTimePicker(null);
            }
            if (date) {
              const timeString = date.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
              });
              if (showTimePicker === 'start') {
                onInputChange('startTime', timeString);
              } else {
                onInputChange('endTime', timeString);
              }
              if (Platform.OS === 'ios') {
                setShowTimePicker(null);
              }
            }
          }}
        />
      )}

      {/* Custom Alert - Modal component */}
      {alertConfig && (
        <CustomAlert
          visible={showAlert}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
        />
      )}
    </View>
  );
}; 