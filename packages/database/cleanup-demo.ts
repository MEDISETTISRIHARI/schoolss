import { PrismaClient } from '@prisma/client';

async function main() {
  const p = new PrismaClient();
  try {
    const demoStudentEmails = [];
    for (let i = 1; i <= 240; i++) {
      demoStudentEmails.push(`student${String(i).padStart(3, '0')}@demo.schoolms.com`);
    }
    demoStudentEmails.push('student@demo.schoolms.com');

    const demoUsers = await p.user.findMany({
      where: { email: { in: demoStudentEmails } },
      select: { id: true },
    });

    const demoUserIds = demoUsers.map(u => u.id);

    await p.refreshToken.deleteMany({
      where: { userId: { in: demoUserIds } },
    });

    const demoStudents = await p.student.findMany({
      where: { userId: { in: demoUserIds } },
      select: { id: true },
    });
    const demoStudentIds = demoStudents.map(s => s.id);

    await p.enrollment.deleteMany({
      where: { studentId: { in: demoStudentIds } },
    });

    await p.student.deleteMany({
      where: { id: { in: demoStudentIds } },
    });

    await p.user.deleteMany({
      where: { id: { in: demoUserIds } },
    });

    console.log(`Deleted ${demoUserIds.length} users, ${demoStudentIds.length} students, and their enrollments`);
  } finally {
    await p.$disconnect();
  }
}

main();
