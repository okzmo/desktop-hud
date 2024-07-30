import { z } from 'zod';

export const serverCreationSchema = z.object({
	id: z
		.string()
		.min(3, { message: 'This must be 3-32 characters' })
		.max(20, { message: 'This must be 3-32 characters' }),
	type: z.string().default('join'),
	unexpected: z.string().optional()
});

export type serverCreationFormSchema = typeof serverCreationSchema;
