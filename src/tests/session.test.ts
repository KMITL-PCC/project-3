import axios from 'axios';

async function testSession() {
  const PORT = process.env.PORT || 3000;
  console.log('🚀 Testing Session on port:', PORT);
  
  try {
    const res = await axios.post(`http://localhost:${PORT}/api/auth/login`, {
      studentId: 'admin',
      password: '1234'
    });
    console.log('Login Result:', res.data);
    
    const cookies = res.headers['set-cookie'];
    console.log('Got Cookies:', cookies);

    if (cookies) {
      console.log('✅ Session cookie created');
    } else {
      console.log('❌ No session cookie created');
    }
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testSession();
