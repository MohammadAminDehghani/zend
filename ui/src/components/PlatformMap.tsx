import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

interface PlatformMapProps {
  style?: any;
  initialRegion: Region;
  children?: React.ReactNode;
  onPress?: (event: any) => void;
}

// Web-specific map component
const WebMap: React.FC<PlatformMapProps> = ({ initialRegion, onPress }) => {
  const { latitude, longitude } = initialRegion;
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyC-R-c3fY3bT-u5rcYp6VWf-5s3t6TAua8&q=${latitude},${longitude}&zoom=15`;

  return (
    <div 
      style={{ width: '100%', height: '100%' }}
      onClick={(e) => {
        if (onPress) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          onPress({
            nativeEvent: {
              coordinate: {
                latitude: initialRegion.latitude + (y / rect.height - 0.5) * initialRegion.latitudeDelta,
                longitude: initialRegion.longitude + (x / rect.width - 0.5) * initialRegion.longitudeDelta
              }
            }
          });
        }
      }}
    >
      <iframe
        src={mapUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
};

// Native map component
const NativeMap: React.FC<PlatformMapProps> = (props) => {
  return <MapView {...props} />;
};

// Export the appropriate component based on platform
const PlatformMap: React.FC<PlatformMapProps> = (props) => {
  return Platform.OS === 'web' ? <WebMap {...props} /> : <NativeMap {...props} />;
};

export default PlatformMap; 