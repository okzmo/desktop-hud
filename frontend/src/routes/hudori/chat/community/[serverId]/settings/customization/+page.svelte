<script lang="ts">
	import { servers } from '$lib/stores';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import ProfileBannerDialog from '$lib/components/settings/ProfileBannerDialog.svelte';
	import { writable } from 'svelte/store';
	import { page } from '$app/stores';
	import ServerIconDialog from '$lib/components/server/settings/ServerIconDialog.svelte';

	let openBanner = writable<boolean>(false);
	let openIcon = writable<boolean>(false);
</script>

<div class="ml-5 flex flex-col mx-auto">
	<div class="relative aspect-[40/25] w-full h-full">
		<Button
			class="right-4 top-4 z-[2] absolute rounded-xl bg-zinc-800/50 hover:bg-zinc-800/75 border-none shadow-none backdrop-blur-lg"
			size="icon"
			on:click={() => openBanner.set(true)}
		>
			<Icon icon="ph:pencil-simple-duotone" height={20} width={20} />
		</Button>
		<div class="rounded-[1.5rem] flex relative px-[1rem] py-[1rem] h-full">
			<div class="w-full h-full absolute left-0 top-0 object-cover rounded-[1.5rem] bg-zinc-700" />
			{#if $servers[`servers:${$page.params.serverId}`]?.banner}
				<img
					class="w-full h-full absolute left-0 top-0 object-contain rounded-[1.6rem] transform-gpu"
					src={$servers[`servers:${$page.params.serverId}`]?.banner}
					alt=""
				/>
			{/if}
			<div class="flex flex-col justify-end gap-y-2 z-[2]">
				<span class="flex gap-x-3">
					<button
						class="relative w-20 h-20 overflow-hidden rounded-2xl"
						on:click={() => openIcon.set(true)}
					>
						<div
							class="w-full h-full absolute left-0 top-0 object-cover rounded-[1.5rem] bg-zinc-800 z-[-1]"
						/>
						{#if $servers[`servers:${$page.params.serverId}`]?.icon}
							<img
								class="w-full h-full absolute left-0 top-0 object-cover rounded-[1.6rem] transform-gpu"
								src={$servers[`servers:${$page.params.serverId}`]?.icon}
								alt=""
							/>
						{/if}
					</button>
				</span>
			</div>
			<div class="w-full absolute h-full progressive-blur rounded-[1.5rem]"></div>
			<div
				class="w-[calc(100%+1px)] absolute h-full rounded-2xl bg-gradient-to-t from-black/15 to-transparent left-0 top-0"
			></div>
		</div>
	</div>
</div>

<Dialog.Root open={$openBanner} onOpenChange={() => openBanner.set(!openBanner)}>
	<ProfileBannerDialog dialogState={openBanner} />
</Dialog.Root>

<Dialog.Root open={$openIcon} onOpenChange={() => openIcon.set(!openIcon)}>
	<ServerIconDialog dialogState={openIcon} />
</Dialog.Root>

<style lang="postcss">
	.progressive-blur {
		backdrop-filter: blur(40px);
		-webkit-backdrop-filter: blur(40px);
		inset: 0;

		mask-image: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) 85%, rgb(0, 0, 0));
		-webkit-mask-image: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) 85%, rgb(0, 0, 0));
	}
</style>
