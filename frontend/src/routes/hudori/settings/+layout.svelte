<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import SettingsLink from '$lib/components/settings/SettingsLink.svelte';
	import { goto } from '$app/navigation';
	import { settingsLastPage } from '$lib/stores';
	import { enhance } from '$app/forms';
	import { LogoutHudori } from '$lib/wailsjs/go/main/App';

	let handleEscape: (event: KeyboardEvent) => void;

	onMount(() => {
		handleEscape = (event) => {
			if (event.key === 'Escape') {
				// Navigate back to the previous page
				goto($settingsLastPage || '/hudori/chat/friends');
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

	async function Logout() {
		goto('/signin');
		const response = await LogoutHudori();
		console.log(response);
		if (response.message !== 'success') {
			console.error(response);
		}
	}
</script>

<div class="flex max-w-[75rem] mx-auto h-full">
	<div class="flex flex-col items-center w-fit text-zinc-700 group h-fit pt-[4rem]">
		<Button
			href={$settingsLastPage || '/hudori/chat/friends'}
			size="icon"
			class="rounded-full bg-transparent text-zinc-700 hover:bg-transparent group-hover:border-zinc-600 group-hover:text-zinc-600"
		>
			<Icon icon="ph:arrow-left-bold" />
		</Button>
		<span class="group-hover:text-zinc-600 transition-colors duraton-75">ESC</span>
	</div>
	<nav class="ml-10 w-[11rem] border-r border-r-zinc-800 pr-5 pt-[4rem] flex flex-col pb-[4rem]">
		<ul class="flex flex-col gap-y-2 flex-grow">
			<li>
				<SettingsLink href="/hudori/settings/account" icon="ph:fingerprint-simple-duotone"
					>Account</SettingsLink
				>
			</li>
			<li>
				<SettingsLink href="/hudori/settings/profile" icon="ph:user-duotone">Profile</SettingsLink>
			</li>
		</ul>
		<form method="POST" on:submit={Logout} use:enhance>
			<Button
				type="submit"
				class="gap-x-3 bg-transparent border-none shadow-none rounded-lg py-1 pl-3 pr-0 w-full justify-start text-base text-destructive hover:bg-destructive hover:text-white duration-100"
			>
				<Icon icon="ph:sign-out-duotone" />
				Log out
			</Button>
		</form>
	</nav>
	<div class="flex-grow pt-[4rem] min-w-[45rem]">
		<slot />
	</div>
</div>
