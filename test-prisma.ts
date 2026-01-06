import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing Prisma connection...');
  await prisma.$connect();
  console.log('✅ Connected to database');

  const users = await prisma.user.findMany();
  console.log('Users found:', users.length);
}

main()
  .catch(e => console.error('❌ Error:', e))
  .finally(() => prisma.$disconnect());