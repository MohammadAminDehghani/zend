import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { API_URL } from '../app/config/api';
import { useAuth } from '../app/context/auth';
import * as Location from 'expo-location';

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
  const [isLoading, setIsLoading] = useState(false);
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
        const response = await fetch(`${API_URL}/api/events/${eventId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch event');
        }

        const event = await response.json();
        setForm({
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
        });
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

      Alert.alert('Success', `Event ${eventId ? 'updated' : 'created'} successfully`, [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/manage'),
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
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