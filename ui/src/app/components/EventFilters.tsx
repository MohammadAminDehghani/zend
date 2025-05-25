import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, commonStyles } from '../theme';
import Tag from './Tag';
import DateTimePicker from '@react-native-community/datetimepicker';

interface EventFiltersProps {
  onApplyFilters: (filters: EventFilters) => void;
  onReset: () => void;
}

export interface EventFilters {
  status?: 'public' | 'private';
  type?: 'one-time' | 'recurring';
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  tags?: string[];
  capacity?: {
    min?: number;
    max?: number;
  };
  repeatFrequency?: 'daily' | 'weekly' | 'monthly';
}

const EventFilters: React.FC<EventFiltersProps> = ({ onApplyFilters, onReset }) => {
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({});
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

  const availableTags = ['art', 'sports', 'music', 'food', 'technology', 'education', 'business', 'social'];
  const statusOptions = ['public', 'private'];
  const typeOptions = ['one-time', 'recurring'];
  const frequencyOptions = ['daily', 'weekly', 'monthly'];

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags?.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...(prev.tags || []), tag]
    }));
  };

  const toggleStatus = (status: 'public' | 'private') => {
    setFilters(prev => ({
      ...prev,
      status: prev.status === status ? undefined : status
    }));
  };

  const toggleType = (type: 'one-time' | 'recurring') => {
    setFilters(prev => ({
      ...prev,
      type: prev.type === type ? undefined : type
    }));
  };

  const toggleFrequency = (frequency: 'daily' | 'weekly' | 'monthly') => {
    setFilters(prev => ({
      ...prev,
      repeatFrequency: prev.repeatFrequency === frequency ? undefined : frequency
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate && showDatePicker) {
      setFilters(prev => ({
        ...prev,
        dateRange: {
          ...prev.dateRange,
          [showDatePicker]: selectedDate
        }
      }));
    }
    setShowDatePicker(null);
  };

  const handleApply = () => {
    onApplyFilters(filters);
    setShowModal(false);
  };

  const handleReset = () => {
    setFilters({});
    onReset();
    setShowModal(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.type) count++;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    if (filters.tags?.length) count++;
    if (filters.capacity?.min || filters.capacity?.max) count++;
    if (filters.repeatFrequency) count++;
    return count;
  };

  return (
    <>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="filter" size={20} color={colors.primary} />
        <Text style={styles.filterButtonText}>Filters</Text>
        {getActiveFiltersCount() > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{getActiveFiltersCount()}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Events</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContent}>
              {/* Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Status</Text>
                <View style={styles.optionsContainer}>
                  {statusOptions.map(status => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.optionButton,
                        filters.status === status && styles.optionButtonActive
                      ]}
                      onPress={() => toggleStatus(status as 'public' | 'private')}
                    >
                      <Text style={[
                        styles.optionText,
                        filters.status === status && styles.optionTextActive
                      ]}>
                        {status === 'public' ? 'Open Access' : 'Verification Required'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Type</Text>
                <View style={styles.optionsContainer}>
                  {typeOptions.map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.optionButton,
                        filters.type === type && styles.optionButtonActive
                      ]}
                      onPress={() => toggleType(type as 'one-time' | 'recurring')}
                    >
                      <Text style={[
                        styles.optionText,
                        filters.type === type && styles.optionTextActive
                      ]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Date Range</Text>
                <View style={styles.dateContainer}>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker('start')}
                  >
                    <Text style={styles.dateButtonText}>
                      {filters.dateRange?.start
                        ? filters.dateRange.start.toLocaleDateString()
                        : 'Start Date'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker('end')}
                  >
                    <Text style={styles.dateButtonText}>
                      {filters.dateRange?.end
                        ? filters.dateRange.end.toLocaleDateString()
                        : 'End Date'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tags Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {availableTags.map(tag => (
                    <Tag
                      key={tag}
                      label={tag}
                      isSelected={filters.tags?.includes(tag)}
                      onPress={() => toggleTag(tag)}
                    />
                  ))}
                </View>
              </View>

              {/* Repeat Frequency Filter */}
              {filters.type === 'recurring' && (
                <View style={styles.filterSection}>
                  <Text style={styles.sectionTitle}>Repeat Frequency</Text>
                  <View style={styles.optionsContainer}>
                    {frequencyOptions.map(frequency => (
                      <TouchableOpacity
                        key={frequency}
                        style={[
                          styles.optionButton,
                          filters.repeatFrequency === frequency && styles.optionButtonActive
                        ]}
                        onPress={() => toggleFrequency(frequency as 'daily' | 'weekly' | 'monthly')}
                      >
                        <Text style={[
                          styles.optionText,
                          filters.repeatFrequency === frequency && styles.optionTextActive
                        ]}>
                          {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.footerButton, styles.resetButton]}
                onPress={handleReset}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerButton, styles.applyButton]}
                onPress={handleApply}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={showDatePicker === 'start'
              ? filters.dateRange?.start || new Date()
              : filters.dateRange?.end || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
  },
  filterButtonText: {
    marginLeft: spacing.xs,
    color: colors.primary,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: spacing.xs,
  },
  badgeText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.gray[900],
  },
  filterContent: {
    flex: 1,
    padding: spacing.lg,
  },
  filterSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.base,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  optionButtonActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.gray[700],
    fontWeight: '500',
  },
  optionTextActive: {
    color: colors.primary,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  dateButton: {
    flex: 1,
    padding: spacing.base,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[100],
  },
  dateButtonText: {
    color: colors.gray[700],
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: spacing.base,
  },
  footerButton: {
    flex: 1,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: colors.gray[100],
  },
  applyButton: {
    backgroundColor: colors.primary,
  },
  resetButtonText: {
    color: colors.gray[700],
    fontWeight: '600',
  },
  applyButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default EventFilters; 