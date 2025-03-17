const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');

const users = [
  {
    email: 'john@test.com',
    password: 'password123',
    name: 'John Doe',
    phone: '1234567890',
    gender: 'man',
    interests: ['sports', 'technology'],
    bio: 'I love organizing tech meetups'
  },
  {
    email: 'jane@test.com',
    password: 'password123',
    name: 'Jane Smith',
    phone: '0987654321',
    gender: 'woman',
    interests: ['art', 'music'],
    bio: 'Art enthusiast and musician'
  },
  {
    email: 'bob@test.com',
    password: 'password123',
    name: 'Bob Wilson',
    phone: '5555555555',
    gender: 'man',
    interests: ['food', 'travel'],
    bio: 'Foodie and traveler'
  }
];

const generateEvents = (creators) => {
  const events = [];
  const types = ['one-time', 'recurring'];
  const statuses = ['open', 'verification_required'];
  const tags = ['sports', 'technology', 'art', 'music', 'food', 'travel'];
  const repeatFrequencies = ['daily', 'weekly', 'monthly'];
  const repeatDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  creators.forEach(creator => {
    // Each user creates 3 events
    for (let i = 0; i < 3; i++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30)); // Random date within next 30 days
      
      const type = types[Math.floor(Math.random() * types.length)];
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30); // End date 30 days after start date

      events.push({
        title: `Event ${i + 1} by ${creator.name}`,
        description: `This is a test event created by ${creator.name}`,
        creator: creator._id,
        type: type,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        capacity: Math.floor(Math.random() * 10) + 5, // Random capacity between 5-15
        locations: [{
          name: 'Test Location',
          latitude: (Math.random() * 180 - 90).toFixed(6),
          longitude: (Math.random() * 360 - 180).toFixed(6)
        }],
        startDate: startDate,
        endDate: type === 'recurring' ? endDate : undefined,
        startTime: '10:00',
        endTime: '12:00',
        repeatFrequency: type === 'recurring' ? repeatFrequencies[Math.floor(Math.random() * repeatFrequencies.length)] : undefined,
        repeatDays: type === 'recurring' ? [repeatDays[Math.floor(Math.random() * repeatDays.length)]] : undefined,
        tags: [tags[Math.floor(Math.random() * tags.length)]],
        participants: [] // Initialize empty participants array
      });
    }
  });

  return events;
};

const addParticipants = async (events, users) => {
  console.log('Adding participants to events...');
  
  for (const event of events) {
    // Skip if creator is the only user
    const otherUsers = users.filter(u => u._id.toString() !== event.creator.toString());
    
    // Randomly decide how many users will participate (1-3)
    const numParticipants = Math.floor(Math.random() * 3) + 1;
    
    // Randomly select users and add them as participants
    for (let i = 0; i < numParticipants && i < otherUsers.length; i++) {
      const user = otherUsers[i];
      const status = event.status === 'verification_required' ? 'pending' : 'approved';
      
      event.participants.push({
        userId: user._id,
        status: status
      });
    }
    
    // Save the updated event
    await event.save();
  }
};

const seedData = async (clear = false) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zend', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    if (clear) {
      console.log('Clearing existing data...');
      await User.deleteMany({});
      await Event.deleteMany({});
    }

    // Create users
    console.log('Creating test users...');
    const createdUsers = await User.create(users);
    console.log(`Created ${createdUsers.length} users`);

    // Generate and create events
    console.log('Creating test events...');
    const events = generateEvents(createdUsers);
    const createdEvents = await Event.create(events);
    console.log(`Created ${createdEvents.length} events`);

    // Add participants to events
    await addParticipants(createdEvents, createdUsers);
    console.log('Added participants to events');

    console.log('\nTest accounts:');
    createdUsers.forEach(user => {
      console.log(`Email: ${user.email}, Password: password123`);
    });

    await mongoose.disconnect();
    console.log('\nSeeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Check if script is run directly
if (require.main === module) {
  const clearFlag = process.argv.includes('--clear');
  seedData(clearFlag);
}

module.exports = seedData; 