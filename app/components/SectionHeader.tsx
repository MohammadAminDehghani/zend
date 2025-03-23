import React from 'react';
import { Text } from 'react-native';
import { colors, typography, spacing } from '../theme';

interface SectionHeaderProps {
  title: string;
  required?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, required }) => {
  return (
    <Text style={[typography.label, { marginBottom: spacing.base, color: colors.gray[700] }]}>
      {title}{required && <Text style={{ color: colors.danger }}>*</Text>}
    </Text>
  );
}; 