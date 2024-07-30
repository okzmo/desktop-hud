<script lang="ts">
	import Chatbox from '$lib/components/ui/chatbox/Chatbox.svelte';
	import { notifications, servers, serversStateStore, vcRoom } from '$lib/stores';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { onNavigate } from '$app/navigation';
	import { getMessages } from '$lib/fetches';
	import VoiceChannel from '$lib/components/ui/voicechannel/VoiceChannel.svelte';

	let type = 'textual';
	let participants = [];

	$: if ($notifications) {
		let channelNotif = $notifications.findIndex(
			(notification) => notification.channel_id?.split(':')[1] === $page.params.channelId
		);
		if (channelNotif > -1) {
			notifications.update((notifs) => {
				notifs[channelNotif].read = true;

				return notifs;
			});
		}
	}

	$: if ($vcRoom && $vcRoom.name.split(':')[1] === $page.params.channelId) {
		type = 'voice';

		for (const category of $servers[`servers:${$page.params.serverId}`].categories) {
			const channel = category.channels.find((channel) => channel.id === $vcRoom.name);
			if (channel) {
				participants = channel.participants;
				break;
			}
		}
	} else {
		type = 'textual';
	}

	onNavigate(async ({ to }) => {
		if (to && to.params) {
			await getMessages(to.params);
		}
	});

	onMount(async () => {
		const params = {
			channelId: $page.params.channelId
		};
		await getMessages(params);
	});

	onMount(async () => {
		window.addEventListener('beforeunload', () => {
			localStorage.setItem('states', JSON.stringify($serversStateStore));
		});
	});
</script>

{#if type === 'textual'}
	<Chatbox friend_chatbox={false} />
{:else if type === 'voice'}
	<VoiceChannel {participants} />
{/if}
