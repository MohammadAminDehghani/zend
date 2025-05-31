import { Platform } from 'react-native';

type Environment = 'local' | 'production';
type ApiConfig = {
  [key in Environment]: {
    android: string;
    ios: string;
    default: string;
  }
};

// API URLs for different environments
const apiConfig: ApiConfig = {
  // Local development
  local: {
    android: 'http://10.0.2.2:3000',  // Android emulator
    ios: 'http://localhost:3000',     // iOS simulator
    default: 'http://localhost:3000', // Fallback
  },
  // Production with public IP
  production: {
    android: 'http://99.79.59.84:3000',  // Replace with your actual public IP
    ios: 'http://99.79.59.84:3000',     // Replace with your actual public IP
    default: 'http://99.79.59.84:3000', // Replace with your actual public IP
  }
};

// Determine which environment to use
const ENV = (process.env.ENV || 'local') as Environment;
console.log('Current Environment:', ENV);
console.log('Platform:', Platform.OS);

// Select the appropriate API URL based on environment and platform
export const API_URL = Platform.select(apiConfig[ENV]) || apiConfig[ENV].default;
console.log('Selected API URL:', API_URL);

// Helper function to get full image URL
export const getImageUrl = (path: string | null) => {
  if (!path) return null;
  
  // Remove leading slash if it exists
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Ensure API_URL doesn't end with a slash
  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  
  const fullUrl = `${baseUrl}/${cleanPath}`;
  console.log('Generated image URL:', fullUrl);
  return fullUrl;
};

export default {
  API_URL,
}; 