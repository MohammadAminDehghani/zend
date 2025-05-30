const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const WebSocketServer = require('./websocket');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const messageRoutes = require('./routes/messages');
const authMiddleware = require('./middleware/auth');

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer(server);

const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
// Protected routes
app.use('/api/events', authMiddleware, eventRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zend')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Start server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app; 