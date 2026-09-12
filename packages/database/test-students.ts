import { PrismaClient } from '@prisma/client';

async function main() {
  const p = new PrismaClient();
  try {
    const users = await p.user.findMany({
      where: { email: { startsWith: 'student' }, role: 'STUDENT' },
      select: { email: true },
    });
    console.log('Student users count:', users.length);
    console.log('Emails:', users.map(u => u.email).join(', '));
  } finally {
    await p.$disconnect();
  }
}

main();
