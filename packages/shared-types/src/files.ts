import { z } from 'zod';

export const FileSchema = z.object({
  id: z.string(),
  publicId: z.string().uuid(),
  schoolId: z.string(),
  uploadedById: z.string(),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number().int(),
  url: z.string(),
  path: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  relatedEntity: z.string().nullable().optional(),
  relatedId: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const CreateFileSchema = z.object({
  category: z.string().max(100).optional(),
  relatedEntity: z.string().max(100).optional(),
  relatedId: z.string().optional(),
  schoolId: z.string().optional(),
});

export const UpdateFileSchema = z.object({
  originalName: z.string().max(255).optional(),
  category: z.string().max(100).optional(),
  relatedEntity: z.string().max(100).optional(),
  relatedId: z.string().optional(),
});

export type File = z.infer<typeof FileSchema>;
export type CreateFile = z.infer<typeof CreateFileSchema>;
export type UpdateFile = z.infer<typeof UpdateFileSchema>;
