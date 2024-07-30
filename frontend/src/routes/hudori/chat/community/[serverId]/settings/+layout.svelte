<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import SettingsLink from '$lib/components/settings/SettingsLink.svelte';
	import { goto } from '$app/navigation';
	import { settingsLastPage } from '$lib/stores';
	import { page } from '$app/stores';

	let handleEscape: (event: KeyboardEvent) => void;

	onMount(() => {
		handleEscape = (event) => {
			if (event.key === 'Escape') {
				// Navigate back to the previous page
				goto($settingsLastPage || `/hudori/chat/community/${$page.params.serverId}`);
				// Remove the event listener to prevent further use
				window.removeEventListener('keydown', handleEscape);
			}
		};

		// Add the event listener for the Escape key
		if (browser) {
			window.addEventListener('keydown', handleEscape);
		}
	});

	onDestroy(() => {
		// Clean up the event listener when the component is destroyed
		if (browser) {
			window.removeEventListener('keydown', handleEscape);
		}
	});
</script>

<div class="flex max-w-[75rem] mx-auto h-full">
	<div class="flex flex-col items-center w-fit text-zinc-700 group h-fit pt-[4rem]">
		<a
			href={$settingsLastPage || `/hudori/chat/community/${$page.params.serverId}`}
			class="flex justify-center items-center h-10 w-10 border border-zinc-700 rounded-full bg-transparent text-zinc-700 hover:bg-transparent group-hover:border-zinc-600 group-hover:text-zinc-600"
		>
			<Icon icon="ph:arrow-left-bold" />
		</a>
		<span class="group-hover:text-zinc-600 transition-colors duraton-75">ESC</span>
	</div>
	<nav class="ml-10 w-[11rem] border-r border-r-zinc-800 pr-5 pt-[4rem] flex flex-col pb-[4rem]">
		<ul class="flex flex-col gap-y-2 flex-grow">
			<li>
				<SettingsLink
					href="/hudori/chat/community/{$page.params.serverId}/settings/customization"
					icon="ph:eye-duotone">Overview</SettingsLink
				>
			</li>
		</ul>
	</nav>
	<div class="flex-grow pt-[4rem] min-w-[40rem]">
		<slot />
	</div>
</div>
