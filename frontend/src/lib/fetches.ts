import { messages, notifications, user } from './stores';
import { get } from 'svelte/store';
import type { Message } from './types';
import { page } from '$app/stores';
import {
	CreateInvitation,
	GetMessages,
	GetNotifications,
	IndicateTyping,
	SyncNotifications,
	GetProfile
} from './wailsjs/go/main/App';

export async function getProfile(user_id: string) {
	const cache = await caches.open('user_profile');
	const cachedResponse = await cache.match(
		`${import.meta.env.VITE_API_URL}/api/v1/user/${user_id}`
	);

	if (cachedResponse) {
		const cacheTimestamp = cachedResponse.headers.get('X-Cache-Timestamp');
		const expirationTime = 30 * 1000;
		if (cacheTimestamp && Date.now() - parseInt(cacheTimestamp, 10) > expirationTime) {
			await cache.delete(`${import.meta.env.VITE_API_URL}/api/v1/user/${user_id}`);
		} else {
			const data = await cachedResponse.json();
			return data.user;
		}
	}
	try {
		const response = await GetProfile(JSON.stringify({ user_id: user_id }));

		if (!response.user) {
			throw new Error('Error occured when fetching profile.');
		}

		const headers = new Headers({
			'Content-Type': 'application/json',
			'X-Cache-Timestamp': Date.now().toString()
		});

		await cache.put(
			`${import.meta.env.VITE_API_URL}/api/v1/user/${user_id}`,
			new Response(JSON.stringify(response), { headers })
		);

		return response.user;
	} catch (error) {
		console.error(error);
	}
}

export async function getMessages(params: any): Promise<Message[] | undefined> {
	const messagesCache = get(messages);
	const userStore = get(user);
	const channelId = params.channelId ? params.channelId : params.id;
	if (messagesCache && messagesCache[channelId]) {
		return messagesCache[channelId].messages;
	}

	let response: { [key: string]: any };
	try {
		if (params.channelId) {
			response = await GetMessages(JSON.stringify({ channel_id: channelId }));
		} else {
			response = await GetMessages(
				JSON.stringify({ channel_id: channelId, user_id: userStore?.id.split(':')[1] })
			);
		}

		if (response.status && response.status !== 200) {
			throw new Error(`error on validating session: ${response}`);
		}

		messages.update((cache) => {
			cache[channelId] = {
				messages: response.messages,
				date: Date.now()
			};
			return cache;
		});
	} catch (error) {
		console.error('Error fetching messages:', error);
	}
}

export const mergeObj = (target: Object, source: Object) => {
	for (let key in source) {
		if (!target.hasOwnProperty(key)) {
			target[key] = source[key];
		}
	}

	return target;
};

export async function typing(status: string) {
	const userInfos = get(user);
	const pageInfos = get(page);

	const body = {
		user_id: userInfos.id,
		channel_id: pageInfos.params.id || pageInfos.params.channelId,
		display_name: userInfos.display_name,
		status: status
	};

	try {
		const response = await IndicateTyping(JSON.stringify(body));

		if (response.message !== 'success') {
			throw new Error(`typing error ${response.status}`);
		}

		return;
	} catch (err) {
		console.log(err);
	}
}

export function syncNotifications() {
	const userInfos = get(user);
	const notifInfos = get(notifications);
	if (!userInfos || !notifInfos) return;

	const body = {
		user_id: userInfos.id,
		channels: notifInfos
			.filter((notif) => notif.type === 'new_message' && notif.read)
			.map((notif) => notif.channel_id)
	};

	SyncNotifications(JSON.stringify(body));
}

let syncTimeout;
export function scheduleSync() {
	console.log('called');
	clearTimeout(syncTimeout);
	syncTimeout = setTimeout(syncNotifications, 5000); // Sync every 5 seconds
}

export async function fetchNotifs() {
	const userInfos = get(user);
	if (!userInfos) return;

	try {
		const response = await GetNotifications(
			JSON.stringify({ user_id: userInfos.id.split(':')[1] })
		);

		if (response.status && response.status !== 200) {
			throw new Error("couldn't fetch notifications");
		}

		notifications.set(response.notifications);
	} catch (error) {
		console.log(error);
	}
}

export async function createInvitation() {
	const userInfos = get(user);
	const pageInfos = get(page);
	if (!userInfos || !pageInfos) return;

	let body: any = {
		user_id: userInfos.id,
		server_id: 'servers:' + pageInfos.params.serverId
	};

	try {
		const response = await CreateInvitation(JSON.stringify(body));

		if (response.status && response.status !== 200) {
			throw new Error(response.message);
		}

		return response.id;
	} catch (e) {
		console.log(e);
	}
}
