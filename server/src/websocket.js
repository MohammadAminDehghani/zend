const WebSocket = require('ws');
const Message = require('./models/Message');

class WebSocketServer {
  constructor(server) {
    this.server = server;
    this.clients = new Map(); // userId -> WebSocket
    this.wss = new WebSocket.Server({ server });
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('New WebSocket connection');
      this.handleConnection(ws);
    });
  }

  handleConnection(ws) {
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        const { type, payload } = data;

        switch (type) {
          case 'join':
            await this.handleJoin(ws, payload);
            break;
          case 'joinEvent':
            await this.handleJoinEvent(ws, payload);
            break;
          case 'sendMessage':
            await this.handleSendMessage(ws, payload);
            break;
          case 'markAsRead':
            await this.handleMarkAsRead(ws, payload);
            break;
          default:
            console.log('Unknown message type:', type);
        }
      } catch (error) {
        console.error('Error handling message:', error);
        this.sendError(ws, 'Error processing message');
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      this.handleDisconnect(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnect(ws);
    });
  }

  async handleJoin(ws, { userId }) {
    this.clients.set(userId, ws);
    console.log(`User ${userId} joined`);
  }

  async handleJoinEvent(ws, { eventId }) {
    // Store event subscription in ws object
    if (!ws.eventSubscriptions) {
      ws.eventSubscriptions = new Set();
    }
    ws.eventSubscriptions.add(`event:${eventId}`);
    console.log(`Client joined event ${eventId}`);
  }

  async handleSendMessage(ws, messageData) {
    try {
      const message = new Message(messageData);
      await message.save();

      // Populate sender information
      await message.populate('sender', 'name pictures');
      if (message.chatType === 'one-to-one') {
        await message.populate('recipient', 'name pictures');
      }

      // Send to appropriate recipients
      if (message.chatType === 'one-to-one') {
        const recipientWs = this.clients.get(message.recipient._id.toString());
        if (recipientWs) {
          this.sendMessage(recipientWs, 'newMessage', message);
        }
        this.sendMessage(ws, 'messageSent', message);
      } else {
        // For group messages, send to all clients subscribed to the event
        this.broadcastToEvent(message.eventId, 'newMessage', message);
        this.sendMessage(ws, 'messageSent', message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      this.sendError(ws, 'Error sending message');
    }
  }

  async handleMarkAsRead(ws, { messageIds, userId }) {
    try {
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          'readBy.userId': { $ne: userId }
        },
        {
          $push: {
            readBy: {
              userId,
              readAt: new Date()
            }
          }
        }
      );
      this.sendMessage(ws, 'messagesRead', { messageIds });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      this.sendError(ws, 'Error marking messages as read');
    }
  }

  handleDisconnect(ws) {
    // Remove from clients map
    for (const [userId, clientWs] of this.clients.entries()) {
      if (clientWs === ws) {
        this.clients.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  }

  sendMessage(ws, type, payload) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }

  sendError(ws, message) {
    this.sendMessage(ws, 'error', { message });
  }

  broadcastToEvent(eventId, type, payload) {
    const eventRoom = `event:${eventId}`;
    for (const ws of this.clients.values()) {
      if (ws.eventSubscriptions?.has(eventRoom)) {
        this.sendMessage(ws, type, payload);
      }
    }
  }
}

module.exports = WebSocketServer; 