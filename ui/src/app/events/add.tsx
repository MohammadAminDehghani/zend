import React from 'react';
import { EventFormCreate } from './components/EventFormCreate';
import { useEventForm } from '../../hooks/useEventForm';
import { View, Text } from 'react-native';
import { commonStyles, colors } from '../theme';
import { useRouter } from 'expo-router';

export default function AddEventScreen() {
  const router = useRouter();
  const {
    formData,
    errors,
    loading,
    userLocation,
    locationPermissionStatus,
    handleSubmit,
    handleInputChange,
    handleDateChange,
    handleEndDateChange,
    handleTimeChange,
    handleLocationChange,
    handleTypeChange,
    handleRecurringChange,
    handleTagToggle,
    handleCapacityChange,
    handleAccessControlChange,
    handleFocus,
    handleBlur,
    focusedFields,
    hasSubmitted,
    showAlert,
    alertConfig,
    setShowAlert,
    setFormData,
    setErrors,
    setFocusedFields,
    setHasSubmitted,
    handleStatusChange
  } = useEventForm();

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={[commonStyles.loadingContainer, { backgroundColor: colors.white }]} testID="add-event-screen">

      <EventFormCreate
        formData={formData}
        errors={errors}
        loading={loading}
        userLocation={userLocation}
        locationPermissionStatus={locationPermissionStatus}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
        onDateChange={handleDateChange}
        onEndDateChange={handleEndDateChange}
        onTimeChange={handleTimeChange}
        onLocationChange={handleLocationChange}
        onTypeChange={handleTypeChange}
        onRecurringChange={handleRecurringChange}
        onTagToggle={handleTagToggle}
        onCapacityChange={handleCapacityChange}
        onAccessControlChange={handleAccessControlChange}
        handleFocus={handleFocus}
        handleBlur={handleBlur}
        focusedFields={focusedFields}
        hasSubmitted={hasSubmitted}
        showAlert={showAlert}
        alertConfig={alertConfig}
        setShowAlert={setShowAlert}
        setFormData={setFormData}
        setErrors={setErrors}
        setFocusedFields={setFocusedFields}
        setHasSubmitted={setHasSubmitted}
        onStatusChange={handleStatusChange}
        onCancel={handleCancel}
      />
    </View>
  );
} 