<script lang="ts">
	import { user } from '$lib/stores';
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import Icon from '@iconify/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import ProfileBannerDialog from '$lib/components/settings/ProfileBannerDialog.svelte';
	import { writable } from 'svelte/store';
	import ProfileAvatarDialog from '$lib/components/settings/ProfileAvatarDialog.svelte';
	import ProfileNameDialog from '$lib/components/settings/ProfileNameDialog.svelte';

	let openBanner = writable<boolean>(false);
	let openAvatar = writable<boolean>(false);

	let selectedColor = writable<string>($user.username_color);
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
		<div class="rounded-[1.5rem] flex relative px-[1.45rem] py-3 h-full">
			{#if $user?.banner !== ''}
				<img
					class="w-full h-full absolute left-0 top-0 object-contain rounded-[1.6rem] transform-gpu"
					src={$user?.banner}
					alt=""
				/>
			{:else}
				<div
					class="w-full h-full absolute left-0 top-0 object-cover rounded-[1.5rem] bg-zinc-700"
				/>
			{/if}
			<div class="flex flex-col justify-end gap-y-2 z-[2]">
				<span class="flex gap-x-3">
					<button on:click={() => openAvatar.set(true)}>
						<img class="w-20 h-20 object-cover rounded-2xl" src={$user?.avatar} alt="" />
					</button>
					<span class="flex flex-col justify-end mb-2">
						<Popover.Root>
							<Popover.Trigger>
								<button
									class="text-sm leading-3"
									style={`
                color: ${$selectedColor.includes('linear-gradient') ? 'transparent' : $selectedColor};
                background: ${$selectedColor.includes('linear-gradient') ? $selectedColor : ''};
                background-clip: ${$selectedColor.includes('linear-gradient') ? 'text' : ''};
              `}
								>
									{$user?.display_name}
								</button>
							</Popover.Trigger>
							<Popover.Content class="p-0 w-fit bg-transparent border-none">
								<ProfileNameDialog {selectedColor} />
							</Popover.Content>
						</Popover.Root>
						<p class="text-sm leading-5 text-zinc-400">{$user?.username}</p>
					</span>
				</span>
				<p class="text-sm leading-[1.10rem]">{$user?.about_me}</p>
			</div>
			<div class="w-full absolute h-full progressive-blur rounded-[1.5rem]"></div>
			<div
				class="w-[calc(100%+1px)] absolute h-full rounded-[1.5rem] bg-gradient-to-t from-black/15 to-transparent left-0 top-0"
			></div>
		</div>
	</div>
</div>

<Dialog.Root open={$openBanner} onOpenChange={() => openBanner.set(!openBanner)}>
	<ProfileBannerDialog dialogState={openBanner} />
</Dialog.Root>

<Dialog.Root open={$openAvatar} onOpenChange={() => openAvatar.set(!openAvatar)}>
	<ProfileAvatarDialog dialogState={openAvatar} />
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
