import emojiData from '$lib/emoji_mapping.json';

export const loadEmojis = async (query = '') => {
	const lowercaseQuery = query.toLowerCase();
	const queryParts = lowercaseQuery.split('_').filter((part) => part.length > 0);
	let filteredEmojis = [];

	for (const [variation, keywords] of Object.entries(emojiData)) {
		for (const [keyword, emojiList] of Object.entries(keywords)) {
			if (partialMatch(keyword, queryParts[0])) {
				filteredEmojis.push(
					...emojiList.map((emoji) => ({
						name: emoji.name,
						src: `/assets/emojis/${emoji.svgFileNames[0]}`,
						alt: emoji.name,
						variation: variation
					}))
				);
			}
		}
	}

	for (let i = 1; i < queryParts.length; i++) {
		filteredEmojis = filteredEmojis.filter(
			(emoji) => partialMatch(emoji.alt, queryParts[i]) || partialMatch(emoji.name, queryParts[i])
		);
	}

	return filteredEmojis.slice(0, 25);
};

function partialMatch(str, query) {
	return str.toLowerCase().includes(query);
}
