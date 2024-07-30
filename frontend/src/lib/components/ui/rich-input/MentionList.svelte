<script lang="ts">
	export let props;
	export let mentions: string[];
	let selectedIndex = 0;
	let scrollableMenu: HTMLDivElement;

	export function handleKeyDown({ event }) {
		if (event.key === 'ArrowUp') {
			handleArrowUp();
			return true;
		}

		if (event.key === 'ArrowDown') {
			handleArrowDown();
			return true;
		}

		if (event.key === 'Enter') {
			handleEnter();
			return true;
		}
	}

	function handleArrowUp() {
		selectedIndex = (selectedIndex + props.items.length - 1) % props.items.length;
		scrollToSelectedItem();
	}

	function handleArrowDown() {
		selectedIndex = (selectedIndex + 1) % props.items.length;
		scrollToSelectedItem();
	}

	function scrollToSelectedItem() {
		if (scrollableMenu) {
			const selectedItem = scrollableMenu.children[selectedIndex] as HTMLElement;
			if (selectedItem) {
				const scrollTop = scrollableMenu.scrollTop;
				const scrollBottom = scrollTop + scrollableMenu.clientHeight;
				const elementTop = selectedItem.offsetTop;
				const elementBottom = elementTop + selectedItem.offsetHeight;

				if (elementTop < scrollTop) {
					scrollableMenu.scrollTop = elementTop;
				} else if (elementBottom > scrollBottom) {
					scrollableMenu.scrollTop = elementBottom - scrollableMenu.clientHeight;
				}
			}
		}
	}

	function handleEnter() {
		selectItem(selectedIndex);
	}

	function selectItem(index) {
		const item = props.items[index];
		mentions.push(item.id);

		if (item) {
			props.command({ id: item.id, label: item.username });
		}
	}
</script>

{#if props.items.length > 0}
	<div
		bind:this={scrollableMenu}
		class="sticky overflow-y-auto max-h-[20rem] bg-zinc-850 mx-3 top-3 w-[calc(100%-1.5rem)] mb-1 !py-1 !px-1 rounded-lg !z-[-1]"
	>
		{#each props.items as item, idx}
			<button
				class="!px-2 py-1 hover:!bg-zinc-700 rounded-md w-full text-left"
				on:click={() => selectedIndex(idx)}
				class:selected-item={idx === selectedIndex}
			>
				{item.username}
			</button>
		{/each}
	</div>
{/if}

<style lang="postcss">
	.selected-item {
		background-color: theme(colors.zinc.750);
	}
</style>
