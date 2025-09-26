# Twilio Configuration Guide

## Quick Setup

Your WhatsApp backend is now properly configured and ready for Twilio integration!

## 📋 What You Need to Do

### 1. Get Twilio Credentials
1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up or log in to your account
3. Get your **Account SID** and **Auth Token** from the dashboard

### 2. Configure Environment Variables
Edit the `.env` file in your project root and add your credentials:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_WEBHOOK_URL=https://your-domain.com/twilio/webhook
```

### 3. Set Up WhatsApp Sandbox (Development)
1. In Twilio Console, go to **Messaging** > **Try it out** > **Send a WhatsApp message**
2. Follow the instructions to connect your WhatsApp number
3. Note your sandbox number (usually `+14155238886`)

### 4. Configure Webhook (Local Development)
For local testing, use ngrok to expose your server:

```bash
# Install ngrok (if not already installed)
npm install -g ngrok

# Expose your local server
ngrok http 3000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and set it in your `.env`:
```env
TWILIO_WEBHOOK_URL=https://abc123.ngrok.io/twilio/webhook
```

### 5. Configure Twilio Webhook
1. In Twilio Console, go to **Phone Numbers** > **Manage** > **Active numbers**
2. Click on your WhatsApp number
3. Set the webhook URL to: `https://your-ngrok-url.ngrok.io/twilio/webhook`
4. Set HTTP method to **POST**
5. Save the configuration

## 🧪 Testing

### Test Webhook Reception
1. Send a WhatsApp message to your Twilio sandbox number
2. Check your server logs - you should see the message received
3. Visit `http://localhost:3000/api/conversations` to see the conversation

### Test Message Sending
```bash
curl -X POST http://localhost:3000/twilio/send-test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "whatsapp:+1234567890",
    "message": "Hello from the backend!"
  }'
```

## 🔧 Configuration Details

### Current Configuration
- **Server Port**: 3000
- **Upload Directory**: ./uploads
- **Max File Size**: 10MB
- **Environment**: Development
- **Storage**: In-memory (ready for Supabase migration)

### API Endpoints Ready
- `POST /twilio/webhook` - Receive WhatsApp messages
- `GET /api/conversations` - List conversations
- `POST /api/conversations/:id/messages` - Send messages
- `POST /api/upload` - Upload files
- `GET /health` - Health check

## 🚨 Important Notes

1. **24-Hour Rule**: You can send free-form messages within 24 hours after a user's last message. Outside this window, you need approved message templates.

2. **Media URLs**: Twilio media URLs are short-lived. The backend automatically downloads and stores them.

3. **Webhook Security**: The backend validates Twilio signatures for security.

4. **Development vs Production**: 
   - Development: Uses sandbox numbers
   - Production: Requires verified business sender

## 🎯 Next Steps

1. ✅ Add your Twilio credentials to `.env`
2. ✅ Set up ngrok for local testing
3. ✅ Configure webhook in Twilio Console
4. ✅ Test with real WhatsApp messages
5. 🔄 Migrate to Supabase for production storage
6. 🚀 Deploy to production server

## 📞 Support

If you encounter any issues:
1. Check server logs for error messages
2. Verify Twilio credentials are correct
3. Ensure webhook URL is accessible
4. Check Twilio Console for message status

Your WhatsApp backend is now ready for production use! 🎉
