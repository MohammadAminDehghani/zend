import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { useAuth } from '../context/auth';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import * as ImagePicker from 'expo-image-picker';

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
  const [newInterest, setNewInterest] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

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
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        gender: profile.gender,
        interests: profile.interests,
        bio: profile.bio
      }, config);

      setProfile(response.data);
      setIsEditing(false);
      Alert.alert('Success', 'Profile saved successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save profile';
      Alert.alert('Error', errorMessage);
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !profile.interests.includes(newInterest.trim())) {
      setProfile({
        ...profile,
        interests: [...profile.interests, newInterest.trim()]
      });
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setProfile({
      ...profile,
      interests: profile.interests.filter(i => i !== interest)
    });
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleImagePick = async () => {
    if (profile.pictures.length >= 6) {
      Alert.alert('Maximum Limit', 'You can only upload up to 6 pictures');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const formData = new FormData();
        formData.append('pictures', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        } as any);

        setIsUploadingImages(true);
        const response = await axios.post(
          `${API_URL}/api/auth/profile/pictures`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        setProfile(prev => ({
          ...prev,
          pictures: response.data.pictures
        }));
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to upload image');
      console.error('Error uploading image:', error);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        {!isEditing ? (
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.buttonDisabled]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.picturesContainer}>
        {profile.pictures?.map((picture, index) => (
          <View key={picture._id} style={styles.pictureWrapper}>
            <Image 
              source={{ uri: `${API_URL}${picture.url}` }} 
              style={styles.picture}
            />
            <TouchableOpacity
              style={styles.deleteImageButton}
              onPress={() => handleDeleteImage(picture._id)}
            >
              <Text style={styles.deleteImageText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        {(!profile.pictures || profile.pictures.length < 6) && (
          <TouchableOpacity 
            style={[styles.addPictureButton, isUploadingImages && styles.buttonDisabled]}
            onPress={handleImagePick}
            disabled={isUploadingImages}
          >
            {isUploadingImages ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.addPictureText}>+</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Name<Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, !profile.name && isEditing && styles.inputError]}
          value={profile.name}
          onChangeText={(text) => setProfile({ ...profile, name: text })}
          editable={isEditing}
          placeholder="Enter your name"
        />

        <Text style={styles.label}>Email<Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, !profile.email && isEditing && styles.inputError]}
          value={profile.email}
          onChangeText={(text) => setProfile({ ...profile, email: text })}
          keyboardType="email-address"
          editable={isEditing}
          placeholder="Enter your email"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={profile.phone}
          onChangeText={(text) => setProfile({ ...profile, phone: text })}
          keyboardType="phone-pad"
          editable={isEditing}
        />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderContainer}>
          {(['man', 'woman', 'other'] as Gender[]).map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.genderButton,
                profile.gender === gender && styles.genderButtonSelected,
                !isEditing && styles.genderButtonDisabled
              ]}
              onPress={() => isEditing && setProfile({ ...profile, gender })}
            >
              <Text style={[
                styles.genderButtonText,
                profile.gender === gender && styles.genderButtonTextSelected
              ]}>
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Interests</Text>
        <View style={styles.interestsContainer}>
          {profile.interests.map((interest, index) => (
            <View key={index} style={styles.interestTag}>
              <Text style={styles.interestText}>{interest}</Text>
              {isEditing && (
                <TouchableOpacity onPress={() => removeInterest(interest)}>
                  <Text style={styles.removeInterest}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
        {isEditing && (
          <View style={styles.addInterestContainer}>
            <TextInput
              style={styles.interestInput}
              value={newInterest}
              onChangeText={setNewInterest}
              placeholder="Add interest"
            />
            <TouchableOpacity style={styles.addButton} onPress={addInterest}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={profile.bio}
          onChangeText={(text) => setProfile({ ...profile, bio: text })}
          multiline
          maxLength={500}
          editable={isEditing}
        />
        <Text style={styles.charCount}>{profile.bio?.length || 0}/500</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    color: '#666',
    marginTop: -12,
    marginBottom: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  genderButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderButtonDisabled: {
    opacity: 0.7,
  },
  genderButtonText: {
    color: '#333',
  },
  genderButtonTextSelected: {
    color: '#fff',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E1F5FE',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  interestText: {
    color: '#0288D1',
    marginRight: 4,
  },
  removeInterest: {
    color: '#0288D1',
    fontSize: 18,
    marginLeft: 4,
  },
  addInterestContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  interestInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  required: {
    color: '#ff4444',
    marginLeft: 4,
  },
  inputError: {
    borderColor: '#ff4444',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  picturesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    padding: 10,
    gap: 10,
  },
  pictureWrapper: {
    position: 'relative',
    width: '31%',
    aspectRatio: 1,
    marginBottom: 10,
  },
  picture: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  addPictureButton: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  addPictureText: {
    fontSize: 24,
    color: '#007AFF',
  },
  deleteImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#ff4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteImageText: {
    color: 'white',
    fontSize: 18,
    lineHeight: 24,
  },
}); 