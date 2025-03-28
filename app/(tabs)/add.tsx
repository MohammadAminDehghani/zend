import React from 'react';
import { EventForm } from '../components/EventForm';
import { useEventForm } from '../hooks/useEventForm';
import { View } from 'react-native';
import { commonStyles } from '../theme';

export default function AddEventScreen() {
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

  return (
    <View style={commonStyles.container} testID="add-event-screen">
      <EventForm
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
      />
    </View>
  );
} 