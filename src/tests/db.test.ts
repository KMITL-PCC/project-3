import { prisma } from '../lib/prisma';

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('Result:', users);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
