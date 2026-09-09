import { z } from 'zod';
import { UserRoleSchema } from './auth';

export const TeacherSchema = z.object({
  id: z.string(),
  publicId: z.string().uuid(),
  userId: z.string(),
  employeeId: z.string(),
  dateOfBirth: z.coerce.date(),
  gender: z.string(),
  bloodGroup: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  qualification: z.string().nullable().optional(),
  experience: z.number().int().nullable().optional(),
  joiningDate: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    role: UserRoleSchema,
    schoolId: z.string().nullable().optional(),
  }),
});

export const CreateTeacherSchema = z.object({
  userId: z.string(),
  employeeId: z.string().min(1).max(100),
  dateOfBirth: z.coerce.date(),
  gender: z.string().min(1).max(20),
  bloodGroup: z.string().max(10).optional(),
  address: z.string().max(500).optional(),
  qualification: z.string().max(255).optional(),
  experience: z.number().int().nonnegative().optional(),
  joiningDate: z.coerce.date().optional(),
});

export const UpdateTeacherSchema = CreateTeacherSchema.partial();

export type Teacher = z.infer<typeof TeacherSchema>;
export type CreateTeacher = z.infer<typeof CreateTeacherSchema>;
export type UpdateTeacher = z.infer<typeof UpdateTeacherSchema>;
