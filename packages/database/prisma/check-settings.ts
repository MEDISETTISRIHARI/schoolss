import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  await prisma.$connect();
  const count = await prisma.schoolSetting.count();
  console.log('SchoolSettings count:', count);
  const settings = await prisma.schoolSetting.findMany();
  console.log('SchoolSettings:', JSON.stringify(settings, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
