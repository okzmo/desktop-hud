import { goto } from '$app/navigation';
import { get } from 'svelte/store';
import {
	notifications,
	messages,
	friends,
	servers,
	addParticipant,
	removeParticipant,
	updateParticipantStatus,
	vcRoom,
	usersTyping,
	user,
	messProto
} from './stores';
import { decompress } from 'brotli-dec-wasm/web';
import type { Notification } from './types';

export async function treatMessage(message: ArrayBuffer) {
	const proto = get(messProto);

	const decompressed = decompress(new Uint8Array(message));
	const decoded = proto.decode(decompressed);
	const wsMessage = decoded.toJSON();

	switch (wsMessage.type) {
		case 'text_message':
			const newMessage = wsMessage.mess;
			const pathname = window.location.pathname;
			const ownId = get(user);
			const channelId =
				newMessage.channel_id.split(':')[1] === ownId?.id.split(':')[1]
					? newMessage.author.id.split(':')[1]
					: newMessage.channel_id.split(':')[1];

			messages.update((cache) => {
				if (cache[channelId] && cache[channelId].messages) {
					cache[channelId].messages.push(newMessage);
					cache[channelId].scrollPosition = undefined;
				}
				return cache;
			});

			if (pathname.includes(channelId)) {
				usersTyping.update((users) => {
					const exist = users.findIndex((user) => user.user_id === newMessage.author.id);
					if (exist > -1) {
						users.splice(exist, 1);
					}
					return users;
				});
			}
			break;
		case 'edit_message':
			messages.update((cache) => {
				const mess = cache[wsMessage.mess.author?.id || wsMessage.mess.channel_id]?.messages?.find(
					(message) => message.id === wsMessage.mess.id
				);
				if (mess) {
					mess.content = wsMessage.mess.content;
					mess.mentions = wsMessage.mess.mentions;
					mess.edited = wsMessage.mess.edited;
				}
				return cache;
			});

			break;
		case 'delete_message':
			messages.update((cache) => {
				const messIdx = cache[
					wsMessage.mess.author?.id || wsMessage.mess.channel_id
				]?.messages?.findIndex((message) => message.id === wsMessage.mess.id);
				if (messIdx > -1) {
					cache[wsMessage.mess.author?.id || wsMessage.mess.channel_id].messages.splice(messIdx, 1);
				}
				return cache;
			});

			break;
		case 'friend_request':
			notifications.update((notifications) => {
				notifications.unshift(wsMessage.friend_request);
				return notifications;
			});

			break;
		case 'friend_accept':
			friends.update((friends) => {
				friends.push(wsMessage.friend_accept);
				return friends;
			});

			break;
		case 'create_channel':
			servers.update((cache) => {
				const server = cache[wsMessage.channel.server_id];
				const category = server?.categories.find(
					(category) => category.name === wsMessage.channel.category_name
				);
				category?.channels.push(wsMessage.channel.channel);
				return cache;
			});
			break;
		case 'delete_channel':
			servers.update((cache) => {
				const server = cache[wsMessage.delchannel.server_id];
				let category = server?.categories.find(
					(category) => category.name === wsMessage.delchannel.category_name
				);
				const chanIdx = category?.channels.findIndex(
					(channel) => channel.id === wsMessage.delchannel.channel_id
				)!;
				category?.channels.splice(chanIdx, 1);
				return cache;
			});

			if (window.location.pathname.includes(wsMessage.delchannel.channel_id.split(':')[1])) {
				const serversInfos = get(servers);
				const chanId =
					serversInfos[wsMessage.delchannel.server_id].categories[0].channels[0].id.split(':')[1];
				goto(
					`/hudori/chat/community/${wsMessage.delchannel.server_id.split(':')[1]}/channels/${chanId}`
				);
			}
			break;
		case 'create_category':
			servers.update((cache) => {
				const server = cache[wsMessage.create_category.server_id];
				server?.categories.push({ name: wsMessage.create_category.category_name, channels: [] });
				return cache;
			});
			break;
		case 'delete_category':
			servers.update((cache) => {
				const server = cache[wsMessage.delete_category.server_id];
				let catIdx = server?.categories.findIndex(
					(category) => category.name === wsMessage.delete_category.category_name
				)!;
				server?.categories.splice(catIdx, 1);
				return cache;
			});
			break;
		case 'friend_remove':
			friends.update((friends) => {
				const newArr = friends.filter((friend) => friend.id !== wsMessage.user_id);
				return newArr;
			});
			if (window.location.pathname.includes(wsMessage.user_id.split(':')[1])) {
				goto('/hudori/chat/friends');
			}
			break;
		case 'delete_server':
			servers.update((servers) => {
				delete servers[wsMessage.server_id];
				return servers;
			});
			if (window.location.pathname.includes(wsMessage.server_id.split(':')[1])) {
				goto('/hudori/chat/friends');
			}
			break;
		case 'join_server':
			if (window.location.pathname.includes(wsMessage.join_server.server_id.split(':')[1])) {
				servers.update((cache) => {
					const server = cache[wsMessage.serverId];
					server?.members.push(wsMessage.join_server.user);
					return cache;
				});
			}
			break;
		case 'leave_server':
			if (window.location.pathname.includes(wsMessage.quit_server.server_id.split(':')[1])) {
				servers.update((cache) => {
					const server = cache[wsMessage.quit_server.server_id];
					const memberIdx = server?.members.findIndex(
						(server) => server.id === wsMessage.quit_server.user_id
					)!;
					server?.members.splice(memberIdx, 1);
					return cache;
				});
			}
			break;
		case 'new_avatar':
			friends.update((friends) => {
				const friend = friends.find(
					(friend) => friend.id === 'users:' + wsMessage.change_avatar.user_id
				);
				if (friend) {
					friend.avatar = wsMessage.change_avatar.avatar;
				}
				return friends;
			});
			break;
		case 'new_server_icon':
			servers.update((server) => {
				const serverExist = server[wsMessage.server_pic.id];
				if (serverExist) {
					serverExist.icon = wsMessage.server_pic.picture;
				}
				return server;
			});
			break;
		case 'change_status':
			friends.update((friends) => {
				const friend = friends.find((friend) => friend.id === wsMessage.change_status.user_id);
				if (friend) {
					friend.status = wsMessage.change_status.status;
				}
				return friends;
			});
			break;
		case 'typing':
			const userInfos = get(user);
			if (userInfos.id === wsMessage.typing?.user_id) return;
			usersTyping.update((usersTyping) => {
				if (wsMessage.typing?.status === 'start') {
					const exist = usersTyping.find((user) => user.user_id === wsMessage.typing?.user_id);
					if (!exist) {
						usersTyping.push({
							user_id: wsMessage.typing?.user_id,
							display_name: wsMessage.typing?.display_name,
							channel_id: wsMessage.typing?.channel_id
						});
					}
				} else if (wsMessage.typing?.status === 'end') {
					return usersTyping.filter((user) => user.user_id !== wsMessage.typing?.user_id);
				}
				return usersTyping;
			});
			break;
		case 'new_notification':
			manageNewNotification(wsMessage.notification);
			break;
		default:
			break;
	}
}

export function treatMessageJSON(message: any) {
	const wsMessage = JSON.parse(message);

	const room = get(vcRoom);
	switch (wsMessage.type) {
		case 'new_participant':
			addParticipant(
				wsMessage.content.serverId,
				wsMessage.content.channelId,
				wsMessage.content.user
			);
			if (room?.name === wsMessage.content.channelId) {
				const audio = document.getElementById('audio_join_channel') as HTMLMediaElement;
				audio.play();
			}
			break;
		case 'quit_participant':
			removeParticipant(
				wsMessage.content.serverId,
				wsMessage.content.channelId,
				wsMessage.content.user_id
			);
			if (room?.name === wsMessage.content.channelId) {
				const audio = document.getElementById('audio_quit_channel') as HTMLMediaElement;
				audio.play();
			}
			break;
		case 'participant_status':
			updateParticipantStatus(
				wsMessage.content.serverId,
				wsMessage.content.channelId,
				wsMessage.content.user_id,
				wsMessage.content.muted,
				wsMessage.content.deafen
			);
			break;
	}
}

function manageNewNotification(notification: Notification) {
	switch (notification.type) {
		case 'new_message':
			notifications.update((cache) => {
				const notif = cache.find(
					(cache) =>
						cache.user_id === notification.user_id && cache.channel_id === notification.channel_id
				);
				if (!notif) {
					cache.push(notification);
				} else if (notif && notification.mentions) {
					notif.mentions = notification.mentions;
					notif.counter = notification.counter;
					notif.read = false;
				} else {
					notif.counter = notification.counter;
					notif.read = false;
				}

				messages.update((cache) => {
					if (cache[notification.channel_id]) {
						cache[notification.channel_id].scrollPosition = undefined;
					}
					return cache;
				});

				return cache;
			});
			break;
	}
}
