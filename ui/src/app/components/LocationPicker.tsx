import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Animated, PanResponder } from 'react-native';
import { Marker, Region } from 'react-native-maps';
import { colors, typography, spacing, commonStyles } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { EventLocation } from '../../hooks/useEventForm';
import PlatformMap from '../../components/PlatformMap';

interface LocationPickerProps {
  locations: EventLocation[];
  onLocationChange: (locations: EventLocation[]) => void;
  userLocation: { latitude: number; longitude: number } | null;
  locationPermissionStatus: 'granted' | 'denied' | 'pending';
  onRequestPermission: () => Promise<void>;
  onFocus?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  hasSubmitted?: boolean;
  error?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  locations,
  onLocationChange,
  userLocation,
  locationPermissionStatus,
  onRequestPermission,
  onFocus,
  onBlur,
  isFocused,
  hasSubmitted,
  error
}) => {
  const [currentLocation, setCurrentLocation] = useState<EventLocation | null>(null);
  const [locationName, setLocationName] = useState('');
  const [draggingLocationIndex, setDraggingLocationIndex] = useState<number | null>(null);
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gestureState) => {
        const currentX = pan.x as any;
        const currentY = pan.y as any;
        pan.setOffset({
          x: currentX._value || 0,
          y: currentY._value || 0
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        if (draggingLocationIndex !== null) {
          const newLocations = [...locations];
          const draggedLocation = newLocations[draggingLocationIndex];
          newLocations.splice(draggingLocationIndex, 1);
          const newIndex = Math.min(
            Math.max(0, Math.floor((gestureState.moveY - 100) / 60)),
            newLocations.length
          );
          newLocations.splice(newIndex, 0, draggedLocation);
          onLocationChange(newLocations);
        }
        setDraggingLocationIndex(null);
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false
        }).start();
      }
    })
  ).current;

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setCurrentLocation({
      name: '',
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    });
  };

  const addLocation = () => {
    if (currentLocation && locationName.trim()) {
      onLocationChange([...locations, { ...currentLocation, name: locationName.trim() }]);
      setCurrentLocation(null);
      setLocationName('');
    }
  };

  const removeLocation = (index: number) => {
    const newLocations = locations.filter((_, i) => i !== index);
    onLocationChange(newLocations);
  };

  const handleLocationDragStart = (index: number) => {
    setDraggingLocationIndex(index);
  };

  const defaultRegion: Region = {
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const initialRegion = userLocation ? {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  } : defaultRegion;

  return (
    <View style={styles.container}>
      <View>
        <Text style={[commonStyles.label, { marginBottom: spacing.xs, color: colors.gray[700] }]}>
          Location Name
        </Text>
        <TextInput
          style={[
            {
              borderWidth: 1,
              borderColor: (isFocused || hasSubmitted) && error ? colors.danger : colors.gray[200],
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
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>

      <View style={styles.mapContainer}>
        {locationPermissionStatus === 'pending' ? (
          <View style={styles.permissionContainer}>
            <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: spacing.base }]}>
              We need your location to show nearby places
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={onRequestPermission}
            >
              <Text style={[commonStyles.text, { color: colors.white }]}>Grant Location Access</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <PlatformMap
            style={styles.map}
            initialRegion={initialRegion}
            onPress={handleMapPress}
          >
            {locations.map((location, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude
                }}
                title={location.name}
              />
            ))}
            {currentLocation && (
              <Marker
                coordinate={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude
                }}
                pinColor={colors.primary}
              />
            )}
          </PlatformMap>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.addButton, !currentLocation && styles.addButtonDisabled]}
        onPress={addLocation}
        disabled={!currentLocation || !locationName.trim()}
      >
        <Text style={[commonStyles.text, { color: colors.white }]}>Add Location</Text>
      </TouchableOpacity>

      {locations.length > 0 && (
        <View>
          <Text style={[commonStyles.label, { marginBottom: spacing.base, color: colors.gray[700] }]}>
            Added Locations
          </Text>
          <Text style={[commonStyles.textSecondary, { fontStyle: 'italic', marginBottom: spacing.sm }]}>
            Hold and drag ≡ to reorder locations
          </Text>
          {locations.map((location, index) => (
            <Animated.View
              key={index}
              style={[
                styles.locationItem,
                draggingLocationIndex === index && {
                  transform: [{ translateY: pan.y }],
                  shadowOpacity: colors.shadow.opacity * 2,
                  elevation: 8,
                }
              ]}
              {...(draggingLocationIndex === index ? panResponder.panHandlers : {})}
            >
              <View style={styles.locationContent}>
                <TouchableOpacity
                  onPressIn={() => handleLocationDragStart(index)}
                  style={styles.dragHandle}
                >
                  <Ionicons name="menu" size={24} color={colors.gray[600]} />
                </TouchableOpacity>
                <View style={styles.locationInfo}>
                  <Text style={commonStyles.text}>{location.name}</Text>
                  <Text style={commonStyles.textSecondary}>
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => removeLocation(index)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close-circle" size={24} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))}
        </View>
      )}

      {(isFocused || hasSubmitted) && error && (
        <Text style={[commonStyles.textSecondary, { color: colors.danger }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  mapContainer: {
    height: 200,
    marginVertical: spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  permissionContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: colors.gray[100],
  },
  permissionButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: 8,
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  locationItem: {
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
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragHandle: {
    marginRight: spacing.sm,
  },
  locationInfo: {
    flex: 1,
  },
  removeButton: {
    padding: spacing.xs,
  },
}); 