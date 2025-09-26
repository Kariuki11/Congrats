const express = require('express');
const twilioService = require('../services/twilioService');
const { storeMessage, getConversation } = require('../services/messageService');
const { config } = require('../config');

const router = express.Router();

/**
 * Twilio webhook endpoint for receiving WhatsApp messages
 * 
 * 
 * 
 * 
 * POST /twilio/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('Received Twilio webhook:', req.body);

    // Validate Twilio signature for security
    const signature = req.headers['x-twilio-signature'];
    if (!twilioService.validateWebhookSignature(req, signature)) {
      console.error(' Invalid Twilio signature');
      return res.status(403).send('Forbidden');
    }

    const {
      MessageSid,
      From,
      To,
      Body,
      NumMedia,
      MediaUrl0,
      MediaContentType0,
      MediaUrl1,
      MediaContentType1,
      MediaUrl2,
      MediaContentType2,
      MediaUrl3,
      MediaContentType3,
      MediaUrl4,
      MediaContentType4,
      MediaUrl5,
      MediaContentType5,
      MediaUrl6,
      MediaContentType6,
      MediaUrl7,
      MediaContentType7,
      MediaUrl8,
      MediaContentType8,
      MediaUrl9,
      MediaContentType9
    } = req.body;

    // Extract media information
    const mediaFiles = [];
    const numMedia = parseInt(NumMedia) || 0;

    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = req.body[`MediaUrl${i}`];
      const contentType = req.body[`MediaContentType${i}`];
      
      if (mediaUrl && contentType) {
        try {
          console.log(`Downloading media ${i + 1}/${numMedia}: ${contentType}`);
          const mediaInfo = await twilioService.downloadMedia(mediaUrl, contentType);
          mediaFiles.push({
            ...mediaInfo,
            originalUrl: mediaUrl,
            index: i
          });
        } catch (error) {
          console.error(` Failed to download media ${i}:`, error);
        }
      }
    }

    // Create message object
    const message = {
      messageSid: MessageSid,
      from: From,
      to: To,
      body: Body || '',
      direction: 'inbound',
      timestamp: new Date().toISOString(),
      mediaCount: numMedia,
      mediaFiles: mediaFiles,
      status: 'received'
    };

    // Store message (in-memory for now, will be replaced with database)
    await storeMessage(message);

    console.log(`Message stored successfully: ${MessageSid}`);
    console.log(`From: ${From}, To: ${To}`);
    console.log(`Body: ${Body || '(no text)'}`);
    console.log(`Media: ${numMedia} files`);

    // Return TwiML response (empty for webhooks)
    res.type('text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * Twilio status callback endpoint
 * POST /twilio/status
 */
router.post('/status', async (req, res) => {
  try {
    console.log('Received status callback:', req.body);

    const {
      MessageSid,
      MessageStatus,
      ErrorCode,
      ErrorMessage
    } = req.body;

    // Update message status in storage
    // This would typically update the database
    console.log(`Message ${MessageSid} status: ${MessageStatus}`);
    
    if (ErrorCode) {
      console.error(`Message error: ${ErrorCode} - ${ErrorMessage}`);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing status callback:', error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * Test endpoint to send a message
 * POST /twilio/send-test
 */
router.post('/send-test', async (req, res) => {
  try {
    const { to, message, mediaUrls } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['to', 'message']
      });
    }

    const formattedTo = twilioService.formatPhoneNumber(to);
    const result = await twilioService.sendMessage(formattedTo, message, mediaUrls);

    if (result.success) {
      // Store outbound message
      const outboundMessage = {
        messageSid: result.messageSid,
        from: config.twilio.whatsappNumber,
        to: formattedTo,
        body: message,
        direction: 'outbound',
        timestamp: new Date().toISOString(),
        mediaCount: mediaUrls ? mediaUrls.length : 0,
        mediaFiles: mediaUrls ? mediaUrls.map((url, index) => ({
          fileName: `media_${index}`,
          filePath: url,
          contentType: 'unknown',
          index
        })) : [],
        status: result.status
      };

      await storeMessage(outboundMessage);

      res.json({
        success: true,
        messageSid: result.messageSid,
        status: result.status
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error sending test message:', error);
    res.status(500).json({
      error: 'Failed to send message',
      message: error.message
    });
  }
});

module.exports = router;
