import { colors } from './colors';

export const theme = {
  colors: {
    ...colors,
    gray: {
      100: '#f7fafc',
      200: '#edf2f7',
      300: '#e2e8f0',
      400: '#cbd5e0',
      600: '#718096',
      700: '#4a5568',
      900: '#1a202c',
    },
    white: '#ffffff',
    danger: '#e53e3e',
  },
  spacing: {
    xs: 4,
    sm: 8,
    base: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
  typography: {
    fontFamily: {
      primary: 'System',
      secondary: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
    },
  },
  commonStyles: {
    container: {
      flex: 1,
      padding: 16,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    subtitle: {
      fontSize: 20,
      fontWeight: '600',
    },
    text: {
      fontSize: 16,
    },
    textSecondary: {
      fontSize: 14,
      opacity: 0.7,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 8,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      borderRadius: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  },
} as const;

export type Theme = typeof theme;
export default theme; 