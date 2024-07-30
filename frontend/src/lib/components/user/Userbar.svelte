<script lang="ts">
	import Icon from '@iconify/svelte';
	import Button from '../ui/button/button.svelte';
	import { user, vcRoom, wsConn, mutedState } from '$lib/stores';
	import * as Popover from '$lib/components/ui/popover';
	import Profile from './Profile.svelte';
	import { quitRoom } from '$lib/rtc';
	import { Track } from 'livekit-client';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import type { User } from '$lib/types';
	import { getProfile } from '$lib/fetches';
	import { page } from '$app/stores';

	function muteMicrophone() {
		mutedState.update((state) => {
			state.muteMic = !state.muteMic;
			return state;
		});
		if ($vcRoom) {
			$vcRoom.localParticipant.setMicrophoneEnabled(!$mutedState.muteMic);
			const wsMess = {
				type: 'participant_status',
				content: {
					user_id: $user?.id,
					serverId: 'servers:' + $page.params.serverId,
					channelId: $vcRoom.name,
					muted: $mutedState.muteMic,
					deafen: $mutedState.muteHead
				}
			};
			$wsConn?.send(JSON.stringify(wsMess));
		}
	}

	function muteHeadphone() {
		mutedState.update((state) => {
			state.muteHead = !state.muteHead;
			return state;
		});
		if ($vcRoom) {
			$vcRoom.remoteParticipants.forEach((participant) => {
				const audioTrack = participant.getTrackPublication(Track.Source.Microphone);
				audioTrack?.setEnabled(!$mutedState.muteHead);
			});
			const wsMess = {
				type: 'participant_status',
				content: {
					user_id: $user?.id,
					serverId: 'servers:' + $page.params.serverId,
					channelId: $vcRoom.name,
					muted: $mutedState.muteMic,
					deafen: $mutedState.muteHead
				}
			};
			$wsConn?.send(JSON.stringify(wsMess));
		}
	}

	onMount(() => {
		// TEMPORARY
		window.addEventListener('beforeunload', () => {
			if ($vcRoom) {
				const wsMess = {
					type: 'quit_participant',
					content: {
						user_id: $user?.id,
						serverId: 'servers:' + $page.params.serverId,
						channelId: $vcRoom?.name
					}
				};
				$wsConn?.send(JSON.stringify(wsMess));
			}
		});
	});

	let open = writable<boolean>(false);
	let user_profile: User | undefined;

	async function getUserProfile() {
		open.set(!$open);
		if (!$open) return;

		user_profile = await getProfile($user!.id);
	}
</script>

<div class="flex flex-col flex-shrink-0 gap-y-2">
	{#if $vcRoom}
		<div
			class="w-full flex bg-zinc-850 rounded-xl border border-zinc-750 justify-between items-center py-1 pr-1 pl-4"
		>
			<div class="flex items-center gap-x-2">
				<Icon icon="ph:wifi-high-duotone" class="text-green-500" width="20" height="20" />
				<p class="text-green-500">Connected</p>
			</div>
			<Button
				class="h-10 w-10 rounded-lg px-2 border-none shadow-none group hover:bg-red-500/20"
				on:click={() => quitRoom('servers:' + $page.params.serverId)}
			>
				<Icon
					icon="ph:phone-slash-duotone"
					class="group-hover:text-red-500 transition-colors duration-75"
					width="20"
					height="20"
				/>
			</Button>
		</div>
	{/if}
	<div class="flex gap-x-2 justify-between">
		{#if $user}
			<Popover.Root onOpenChange={getUserProfile}>
				<Popover.Trigger class="max-w-[9rem]">
					<Button
						class="h-12 p-0 rounded-xl overflow-hidden pr-4 text-sm gap-x-3 border-none relative"
						style="background: {$user.username_color};"
					>
						<img
							class="object-cover w-12 h-12 aspect-square rounded-xl z-[1]"
							src={$user.avatar}
							alt=""
						/>
						<span class="text-left truncate w-full z-[1]">{$user.display_name || 'User'}</span>
						<div
							class="absolute w-[calc(100%-2px)] h-[calc(100%-2px)] bg-zinc-925 left-1/2 -translate-x-1/2 rounded-xl opacity-75"
						></div>
					</Button>
				</Popover.Trigger>
				<Profile user={user_profile} side="top" />
			</Popover.Root>
		{/if}
		<Button class="h-12 w-12 rounded-xl px-3" on:click={muteMicrophone}>
			{#if $mutedState.muteMic}
				<Icon icon="ph:microphone-slash-duotone" class="text-red-500" width="20" height="20" />
			{:else}
				<Icon icon="ph:microphone-duotone" width="20" height="20" />
			{/if}
		</Button>

		<Button class="h-12 w-12 rounded-xl px-3" on:click={muteHeadphone}>
			{#if $mutedState.muteHead}
				<Icon icon="ph:speaker-x-duotone" class="text-red-500" width="20" height="20" />
			{:else}
				<Icon icon="ph:speaker-simple-high-duotone" width="20" height="20" />
			{/if}
		</Button>
	</div>
</div>
