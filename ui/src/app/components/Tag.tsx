import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { colors, typography, spacing, commonStyles, borderRadius } from '../theme';

interface TagProps {
  label: string;
  isSelected: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
  marginRight?: number;
}

export default function Tag({ label, isSelected, onPress, disabled, style, marginRight = spacing.xs }: TagProps) {
  return (
    <TouchableOpacity
      style={[
        commonStyles.tag,
        {
          backgroundColor: isSelected ? colors.primary : colors.white,
          borderWidth: isSelected ? 0 : 1,
          borderStyle: 'dashed',
          borderColor: colors.primary,
          borderRadius: borderRadius.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          marginRight,
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
          fontSize: typography.fontSize.sm,
        }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
} 