const { Server } = require('socket.io');
const { config } = require('../config');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map(); // Map to track connected clients
    this.roomClients = new Map(); // Map to track clients in specific rooms
  }

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.server.nodeEnv === 'production' 
          ? ['https://frontend-domain.com'] 
          : ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupEventHandlers();
    console.log('WebSocket service initialized successfully');
  }

  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // Store client information
      this.connectedClients.set(socket.id, {
        socketId: socket.id,
        connectedAt: new Date(),
        rooms: new Set()
      });

      // Handle client joining a room (e.g., staff dashboard)
      socket.on('join_room', (roomData) => {
        this.handleJoinRoom(socket, roomData);
      });

      // Handle client leaving a room
      socket.on('leave_room', (roomData) => {
        this.handleLeaveRoom(socket, roomData);
      });

      // Handle staff taking over a conversation
      socket.on('takeover_conversation', (data) => {
        this.handleTakeoverConversation(socket, data);
      });

      // Handle AI pause/resume for conversation
      socket.on('toggle_ai_status', (data) => {
        this.handleToggleAiStatus(socket, data);
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', (data) => {
        this.handleTypingStop(socket, data);
      });

      // Handle conversation status updates
      socket.on('update_conversation_status', (data) => {
        this.handleConversationStatusUpdate(socket, data);
      });

      // Handle client disconnect
      socket.on('disconnect', (reason) => {
        this.handleDisconnect(socket, reason);
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to WhatsApp Backend WebSocket',
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Handle client joining a room
   */
  handleJoinRoom(socket, roomData) {
    const { room, userType, userId } = roomData;
    
    if (!room) {
      socket.emit('error', { message: 'Room name is required' });
      return;
    }

    socket.join(room);
    
    // Update client info
    const clientInfo = this.connectedClients.get(socket.id);
    if (clientInfo) {
      clientInfo.rooms.add(room);
      clientInfo.userType = userType;
      clientInfo.userId = userId;
    }

    // Track room membership
    if (!this.roomClients.has(room)) {
      this.roomClients.set(room, new Set());
    }
    this.roomClients.get(room).add(socket.id);

    console.log(`Client ${socket.id} joined room: ${room}`);
    socket.emit('joined_room', { room, userType, userId });
    
    // Notify other clients in the room
    socket.to(room).emit('client_joined', {
      socketId: socket.id,
      userType,
      userId,
      room
    });
  }

  /**
   * Handle client leaving a room
   */
  handleLeaveRoom(socket, roomData) {
    const { room } = roomData;
    
    socket.leave(room);
    
    // Update client info
    const clientInfo = this.connectedClients.get(socket.id);
    if (clientInfo) {
      clientInfo.rooms.delete(room);
    }

    // Update room tracking
    if (this.roomClients.has(room)) {
      this.roomClients.get(room).delete(socket.id);
      if (this.roomClients.get(room).size === 0) {
        this.roomClients.delete(room);
      }
    }

    console.log(`Client ${socket.id} left room: ${room}`);
    socket.emit('left_room', { room });
    
    // Notify other clients in the room
    socket.to(room).emit('client_left', {
      socketId: socket.id,
      room
    });
  }

  /**
   * Handle conversation takeover
   */
  handleTakeoverConversation(socket, data) {
    const { conversationId, staffMember } = data;
    
    console.log(`Staff takeover: ${staffMember} taking over conversation ${conversationId}`);
    
    // Broadcast to all staff in the room
    this.io.to('staff_dashboard').emit('conversation_takeover', {
      conversationId,
      staffMember,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle AI status toggle
   */
  handleToggleAiStatus(socket, data) {
    const { conversationId, aiPaused, staffMember } = data;
    
    console.log(`AI status change: Conversation ${conversationId}, Paused: ${aiPaused}, By: ${staffMember}`);
    
    // Broadcast to all staff
    this.io.to('staff_dashboard').emit('ai_status_change', {
      conversationId,
      aiPaused,
      staffMember,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle typing indicators
   */
  handleTypingStart(socket, data) {
    const { conversationId, sender, senderName } = data;
    
    socket.to('staff_dashboard').emit('typing_start', {
      conversationId,
      sender,
      senderName,
      timestamp: new Date().toISOString()
    });
  }

  handleTypingStop(socket, data) {
    const { conversationId, sender } = data;
    
    socket.to('staff_dashboard').emit('typing_stop', {
      conversationId,
      sender,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle conversation status updates
   */
  handleConversationStatusUpdate(socket, data) {
    const { conversationId, status, staffMember } = data;
    
    console.log(`Conversation status update: ${conversationId} -> ${status}`);
    
    // Broadcast to all staff
    this.io.to('staff_dashboard').emit('conversation_update', {
      conversationId,
      status,
      staffMember,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle client disconnect
   */
  handleDisconnect(socket, reason) {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    
    const clientInfo = this.connectedClients.get(socket.id);
    if (clientInfo) {
      // Notify all rooms that client was in
      clientInfo.rooms.forEach(room => {
        socket.to(room).emit('client_left', {
          socketId: socket.id,
          room,
          reason
        });
      });
      
      this.connectedClients.delete(socket.id);
    }
  }

  /**
   * Broadcast new message to staff dashboard
   */
  broadcastNewMessage(messageData) {
    console.log('Broadcasting new message to staff dashboard');
    this.io.to('staff_dashboard').emit('message', {
      ...messageData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast conversation update
   */
  broadcastConversationUpdate(conversationData) {
    console.log('Broadcasting conversation update to staff dashboard');
    this.io.to('staff_dashboard').emit('conversation_update', {
      ...conversationData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast user update
   */
  broadcastUserUpdate(userData) {
    console.log('Broadcasting user update to staff dashboard');
    this.io.to('staff_dashboard').emit('user_update', {
      ...userData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast system notification
   */
  broadcastSystemNotification(notification) {
    console.log('Broadcasting system notification');
    this.io.to('staff_dashboard').emit('system_notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount() {
    return this.connectedClients.size;
  }

  /**
   * Get clients in specific room
   */
  getClientsInRoom(room) {
    return this.roomClients.get(room)?.size || 0;
  }

  /**
   * Get all connected clients info
   */
  getConnectedClientsInfo() {
    return Array.from(this.connectedClients.values());
  }

  /**
   * Send message to specific client
   */
  sendToClient(socketId, event, data) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, data);
      return true;
    }
    return false;
  }

  /**
   * Send message to all clients in a room
   */
  sendToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event, data) {
    this.io.emit(event, data);
  }
}

module.exports = new WebSocketService();
