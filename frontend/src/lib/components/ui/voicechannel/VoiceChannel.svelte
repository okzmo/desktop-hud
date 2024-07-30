<script lang="ts">
	import { shareScreen, stopShareScreen } from '$lib/rtc';
	import type { User } from '$lib/types';
	import { writable } from 'svelte/store';
	import Button from '../button/button.svelte';
	import { sharingScreen } from '$lib/stores';
	export let participants: User[];
	let activeParticipant = writable<User | null>(null);
	function toggleActiveParticipant(participant: User) {
		activeParticipant.update((current) => (current === participant ? null : participant));
	}
</script>

<div class="container">
	<div class="grid-autofit-participants" class:single-participant={$activeParticipant}>
		{#if participants}
			{#each participants as participant}
				<div
					class="participant-container"
					class:active={$activeParticipant === participant}
					style="background-color: {participant.talking
						? 'rgba(106, 232, 85, 0.5)'
						: 'rgb(39, 39, 42)'}; border-color: {participant.talking
						? 'rgba(106, 232, 85, 1)'
						: 'rgb(63, 63, 70)'}"
					on:click={() => toggleActiveParticipant(participant)}
				>
					<img src={participant.avatar} alt="" class="avatar" />
					<video class="video-element" id={`${participant.id}-video-element`} autoplay playsinline
					></video>
				</div>
			{/each}
		{/if}
	</div>
	<div class="absolute bottom-3">
		<Button on:click={() => ($sharingScreen ? stopShareScreen() : shareScreen())}>
			{$sharingScreen ? 'Stop sharing' : 'Share screen'}
		</Button>
	</div>
</div>

<style>
	.container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
	}
	.grid-autofit-participants {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(25rem, 1fr));
		gap: 1rem;
		width: 100%;
		max-width: calc(100% - 2rem);
		margin: auto;
		position: relative;
		transition: 0.3s;
	}

	.grid-autofit-participants.single-participant {
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
	}

	.participant-container {
		display: flex;
		justify-content: center;
		align-items: center;
		aspect-ratio: 16 / 9;
		width: 100%;
		background-color: rgb(39, 39, 42);
		border: 2px solid rgb(63, 63, 70);
		border-radius: 0.5rem;
		position: relative;
		overflow: hidden;
		cursor: pointer;
		transition: 0.3s;
	}
	.participant-container.active {
		grid-column: 1 / -1;
		grid-row: 1 / -1;
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 100;
	}
	.avatar {
		height: 5rem;
		width: 5rem;
		object-fit: cover;
		border-radius: 50%;
	}
	.video-element {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		z-index: 10;
		transform: scale(1.02);
	}
</style>
