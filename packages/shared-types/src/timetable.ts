import { z } from 'zod';

export const TimetableEntrySchema = z.object({
  id: z.string(),
  publicId: z.string().uuid(),
  schoolId: z.string(),
  classId: z.string(),
  sectionId: z.string().nullable().optional(),
  subjectId: z.string(),
  teacherId: z.string(),
  academicYearId: z.string(),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  roomNumber: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const CreateTimetableEntrySchema = z.object({
  schoolId: z.string().optional(),
  classId: z.string().min(1),
  sectionId: z.string().optional(),
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
  academicYearId: z.string().min(1),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  roomNumber: z.string().max(100).optional(),
});

export const UpdateTimetableEntrySchema = CreateTimetableEntrySchema.partial();

export type TimetableEntry = z.infer<typeof TimetableEntrySchema>;
export type CreateTimetableEntry = z.infer<typeof CreateTimetableEntrySchema>;
export type UpdateTimetableEntry = z.infer<typeof UpdateTimetableEntrySchema>;
