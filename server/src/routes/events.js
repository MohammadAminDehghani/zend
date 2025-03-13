const express = require('express');
const Event = require('../models/Event');

const router = express.Router();

// Create event
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    const event = new Event({
      title,
      description
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

module.exports = router; 