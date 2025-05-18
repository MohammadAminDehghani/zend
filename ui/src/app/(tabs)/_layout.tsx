import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { colors } from '../theme';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: colors.primary,
    }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <FontAwesome name="compass" size={24} color={color} />,
        }}
      />
      {/* <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: ({ color }) => <FontAwesome name="plus-circle" size={24} color={color} />,
        }}
      /> */}
      <Tabs.Screen
        name="manage"
        options={{
          title: 'Manage',
          tabBarIcon: ({ color }) => <FontAwesome name="tasks" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <FontAwesome name="comments" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <FontAwesome name="bell" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
