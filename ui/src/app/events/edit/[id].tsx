import React from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { EventForm } from '../../components/EventForm';
import { useEventForm } from '../../../hooks/useEventForm';
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


    if (loading) {
        return (
            <View style={commonStyles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={commonStyles.loadingContainer}>
            <Stack.Screen
                options={{
                    title: 'Edit Event',
                    headerShown: true,
                    headerBackTitle: 'Back',
                    headerStyle: {
                        backgroundColor: colors.white,
                    }
                }}
            />
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
        </View>
    );
}