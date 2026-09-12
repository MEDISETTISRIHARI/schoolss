import { PrismaClient } from '@prisma/client';

async function main() {
  const p = new PrismaClient();
  try {
    const studentUsers = await p.user.count({ where: { role: 'STUDENT' } });
    console.log('Student users:', studentUsers);
    
    const students = await p.student.count();
    console.log('Student profiles:', students);
    
    const enrollments = await p.enrollment.count();
    console.log('Enrollments:', enrollments);
    
    const users = await p.user.findMany({
      where: { email: { startsWith: 'student' }, role: 'STUDENT' },
      select: { email: true },
      orderBy: { email: { sort: 'asc' as any } },
      take: 10,
    });
    console.log('First 10 student emails:', users.map(u => u.email));
  } finally {
    await p.$disconnect();
  }
}

main();
