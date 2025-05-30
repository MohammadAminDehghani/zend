import React from 'react';
import { EventForm } from '../../../app/components/EventForm';
import { renderWithProviders } from '../../utils/test-utils';

describe('EventForm', () => {
  const mockFormData = {
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
  };

  const mockProps = {
    formData: mockFormData,
    errors: {},
    loading: false,
    userLocation: null,
    locationPermissionStatus: 'pending',
    focusedFields: new Set(),
    hasSubmitted: false,
    showAlert: false,
    alertConfig: null,
    handleSubmit: jest.fn(),
    handleInputChange: jest.fn(),
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
  };

  it('renders correctly', () => {
    const { getByTestId } = renderWithProviders(<EventForm {...mockProps} />);
    expect(getByTestId('event-form')).toBeTruthy();
  });
}); 