# WhatsApp Backend with Twilio Integration

A Node.js/Express backend service for handling WhatsApp messages via Twilio, designed for customer support platforms.

## Features

- 📱 **WhatsApp Integration**: Receive and send messages via Twilio
- 🔒 **Security**: Twilio webhook signature validation
- 📎 **Media Support**: Download, store, and send media attachments
- 💬 **Conversation Management**: Track conversations and message history
- 📤 **File Upload**: Upload files for sending as media attachments
- 🚀 **REST API**: Complete API for frontend integration
- 💾 **In-Memory Storage**: Development-ready with easy database migration

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your Twilio credentials:

```bash
cp env.example .env
```

Edit `.env` with your Twilio credentials:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_WEBHOOK_URL=https://your-domain.com/twilio/webhook

# Server Configuration
PORT=3000
NODE_ENV=development

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Security
WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## Twilio Setup

### 1. Create Twilio Account
- Sign up at [Twilio Console](https://console.twilio.com/)
- Get your Account SID and Auth Token

### 2. Enable WhatsApp Sandbox
- Go to Messaging > Try it out > Send a WhatsApp message
- Follow the setup instructions to connect your WhatsApp number
- Note your WhatsApp sandbox number (usually `+14155238886`)

### 3. Configure Webhook
- In Twilio Console, go to Phone Numbers > Manage > Active numbers
- Click on your WhatsApp number
- Set the webhook URL to: `https://your-domain.com/twilio/webhook`
- Set HTTP method to POST

### 4. Test Webhook (Development)
For local development, use ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use the ngrok URL in your Twilio webhook configuration
# Example: https://abc123.ngrok.io/twilio/webhook
```

## API Endpoints

### Webhook Endpoints

#### `POST /twilio/webhook`
Receives incoming WhatsApp messages from Twilio.

#### `POST /twilio/status`
Receives message status callbacks from Twilio.

#### `POST /twilio/send-test`
Test endpoint to send messages (development only).

### Conversation Management

#### `GET /api/conversations`
Get all conversations with pagination.

**Query Parameters:**
- `limit` (optional): Number of conversations to return (default: 50)
- `offset` (optional): Number of conversations to skip (default: 0)

#### `GET /api/conversations/:conversationId`
Get specific conversation details and statistics.

#### `GET /api/conversations/:conversationId/messages`
Get messages for a conversation.

**Query Parameters:**
- `limit` (optional): Number of messages to return (default: 50)
- `offset` (optional): Number of messages to skip (default: 0)

#### `POST /api/conversations/:conversationId/messages`
Send a message to a conversation.

**Request Body:**
```json
{
  "text": "Hello, how can I help you?",
  "mediaUrls": ["https://example.com/image.jpg"]
}
```

#### `POST /api/conversations/:conversationId/mark-read`
Mark a conversation as read.

#### `GET /api/conversations/:conversationId/search`
Search messages in a conversation.

**Query Parameters:**
- `q`: Search query (required)
- `limit` (optional): Number of results to return (default: 20)

#### `GET /api/conversations/:conversationId/stats`
Get conversation statistics.

### File Upload

#### `POST /api/upload`
Upload a single file.

**Form Data:**
- `file`: The file to upload

#### `POST /api/upload/multiple`
Upload multiple files.

**Form Data:**
- `files`: Array of files to upload

#### `GET /api/upload`
List uploaded files.

#### `GET /api/upload/:filename`
Get file information.

#### `DELETE /api/upload/:filename`
Delete a file.

### Utility Endpoints

#### `GET /health`
Health check endpoint.

#### `GET /`
API information and available endpoints.

## Testing

### 1. Test Webhook Reception
Send a WhatsApp message to your Twilio sandbox number. The message should appear in your server logs.

### 2. Test Message Sending
Use the test endpoint to send a message:

```bash
curl -X POST http://localhost:3000/twilio/send-test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "whatsapp:+1234567890",
    "message": "Hello from the backend!"
  }'
```

### 3. Test File Upload
Upload a file:

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/your/file.jpg"
```

### 4. Test Conversation API
Get conversations:

```bash
curl http://localhost:3000/api/conversations
```

## Project Structure

```
├── server.js                 # Main server file
├── routes/
│   ├── twilio.js            # Twilio webhook routes
│   ├── conversations.js     # Conversation management routes
│   └── upload.js            # File upload routes
├── services/
│   ├── twilioService.js     # Twilio API integration
│   └── messageService.js    # Message storage and retrieval
├── uploads/                 # File upload directory
├── package.json
├── .env                     # Environment variables
└── README.md
```

## Development Notes

### In-Memory Storage
The current implementation uses in-memory storage for development. This means:
- Data is lost when the server restarts
- Perfect for development and testing
- Easy to migrate to Supabase later

### Media Handling
- Inbound media is automatically downloaded and stored locally
- Media URLs from Twilio are short-lived, so immediate download is required
- Outbound media can be uploaded via the upload API

### Security
- Twilio webhook signatures are validated for security
- File uploads are restricted by type and size
- CORS is configured for frontend integration

## Production Considerations

1. **Database Migration**: Replace in-memory storage with Supabase
2. **File Storage**: Consider using AWS S3 or similar for media files
3. **Environment Variables**: Use secure environment variable management
4. **Logging**: Implement proper logging and monitoring
5. **Rate Limiting**: Add rate limiting for API endpoints
6. **SSL/TLS**: Ensure HTTPS for webhook endpoints

## Troubleshooting

### Common Issues

1. **Webhook not receiving messages**
   - Check Twilio webhook URL configuration
   - Ensure ngrok is running for local development
   - Verify webhook signature validation

2. **Messages not sending**
   - Check Twilio credentials in .env
   - Verify WhatsApp number format (include `whatsapp:` prefix)
   - Check 24-hour messaging window rules

3. **File upload issues**
   - Check upload directory permissions
   - Verify file size limits
   - Ensure allowed file types

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and logging.

## License

ISC
