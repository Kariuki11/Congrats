const { v4: uuidv4 } = require('uuid');

// In-memory storage for development
// This will be replaced with Supabase database later
let conversations = new Map();
let messages = new Map();

class MessageService {
  constructor() {
    console.log('MessageService initialized with in-memory storage');
  }

  /**
   * Store a message
   */
  async storeMessage(messageData) {
    const messageId = uuidv4();
    const conversationId = this.getConversationId(messageData.from, messageData.to);
    
    const message = {
      id: messageId,
      conversationId,
      ...messageData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store message
    messages.set(messageId, message);

    // Update conversation
    await this.updateConversation(conversationId, message);

    console.log(`Message stored: ${messageId} in conversation: ${conversationId}`);
    return message;
  }

  /**
   * Get conversation ID from phone numbers
   */
  getConversationId(from, to) {
    // Normalize phone numbers and create consistent conversation ID
    const numbers = [from, to].map(num => num.replace('whatsapp:', '').replace('+', '')).sort();
    return `conv_${numbers.join('_')}`;
  }

  /**
   * Update conversation with latest message
   */
  async updateConversation(conversationId, message) {
    const existing = conversations.get(conversationId);
    
    if (existing) {
      existing.lastMessage = message.body;
      existing.lastMessageAt = message.timestamp;
      existing.lastMessageDirection = message.direction;
      existing.messageCount += 1;
      existing.updatedAt = new Date().toISOString();
      
      // Update unread count
      if (message.direction === 'inbound') {
        existing.unreadCount += 1;
      }
    } else {
      // Create new conversation
      const conversation = {
        id: conversationId,
        participantPhone: message.direction === 'inbound' ? message.from : message.to,
        companyPhone: message.direction === 'inbound' ? message.to : message.from,
        lastMessage: message.body,
        lastMessageAt: message.timestamp,
        lastMessageDirection: message.direction,
        messageCount: 1,
        unreadCount: message.direction === 'inbound' ? 1 : 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      conversations.set(conversationId, conversation);
    }
  }

  /**
   * Get all conversations
   */
  async getConversations(limit = 50, offset = 0) {
    const conversationList = Array.from(conversations.values())
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      .slice(offset, offset + limit);

    return {
      conversations: conversationList,
      total: conversations.size,
      limit,
      offset
    };
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId) {
    return conversations.get(conversationId);
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId, limit = 50, offset = 0) {
    const conversationMessages = Array.from(messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(offset, offset + limit);

    return {
      messages: conversationMessages,
      total: Array.from(messages.values()).filter(msg => msg.conversationId === conversationId).length,
      limit,
      offset
    };
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(conversationId) {
    const conversation = conversations.get(conversationId);
    if (conversation) {
      conversation.unreadCount = 0;
      conversation.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Get message by ID
   */
  async getMessage(messageId) {
    return messages.get(messageId);
  }

  /**
   * Update message status
   */
  async updateMessageStatus(messageId, status, errorCode = null, errorMessage = null) {
    const message = messages.get(messageId);
    if (message) {
      message.status = status;
      message.errorCode = errorCode;
      message.errorMessage = errorMessage;
      message.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Search messages
   */
  async searchMessages(query, conversationId = null, limit = 20) {
    let messageList = Array.from(messages.values());
    
    if (conversationId) {
      messageList = messageList.filter(msg => msg.conversationId === conversationId);
    }
    
    const results = messageList
      .filter(msg => msg.body.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return results;
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(conversationId) {
    const conversationMessages = Array.from(messages.values())
      .filter(msg => msg.conversationId === conversationId);

    const stats = {
      totalMessages: conversationMessages.length,
      inboundMessages: conversationMessages.filter(msg => msg.direction === 'inbound').length,
      outboundMessages: conversationMessages.filter(msg => msg.direction === 'outbound').length,
      messagesWithMedia: conversationMessages.filter(msg => msg.mediaCount > 0).length,
      firstMessageAt: conversationMessages.length > 0 
        ? conversationMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0].timestamp
        : null,
      lastMessageAt: conversationMessages.length > 0
        ? conversationMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0].timestamp
        : null
    };

    return stats;
  }

  /**
   * Clear all data (for testing)
   */
  async clearAllData() {
    conversations.clear();
    messages.clear();
    console.log('All message data cleared');
  }
}

// Export singleton instance
const messageService = new MessageService();

// Export individual functions for backward compatibility
const storeMessage = (messageData) => messageService.storeMessage(messageData);
const getConversations = (limit, offset) => messageService.getConversations(limit, offset);
const getConversation = (conversationId) => messageService.getConversation(conversationId);
const getMessages = (conversationId, limit, offset) => messageService.getMessages(conversationId, limit, offset);
const markConversationAsRead = (conversationId) => messageService.markConversationAsRead(conversationId);
const getMessage = (messageId) => messageService.getMessage(messageId);
const updateMessageStatus = (messageId, status, errorCode, errorMessage) => 
  messageService.updateMessageStatus(messageId, status, errorCode, errorMessage);
const searchMessages = (query, conversationId, limit) => 
  messageService.searchMessages(query, conversationId, limit);
const getConversationStats = (conversationId) => messageService.getConversationStats(conversationId);
const clearAllData = () => messageService.clearAllData();

module.exports = {
  messageService,
  storeMessage,
  getConversations,
  getConversation,
  getMessages,
  markConversationAsRead,
  getMessage,
  updateMessageStatus,
  searchMessages,
  getConversationStats,
  clearAllData
};
