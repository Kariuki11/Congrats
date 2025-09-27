const axios = require('axios');

// Configuration for production testing
const PRODUCTION_URL = 'https://congrats-xi.vercel.app';
const TEST_PHONE = '+254733573911';

async function testProductionAPI() {
  console.log('🧪 Testing Production WhatsApp Backend');
  console.log('=====================================\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${PRODUCTION_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    console.log('');

    // Test 2: Get conversations
    console.log('2. Testing conversations endpoint...');
    const conversationsResponse = await axios.get(`${PRODUCTION_URL}/api/conversations`);
    console.log('✅ Conversations:', conversationsResponse.data);
    console.log('');

    // Test 3: Send test message to your number
    console.log('3. Testing message sending to your number...');
    const sendData = {
      to: `whatsapp:${TEST_PHONE}`,
      message: 'Hello! This is a test message from your WhatsApp backend. Please reply to test the webhook.'
    };

    try {
      const sendResponse = await axios.post(`${PRODUCTION_URL}/twilio/send-test`, sendData);
      console.log('✅ Message sent successfully:', sendResponse.data);
      console.log('');
    } catch (error) {
      console.log('❌ Failed to send message:', error.response?.data || error.message);
      console.log('');
    }

    // Test 4: Check conversations after sending
    console.log('4. Checking conversations after sending message...');
    const conversationsAfterResponse = await axios.get(`${PRODUCTION_URL}/api/conversations`);
    console.log('✅ Conversations after sending:', conversationsAfterResponse.data);
    console.log('');

    console.log('🎉 Production testing completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Check your WhatsApp for the test message');
    console.log('2. Reply to the message to test webhook reception');
    console.log('3. Check conversations API again to see your reply');
    console.log('4. Test file uploads if needed');

  } catch (error) {
    console.error('❌ Production test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testProductionAPI();
