import { z } from 'zod';

export const UserRoleSchema = z.enum(['SUPER_ADMIN', 'PRINCIPAL', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT']);
export const UserRoleValues = ['SUPER_ADMIN', 'PRINCIPAL', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] as const;
export const UserStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']);
export const UserStatusValues = ['ACTIVE', 'SUSPENDED', 'ARCHIVED'] as const;

export const UserSchema = z.object({
  id: z.string(),
  publicId: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional(),
  profileImageUrl: z.string().optional(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  schoolId: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const RoleSelectionSchema = z.object({
  selectedRole: UserRoleSchema,
});

export const LoginWithRoleSchema = LoginSchema.extend({
  selectedRole: UserRoleSchema.optional(),
});

export const RoleOptionSchema = z.object({
  role: UserRoleSchema,
  label: z.string(),
  description: z.string().optional(),
});

export const LoginResponseSchema = z.object({
  user: UserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
  availableRoles: z.array(UserRoleSchema).optional(),
  requiresRoleSelection: z.boolean().optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const SchoolSchema = z.object({
  id: z.string(),
  publicId: z.string().uuid(),
  name: z.string(),
  subdomain: z.string().optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateSchoolSchema = z.object({
  name: z.string().min(1).max(255),
  subdomain: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(255).optional(),
  website: z.string().max(255).optional(),
  logoUrl: z.string().max(500).optional(),
  primaryColor: z.string().max(20).optional(),
  secondaryColor: z.string().max(20).optional(),
  subscriptionPlan: z.string().max(50).optional(),
  subscriptionStatus: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateSchoolSchema = CreateSchoolSchema.partial();

export const CreateUserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(100),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  profileImageUrl: z.string().max(500).optional(),
  role: UserRoleSchema,
  schoolId: z.string().optional(),
  status: UserStatusSchema.optional(),
});

export const UpdateUserSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  profileImageUrl: z.string().max(500).optional(),
});

export const ChangeRoleSchema = z.object({
  role: UserRoleSchema,
});

export const ChangeStatusSchema = z.object({
  status: UserStatusSchema,
});

export const UpdateSettingsSchema = z.object({
  settings: z.record(z.string(), z.unknown()).optional(),
});

export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserStatus = z.infer<typeof UserStatusSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;
export type School = z.infer<typeof SchoolSchema>;
export type CreateSchool = z.infer<typeof CreateSchoolSchema>;
export type UpdateSchool = z.infer<typeof UpdateSchoolSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type ChangeRole = z.infer<typeof ChangeRoleSchema>;
export type ChangeStatus = z.infer<typeof ChangeStatusSchema>;
export type UpdateSettings = z.infer<typeof UpdateSettingsSchema>;
export type RoleSelection = z.infer<typeof RoleSelectionSchema>;
export type LoginWithRole = z.infer<typeof LoginWithRoleSchema>;
export type RoleOption = z.infer<typeof RoleOptionSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
