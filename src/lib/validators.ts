import { z } from 'zod';

export const tenantSlugSchema = z
  .string()
  .min(2)
  .max(32)
  .regex(/^[a-z0-9-]+$/);

export const signupSchema = z.object({
  tenantName: z.string().min(2).max(80),
  tenantSlug: tenantSlugSchema,
  name: z.string().min(2).max(80),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200)
});

export const loginSchema = z.object({
  tenantSlug: tenantSlugSchema,
  email: z.string().email().max(200),
  password: z.string().min(1).max(200)
});

export const createNoteSchema = z.object({
  tenantSlug: tenantSlugSchema,
  title: z.string().min(1).max(200),
  body: z.string().max(5000).optional().default('')
});
