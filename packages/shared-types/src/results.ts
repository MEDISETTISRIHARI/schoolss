import { z } from 'zod';

export const ResultStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'FINALIZED']);

export const ResultSchema = z.object({
  id: z.string(),
  publicId: z.string().uuid(),
  schoolId: z.string(),
  studentId: z.string(),
  classId: z.string(),
  sectionId: z.string().nullable().optional(),
  academicYearId: z.string(),
  examinationId: z.string().nullable().optional(),
  totalMarks: z.number(),
  obtainedMarks: z.number(),
  percentage: z.number(),
  grade: z.string().nullable().optional(),
  gpa: z.number().nullable().optional(),
  cgpa: z.number().nullable().optional(),
  status: ResultStatusSchema,
  publishedAt: z.coerce.date().nullable().optional(),
  publishedBy: z.string().nullable().optional(),
  finalizedAt: z.coerce.date().nullable().optional(),
  finalizedBy: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const CreateResultSchema = z.object({
  schoolId: z.string().optional(),
  studentId: z.string().min(1),
  classId: z.string().min(1),
  sectionId: z.string().optional(),
  academicYearId: z.string().min(1),
  examinationId: z.string().optional(),
  totalMarks: z.number().nonnegative(),
  obtainedMarks: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
  grade: z.string().max(10).optional(),
  gpa: z.number().nullable().optional(),
  cgpa: z.number().nullable().optional(),
  status: ResultStatusSchema.optional(),
  publishedAt: z.coerce.date().optional(),
  publishedBy: z.string().optional(),
  finalizedAt: z.coerce.date().optional(),
  finalizedBy: z.string().optional(),
});

export const UpdateResultSchema = CreateResultSchema.partial();

export type Result = z.infer<typeof ResultSchema>;
export type ResultStatus = z.infer<typeof ResultStatusSchema>;
export type CreateResult = z.infer<typeof CreateResultSchema>;
export type UpdateResult = z.infer<typeof UpdateResultSchema>;
