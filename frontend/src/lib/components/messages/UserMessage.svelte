<script lang="ts">
	import { formatISODate, generateRandomId, handleContextMenu } from '$lib/utils';
	import * as Popover from '$lib/components/ui/popover';
	import Profile from '../user/Profile.svelte';
	import type { User } from '$lib/types';
	import { browser } from '$app/environment';
	import { writable } from 'svelte/store';
	import {
		contextMenuInfo,
		loadingMessages,
		user,
		editingMessage,
		messages,
		replyTo
	} from '$lib/stores';
	import { getProfile } from '$lib/fetches';
	import GridImages from './GridImages.svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import { Skeleton } from '../ui/skeleton';
	import Icon from '@iconify/svelte';
	import RichInputEditMessage from '../ui/rich-input/RichInputEditMessage.svelte';
	import { page } from '$app/stores';
	import { DeleteMessage } from '$lib/wailsjs/go/main/App';

	export let id: string;
	export let author: User;
	export let content: string;
	export let images: string[];
	export let mentions: string[];
	export let time: string;
	export let groupedWithPrevious: boolean;
	export let groupedWithAfter: boolean;
	export let friend_chatbox: boolean;
	export let edited: boolean;
	export let reply: any;

	let open = writable<boolean>(false);
	let user_profile: User | undefined;

	async function getUserProfile() {
		open.set(!$open);
		if (!$open) return;

		user_profile = await getProfile(author.id);
	}

	let openContextMenuId = `context-menu-${generateRandomId()}`;
	let contextMenuOpen: boolean = false;

	$: contextMenuOpen = $contextMenuInfo?.id === openContextMenuId;

	async function deleteMessage() {
		const channelId = $page.params.id || $page.params.channelId;

		messages.update((cache) => {
			const messIdx = cache[channelId]?.messages?.findIndex((message) => message.id === id);
			if (messIdx > -1) {
				cache[channelId].messages.splice(messIdx, 1);
			}
			return cache;
		});

		let body: any = {
			channel_id: channelId,
			message_id: id,
			private_message: friend_chatbox,
			author_id: $user.id.split(':')[1]
		};

		try {
			const response = await DeleteMessage(JSON.stringify(body));

			if (response.message !== 'success') {
				throw new Error(response.message);
			}
		} catch (e) {
			console.log(e);
		}
	}

	function goToReply() {
		const replyMessage = document.querySelector(`[data-messageid='${reply.id}']`);
		if (!replyMessage) return;
		replyMessage?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						replyMessage.classList.add('!bg-zinc-650/60');
						setTimeout(() => {
							replyMessage.classList.remove('!bg-zinc-650/60');
						}, 1000);
						observer.disconnect();
					}
				});
			},
			{ threshold: 0.5 }
		);

		observer.observe(replyMessage);
	}
</script>

{#if browser}
	<div class="flex gap-x-2 items-end" class:mt-6={!groupedWithPrevious}>
		{#if !groupedWithAfter}
			<Popover.Root onOpenChange={() => getUserProfile()}>
				<Popover.Trigger>
					<div class="flex-shrink-0 h-10 w-10 rounded-xl overflow-hidden">
						{#if $loadingMessages}
							<Skeleton class="w-full h-full" />
						{/if}
						<img class="w-full h-full object-cover" src={author.avatar} alt="" />
					</div>
				</Popover.Trigger>
				<Profile user={user_profile} side="right" />
			</Popover.Root>
		{/if}
		<div class="flex flex-col w-fit">
			{#if images && images.length > 0}
				<div
					class="flex gap-2 max-w-[30rem] [&+div]:rounded-tl-sm overflow-hidden flex-wrap"
					class:ml-[3rem]={groupedWithAfter}
				>
					<GridImages {images} />
				</div>
			{/if}

			{#if content}
				<ContextMenu.Root>
					<ContextMenu.Trigger on:contextmenu={() => handleContextMenu(openContextMenuId)}>
						{#if reply && reply.id !== ''}
							<button
								class="text-xs inline-flex items-center gap-x-1 text-zinc-600 ml-2 group hover:text-zinc-400 transition-colors cursor-pointer"
								on:click={goToReply}
							>
								<Icon
									icon="iconoir:quote-message-solid"
									class="text-zinc-500 group-hover:text-zinc-300 transition-colors"
								/>
								<span class="font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors"
									>{reply?.author?.display_name}</span
								>
								<span
									class="[&>p]:max-w-[10rem] [&>p]:inline-block [&>p]:overflow-hidden [&>p]:text-ellipsis overflow-hidden text-ellipsis flex-shrink-0 whitespace-nowrap flex"
									>{@html reply?.content}</span
								>
							</button>
						{/if}
						<div
							class="bg-zinc-850 rounded-xl rounded-bl-sm px-5 py-3 mt-1 w-fit text-sm [&>p]:break-all flex flex-col gap-y-1 max-w-[45rem] transition-colors"
							class:groupMessagePrevious={groupedWithPrevious}
							class:groupMessageAfter={groupedWithAfter}
							class:mentioned={mentions && mentions.includes($user?.id)}
							data-messageid={id}
						>
							{#if !groupedWithPrevious}
								<span class="flex items-end gap-x-2 w-fit">
									<p
										style={`
                  color: ${author.username_color?.includes('linear-gradient') ? 'transparent' : author.username_color};
                  background: ${author.username_color?.includes('linear-gradient') ? author.username_color : ''};
                  background-clip: ${author.username_color?.includes('linear-gradient') ? 'text' : ''};
                `}
										class={`text-sm leading-0`}
									>
										{author.display_name}
									</p>
									<time class="text-zinc-400 leading-[1.08rem] text-xs">{formatISODate(time)}</time>
									{#if edited}
										<span class="text-zinc-400 leading-[1.08rem] text-xs">(edited)</span>
									{/if}
								</span>
							{/if}
							<span
								class="[&>p>a]:text-blue-400 [&>p>a:hover]:underline break-all [&>p>span]:first:ml-0"
							>
								{#if $editingMessage === id}
									<RichInputEditMessage
										{friend_chatbox}
										files={null}
										messageToEdit={content}
										messageToEditId={id}
									/>
								{:else}
									{@html content}
								{/if}
							</span>
						</div>
					</ContextMenu.Trigger>
					{#if contextMenuOpen}
						<ContextMenu.Content id="context-menu-category">
							<ContextMenu.Item
								class="gap-x-2 items-center text-sm"
								on:click={() =>
									replyTo.set({ id: id, author: { display_name: author.display_name } })}
							>
								<Icon icon="ph:arrow-bend-up-left-bold" height={16} width={16} class="" />
								Reply
							</ContextMenu.Item>
							{#if author.id === $user.id}
								<ContextMenu.Item
									class="gap-x-2 items-center text-sm"
									on:click={() => editingMessage.set(id)}
								>
									<Icon icon="ph:pencil-simple-duotone" height={16} width={16} class="" />
									Edit message
								</ContextMenu.Item>
								<ContextMenu.Item
									class="gap-x-2 items-center text-destructive data-[highlighted]:bg-destructive data-[highlighted]:text-zinc-50 text-sm"
									on:click={deleteMessage}
								>
									<Icon icon="ph:trash-duotone" height={16} width={16} />
									Delete message
								</ContextMenu.Item>
							{/if}
						</ContextMenu.Content>
					{/if}
				</ContextMenu.Root>
			{/if}
		</div>
	</div>
{/if}

<style lang="postcss">
	.groupMessagePrevious {
		border-top-left-radius: theme(borderRadius.sm);
	}

	.groupMessageAfter {
		margin-left: calc(theme(margin.10) + theme(margin.2));
	}

	:global([data-type='mention']) {
		color: theme(colors.accent.DEFAULT);
		margin: 0rem 0.2rem;
		border-radius: theme(borderRadius.md);
	}

	.mentioned {
		background-color: #f7b14a2a;
		border: 1px solid #f7b14a;
	}
</style>
