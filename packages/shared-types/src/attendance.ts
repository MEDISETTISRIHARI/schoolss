import { z } from 'zod';

export const AttendanceStatusSchema = z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']);
export const AttendanceStatusValues = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const;

export const AttendanceSchema = z.object({
  id: z.string(),
  publicId: z.string().uuid(),
  schoolId: z.string(),
  studentId: z.string(),
  classId: z.string(),
  sectionId: z.string().nullable().optional(),
  subjectId: z.string().nullable().optional(),
  teacherId: z.string(),
  academicYearId: z.string(),
  date: z.coerce.date(),
  status: AttendanceStatusSchema,
  remarks: z.string().nullable().optional(),
  isFinalized: z.boolean(),
  correctedBy: z.string().nullable().optional(),
  correctionReason: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const CreateAttendanceSchema = z.object({
  schoolId: z.string().optional(),
  studentId: z.string().min(1),
  classId: z.string().min(1),
  sectionId: z.string().optional(),
  subjectId: z.string().optional(),
  teacherId: z.string().min(1),
  academicYearId: z.string().min(1),
  date: z.coerce.date(),
  status: AttendanceStatusSchema,
  remarks: z.string().max(500).optional(),
  isFinalized: z.boolean().optional(),
  correctedBy: z.string().optional(),
  correctionReason: z.string().max(500).optional(),
});

export const UpdateAttendanceSchema = CreateAttendanceSchema.partial();

export type Attendance = z.infer<typeof AttendanceSchema>;
export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>;
export type CreateAttendance = z.infer<typeof CreateAttendanceSchema>;
export type UpdateAttendance = z.infer<typeof UpdateAttendanceSchema>;
