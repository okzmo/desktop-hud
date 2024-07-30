import { Node, mergeAttributes } from '@tiptap/core';

export const Emoji = Node.create({
	name: 'emoji',
	selectable: false,
	group: 'inline',
	inline: true,
	atom: true,

	addOptions() {
		return {
			HTMLAttributes: {},
			clipboardTextSerializer: (node) => node.attrs.alt,
			renderText({ node }) {
				return node.attrs.alt;
			},
			renderHTML({ node, HTMLAttributes }) {
				return [
					'img',
					mergeAttributes(HTMLAttributes, {
						class: 'emoji-editor',
						src: node.attrs.src,
						alt: node.attrs.alt,
						title: node.attrs.alt
					})
				];
			}
		};
	},

	addAttributes() {
		return {
			src: {
				default: null,
				parseHTML: (element) => element.getAttribute('src'),
				renderHTML: (attributes) => {
					if (!attributes.src) {
						return {};
					}
					return { src: attributes.src };
				}
			},
			alt: {
				default: null,
				parseHTML: (element) => element.getAttribute('alt'),
				renderHTML: (attributes) => {
					if (!attributes.alt) {
						return {};
					}
					return { alt: attributes.alt };
				}
			}
		};
	},

	parseHTML() {
		return [
			{
				tag: 'img[class=emoji-editor]',
				getAttrs: (element) => ({
					src: element.getAttribute('src'),
					alt: element.getAttribute('alt'),
					title: element.getAttribute('title')
				})
			}
		];
	},

	renderHTML({ node, HTMLAttributes }) {
		return [
			'img',
			mergeAttributes(HTMLAttributes, {
				class: 'emoji-editor',
				src: node.attrs.src,
				alt: node.attrs.alt,
				title: node.attrs.alt
			})
		];
	},

	renderText({ node }) {
		return node.attrs.alt;
	}
});
