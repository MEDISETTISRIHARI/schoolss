import { z } from 'zod';

export const SectionSchema = z.object({
  id: z.string(),
  publicId: z.string().uuid(),
  schoolId: z.string(),
  classId: z.string(),
  academicYearId: z.string(),
  name: z.string(),
  capacity: z.number().int().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
  school: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
  class: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
  academicYear: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
});

export const CreateSectionSchema = z.object({
  classId: z.string().min(1),
  academicYearId: z.string().min(1),
  name: z.string().min(1).max(100),
  capacity: z.number().int().nonnegative().optional(),
});

export const UpdateSectionSchema = CreateSectionSchema.partial();

export type Section = z.infer<typeof SectionSchema>;
export type CreateSection = z.infer<typeof CreateSectionSchema>;
export type UpdateSection = z.infer<typeof UpdateSectionSchema>;
