import { z } from 'zod';

export const friendRequestSchema = z.object({
	username: z
		.string()
		.min(3, { message: 'This must be 3-20 characters' })
		.max(20, { message: 'This must be 3-20 characters' }),
	unexpected: z.string().optional()
});

export type FriendRequestFormSchema = typeof friendRequestSchema;
