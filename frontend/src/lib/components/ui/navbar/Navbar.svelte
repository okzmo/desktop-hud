<script lang="ts">
	import Icon from '@iconify/svelte';

	import Button from '../button/button.svelte';
	import Separator from '../separator/separator.svelte';
	import { servers, settingsLastPage } from '$lib/stores';
	import ServerActionsButton from './ServerActions/ServerActionsButton.svelte';
	import GlobalButton from './GlobalButton/GlobalButton.svelte';
	import FriendsButton from './FriendsButton.svelte';
	import ServerAccessButton from './ServerAccess/ServerAccessButton.svelte';
	import NotificationsButton from './NotificationsButton.svelte';
	import { beforeNavigate } from '$app/navigation';

	beforeNavigate(({ from, to }) => {
		if (from && to?.url.pathname.includes('settings')) {
			settingsLastPage.set(from.url.href);
		}
	});
</script>

<nav class="py-3 border-r border-zinc-850 min-w-[4.15rem] h-full flex flex-col">
	<ul class="flex flex-col relative flex-grow overflow-y-auto">
		<GlobalButton />
		<Separator class="mt-3 bg-zinc-700 w-[3rem] mx-auto" />
		<div class="pt-3 flex flex-col gap-y-2 scrollbar-hide relative items-center">
			<FriendsButton />
			{#if $servers}
				{#each Object.values($servers) as server}
					<ServerAccessButton
						id={server.id}
						icon={server.icon}
						name={server.name}
						roles={server.roles}
					/>
				{/each}
			{/if}
			<ServerActionsButton />
		</div>
	</ul>

	<!-- settings/notifications -->
	<div class="flex flex-col items-center">
		<span class="block w-full h-4 bg-gradient-to-t from-zinc-925" />
		<div class="flex flex-col bg-zinc-925 gap-y-2">
			<NotificationsButton />

			<Button
				href="/hudori/settings/account"
				class="h-12 w-12 rounded-xl text-zinc-500"
				size="icon"
			>
				<Icon icon="ph:gear-duotone" height="24" width="24" />
			</Button>
		</div>
	</div>
</nav>
