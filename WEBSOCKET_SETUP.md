# WebSocket Implementation Guide

## Overview

The WhatsApp Backend now includes comprehensive WebSocket support for real-time communication between the backend and frontend applications. This enables live updates for messages, conversation status changes, and staff interactions.

## 🚀 Features

- **Real-time Message Broadcasting**: New messages are instantly pushed to connected clients
- **Conversation Updates**: Live updates when conversation status changes
- **Staff Dashboard Integration**: Dedicated room for staff monitoring
- **AI Control Events**: Real-time AI pause/resume notifications
- **Typing Indicators**: Live typing status for better UX
- **System Notifications**: Broadcast important system events
- **Client Management**: Track and manage connected clients

## 📡 WebSocket Events

### Client-to-Server Events (Frontend → Backend)

#### Connection Events
- `join_room` - Join a specific room (e.g., 'staff_dashboard')
- `leave_room` - Leave a room
- `disconnect` - Client disconnects

#### Conversation Management
- `takeover_conversation` - Staff takes over a conversation
- `toggle_ai_status` - Pause/resume AI for a conversation
- `update_conversation_status` - Update conversation status

#### Typing Indicators
- `typing_start` - User starts typing
- `typing_stop` - User stops typing

### Server-to-Client Events (Backend → Frontend)

#### Message Events
- `message` - New message received/sent
- `conversation_update` - Conversation status or data changed

#### Control Events
- `conversation_takeover` - Staff member took over conversation
- `ai_status_change` - AI was paused/resumed
- `user_update` - User information updated

#### System Events
- `system_notification` - Important system notification
- `client_joined` - New client joined room
- `client_left` - Client left room
- `connected` - Welcome message on connection

## 🏗️ Architecture

```
Frontend (React)          Backend (Node.js)
     │                           │
     │  WebSocket Connection     │
     ├───────────────────────────┤
     │                           │
     │  Socket.IO Events         │
     ├───────────────────────────┤
     │                           │
     │  Real-time Updates        │
     └───────────────────────────┘
```

## 🔧 Setup and Configuration

### 1. WebSocket Service Initialization

The WebSocket service is automatically initialized when the server starts:

```javascript
// In server.js
const websocketService = require('./services/websocketService');
websocketService.initialize(server);
```

### 2. CORS Configuration

WebSocket connections are configured with appropriate CORS settings:

```javascript
// Development
origin: ['http://localhost:3000', 'http://localhost:3001']

// Production
origin: ['https://frontend-domain.com']
```

### 3. Room Management

The system uses Socket.IO rooms for organized communication:

- `staff_dashboard` - For staff monitoring interface
- `conversation_{id}` - For specific conversation monitoring (future)

## 📊 API Endpoints

### WebSocket Management

#### `GET /api/websocket/stats`
Get WebSocket connection statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "connectedClients": 3,
    "staffDashboardClients": 2,
    "connectedClientsInfo": [
      {
        "socketId": "abc123",
        "connectedAt": "2024-01-26T14:00:00Z",
        "userType": "staff",
        "userId": "staff_001"
      }
    ]
  }
}
```

#### `POST /api/websocket/test-notification`
Send a test notification to staff dashboard.

**Request:**
```json
{
  "message": "Test notification message",
  "type": "info"
}
```

#### `POST /api/websocket/send-to-client`
Send message to specific client.

**Request:**
```json
{
  "socketId": "abc123",
  "event": "custom_event",
  "data": { "message": "Hello client!" }
}
```

#### `POST /api/websocket/send-to-room`
Send message to all clients in a room.

**Request:**
```json
{
  "room": "staff_dashboard",
  "event": "custom_event",
  "data": { "message": "Hello room!" }
}
```

#### `POST /api/websocket/broadcast`
Broadcast message to all connected clients.

**Request:**
```json
{
  "event": "system_announcement",
  "data": { "message": "System maintenance in 10 minutes" }
}
```

### Simulation Endpoints (Testing)

#### `POST /api/websocket/simulate-takeover`
Simulate conversation takeover.

**Request:**
```json
{
  "conversationId": "conv_1234567890_14155238886",
  "staffMember": "John Doe"
}
```

#### `POST /api/websocket/simulate-ai-status`
Simulate AI status change.

**Request:**
```json
{
  "conversationId": "conv_1234567890_14155238886",
  "aiPaused": true,
  "staffMember": "John Doe"
}
```

#### `POST /api/websocket/simulate-message`
Simulate new message.

**Request:**
```json
{
  "conversationId": "conv_1234567890_14155238886",
  "from": "whatsapp:+1234567890",
  "to": "whatsapp:+14155238886",
  "body": "Hello from simulation!",
  "direction": "inbound"
}
```

## 🧪 Testing WebSocket Implementation

### 1. Start the Server

```bash
npm start
# or
npm run dev
```

### 2. Test WebSocket Connection

You can test WebSocket functionality using various methods:

#### Using curl for API endpoints:
```bash
# Get WebSocket stats
curl http://localhost:3000/api/websocket/stats

# Send test notification
curl -X POST http://localhost:3000/api/websocket/test-notification \
  -H "Content-Type: application/json" \
  -d '{"message": "Test notification", "type": "info"}'

# Simulate conversation takeover
curl -X POST http://localhost:3000/api/websocket/simulate-takeover \
  -H "Content-Type: application/json" \
  -d '{"conversationId": "conv_test", "staffMember": "Test Staff"}'
```

#### Using a WebSocket client:
```javascript
// Connect to WebSocket
const socket = io('http://localhost:3000');

// Join staff dashboard
socket.emit('join_room', {
  room: 'staff_dashboard',
  userType: 'staff',
  userId: 'test_staff'
});

// Listen for events
socket.on('message', (data) => {
  console.log('New message:', data);
});

socket.on('conversation_update', (data) => {
  console.log('Conversation updated:', data);
});

socket.on('system_notification', (data) => {
  console.log('System notification:', data);
});
```

## 🔄 Integration with Existing Services

### Message Service Integration

The WebSocket service is automatically integrated with the message service:

```javascript
// In messageService.js
// When a new message is stored
websocketService.broadcastNewMessage({
  messageId,
  conversationId,
  from: message.from,
  to: message.to,
  body: message.body,
  direction: message.direction,
  timestamp: message.timestamp,
  mediaCount: message.mediaCount,
  mediaFiles: message.mediaFiles
});
```

### Conversation Updates

Conversation updates are automatically broadcasted:

```javascript
// When conversation status changes
websocketService.broadcastConversationUpdate({
  conversationId,
  lastMessage: conversation.lastMessage,
  lastMessageAt: conversation.lastMessageAt,
  messageCount: conversation.messageCount,
  unreadCount: conversation.unreadCount,
  status: conversation.status
});
```

## 🎯 Frontend Integration (React)

### Basic WebSocket Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket']
});

// Join staff dashboard room
socket.emit('join_room', {
  room: 'staff_dashboard',
  userType: 'staff',
  userId: 'current_user_id'
});

// Listen for real-time updates
socket.on('message', (messageData) => {
  // Update message list
  setMessages(prev => [...prev, messageData]);
});

socket.on('conversation_update', (conversationData) => {
  // Update conversation list
  setConversations(prev => 
    prev.map(conv => 
      conv.id === conversationData.conversationId 
        ? { ...conv, ...conversationData }
        : conv
    )
  );
});
```

### Staff Actions

```javascript
// Take over conversation
const handleTakeover = (conversationId) => {
  socket.emit('takeover_conversation', {
    conversationId,
    staffMember: currentUser.name
  });
};

// Toggle AI status
const handleToggleAI = (conversationId, aiPaused) => {
  socket.emit('toggle_ai_status', {
    conversationId,
    aiPaused,
    staffMember: currentUser.name
  });
};

// Update conversation status
const handleStatusUpdate = (conversationId, status) => {
  socket.emit('update_conversation_status', {
    conversationId,
    status,
    staffMember: currentUser.name
  });
};
```

## 🔒 Security Considerations

1. **CORS Configuration**: Properly configured for development and production
2. **Room Access**: Staff dashboard room requires proper authentication (to be implemented)
3. **Rate Limiting**: Consider implementing rate limiting for WebSocket events
4. **Input Validation**: All WebSocket events are validated before processing

## 🚀 Production Deployment

### Environment Variables

```env
# WebSocket Configuration
NODE_ENV=production
WEBSOCKET_ENABLED=true
WEBSOCKET_CORS_ORIGINS=https://your-frontend-domain.com
```

### Load Balancer Considerations

When using a load balancer, ensure WebSocket connections are sticky or use Redis adapter:

```javascript
const redisAdapter = require('socket.io-redis');
io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));
```

## 📝 Event Schema Reference

### Message Event
```typescript
interface MessageEvent {
  messageId: string;
  conversationId: string;
  from: string;
  to: string;
  body: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
  mediaCount: number;
  mediaFiles: MediaFile[];
}
```

### Conversation Update Event
```typescript
interface ConversationUpdateEvent {
  conversationId: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  unreadCount: number;
  status: 'active' | 'closed' | 'needs_attention' | 'human_takeover';
  isNew?: boolean;
}
```

### AI Status Change Event
```typescript
interface AIStatusChangeEvent {
  conversationId: string;
  aiPaused: boolean;
  staffMember: string;
  timestamp: string;
}
```

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check CORS configuration
   - Verify server is running on correct port
   - Ensure firewall allows WebSocket connections

2. **Events Not Received**
   - Verify client is in correct room
   - Check event names match exactly
   - Confirm server is broadcasting events

3. **Multiple Connections**
   - Check for multiple socket instances
   - Ensure proper cleanup on component unmount

### Debug Mode

Enable debug logging by setting environment variable:
```env
DEBUG=socket.io:*
```

## 📈 Monitoring

Monitor WebSocket connections using the stats endpoint:
```bash
curl http://localhost:3000/api/websocket/stats
```

Track:
- Connected clients count
- Staff dashboard clients
- Connection duration
- Event frequency

## 🎉 Conclusion

The WebSocket implementation provides a robust foundation for real-time communication between your WhatsApp backend and React frontend. It enables live updates, staff control, and seamless user experience.

For questions or issues, check the server logs and use the testing endpoints to verify functionality.
