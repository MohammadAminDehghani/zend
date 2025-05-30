const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,  // User ID
    required: true,
    ref: 'User'
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  chatType: {
    type: String,
    enum: ['one-to-one', 'group'],
    required: true
  },
  // For one-to-one chat
  recipient: {
    type: String,  // User ID
    ref: 'User',
    required: function() {
      return this.chatType === 'one-to-one';
    }
  },
  // For group chat
  eventId: {
    type: String,  // Event ID
    ref: 'Event',
    required: function() {
      return this.chatType === 'group';
    }
  },
  readBy: [{
    userId: {
      type: String,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ eventId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 