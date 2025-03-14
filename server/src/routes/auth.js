const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { upload, processAndSaveImage } = require('../middleware/upload');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  try {
    console.log('Register route called');
    console.log('Request body:', req.body);
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        gender: user.gender,
        interests: user.interests,
        bio: user.bio,
        pictures: user.pictures || []
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      gender: user.gender,
      interests: user.interests,
      bio: user.bio,
      pictures: user.pictures || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'phone', 'gender', 'interests', 'bio'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates!' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If email is being updated, check if it's already in use
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    updates.forEach(update => user[update] = req.body[update]);
    await user.save();

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      gender: user.gender,
      interests: user.interests,
      bio: user.bio,
      pictures: user.pictures || []
    });
  } catch (error) {
    res.status(400).json({ message: 'Error updating profile', error: error.message });
  }
});

// Upload profile pictures
router.post('/profile/pictures', authMiddleware, upload.array('pictures', 6), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Process and save each image
    const uploadPromises = req.files.map(file => processAndSaveImage(file, 'profile'));
    const uploadedImages = await Promise.all(uploadPromises);

    // Add new pictures to user's pictures array
    user.pictures.push(...uploadedImages.map(img => ({
      url: img.url,
      uploadedAt: new Date()
    })));

    // Keep only the latest 6 pictures
    if (user.pictures.length > 6) {
      // Get the URLs of pictures to be removed
      const picturesToRemove = user.pictures.slice(0, user.pictures.length - 6);
      
      // Remove old picture files
      for (const picture of picturesToRemove) {
        const filepath = path.join(__dirname, '..', picture.url);
        try {
          await fs.unlink(filepath);
        } catch (error) {
          console.error('Error deleting old picture:', error);
        }
      }
      
      // Update user's pictures array to keep only the latest 6
      user.pictures = user.pictures.slice(-6);
    }

    await user.save();
    res.json({ pictures: user.pictures });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading pictures', error: error.message });
  }
});

// Delete profile picture
router.delete('/profile/pictures/:pictureId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const pictureIndex = user.pictures.findIndex(p => p._id.toString() === req.params.pictureId);
    if (pictureIndex === -1) {
      return res.status(404).json({ message: 'Picture not found' });
    }

    // Remove the file
    const picture = user.pictures[pictureIndex];
    const filepath = path.join(__dirname, '..', picture.url);
    try {
      await fs.unlink(filepath);
    } catch (error) {
      console.error('Error deleting picture file:', error);
    }

    // Remove from user's pictures array
    user.pictures.splice(pictureIndex, 1);
    await user.save();

    res.json({ pictures: user.pictures });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting picture', error: error.message });
  }
});

module.exports = router; 