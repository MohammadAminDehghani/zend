const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add custom resolver
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
  '@/components': path.resolve(__dirname, 'src/components'),
  '@/services': path.resolve(__dirname, 'src/services'),
  '@/assets': path.resolve(__dirname, 'src/assets'),
  '@/constants': path.resolve(__dirname, 'src/constants'),
  '@/hooks': path.resolve(__dirname, 'src/hooks'),
  '@/contexts': path.resolve(__dirname, 'src/contexts'),
};

module.exports = config; 