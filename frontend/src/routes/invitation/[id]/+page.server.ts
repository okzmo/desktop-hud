import { zod } from 'sveltekit-superforms/adapters';
import { fail, setError, superValidate } from 'sveltekit-superforms';
import { registerFormSchema } from '$lib/components/connection/schema-signup.js';
import { redirect, type Actions } from '@sveltejs/kit';

export const load = async ({ params }) => {
	try {
		const response = await fetch(
			`${import.meta.env.VITE_API_URL}/invitations/validity/${params.id}`,
			{
				method: 'GET',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);

		if (!response.ok) {
			throw new Error(`Invitation invalid or expired`);
		}

		const invitationData = await response.json();

		return {
			form: await superValidate(zod(registerFormSchema)),
			invite: invitationData.invite
		};
	} catch (error) {
		console.log(error);
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, zod(registerFormSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/signup`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(form.data)
			});

			const data = await response.json();

			if (!response.ok) {
				return setError(form, data.name, data.message);
			}

			const setCookieHeader = response.headers.get('set-cookie');
			if (setCookieHeader) {
				const cookieParts = setCookieHeader.split(';').map((part) => part.trim());
				const [cookieNameValue, ...options] = cookieParts;
				const [name, value] = cookieNameValue.split('=');

				cookies.set(name, value, {
					path: '/',
					httpOnly: true,
					expires: new Date(options[2].split('=')[1]),
					domain: import.meta.env.VITE_COOKIE_DOMAIN,
					sameSite: 'none',
					secure: true,
					encode: (val) => val
				});
			}
		} catch (err) {
			console.log(err);
			return fail(500, { error: 'An unexpected error occured.' });
		}

		throw redirect(303, '/hudori/chat/friends');
	}
};
