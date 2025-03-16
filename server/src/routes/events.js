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
      status
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
      status
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

module.exports = router; 