require('@testing-library/jest-native/extend-expect');

// Mock expo modules core
jest.mock('expo-modules-core', () => ({
  EventEmitter: class {
    constructor() {}
    addListener() {}
    removeListeners() {}
  },
  requireOptionalNativeModule: () => null
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    manifest: {
      extra: {
        apiUrl: 'http://test-api-url'
      }
    }
  },
  getAppConfig: () => ({})
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' })
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ''
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    useLocalSearchParams: jest.fn(() => ({})),
    Stack: {
      Screen: jest.fn()
    }
  }
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn()
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn()
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView'
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient'
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => ({
  MapView: 'MapView',
  Marker: 'Marker'
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn()
}));

// Mock API calls
jest.mock('./app/config/api', () => ({
  API_URL: 'http://test-api-url',
  getImageUrl: jest.fn()
}));

// Mock react-native components and APIs
jest.mock('react-native', () => {
  class AnimatedValue {
    constructor(value) {
      this._value = value;
    }
    setValue(value) {
      this._value = value;
    }
    setOffset(offset) {
      this._offset = offset;
    }
  }

  class AnimatedValueXY {
    constructor() {
      this.x = new AnimatedValue(0);
      this.y = new AnimatedValue(0);
    }
    getLayout() {
      return {
        left: this.x,
        top: this.y,
      };
    }
  }

  return {
    Platform: {
      OS: 'ios',
      select: (obj) => obj.ios
    },
    StyleSheet: {
      create: (styles) => styles,
      compose: (style1, style2) => [style1, style2],
      flatten: (style) => style
    },
    Dimensions: {
      get: () => ({
        width: 375,
        height: 812
      })
    },
    Animated: {
      Value: AnimatedValue,
      ValueXY: AnimatedValueXY,
      createAnimatedComponent: (component) => component,
      timing: () => ({
        start: (callback) => callback && callback(),
      }),
      spring: () => ({
        start: (callback) => callback && callback(),
      }),
      event: () => jest.fn(),
    },
    PanResponder: {
      create: (config) => ({
        panHandlers: {},
      }),
    },
    View: 'View',
    Text: 'Text',
    TouchableOpacity: 'TouchableOpacity',
    TextInput: 'TextInput',
    ScrollView: 'ScrollView',
    ActivityIndicator: 'ActivityIndicator',
    Image: 'Image',
    Alert: {
      alert: jest.fn()
    },
    Settings: {
      get: jest.fn(),
      set: jest.fn(),
      watchKeys: jest.fn(),
      clearWatch: jest.fn()
    },
    NativeModules: {
      SettingsManager: {
        settings: {},
        getValue: jest.fn(),
        setValue: jest.fn()
      }
    },
    VirtualizedList: 'VirtualizedList',
    FlatList: 'FlatList'
  };
}); 