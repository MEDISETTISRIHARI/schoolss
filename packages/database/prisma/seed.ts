import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

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

  await prisma.principal.upsert({
    where: { userId: principal.id },
    update: {},
    create: {
      userId: principal.id,
      employeeId: `EMP-${principal.id.slice(-6)}`,
      gender: 'FEMALE',
      qualification: 'M.Ed',
      appointmentDate: new Date('2015-06-01'),
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

  await prisma.schoolAdmin.upsert({
    where: { userId: schoolAdmin.id },
    update: {},
    create: {
      userId: schoolAdmin.id,
      employeeId: `EMP-${schoolAdmin.id.slice(-6)}`,
      designation: 'School Administrator',
      gender: 'MALE',
      appointmentDate: new Date('2016-01-15'),
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

  await prisma.teacher.upsert({
    where: { userId: teacher.id },
    update: {},
    create: {
      userId: teacher.id,
      employeeId: `EMP-${teacher.id.slice(-6)}`,
      dateOfBirth: new Date('1985-01-15'),
      gender: 'FEMALE',
      qualification: 'M.Ed',
      experience: 10,
      joiningDate: new Date('2014-06-01'),
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

  await prisma.student.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      admissionNumber: `ADM-${student.id.slice(-6)}`,
      dateOfBirth: new Date('2010-05-20'),
      gender: 'MALE',
      bloodGroup: 'O+',
      address: '123 Student Lane',
      guardianName: 'Robert Student',
      guardianPhone: '+1234567890',
      guardianEmail: 'robert@student.com',
      guardianRelation: 'Father',
      enrollmentDate: new Date('2024-04-01'),
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

  const classNames = ['LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  const sectionNames = ['A', 'B'];

  const classMap: Record<string, string> = {};
  const sectionMap: Record<string, string> = {};

  for (const className of classNames) {
    const cls = await prisma.class.upsert({
      where: {
        schoolId_academicYearId_name: {
          schoolId: school.id,
          academicYearId: academicYear.id,
          name: className,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        name: className,
        displayName: className,
      },
    });
    classMap[className] = cls.id;
  }

  for (const className of classNames) {
    const clsId = classMap[className];
    for (const sectionName of sectionNames) {
      const section = await prisma.section.upsert({
        where: {
          schoolId_classId_name_academicYearId: {
            schoolId: school.id,
            classId: clsId,
            name: sectionName,
            academicYearId: academicYear.id,
          },
        },
        update: {},
        create: {
          schoolId: school.id,
          classId: clsId,
          academicYearId: academicYear.id,
          name: sectionName,
        },
      });
      sectionMap[`${className}-${sectionName}`] = section.id;
    }
  }

  const permissions = [
    { name: 'school.view', description: 'View school details', category: 'School' },
    { name: 'school.manage', description: 'Manage school settings', category: 'School' },
    { name: 'school.overview', description: 'View school overview', category: 'School' },
    { name: 'users.view', description: 'View users', category: 'Users' },
    { name: 'users.manage', description: 'Manage users', category: 'Users' },
    { name: 'teachers.view', description: 'View teachers', category: 'Teachers' },
    { name: 'teachers.manage', description: 'Manage teachers', category: 'Teachers' },
    { name: 'students.view.assigned', description: 'View assigned students', category: 'Students' },
    { name: 'students.view', description: 'View students', category: 'Students' },
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
        'school.view', 'school.manage', 'users.view', 'users.manage', 'teachers.view',
        'teachers.manage', 'classes.view', 'classes.manage', 'sections.view',
        'sections.manage', 'subjects.view', 'subjects.manage', 'students.view',
        'students.manage', 'attendance.view', 'attendance.manage',
        'examinations.view', 'examinations.manage', 'marks.view', 'marks.prepare',
        'results.view', 'results.prepare', 'awards.view', 'awards.workflow',
        'notifications.view', 'notifications.routine', 'reports.view', 'reports.manage',
        'settings.manage', 'files.manage', 'dashboard.view',
      ],
    },
    {
      role: 'TEACHER',
      permissions: [
        'school.view', 'users.view', 'students.view.assigned', 'attendance.view',
        'attendance.enter.assigned', 'marks.view', 'marks.enter.assigned',
        'examinations.view', 'examinations.assigned', 'homework.view',
        'homework.manage.assigned', 'timetable.view', 'timetable.view.assigned',
        'notifications.view', 'notifications.class', 'results.view.assigned',
        'awards.view', 'dashboard.view',
      ],
    },
    {
      role: 'STUDENT',
      permissions: [
        'school.view', 'users.view', 'dashboard.view', 'attendance.view.own',
        'marks.view.own', 'examinations.view.own', 'results.view.own',
        'awards.view.own', 'homework.view.own', 'timetable.view.own',
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

  const admin001 = await prisma.user.upsert({
    where: { email: 'admin001@demo.schoolms.com' },
    update: {},
    create: {
      email: 'admin001@demo.schoolms.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'One',
      role: 'SCHOOL_ADMIN',
      status: 'ACTIVE',
      schoolId: school.id,
    },
  });

  await prisma.schoolAdmin.upsert({
    where: { userId: admin001.id },
    update: {},
    create: {
      userId: admin001.id,
      employeeId: `EMP-${admin001.id.slice(-6)}`,
      designation: 'School Administrator',
      gender: 'MALE',
      appointmentDate: new Date('2020-01-01'),
    },
  });

  const admin002 = await prisma.user.upsert({
    where: { email: 'admin002@demo.schoolms.com' },
    update: {},
    create: {
      email: 'admin002@demo.schoolms.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Two',
      role: 'SCHOOL_ADMIN',
      status: 'ACTIVE',
      schoolId: school.id,
    },
  });

  await prisma.schoolAdmin.upsert({
    where: { userId: admin002.id },
    update: {},
    create: {
      userId: admin002.id,
      employeeId: `EMP-${admin002.id.slice(-6)}`,
      designation: 'School Administrator',
      gender: 'FEMALE',
      appointmentDate: new Date('2020-06-01'),
    },
  });

  const principal001 = await prisma.user.upsert({
    where: { email: 'principal001@demo.schoolms.com' },
    update: {},
    create: {
      email: 'principal001@demo.schoolms.com',
      passwordHash,
      firstName: 'Principal',
      lastName: 'One',
      role: 'PRINCIPAL',
      status: 'ACTIVE',
      schoolId: school.id,
    },
  });

  await prisma.principal.upsert({
    where: { userId: principal001.id },
    update: {},
    create: {
      userId: principal001.id,
      employeeId: `EMP-${principal001.id.slice(-6)}`,
      gender: 'MALE',
      qualification: 'Ph.D',
      appointmentDate: new Date('2018-01-01'),
    },
  });

  const principal002 = await prisma.user.upsert({
    where: { email: 'principal002@demo.schoolms.com' },
    update: {},
    create: {
      email: 'principal002@demo.schoolms.com',
      passwordHash,
      firstName: 'Principal',
      lastName: 'Two',
      role: 'PRINCIPAL',
      status: 'ACTIVE',
      schoolId: school.id,
    },
  });

  await prisma.principal.upsert({
    where: { userId: principal002.id },
    update: {},
    create: {
      userId: principal002.id,
      employeeId: `EMP-${principal002.id.slice(-6)}`,
      gender: 'FEMALE',
      qualification: 'M.Phil',
      appointmentDate: new Date('2019-01-01'),
    },
  });

  const teachersData = [
    { firstName: 'Teacher', lastName: 'One', email: 'teacher001@demo.schoolms.com', gender: 'MALE', qualification: 'M.Sc', experience: 5 },
    { firstName: 'Teacher', lastName: 'Two', email: 'teacher002@demo.schoolms.com', gender: 'FEMALE', qualification: 'M.A', experience: 8 },
    { firstName: 'Teacher', lastName: 'Three', email: 'teacher003@demo.schoolms.com', gender: 'MALE', qualification: 'B.Ed', experience: 3 },
    { firstName: 'Teacher', lastName: 'Four', email: 'teacher004@demo.schoolms.com', gender: 'FEMALE', qualification: 'M.Sc', experience: 10 },
    { firstName: 'Teacher', lastName: 'Five', email: 'teacher005@demo.schoolms.com', gender: 'MALE', qualification: 'M.A', experience: 6 },
    { firstName: 'Teacher', lastName: 'Six', email: 'teacher006@demo.schoolms.com', gender: 'FEMALE', qualification: 'M.Ed', experience: 12 },
    { firstName: 'Teacher', lastName: 'Seven', email: 'teacher007@demo.schoolms.com', gender: 'MALE', qualification: 'B.Sc', experience: 4 },
    { firstName: 'Teacher', lastName: 'Eight', email: 'teacher008@demo.schoolms.com', gender: 'FEMALE', qualification: 'M.A', experience: 7 },
    { firstName: 'Teacher', lastName: 'Nine', email: 'teacher009@demo.schoolms.com', gender: 'MALE', qualification: 'M.Sc', experience: 9 },
    { firstName: 'Teacher', lastName: 'Ten', email: 'teacher010@demo.schoolms.com', gender: 'FEMALE', qualification: 'M.Ed', experience: 11 },
  ];

  for (const t of teachersData) {
    const teacherUser = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email: t.email,
        passwordHash,
        firstName: t.firstName,
        lastName: t.lastName,
        role: 'TEACHER',
        status: 'ACTIVE',
        schoolId: school.id,
      },
    });

    await prisma.teacher.upsert({
      where: { userId: teacherUser.id },
      update: {},
      create: {
        userId: teacherUser.id,
        employeeId: `EMP-${teacherUser.id.slice(-6)}`,
        dateOfBirth: new Date(1985, 0, 1),
        gender: t.gender,
        qualification: t.qualification,
        experience: t.experience,
        joiningDate: new Date(2014, 5, 1),
      },
    });
  }

  const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer Science'];
  const subjectMap: Record<string, string> = {};

  for (const subjectName of subjects) {
    const subject = await prisma.subject.upsert({
      where: { schoolId_name: { schoolId: school.id, name: subjectName } },
      update: {},
      create: {
        schoolId: school.id,
        name: subjectName,
        code: subjectName.slice(0, 3).toUpperCase(),
        description: `${subjectName} subject`,
        isActive: true,
      },
    });
    subjectMap[subjectName] = subject.id;
  }

  const teacherUsers = await prisma.user.findMany({
    where: { role: 'TEACHER', schoolId: school.id, deletedAt: null },
  });

  const teacherProfileMap: Record<string, string> = {};
  for (const tu of teacherUsers) {
    const tp = await prisma.teacher.findFirst({ where: { userId: tu.id } });
    if (tp) {
      teacherProfileMap[tu.id] = tp.id;
    }
  }

  const taData: any[] = [];
  let teacherIdx = 0;
  for (const className of classNames) {
    const clsId = classMap[className];
    for (const sectionName of sectionNames) {
      const sectionId = sectionMap[`${className}-${sectionName}`];
      const subjectKeys = Object.keys(subjectMap);
      for (let s = 0; s < subjectKeys.length; s++) {
        const teacherUser = teacherUsers[teacherIdx % teacherUsers.length];
        const teacherId = teacherProfileMap[teacherUser.id];
        if (!teacherId) {
          teacherIdx++;
          continue;
        }
        taData.push({
          schoolId: school.id,
          teacherId,
          classId: clsId,
          sectionId: sectionId,
          subjectId: subjectMap[subjectKeys[s]],
          academicYearId: academicYear.id,
          isClassTeacher: s === 0,
        });
        teacherIdx++;
      }
    }
  }

  await prisma.teacherAssignment.createMany({
    data: taData,
    skipDuplicates: true,
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const guardianRelations = ['Father', 'Mother', 'Guardian'];

  const userData: any[] = [];
  const studentData: any[] = [];
  const enrollmentData: any[] = [];

  let studentCount = 0;
  for (const className of classNames) {
    for (const sectionName of sectionNames) {
      for (let i = 1; i <= 10; i++) {
        const studentNum = studentCount + i;
        const email = `student${String(studentNum).padStart(3, '0')}@demo.schoolms.com`;
        const admissionNumber = `ADM-${String(studentNum).padStart(4, '0')}`;
        const rollNumber = String(i);
        const firstName = `Student${String(studentNum).padStart(3, '0')}`;
        const lastName = className.replace(/\s/g, '');
        const gender = i % 2 === 0 ? 'FEMALE' : 'MALE';
        const bloodGroup = bloodGroups[studentNum % bloodGroups.length];
        const guardianName = `Guardian${String(studentNum).padStart(3, '0')}`;
        const guardianPhone = `+1555000${String(studentNum).padStart(4, '0')}`;
        const guardianEmail = `guardian${String(studentNum).padStart(3, '0')}@demo.schoolms.com`;
        const guardianRelation = guardianRelations[studentNum % guardianRelations.length];
        const year = 2010 + (classNames.indexOf(className) * 2);
        const month = (studentNum % 12) + 1;
        const day = (studentNum % 28) + 1;

        userData.push({
          email,
          passwordHash,
          firstName,
          lastName,
          phone: `+1555001${String(studentNum).padStart(4, '0')}`,
          role: 'STUDENT',
          status: 'ACTIVE',
          schoolId: school.id,
        });

        studentData.push({
          admissionNumber,
          dateOfBirth: new Date(year, month, day),
          gender,
          bloodGroup,
          address: `${studentNum} Demo Street`,
          guardianName,
          guardianPhone,
          guardianEmail,
          guardianRelation,
          enrollmentDate: new Date('2024-04-01'),
        });

        const sectionId = sectionMap[`${className}-${sectionName}`];
        enrollmentData.push({
          schoolId: school.id,
          classId: classMap[className],
          sectionId: sectionId,
          academicYearId: academicYear.id,
          rollNumber,
        });

        studentCount++;
      }
    }
  }

  const existingUsers = await prisma.user.findMany({
    where: { email: { in: userData.map(u => u.email) }, deletedAt: null },
    select: { id: true, email: true },
  });
  const existingUserMap = new Map(existingUsers.map(u => [u.email, u.id]));

  const newUserData: any[] = [];
  const newUserEmails: string[] = [];
  for (const u of userData) {
    if (!existingUserMap.has(u.email)) {
      newUserData.push(u);
      newUserEmails.push(u.email);
    }
  }

  if (newUserData.length > 0) {
    await prisma.user.createMany({
      data: newUserData,
      skipDuplicates: true,
    });
  }

  const allUserEmails = Array.from(new Set([...userData.map(u => u.email)]));
  const allUsers = await prisma.user.findMany({
    where: { email: { in: allUserEmails }, deletedAt: null },
    select: { id: true, email: true },
  });
  const allUserMap = new Map(allUsers.map(u => [u.email, u.id]));

  const existingStudents = await prisma.student.findMany({
    where: { userId: { in: Array.from(allUserMap.values()) }, deletedAt: null },
    select: { id: true, userId: true },
  });
  const existingStudentUserIds = new Set(existingStudents.map(s => s.userId));

  const newStudentData: any[] = [];
  const newEnrollmentData: any[] = [];
  for (let i = 0; i < userData.length; i++) {
    const userId = allUserMap.get(userData[i].email)!;
    if (!existingStudentUserIds.has(userId)) {
      newStudentData.push({ ...studentData[i], userId });
      newEnrollmentData.push(enrollmentData[i]);
    }
  }

  if (newStudentData.length > 0) {
    await prisma.student.createMany({
      data: newStudentData,
      skipDuplicates: true,
    });
  }

  const allStudents = await prisma.student.findMany({
    where: { userId: { in: Array.from(allUserMap.values()) }, deletedAt: null },
    select: { id: true, userId: true },
  });
  const studentUserMap = new Map(allStudents.map(s => [s.userId, s.id]));

  const finalEnrollmentData: any[] = [];
  for (let i = 0; i < enrollmentData.length; i++) {
    const userId = allUserMap.get(userData[i].email)!;
    const studentId = studentUserMap.get(userId);
    if (studentId) {
      finalEnrollmentData.push({
        ...enrollmentData[i],
        studentId,
      });
    }
  }

  if (finalEnrollmentData.length > 0) {
    await prisma.enrollment.createMany({
      data: finalEnrollmentData,
      skipDuplicates: true,
    });
  }

  const schoolCount = await prisma.school.count({ where: { deletedAt: null } });
  const ayCount = await prisma.academicYear.count({ where: { deletedAt: null } });
  const classCount = await prisma.class.count({ where: { schoolId: school.id, deletedAt: null } });
  const sectionCount = await prisma.section.count({ where: { schoolId: school.id, deletedAt: null } });
  const studentTotal = await prisma.student.count({ where: { deletedAt: null } });
  const teacherTotal = await prisma.teacher.count({ where: { deletedAt: null } });
  const adminTotal = await prisma.schoolAdmin.count({ where: { deletedAt: null } });
  const principalTotal = await prisma.principal.count({ where: { deletedAt: null } });

  console.log('Seed completed successfully');
  console.log('School:', schoolCount);
  console.log('Academic years:', ayCount);
  console.log('Classes:', classCount);
  console.log('Sections:', sectionCount);
  console.log('Students:', studentTotal);
  console.log('Teachers:', teacherTotal);
  console.log('School admins:', adminTotal);
  console.log('Principals:', principalTotal);
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
