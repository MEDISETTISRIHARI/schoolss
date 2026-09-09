import { z } from 'zod';

export const HomeworkSchema = z.object({
  id: z.string(),
  publicId: z.string().uuid(),
  schoolId: z.string(),
  classId: z.string(),
  sectionId: z.string().nullable().optional(),
  subjectId: z.string(),
  teacherId: z.string(),
  academicYearId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  dueDate: z.coerce.date(),
  attachmentUrl: z.string().nullable().optional(),
  isPublished: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const CreateHomeworkSchema = z.object({
  schoolId: z.string().optional(),
  classId: z.string().min(1),
  sectionId: z.string().optional(),
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
  academicYearId: z.string().min(1),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  dueDate: z.coerce.date(),
  attachmentUrl: z.string().max(500).optional(),
  isPublished: z.boolean().optional(),
});

export const UpdateHomeworkSchema = CreateHomeworkSchema.partial();

export type Homework = z.infer<typeof HomeworkSchema>;
export type CreateHomework = z.infer<typeof CreateHomeworkSchema>;
export type UpdateHomework = z.infer<typeof UpdateHomeworkSchema>;
