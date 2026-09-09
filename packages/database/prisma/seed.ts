import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@schoolms.com' },
    update: {},
    create: {
      email: 'superadmin@schoolms.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  const school = await prisma.school.upsert({
    where: { id: 'demo-school' },
    update: {},
    create: {
      id: 'demo-school',
      name: 'Demo School',
      subdomain: 'demo',
      email: 'demo@schoolms.com',
      phone: '+1234567890',
      address: '123 Education St',
      isActive: true,
    },
  });

  const principal = await prisma.user.upsert({
    where: { email: 'principal@demo.schoolms.com' },
    update: {},
    create: {
      email: 'principal@demo.schoolms.com',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Principal',
      role: 'PRINCIPAL',
      status: 'ACTIVE',
      schoolId: school.id,
    },
  });

  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'admin@demo.schoolms.com' },
    update: {},
    create: {
      email: 'admin@demo.schoolms.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Admin',
      role: 'SCHOOL_ADMIN',
      status: 'ACTIVE',
      schoolId: school.id,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@demo.schoolms.com' },
    update: {},
    create: {
      email: 'teacher@demo.schoolms.com',
      passwordHash,
      firstName: 'Alice',
      lastName: 'Teacher',
      role: 'TEACHER',
      status: 'ACTIVE',
      schoolId: school.id,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@demo.schoolms.com' },
    update: {},
    create: {
      email: 'student@demo.schoolms.com',
      passwordHash,
      firstName: 'Bob',
      lastName: 'Student',
      role: 'STUDENT',
      status: 'ACTIVE',
      schoolId: school.id,
    },
  });

  const academicYear = await prisma.academicYear.upsert({
    where: { id: 'demo-ay-2024' },
    update: {},
    create: {
      id: 'demo-ay-2024',
      schoolId: school.id,
      name: '2024-2025',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2025-03-31'),
      isActive: true,
      isCurrent: true,
    },
  });

  const permissions = [
    { name: 'school.view', description: 'View school details', category: 'School' },
    { name: 'school.manage', description: 'Manage school settings', category: 'School' },
    { name: 'users.view', description: 'View users', category: 'Users' },
    { name: 'users.manage', description: 'Manage users', category: 'Users' },
    { name: 'teachers.view', description: 'View teachers', category: 'Teachers' },
    { name: 'teachers.manage', description: 'Manage teachers', category: 'Teachers' },
    { name: 'students.view.assigned', description: 'View assigned students', category: 'Students' },
    { name: 'students.manage', description: 'Manage students', category: 'Students' },
    { name: 'classes.view', description: 'View classes', category: 'Academic' },
    { name: 'classes.manage', description: 'Manage classes', category: 'Academic' },
    { name: 'sections.view', description: 'View sections', category: 'Academic' },
    { name: 'sections.manage', description: 'Manage sections', category: 'Academic' },
    { name: 'subjects.view', description: 'View subjects', category: 'Academic' },
    { name: 'subjects.manage', description: 'Manage subjects', category: 'Academic' },
    { name: 'attendance.view.own', description: 'View own attendance', category: 'Attendance' },
    { name: 'attendance.view', description: 'View attendance', category: 'Attendance' },
    { name: 'attendance.manage', description: 'Manage attendance', category: 'Attendance' },
    { name: 'attendance.enter.assigned', description: 'Enter attendance for assigned classes', category: 'Attendance' },
    { name: 'examinations.view.own', description: 'View own examinations', category: 'Examinations' },
    { name: 'examinations.view', description: 'View examinations', category: 'Examinations' },
    { name: 'examinations.manage', description: 'Manage examinations', category: 'Examinations' },
    { name: 'examinations.assigned', description: 'Manage assigned examinations', category: 'Examinations' },
    { name: 'marks.view.own', description: 'View own marks', category: 'Marks' },
    { name: 'marks.view', description: 'View marks', category: 'Marks' },
    { name: 'marks.enter.assigned', description: 'Enter marks for assigned classes', category: 'Marks' },
    { name: 'marks.prepare', description: 'Prepare marks', category: 'Marks' },
    { name: 'results.view.own', description: 'View own results', category: 'Results' },
    { name: 'results.view.assigned', description: 'View assigned results', category: 'Results' },
    { name: 'results.view', description: 'View results', category: 'Results' },
    { name: 'results.prepare', description: 'Prepare results', category: 'Results' },
    { name: 'results.approve', description: 'Approve results', category: 'Results' },
    { name: 'awards.view.own', description: 'View own awards', category: 'Awards' },
    { name: 'awards.approve', description: 'Approve awards', category: 'Awards' },
    { name: 'awards.workflow', description: 'Manage awards workflow', category: 'Awards' },
    { name: 'homework.view.own', description: 'View own homework', category: 'Homework' },
    { name: 'homework.manage.assigned', description: 'Manage homework for assigned classes', category: 'Homework' },
    { name: 'timetable.view.own', description: 'View own timetable', category: 'Timetable' },
    { name: 'timetable.view.assigned', description: 'View assigned timetable', category: 'Timetable' },
    { name: 'notifications.receive', description: 'Receive notifications', category: 'Notifications' },
    { name: 'notifications.class', description: 'Send class notifications', category: 'Notifications' },
    { name: 'notifications.routine', description: 'Send routine notifications', category: 'Notifications' },
    { name: 'notifications.school', description: 'Send school-wide notifications', category: 'Notifications' },
    { name: 'reports.view', description: 'View reports', category: 'Reports' },
    { name: 'reports.manage', description: 'Manage reports', category: 'Reports' },
    { name: 'files.manage', description: 'Manage files', category: 'Files' },
    { name: 'settings.manage', description: 'Manage settings', category: 'Settings' },
    { name: 'dashboard.view', description: 'View dashboard', category: 'Dashboard' },
    { name: 'profile.manage', description: 'Manage own profile', category: 'Profile' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: perm,
      create: perm,
    });
  }

  const rolePermissions: { role: string; permissions: string[] }[] = [
    { role: 'SUPER_ADMIN', permissions: ['*'] },
    {
      role: 'PRINCIPAL',
      permissions: [
        'school.view', 'school.overview', 'users.view', 'teachers.view', 'classes.view',
        'sections.view', 'subjects.view', 'attendance.view', 'examinations.view',
        'marks.view', 'results.approve', 'awards.approve', 'notifications.school',
        'reports.view',
      ],
    },
    {
      role: 'SCHOOL_ADMIN',
      permissions: [
        'school.manage', 'users.manage', 'teachers.manage', 'classes.manage',
        'sections.manage', 'subjects.manage', 'students.manage', 'attendance.manage',
        'examinations.manage', 'marks.prepare', 'results.prepare', 'awards.workflow',
        'notifications.routine', 'reports.manage', 'settings.manage', 'files.manage',
      ],
    },
    {
      role: 'TEACHER',
      permissions: [
        'students.view.assigned', 'attendance.enter.assigned', 'marks.enter.assigned',
        'examinations.assigned', 'homework.manage.assigned', 'timetable.view.assigned',
        'notifications.class', 'results.view.assigned',
      ],
    },
    {
      role: 'STUDENT',
      permissions: [
        'dashboard.view', 'attendance.view.own', 'marks.view.own', 'examinations.view.own',
        'results.view.own', 'awards.view.own', 'homework.view.own', 'timetable.view.own',
        'notifications.receive', 'profile.manage',
      ],
    },
  ];

  for (const rp of rolePermissions) {
    for (const permName of rp.permissions) {
      const permission = await prisma.permission.findUnique({ where: { name: permName } });
      if (permission) {
        await prisma.rolePermission.upsert({
          where: { role_permissionId: { role: rp.role as any, permissionId: permission.id } },
          update: {},
          create: { role: rp.role as any, permissionId: permission.id },
        });
      }
    }
  }

  console.log('Seed completed successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
