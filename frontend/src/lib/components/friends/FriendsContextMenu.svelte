<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import Separator from '../ui/separator/separator.svelte';
	import Icon from '@iconify/svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { friends, user } from '$lib/stores';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { DeleteFriend } from '$lib/wailsjs/go/main/App';

	export let username: string;
	export let id: string;

	async function removeFriend() {
		let body: any = {
			user_id: $user?.id,
			friend_id: id
		};

		try {
			const response = await DeleteFriend(JSON.stringify(body));

			if (response.message !== 'success') {
				throw new Error(response.message);
			}

			friends.update((friends) => {
				const newArr = friends.filter((friend) => friend.id !== id);
				return newArr;
			});

			if ($page.url.pathname.includes(id.split(':')[1])) {
				goto('/hudori/chat/friends');
			}
		} catch (e) {
			console.log(e);
		}
	}
</script>

<AlertDialog.Root>
	<ContextMenu.Content>
		<ContextMenu.Item class="gap-x-2 items-center  text-sm">
			<Icon icon="ph:user-duotone" height={16} width={16} class="" />
			Profile
		</ContextMenu.Item>
		<ContextMenu.Item class="gap-x-2 items-center  text-sm">
			<Icon icon="ph:phone-duotone" height={16} width={16} class="" />
			Call
		</ContextMenu.Item>
		<Separator class="my-2 max-w-[9.5rem] bg-zinc-700 mx-auto" />

		<AlertDialog.Trigger>
			<ContextMenu.Item
				class="gap-x-2 items-center text-destructive data-[highlighted]:text-zinc-50 data-[highlighted]:bg-destructive text-sm"
			>
				<Icon icon="ph:user-minus-duotone" height={16} width={16} class="" />
				Remove Friend
			</ContextMenu.Item>
		</AlertDialog.Trigger>
	</ContextMenu.Content>

	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure ?</AlertDialog.Title>
			<AlertDialog.Description>
				This action will permanently remove <span class="font-bold">{username}</span> from your friend
				list.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				on:click={removeFriend}
				class="bg-destructive border-none hover:bg-destructive/80"
			>
				Remove
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
