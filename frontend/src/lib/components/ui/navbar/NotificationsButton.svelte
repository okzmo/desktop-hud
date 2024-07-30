<script lang="ts">
	import Icon from '@iconify/svelte';

	import Button from '../button/button.svelte';
	import * as Sheet from '$lib/components/ui/sheet';
	import { notifications } from '$lib/stores';
	import Notification from '$lib/components/notifications/Notification.svelte';
</script>

<Sheet.Root>
	<Sheet.Trigger asChild let:builder>
		<Button builders={[builder]} class="h-12 w-12 rounded-xl text-zinc-500" size="icon">
			<Icon icon="ph:bell-duotone" height="24" width="24" />
		</Button>
	</Sheet.Trigger>
	<Sheet.Content side="left">
		<Sheet.Header>
			<Sheet.Title>Notifications</Sheet.Title>
		</Sheet.Header>
		<div class="flex flex-col-reverse overflow-y-auto h-full pb-6 gap-y-3">
			{#if $notifications.length > 0}
				{#each $notifications as notif}
					{#if notif.type !== 'new_message'}
						<Notification
							type={notif.type}
							message={notif.message}
							time={notif.created_at}
							request_id={notif.request_id}
							notif_id={notif.id}
						/>
					{/if}
				{/each}
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
