import axios from 'axios';

const backendUrl = 'http://localhost:3000/api';

async function testAuth() {
  console.log('🚀 Starting Auth Check...');
  const agent = axios.create({ 
    withCredentials: true,
    baseURL: backendUrl
  });

  try {
    console.log('1. Testing login...');
    const loginRes = await agent.post('/auth/login', {
      studentId: '65000001', // From login.test.ts
      password: '1234'      // From login.test.ts
    });

    console.log('✅ Login successful:', loginRes.data);
    console.log('Response Headers:', loginRes.headers);
    
    // Check for cookies in subsequent request
    console.log('2. Testing "me" endpoint...');
    const meRes = await agent.get('/auth/me');
    console.log('✅ Me data:', meRes.data);

    if (meRes.data.user && meRes.data.user.StudentId === '65000001') {
      console.log('🎉 Auth flow verified successfully!');
    } else {
      console.error('❌ Me data mismatch!');
    }

  } catch (error: any) {
    console.error('❌ Auth test failed!');
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else {
      console.error('Error Message:', error.message);
    }
  }
}

testAuth();
