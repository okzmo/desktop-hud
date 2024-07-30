<script lang="ts">
	import UserMessage from '$lib/components/messages/UserMessage.svelte';
	import { loadingMessages, messages, usersTyping } from '$lib/stores';
	import RichInput from '../rich-input/RichInput.svelte';
	import type { MessageUI } from '$lib/types';
	import Icon from '@iconify/svelte';
	import { afterUpdate, onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { page } from '$app/stores';
	import { beforeNavigate } from '$app/navigation';
	import TypingMessage from '$lib/components/messages/typingMessage.svelte';

	export let friend_chatbox: boolean;

	let chatbox: HTMLDivElement;
	let groupedMessages: MessageUI[] = [];
	let dropzone: HTMLLabelElement;
	let dropzone_indicator: HTMLDivElement;
	let dropzone_opacity = 0;
	let dropzone_zindex = 1;
	let files = writable<File[]>([]);

	const groupMessages = (messages: MessageUI[]) => {
		const threshold = 10000; // 2 seconds
		const groupedMessages = messages.map((msg, index) => {
			const prevMsg = messages[index - 1];
			const nextMsg = messages[index + 1];
			const groupWithPrevious =
				index > 0 &&
				new Date(msg.updated_at).getTime() - new Date(prevMsg.updated_at).getTime() < threshold &&
				msg.author === prevMsg.author;
			const groupWithAfter =
				index < messages.length - 1 &&
				new Date(nextMsg.updated_at).getTime() - new Date(msg.updated_at).getTime() < threshold &&
				msg.author === nextMsg.author;

			return { ...msg, groupWithPrevious, groupWithAfter };
		});

		return groupedMessages;
	};

	$: if ($messages[$page.params.id] || $messages[$page.params.channelId]) {
		const channelContent = $messages[$page.params.id] || $messages[$page.params.channelId];
		if (channelContent.messages) {
			groupedMessages = groupMessages(channelContent?.messages);
		}
	}

	function scrollToPosition() {
		const channelId = $page.params.id || $page.params.channelId;
		const channelContent = $messages[channelId];
		if (chatbox) {
			chatbox.scrollTop = channelContent?.scrollPosition || chatbox.scrollHeight;
			// chatbox?.scrollTo({
			// 	left: 0,
			// 	top: channelContent?.scrollPosition || chatbox.scrollHeight,
			// 	behavior: 'smooth'
			// });
		}
	}

	beforeNavigate(() => {
		const channelId = $page.params.id || $page.params.channelId;
		if ($messages[channelId]) {
			messages.update((cache) => {
				cache[channelId].scrollPosition = chatbox.scrollTop;
				return cache;
			});
		}
	});

	afterUpdate(() => {
		scrollToPosition();
	});

	onMount(() => {
		dropzone.addEventListener('click', (e) => {
			if (e.target.id !== 'image-upload-icon' && e.target.id !== 'dropzone-file') {
				e.preventDefault();
				return;
			}
		});

		dropzone.addEventListener('change', (e) => {
			const filesUploaded = Array.from(e.target.files);
			files.update((state) => {
				state.push(...filesUploaded);
				return state;
			});
		});

		dropzone.addEventListener('dragover', (e) => {
			e.preventDefault();
			if (dropzone_opacity === 1) return;
			dropzone_zindex = 4;
			dropzone_opacity = 1;
		});

		dropzone.addEventListener('dragleave', (e) => {
			dropzone_opacity = 0;
		});

		dropzone.addEventListener('drop', (e) => {
			e.preventDefault();
			const filesUploaded = Array.from(e.dataTransfer?.files);
			files.update((state) => {
				state.push(...filesUploaded);
				return state;
			});
			dropzone_zindex = 2;
			dropzone_opacity = 0;
		});

		scrollToPosition();
	});
</script>

<label
	bind:this={dropzone}
	for="dropzone-file"
	class="flex flex-col h-full max-w-full cursor-auto relative"
>
	<div
		bind:this={dropzone_indicator}
		class="absolute h-full w-full left-0 top-0 bg-zinc-950/85 z-[4] backdrop-blur-sm flex justify-center items-center text-zinc-600 flex-col transition-opacity duration-75 pointer-events-none"
		style="opacity: {dropzone_opacity}; z-index: {dropzone_zindex};"
	>
		<Icon icon="ph:images-duotone" height={100} width={100} />
		<p>Drop your file for it to be uploaded!</p>
	</div>
	<div
		id="chatbox"
		bind:this={chatbox}
		class="flex flex-col justify-end p-6 overflow-y-auto h-full"
	>
		{#if $loadingMessages}
			Loading...
		{:else if groupedMessages.length > 0}
			{#each groupedMessages as message}
				<UserMessage
					{friend_chatbox}
					id={message.id}
					author={message.author}
					content={message.content}
					time={message.created_at}
					groupedWithPrevious={message.groupWithPrevious}
					groupedWithAfter={message.groupWithAfter}
					images={message.images}
					mentions={message.mentions}
					edited={message.edited}
					reply={message.replies}
				/>
			{/each}
		{:else}
			<div class="w-full h-full flex justify-center items-center">
				<div class="flex flex-col items-center">
					<Icon icon="quill:user-sad" height={150} width={150} class="text-zinc-725" />
					<p class="text-zinc-700 text-2xl mt-4">No messages were found.</p>
				</div>
			</div>
		{/if}
		{#if $usersTyping.length > 0 && $usersTyping.some((user) => user.channel_id === $page.params.channelId || user.user_id.split(':')[1] === $page.params.id)}
			<TypingMessage usersTyping={$usersTyping} />
		{/if}
		<div class="anchor-scroll"></div>
	</div>
	<input type="file" class="hidden" id="dropzone-file" />
	<RichInput {files} {friend_chatbox} />
</label>

<style>
	#chatbox * {
		overflow-anchor: none;
	}

	.anchor-scroll {
		overflow-anchor: auto;
		height: 1px;
	}
</style>
