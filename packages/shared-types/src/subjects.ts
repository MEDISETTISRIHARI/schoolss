import { z } from 'zod';

export const SubjectSchema = z.object({
  id: z.string(),
  publicId: z.string().uuid(),
  schoolId: z.string(),
  name: z.string(),
  code: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
  school: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
});

export const CreateSubjectSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateSubjectSchema = CreateSubjectSchema.partial();

export type Subject = z.infer<typeof SubjectSchema>;
export type CreateSubject = z.infer<typeof CreateSubjectSchema>;
export type UpdateSubject = z.infer<typeof UpdateSubjectSchema>;
