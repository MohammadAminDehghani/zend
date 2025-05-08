import React from 'react';
import { Text, View } from 'react-native';
import { colors, typography, spacing } from '../../app/theme';

interface SectionHeaderProps {
  title: string;
  required?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, required }) => {
  return (
    <View style={{ marginBottom: spacing.base }}>
      <Text style={[typography.h2, { color: colors.gray[900] }]}>
        {title}{required && <Text style={{ color: colors.danger }}>*</Text>}
      </Text>
    </View>
  );
}; 