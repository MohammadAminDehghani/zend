import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { colors, typography, spacing } from '../theme';

interface TagSelectionProps {
  tags: string[];
  selectedTags: string[];
  onTagPress: (tag: string) => void;
}

export const TagSelection: React.FC<TagSelectionProps> = ({ tags, selectedTags, onTagPress }) => {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs / 2 }}>
      {tags.map((tag) => (
        <TouchableOpacity
          key={tag}
          style={{
            backgroundColor: selectedTags.includes(tag) ? colors.primary : colors.white,
            borderWidth: 1,
            borderColor: selectedTags.includes(tag) ? colors.primary : colors.gray[200],
            paddingVertical: spacing.xs / 2,
            paddingHorizontal: spacing.sm / 2,
            borderRadius: 10,
          }}
          onPress={() => onTagPress(tag)}
        >
          <Text style={[
            typography.body,
            { 
              color: selectedTags.includes(tag) ? colors.white : colors.gray[700],
              fontSize: typography.fontSize.xs,
            }
          ]}>
            {tag}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}; 