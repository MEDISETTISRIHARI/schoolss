import { z } from 'zod';

export const ClassSchema = z.object({
  id: z.string(),
  publicId: z.string().uuid(),
  schoolId: z.string(),
  academicYearId: z.string(),
  name: z.string(),
  displayName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
  school: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
  academicYear: z.object({
    id: z.string(),
    name: z.string(),
    isCurrent: z.boolean(),
  }).optional(),
});

export const CreateClassSchema = z.object({
  name: z.string().min(1).max(100),
  displayName: z.string().max(255).optional(),
  description: z.string().max(500).optional(),
  academicYearId: z.string().min(1),
});

export const UpdateClassSchema = CreateClassSchema.partial();

export type Class = z.infer<typeof ClassSchema>;
export type CreateClass = z.infer<typeof CreateClassSchema>;
export type UpdateClass = z.infer<typeof UpdateClassSchema>;
