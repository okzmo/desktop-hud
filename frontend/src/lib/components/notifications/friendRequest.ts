import type { User } from '$lib/types';
import { AcceptFriend, AddFriend, RefuseFriend } from '$lib/wailsjs/go/main/App';

export async function addFriend(
	ev: Event,
	initiator_id: string,
	initiator_username: string,
	receiver_username: string
) {
	ev.preventDefault();

	const body = {
		initiator_id,
		initiator_username,
		receiver_username
	};

	try {
		const response = await AddFriend(JSON.stringify(body));

		if (response.message !== 'success') {
			throw new Error(`error occured when accepting friend request ${response.status}`);
		}

		return response;
	} catch (error) {
		console.log(error);
	}
}

export async function acceptFriendRequest(
	request_id: string,
	notif_id: string
): Promise<User | undefined> {
	const body = {
		request_id: request_id,
		id: notif_id
	};

	try {
		const response = await AcceptFriend(JSON.stringify(body));

		if (response.message !== 'success') {
			throw new Error(`error occured when accepting friend request ${response.status}`);
		}

		return response.friend;
	} catch (error) {
		console.log(error);
	}
}

export async function refuseFriendRequest(request_id: string, notif_id: string): Promise<boolean> {
	const body = {
		request_id: request_id,
		id: notif_id
	};

	try {
		const response = await RefuseFriend(JSON.stringify(body));

		if (response.message !== 'success') {
			throw new Error(`error occured when refusing friend request ${response.status}`);
		}
		return true;
	} catch (error) {
		console.log(error);
		return false;
	}
}
