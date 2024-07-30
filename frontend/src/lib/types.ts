import type { JSONContent } from '@tiptap/core';

export interface User {
	id: string;
	email: string;
	password: string;
	username: string;
	display_name: string;
	username_color?: string;
	avatar: string;
	banner: string;
	status: string;
	about_me: string;
	created_at: string;
	deafen: boolean;
	muted: boolean;
	talking: boolean;
}

export interface Server {
	id: string;
	name: string;
	icon: string;
	banner: string;
	categories: Category[];
	roles?: string[];
	members: User[];
	created_at: string;
}

export interface Category {
	name: string;
	channels: Channel[];
}

export interface Channel {
	id: string;
	name: string;
	type: string;
	private: boolean;
	created_at: string;
	participants: User[];
}

export interface Message {
	id: string;
	author: User;
	channel_id: string;
	content: JSONContent;
	edited: boolean;
	images: string[];
	mentions: string[];
	updated_at: string;
}

export interface MessageUI {
	id: string;
	author: User;
	channel_id: string;
	content: JSONContent;
	edited: boolean;
	updated_at: string;
	groupWithPrevious: boolean;
	images: string[];
	mentions: string[];
	groupWithAfter: boolean;
	replies: {
		id: string;
		author: User;
		content: string;
	};
}

export interface Notification {
	id: string;
	user_id: string;
	type: 'friend_request' | 'new_video' | 'new_message';
	message: string;
	created_at: string;
	initiator_id?: string;
	request_id?: string;
	channel_id?: string;
	counter?: number;
	mentions?: string[];
	server_id?: string;
	read?: boolean;
}

export interface MessageCache {
	[channelId: string]: {
		messages: Message[];
		scrollPosition?: number;
		date: number;
	};
}

export interface ServersCache {
	[serverId: string]: {
		id: string;
		name: string;
		icon: string;
		banner: string;
		categories: Category[];
		roles?: string[];
		members: User[];
		created_at: string;
	};
}

export interface UsersCache {
	[userId: string]: User;
}

export interface ServersState {
	[serverId: string]: ServerState;
}

export interface ServerState {
	categories: {
		[categoryName: string]: {
			isOpen: boolean;
		};
	};
	lastVisited: string;
}

export interface TypingState {
	user_id: string;
	display_name: string;
	channel_id: string;
}
