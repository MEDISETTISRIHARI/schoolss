import { z } from 'zod';

export const AssignmentSchema = z.object({
  id: z.string(),
  publicId: z.string(),
  schoolId: z.string(),
  teacherId: z.string(),
  classId: z.string(),
  sectionId: z.string().nullable(),
  subjectId: z.string(),
  academicYearId: z.string(),
  isClassTeacher: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Assignment = z.infer<typeof AssignmentSchema>;
