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
    
    const orphaned = await p.student.findMany({
      where: { user: null },
      include: { user: true },
      take: 5,
    });
    console.log('Orphaned students:', orphaned.length);
    if (orphaned.length > 0) {
      console.log('Sample orphaned:', orphaned[0]);
    }
  } finally {
    await p.$disconnect();
  }
}

main();
