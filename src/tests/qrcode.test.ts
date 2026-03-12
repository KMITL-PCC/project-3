import axios from 'axios';

async function testQRSession() {
  const PORT = process.env.PORT || 3000;
  const BASE_URL = `http://localhost:${PORT}/api`;
  
  try {
    console.log('--- 1. Generate Token (Needs existing class_session) ---');
    // Note: This test assumes you have a class_session with ID 1
    const genRes = await axios.post(`${BASE_URL}/qrcode/generate`, {
      class_session_id: 1
    });
    console.log('Generate Result:', genRes.data);
    const token = genRes.data.qr_token;

    console.log('\n--- 2. Scan QR Code ---');
    const scanRes = await axios.post(`${BASE_URL}/qrcode/scan`, {
      token,
      studentId: 'admin'
    });
    console.log('Scan Result:', scanRes.data);

    console.log('\n--- 3. Poll Status ---');
    const pollRes = await axios.get(`${BASE_URL}/qrcode/poll/1`);
    console.log('Poll Result:', pollRes.data);

  } catch (error: any) {
    console.error('Test Error:', error.response?.data || error.message);
  }
}

testQRSession();
