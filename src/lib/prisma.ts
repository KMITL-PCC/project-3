import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../prisma/generated/client'


const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const checkConnections = async () => {
  try {
    console.log('--- Starting Infrastructure Health Check ---');

    // 1. Check PostgreSQL (via Prisma)
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ PostgreSQL: Connected via Prisma');

  } catch (error) {
    console.error('❌ Infrastructure Check Failed:');
    console.error(error);
    
    // สำคัญมาก: ถ้าต่อไม่ได้ ให้สั่ง Exit Process ทันที
    // เพื่อให้ระบบ Orchestrator (เช่น Docker/K8s) รู้ว่า Container นี้ไม่พร้อม
    process.exit(1);
  }
};

// call async function to check connections before starting the server
checkConnections();

export { prisma }