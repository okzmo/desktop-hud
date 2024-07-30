<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import * as Dialog from '$lib/components/ui/dialog';
	import ServerInviteDialog from '$lib/components/server/ServerInviteDialog.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import Icon from '@iconify/svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { servers, user } from '$lib/stores';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { writable } from 'svelte/store';
	import { createInvitation } from '$lib/fetches';
	import { DeleteServer, QuitServer } from '$lib/wailsjs/go/main/App';

	export let roles: string[] | undefined;
	export let name: string;
	export let id: string;
	let type: string;
	let inviteId: string = '';

	async function deleteServer() {
		let body: any = {
			user_id: $user?.id,
			server_id: id
		};

		try {
			const response = await DeleteServer(JSON.stringify(body));

			if (response.message !== 'success') {
				throw new Error(response.message);
			}

			if ($page.url.pathname.includes(id.split(':')[1])) {
				goto('/hudori/chat/friends');
			}
		} catch (e) {
			console.log(e);
		}
	}

	async function quitServer() {
		let body: any = {
			user_id: $user?.id,
			server_id: id
		};

		try {
			const response = await QuitServer(JSON.stringify(body));

			if (response.message !== 'success') {
				throw new Error(response.message);
			}

			servers.update((servers) => {
				const newServers = servers.filter((server) => server.id !== id);
				return newServers;
			});

			if ($page.url.pathname.includes(id.split(':')[1])) {
				goto('/hudori/chat/friends');
			}
		} catch (e) {
			console.log(e);
		}
	}

	const openRemoveChannel = writable<boolean>(false);
	const openInvite = writable<boolean>(false);

	let isOwner: boolean;
	$: if (roles) {
		if (roles?.some((role) => role === 'owner')) {
			isOwner = true;
		} else {
			isOwner = false;
		}
	}
</script>

<ContextMenu.Content class="flex flex-col">
	<ContextMenu.Item
		class="gap-x-2 items-center text-sm"
		on:click={async () => {
			inviteId = await createInvitation();
			openInvite.set(true);
		}}
	>
		<Icon icon="ph:user-plus-duotone" height={16} width={16} class="" />
		Invite people
	</ContextMenu.Item>
	<Separator class="my-2 max-w-[10rem] bg-zinc-700 mx-auto" />
	{#if !isOwner}
		<ContextMenu.Item
			class="gap-x-2 items-center text-destructive data-[highlighted]:bg-destructive data-[highlighted]:text-zinc-50 text-sm"
			on:click={() => {
				openRemoveChannel.set(true);
				type = 'leave';
			}}
		>
			<Icon icon="ph:sign-out-duotone" height={16} width={16} />
			Leave community
		</ContextMenu.Item>
	{:else}
		<ContextMenu.Item
			class="gap-x-2 items-center text-destructive data-[highlighted]:bg-destructive data-[highlighted]:text-zinc-50 text-sm"
			on:click={() => {
				openRemoveChannel.set(true);
				type = 'delete';
			}}
		>
			<Icon icon="ph:trash-duotone" height={16} width={16} />
			Delete community
		</ContextMenu.Item>
	{/if}
</ContextMenu.Content>

<AlertDialog.Root
	open={$openRemoveChannel}
	onOpenChange={() => {
		openRemoveChannel.set(!$openRemoveChannel);
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure ?</AlertDialog.Title>
			<AlertDialog.Description>
				{#if type === 'delete'}
					This action will permanently delete <span class="font-bold">{name}</span> as well as all the
					data related to this community.
				{:else if type === 'leave'}
					You will leave <span class="font-bold">{name}</span> and won't be able to join again until
					you're invited back.
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				on:click={() => {
					if (type === 'delete') {
						deleteServer();
					} else {
						quitServer();
					}
				}}
				class="bg-destructive border-none hover:bg-destructive/80"
			>
				{type === 'delete' ? 'Remove' : 'Leave'}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<Dialog.Root open={$openInvite} onOpenChange={() => openInvite.set(!$openInvite)}>
	<ServerInviteDialog id={inviteId} />
</Dialog.Root>
