import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('--- Start Seeding ---');

  // 1. Roles
  console.log('Seeding roles...');
  await prisma.role.upsert({
    where: { roleId: 'admin' },
    update: {},
    create: { name: 'admin', roleId: 'admin' },
  });
  await prisma.role.upsert({
    where: { roleId: 'student' },
    update: {},
    create: { name: 'student', roleId: 'student' },
  });

  // 2. Building & Rooms
  console.log('Seeding buildings and rooms...');
  const building = await prisma.building.upsert({
    where: { buildingCode: 'B1' },
    update: {},
    create: { buildingCode: 'B1', buildingName: 'Main Engineering Building' },
  });

  const roomCodes = ['R101', 'R102', 'R201'];
  for (const code of roomCodes) {
    await prisma.room.upsert({
      where: { roomCode: code },
      update: {},
      create: {
        roomCode: code,
        buildingCode: building.buildingCode,
        roomFloor: code.startsWith('R1') ? '1' : '2',
        roomCapacity: '40',
        roomDesc: `Lecture Room ${code}`,
      },
    });
  }

  // 3. Admin User
  console.log('Seeding test admin user...');
  await prisma.user.upsert({
    where: { StudentId: '99999999' },
    update: { roleId: 'admin' },
    create: {
      StudentId: '99999999',
      fname: 'System',
      lname: 'Administrator',
      password: 'admin',
      roleId: 'admin',
    },
  });

  // 4. Student Users
  console.log('Seeding student users...');
  const students = [
    { id: '64010001', fname: 'Somchai', lname: 'Saetang' },
    { id: '64010002', fname: 'Somsak', lname: 'Rakdee' },
    { id: '64010003', fname: 'Wipa', lname: 'Manee' },
    { id: '64010004', fname: 'Kanya', lname: 'Siri' },
    { id: '64010005', fname: 'Ananda', lname: 'Everingham' },
  ];

  for (const s of students) {
    await prisma.user.upsert({
      where: { StudentId: s.id },
      update: { roleId: 'student' },
      create: {
        StudentId: s.id,
        fname: s.fname,
        lname: s.lname,
        password: 'password123',
        roleId: 'student',
      },
    });
  }

  // 5. Check-ins simulation for today
  console.log('Seeding check-in simulations...');
  const today = new Date();
  
  // Create check-ins spread across morning hours
  const checkinData = [
    { studentId: '64010001', room: 'R101', hour: 8, min: 15, duration: 120 },
    { studentId: '64010002', room: 'R101', hour: 8, min: 20, duration: 110 },
    { studentId: '64010003', room: 'R102', hour: 9, min: 0, duration: 90 },
    { studentId: '64010004', room: 'R102', hour: 9, min: 10, duration: 85 },
    { studentId: '64010005', room: 'R201', hour: 10, min: 30, duration: 60 },
    { studentId: '64010001', room: 'R201', hour: 13, min: 45, duration: null }, // Still in
  ];

  // Clear old checkins for clean start of simulation if needed
  // await prisma.checkin.deleteMany({}); 

  for (const data of checkinData) {
    const checkInTime = new Date(today);
    checkInTime.setHours(data.hour, data.min, 0, 0);

    let checkOutTime = null;
    if (data.duration !== null) {
      checkOutTime = new Date(checkInTime);
      checkOutTime.setMinutes(checkOutTime.getMinutes() + data.duration);
    }

    await prisma.checkin.create({
      data: {
        StudentId: data.studentId,
        roomCode: data.room,
        checkIn: checkInTime,
        checkOut: checkOutTime,
      },
    });
  }

  console.log('--- Seeding Completed ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
