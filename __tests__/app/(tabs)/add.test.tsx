import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddEventScreen from '../../../app/(tabs)/add';
import { useEventForm } from '../../../app/hooks/useEventForm';
import { renderWithProviders } from '../../utils/test-utils';

// Mock the useEventForm hook
jest.mock('../../../app/hooks/useEventForm');

describe('AddEventScreen', () => {
  const mockHandleSubmit = jest.fn();
  const mockHandleInputChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useEventForm as jest.Mock).mockReturnValue({
      formData: {
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
      },
      errors: {},
      loading: false,
      userLocation: null,
      locationPermissionStatus: 'pending',
      focusedFields: new Set(),
      hasSubmitted: false,
      showAlert: false,
      alertConfig: null,
      handleSubmit: mockHandleSubmit,
      handleInputChange: mockHandleInputChange,
      handleDateChange: jest.fn(),
      handleEndDateChange: jest.fn(),
      handleTimeChange: jest.fn(),
      handleLocationChange: jest.fn(),
      handleTypeChange: jest.fn(),
      handleRecurringChange: jest.fn(),
      handleTagToggle: jest.fn(),
      handleCapacityChange: jest.fn(),
      handleAccessControlChange: jest.fn(),
      handleStatusChange: jest.fn(),
      handleFocus: jest.fn(),
      handleBlur: jest.fn(),
      setShowAlert: jest.fn(),
      setFormData: jest.fn(),
      setErrors: jest.fn(),
      setFocusedFields: jest.fn(),
      setHasSubmitted: jest.fn()
    });
  });

  it('renders correctly', () => {
    const { getByTestId } = renderWithProviders(<AddEventScreen />);
    expect(getByTestId('add-event-screen')).toBeTruthy();
  });

  // Add more test cases here
}); 