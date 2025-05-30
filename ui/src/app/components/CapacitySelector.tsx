import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';

interface CapacitySelectorProps {
  capacity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onChange: (text: string) => void;
}

export const CapacitySelector: React.FC<CapacitySelectorProps> = ({
  capacity,
  onIncrease,
  onDecrease,
  onChange,
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <TouchableOpacity
        testID="capacity-decrease"
        style={{
          backgroundColor: colors.background.primary,
          padding: spacing.sm,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
        }}
        onPress={onDecrease}
      >
        <Ionicons name="remove" size={24} color={colors.gray[900]} />
      </TouchableOpacity>
      
      <TextInput
        style={{
          width: 60,
          textAlign: 'center',
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          padding: spacing.sm,
          fontSize: typography.fontSize.base,
        }}
        value={capacity.toString()}
        onChangeText={onChange}
        keyboardType="numeric"
      />
      
      <TouchableOpacity
        testID="capacity-increase"
        style={{
          backgroundColor: colors.background.primary,
          padding: spacing.sm,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
        }}
        onPress={onIncrease}
      >
        <Ionicons name="add" size={24} color={colors.gray[900]} />
      </TouchableOpacity>
    </View>
  );
}; 