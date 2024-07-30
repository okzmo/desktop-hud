import { z } from 'zod';

export const detailsEmailSchema = z.object({
	email: z.string().email()
});

export const detailsUsernameSchema = z.object({
	username: z
		.string()
		.min(3, { message: 'This must be 3-20 characters' })
		.max(20, { message: 'This must be 3-20 characters' })
});

export const detailsDisplayNameSchema = z.object({
	display_name: z
		.string()
		.min(3, { message: 'This must be 3-20 characters' })
		.max(20, { message: 'This must be 3-20 characters' })
});

export type DetailsEmailSchema = typeof detailsEmailSchema;
export type DetailsUsernameSchema = typeof detailsUsernameSchema;
export type DetailsDisplayNameSchema = typeof detailsDisplayNameSchema;
