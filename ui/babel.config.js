module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      ['@babel/plugin-transform-runtime', {
        helpers: true,
        regenerator: true,
        useESModules: true
      }],
      ['module-resolver', {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@/components': './src/components',
          '@/services': './src/services',
          '@/assets': './src/assets',
          '@/constants': './src/constants',
          '@/hooks': './src/hooks',
          '@/contexts': './src/contexts'
        }
      }]
    ]
  };
}; 