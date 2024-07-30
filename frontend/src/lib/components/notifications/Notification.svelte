<script lang="ts">
	import Icon from '@iconify/svelte';
	import Button from '../ui/button/button.svelte';
	import { acceptFriendRequest, refuseFriendRequest } from './friendRequest';
	import { formatISODate } from '$lib/utils';
	import { friends, notifications } from '$lib/stores';

	async function handleAccept(request_id: string, notif_id: string) {
		const friend = await acceptFriendRequest(request_id, notif_id);
		if (friend) {
			notifications.update((notifications) =>
				notifications.filter((notif) => notif.request_id !== request_id)
			);
			friends.update((friends) => {
				friends.push(friend);
				return friends;
			});
		}
	}

	async function handleRefuse(request_id: string, notif_id: string) {
		const success = await refuseFriendRequest(request_id, notif_id);
		if (success) {
			notifications.update((notifications) =>
				notifications.filter((notif) => notif.request_id !== request_id)
			);
		}
	}

	export let type: string;
	export let message: string;
	export let time: string;
	export let notif_id: string;
	export let request_id: string | undefined;
</script>

<div
	class="flex gap-x-4 w-full bg-zinc-800 border border-zinc-700 flex-shrink-0 py-4 px-5 rounded-xl"
>
	<Icon icon="ph:user-plus-duotone" height={30} width={30} class="text-green-500" />
	<div class="flex flex-col gap-y-4">
		<span class="flex flex-col">
			<p class="leading-5 text-sm">{message}</p>
			<time class="text-zinc-500 leading-5 text-xs">{formatISODate(time)}</time>
		</span>
		{#if type === 'friend_request' && request_id}
			<span class="flex gap-x-2">
				<Button
					on:click={() => handleAccept(request_id, notif_id)}
					class="rounded-lg text-zinc-50 bg-green-500 border-none hover:bg-green-600">Accept</Button
				>
				<Button
					on:click={() => handleRefuse(request_id, notif_id)}
					class="rounded-lg text-zinc-50 bg-red-500 border-none hover:bg-red-600">Refuse</Button
				>
			</span>
		{/if}
	</div>
</div>
