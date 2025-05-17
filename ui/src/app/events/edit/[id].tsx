import React from 'react';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { EventFormEdit } from '../components/EventFormEdit';
import { useEventForm } from '../../../hooks/useEventForm';
import { View, ActivityIndicator, SafeAreaView } from 'react-native';
import { colors, commonStyles } from '../../theme';

export default function EditEventScreen() {
    const { id } = useLocalSearchParams();
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
    } = useEventForm(id as string);

    const handleCancel = () => {
        router.back();
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
                <View style={[commonStyles.loadingContainer, { flex: 1 }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
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
            <View style={{ flex: 1, backgroundColor: colors.white }}>
                <EventFormEdit
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
                    onCancel={handleCancel}
                />
            </View>
        </SafeAreaView>
    );
}