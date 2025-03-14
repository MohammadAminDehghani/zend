import React, { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ScrollView, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { API_URL } from '../config/api';
import { useAuth } from '../context/auth';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';

// Common tags for events
const COMMON_TAGS = [
  'Work', 'Personal', 'Meeting', 'Social', 'Family',
  'Health', 'Education', 'Sports', 'Entertainment', 'Shopping',
  'Travel', 'Food', 'Hobby', 'Exercise', 'Relaxation',
  'Business', 'Party', 'Appointment', 'Task', 'Other'
];

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

interface EventForm {
  title: string;
  description: string;
  type: 'one-time' | 'recurring';
  locations: Location[];
  startDate: Date;
  endDate?: Date;
  startTime: string;
  endTime: string;
  repeatFrequency?: 'daily' | 'weekly' | 'monthly';
  repeatDays?: string[];
  tags: string[];
}

export default function AddScreen() {
  const [activeTab, setActiveTab] = useState<'one-time' | 'recurring'>('one-time');
  const [form, setForm] = useState<EventForm>({
    title: '',
    description: '',
    type: 'one-time',
    locations: [],
    startDate: new Date(),
    startTime: '09:00',
    endTime: '17:00',
    tags: []
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState('');
  const { token, userId } = useAuth();

  const handleMapPress = useCallback((event: MapPressEvent) => {
    const { coordinate } = event.nativeEvent;
    setCurrentLocation({
      name: '',
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    });
  }, []);

  const addLocation = () => {
    if (currentLocation && locationName) {
      setForm(prev => ({
        ...prev,
        locations: [...prev.locations, { ...currentLocation, name: locationName }]
      }));
      setCurrentLocation(null);
      setLocationName('');
    }
  };

  const removeLocation = (index: number) => {
    setForm(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    try {
      const eventData = {
        ...form,
        creator: userId,
        type: activeTab
      };

      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create event');
      }

      // Reset form
      setForm({
        title: '',
        description: '',
        type: 'one-time',
        locations: [],
        startDate: new Date(),
        startTime: '09:00',
        endTime: '17:00',
        tags: []
      });
      setCurrentLocation(null);
      setLocationName('');
      
      Alert.alert('Success', 'Event created successfully', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/events'),
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      Alert.alert('Error', errorMessage);
    }
  };

  const toggleTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const renderLocationInput = () => (
    <View style={styles.locationSection}>
      <Text style={styles.sectionTitle}>Add Location</Text>
      <TextInput
        style={styles.input}
        placeholder="Location Name"
        value={locationName}
        onChangeText={setLocationName}
      />
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          onPress={handleMapPress}
        >
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
            />
          )}
        </MapView>
      </View>
      <TouchableOpacity 
        style={[styles.button, styles.addButton]} 
        onPress={addLocation}
        disabled={!currentLocation || !locationName}
      >
        <Text style={styles.buttonText}>Add Location</Text>
      </TouchableOpacity>

      {form.locations.length > 0 && (
        <View style={styles.locationsList}>
          <Text style={styles.sectionTitle}>Added Locations</Text>
          {form.locations.map((loc, index) => (
            <View key={index} style={styles.locationItem}>
              <Text>{loc.name}</Text>
              <TouchableOpacity onPress={() => removeLocation(index)}>
                <Text style={styles.removeButton}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderRecurringOptions = () => (
    <View style={styles.recurringSection}>
      <View style={styles.frequencyContainer}>
        <Text>Repeat Frequency:</Text>
        <View style={styles.frequencyButtons}>
          {['daily', 'weekly', 'monthly'].map((freq) => (
            <TouchableOpacity
              key={freq}
              style={[
                styles.frequencyButton,
                form.repeatFrequency === freq && styles.frequencyButtonActive
              ]}
              onPress={() => setForm(prev => ({ ...prev, repeatFrequency: freq as any }))}
            >
              <Text style={[
                styles.frequencyButtonText,
                form.repeatFrequency === freq && styles.frequencyButtonTextActive
              ]}>
                {freq.charAt(0).toUpperCase() + freq.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {form.repeatFrequency === 'weekly' && (
        <View style={styles.daysContainer}>
          <Text>Repeat Days:</Text>
          <View style={styles.daysButtons}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  form.repeatDays?.includes(day) && styles.dayButtonActive
                ]}
                onPress={() => {
                  setForm(prev => ({
                    ...prev,
                    repeatDays: prev.repeatDays?.includes(day)
                      ? prev.repeatDays.filter(d => d !== day)
                      : [...(prev.repeatDays || []), day]
                  }));
                }}
              >
                <Text style={[
                  styles.dayButtonText,
                  form.repeatDays?.includes(day) && styles.dayButtonTextActive
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity 
        style={styles.dateButton}
        onPress={() => setShowEndDatePicker(true)}
      >
        <Text>End Date: {form.endDate?.toLocaleDateString() || 'Select End Date'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTags = () => (
    <View style={styles.tagsSection}>
      <Text style={styles.sectionTitle}>Tags</Text>
      <View style={styles.tagsContainer}>
        {COMMON_TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.tagButton,
              form.tags.includes(tag) && styles.tagButtonActive
            ]}
            onPress={() => toggleTag(tag)}
          >
            <Text style={[
              styles.tagButtonText,
              form.tags.includes(tag) && styles.tagButtonTextActive
            ]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'one-time' && styles.activeTab]}
          onPress={() => setActiveTab('one-time')}
        >
          <Text style={[styles.tabText, activeTab === 'one-time' && styles.activeTabText]}>
            One-time Event
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recurring' && styles.activeTab]}
          onPress={() => setActiveTab('recurring')}
        >
          <Text style={[styles.tabText, activeTab === 'recurring' && styles.activeTabText]}>
            Recurring Event
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Event Title"
        value={form.title}
        onChangeText={(text) => setForm(prev => ({ ...prev, title: text }))}
        autoCapitalize="words"
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Event Description"
        value={form.description}
        onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
        multiline
        numberOfLines={4}
      />

      <View style={styles.dateTimeSection}>
        <Text style={styles.sectionTitle}>Date & Time</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>Start Date: {form.startDate.toLocaleDateString()}</Text>
        </TouchableOpacity>

        <View style={styles.timeContainer}>
          <TouchableOpacity 
            style={styles.timeButton}
            onPress={() => setShowTimePicker('start')}
          >
            <Text>Start Time: {form.startTime}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.timeButton}
            onPress={() => setShowTimePicker('end')}
          >
            <Text>End Time: {form.endTime}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderLocationInput()}

      <View style={styles.eventTypeSection}>
        <Text style={styles.sectionTitle}>Event Type</Text>
        <View style={styles.eventTypeButtons}>
          <TouchableOpacity
            style={[
              styles.eventTypeButton,
              form.type === 'one-time' && styles.eventTypeButtonActive
            ]}
            onPress={() => setForm(prev => ({ ...prev, type: 'one-time' }))}
          >
            <Text style={[
              styles.eventTypeButtonText,
              form.type === 'one-time' && styles.eventTypeButtonTextActive
            ]}>
              One-time Event
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.eventTypeButton,
              form.type === 'recurring' && styles.eventTypeButtonActive
            ]}
            onPress={() => setForm(prev => ({ ...prev, type: 'recurring' }))}
          >
            <Text style={[
              styles.eventTypeButtonText,
              form.type === 'recurring' && styles.eventTypeButtonTextActive
            ]}>
              Recurring Event
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {form.type === 'recurring' && renderRecurringOptions()}

      {renderTags()}

      <TouchableOpacity 
        style={[styles.button, styles.submitButton]} 
        onPress={handleSubmit}
        disabled={!form.title || !form.description || form.locations.length === 0}
      >
        <Text style={styles.buttonText}>Create Event</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={form.startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: any, date?: Date) => {
            setShowDatePicker(false);
            if (date) {
              setForm(prev => ({ ...prev, startDate: date }));
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={form.endDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: any, date?: Date) => {
            setShowEndDatePicker(false);
            if (date) {
              setForm(prev => ({ ...prev, endDate: date }));
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={new Date(`2000-01-01T${showTimePicker === 'start' ? form.startTime : form.endTime}`)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: any, date?: Date) => {
            setShowTimePicker(null);
            if (date) {
              const timeString = date.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
              });
              setForm(prev => ({
                ...prev,
                [showTimePicker === 'start' ? 'startTime' : 'endTime']: timeString
              }));
            }
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dateTimeSection: {
    marginBottom: 20,
  },
  dateButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  locationSection: {
    marginBottom: 20,
  },
  mapContainer: {
    height: 200,
    marginVertical: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  locationsList: {
    marginTop: 10,
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 5,
  },
  removeButton: {
    color: '#ff4444',
  },
  recurringSection: {
    marginBottom: 20,
  },
  frequencyContainer: {
    marginBottom: 15,
  },
  frequencyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  frequencyButton: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  frequencyButtonText: {
    color: '#666',
  },
  frequencyButtonTextActive: {
    color: '#fff',
  },
  daysContainer: {
    marginBottom: 15,
  },
  daysButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  dayButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    margin: 5,
    minWidth: 40,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayButtonText: {
    color: '#666',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  button: {
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  eventTypeSection: {
    marginBottom: 20,
  },
  eventTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventTypeButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  eventTypeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  eventTypeButtonText: {
    color: '#666',
  },
  eventTypeButtonTextActive: {
    color: '#fff',
  },
  tagsSection: {
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  tagButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    margin: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  tagButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tagButtonText: {
    color: '#666',
  },
  tagButtonTextActive: {
    color: '#fff',
  },
}); 