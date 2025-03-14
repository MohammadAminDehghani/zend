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
      tags 
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
      tags
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error creating event', error: error.message });
  }
});

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ startDate: 1 });
    
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