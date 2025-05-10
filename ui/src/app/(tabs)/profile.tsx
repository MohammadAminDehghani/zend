import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Image, Platform, Dimensions } from 'react-native';
import { useAuth } from '../context/auth';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL, getImageUrl } from '../config/api';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme/index';

import { INTERESTS } from '@/constants';
import Tag from '../components/Tag';
import CustomAlert from '../components/CustomAlert';
import { useAlert } from '../utils/alert';
import { FormInput } from '../components/FormInput';

interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  gender: 'man' | 'woman' | 'other';
  interests: string[];
  bio: string;
  pictures: Array<{
    _id: string;
    url: string;
    uploadedAt: string;
  }>;
}

type Gender = 'man' | 'woman' | 'other';

const styles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  // ... other styles
};

export default function ProfileScreen() {
  const { logout, token } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    gender: 'man',
    interests: [],
    bio: '',
    pictures: []
  });
  const [tempProfile, setTempProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const { showAlert, alertConfig, show, hide } = useAlert();

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setProfile(response.data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load profile');
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateProfile = () => {
    if (!profile.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return false;
    }
    if (!profile.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(profile.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleEdit = () => {
    setTempProfile({ ...profile });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTempProfile(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!validateProfile()) return;
    
    try {
      setIsSaving(true);
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.patch(`${API_URL}/api/auth/profile`, {
        name: tempProfile?.name,
        email: tempProfile?.email,
        phone: tempProfile?.phone,
        gender: tempProfile?.gender,
        interests: tempProfile?.interests,
        bio: tempProfile?.bio
      }, config);

      setProfile(response.data);
      setTempProfile(null);
      setIsEditing(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save profile';
      Alert.alert('Error', errorMessage);
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    show({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          onPress: hide,
          style: 'destructive'
        },
        {
          text: 'Logout',
          onPress: async () => {
            hide();
            await logout();
            router.replace('/login');
          }
        }
      ]
    });
  };

  const handleImagePick = async () => {
    if (profile.pictures.length >= 6) {
      Alert.alert('Maximum Limit', 'You can only upload up to 6 pictures');
      return;
    }

    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7, // Slightly reduced quality for better performance
        exif: false, // Don't include EXIF data
        base64: false, // Don't include base64 data
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        
        // Validate file size (max 5MB)
        const fileResponse = await fetch(asset.uri);
        const blob = await fileResponse.blob();
        if (blob.size > 5 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select an image under 5MB');
          return;
        }

        // Get file extension and mime type
        const fileExtension = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

        const formData = new FormData();
        formData.append('pictures', {
          uri: asset.uri,
          type: mimeType,
          name: `photo.${fileExtension}`,
        } as any);

        setIsUploadingImages(true);
        
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // Increased timeout to 30 seconds
        };

        const uploadResponse = await axios.post(
          `${API_URL}/api/auth/profile/pictures`,
          formData,
          config
        );

        if (uploadResponse.data && uploadResponse.data.pictures) {
          setProfile(prev => ({
            ...prev,
            pictures: uploadResponse.data.pictures
          }));
          Alert.alert('Success', 'Image uploaded successfully');
        } else {
          throw new Error('Invalid response from server');
        }
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      let errorMessage = 'Failed to upload image';
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        // Something else went wrong
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleDeleteImage = async (pictureId: string) => {
    try {
      const response = await axios.delete(
        `${API_URL}/api/auth/profile/pictures/${pictureId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setProfile(prev => ({
        ...prev,
        pictures: response.data.pictures
      }));
    } catch (error: any) {
      Alert.alert('Error', 'Failed to delete image');
      console.error('Error deleting image:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={theme.commonStyles.loadingContainer}>
        <ActivityIndicator testID="loading-indicator" size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.default }}>
      {alertConfig && (
        <CustomAlert
          visible={showAlert}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
        />
      )}

      {isEditing && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: theme.colors.background.default,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.gray[200],
          padding: theme.spacing.sm,
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: theme.spacing.sm,
        }}>
          <TouchableOpacity 
            style={[theme.commonStyles.button, { 
              backgroundColor: theme.colors.gray[100],
              flex: 1,
              paddingVertical: theme.spacing.xs,
              paddingHorizontal: theme.spacing.sm,
            }]}
            onPress={handleCancel}
          >
            <Text style={[theme.commonStyles.text, { color: theme.colors.gray[700], fontSize: theme.typography.fontSize.sm }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[theme.commonStyles.button, { 
              backgroundColor: theme.colors.primary.main,
              flex: 1,
              paddingVertical: theme.spacing.xs,
              paddingHorizontal: theme.spacing.sm,
            }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <Text style={[theme.commonStyles.text, { color: theme.colors.white, fontSize: theme.typography.fontSize.sm }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={[theme.commonStyles.container, { backgroundColor: theme.colors.background.default }]}>
        {/* Header Section */}
        <View style={{
          padding: theme.spacing.base,
          paddingTop: theme.spacing.xl,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.gray[200],
          marginTop: isEditing ? 48 : 0, // Adjusted margin for the fixed bar
        }}>
          <View style={[theme.commonStyles.row, { justifyContent: 'space-between', marginBottom: theme.spacing.lg }]}>
            <Text style={[theme.commonStyles.title, { color: theme.colors.gray[900] }]}>Profile</Text>
            <TouchableOpacity 
              style={[theme.commonStyles.button, { backgroundColor: theme.colors.gray[100] }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color={theme.colors.gray[700]} />
              <Text style={[theme.commonStyles.text, { marginLeft: theme.spacing.xs, color: theme.colors.gray[700] }]}>Logout</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[theme.commonStyles.row, { alignItems: 'center' }]}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.colors.gray[100],
              marginRight: theme.spacing.lg,
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: theme.colors.gray[200],
            }}>
              {profile.pictures?.[0] ? (
                <Image 
                  source={{ uri: getImageUrl(profile.pictures[0].url) || undefined }} 
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="person" size={40} color={theme.colors.gray[400]} />
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[theme.commonStyles.title, { color: theme.colors.gray[900], fontSize: theme.typography.fontSize.xl }]}>
                {profile.name || 'Add Name'}
              </Text>
              <Text style={[theme.commonStyles.text, { color: theme.colors.gray[600] }]}>
                {profile.email || 'Add Email'}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={{ padding: theme.spacing.base }}>
          {/* Photo Gallery */}
          <View style={{ marginBottom: theme.spacing.xl }}>
            <View style={[theme.commonStyles.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.base }]}>
              <Text style={[theme.commonStyles.subtitle, { color: theme.colors.gray[900] }]}>Photo Gallery</Text>
              <Text style={[theme.commonStyles.textSecondary, { fontSize: theme.typography.fontSize.sm }]}>
                {profile.pictures?.length || 0}/6 photos
              </Text>
            </View>
            <View style={{ gap: theme.spacing.sm }}>
              {[0, 1].map((rowIndex) => (
                <View key={rowIndex} style={[theme.commonStyles.row, { gap: theme.spacing.sm }]}>
                  {[0, 1, 2].map((colIndex) => {
                    const index = rowIndex * 3 + colIndex;
                    return (
                      <View key={index} style={{
                        flex: 1,
                        aspectRatio: 1,
                        borderRadius: theme.borderRadius.lg,
                        overflow: 'hidden',
                        backgroundColor: theme.colors.gray[100],
                        borderWidth: 1,
                        borderColor: theme.colors.gray[200],
                      }}>
                        {profile.pictures?.[index] ? (
                          <>
                            <Image 
                              source={{ uri: getImageUrl(profile.pictures[index].url) || undefined }} 
                              style={{ width: '100%', height: '100%' }}
                            />
                            {isEditing && (
                              <TouchableOpacity
                                style={{
                                  position: 'absolute',
                                  top: theme.spacing.xs,
                                  right: theme.spacing.xs,
                                  backgroundColor: theme.colors.danger,
                                  width: 24,
                                  height: 24,
                                  borderRadius: 12,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                }}
                                onPress={() => handleDeleteImage(profile.pictures[index]._id)}
                                testID="delete-image-button"
                              >
                                <Text style={{ color: theme.colors.white, fontSize: 16 }}>×</Text>
                              </TouchableOpacity>
                            )}
                          </>
                        ) : (
                          <TouchableOpacity 
                            style={{
                              flex: 1,
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderWidth: 2,
                              borderColor: theme.colors.gray[300],
                              borderStyle: 'dashed',
                            }}
                            onPress={handleImagePick}
                            disabled={isUploadingImages}
                            testID="upload-image-button"
                          >
                            {isUploadingImages ? (
                              <ActivityIndicator size="small" color={theme.colors.primary.main} />
                            ) : (
                              <Ionicons name="add-circle-outline" size={32} color={theme.colors.primary.main} />
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* Profile Form */}
          <View>
            <View style={[theme.commonStyles.row, { justifyContent: 'space-between', marginBottom: theme.spacing.base }]}>
              <Text style={[theme.commonStyles.subtitle, { color: theme.colors.gray[900] }]}>Profile Details</Text>
              {!isEditing && (
                <TouchableOpacity 
                  style={[theme.commonStyles.button, { backgroundColor: theme.colors.gray[100] }]}
                  onPress={handleEdit}
                >
                  <Text style={[theme.commonStyles.text, { color: theme.colors.primary.main }]}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ gap: theme.spacing.lg }}>
              {/* Basic Information */}
              <View>
                <Text style={[theme.commonStyles.label, { marginBottom: theme.spacing.base, fontSize: theme.typography.fontSize.lg, color: theme.colors.gray[900] }]}>Basic Information</Text>
                <View style={{ gap: theme.spacing.base }}>
                  <FormInput
                    label="Name"
                    required
                    value={isEditing ? tempProfile?.name || '' : profile.name}
                    onChangeText={(text) => setTempProfile(prev => prev ? { ...prev, name: text } : null)}
                    editable={isEditing}
                    placeholder="Enter your name"
                    error={!tempProfile?.name && isEditing ? 'Name is required' : undefined}
                  />

                  <FormInput
                    label="Email"
                    required
                    value={isEditing ? tempProfile?.email || '' : profile.email}
                    onChangeText={(text) => setTempProfile(prev => prev ? { ...prev, email: text } : null)}
                    keyboardType="email-address"
                    editable={isEditing}
                    placeholder="Enter your email"
                    autoCapitalize="none"
                    error={!tempProfile?.email && isEditing ? 'Email is required' : undefined}
                  />

                  <FormInput
                    label="Phone"
                    value={isEditing ? tempProfile?.phone || '' : profile.phone}
                    onChangeText={(text) => setTempProfile(prev => prev ? { ...prev, phone: text } : null)}
                    keyboardType="phone-pad"
                    editable={isEditing}
                    placeholder="Enter your phone number"
                  />
                </View>
              </View>

              {/* Gender Selection */}
              <View>
                <Text style={[theme.commonStyles.label, { marginBottom: theme.spacing.base, fontSize: theme.typography.fontSize.lg, color: theme.colors.gray[900] }]}>Gender</Text>
                <View style={[theme.commonStyles.row, { flexWrap: 'wrap', gap: theme.spacing.sm }]}>
                  {(['man', 'woman', 'other'] as Gender[]).map((gender) => (
                    <Tag
                      key={gender}
                      label={gender.charAt(0).toUpperCase() + gender.slice(1)}
                      isSelected={(isEditing ? tempProfile?.gender : profile.gender) === gender}
                      onPress={() => isEditing && setTempProfile(prev => prev ? { ...prev, gender } : null)}
                      disabled={!isEditing}
                    />
                  ))}
                </View>
              </View>

              {/* Interests */}
              <View>
                <Text style={[theme.commonStyles.label, { marginBottom: theme.spacing.base, fontSize: theme.typography.fontSize.lg, color: theme.colors.gray[900] }]}>Interests</Text>
                <View style={[theme.commonStyles.row, { flexWrap: 'wrap', gap: theme.spacing.sm }]}>
                  {INTERESTS.map((interest) => (
                    <Tag
                      key={interest.id}
                      label={interest.label}
                      isSelected={(isEditing ? tempProfile?.interests || [] : profile.interests || []).includes(interest.id)}
                      onPress={() => {
                        if (!isEditing) return;
                        setTempProfile(prev => prev ? {
                          ...prev,
                          interests: (prev.interests || []).includes(interest.id)
                            ? (prev.interests || []).filter(i => i !== interest.id)
                            : [...(prev.interests || []), interest.id]
                        } : null);
                      }}
                      disabled={!isEditing}
                    />
                  ))}
                </View>
              </View>

              {/* Bio */}
              <View>
                <Text style={[theme.commonStyles.label, { marginBottom: theme.spacing.base, fontSize: theme.typography.fontSize.lg, color: theme.colors.gray[900] }]}>About Me</Text>
                <FormInput
                  label=""
                  value={isEditing ? tempProfile?.bio || '' : profile.bio}
                  onChangeText={(text) => setTempProfile(prev => prev ? { ...prev, bio: text } : null)}
                  multiline
                  numberOfLines={4}
                  editable={isEditing}
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                />
                <Text style={[theme.commonStyles.textSecondary, { textAlign: 'right', marginTop: theme.spacing.xs }]}>
                  {(isEditing ? tempProfile?.bio : profile.bio)?.length || 0}/500
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
} 