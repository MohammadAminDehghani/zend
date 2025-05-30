import { StyleSheet } from 'react-native';

// Color palette
export const colors = {
  primary: '#038493',
  secondary: '#5856D6',
  success: '#4CAF50',
  danger: '#ff4444',
  warning: '#FF9500',
  info: '#5AC8FA',
  light: '#F2F2F7',
  dark: '#1C1C1E',
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    100: '#F2F2F7',
    200: '#E5E5EA',
    300: '#D1D1D6',
    400: '#C7C7CC',
    500: '#AEAEB2',
    600: '#8E8E93',
    700: '#636366',
    800: '#48484A',
    900: '#3A3A3C',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F2F2F7',
    tertiary: '#E5E5EA',
  },
  text: {
    primary: '#000000',
    secondary: '#666666',
    tertiary: '#999999',
    inverse: '#FFFFFF',
  },
  border: '#E5E5EA',
  shadow: {
    color: '#000000',
    opacity: 0.1,
    offset: { width: 0, height: 2 },
    radius: 4,
  },
};

// Typography
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

// Border radius
export const borderRadius = {
  sm: 4,
  base: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Common styles
export const commonStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.base,
  },
  section: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Text styles
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  text: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  textSecondary: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  textTertiary: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
  },

  // Input styles
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    padding: spacing.base,
    fontSize: typography.fontSize.base,
    backgroundColor: colors.background.primary,
    color: colors.text.primary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },

  // Button styles
  button: {
    padding: spacing.base,
    borderRadius: borderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  buttonSuccess: {
    backgroundColor: colors.success,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },

  // Card styles
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.base,
    padding: spacing.base,
    marginBottom: spacing.base,
    shadowColor: colors.shadow.color,
    shadowOffset: colors.shadow.offset,
    shadowOpacity: colors.shadow.opacity,
    shadowRadius: colors.shadow.radius,
    elevation: 3,
  },

  // Tag styles
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    margin: spacing.xs,
  },
  tagText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
  },

  // Image styles
  image: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.base,
  },
  imageContainer: {
    position: 'relative',
    width: '31%',
    aspectRatio: 1,
    marginBottom: spacing.base,
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
}); 