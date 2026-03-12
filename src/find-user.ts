import { prisma } from './lib/prisma';

async function main() {
  const users = await prisma.user.findMany({ 
    take: 5,
    select: {
      id: true,
      StudentId: true,
      fname: true,
      lname: true,
      password: true
    }
  });
  console.log('--- USERS ---');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
