import { Platform } from 'react-native';

// For Android emulator, localhost refers to the emulator's own loopback interface
// For iOS simulator, localhost works fine
export const API_URL = Platform.select({
  android: 'http://10.0.2.2:3000', // Android emulator maps 10.0.2.2 to host machine's localhost
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

// Helper function to get full image URL
export const getImageUrl = (path: string | null) => {
  if (!path) return null;
  return `${API_URL}${path}`;
};

export default {
  API_URL,
}; 