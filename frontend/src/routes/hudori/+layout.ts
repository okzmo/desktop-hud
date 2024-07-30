import { superValidate } from 'sveltekit-superforms';
import type { LayoutServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { friendRequestSchema } from '$lib/components/friends/schema-friend-request';
import { get } from 'svelte/store';
import { user, friends, servers } from '$lib/stores';
import { AuthVerify, GetFriends, GetServers } from '$lib/wailsjs/go/main/App';
import { goto } from '$app/navigation';

export const load: LayoutServerLoad = async () => {
	try {
		const result = await AuthVerify();

		if (!result) {
			throw new Error(`invalid session: ${result}`);
		}

		user.set(result.user);

		const [friendsResponse, serversResponse] = await Promise.all([
			GetFriends(JSON.stringify({ user_id: result.user?.id.split(':')[1] })),
			GetServers(JSON.stringify({ user_id: result.user?.id.split(':')[1] }))
		]);

		if (!friendsResponse || !serversResponse) {
			throw new Error(`error on validating session: ${friendsResponse.status}`);
		}

		friends.set(friendsResponse.friends);
		servers.update((cache) => {
			serversResponse.servers.forEach((server) => {
				cache[server.id] = { ...server };
			});
			return cache;
		});

		return {
			props: {
				user: result.user,
				formFriendRequest: await superValidate(zod(friendRequestSchema))
			}
		};
	} catch (error) {
		console.log(error);
		goto('/signin');
	}
};
