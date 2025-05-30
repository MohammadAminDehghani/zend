export const mockEventResponse = {
  _id: 'test-event-id',
  title: 'Test Event',
  description: 'Test Description',
  type: 'one-time',
  locations: [
    {
      name: 'Test Location',
      latitude: 37.7749,
      longitude: -122.4194
    }
  ],
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
  startTime: '09:00',
  endTime: '17:00',
  tags: ['test', 'event'],
  capacity: 4,
  access: 'public',
  status: 'public',
  creator: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    pictures: []
  }
};

export const mockUserResponse = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  phone: '1234567890',
  gender: 'other',
  interests: ['test', 'event'],
  bio: 'Test bio',
  pictures: []
};

export const mockAuthResponse = {
  token: 'test-token',
  user: mockUserResponse
}; 