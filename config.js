// Configuration file for WhatsApp Backend
require('dotenv').config();

const config = {
  // Twilio Configuration
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
    webhookUrl: process.env.TWILIO_WEBHOOK_URL || ''
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // File Upload Configuration
  upload: {
    directory: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },

  // Security
  security: {
    webhookSecret: process.env.WEBHOOK_SECRET || ''
  }
};

// Validation function
function validateConfig() {
  const errors = [];
  
  if (!config.twilio.accountSid) {
    errors.push('TWILIO_ACCOUNT_SID is required');
  }
  
  if (!config.twilio.authToken) {
    errors.push('TWILIO_AUTH_TOKEN is required');
  }
  
  if (errors.length > 0) {
    console.log('Configuration warnings:');
    errors.forEach(error => console.log(`   - ${error}`));
    console.log('   Please set these in your .env file for full functionality\n');
  } else {
    console.log('All Twilio configuration is set');
  }
  
  return errors.length === 0;
}

module.exports = {
  config,
  validateConfig
};
