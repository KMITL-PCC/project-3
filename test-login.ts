import authService from './src/services/auth.service';

async function main() {
  console.log('🚀 Starting Test Login...');

  try {
    // ข้อมูล login (ส่งผ่าน RADIUS จริงถึงจะผ่าน)
    const loginInput = {
      studentId: '64010123',
      password: 'mypassword123',
    };

    console.log(`... Attempting to login with Student ID: ${loginInput.studentId}`);

    const result = await authService.login(loginInput);

    console.log('✅ Login Success!');
    console.log('User DB ID:', result.id);
    console.log('Username:', result.username);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
  }
}

main();