const express = require('express');
const Event = require('../models/Event');
const User = require('../models/User');

const router = express.Router();

// Create event
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      type, 
      locations, 
      startDate, 
      endDate, 
      startTime, 
      endTime,
      repeatFrequency,
      repeatDays,
      tags,
      status,
      capacity
    } = req.body;
    const creator = req.user.userId;
    
    const event = new Event({
      title,
      description,
      creator,
      type,
      locations,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      startTime,
      endTime,
      repeatFrequency,
      repeatDays,
      tags,
      status,
      capacity
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error creating event', error: error.message });
  }
});

// Get all events (for explore - events created by others)
router.get('/', async (req, res) => {
  try {
    const currentUser = req.user.userId;
    const events = await Event.find({ creator: { $ne: currentUser } }).sort({ startDate: 1 });
    
    // Fetch creator details for all events
    const eventsWithCreators = await Promise.all(events.map(async (event) => {
      const creator = await User.findById(event.creator, 'name email pictures phone gender interests bio');
      return {
        ...event.toObject(),
        creator: {
          id: event.creator,
          name: creator?.name || 'Unknown',
          email: creator?.email || 'Unknown',
          pictures: creator?.pictures || [],
          phone: creator?.phone || '',
          gender: creator?.gender || 'other',
          interests: creator?.interests || [],
          bio: creator?.bio || ''
        }
      };
    }));
    
    res.json(eventsWithCreators);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
});

// Get managed events (events created by current user)
router.get('/managed', async (req, res) => {
  try {
    const currentUser = req.user.userId;
    const events = await Event.find({ creator: currentUser }).sort({ startDate: 1 });
    
    // Fetch creator and participant details for all events
    const eventsWithDetails = await Promise.all(events.map(async (event) => {
      const creator = await User.findById(event.creator, 'name email pictures phone gender interests bio');
      
      // Fetch user details for each participant
      const participantsWithDetails = await Promise.all((event.participants || []).map(async (participant) => {
        const user = await User.findById(participant.userId, 'name email pictures');
        return {
          ...participant.toObject(),
          user: user ? {
            name: user.name,
            email: user.email,
            pictures: user.pictures || []
          } : undefined
        };
      }));

      return {
        ...event.toObject(),
        participants: participantsWithDetails,
        creator: {
          id: event.creator,
          name: creator?.name || 'Unknown',
          email: creator?.email || 'Unknown',
          pictures: creator?.pictures || [],
          phone: creator?.phone || '',
          gender: creator?.gender || 'other',
          interests: creator?.interests || [],
          bio: creator?.bio || ''
        }
      };
    }));
    
    res.json(eventsWithDetails);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching managed events', error: error.message });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const creator = await User.findById(event.creator, 'name email pictures phone gender interests bio');
    const eventWithCreator = {
      ...event.toObject(),
      creator: {
        id: event.creator,
        name: creator?.name || 'Unknown',
        email: creator?.email || 'Unknown',
        pictures: creator?.pictures || [],
        phone: creator?.phone || '',
        gender: creator?.gender || 'other',
        interests: creator?.interests || [],
        bio: creator?.bio || ''
      }
    };

    res.json(eventWithCreator);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event', error: error.message });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const creator = req.user.userId;
    const eventId = req.params.id;

    // Check if event exists and user is the creator
    const existingEvent = await Event.findById(eventId);
    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (existingEvent.creator !== creator) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    const { 
      title, 
      description, 
      type, 
      locations, 
      startDate, 
      endDate, 
      startTime, 
      endTime,
      repeatFrequency,
      repeatDays,
      tags,
      status,
      capacity
    } = req.body;

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        title,
        description,
        type,
        locations,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        startTime,
        endTime,
        repeatFrequency,
        repeatDays,
        tags,
        status,
        capacity
      },
      { new: true }
    );

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const creator = req.user.userId;

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.creator !== creator) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event', error: error.message });
  }
});

// Join event
router.post('/:id/join', async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.userId;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the creator
    if (event.creator.toString() === userId) {
      return res.status(400).json({ message: 'You cannot join your own event' });
    }

    // Check if user is already a participant
    const participants = event.participants || [];
    const existingParticipation = participants.find(p => p.userId === userId);
    if (existingParticipation) {
      return res.status(400).json({ message: 'You are already participating in this event' });
    }

    // Count approved participants and check capacity
    const approvedParticipants = participants.filter(p => p.status === 'approved').length;
    const pendingParticipants = participants.filter(p => p.status === 'pending').length;
    
    // For open events, check current capacity including pending
    if (event.status === 'open' && approvedParticipants >= event.capacity) {
      return res.status(400).json({ message: 'Event has reached maximum capacity' });
    }
    
    // For verification_required events, check potential capacity including pending
    if (event.status === 'verification_required' && (approvedParticipants + pendingParticipants) >= event.capacity) {
      return res.status(400).json({ message: 'Event has reached maximum capacity including pending requests' });
    }

    // Add user as participant
    event.participants = [
      ...participants,
      {
        userId,
        status: event.status === 'verification_required' ? 'pending' : 'approved'
      }
    ];

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error joining event', error: error.message });
  }
});

// Leave event
router.post('/:id/leave', async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.userId;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Remove user from participants
    const participants = event.participants || [];
    event.participants = participants.filter(p => p.userId !== userId);
    
    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error leaving event', error: error.message });
  }
});

// Accept join request
router.post('/:id/accept-request', async (req, res) => {
  try {
    const { userId: participantId } = req.body;
    const eventId = req.params.id;
    const creatorId = req.user.userId;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Verify the user is the event creator
    if (event.creator !== creatorId) {
      return res.status(403).json({ message: 'Not authorized to manage requests' });
    }

    // Update participant status to approved
    const participants = event.participants || [];
    event.participants = participants.map(p => 
      p.userId === participantId 
        ? { ...p, status: 'approved' }
        : p
    );

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error accepting request', error: error.message });
  }
});

// Reject join request
router.post('/:id/reject-request', async (req, res) => {
  try {
    const { userId: participantId } = req.body;
    const eventId = req.params.id;
    const creatorId = req.user.userId;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Verify the user is the event creator
    if (event.creator !== creatorId) {
      return res.status(403).json({ message: 'Not authorized to manage requests' });
    }

    // Update participant status to rejected
    const participants = event.participants || [];
    event.participants = participants.map(p => 
      p.userId === participantId 
        ? { ...p, status: 'rejected' }
        : p
    );

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting request', error: error.message });
  }
});

module.exports = router; 