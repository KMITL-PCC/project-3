const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  let session = await prisma.classSession.findFirst();
  if (!session) {
    session = await prisma.classSession.create({
      data: {
        subjectId: 1,
        roomId: 'R101',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        maxStudents: 50
      }
    });
  }
  console.log('CLASS_SESSION_ID=' + session.id);
  
  // Upsert test user
  const user = await prisma.user.upsert({
    where: { StudentId: '66200888' },
    update: {},
    create: { StudentId: '66200888', password: '1234', fname: 'Test', lname: 'Student' }
  });
  console.log('USER_ID=' + user.StudentId);
  
  // Call API to generate QR Token
  const res = await fetch('http://localhost:3000/api/qrcode/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ class_session_id: session.id })
  });
  const data = await res.json();
  console.log('QR_TOKEN=' + data.qr_token);
}

main().catch(console.error).finally(() => prisma.$disconnect());
