const twilio = require('twilio');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { config } = require('../config');

class TwilioService {
  constructor() {
    // Initialize Twilio client only if credentials are provided
    if (config.twilio.accountSid && config.twilio.authToken) {
      this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
      console.log('Twilio client initialized successfully');
      console.log(`WhatsApp Number: ${config.twilio.whatsappNumber}`);
      console.log(`Webhook URL: ${config.twilio.webhookUrl || 'Not set'}`);
    } else {
      this.client = null;
      console.log('Twilio credentials not configured');
      console.log('Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env file');
    }
    
    this.whatsappNumber = config.twilio.whatsappNumber;
    this.uploadDir = config.upload.directory;
    
    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch (error) {
      await fs.mkdir(this.uploadDir, { recursive: true });
      console.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  /**
   * Validate Twilio webhook signature
   */
  validateWebhookSignature(req, signature) {
    if (!config.twilio.authToken) {
      console.log('Skipping webhook validation - no auth token configured');
      return true; // Skip validation in development
    }
    
    const twilioSignature = req.headers['x-twilio-signature'];
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    
    return twilio.validateRequest(
      config.twilio.authToken,
      twilioSignature,
      url,
      req.body
    );
  }

  /**
   * Download media from Twilio URL
   */
  async downloadMedia(mediaUrl, contentType) {
    try {
      const response = await axios.get(mediaUrl, {
        responseType: 'stream',
        auth: {
          username: config.twilio.accountSid,
          password: config.twilio.authToken
        }
      });

      const fileExtension = this.getFileExtension(contentType);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(this.uploadDir, fileName);

      const writer = require('fs').createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          resolve({
            fileName,
            filePath,
            contentType,
            size: response.headers['content-length']
          });
        });
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading media:', error);
      throw new Error('Failed to download media');
    }
  }

  /**
   * Get file extension from content type
   */
  getFileExtension(contentType) {
    const extensions = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'audio/ogg': '.ogg',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'video/mp4': '.mp4',
      'video/3gpp': '.3gp',
      'application/pdf': '.pdf',
      'text/plain': '.txt',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/msword': '.doc'
    };
    return extensions[contentType] || '.bin';
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(to, message, mediaUrls = []) {
    if (!this.client) {
      console.log('Twilio client not initialized - cannot send message');
      return {
        success: false,
        error: 'Twilio client not initialized. Please set credentials in .env file',
        code: 'NO_CREDENTIALS'
      };
    }

    try {
      const messageData = {
        from: this.whatsappNumber,
        to: to,
        body: message
      };

      // Add media if provided
      if (mediaUrls && mediaUrls.length > 0) {
        messageData.mediaUrl = mediaUrls;
      }

      const messageResponse = await this.client.messages.create(messageData);
      
      console.log(`Message sent successfully: ${messageResponse.sid}`);
      return {
        success: true,
        messageSid: messageResponse.sid,
        status: messageResponse.status,
        data: messageResponse
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageSid) {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    try {
      const message = await this.client.messages(messageSid).fetch();
      return {
        sid: message.sid,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };
    } catch (error) {
      console.error('Error fetching message status:', error);
      throw error;
    }
  }

  /**
   * Format phone number for WhatsApp
   */
  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add whatsapp: prefix if not already present
    if (cleaned.startsWith('whatsapp:')) {
      return cleaned;
    }
    
    // Add country code if not present (assuming US +1)
    const formatted = cleaned.startsWith('1') ? cleaned : `1${cleaned}`;
    return `whatsapp:+${formatted}`;
  }
}

module.exports = new TwilioService();
