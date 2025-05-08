import React from 'react';
import { View, Text, TouchableOpacity, Animated, TextInput } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  currentLocation: Location | null;
  locationName: string;
  setLocationName: (name: string) => void;
  handleMapPress: (event: any) => void;
  addLocation: () => void;
  locations: Location[];
  removeLocation: (index: number) => void;
  draggingLocationIndex: number | null;
  panResponder: any;
  pan: Animated.ValueXY;
  handleLocationDragStart: (index: number) => void;
  locationPermissionStatus: 'granted' | 'denied' | 'pending';
  requestLocationPermission: () => void;
  userLocation: { latitude: number; longitude: number } | null;
  error?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  currentLocation,
  locationName,
  setLocationName,
  handleMapPress,
  addLocation,
  locations,
  removeLocation,
  draggingLocationIndex,
  panResponder,
  pan,
  handleLocationDragStart,
  locationPermissionStatus,
  requestLocationPermission,
  userLocation,
  error,
}) => {
  return (
    <View style={{ gap: spacing.sm }}>
      <View>
        <Text style={[typography.label, { marginBottom: spacing.xs, color: colors.gray[700] }]}>
          Location Name
        </Text>
        <TextInput
          style={[
            {
              borderWidth: 1,
              borderColor: error ? colors.danger : colors.gray[200],
              borderRadius: 8,
              padding: spacing.sm,
              fontSize: typography.fontSize.base,
              color: colors.gray[900],
              backgroundColor: colors.white,
            }
          ]}
          placeholder="Enter location name"
          value={locationName}
          onChangeText={setLocationName}
        />
      </View>

      <View style={{ height: 200, marginVertical: spacing.sm }}>
        {locationPermissionStatus === 'pending' ? (
          <View style={{ padding: spacing.lg, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[typography.body, { textAlign: 'center', marginBottom: spacing.base }]}>
              We need your location to show nearby places
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                padding: spacing.sm,
                borderRadius: 8,
              }}
              onPress={requestLocationPermission}
            >
              <Text style={[typography.body, { color: colors.white }]}>Grant Location Access</Text>
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
        style={{
          backgroundColor: colors.primary,
          padding: spacing.sm,
          borderRadius: 8,
          alignItems: 'center',
        }}
        onPress={addLocation}
        disabled={!currentLocation || !locationName}
      >
        <Text style={[typography.body, { color: colors.white }]}>Add Location</Text>
      </TouchableOpacity>

      {locations.length > 0 && (
        <View>
          <Text style={[typography.label, { marginBottom: spacing.base, color: colors.gray[700] }]}>
            Added Locations
          </Text>
          <Text style={[typography.caption, { fontStyle: 'italic', marginBottom: spacing.sm }]}>
            Hold and drag ≡ to reorder locations
          </Text>
          {locations.map((loc, index) => (
            <Animated.View
              key={index}
              style={[
                {
                  backgroundColor: colors.white,
                  borderRadius: 8,
                  padding: spacing.sm,
                  marginBottom: spacing.sm,
                  shadowColor: colors.shadow.color,
                  shadowOffset: colors.shadow.offset,
                  shadowOpacity: colors.shadow.opacity,
                  shadowRadius: colors.shadow.radius,
                  elevation: 3,
                },
                draggingLocationIndex === index && {
                  transform: [{ translateY: pan.y }],
                  shadowOpacity: colors.shadow.opacity * 2,
                  elevation: 8,
                }
              ]}
              {...(draggingLocationIndex === index ? panResponder.panHandlers : {})}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  onPressIn={() => handleLocationDragStart(index)}
                  style={{ marginRight: spacing.sm }}
                >
                  <Ionicons name="menu" size={24} color={colors.gray[600]} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={typography.body}>{loc.name}</Text>
                  <Text style={typography.caption}>
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
      {error && (
        <Text style={[typography.caption, { color: colors.danger }]}>
          {error}
        </Text>
      )}
    </View>
  );
}; 