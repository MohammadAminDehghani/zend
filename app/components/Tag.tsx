import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { colors, typography, spacing, commonStyles } from '../theme';

interface TagProps {
  label: string;
  isSelected: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
}

export default function Tag({ label, isSelected, onPress, disabled, style }: TagProps) {
  return (
    <TouchableOpacity
      style={[
        commonStyles.tag,
        {
          backgroundColor: isSelected ? colors.primary : colors.white,
          borderWidth: isSelected ? 0 : 1,
          borderStyle: 'dashed',
          borderColor: colors.primary,
          borderRadius: spacing.xs,
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.sm,
        },
        disabled && commonStyles.buttonDisabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[
        commonStyles.tagText,
        { 
          color: isSelected ? colors.white : colors.gray[700],
          fontSize: typography.fontSize.base,
        }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
} 