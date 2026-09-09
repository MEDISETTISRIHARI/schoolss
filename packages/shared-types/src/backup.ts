import { z } from 'zod';

export const BackupRecordSchema = z.object({
  id: z.string(),
  publicId: z.string().uuid(),
  schoolId: z.string(),
  type: z.string(),
  status: z.string(),
  storageUrl: z.string().nullable().optional(),
  size: z.number().int().nullable().optional(),
  startedAt: z.coerce.date(),
  completedAt: z.coerce.date().nullable().optional(),
  initiatedBy: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const CreateBackupRecordSchema = z.object({
  type: z.string().min(1).max(100),
  status: z.string().min(1).max(50),
  storageUrl: z.string().max(500).optional(),
  size: z.number().int().nonnegative().optional(),
  completedAt: z.coerce.date().optional(),
  schoolId: z.string().optional(),
});

export const UpdateBackupRecordSchema = z.object({
  type: z.string().max(100).optional(),
  status: z.string().max(50).optional(),
  storageUrl: z.string().max(500).optional(),
  size: z.number().int().nonnegative().optional(),
  startedAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  initiatedBy: z.string().optional(),
});

export type BackupRecord = z.infer<typeof BackupRecordSchema>;
export type CreateBackupRecord = z.infer<typeof CreateBackupRecordSchema>;
export type UpdateBackupRecord = z.infer<typeof UpdateBackupRecordSchema>;
