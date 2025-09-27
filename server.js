const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { config, validateConfig } = require('./config');
const websocketService = require('./services/websocketService');

const twilioRoutes = require('./routes/twilio');
const conversationRoutes = require('./routes/conversations');
const uploadRoutes = require('./routes/upload');
const websocketRoutes = require('./routes/websocket');

const app = express();
const server = http.createServer(app);
const PORT = config.server.port;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.server.nodeEnv === 'production' 
    ? ['https://frontend-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/twilio', twilioRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/websocket', websocketRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'WhatsApp Backend'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'WhatsApp Backend Service with WebSocket Support',
    version: '1.0.0',
    features: {
      whatsapp: 'Twilio integration',
      websocket: 'Real-time communication',
      conversations: 'Message management',
      uploads: 'File handling'
    },
    endpoints: {
      webhook: '/twilio/webhook',
      conversations: '/api/conversations',
      upload: '/api/upload',
      websocket: '/api/websocket',
      health: '/health'
    },
    websocket: {
      enabled: true,
      events: [
        'message',
        'conversation_update',
        'user_update',
        'system_notification',
        'conversation_takeover',
        'ai_status_change',
        'typing_start',
        'typing_stop'
      ]
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Validate configuration
validateConfig();

// Initialize WebSocket service
websocketService.initialize(server);

// Start server
server.listen(PORT, () => {
  console.log(`WhatsApp Backend Server running on port ${PORT}`);
  console.log(`WebSocket server initialized`);
  console.log(`Webhook URL: http://localhost:${PORT}/twilio/webhook`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Environment: ${config.server.nodeEnv}`);
});

module.exports = { app, server };
