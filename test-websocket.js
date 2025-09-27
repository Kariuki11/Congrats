#!/usr/bin/env node

/**
 * WebSocket Testing Script
 * 
 * This script demonstrates how to test the WebSocket implementation
 * Run with: node test-websocket.js
 */

const { io } = require('socket.io-client');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const SOCKET_OPTIONS = {
  transports: ['websocket'],
  autoConnect: true
};

console.log('🚀 Starting WebSocket Test...');
console.log(`📡 Connecting to: ${SERVER_URL}`);

// Create socket connection
const socket = io(SERVER_URL, SOCKET_OPTIONS);

// Connection event handlers
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log(`🔌 Socket ID: ${socket.id}`);
  
  // Join staff dashboard room
  socket.emit('join_room', {
    room: 'staff_dashboard',
    userType: 'staff',
    userId: 'test_staff_001'
  });
});

socket.on('connected', (data) => {
  console.log('🎉 Received welcome message:', data.message);
});

socket.on('joined_room', (data) => {
  console.log(`🏠 Joined room: ${data.room} as ${data.userType}`);
  
  // Test conversation takeover
  setTimeout(() => {
    console.log('👤 Testing conversation takeover...');
    socket.emit('takeover_conversation', {
      conversationId: 'conv_test_123',
      staffMember: 'Test Staff Member'
    });
  }, 2000);
  
  // Test AI status toggle
  setTimeout(() => {
    console.log('🤖 Testing AI status toggle...');
    socket.emit('toggle_ai_status', {
      conversationId: 'conv_test_123',
      aiPaused: true,
      staffMember: 'Test Staff Member'
    });
  }, 4000);
  
  // Test conversation status update
  setTimeout(() => {
    console.log('📊 Testing conversation status update...');
    socket.emit('update_conversation_status', {
      conversationId: 'conv_test_123',
      status: 'needs_attention',
      staffMember: 'Test Staff Member'
    });
  }, 6000);
});

// Event listeners for testing
socket.on('conversation_takeover', (data) => {
  console.log('🎯 Conversation takeover event:', data);
});

socket.on('ai_status_change', (data) => {
  console.log('🤖 AI status change event:', data);
});

socket.on('conversation_update', (data) => {
  console.log('📊 Conversation update event:', data);
});

socket.on('message', (data) => {
  console.log('💬 New message event:', data);
});

socket.on('system_notification', (data) => {
  console.log('🔔 System notification event:', data);
});

socket.on('client_joined', (data) => {
  console.log('👋 Client joined event:', data);
});

socket.on('client_left', (data) => {
  console.log('👋 Client left event:', data);
});

// Error handling
socket.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.log('💡 Make sure the server is running on port 3000');
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log(`🔌 Disconnected: ${reason}`);
  
  if (reason === 'io server disconnect') {
    console.log('🔄 Server disconnected the client, trying to reconnect...');
    socket.connect();
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket test...');
  socket.disconnect();
  process.exit(0);
});

// Keep the process alive
console.log('⏳ WebSocket test running... Press Ctrl+C to exit');
console.log('📋 Monitor the events above to verify WebSocket functionality');

// Test API endpoints
async function testAPIEndpoints() {
  const fetch = require('node-fetch');
  
  try {
    console.log('\n🧪 Testing API endpoints...');
    
    // Test WebSocket stats
    const statsResponse = await fetch(`${SERVER_URL}/api/websocket/stats`);
    const stats = await statsResponse.json();
    console.log('📊 WebSocket stats:', stats.data);
    
    // Test notification
    const notificationResponse = await fetch(`${SERVER_URL}/api/websocket/test-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Test notification from script',
        type: 'info'
      })
    });
    const notification = await notificationResponse.json();
    console.log('🔔 Test notification sent:', notification.message);
    
  } catch (error) {
    console.error('❌ API test error:', error.message);
  }
}

// Run API tests after a delay
setTimeout(testAPIEndpoints, 8000);
