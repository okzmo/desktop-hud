import { z } from 'zod';

export const registerFormSchema = z.object({
	email: z.string().email(),
	username: z
		.string()
		.min(3, { message: 'This must be 3-20 characters' })
		.max(20, { message: 'This must be 3-20 characters' }),
	display_name: z
		.string()
		.min(3, { message: 'This must be 3-20 characters' })
		.max(20, { message: 'This must be 3-20 characters' }),
	password: z.string().min(8, { message: 'This must be at least 8 characters' }),
	unexpected: z.string().optional()
});

export type RegisterFormSchema = typeof registerFormSchema;
