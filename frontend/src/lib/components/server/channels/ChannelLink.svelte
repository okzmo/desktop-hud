<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import ChannelContextMenu from './ChannelContextMenu.svelte';
	import { contextMenuInfo, updateLastVisited, notifications, user, servers } from '$lib/stores';
	import { generateRandomId, handleContextMenu } from '$lib/utils';
	import { joinRoom } from '$lib/rtc';
	import type { User } from '$lib/types';
	import UserVcNode from './UserVCNode.svelte';

	export let href: string = '';
	export let type: string = 'text';
	export let channelName: string = 'Channel';
	export let channelId: string;
	export let categoryName: string;
	export let participants: User[];

	let openContextMenuId = `context-menu-${generateRandomId()}`;
	let isOpen: boolean = false;
	let notification;

	$: isOpen = $contextMenuInfo?.id === openContextMenuId;
	$: if ($servers[`servers:${$page.params.serverId}`] && $page.params.channelId) {
		updateLastVisited(`servers:${$page.params.serverId}`, $page.params.channelId);
	}
	$: notification = $notifications?.filter(
		(notification) => notification.channel_id === channelId
	)[0];
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger on:contextmenu={() => handleContextMenu(openContextMenuId)}>
		<div class="flex flex-col">
			<button
				class="flex gap-x-3 hover:bg-zinc-800/75 py-[0.45rem] text-zinc-500 px-3 rounded-[0.6rem] transition duration-75 active:scale-[0.97] items-center w-full"
				class:active={$page.url.pathname.includes(href)}
				class:notify={notification && !notification.read}
				class:mentioned={notification &&
					!notification.read &&
					notification.mentions &&
					notification.mentions.includes($user?.id)}
				on:click={() => {
					if (type === 'textual') {
						goto(href);
					} else {
						joinRoom(channelId, $user?.id, `servers:${$page.params.serverId}`);
					}
				}}
			>
				{#if type === 'textual'}
					<Icon
						icon="ph:chat-teardrop-text-duotone"
						class="pointer-events-none"
						height="20"
						width="20"
					/>
				{:else if type === 'voice'}
					<Icon
						icon="ph:speaker-simple-low-duotone"
						class="pointer-events-none"
						height="20"
						width="20"
					/>
				{/if}
				<p class="leading-none pointer-events-none">{channelName}</p>
			</button>
			{#if participants}
				{#each participants as participant}
					<UserVcNode connected_user={participant} />
				{/each}
			{/if}
		</div>
	</ContextMenu.Trigger>
	{#if isOpen}
		<ChannelContextMenu {channelId} {categoryName} {channelName} />
	{/if}
</ContextMenu.Root>

<style lang="postcss">
	.active {
		background-color: rgba(39, 39, 42, 0.75);
		color: theme(colors.zinc.50);
	}

	.notify {
		color: theme(colors.zinc.50);
	}

	.mentioned {
		color: theme(colors.zinc.50);
		background-color: rgba(223, 67, 67, 0.25);
	}
</style>
