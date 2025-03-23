import React from 'react';
import { Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { colors, typography, spacing } from '../theme';

interface DateTimePickerFieldProps {
  label: string;
  value: string | Date;
  onPress: () => void;
  required?: boolean;
  error?: string;
  style?: ViewStyle;
}

export const DateTimePickerField: React.FC<DateTimePickerFieldProps> = ({
  label,
  value,
  onPress,
  required,
  error,
  style,
}) => {
  return (
    <View style={style}>
      <Text style={[typography.label, { marginBottom: spacing.xs, color: colors.gray[700] }]}>
        {label}{required && <Text style={{ color: colors.danger }}>*</Text>}
      </Text>
      <TouchableOpacity 
        style={[
          {
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.gray[200],
            borderRadius: 8,
            padding: spacing.sm,
            backgroundColor: colors.white,
          }
        ]}
        onPress={onPress}
      >
        <Text style={[typography.body, { color: colors.gray[900] }]}>
          {value instanceof Date ? value.toLocaleDateString() : value}
        </Text>
      </TouchableOpacity>
      {error && (
        <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>
          {error}
        </Text>
      )}
    </View>
  );
}; 