import React from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { EventForm } from '../../components/EventForm';
import { useEventForm } from '../../hooks/useEventForm';
import { View, ActivityIndicator, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, commonStyles } from '../../theme';
import { useNotificationHook } from '../../hooks/useNotificationHook';

export default function EditEventScreen() {
  const { id } = useLocalSearchParams();
  const { testNotification } = useNotificationHook();
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
  } = useEventForm(id as string);

  const handleTestNotification = async () => {
    try {
      await testNotification();
      console.log('Test notification sent');
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  if (loading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Edit Event',
          headerShown: true,
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: colors.white,
          },
          headerTintColor: colors.primary,
        }} 
      />
      <TouchableOpacity 
        style={styles.testButton}
        onPress={handleTestNotification}
      >
        <Text style={styles.testButtonText}>Send Test Notification</Text>
      </TouchableOpacity>
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
        isEditing={true}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}

const styles = StyleSheet.create({
  testButton: {
    backgroundColor: colors.primary,
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
}); 