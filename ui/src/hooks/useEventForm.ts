import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { API_URL } from '../app/config/api';
import { useAuth } from '../contexts/AuthContext';
import * as Location from 'expo-location';
import CustomAlert from '../app/components/CustomAlert';
import { useNotificationHook } from './useNotificationHook';

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
  const { showImmediateNotification } = useNotificationHook();
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
  const [originalEvent, setOriginalEvent] = useState<EventForm | null>(null);

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
      const eventForm = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status || 'public',
        access: data.status || 'public'
      };
      setFormData(eventForm);
      setOriginalEvent(eventForm);
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
        if ((!eventId || focusedFields.has('startDate'))) {
          // Compare only the date part (year, month, day)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const startDate = new Date(value);
          startDate.setHours(0, 0, 0, 0);
          if (startDate < today) {
            return 'Start date cannot be in the past';
          }
        }
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
        // Map field names to error object keys
        switch (field) {
          case 'locations':
            newErrors.location = error;
            break;
          case 'startDate':
          case 'endDate':
            newErrors.date = error;
            break;
          case 'startTime':
          case 'endTime':
            newErrors.time = error;
            break;
          default:
            newErrors[field as keyof typeof errors] = error;
        }
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

  const detectChanges = (oldData: EventForm, newData: EventForm) => {
    const changes: Partial<EventForm> = {};
    Object.keys(newData).forEach(key => {
      const field = key as keyof EventForm;
      if (JSON.stringify(oldData[field]) !== JSON.stringify(newData[field])) {
        changes[field] = newData[field];
      }
    });
    return changes;
  };

  const handleSubmit = async () => {
    setHasSubmitted(true);
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Combine date and time
      const startDateTime = new Date(formData.startDate);
      const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes);

      let endDateTime = undefined;
      if (formData.endDate) {
        endDateTime = new Date(formData.endDate);
        const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
        endDateTime.setHours(endHours, endMinutes);
      }

      const eventData = {
        ...formData,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime?.toISOString(),
        creator: userId,
      };

      const method = eventId ? 'PUT' : 'POST';
      const url = eventId ? `${API_URL}/api/events/${eventId}` : `${API_URL}/api/events`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save event');
      }

      const data = await response.json();
      showImmediateNotification(
        'Success',
        eventId ? 'Event updated successfully' : 'Event created successfully',
        { type: 'success' }
      );

      router.back();
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = (field: string) => {
    setFocusedFields(prev => new Set([...prev, field as keyof EventForm]));
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
        date: error
      }));
    }
  };

  const handleEndDateChange = (date: Date) => {
    setFormData(prev => ({ ...prev, endDate: date }));
    if (focusedFields.has('endDate') || hasSubmitted) {
      const error = validateField('endDate', date);
      setErrors(prev => ({
        ...prev,
        date: error
      }));
    }
  };

  const handleTimeChange = (time: Date) => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    setFormData(prev => ({ ...prev, startTime: timeString }));
    if (focusedFields.has('startTime') || hasSubmitted) {
      const error = validateField('startTime', timeString);
      setErrors(prev => ({
        ...prev,
        time: error
      }));
    }
  };

  const handleEndTimeChange = (time: Date) => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    setFormData(prev => ({ ...prev, endTime: timeString }));
    if (focusedFields.has('endTime') || hasSubmitted) {
      const error = validateField('endTime', timeString);
      setErrors(prev => ({
        ...prev,
        time: error
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
    setFormData(prev => {
      const tags = prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags };
    });
  };

  const handleCapacityChange = (capacity: number) => {
    setFormData(prev => ({ ...prev, capacity }));
  };

  const handleStatusChange = (status: 'public' | 'private') => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handleAccessControlChange = (access: 'public' | 'private') => {
    setFormData(prev => ({ ...prev, access }));
  };

  return {
    formData,
    errors,
    loading,
    userLocation,
    locationPermissionStatus,
    showAlert,
    alertConfig,
    setShowAlert,
    handleInputChange,
    handleSubmit,
    handleFocus,
    handleBlur,
    handleDateChange,
    handleEndDateChange,
    handleTimeChange,
    handleEndTimeChange,
    handleLocationChange,
    handleTypeChange,
    handleRecurringChange,
    handleTagToggle,
    handleCapacityChange,
    handleAccessControlChange,
    handleStatusChange,
    setFormData,
    setErrors,
    setFocusedFields,
    setHasSubmitted,
    focusedFields,
    hasSubmitted
  };
}; 