const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const eventRoutes = require('./routes/events');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zend', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}

// Routes
app.use('/api/auth', authRoutes); // Auth routes don't need auth middleware
app.use('/api/events', authMiddleware, eventRoutes); // Protect event routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

module.exports = app; 