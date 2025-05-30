import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';

interface EventLocation {
  name: string;
  latitude: number;
  longitude: number;
}

interface PlatformMapProps {
  style?: any;
  initialRegion: Region;
  children?: React.ReactNode;
  onPress?: (event: any) => void;
  eventLocation?: EventLocation;
}

// Web-specific map component
const WebMap: React.FC<PlatformMapProps> = ({ eventLocation, ...props }) => {
  return (
    <MapView
      {...props}
      provider={PROVIDER_GOOGLE}
      showsUserLocation
      showsMyLocationButton
    >
      {eventLocation && (
        <Marker
          coordinate={{
            latitude: eventLocation.latitude,
            longitude: eventLocation.longitude
          }}
          title={eventLocation.name}
          description={`${eventLocation.latitude.toFixed(6)}, ${eventLocation.longitude.toFixed(6)}`}
          pinColor="red"
        />
      )}
      {props.children}
    </MapView>
  );
};

// Native map component
const NativeMap: React.FC<PlatformMapProps> = ({ eventLocation, ...props }) => {
  return (
    <MapView
      {...props}
      provider={PROVIDER_GOOGLE}
      showsUserLocation
      showsMyLocationButton
    >
      {eventLocation && (
        <Marker
          coordinate={{
            latitude: eventLocation.latitude,
            longitude: eventLocation.longitude
          }}
          title={eventLocation.name}
          description={`${eventLocation.latitude.toFixed(6)}, ${eventLocation.longitude.toFixed(6)}`}
          pinColor="red"
        />
      )}
      {props.children}
    </MapView>
  );
};

// Export the appropriate component based on platform
const PlatformMap: React.FC<PlatformMapProps> = (props) => {
  return Platform.OS === 'web' ? <WebMap {...props} /> : <NativeMap {...props} />;
};

export default PlatformMap; 