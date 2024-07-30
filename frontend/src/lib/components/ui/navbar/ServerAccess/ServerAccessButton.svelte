<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import ServerAccessContextMenu from './ServerAccessContextMenu.svelte';
	import { contextMenuInfo, notifications, serversStateStore } from '$lib/stores';
	import { generateRandomId, handleContextMenu } from '$lib/utils';
	import { user } from '$lib/stores';

	export let icon: string | undefined;
	export let name: string;
	export let id: string;
	export let roles: string[] | undefined;

	let openContextMenuId = `context-menu-${generateRandomId()}`;
	let isOpen: boolean = false;
	let href = `/hudori/chat/community/${id.split(':')[1]}`;
	let serverNotif = false;
	let mentioned = false;
	let inviteId = '';

	$: isOpen = $contextMenuInfo?.id === openContextMenuId;
	$: if ($serversStateStore[id]) {
		href = `/hudori/chat/community/${id.split(':')[1]}/channels/${$serversStateStore[id].lastVisited}`;
	}

	$: if ($notifications) {
		serverNotif = $notifications.some(
			(notif) => notif.server_id && notif.server_id === id && !notif.read
		);
		mentioned = $notifications.some(
			(notif) => serverNotif && notif.mentions?.includes($user?.id) && !notif.read
		);
	}
</script>

<li>
	<ContextMenu.Root>
		<ContextMenu.Trigger on:contextmenu={() => handleContextMenu(openContextMenuId, roles)}>
			<Button class="h-12 w-12 rounded-xl text-zinc-500 relative" size="icon" {href}>
				{#if icon}
					<img
						class="h-full w-full object-cover rounded-xl"
						src={icon}
						alt={name.slice(0, 2).toUpperCase()}
					/>
				{:else}
					{name.slice(0, 2).toUpperCase()}
				{/if}
				{#if serverNotif}
					<div class="absolute h-2 w-2 bg-white -left-[32%] top-1/2 -translate-y-1/2 rounded-lg" />
				{/if}
				{#if mentioned}
					<div class="absolute h-2 w-2 bg-destructive -right-[0.15rem] -top-[0.15rem] rounded-lg" />
				{/if}
			</Button>
		</ContextMenu.Trigger>
		{#if isOpen}
			<ServerAccessContextMenu {roles} {name} {id} />
		{/if}
	</ContextMenu.Root>
</li>
