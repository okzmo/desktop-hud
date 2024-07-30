<script>
	import { friends, user } from '$lib/stores';
	import Icon from '@iconify/svelte';
	import { Button } from '../ui/button';
	import { Input } from '../ui/input';
	import FriendChatLink from './FriendChatLink.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import FriendRequestDialog from './FriendRequestDialog.svelte';
</script>

<div class="flex-grow">
	<div class="relative flex gap-x-2">
		<Input class="py-2 text-sm" placeholder="Search friend..." />
		{#if $user}
			<Dialog.Root>
				<Dialog.Trigger>
					<Button
						class="flex-shrink-0 h-10 w-10 px-0 py-0 bg-zinc-925 hover:bg-zinc-900 rounded-lg"
					>
						<Icon
							icon="ph:user-plus-duotone"
							height={18}
							width={18}
							class="text-muted-foreground"
						/>
					</Button>
				</Dialog.Trigger>
				<FriendRequestDialog initiator_id={$user?.id} initiator_username={$user?.username} />
			</Dialog.Root>
		{/if}
	</div>
	{#if $friends?.length > 0}
		<ul class="flex flex-col gap-y-2 pt-3">
			{#each $friends as friend}
				<li>
					<FriendChatLink
						id={friend.id}
						username={friend.display_name}
						about_me={friend.about_me}
						href={`/hudori/chat/friends/${friend.id.split(':')[1]}`}
						avatar={friend.avatar}
						status={friend.status}
					/>
				</li>
			{/each}
		</ul>
	{:else}
		<p>No friends lol</p>
	{/if}
</div>
