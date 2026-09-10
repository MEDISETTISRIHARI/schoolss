import { z } from 'zod';

export const AwardTypeSchema = z.enum(['ACADEMIC', 'SPORTS', 'CULTURAL', 'ATTENDANCE', 'OTHER']);
export const AwardTypeValues = ['ACADEMIC', 'SPORTS', 'CULTURAL', 'ATTENDANCE', 'OTHER'] as const;

export const AwardSchema = z.object({
  id: z.string(),
  publicId: z.string().uuid(),
  schoolId: z.string(),
  studentId: z.string(),
  type: AwardTypeSchema,
  title: z.string(),
  description: z.string().nullable().optional(),
  awardedDate: z.coerce.date(),
  approvedBy: z.string().nullable().optional(),
  status: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const CreateAwardSchema = z.object({
  schoolId: z.string().optional(),
  studentId: z.string().min(1),
  type: AwardTypeSchema,
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  awardedDate: z.coerce.date(),
  approvedBy: z.string().optional(),
  status: z.string().max(50).optional(),
});

export const UpdateAwardSchema = CreateAwardSchema.partial();

export type Award = z.infer<typeof AwardSchema>;
export type AwardType = z.infer<typeof AwardTypeSchema>;
export type CreateAward = z.infer<typeof CreateAwardSchema>;
export type UpdateAward = z.infer<typeof UpdateAwardSchema>;
