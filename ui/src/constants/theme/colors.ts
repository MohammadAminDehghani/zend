export const colors = {
  primary: {
    main: '#0a7ea4',
    light: '#0d9bc4',
    dark: '#086b8c',
  },
  secondary: {
    main: '#687076',
    light: '#9BA1A6',
    dark: '#4a4f52',
  },
  text: {
    primary: '#11181C',
    secondary: '#687076',
    tertiary: '#9BA1A6',
  },
  background: {
    default: '#fff',
    paper: '#f5f5f5',
  },
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
  },
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
  },
  border: '#e0e0e0',
  shadow: 'rgba(0, 0, 0, 0.1)',
} as const;

export type ColorTheme = typeof colors; 