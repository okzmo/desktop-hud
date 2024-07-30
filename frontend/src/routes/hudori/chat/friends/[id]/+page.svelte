<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import Chatbox from '$lib/components/ui/chatbox/Chatbox.svelte';
	import { notifications } from '$lib/stores';
	import { getMessages } from '$lib/fetches';
	import { onMount } from 'svelte';

	$: if ($notifications) {
		let friendNotif = $notifications.findIndex(
			(notification) =>
				notification.channel_id?.split(':')[1] === $page.params.id && !notification.read
		);
		if (friendNotif > -1) {
			notifications.update((notifs) => {
				notifs[friendNotif].read = true;
				return notifs;
			});
		}
	}

	onNavigate(async ({ to }) => {
		if (to && to.params) {
			await getMessages(to.params);
		}
	});

	onMount(async () => {
		const params = {
			id: $page.params.id
		};
		await getMessages(params);
	});
</script>

<Chatbox friend_chatbox={true} />
