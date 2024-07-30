<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import Profile from '$lib/components/user/Profile.svelte';
	import type { User } from '$lib/types';
	import { getProfile } from '$lib/fetches';
	import Icon from '@iconify/svelte';
	import { writable } from 'svelte/store';
	import { user } from '$lib/stores';

	export let connected_user: User;

	let open = writable<boolean>(false);
	let user_profile: User | undefined;

	async function getUserProfile() {
		open.set(!$open);
		if (!$open) return;

		user_profile = await getProfile(connected_user.id);
	}
</script>

<Popover.Root onOpenChange={getUserProfile}>
	<Popover.Trigger>
		<div
			class="flex gap-x-3 hover:bg-zinc-800/75 py-[0.45rem] text-zinc-500 px-3 rounded-[0.6rem] transition duration-75 active:scale-[0.97] items-center ml-[calc(10px_+_0.75rem)] justify-between"
		>
			<div class="flex gap-x-4 items-center w-fit">
				<img
					src={connected_user.avatar}
					class="h-7 w-7 rounded-lg object-cover flex-shrink-0 transition-shadow"
					style="box-shadow: {connected_user.talking
						? '0px 0px 11px rgba(69, 222, 94, 1)'
						: '0px 0px 11px rgba(69, 222, 94, 0)'};"
					alt={`${connected_user.display_name}'s avatar`}
				/>
				<p
					class="overflow-hidden text-ellipsis w-full text-nowrap"
					style={`
            color: ${connected_user.username_color?.includes('linear-gradient') ? 'transparent' : connected_user.username_color};
            background: ${connected_user.username_color?.includes('linear-gradient') ? connected_user.username_color : ''};
            background-clip: ${connected_user.username_color?.includes('linear-gradient') ? 'text' : ''};
          `}
				>
					{connected_user.display_name}
				</p>
			</div>

			<div class="flex gap-x-1 items-center">
				{#if connected_user.muted}
					<Icon icon="ph:microphone-slash-duotone" class="text-zinc-600" width="18" height="18" />
				{/if}
				{#if connected_user.deafen}
					<Icon icon="ph:speaker-x-duotone" class="text-zinc-600" width="18" height="18" />
				{/if}
			</div>
		</div>
	</Popover.Trigger>
	{#if user_profile}
		<Profile user={user_profile} side="right" />
	{/if}
</Popover.Root>
