import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import EditEventScreen from '../../../../app/events/edit/[id]';
import { useEventForm } from '../../../../app/hooks/useEventForm';
import { renderWithProviders, waitForStateUpdate } from '../../../utils/test-utils';

// Mock the useEventForm hook
jest.mock('../../../../app/hooks/useEventForm');

// Mock the useNotificationHook
const mockTestNotification = jest.fn();
jest.mock('../../../../hooks/useNotificationHook', () => ({
  useNotificationHook: () => ({
    testNotification: mockTestNotification
  })
}));

// Mock the useLocalSearchParams hook
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'test-event-id' }),
  Stack: {
    Screen: ({ children }: { children: React.ReactNode }) => <>{children}</>
  }
}));

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ value, onChange, mode }: { 
      value: Date; 
      onChange: (event: { type: string; nativeEvent: { timestamp: number } }, date?: Date) => void;
      mode: 'date' | 'time';
    }) => {
      React.useEffect(() => {
        if (onChange) {
          onChange({ type: 'set', nativeEvent: { timestamp: value.getTime() } }, value);
        }
      }, []);
      return null;
    }
  };
});

describe('EditEventScreen', () => {
  const mockHandleSubmit = jest.fn();
  const mockHandleInputChange = jest.fn();
  const mockHandleDateChange = jest.fn();
  const mockHandleEndDateChange = jest.fn();
  const mockHandleTimeChange = jest.fn();
  const mockHandleLocationChange = jest.fn();
  const mockHandleTypeChange = jest.fn();
  const mockHandleRecurringChange = jest.fn();
  const mockHandleTagToggle = jest.fn();
  const mockHandleCapacityChange = jest.fn();
  const mockHandleAccessControlChange = jest.fn();
  const mockHandleStatusChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useEventForm as jest.Mock).mockReturnValue({
      formData: {
        title: 'Test Event',
        description: 'Test Description',
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
      handleDateChange: mockHandleDateChange,
      handleEndDateChange: mockHandleEndDateChange,
      handleTimeChange: mockHandleTimeChange,
      handleLocationChange: mockHandleLocationChange,
      handleTypeChange: mockHandleTypeChange,
      handleRecurringChange: mockHandleRecurringChange,
      handleTagToggle: mockHandleTagToggle,
      handleCapacityChange: mockHandleCapacityChange,
      handleAccessControlChange: mockHandleAccessControlChange,
      handleStatusChange: mockHandleStatusChange,
      handleFocus: jest.fn(),
      handleBlur: jest.fn(),
      setShowAlert: jest.fn(),
      setFormData: jest.fn(),
      setErrors: jest.fn(),
      setFocusedFields: jest.fn(),
      setHasSubmitted: jest.fn()
    });
  });

  it('renders correctly', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<EditEventScreen />);
    await waitForStateUpdate();
    expect(getByText('Edit Event')).toBeTruthy();
    expect(getByPlaceholderText('Tell us about your event...')).toBeTruthy();
  });

  it('shows loading state when loading', async () => {
    (useEventForm as jest.Mock).mockReturnValue({
      ...useEventForm(),
      loading: true
    });

    const { getByTestId } = renderWithProviders(<EditEventScreen />);
    await waitForStateUpdate();
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  describe('Basic Information', () => {
    it('allows editing event title', async () => {
      const { getByPlaceholderText } = renderWithProviders(<EditEventScreen />);
      await waitForStateUpdate();
      const titleInput = getByPlaceholderText('Enter event title');
      fireEvent.changeText(titleInput, 'Updated Event Title');
      expect(mockHandleInputChange).toHaveBeenCalledWith('title', 'Updated Event Title');
    });

    it('allows editing event description', async () => {
      const { getByPlaceholderText } = renderWithProviders(<EditEventScreen />);
      await waitForStateUpdate();
      const descriptionInput = getByPlaceholderText('Tell us about your event...');
      fireEvent.changeText(descriptionInput, 'Updated Description');
      expect(mockHandleInputChange).toHaveBeenCalledWith('description', 'Updated Description');
    });
  });

  describe('Date & Time', () => {
    it('allows editing start date', async () => {
      const { getByText } = renderWithProviders(<EditEventScreen />);
      await waitForStateUpdate();
      const startDateButton = getByText('Start Date');
      
      await act(async () => {
        fireEvent.press(startDateButton);
      });

      await waitFor(() => {
        expect(mockHandleDateChange).toHaveBeenCalled();
      });
    });

    it('allows editing end date', async () => {
      const { getByText } = renderWithProviders(<EditEventScreen />);
      await waitForStateUpdate();
      const endDateButton = getByText('End Date');
      
      await act(async () => {
        fireEvent.press(endDateButton);
      });

      await waitFor(() => {
        expect(mockHandleEndDateChange).toHaveBeenCalled();
      });
    });

    it('allows editing start and end time', async () => {
      const { getByText } = renderWithProviders(<EditEventScreen />);
      await waitForStateUpdate();
      const startTimeButton = getByText('Start Time');
      const endTimeButton = getByText('End Time');
      
      await act(async () => {
        fireEvent.press(startTimeButton);
      });

      await waitFor(() => {
        expect(mockHandleInputChange).toHaveBeenCalledWith('startTime', expect.any(String));
      });

      await act(async () => {
        fireEvent.press(endTimeButton);
      });

      await waitFor(() => {
        expect(mockHandleInputChange).toHaveBeenCalledWith('endTime', expect.any(String));
      });
    });
  });

  describe('Event Type', () => {
    it('allows switching between one-time and recurring events', async () => {
      const { getByText } = renderWithProviders(<EditEventScreen />);
      await waitForStateUpdate();
      const recurringButton = getByText('Recurring');
      await act(async () => {
        fireEvent.press(recurringButton);
      });
      expect(mockHandleTypeChange).toHaveBeenCalledWith('recurring');
    });
  });

  describe('Access Control', () => {
    it('allows switching between public and private access', async () => {
      const { getByText } = renderWithProviders(<EditEventScreen />);
      await waitForStateUpdate();
      const privateButton = getByText('Private');
      await act(async () => {
        fireEvent.press(privateButton);
      });
      expect(mockHandleAccessControlChange).toHaveBeenCalledWith('private');
      expect(mockHandleStatusChange).toHaveBeenCalledWith('private');
    });
  });

  describe('Event Capacity', () => {
    it('allows changing event capacity', async () => {
      const { getByTestId } = renderWithProviders(<EditEventScreen />);
      await waitForStateUpdate();
      const increaseButton = getByTestId('capacity-increase');
      const decreaseButton = getByTestId('capacity-decrease');
      
      await act(async () => {
        fireEvent.press(increaseButton);
        fireEvent.press(decreaseButton);
      });
      
      expect(mockHandleCapacityChange).toHaveBeenCalledWith(5);
      expect(mockHandleCapacityChange).toHaveBeenCalledWith(3);
    });
  });

  describe('Tags', () => {
    it('allows toggling event tags', async () => {
      const { getByText } = renderWithProviders(<EditEventScreen />);
      await waitForStateUpdate();
      const workTag = getByText('Work');
      await act(async () => {
        fireEvent.press(workTag);
      });
      expect(mockHandleTagToggle).toHaveBeenCalledWith('Work');
    });
  });

  describe('Form Submission', () => {
    it('submits the form when submit button is pressed', async () => {
      const { getByText } = renderWithProviders(<EditEventScreen />);
      await waitForStateUpdate();
      const submitButton = getByText('Update Event');
      await act(async () => {
        fireEvent.press(submitButton);
      });
      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it('shows loading state during submission', async () => {
      (useEventForm as jest.Mock).mockReturnValue({
        ...useEventForm(),
        loading: true
      });
      
      const { getByTestId } = renderWithProviders(<EditEventScreen />);
      await waitForStateUpdate();
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('displays validation errors when form is submitted with invalid data', async () => {
      (useEventForm as jest.Mock).mockReturnValue({
        ...useEventForm(),
        errors: {
          title: 'Title is required',
          description: 'Description is required'
        },
        hasSubmitted: true
      });

      const { getByText } = renderWithProviders(<EditEventScreen />);
      await waitForStateUpdate();
      expect(getByText('Title is required')).toBeTruthy();
      expect(getByText('Description is required')).toBeTruthy();
    });
  });

  describe('Test Notification', () => {
    it('sends test notification when test button is pressed', async () => {
      const { getByText } = renderWithProviders(<EditEventScreen />);
      await waitForStateUpdate();
      const testButton = getByText('Send Test Notification');
      
      await act(async () => {
        fireEvent.press(testButton);
      });

      await waitFor(() => {
        expect(mockTestNotification).toHaveBeenCalled();
      });
    });
  });
}); 