import axios from 'axios';

async function testSession() {
  try {
    const res = await axios.post('http://localhost:3000/api/auth/login', {
      studentId: 'admin',
      password: 'hashed_password_admin'
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
