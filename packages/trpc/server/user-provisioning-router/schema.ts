import { z } from 'zod';

export const ZProvisionUserRequestSchema = z.object({
  email: z.string().trim().email().max(320),
  name: z.string().trim().min(1).max(200),
});

export const ZProvisionUserResponseSchema = z.object({
  userId: z.number(),
  created: z.boolean().describe('Whether the account was created by this request'),
});
