const express = require('express');
const Event = require('../models/Event');

const router = express.Router();

// Create event
router.post('/', async (req, res) => {
  try {
    const { title, description, creator } = req.body;
    const headerCreator = req.headers['x-user-id']; // Get creator ID from header
    
    if (!headerCreator) {
      return res.status(401).json({ message: 'Creator ID is required in headers' });
    }

    if (!creator || creator !== headerCreator) {
      return res.status(401).json({ message: 'Creator ID mismatch or missing in body' });
    }

    const event = new Event({
      title,
      description,
      creator
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
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const creator = req.headers['x-user-id'];
    if (!creator) {
      return res.status(401).json({ message: 'Creator ID is required' });
    }

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