import authService from '../services/auth.service';

async function main() {
  console.log('🚀 Starting Test Login...');

  try {
    // แก้รหัสนักศึกษาตามที่มีใน DB
    const loginInput = {
      studentId: '65000001',
      password: '1234',
    };

    console.log(`... Attempting to login with Student ID: ${loginInput.studentId}`);

    const result = await authService.login(loginInput);

    console.log('✅ Login Success!');
    console.log('User Details:', result);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
  }
}

main();
