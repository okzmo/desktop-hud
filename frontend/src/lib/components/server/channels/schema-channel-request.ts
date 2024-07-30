import { z } from 'zod';

export const channelCreationSchema = z.object({
	channelName: z
		.string()
		.min(3, { message: 'This must be 3-32 characters' })
		.max(20, { message: 'This must be 3-32 characters' }),
	type: z.string().default('textual'),
	unexpected: z.string().optional()
});

export type channelCreationFormSchema = typeof channelCreationSchema;
