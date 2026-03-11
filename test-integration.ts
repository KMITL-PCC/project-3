/**
 * Integration Test: Auth + Redis Session + QR Code
 * 
 * Tests the full flow:
 *  1. Login (Auth + Redis session)
 *  2. Me (Session retrieval)
 *  3. QR Generate
 *  4. QR Scan
 *  5. QR Action (CHECK_IN)
 *  6. Logout (Session destroyed)
 * 
 * Prerequisites:
 *  - Server running on localhost:3000
 *  - Redis running
 *  - Database with at least 1 user and 1 class_session
 */

const BASE_URL = `http://localhost:${process.env.PORT || 3000}/api`;
let sessionCookie = '';

// --- Helpers ---
async function request(method: string, path: string, body?: any) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });

  // Capture session cookie from Set-Cookie header
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0]; // e.g. connect.sid=s%3A...
  }

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  return { status: res.status, data, cookie: sessionCookie };
}

function log(label: string, pass: boolean, detail?: any) {
  const icon = pass ? '✅' : '❌';
  console.log(`${icon} ${label}`);
  if (detail && !pass) console.log('   Detail:', JSON.stringify(detail, null, 2));
}

// --- Tests ---
async function testLogin() {
  console.log('\n--- Test 1: Login ---');

  // First, let's check what users exist
  const { PrismaClient } = require('./prisma/generated/client');
  const { PrismaPg } = require('@prisma/adapter-pg');
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const users = await prisma.user.findMany({ take: 5, select: { id: true, StudentId: true, password: true, fname: true, lname: true } });
  console.log('  Available users:', JSON.stringify(users, null, 2));

  if (users.length === 0) {
    console.log('  ⚠️  No users in DB. Creating a test user...');
    await prisma.user.create({
      data: {
        StudentId: '65000001',
        fname: 'Test',
        lname: 'User',
        password: '1234',
      }
    });
    console.log('  Created test user: 65000001 / 1234');
  }

  const testUser = users[0] || { StudentId: '65000001', password: '1234' };
  await prisma.$disconnect();

  const { status, data } = await request('POST', '/auth/login', {
    studentId: testUser.StudentId,
    password: testUser.password,
  });

  log('Login returns 200', status === 200, { status, data });
  log('Login returns user object', !!data?.user, data);
  log('Session cookie set', !!sessionCookie, sessionCookie);

  return testUser;
}

async function testMe() {
  console.log('\n--- Test 2: Me (Session Check) ---');

  const { status, data } = await request('GET', '/auth/me');

  log('Me returns 200', status === 200, { status, data });
  log('Me returns user data', !!data?.user, data);
  log('User has StudentId', !!data?.user?.StudentId, data?.user);
}

async function testQrGenerate() {
  console.log('\n--- Test 3: QR Generate ---');

  // Check if class_session exists
  const { PrismaClient } = require('./prisma/generated/client');
  const { PrismaPg } = require('@prisma/adapter-pg');
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  let sessions = await prisma.classSession.findMany({ take: 1 });
  
  if (sessions.length === 0) {
    console.log('  ⚠️  No class sessions. Creating test data...');
    // Need a room first
    let room = await prisma.room.findFirst();
    if (!room) {
      room = await prisma.room.create({ data: { roomCode: 'TEST-101', roomDesc: 'Test Room 101' } });
    }
    // Need a device
    let device = await prisma.device.findFirst();
    if (!device) {
      device = await prisma.device.create({
        data: { macAddress: 'AA:BB:CC:DD:EE:FF', deviceName: 'Test Device', roomCode: room.roomCode, status: 'ACTIVE' }
      });
    }
    // Create session
    const session = await prisma.classSession.create({
      data: {
        subjectId: 1,
        roomId: room.roomCode,
        deviceId: device.id,
        qrToken: 'init-token-' + Date.now(),
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        maxStudents: 50,
      }
    });
    sessions = [session];
    console.log('  Created test class session:', session.id);
  }

  // Get a device macAddress if available
  let deviceMac: string | null = null;
  const device = await prisma.device.findFirst();
  if (device) deviceMac = device.macAddress;

  await prisma.$disconnect();

  const { status, data } = await request('POST', '/qrcode/generate', {
    class_session_id: sessions[0].id,
    macAddress: deviceMac,
  });

  log('QR Generate returns 200', status === 200, { status, data });
  log('QR token returned', !!data?.qr_token, data);
  log('Scan URL returned', !!data?.scan_url, data);

  return data?.qr_token;
}

async function testQrScan(token: string, studentId: string) {
  console.log('\n--- Test 4: QR Scan ---');

  const { status, data } = await request('POST', '/qrcode/scan', {
    token,
    studentId,
  });

  log('QR Scan returns 200', status === 200, { status, data });
  log('Scan returns success', data?.success === true, data);
  log('Action recommended', !!data?.action, data);
  log('Metadata returned', !!data?.metadata, data?.metadata);

  return data?.action;
}

async function testQrAction(token: string, studentId: string, action: string) {
  console.log('\n--- Test 5: QR Action (CHECK_IN) ---');

  const { status, data } = await request('POST', '/qrcode/action', {
    action,
    studentId,
    token,
    isGuest: false,
  });

  log('QR Action returns 200', status === 200, { status, data });
  log('Action completed', data?.success === true, data);
  log('Action type matches', data?.action === action, data);
}

async function testLogout() {
  console.log('\n--- Test 6: Logout ---');

  const { status, data } = await request('POST', '/auth/logout');

  log('Logout returns 200', status === 200, { status, data });
  log('Logout message', data?.message === 'Logout successful', data);

  // Verify session is destroyed
  const meRes = await request('GET', '/auth/me');
  log('Session destroyed (me returns 401)', meRes.status === 401, { status: meRes.status, data: meRes.data });
}

// --- Main ---
async function main() {
  console.log('==============================================');
  console.log('  Integration Test: Auth + Redis + QR Code');
  console.log('==============================================');

  try {
    // Test 1: Login
    const testUser = await testLogin();

    // Test 2: Me
    await testMe();

    // Test 3: QR Generate
    const qrToken = await testQrGenerate();

    if (qrToken) {
      // Test 4: QR Scan
      const action = await testQrScan(qrToken, testUser.StudentId);

      // Test 5: QR Action
      await testQrAction(qrToken, testUser.StudentId, action || 'CHECK_IN');
    } else {
      console.log('\n⚠️  Skipping QR Scan & Action tests (no token generated)');
    }

    // Test 6: Logout
    await testLogout();

    console.log('\n==============================================');
    console.log('  All tests completed!');
    console.log('==============================================');
  } catch (error) {
    console.error('\n❌ Test runner error:', error);
  }
}

// Load env
require('dotenv/config');
main();
