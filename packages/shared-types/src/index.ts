import { z } from 'zod';

export * from './auth';
export * from './students';
export * from './teachers';
export * from './classes';
export * from './sections';
export * from './subjects';
export * from './academic-years';
export * from './attendance';
export * from './examinations';
export * from './marks';
export * from './results';
export * from './awards';
export * from './certificates';
export * from './homework';
export * from './timetable';
export * from './notifications';
export * from './files';
export * from './backup';

export const ResponseEnvelopeSchema = z.object({
  success: z.boolean(),
  data: z.unknown(),
  meta: z.record(z.string(), z.unknown()).nullable(),
  error: z.string().nullable(),
});

export const PaginatedResponseSchema = z.object({
  data: z.array(z.unknown()),
  meta: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
  }),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export type ResponseEnvelope = z.infer<typeof ResponseEnvelopeSchema>;
export type PaginatedResponse = z.infer<typeof PaginatedResponseSchema>;
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
export type ForgotPassword = z.infer<typeof ForgotPasswordSchema>;
