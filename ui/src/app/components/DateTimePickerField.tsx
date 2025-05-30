import React from 'react';
import { Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { colors, typography, spacing } from '../theme';

interface DateTimePickerFieldProps {
  label: string;
  value: Date | string;
  onPress: () => void;
  required?: boolean;
  error?: string;
  style?: ViewStyle;
  onFocus?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  hasSubmitted?: boolean;
  minimumDate?: Date;
}

export const DateTimePickerField: React.FC<DateTimePickerFieldProps> = ({
  label,
  value,
  onPress,
  required,
  error,
  style,
  onFocus,
  onBlur,
  isFocused,
  hasSubmitted,
  minimumDate
}) => {
  const shouldShowError = (isFocused || hasSubmitted) && error;

  return (
    <View style={style}>
      <Text style={[typography.label, { marginBottom: spacing.xs, color: colors.gray[700] }]}>
        {label}{required && <Text style={{ color: colors.danger }}>*</Text>}
      </Text>
      <TouchableOpacity 
        style={[
          {
            borderWidth: 1,
            borderColor: shouldShowError ? colors.danger : isFocused ? colors.primary : colors.gray[200],
            borderRadius: 8,
            padding: spacing.sm,
            backgroundColor: colors.white,
          },
          style
        ]}
        onPress={onPress}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        <Text style={[typography.body, { color: colors.gray[900] }]}>
          {value instanceof Date ? value.toLocaleDateString() : value}
        </Text>
      </TouchableOpacity>
      {shouldShowError && (
        <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>
          {error}
        </Text>
      )}
    </View>
  );
}; 