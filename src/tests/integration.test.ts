/**
 * Integration Test: Auth + Redis Session + QR Code
 */
import 'dotenv/config';
import { prisma } from '../lib/prisma';

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

  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
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

  const users = await prisma.user.findMany({ take: 5 });
  
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
  }

  const usersList = await prisma.user.findMany({ take: 1 });
  const testUser = usersList[0];

  const { status, data } = await request('POST', '/auth/login', {
    studentId: testUser.StudentId,
    password: testUser.password, // Assume it matches for test
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
}

async function testQrGenerate() {
  console.log('\n--- Test 3: QR Generate ---');

  let sessions = await prisma.classSession.findMany({ take: 1 });
  
  if (sessions.length === 0) {
    let room = await prisma.room.findFirst();
    if (!room) room = await prisma.room.create({ data: { roomCode: 'TEST-101', roomDesc: 'Test Room' } });
    
    let device = await prisma.device.findFirst();
    if (!device) device = await prisma.device.create({ data: { macAddress: 'AA:BB:CC:DD:EE:FF', roomCode: room.roomCode } });

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
  }

  const { status, data } = await request('POST', '/qrcode/generate', {
    class_session_id: sessions[0].id,
  });

  log('QR Generate returns 200', status === 200, { status, data });
  log('QR token returned', !!data?.qr_token, data);

  return data?.qr_token;
}

async function testQrScan(token: string, studentId: string) {
  console.log('\n--- Test 4: QR Scan ---');
  const { status, data } = await request('POST', '/qrcode/scan', { token, studentId });
  log('QR Scan returns 200', status === 200, { status, data });
  return data?.action;
}

async function testLogout() {
  console.log('\n--- Test 5: Logout ---');
  const { status, data } = await request('POST', '/auth/logout');
  log('Logout returns 200', status === 200, { status, data });
}

async function main() {
  console.log('🚀 Starting Integration Test...');
  try {
    const user = await testLogin();
    await testMe();
    const token = await testQrGenerate();
    if (token) {
      const action = await testQrScan(token, user.StudentId!);
      console.log('   Recommended Action:', action);
    }
    await testLogout();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
