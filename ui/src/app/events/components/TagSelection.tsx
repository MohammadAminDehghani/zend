import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { colors, typography, spacing } from '../../theme';

interface TagSelectionProps {
  tags: string[];
  selectedTags: string[];
  onTagPress: (tag: string) => void;
}

export const TagSelection: React.FC<TagSelectionProps> = ({ tags, selectedTags, onTagPress }) => {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
      {tags.map((tag) => (
        <TouchableOpacity
          key={tag}
          style={{
            backgroundColor: selectedTags.includes(tag) ? colors.primary : colors.background.primary,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          onPress={() => onTagPress(tag)}
        >
          <Text style={[
            typography.body,
            { color: selectedTags.includes(tag) ? colors.white : colors.gray[900] }
          ]}>
            {tag}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}; 