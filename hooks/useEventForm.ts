import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { API_URL } from '../app/config/api';
import { useAuth } from '../app/context/auth';
import * as Location from 'expo-location';
import { useEventNotifications } from './useEventNotifications';
import { useNotificationHook } from './useNotificationHook';

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

export interface EventForm {
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
  capacity: number;
  status: 'open' | 'verification_required';
}

export const useEventForm = (eventId?: string) => {
  const { token, userId } = useAuth();
  const { notifyEventEdit } = useEventNotifications();
  const { showImmediateNotification } = useNotificationHook();
  const [isLoading, setIsLoading] = useState(false);
  const [originalEvent, setOriginalEvent] = useState<EventForm | null>(null);
  const [form, setForm] = useState<EventForm>({
    title: '',
    description: '',
    type: 'one-time',
    locations: [],
    startDate: new Date(),
    startTime: '09:00',
    endTime: '17:00',
    tags: [],
    capacity: 10,
    status: 'open'
  });
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    location?: string;
    date?: string;
    time?: string;
  }>({});
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'granted' | 'denied' | 'pending'>('pending');

  // Load event data if editing
  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) return;

      try {
        console.log('Loading event data for ID:', eventId);
        const response = await fetch(`${API_URL}/api/events/${eventId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch event');
        }

        const event = await response.json();
        console.log('Received event data:', event);

        const eventForm = {
          title: event.title || '',
          description: event.description || '',
          type: event.type || 'one-time',
          locations: event.locations || [],
          startDate: event.startDate ? new Date(event.startDate) : new Date(),
          endDate: event.endDate ? new Date(event.endDate) : undefined,
          startTime: event.startTime || '09:00',
          endTime: event.endTime || '17:00',
          repeatFrequency: event.repeatFrequency,
          repeatDays: event.repeatDays || [],
          tags: event.tags || [],
          capacity: typeof event.capacity === 'number' ? event.capacity : 10,
          status: event.status || 'open'
        };
        
        console.log('Processed event form data:', eventForm);
        setForm(eventForm);
        setOriginalEvent(eventForm);
        console.log('Original event set:', eventForm);
      } catch (error) {
        console.error('Error loading event:', error);
        Alert.alert('Error', 'Failed to load event details');
      }
    };

    loadEvent();
  }, [eventId, token]);

  // Request location permission
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(status === 'granted' ? 'granted' : 'denied');
      
      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        } catch (error) {
          console.error('Error getting location:', error);
          Alert.alert(
            'Location Error',
            'Could not get your current location. Please try again or select manually.'
          );
        }
      }
    })();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermissionStatus(status === 'granted' ? 'granted' : 'denied');
    
    if (status === 'granted') {
      try {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      } catch (error) {
        Alert.alert(
          'Location Error',
          'Could not get your current location. Please try again or select manually.'
        );
      }
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!form.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!form.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (form.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    if (form.locations.length === 0) {
      newErrors.location = 'At least one location is required';
    }
    
    if (!form.startDate) {
      newErrors.date = 'Start date is required';
    }
    
    if (!form.startTime || !form.endTime) {
      newErrors.time = 'Start and end times are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const detectChanges = (oldData: EventForm, newData: EventForm) => {
    console.log('Detecting changes between:', { 
      oldData: JSON.stringify(oldData, null, 2),
      newData: JSON.stringify(newData, null, 2)
    });
    const changes = [];
    
    // Compare title
    console.log('Comparing title:', {
      old: oldData.title,
      new: newData.title,
      isDifferent: oldData.title !== newData.title
    });
    if (oldData.title !== newData.title) {
      changes.push({
        field: 'TITLE',
        oldValue: oldData.title,
        newValue: newData.title
      });
    }
    
    // Compare description
    console.log('Comparing description:', {
      old: oldData.description,
      new: newData.description,
      isDifferent: oldData.description !== newData.description
    });
    if (oldData.description !== newData.description) {
      changes.push({
        field: 'DESCRIPTION',
        oldValue: oldData.description,
        newValue: newData.description
      });
    }
    
    // Compare startDate
    console.log('Comparing startDate:', {
      old: oldData.startDate.toISOString(),
      new: newData.startDate.toISOString(),
      oldTime: oldData.startDate.getTime(),
      newTime: newData.startDate.getTime(),
      isDifferent: oldData.startDate.getTime() !== newData.startDate.getTime()
    });
    if (oldData.startDate.getTime() !== newData.startDate.getTime()) {
      changes.push({
        field: 'START_DATE',
        oldValue: oldData.startDate.toISOString(),
        newValue: newData.startDate.toISOString()
      });
    }
    
    // Compare endDate
    console.log('Comparing endDate:', {
      old: oldData.endDate?.toISOString(),
      new: newData.endDate?.toISOString(),
      oldTime: oldData.endDate?.getTime(),
      newTime: newData.endDate?.getTime(),
      isDifferent: oldData.endDate?.getTime() !== newData.endDate?.getTime()
    });
    if (oldData.endDate?.getTime() !== newData.endDate?.getTime()) {
      changes.push({
        field: 'END_DATE',
        oldValue: oldData.endDate?.toISOString() || 'Not set',
        newValue: newData.endDate?.toISOString() || 'Not set'
      });
    }
    
    // Compare startTime
    console.log('Comparing startTime:', {
      old: oldData.startTime,
      new: newData.startTime,
      isDifferent: oldData.startTime !== newData.startTime
    });
    if (oldData.startTime !== newData.startTime) {
      changes.push({
        field: 'START_TIME',
        oldValue: oldData.startTime,
        newValue: newData.startTime
      });
    }
    
    // Compare endTime
    console.log('Comparing endTime:', {
      old: oldData.endTime,
      new: newData.endTime,
      isDifferent: oldData.endTime !== newData.endTime
    });
    if (oldData.endTime !== newData.endTime) {
      changes.push({
        field: 'END_TIME',
        oldValue: oldData.endTime,
        newValue: newData.endTime
      });
    }
    
    // Compare capacity
    console.log('Comparing capacity:', {
      old: oldData.capacity,
      new: newData.capacity,
      isDifferent: oldData.capacity !== newData.capacity
    });
    if (oldData.capacity !== newData.capacity) {
      changes.push({
        field: 'CAPACITY',
        oldValue: oldData.capacity.toString(),
        newValue: newData.capacity.toString()
      });
    }
    
    // Compare status
    console.log('Comparing status:', {
      old: oldData.status,
      new: newData.status,
      isDifferent: oldData.status !== newData.status
    });
    if (oldData.status !== newData.status) {
      changes.push({
        field: 'STATUS',
        oldValue: oldData.status,
        newValue: newData.status
      });
    }

    console.log('Final detected changes:', changes);
    return changes;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      const eventData = {
        ...form,
        creator: userId,
        type: form.type
      };

      const url = eventId 
        ? `${API_URL}/api/events/${eventId}`
        : `${API_URL}/api/events`;

      const method = eventId ? 'PUT' : 'POST';

      console.log('Submitting event update:', { url, method, eventData });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${eventId ? 'update' : 'create'} event`);
      }

      // If editing, send a notification
      if (eventId) {
        console.log('Event updated successfully, sending notification...');
        try {
          // First send a test notification to verify the system works
          await showImmediateNotification(
            'Event Update Test',
            'This is a test notification from event update',
            { eventId }
          );
          console.log('Test notification sent successfully');

          // If we have original event data, check for changes
          if (originalEvent) {
            console.log('Checking for changes between:', {
              original: originalEvent,
              updated: form
            });
            
            const changes = detectChanges(originalEvent, form);
            console.log('Detected changes:', changes);
            
            if (changes.length > 0) {
              const changeMessage = changes.map(change => 
                `${change.field}: ${change.oldValue} → ${change.newValue}`
              ).join(', ');
              
              await showImmediateNotification(
                `Event Updated: ${form.title}`,
                `Changes made: ${changeMessage}`,
                { eventId, changes }
              );
              console.log('Change notification sent successfully');
            } else {
              console.log('No changes detected, skipping change notification');
            }
          } else {
            console.log('No original event data available for comparison');
          }
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
        }
      }

      Alert.alert('Success', `Event ${eventId ? 'updated' : 'created'} successfully`, [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/manage'),
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    setForm,
    errors,
    setErrors,
    isLoading,
    userLocation,
    locationPermissionStatus,
    requestLocationPermission,
    handleSubmit
  };
}; 