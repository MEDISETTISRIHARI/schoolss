import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  await prisma.$connect();
  const result = await prisma.$queryRaw`SELECT indexname FROM pg_indexes WHERE tablename = 'SchoolSetting' AND indexname LIKE '%schoolId%'`;
  console.log('Indexes:', JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
