async function testQRSession() {
  try {
    // 1. Web Init Session
    console.log('--- 1. Web Init Session ---');
    const initRes = await fetch('http://localhost:3000/api/qrcode/session-init', { method: 'POST' });
    const initData = await initRes.json();
    console.log(initData);
    const sessionId = initData.qr_session_id;

    // 2. Web Generate Token
    console.log('\n--- 2. Web Generate Token ---');
    const genRes = await fetch('http://localhost:3000/api/qrcode/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_session_id: sessionId })
    });
    const genData = await genRes.json();
    console.log(genData);
    const token = genData.qr_token;

    // 3. Mobile Scan
    console.log('\n--- 3. Mobile Scan ---');
    const scanRes = await fetch('http://localhost:3000/api/qrcode/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId: 'user-789' })
    });
    const scanData = await scanRes.json();
    console.log(scanData);

    // 4. Web Poll
    console.log('\n--- 4. Web Poll Status ---');
    const pollRes = await fetch(`http://localhost:3000/api/qrcode/status/${sessionId}`);
    const pollData = await pollRes.json();
    console.log(pollData);
    
    // Web Poll should get the login_session cookie
    const cookies = pollRes.headers.get('set-cookie');
    console.log('\nReceived Headers (Cookie):', cookies);

    if (cookies && pollData.status === 'approved') {
      console.log('\n✅ Success! The 1-Day login session cookie was created.');
    } else {
      console.log('\n❌ Failed to create the login session cookie.');
    }

  } catch (error: any) {
    console.error('Test Error:', error.message);
  }
}

testQRSession();
