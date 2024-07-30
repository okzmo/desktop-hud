import { z } from 'zod';

export const signinFormSchema = z.object({
	email: z.string().email(),
	password: z.string(),
	unexpected: z.string().optional()
});

export type SigninFormSchema = typeof signinFormSchema;
