const express = require('express');
const websocketService = require('../services/websocketService');

const router = express.Router();

/**
 * Get WebSocket connection statistics
 * GET /api/websocket/stats
 */
router.get('/stats', (req, res) => {
  try {
    const stats = {
      connectedClients: websocketService.getConnectedClientsCount(),
      staffDashboardClients: websocketService.getClientsInRoom('staff_dashboard'),
      connectedClientsInfo: websocketService.getConnectedClientsInfo()
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting WebSocket stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get WebSocket statistics',
      message: error.message
    });
  }
});

/**
 * Send test notification to staff dashboard
 * POST /api/websocket/test-notification
 */
router.post('/test-notification', (req, res) => {
  try {
    const { message, type = 'info' } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    websocketService.broadcastSystemNotification({
      message,
      type,
      source: 'api_test'
    });

    res.json({
      success: true,
      message: 'Test notification sent to staff dashboard',
      data: {
        message,
        type,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification',
      message: error.message
    });
  }
});

/**
 * Send message to specific client
 * POST /api/websocket/send-to-client
 */
router.post('/send-to-client', (req, res) => {
  try {
    const { socketId, event, data } = req.body;

    if (!socketId || !event) {
      return res.status(400).json({
        success: false,
        error: 'socketId and event are required'
      });
    }

    const success = websocketService.sendToClient(socketId, event, data);

    if (success) {
      res.json({
        success: true,
        message: `Message sent to client ${socketId}`,
        data: {
          socketId,
          event,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Client not found or not connected'
      });
    }
  } catch (error) {
    console.error('Error sending message to client:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message to client',
      message: error.message
    });
  }
});

/**
 * Send message to room
 * POST /api/websocket/send-to-room
 */
router.post('/send-to-room', (req, res) => {
  try {
    const { room, event, data } = req.body;

    if (!room || !event) {
      return res.status(400).json({
        success: false,
        error: 'room and event are required'
      });
    }

    websocketService.sendToRoom(room, event, data);

    res.json({
      success: true,
      message: `Message sent to room ${room}`,
      data: {
        room,
        event,
        clientsInRoom: websocketService.getClientsInRoom(room),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error sending message to room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message to room',
      message: error.message
    });
  }
});

/**
 * Broadcast message to all clients
 * POST /api/websocket/broadcast
 */
router.post('/broadcast', (req, res) => {
  try {
    const { event, data } = req.body;

    if (!event) {
      return res.status(400).json({
        success: false,
        error: 'event is required'
      });
    }

    websocketService.broadcast(event, data);

    res.json({
      success: true,
      message: 'Message broadcasted to all clients',
      data: {
        event,
        connectedClients: websocketService.getConnectedClientsCount(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error broadcasting message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast message',
      message: error.message
    });
  }
});

/**
 * Simulate conversation takeover
 * POST /api/websocket/simulate-takeover
 */
router.post('/simulate-takeover', (req, res) => {
  try {
    const { conversationId, staffMember = 'Test Staff' } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        error: 'conversationId is required'
      });
    }

    websocketService.sendToRoom('staff_dashboard', 'conversation_takeover', {
      conversationId,
      staffMember,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Conversation takeover simulated',
      data: {
        conversationId,
        staffMember,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error simulating takeover:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate takeover',
      message: error.message
    });
  }
});

/**
 * Simulate AI status change
 * POST /api/websocket/simulate-ai-status
 */
router.post('/simulate-ai-status', (req, res) => {
  try {
    const { conversationId, aiPaused, staffMember = 'Test Staff' } = req.body;

    if (!conversationId || typeof aiPaused !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'conversationId and aiPaused (boolean) are required'
      });
    }

    websocketService.sendToRoom('staff_dashboard', 'ai_status_change', {
      conversationId,
      aiPaused,
      staffMember,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'AI status change simulated',
      data: {
        conversationId,
        aiPaused,
        staffMember,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error simulating AI status change:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate AI status change',
      message: error.message
    });
  }
});

/**
 * Simulate new message
 * POST /api/websocket/simulate-message
 */
router.post('/simulate-message', (req, res) => {
  try {
    const { 
      conversationId, 
      from = 'whatsapp:+1234567890', 
      to = 'whatsapp:+14155238886',
      body = 'Test message from simulation',
      direction = 'inbound'
    } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        error: 'conversationId is required'
      });
    }

    websocketService.broadcastNewMessage({
      messageId: `test_${Date.now()}`,
      conversationId,
      from,
      to,
      body,
      direction,
      timestamp: new Date().toISOString(),
      mediaCount: 0,
      mediaFiles: []
    });

    res.json({
      success: true,
      message: 'New message simulated',
      data: {
        conversationId,
        from,
        to,
        body,
        direction,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error simulating message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate message',
      message: error.message
    });
  }
});

module.exports = router;
