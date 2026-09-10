import { z } from 'zod';

export const ExaminationTypeSchema = z.enum(['UNIT_TEST', 'MID_TERM', 'FINAL', 'ASSIGNMENT', 'PROJECT']);
export const ExaminationTypeValues = ['UNIT_TEST', 'MID_TERM', 'FINAL', 'ASSIGNMENT', 'PROJECT'] as const;

export const ExaminationSchema = z.object({
  id: z.string(),
  publicId: z.string().uuid(),
  schoolId: z.string(),
  academicYearId: z.string(),
  classId: z.string(),
  sectionId: z.string().nullable().optional(),
  subjectId: z.string(),
  teacherId: z.string().nullable().optional(),
  name: z.string(),
  type: ExaminationTypeSchema,
  date: z.coerce.date(),
  totalMarks: z.number().int(),
  passingMarks: z.number().int(),
  isPublished: z.boolean(),
  isFinalized: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const CreateExaminationSchema = z.object({
  schoolId: z.string().optional(),
  academicYearId: z.string().min(1),
  classId: z.string().min(1),
  sectionId: z.string().optional(),
  subjectId: z.string().min(1),
  teacherId: z.string().optional(),
  name: z.string().min(1).max(255),
  type: ExaminationTypeSchema,
  date: z.coerce.date(),
  totalMarks: z.number().int().nonnegative(),
  passingMarks: z.number().int().nonnegative(),
  isPublished: z.boolean().optional(),
  isFinalized: z.boolean().optional(),
});

export const UpdateExaminationSchema = CreateExaminationSchema.partial();

export type Examination = z.infer<typeof ExaminationSchema>;
export type ExaminationType = z.infer<typeof ExaminationTypeSchema>;
export type CreateExamination = z.infer<typeof CreateExaminationSchema>;
export type UpdateExamination = z.infer<typeof UpdateExaminationSchema>;
