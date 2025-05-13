import { Stack, useRouter } from 'expo-router';
import { colors } from '../theme';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EventsLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTintColor: colors.primary,
        headerBackVisible: false,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/manage')}
            style={{ margin: 16 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen
        name="add"
        options={{
          title: 'Add Event',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: 'Edit Event',
          headerShown: true,
        }}
      />
    </Stack>
  );
} 