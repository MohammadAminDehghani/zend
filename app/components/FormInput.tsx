import React from 'react';
import { Text, TextInput, View, TextInputProps } from 'react-native';
import { colors, typography, spacing } from '../theme';

interface FormInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  hasSubmitted?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  error,
  onFocus,
  onBlur,
  isFocused,
  hasSubmitted,
  autoCapitalize,
  multiline,
  numberOfLines,
  ...props
}) => {
  const shouldShowError = (isFocused || hasSubmitted) && error;

  return (
    <View>
      <Text style={[typography.label, { marginBottom: spacing.xs, color: colors.gray[700] }]}>
        {label}{required && <Text style={{ color: colors.danger }}>*</Text>}
      </Text>
      <TextInput
        style={[
          {
            borderWidth: 1,
            borderColor: shouldShowError ? colors.danger : isFocused ? colors.primary : colors.gray[200],
            borderRadius: 8,
            padding: spacing.sm,
            fontSize: typography.fontSize.base,
            color: colors.gray[900],
            backgroundColor: colors.white,
          },
          multiline && {
            height: 100,
            textAlignVertical: 'top',
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.gray[400]}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onFocus={onFocus}
        onBlur={onBlur}
        {...props}
      />
      {shouldShowError && (
        <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>
          {error}
        </Text>
      )}
    </View>
  );
}; 