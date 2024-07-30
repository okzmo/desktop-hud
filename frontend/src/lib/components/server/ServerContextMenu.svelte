<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import * as Dialog from '$lib/components/ui/dialog';
	import Icon from '@iconify/svelte';
	import { writable } from 'svelte/store';
	import ChannelCategoryDialog from './channels/ChannelCategoryDialog.svelte';
	import { servers } from '$lib/stores';
	import ServerInviteDialog from './ServerInviteDialog.svelte';
	import { page } from '$app/stores';
	import { createInvitation } from '$lib/fetches';

	const openCategory = writable<boolean>(false);
	const openInvite = writable<boolean>(false);

	let inviteId: string = '';
	let isOwner: boolean;
	$: if ($servers['servers:' + $page.params.serverId]) {
		if ($servers['servers:' + $page.params.serverId].roles?.some((role) => role === 'owner')) {
			isOwner = true;
		} else {
			isOwner = false;
		}
	}
</script>

<ContextMenu.Content>
	<ContextMenu.Item
		class="gap-x-2 items-center text-sm"
		on:click={async () => {
			inviteId = await createInvitation();
			openInvite.set(true);
		}}
	>
		<Icon icon="ph:chats-circle-duotone" height={16} width={16} />
		Invite People
	</ContextMenu.Item>
	{#if isOwner}
		<ContextMenu.Item class="gap-x-2 items-center text-sm" on:click={() => openCategory.set(true)}>
			<Icon icon="ph:rows-plus-bottom-duotone" height={16} width={16} />
			Create category
		</ContextMenu.Item>
	{/if}
</ContextMenu.Content>

<Dialog.Root open={$openInvite} onOpenChange={() => openInvite.set(!$openInvite)}>
	<ServerInviteDialog id={inviteId} />
</Dialog.Root>

<Dialog.Root open={$openCategory} onOpenChange={() => openCategory.set(!$openCategory)}>
	<ChannelCategoryDialog open={openCategory} />
</Dialog.Root>

<!-- <Dialog.Root open={$openChannel} onOpenChange={() => openChannel.set(!$openChannel)}> -->
<!-- 	<ChannelDialog -->
<!-- 		categoryName={$servers['servers:' + $page.params.id]?.categories[0].name} -->
<!-- 		open={openChannel} -->
<!-- 	/> -->
<!-- </Dialog.Root> -->
