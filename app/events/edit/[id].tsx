import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { EventForm } from '../../components/EventForm';
import { useEventForm } from '../../hooks/useEventForm';
import { View, ActivityIndicator } from 'react-native';
import { colors, commonStyles } from '../../theme';

export default function EditEventScreen() {
  const { id } = useLocalSearchParams();
  const {
    formData,
    errors,
    loading,
    userLocation,
    locationPermissionStatus,
    handleSubmit,
    handleInputChange,
    handleDateChange,
    handleTimeChange,
    handleLocationChange,
    handleTypeChange,
    handleRecurringChange,
    handleTagToggle,
    handleCapacityChange,
    handleAccessControlChange,
  } = useEventForm(id as string);

  if (loading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <EventForm
      formData={formData}
      errors={errors}
      loading={loading}
      userLocation={userLocation}
      locationPermissionStatus={locationPermissionStatus}
      onSubmit={handleSubmit}
      onInputChange={handleInputChange}
      onDateChange={handleDateChange}
      onTimeChange={handleTimeChange}
      onLocationChange={handleLocationChange}
      onTypeChange={handleTypeChange}
      onRecurringChange={handleRecurringChange}
      onTagToggle={handleTagToggle}
      onCapacityChange={handleCapacityChange}
      onAccessControlChange={handleAccessControlChange}
      isEditing={true}
    />
  );
} 