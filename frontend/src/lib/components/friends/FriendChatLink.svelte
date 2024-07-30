<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import { page } from '$app/stores';
	import { contextMenuInfo } from '$lib/stores';
	import FriendsContextMenu from './FriendsContextMenu.svelte';
	import { generateRandomId, handleContextMenu } from '$lib/utils';
	import { notifications } from '$lib/stores';

	export let id: string;
	export let href: string = '';
	export let username: string;
	export let about_me: string = '';
	export let avatar: string = '';
	export let status: string = 'bg-offline';

	let openContextMenuId = `context-menu-${generateRandomId()}`;
	let isOpen: boolean = false;
	let notification;

	$: isOpen = $contextMenuInfo?.id === openContextMenuId;
	$: notification = $notifications.filter(
		(notification) =>
			notification.channel_id?.split(':')[1] === id.split(':')[1] && !notification.read
	)[0];
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger on:contextmenu={() => handleContextMenu(openContextMenuId)}>
		<a
			class="flex gap-x-3 hover:bg-zinc-800/75 p-3 rounded-2xl active:scale-[0.97] items-center w-full"
			class:active={$page.url.pathname.includes(href)}
			id="friend-link"
			{href}
		>
			<div
				id="friend-avatar"
				class={`h-10 w-10 relative before:block before:h-3 before:w-3 before:border-2 before:border-zinc-900 before:absolute before:-bottom-2 before:rounded-xl before:left-1/2 before:-translate-x-1/2 before:z-10 before:transition-[width] before:duration-200 before:ease-bounce-hard`}
				class:before:bg-online={status === 'online'}
				class:before:bg-dontdisturb={status === 'dontdisturb'}
				class:before:bg-absent={status === 'absent'}
				class:before:bg-offline={status === 'offline'}
			>
				{#if notification}
					<div
						class="absolute -top-2 -right-2 h-4 w-4 bg-destructive rounded-full flex justify-center items-center text-[0.65rem] leading-[0.5rem]"
					>
						{notification.counter > 9 ? '9+' : notification.counter}
					</div>
					<div class="absolute top-0 left-0 h-full w-full notif-shadow rounded-xl"></div>
				{/if}
				<img class="w-full rounded-xl h-full object-cover" src={avatar} alt="" />
			</div>
			<div class="text-left">
				<p class="leading-none font-medium text-sm">{username}</p>
				{#if about_me}
					<p
						class="text-zinc-500 leading-none mt-1 font-light text-sm w-[15ch] overflow-hidden text-ellipsis whitespace-nowrap"
					>
						{about_me}
					</p>
				{/if}
			</div>
		</a>
	</ContextMenu.Trigger>
	{#if isOpen}
		<FriendsContextMenu {id} {username} />
	{/if}
</ContextMenu.Root>

<style lang="postcss">
	.active {
		background-color: theme(colors.zinc.800);
		border-color: theme(colors.zinc.800);
	}

	.active:hover {
		background-color: theme(colors.zinc.850);
	}

	.active > #friend-avatar::before {
		width: 1.5rem !important;
	}

	#friend-link {
		transition:
			transform 75ms ease-out,
			background-color 75ms ease-out;
	}

	.notif-shadow {
		box-shadow: inset -4px 4px 10px rgba(226, 68, 77, 0.65);
	}
</style>
