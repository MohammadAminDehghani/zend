import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { API_URL } from '../config/api';
import { useAuth } from '../context/auth';
import * as Location from 'expo-location';

export interface EventLocation {
  name: string;
  latitude: number;
  longitude: number;
}

export interface EventForm {
  title: string;
  description: string;
  type: 'one-time' | 'recurring';
  locations: EventLocation[];
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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EventForm>({
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

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
    requestLocationPermission();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load event');
      }

      const data = await response.json();
      setFormData({
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(status as 'granted' | 'denied' | 'pending');
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.locations.length === 0) {
      newErrors.location = 'At least one location is required';
    }
    
    if (!formData.startDate) {
      newErrors.date = 'Start date is required';
    }
    
    if (!formData.startTime || !formData.endTime) {
      newErrors.time = 'Start and end times are required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const url = eventId ? `${API_URL}/api/events/${eventId}` : `${API_URL}/api/events`;
      const method = eventId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          creator: userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save event');
      }

      router.replace('/(tabs)/manage');
    } catch (error) {
      Alert.alert('Error', 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EventForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date: Date) => {
    setFormData(prev => ({ ...prev, startDate: date }));
  };

  const handleTimeChange = (time: Date) => {
    const timeString = time.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    setFormData(prev => ({ ...prev, startTime: timeString }));
  };

  const handleLocationChange = (locations: EventLocation[]) => {
    setFormData(prev => ({ ...prev, locations }));
  };

  const handleTypeChange = (type: 'one-time' | 'recurring') => {
    setFormData(prev => ({ ...prev, type }));
  };

  const handleRecurringChange = (frequency: 'daily' | 'weekly' | 'monthly', days: string[]) => {
    setFormData(prev => ({ ...prev, repeatFrequency: frequency, repeatDays: days }));
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleCapacityChange = (capacity: number) => {
    setFormData(prev => ({ ...prev, capacity }));
  };

  const handleAccessControlChange = (status: 'open' | 'verification_required') => {
    setFormData(prev => ({ ...prev, status }));
  };

  return {
    formData,
    errors,
    loading,
    userLocation,
    locationPermissionStatus,
    handleSubmit,
    handleInputChange,
    handleDateChange,
    handleTimeChange,
    handleLocationChange,
    handleTypeChange,
    handleRecurringChange,
    handleTagToggle,
    handleCapacityChange,
    handleAccessControlChange,
  };
}; 