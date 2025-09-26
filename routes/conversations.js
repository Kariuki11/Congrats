const express = require('express');
const twilioService = require('../services/twilioService');
const {
  getConversations,
  getConversation,
  getMessages,
  markConversationAsRead,
  getConversationStats,
  searchMessages
} = require('../services/messageService');
const { config } = require('../config');

const router = express.Router();

/**
 * Get all conversations
 * GET /api/conversations
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await getConversations(parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations',
      message: error.message
    });
  }
});

/**
 * Get conversation by ID
 * GET /api/conversations/:conversationId
 */
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await getConversation(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Get conversation statistics
    const stats = await getConversationStats(conversationId);
    
    res.json({
      success: true,
      data: {
        conversation,
        stats
      }
    });
  } catch (error) {
    console.error(' Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation',
      message: error.message
    });
  }
});

/**
 * Get messages for a conversation
 * GET /api/conversations/:conversationId/messages
 */
router.get('/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // Check if conversation exists
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
    
    const result = await getMessages(conversationId, parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(' Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
      message: error.message
    });
  }
});

/**
 * Send message to conversation
 * POST /api/conversations/:conversationId/messages
 */
router.post('/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text, mediaUrls = [] } = req.body;
    
    if (!text && (!mediaUrls || mediaUrls.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Message text or media is required'
      });
    }
    
    // Get conversation to find the recipient
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
    
    // Format recipient phone number
    const recipientPhone = twilioService.formatPhoneNumber(conversation.participantPhone);
    
    // Send message via Twilio
    const result = await twilioService.sendMessage(recipientPhone, text, mediaUrls);
    
    if (result.success) {
      // Store outbound message
      const outboundMessage = {
        messageSid: result.messageSid,
        from: config.twilio.whatsappNumber,
        to: recipientPhone,
        body: text || '',
        direction: 'outbound',
        timestamp: new Date().toISOString(),
        mediaCount: mediaUrls.length,
        mediaFiles: mediaUrls.map((url, index) => ({
          fileName: `media_${index}`,
          filePath: url,
          contentType: 'unknown',
          index
        })),
        status: result.status
      };

      const { storeMessage } = require('../services/messageService');
      await storeMessage(outboundMessage);
      
      res.json({
        success: true,
        data: {
          messageSid: result.messageSid,
          status: result.status,
          message: 'Message sent successfully'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error(' Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      message: error.message
    });
  }
});

/**
 * Mark conversation as read
 * POST /api/conversations/:conversationId/mark-read
 */
router.post('/:conversationId/mark-read', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const success = await markConversationAsRead(conversationId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Conversation marked as read'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
  } catch (error) {
    console.error(' Error marking conversation as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark conversation as read',
      message: error.message
    });
  }
});

/**
 * Search messages in conversation
 * GET /api/conversations/:conversationId/search
 */
router.get('/:conversationId/search', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { q: query, limit = 20 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    // Check if conversation exists
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
    
    const results = await searchMessages(query, conversationId, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        query,
        results,
        count: results.length
      }
    });
  } catch (error) {
    console.error(' Error searching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search messages',
      message: error.message
    });
  }
});

/**
 * Get conversation statistics
 * GET /api/conversations/:conversationId/stats
 */
router.get('/:conversationId/stats', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Check if conversation exists
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
    
    const stats = await getConversationStats(conversationId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(' Error fetching conversation stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation statistics',
      message: error.message
    });
  }
});

module.exports = router;
