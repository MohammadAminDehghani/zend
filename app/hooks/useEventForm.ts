import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { API_URL } from '../config/api';
import { useAuth } from '../context/auth';
import * as Location from 'expo-location';
import CustomAlert from '../components/CustomAlert';

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
  access: 'public' | 'private';
  status: 'public' | 'private';
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
    capacity: 4,
    access: 'public',
    status: 'public'
  });
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    location?: string;
    date?: string;
    time?: string;
    tags?: string;
  }>({});
  const [focusedFields, setFocusedFields] = useState<Set<keyof EventForm>>(new Set());
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    buttons: { text: string; onPress: () => void }[];
  } | null>(null);

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
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status || 'public',
        access: data.status || 'public'
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

  const validateField = (field: keyof EventForm, value: any): string | undefined => {
    switch (field) {
      case 'title':
        if (!value?.trim()) return 'Title is required';
        if (value.length < 3) return 'Title must be at least 3 characters';
        if (value.length > 100) return 'Title must be less than 100 characters';
        break;
      case 'description':
        if (!value?.trim()) return 'Description is required';
        if (value.length > 500) return 'Description must be less than 500 characters';
        break;
      case 'locations':
        if (!value?.length) return 'At least one location is required';
        for (const location of value) {
          if (!location.name?.trim()) return 'Location name is required';
          if (location.name.length < 3) return 'Location name must be at least 3 characters';
          if (location.name.length > 30) return 'Location name must be less than 30 characters';
        }
        break;
      case 'tags':
        if (!value?.length) return 'At least one tag is required';
        if (value.length > 5) return 'Maximum 5 tags allowed';
        break;
      case 'startDate':
        if (!value) return 'Start date is required';
        if (value < new Date()) return 'Start date cannot be in the past';
        break;
      case 'startTime':
      case 'endTime':
        if (!value) return `${field === 'startTime' ? 'Start' : 'End'} time is required`;
        break;
      case 'status':
        if (!value) return 'Status is required';
        if (!['public', 'private'].includes(value)) return 'Status must be either public or private';
        break;
    }
    return undefined;
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    // Validate all fields
    Object.keys(formData).forEach((field) => {
      const error = validateField(field as keyof EventForm, formData[field as keyof EventForm]);
      if (error) {
        newErrors[field as keyof typeof errors] = error;
      }
    });

    // Additional validation for time comparison
    if (formData.startTime && formData.endTime) {
      const startTime = new Date(`2000-01-01T${formData.startTime}`);
      const endTime = new Date(`2000-01-01T${formData.endTime}`);
      if (endTime <= startTime) {
        newErrors.time = 'End time must be after start time';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof EventForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate field immediately if it's focused or form has been submitted
    if (focusedFields.has(field) || hasSubmitted) {
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
  };

  const handleSubmit = async () => {
    setHasSubmitted(true);
    const newErrors: typeof errors = {};
    
    // Validate all fields
    Object.keys(formData).forEach((field) => {
      const error = validateField(field as keyof EventForm, formData[field as keyof EventForm]);
      if (error) {
        newErrors[field as keyof typeof errors] = error;
      }
    });

    // Additional validation for time comparison
    if (formData.startTime && formData.endTime) {
      const startTime = new Date(`2000-01-01T${formData.startTime}`);
      const endTime = new Date(`2000-01-01T${formData.endTime}`);
      if (endTime <= startTime) {
        newErrors.time = 'End time must be after start time';
      }
    }

    // Validate locations
    if (!formData.locations || formData.locations.length === 0) {
      newErrors.location = 'At least one location is required';
    }

    // Validate tags
    if (!formData.tags || formData.tags.length === 0) {
      newErrors.tags = 'At least one tag is required';
    } else if (formData.tags.length > 5) {
      newErrors.tags = 'Maximum 5 tags allowed';
    }
    
    setErrors(newErrors);

    // If there are errors, show an alert
    if (Object.keys(newErrors).length > 0) {
      const errorMessages = Object.entries(newErrors)
        .map(([field, error]) => {
          const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
          return `${fieldName}: ${error}`;
        })
        .join('\n\n');

      setAlertConfig({
        title: 'Missing Required Information',
        message: `Please fix the following issues:\n\n${errorMessages}`,
        buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
      });
      setShowAlert(true);
      return;
    }

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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save event');
      }

      router.replace('/(tabs)/manage');
    } catch (error: unknown) {
      setAlertConfig({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to save event',
        buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
      });
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = (field: string) => {
    setFocusedFields(prev => new Set(prev).add(field as keyof EventForm));
  };

  const handleBlur = (field: string) => {
    setFocusedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(field as keyof EventForm);
      return newSet;
    });
  };

  const handleDateChange = (date: Date) => {
    setFormData(prev => ({ ...prev, startDate: date }));
    if (focusedFields.has('startDate') || hasSubmitted) {
      const error = validateField('startDate', date);
      setErrors(prev => ({
        ...prev,
        startDate: error
      }));
    }
  };

  const handleEndDateChange = (date: Date) => {
    setFormData(prev => ({ ...prev, endDate: date }));
    if (focusedFields.has('endDate') || hasSubmitted) {
      const error = validateField('endDate', date);
      setErrors(prev => ({
        ...prev,
        endDate: error
      }));
    }
  };

  const handleTimeChange = (time: Date) => {
    const timeString = time.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    setFormData(prev => ({ ...prev, startTime: timeString }));
    if (focusedFields.has('startTime') || hasSubmitted) {
      const error = validateField('startTime', timeString);
      setErrors(prev => ({
        ...prev,
        startTime: error
      }));
    }
  };

  const handleLocationChange = (locations: EventLocation[]) => {
    setFormData(prev => ({ ...prev, locations }));
    if (focusedFields.has('locations') || hasSubmitted) {
      const error = validateField('locations', locations);
      setErrors(prev => ({
        ...prev,
        location: error
      }));
    }
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

  const handleAccessControlChange = (access: 'public' | 'private') => {
    setFormData(prev => ({ ...prev, access }));
  };

  const handleStatusChange = (status: 'public' | 'private') => {
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
    handleEndDateChange,
    handleTimeChange,
    handleLocationChange,
    handleTypeChange,
    handleRecurringChange,
    handleTagToggle,
    handleCapacityChange,
    handleAccessControlChange,
    handleStatusChange,
    handleFocus,
    handleBlur,
    focusedFields,
    hasSubmitted,
    showAlert,
    alertConfig,
    setShowAlert,
    setFormData,
    setErrors,
    setFocusedFields,
    setHasSubmitted
  };
}; 