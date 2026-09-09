const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient({
    log: ['error', 'warn', 'info']
  });
  try {
    const result = await prisma.$queryRawUnsafe('SELECT 1 AS test');
    console.log('QUERY RESULT:', result);
    console.log('PRISMA CONNECT OK');
    await prisma.$disconnect();
  } catch (e) {
    console.error('PRISMA ERR:', e.message);
    process.exit(1);
  }
}

test();
