import Mention from '@tiptap/extension-mention';
import { loadEmojis } from './emojiSuggestionLogic';

export const EmojiSuggestion = Mention.extend({
	name: 'emojiSuggestion',

	addOptions() {
		return {
			...this.parent?.(),
			suggestion: {
				char: ':', // Trigger character for emoji suggestions
				command: ({ editor, range, props }) => {
					// Insert the selected emoji

					editor
						.chain()
						.focus()
						.insertContentAt(range, [
							{
								type: 'emoji',
								attrs: {
									src: props.src,
									alt: props.alt
								}
							},
							{
								type: 'text',
								text: ' '
							}
						])
						.run();
				},
				allow: ({ editor, range }) => {
					return editor.can().insertContentAt(range, { type: 'emoji' });
				},
				items: async ({ query }) => {
					// Use your custom loadEmojis function here
					const emojis = await loadEmojis(query);
					return emojis;
				}
			}
		};
	}
});
