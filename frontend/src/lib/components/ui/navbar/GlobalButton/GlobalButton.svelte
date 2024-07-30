<script lang="ts">
	import Button from '../../button/button.svelte';
	import Icon from '@iconify/svelte';
	import * as Popover from '$lib/components/ui/popover';
	import AppsButton from './AppsButton.svelte';
	import { page } from '$app/stores';

	let activeApp: string;
	$: activeApp = $page.url.pathname.split('/')[2];
</script>

<Popover.Root>
	<Popover.Trigger>
		<li class="flex justify-center">
			<Button class="h-12 w-12 rounded-xl" size="icon">
				{#if activeApp === 'chat'}
					<Icon icon="ph:chat-circle-duotone" height="24" width="24" class="text-zinc-500" />
				{:else if activeApp === 'videos'}
					<Icon icon="ph:video-camera-duotone" height="24" width="24" class="text-zinc-500" />
				{:else if activeApp === 'thoughts'}
					<Icon icon="ph:note-pencil-duotone" height="24" width="24" class="text-zinc-500" />
				{/if}
			</Button>
		</li>
	</Popover.Trigger>
	<Popover.Content side="right" align="start" sideOffset={10} class="rounded-2xl p-2 max-w-[14rem]">
		<div class="flex flex-col gap-y-1 items-start">
			<AppsButton
				href="/hudori/chat/friends"
				name="Chat"
				description="Talk with a pal!"
				icon="ph:chat-circle-duotone"
			/>
			<AppsButton
				href="/hudori/videos"
				name="Videos"
				description="Cat videos on demand."
				icon="ph:video-camera-duotone"
			/>
			<AppsButton
				href="/hudori/thoughts"
				name="Thoughts"
				description="Share a thought."
				icon="ph:note-pencil-duotone"
			/>
		</div>
	</Popover.Content>
</Popover.Root>
