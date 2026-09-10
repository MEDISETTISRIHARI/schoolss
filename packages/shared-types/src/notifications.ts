import { z } from 'zod';
import { AttendanceStatusSchema } from './attendance';

export const NotificationTypeSchema = z.enum([
  'ANNOUNCEMENT',
  'HOMEWORK',
  'EXAMINATION',
  'RESULT',
  'ATTENDANCE',
  'AWARD',
  'GENERAL',
]);
export const NotificationTypeValues = [
  'ANNOUNCEMENT',
  'HOMEWORK',
  'EXAMINATION',
  'RESULT',
  'ATTENDANCE',
  'AWARD',
  'GENERAL',
] as const;

export const NotificationSchema = z.object({
  id: z.string(),
  publicId: z.string().uuid(),
  schoolId: z.string(),
  senderId: z.string(),
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  data: z.record(z.string(), z.unknown()).nullable().optional(),
  targetRoles: z.array(z.string()),
  targetUserIds: z.array(z.string()),
  targetClassIds: z.array(z.string()),
  targetSectionIds: z.array(z.string()),
  isSchoolWide: z.boolean(),
  publishedAt: z.coerce.date().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const CreateNotificationSchema = z.object({
  type: NotificationTypeSchema,
  title: z.string().min(1).max(255),
  body: z.string().min(1).max(5000),
  data: z.record(z.string(), z.unknown()).optional(),
  targetRoles: z.array(z.string()).optional(),
  targetUserIds: z.array(z.string()).optional(),
  targetClassIds: z.array(z.string()).optional(),
  targetSectionIds: z.array(z.string()).optional(),
  isSchoolWide: z.boolean().optional(),
  publishedAt: z.coerce.date().optional(),
  schoolId: z.string().optional(),
});

export const UpdateNotificationSchema = CreateNotificationSchema.partial();

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type CreateNotification = z.infer<typeof CreateNotificationSchema>;
export type UpdateNotification = z.infer<typeof UpdateNotificationSchema>;
