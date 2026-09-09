import { z } from 'zod';

export const CertificateSchema = z.object({
  id: z.string(),
  publicId: z.string().uuid(),
  schoolId: z.string(),
  awardId: z.string(),
  studentId: z.string(),
  certificateNumber: z.string(),
  issuedAt: z.coerce.date(),
  issuedBy: z.string(),
  fileUrl: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
  school: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
  student: z.object({
    id: z.string(),
    user: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
    }).optional(),
  }).optional(),
  award: z.object({
    id: z.string(),
    title: z.string(),
    type: z.string(),
  }).optional(),
});

export const CreateCertificateSchema = z.object({
  awardId: z.string().min(1),
  studentId: z.string().min(1),
  certificateNumber: z.string().min(1).max(100),
  fileUrl: z.string().max(500).optional(),
  schoolId: z.string().optional(),
});

export const UpdateCertificateSchema = z.object({
  certificateNumber: z.string().max(100).optional(),
  fileUrl: z.string().max(500).optional(),
  issuedBy: z.string().max(100).optional(),
});

export type Certificate = z.infer<typeof CertificateSchema>;
export type CreateCertificate = z.infer<typeof CreateCertificateSchema>;
export type UpdateCertificate = z.infer<typeof UpdateCertificateSchema>;
