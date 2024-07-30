<script lang="ts">
	import { onMount, onDestroy, beforeUpdate } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import Link from '@tiptap/extension-link';
	import {
		user,
		updateChatInputState,
		getChatInputState,
		servers,
		editingMessage,
		messages,
		replyTo
	} from '$lib/stores';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import type { Writable } from 'svelte/store';
	import Mention from '@tiptap/extension-mention';
	import MentionList from './MentionList.svelte';
	import { Emoji } from './emojiNode';
	import { EmojiSuggestion } from './emojiSuggestion';
	import EmojiList from './EmojiList.svelte';
	import { debounce } from '$lib/utils';
	import { typing } from '$lib/fetches';
	import type { SuggestionProps } from '@tiptap/suggestion';
	import { CreateMessage } from '$lib/wailsjs/go/main/App';

	let element: Element | undefined;
	let editor: Editor;
	let mentionList: any;
	let emojisList: any;

	export let friend_chatbox: boolean;
	export let files: Writable<File[]>;

	let channelId = '';
	let currentChannelId = '';
	let showSlowRequest = false;
	let mentionProps: SuggestionProps<any> | null;
	let emojiProps: SuggestionProps<any> | null;
	let mentions: string[] = [];

	let isTyping = false;

	const debounceTypingStart = debounce(() => {
		if (!isTyping) {
			isTyping = true;
			typing('start');
		}
	}, 100);
	const debounceTypingEnd = debounce(() => {
		if (isTyping) {
			isTyping = false;
			typing('end');
		}
	}, 1500);

	$: if ($page.params.id || $page.params.channelId) {
		channelId = $page.params.id || $page.params.channelId;
	}

	beforeUpdate(() => {
		if (currentChannelId !== channelId) {
			if (editor) {
				updateChatInputState(currentChannelId, editor.getHTML());
				editor.destroy();
			}
			currentChannelId = channelId;
			initializeEditor();
		}
	});

	async function sendMessage(richInputContent: string) {
		if ((editor.getText().length <= 0 || editor.getText().length > 2500) && $files.length === 0) {
			return;
		}

		const body = {
			author: $user,
			channel_id: $page.params.id || $page.params.channelId,
			content: richInputContent,
			mentions: mentions,
			reply: $replyTo?.id,
			private_message: friend_chatbox
		};

		if (!friend_chatbox) {
			body.server_id = 'servers:' + $page.params.serverId;
		}

		if ($files.length > 0) {
			showSlowRequest = true;
		}

		const allFiles = await Promise.all(
			$files.map(async (file) => ({
				name: file.name,
				data: Array.from(new Uint8Array(await file.arrayBuffer()))
			}))
		);

		try {
			const result = await CreateMessage(
				$user,
				$page.params.id || $page.params.channelId,
				richInputContent,
				mentions,
				$replyTo?.id,
				friend_chatbox,
				'servers:' + $page.params.serverId,
				allFiles
			);

			if (result !== null) {
				console.log(result);
				throw new Error('Error on sending message');
			}

			updateChatInputState(channelId, null);
			showSlowRequest = false;
			files.set([]);
			mentions = [];
			replyTo.set(undefined);
		} catch (err) {
			console.log(err);
		}

		editor.commands.clearContent();
	}

	function initializeEditor() {
		editor = new Editor({
			onTransaction: ({ editor }) => {
				if (editor) {
					const currentMentions = editor
						.getJSON()
						.content?.flatMap((node) => node.content || [])
						.filter((node) => node.type === 'mention')
						.map((node) => node.attrs?.id) as string[];

					mentions = currentMentions;
				}
			},
			element: element,
			extensions: [
				Link.configure({
					openOnClick: true,
					defaultProtocol: 'https',
					autolink: true,
					protocols: ['https']
				}),
				StarterKit.configure({
					gapcursor: false,
					dropcursor: false,
					heading: false,
					orderedList: false,
					bulletList: false,
					blockquote: false
				}),
				Placeholder.configure({
					placeholder: 'Write something...'
				}),
				Emoji,
				EmojiSuggestion.configure({
					HTMLAttributes: {
						class: 'editor-emojis'
					},
					suggestion: {
						render: () => {
							return {
								onStart: (props) => {
									if (!props.clientRect) {
										return;
									}

									emojiProps = props;
								},
								onUpdate: (props) => {
									if (!props.clientRect) {
										return;
									}

									emojiProps = props;
								},
								onExit() {
									emojiProps = null;
								},
								onKeyDown: (props) => {
									if (props.event.key === 'Escape') {
										emojiProps = null;
										return true;
									}

									return emojisList?.handleKeyDown(props);
								}
							};
						}
					}
				}),
				Mention.configure({
					HTMLAttributes: {
						class: 'editor-mention'
					},
					renderHTML({ options, node }) {
						return [
							'span',
							options.HTMLAttributes,
							`${options.suggestion.char}${node.attrs.label}`
						];
					},
					suggestion: {
						items: async ({ query }) => {
							const filteredMembers = $servers['servers:' + $page.params.serverId].members
								.filter((item) => item.username.toLowerCase().startsWith(query.toLowerCase()))
								.slice(0, 5);
							return filteredMembers;
						},
						render: () => {
							return {
								onStart: (props) => {
									if (!props.clientRect) {
										return;
									}

									mentionProps = props;
								},
								onUpdate: (props) => {
									if (!props.clientRect) {
										return;
									}

									mentionProps = props;
								},
								onExit() {
									mentionProps = null;
								},
								onKeyDown: (props) => {
									if (props.event.key === 'Escape') {
										mentionProps = null;
										return true;
									}

									return mentionList?.handleKeyDown(props);
								}
							};
						}
					}
				})
			],
			content: getChatInputState(channelId),
			onUpdate: ({ editor }) => {
				updateChatInputState(channelId, editor.getHTML());
			},
			editorProps: {
				transformPastedHTML(html) {
					const parser = new DOMParser();
					const doc = parser.parseFromString(html, 'text/html');
					const mentionNodes = doc.querySelectorAll('span[data-type="mention"]');

					mentionNodes.forEach((node) => {
						const id = node.getAttribute('data-id');
						if (id && !mentions.includes(id)) {
							mentions.push(id);
						}
					});

					return html;
				},
				handleKeyDown: (_, event) => {
					if (
						event.key === 'Enter' &&
						(!mentionProps || mentionProps.items.length === 0) &&
						(!emojiProps || emojiProps.items.length === 0) &&
						!event.shiftKey
					) {
						event.preventDefault();

						sendMessage(editor.getHTML());

						return true;
					} else if (event.key.match(/^[a-zA-Z0-9]$/)) {
						debounceTypingStart();
						debounceTypingEnd();
					} else if (event.key === 'ArrowUp' && !mentionProps && !emojiProps) {
						const channelId = $page.params.id || $page.params.channelId;
						if ($messages[channelId]) {
							const mess = $messages[channelId].messages?.findLast(
								(message) => message.author.id === $user.id
							);
							editingMessage.set(mess.id);
						}
					}

					return false;
				}
			}
		});
	}

	function autoFocusEditor(e: KeyboardEvent) {
		if (
			e.key.match(/^[a-zA-Z0-9]$/) &&
			editor &&
			!editor.isFocused &&
			$editingMessage === '' &&
			!document?.activeElement?.tagName.match(/^(INPUT|TEXTAREA)$/i)
		) {
			editor.commands.setContent(e.key);
			editor.commands.focus('end');
		}
	}

	onMount(() => {
		initializeEditor();

		document.addEventListener('keydown', autoFocusEditor);
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});
</script>

<div id="rich-input" class="rich-input bg-zinc-925 relative">
	{#if showSlowRequest}
		<div
			class="absolute bg-zinc-850 left-3 -top-8 w-[calc(100%-1.5rem)] py-1 pb-4 px-3 rounded-tr-lg rounded-tl-lg text-sm"
		>
			Sending...
		</div>
	{/if}
	{#if $replyTo}
		<div
			class="absolute bg-zinc-850 left-3 -top-8 w-[calc(100%-1.5rem)] py-1 pb-5 px-3 rounded-tr-lg rounded-tl-lg text-sm"
		>
			Reply to {$replyTo?.author?.display_name}
		</div>
	{/if}
	{#if mentionProps}
		<MentionList props={mentionProps} bind:this={mentionList} {mentions} />
	{/if}
	{#if emojiProps}
		<EmojiList props={emojiProps} bind:this={emojisList} />
	{/if}
	<div bind:this={element} class="relative">
		<label
			for="dropzone-file"
			id="image-upload-icon"
			class="absolute top-1/2 -translate-y-1/2 left-[1.5rem] z-[2] w-[1.25rem] h-[1.25rem] flex justify-center items-center text-zinc-600 hover:text-zinc-400"
		>
			{#if $files.length > 0}
				<span class="text-xs">{$files.length}</span>
			{:else}
				<Icon icon="ph:images-duotone" class="pointer-events-none" height={20} width={20} />
			{/if}
		</label>
		<Icon
			icon="ph:smiley-melting-duotone"
			class="absolute top-1/2 -translate-y-1/2 right-[1.5rem] z-[2] text-zinc-600 hover:text-zinc-400"
			height={20}
			width={20}
		/>
	</div>
</div>

<style lang="postcss">
	.rich-input {
		width: 100%;
		z-index: 2;
	}

	:global(.ProseMirror:focus) {
		outline: none;
		border-color: theme(colors.zinc.600);
		transition: border-color 75ms ease-out;
	}

	:global(.ProseMirror) {
		max-height: 20rem;
		border: 1px solid theme(colors.zinc.750);
		background-color: theme(colors.zinc.850);
		font-size: theme(fontSize.sm);
		padding: 0.685rem 2.5rem;
		border-radius: 0.75rem;
		scroll-padding-block: 0.685rem;
		overflow: auto;
		margin: 0rem 0.75rem 0.75rem;
	}

	:global(.ProseMirror a) {
		color: theme(colors.blue.400);
	}

	:global(.ProseMirror a:hover) {
		cursor: pointer;
		text-decoration: underline;
	}

	:global(.is-editor-empty:first-child::before) {
		color: theme(colors.zinc.600);
		font-size: theme(fontSize.sm);
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}
	:global(img.emoji-editor) {
		height: 1.35em;
		width: 1.35em;
		margin: 0 0.1em 0 0.1em;
		vertical-align: -0.25em;
		display: inline-block;
		pointer-events: none;
	}
</style>
