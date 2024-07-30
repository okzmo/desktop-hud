<script>
	import { notifications } from '$lib/stores';
	import Button from '../button/button.svelte';
	import Icon from '@iconify/svelte';

	let friendNotification = false;

	// $: if ($notifications) {
	// 	friendNotification = $notifications.some((notif) => notif.channel_id?.includes('users'));
	// }
</script>

<li>
	<Button class={`h-12 w-12 rounded-xl relative`} href="/hudori/chat/friends" size="icon">
		<Icon icon="ph:users-duotone" height="24" width="24" />
		{#if friendNotification}
			<div class="absolute h-2 w-2 bg-destructive -right-[0.15rem] -top-[0.15rem] rounded-lg" />
		{/if}
	</Button>
</li>
