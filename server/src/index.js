const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const authMiddleware = require('./middleware/auth');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
// Protected routes
app.use('/api/events', authMiddleware, eventRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zend')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 