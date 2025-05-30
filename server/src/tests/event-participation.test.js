const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Event = require('../models/Event');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

describe('Event Participation Tests', () => {
  let testUsers = [];
  let testEvent;
  let creatorToken;

  beforeAll(async () => {
    // Disconnect if there's an existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zend-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Clear all existing data
    await User.deleteMany({});
    await Event.deleteMany({});

    // Create 10 test users
    for (let i = 0; i < 10; i++) {
      const user = await User.create({
        email: `test${i}@example.com`,
        password: 'password123',
        name: `Test User ${i}`
      });
      
      // Generate token directly
      const token = jwt.sign(
        { userId: user._id.toString() }, // Convert ObjectId to string
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      testUsers.push({
        user,
        token
      });
    }
    
    creatorToken = testUsers[0].token;

    // Create a test event
    const eventData = {
      title: 'Test Event',
      description: 'Test Description',
      type: 'one-time',
      status: 'verification_required',
      capacity: 2,
      locations: [{
        name: 'Test Location',
        latitude: 0,
        longitude: 0
      }],
      startDate: new Date(),
      startTime: '10:00',
      endTime: '11:00',
      tags: ['test'],
      creator: testUsers[0].user._id // Set creator directly
    };

    testEvent = await Event.create(eventData);
  });

  beforeEach(async () => {
    // Clear all events except the test event
    await Event.deleteMany({ _id: { $ne: testEvent._id } });
    
    // Reset test event participants
    await Event.findByIdAndUpdate(testEvent._id, {
      $set: {
        participants: []
      }
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Event.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Capacity Tests', () => {
    test('should enforce event capacity', async () => {
      // First user joins
      const join1 = await request(app)
        .post(`/api/events/${testEvent._id}/join`)
        .set('Authorization', `Bearer ${testUsers[1].token}`);
      
      if (join1.status !== 200) {
        console.error('First join failed:', join1.body);
      }
      expect(join1.status).toBe(200);

      // Second user joins
      const join2 = await request(app)
        .post(`/api/events/${testEvent._id}/join`)
        .set('Authorization', `Bearer ${testUsers[2].token}`);
      
      if (join2.status !== 200) {
        console.error('Second join failed:', join2.body);
      }
      expect(join2.status).toBe(200);

      // Third user tries to join
      const join3 = await request(app)
        .post(`/api/events/${testEvent._id}/join`)
        .set('Authorization', `Bearer ${testUsers[3].token}`);
      expect(join3.status).toBe(400);
      expect(join3.body.message).toContain('capacity');
    });

    test('should allow joining after rejection within capacity', async () => {
      // First two users join
      await request(app)
        .post(`/api/events/${testEvent._id}/join`)
        .set('Authorization', `Bearer ${testUsers[1].token}`);
      await request(app)
        .post(`/api/events/${testEvent._id}/join`)
        .set('Authorization', `Bearer ${testUsers[2].token}`);

      // Creator rejects first user
      await request(app)
        .post(`/api/events/${testEvent._id}/reject-request`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ userId: testUsers[1].user._id.toString() });

      // Third user should now be able to join
      const join3 = await request(app)
        .post(`/api/events/${testEvent._id}/join`)
        .set('Authorization', `Bearer ${testUsers[3].token}`);
      expect(join3.status).toBe(200);
    });
  });

  describe('Approval Flow Tests', () => {
    test('should handle verification required flow', async () => {
      // User joins
      const join = await request(app)
        .post(`/api/events/${testEvent._id}/join`)
        .set('Authorization', `Bearer ${testUsers[1].token}`);
      
      if (join.status !== 200) {
        console.error('Join failed:', join.body);
      }
      expect(join.status).toBe(200);

      // Check pending status
      const eventCheck1 = await request(app)
        .get(`/api/events/${testEvent._id}`)
        .set('Authorization', `Bearer ${testUsers[1].token}`);
      expect(eventCheck1.body.participants[0].status).toBe('pending');

      // Creator approves
      const accept = await request(app)
        .post(`/api/events/${testEvent._id}/accept-request`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ userId: testUsers[1].user._id.toString() });
      
      if (accept.status !== 200) {
        console.error('Accept failed:', accept.body);
      }
      expect(accept.status).toBe(200);

      // Check approved status
      const eventCheck2 = await request(app)
        .get(`/api/events/${testEvent._id}`)
        .set('Authorization', `Bearer ${testUsers[1].token}`);
      expect(eventCheck2.body.participants[0].status).toBe('approved');
    });
  });

  describe('Rejection Flow Tests', () => {
    test('should handle rejection flow and show status to user', async () => {
      // User joins
      await request(app)
        .post(`/api/events/${testEvent._id}/join`)
        .set('Authorization', `Bearer ${testUsers[1].token}`);

      // Creator rejects
      const reject = await request(app)
        .post(`/api/events/${testEvent._id}/reject-request`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ userId: testUsers[1].user._id.toString() });
      expect(reject.status).toBe(200);

      // Check rejected status is visible to user
      const eventCheck = await request(app)
        .get(`/api/events/${testEvent._id}`)
        .set('Authorization', `Bearer ${testUsers[1].token}`);
      expect(eventCheck.body.participants[0].status).toBe('rejected');

      // Try to join again
      const rejoin = await request(app)
        .post(`/api/events/${testEvent._id}/join`)
        .set('Authorization', `Bearer ${testUsers[1].token}`);
      expect(rejoin.status).toBe(400);
    });
  });

  describe('Edge Cases', () => {
    test('should prevent creator from joining their own event', async () => {
      const join = await request(app)
        .post(`/api/events/${testEvent._id}/join`)
        .set('Authorization', `Bearer ${creatorToken}`);
      expect(join.status).toBe(400);
    });

    test('should prevent double joining', async () => {
      // First join
      await request(app)
        .post(`/api/events/${testEvent._id}/join`)
        .set('Authorization', `Bearer ${testUsers[1].token}`);

      // Try to join again
      const rejoin = await request(app)
        .post(`/api/events/${testEvent._id}/join`)
        .set('Authorization', `Bearer ${testUsers[1].token}`);
      expect(rejoin.status).toBe(400);
    });

    test('should handle leave and rejoin flow', async () => {
      // Join
      await request(app)
        .post(`/api/events/${testEvent._id}/join`)
        .set('Authorization', `Bearer ${testUsers[1].token}`);

      // Leave
      await request(app)
        .post(`/api/events/${testEvent._id}/leave`)
        .set('Authorization', `Bearer ${testUsers[1].token}`);

      // Join again
      const rejoin = await request(app)
        .post(`/api/events/${testEvent._id}/join`)
        .set('Authorization', `Bearer ${testUsers[1].token}`);
      expect(rejoin.status).toBe(200);
    });
  });
}); 