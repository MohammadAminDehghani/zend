const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const Event = require('../models/Event');
const authMiddleware = require('../middleware/auth');

// Get one-to-one chat messages
router.get('/one-to-one/:recipientId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, recipient: req.params.recipientId },
        { sender: req.params.recipientId, recipient: req.user.userId }
      ],
      chatType: 'one-to-one'
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('sender', 'name pictures')
    .populate('recipient', 'name pictures');

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Get group chat messages for an event
router.get('/group/:eventId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      eventId: req.params.eventId,
      chatType: 'group'
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('sender', 'name pictures');

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Mark messages as read
router.post('/read', authMiddleware, async (req, res) => {
  try {
    const { messageIds } = req.body;
    await Message.updateMany(
      {
        _id: { $in: messageIds },
        'readBy.userId': { $ne: req.user.id }
      },
      {
        $push: {
          readBy: {
            userId: req.user.id,
            readAt: new Date()
          }
        }
      }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
});

// Get all chats for the current user
router.get('/chats', authMiddleware, async (req, res) => {
  try {
    // Get all messages where the user is either sender or recipient
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId },
        { recipient: req.user.userId }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'name pictures')
    .populate('recipient', 'name pictures');

    // Group messages by chat
    const chats = new Map();

    for (const message of messages) {
      let chatId;
      let chatName;
      let participants = [];

      if (message.chatType === 'one-to-one') {
        // For one-to-one chats, we want to show the other person's chat
        const otherUser = message.sender._id.toString() === req.user.userId 
          ? message.recipient
          : message.sender;
        
        // Skip if this is a message to/from ourselves
        if (otherUser._id.toString() === req.user.userId) {
          continue;
        }
        
        chatId = otherUser._id.toString();
        chatName = otherUser.name;
        participants = [otherUser];
      } else {
        chatId = message.eventId;
        const event = await Event.findById(message.eventId);
        if (!event) {
          continue;
        }
        
        chatName = event.name;
        participants = [message.sender];
      }

      if (!chats.has(chatId)) {
        chats.set(chatId, {
          _id: chatId,
          type: message.chatType,
          name: chatName,
          participants,
          lastMessage: message,
          unreadCount: message.sender._id.toString() !== req.user.userId && !message.readBy.find(r => r.userId === req.user.userId) ? 1 : 0
        });
      } else {
        const chat = chats.get(chatId);
        if (!chat.lastMessage || message.createdAt > chat.lastMessage.createdAt) {
          chat.lastMessage = message;
        }
        if (message.sender._id.toString() !== req.user.userId && !message.readBy.find(r => r.userId === req.user.userId)) {
          chat.unreadCount++;
        }
      }
    }

    // Convert Map to array and sort by last message time
    const chatArray = Array.from(chats.values()).sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return b.lastMessage.createdAt - a.lastMessage.createdAt;
    });

    res.json(chatArray);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chats', error: error.message });
  }
});

module.exports = router; 