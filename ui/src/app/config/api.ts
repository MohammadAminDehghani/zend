import { Platform } from 'react-native';

// For Android emulator, localhost refers to the emulator's own loopback interface
// For iOS simulator, localhost works fine
const apiConfig = {
  android: process.env.API_URL_ANDROID,
  ios: process.env.API_URL_IOS,
  default: process.env.API_URL_DEFAULT,
};

export const API_URL = Platform.select(apiConfig);

// Helper function to get full image URL
export const getImageUrl = (path: string | null) => {
  if (!path) return null;
  return `${API_URL}${path}`;
};

export default {
  API_URL,
}; 