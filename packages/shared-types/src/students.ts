import { z } from 'zod';

export const StudentSchema = z.object({
  id: z.string(),
  publicId: z.string().uuid(),
  userId: z.string(),
  admissionNumber: z.string(),
  dateOfBirth: z.coerce.date(),
  gender: z.string(),
  bloodGroup: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  guardianName: z.string().nullable().optional(),
  guardianPhone: z.string().nullable().optional(),
  guardianEmail: z.string().email().nullable().optional(),
  guardianRelation: z.string().nullable().optional(),
  enrollmentDate: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const CreateStudentSchema = z.object({
  userId: z.string(),
  admissionNumber: z.string().min(1).max(100),
  dateOfBirth: z.coerce.date(),
  gender: z.string().min(1).max(20),
  bloodGroup: z.string().max(10).optional(),
  address: z.string().max(500).optional(),
  guardianName: z.string().max(100).optional(),
  guardianPhone: z.string().max(20).optional(),
  guardianEmail: z.string().email().max(255).optional(),
  guardianRelation: z.string().max(50).optional(),
  enrollmentDate: z.coerce.date().optional(),
});

export const UpdateStudentSchema = CreateStudentSchema.partial();

export type Student = z.infer<typeof StudentSchema>;
export type CreateStudent = z.infer<typeof CreateStudentSchema>;
export type UpdateStudent = z.infer<typeof UpdateStudentSchema>;
