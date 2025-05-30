import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ProfileScreen from '../../../app/(tabs)/profile';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { renderWithProviders, waitForStateUpdate } from '../../utils/test-utils';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock ImagePicker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'images'
  }
}));

// Mock useAuth hook
jest.mock('../../../app/context/auth', () => ({
  useAuth: jest.fn()
}));

// Mock useAlert hook
jest.mock('../../../app/utils/alert', () => ({
  useAlert: () => ({
    showAlert: true,
    alertConfig: {
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          onPress: jest.fn(),
          style: 'destructive'
        },
        {
          text: 'Logout',
          onPress: jest.fn(),
        }
      ]
    },
    show: jest.fn(),
    hide: jest.fn()
  })
}));

describe('ProfileScreen', () => {
  const mockLogout = jest.fn();
  const mockToken = 'test-token';
  const mockProfile = {
    id: 'test-id',
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    gender: 'man' as const,
    interests: ['Work', 'Personal'],
    bio: 'Test bio',
    pictures: [
      {
        _id: 'pic1',
        url: 'test-url-1',
        uploadedAt: '2024-01-01'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      logout: mockLogout,
      token: mockToken
    });

    // Mock successful profile fetch
    mockedAxios.get.mockResolvedValueOnce({
      data: mockProfile
    });
  });

  it('renders correctly', async () => {
    const { getByText, getByPlaceholderText, getByTestId } = renderWithProviders(<ProfileScreen />);
    await waitForStateUpdate();

    expect(getByText('Profile')).toBeTruthy();
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
    expect(getByText('Test bio')).toBeTruthy();
  });

  it('shows loading state when fetching profile', async () => {
    const { getByTestId } = renderWithProviders(<ProfileScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  describe('Profile Editing', () => {
    it('allows entering edit mode', async () => {
      const { getByText } = renderWithProviders(<ProfileScreen />);
      await waitForStateUpdate();

      const editButton = getByText('Edit');
      await act(async () => {
        fireEvent.press(editButton);
      });

      expect(getByText('Cancel')).toBeTruthy();
      expect(getByText('Save')).toBeTruthy();
    });

    it('allows editing basic information', async () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(<ProfileScreen />);
      await waitForStateUpdate();

      // Enter edit mode
      const editButton = getByText('Edit');
      await act(async () => {
        fireEvent.press(editButton);
      });

      // Edit name
      const nameInput = getByPlaceholderText('Enter your name');
      await act(async () => {
        fireEvent.changeText(nameInput, 'Updated Name');
      });

      // Edit email
      const emailInput = getByPlaceholderText('Enter your email');
      await act(async () => {
        fireEvent.changeText(emailInput, 'updated@example.com');
      });

      // Edit phone
      const phoneInput = getByPlaceholderText('Enter your phone number');
      await act(async () => {
        fireEvent.changeText(phoneInput, '9876543210');
      });

      // Save changes
      mockedAxios.patch.mockResolvedValueOnce({
        data: {
          ...mockProfile,
          name: 'Updated Name',
          email: 'updated@example.com',
          phone: '9876543210'
        }
      });

      const saveButton = getByText('Save');
      await act(async () => {
        fireEvent.press(saveButton);
      });

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/profile'),
        expect.objectContaining({
          name: 'Updated Name',
          email: 'updated@example.com',
          phone: '9876543210'
        }),
        expect.any(Object)
      );
    });

    it('validates required fields', async () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(<ProfileScreen />);
      await waitForStateUpdate();

      // Enter edit mode
      const editButton = getByText('Edit');
      await act(async () => {
        fireEvent.press(editButton);
      });

      // Clear required fields
      const nameInput = getByPlaceholderText('Enter your name');
      const emailInput = getByPlaceholderText('Enter your email');
      await act(async () => {
        fireEvent.changeText(nameInput, '');
        fireEvent.changeText(emailInput, '');
      });

      // Try to save
      const saveButton = getByText('Save');
      await act(async () => {
        fireEvent.press(saveButton);
      });

      expect(mockedAxios.patch).not.toHaveBeenCalled();
    });
  });

  describe('Image Management', () => {
    it('allows uploading new images', async () => {
      const mockImageResult = {
        canceled: false,
        assets: [{
          uri: 'test-image-uri',
          width: 100,
          height: 100,
          type: 'image'
        }]
      };

      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce(mockImageResult);

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          pictures: [...mockProfile.pictures, {
            _id: 'pic2',
            url: 'test-url-2',
            uploadedAt: '2024-01-02'
          }]
        }
      });

      const { getByTestId } = renderWithProviders(<ProfileScreen />);
      await waitForStateUpdate();

      const uploadButton = getByTestId('upload-image-button');
      await act(async () => {
        fireEvent.press(uploadButton);
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/profile/pictures'),
        expect.any(FormData),
        expect.any(Object)
      );
    });

    it('allows deleting images', async () => {
      mockedAxios.delete.mockResolvedValueOnce({
        data: {
          pictures: []
        }
      });

      const { getByText, getByTestId } = renderWithProviders(<ProfileScreen />);
      await waitForStateUpdate();

      // Enter edit mode
      const editButton = getByText('Edit');
      await act(async () => {
        fireEvent.press(editButton);
      });

      // Delete image
      const deleteButton = getByTestId('delete-image-button');
      await act(async () => {
        fireEvent.press(deleteButton);
      });

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/profile/pictures/pic1'),
        expect.any(Object)
      );
    });
  });

  describe('Logout', () => {
    it('shows logout confirmation dialog', async () => {
      const { getByText } = renderWithProviders(<ProfileScreen />);
      await waitForStateUpdate();

      const logoutButton = getByText('Logout');
      await act(async () => {
        fireEvent.press(logoutButton);
      });

      expect(getByText('Are you sure you want to logout?')).toBeTruthy();
    });

    it('handles logout confirmation', async () => {
      const { getByText } = renderWithProviders(<ProfileScreen />);
      await waitForStateUpdate();

      const logoutButton = getByText('Logout');
      await act(async () => {
        fireEvent.press(logoutButton);
      });

      const confirmButton = getByText('Logout');
      await act(async () => {
        fireEvent.press(confirmButton);
      });

      expect(mockLogout).toHaveBeenCalled();
    });
  });
}); 