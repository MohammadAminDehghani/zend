import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { colors, typography, spacing } from '../../theme';

interface AccessControlSelectorProps {
  status: 'open' | 'verification_required';
  onStatusChange: (status: 'open' | 'verification_required') => void;
}

export const AccessControlSelector: React.FC<AccessControlSelectorProps> = ({
  status,
  onStatusChange,
}) => {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: status === 'open' ? colors.primary : colors.background.primary,
          padding: spacing.sm,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
        }}
        onPress={() => onStatusChange('open')}
      >
        <Text style={[
          typography.body,
          { color: status === 'open' ? colors.white : colors.gray[900] }
        ]}>
          Open Access
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: status === 'verification_required' ? colors.primary : colors.background.primary,
          padding: spacing.sm,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
        }}
        onPress={() => onStatusChange('verification_required')}
      >
        <Text style={[
          typography.body,
          { color: status === 'verification_required' ? colors.white : colors.gray[900] }
        ]}>
          Verification Required
        </Text>
      </TouchableOpacity>
    </View>
  );
}; 