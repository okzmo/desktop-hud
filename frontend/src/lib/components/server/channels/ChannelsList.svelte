<script lang="ts">
	import { contextMenuInfo, servers, user } from '$lib/stores';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import ServerContextMenu from '$lib/components/server/ServerContextMenu.svelte';
	import ServerCategory from '../ServerCategory.svelte';
	import { generateRandomId, handleContextMenu } from '$lib/utils';
	import { onNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { Server } from '$lib/types';
	import { GetServer } from '$lib/wailsjs/go/main/App';

	let openContextMenuId = `context-menu-${generateRandomId()}`;
	let isOpen: boolean = false;
	let serverPromise: Promise<Server>;

	async function getServerById(serverId: string) {
		if ($servers['servers:' + serverId] && $servers['servers:' + serverId].categories) {
			return $servers['servers:' + serverId];
		}

		const response = await GetServer(
			JSON.stringify({ user_id: $user.id.split(':')[1], server_id: serverId })
		);

		servers.update((cache) => {
			if (cache[response.server.id]) {
				cache[response.server.id] = { ...cache[response.server.id], ...response.server };
			}
			return cache;
		});

		return response.server;
	}

	onNavigate(async ({ from, to }) => {
		if (from?.params?.serverId !== to?.params?.serverId) {
			serverPromise = getServerById(to.params.serverId);
		}
	});

	onMount(() => {
		serverPromise = getServerById($page.params.serverId);
	});

	$: isOpen = $contextMenuInfo?.id === openContextMenuId;
</script>

<ul class="flex flex-col w-full flex-grow">
	<span class="block w-full h-[10rem] rounded-lg bg-zinc-500" />
	{#await serverPromise then data}
		{#if $servers[data?.id]}
			<div class="mt-4 flex flex-col gap-y-1">
				{#each $servers[data?.id].categories as category}
					<ServerCategory serverId={data?.id} {category} />
				{/each}
			</div>
		{:else}
			<div></div>
		{/if}
	{/await}
	<ContextMenu.Root>
		<ContextMenu.Trigger
			class="w-full h-full flex-1"
			on:contextmenu={() => handleContextMenu(openContextMenuId)}
		></ContextMenu.Trigger>
		{#if isOpen}
			<ServerContextMenu />
		{/if}
	</ContextMenu.Root>
</ul>
