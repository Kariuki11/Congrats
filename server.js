const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { config, validateConfig } = require('./config');

const twilioRoutes = require('./routes/twilio');
const conversationRoutes = require('./routes/conversations');
const uploadRoutes = require('./routes/upload');

const app = express();
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
    message: 'WhatsApp Backend Service',
    version: '1.0.0',
    endpoints: {
      webhook: '/twilio/webhook',
      conversations: '/api/conversations',
      upload: '/api/upload',
      health: '/health'
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

// Start server
app.listen(PORT, () => {
  console.log(`WhatsApp Backend Server running on port ${PORT}`);
//   console.log(`Webhook URL: http://localhost:${PORT}/twilio/webhook`);
//   console.log(`Health check: http://localhost:${PORT}/health`);
//   console.log(`Environment: ${config.server.nodeEnv}`);
});

module.exports = app;
