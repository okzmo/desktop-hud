<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import Link from '@tiptap/extension-link';
	import { user, updateChatInputState, servers, messages, editingMessage } from '$lib/stores';
	import { page } from '$app/stores';
	import type { Writable } from 'svelte/store';
	import Mention from '@tiptap/extension-mention';
	import MentionList from './MentionList.svelte';
	import { Emoji } from './emojiNode';
	import { EmojiSuggestion } from './emojiSuggestion';
	import EmojiList from './EmojiList.svelte';
	import type { SuggestionProps } from '@tiptap/suggestion';
	import { EditMessage } from '$lib/wailsjs/go/main/App';

	let element: Element | undefined;
	let editor: Editor;
	let mentionList: any;
	let emojisList: any;

	export let friend_chatbox: boolean;
	export let files: Writable<File[]>;
	export let messageToEdit: string | null;
	export let messageToEditId: string | null;

	let channelId = '';
	let mentionProps: SuggestionProps<any> | null;
	let emojiProps: SuggestionProps<any> | null;
	let mentions: string[] = [];

	$: if ($page.params.id || $page.params.channelId) {
		channelId = $page.params.id || $page.params.channelId;
	}

	$: {
		if (editor && messageToEdit !== null) {
			editor.commands.setContent(messageToEdit);
		}
	}
	async function editMessage(richInputContent: string) {
		if ((editor.getText().length <= 0 || editor.getText().length > 2500) && $files.length === 0) {
			return;
		}

		messages.update((cache) => {
			const mess = cache[channelId]?.messages?.find((message) => message.id === messageToEditId);
			if (mess) {
				mess.content = richInputContent;
				mess.mentions = mentions;
				mess.edited = true;
			}
			return cache;
		});

		editingMessage.set('');

		const body = {
			channel_id: $page.params.id || $page.params.channelId,
			author_id: $user.id.split(':')[1],
			content: richInputContent,
			mentions: mentions,
			private_message: friend_chatbox,
			message_id: messageToEditId
		};

		try {
			const response = await EditMessage(JSON.stringify(body));

			if (response.message !== 'success') {
				throw new Error(`error when sending message ${response.status}`);
			}

			mentions = [];
		} catch (err) {
			console.log(err);
		}

		editor.commands.clearContent();
	}

	function initializeEditor() {
		editor = new Editor({
			content: messageToEditId,
			autofocus: 'end',
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
			onUpdate: ({ editor }) => {
				updateChatInputState(channelId, editor.getHTML());
			},
			editorProps: {
				attributes: {
					class: 'edit-message'
				},
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

						editMessage(editor.getHTML());

						return true;
					}

					return false;
				}
			}
		});

		editor.commands.setContent(messageToEdit || '');
		editor.commands.focus('end');
	}

	onMount(() => {
		initializeEditor();
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});
</script>

<div id="rich-input" class="rich-input relative">
	{#if mentionProps}
		<MentionList props={mentionProps} bind:this={mentionList} {mentions} />
	{/if}
	{#if emojiProps}
		<EmojiList props={emojiProps} bind:this={emojisList} />
	{/if}
	<div bind:this={element} class="relative"></div>
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

	:global(.ProseMirror.edit-message) {
		margin: 0rem !important;
		padding: 0.5rem 0.8rem;
	}

	:global(.ProseMirror a) {
		color: theme(colors.blue.400);
	}

	:global(.ProseMirror a:hover) {
		cursor: pointer;
		text-decoration: underline;
	}
</style>
