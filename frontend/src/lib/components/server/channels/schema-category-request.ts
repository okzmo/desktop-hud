import { z } from 'zod';

export const categoryCreationSchema = z.object({
	categoryName: z
		.string()
		.min(3, { message: 'This must be 3-32 characters' })
		.max(20, { message: 'This must be 3-32 characters' }),
	unexpected: z.string().optional()
});

export type categoryCreationFormSchema = typeof categoryCreationSchema;
