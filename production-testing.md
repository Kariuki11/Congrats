# Production Testing Guide

## 🚀 Testing Your WhatsApp Backend in Production

### Prerequisites
- ✅ Your backend is deployed to production
- ✅ Twilio credentials are configured
- ✅ Webhook URL is set in Twilio Console
- ✅ Your WhatsApp number: +254733573911

## 📋 Step-by-Step Testing Process

### 1. Update Production Configuration

Make sure your production `.env` file has:
```env
TWILIO_ACCOUNT_SID=your_production_account_sid
TWILIO_AUTH_TOKEN=your_production_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_WEBHOOK_URL=https://your-production-domain.com/twilio/webhook
NODE_ENV=production
```

### 2. Test Health Endpoint
```bash
curl https://your-production-domain.com/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-09-26T18:00:00.000Z",
  "service": "WhatsApp Backend"
}
```

### 3. Test Message Sending

Send a test message to your number:
```bash
curl -X POST https://your-production-domain.com/twilio/send-test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "whatsapp:+254733573911",
    "message": "Hello! This is a test message from your production backend."
  }'
```

### 4. Test Webhook Reception

1. **Send a WhatsApp message** from your phone (+254733573911) to your Twilio WhatsApp number
2. **Check your production logs** - you should see the message received
3. **Verify in API** - check conversations endpoint:
```bash
curl https://your-production-domain.com/api/conversations
```

### 5. Test Complete Conversation Flow

1. **Send message from backend** to your phone
2. **Reply from your phone** to the Twilio number
3. **Check conversations API** to see both messages
4. **Send another message** from backend
5. **Verify the conversation thread** is working

## 🔧 Testing Commands

### Quick Test Script
```bash
# Update the PRODUCTION_URL in test-production.js
node test-production.js
```

### Manual API Testing
```bash
# Health check
curl https://your-domain.com/health

# Get conversations
curl https://your-domain.com/api/conversations

# Send message
curl -X POST https://your-domain.com/twilio/send-test \
  -H "Content-Type: application/json" \
  -d '{"to": "whatsapp:+254733573911", "message": "Test message"}'

# Get specific conversation
curl https://your-domain.com/api/conversations/conv_254733573911_14155238886
```

## 📱 WhatsApp Testing Scenarios

### Scenario 1: Basic Text Message
1. Send text message from backend
2. Reply with text from phone
3. Verify both messages appear in conversations

### Scenario 2: Media Message
1. Upload a file via `/api/upload`
2. Send message with media URL
3. Verify media is received on phone

### Scenario 3: Multiple Messages
1. Send several messages in sequence
2. Reply to each message
3. Verify conversation thread is maintained

## 🚨 Troubleshooting

### Common Issues

1. **Message not sending:**
   - Check Twilio credentials
   - Verify phone number format
   - Check Twilio Console for errors

2. **Webhook not receiving:**
   - Verify webhook URL in Twilio Console
   - Check server logs for incoming requests
   - Ensure webhook URL is accessible

3. **Conversations not updating:**
   - Check message storage
   - Verify webhook is processing messages
   - Check API endpoints

### Debug Commands
```bash
# Check server logs
tail -f /var/log/your-app.log

# Test webhook manually
curl -X POST https://your-domain.com/twilio/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=test&From=whatsapp:+254733573911&To=whatsapp:+14155238886&Body=Test"
```

## ✅ Success Criteria

Your production setup is working when:
- ✅ Health endpoint responds
- ✅ Messages send successfully to your phone
- ✅ Messages received from your phone appear in conversations
- ✅ Conversation thread is maintained
- ✅ Media messages work (if needed)

## 📞 Your Test Number
- **Phone:** +254733573911
- **WhatsApp Format:** whatsapp:+254733573911
- **Test Message:** "Hello from production backend!"

## 🎯 Next Steps After Testing
1. Test with multiple phone numbers
2. Test media uploads and downloads
3. Test conversation management features
4. Monitor production logs
5. Set up monitoring and alerts

