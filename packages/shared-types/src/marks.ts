import { z } from 'zod';

export const MarkSchema = z.object({
  id: z.string(),
  publicId: z.string().uuid(),
  schoolId: z.string(),
  examinationId: z.string(),
  studentId: z.string(),
  subjectId: z.string(),
  teacherId: z.string(),
  marksObtained: z.number(),
  remarks: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const CreateMarkSchema = z.object({
  schoolId: z.string().optional(),
  examinationId: z.string().min(1),
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
  marksObtained: z.number().nonnegative(),
  remarks: z.string().max(500).optional(),
});

export const UpdateMarkSchema = CreateMarkSchema.partial();

export type Mark = z.infer<typeof MarkSchema>;
export type CreateMark = z.infer<typeof CreateMarkSchema>;
export type UpdateMark = z.infer<typeof UpdateMarkSchema>;
