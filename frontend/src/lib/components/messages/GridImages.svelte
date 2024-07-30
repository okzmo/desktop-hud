<script lang="ts">
	import { loadingMessages } from '$lib/stores';
	import { Skeleton } from '../ui/skeleton';

	export let images: string[];

	const columnNumber = {
		1: 1,
		2: 2,
		3: 3,
		4: 2,
		5: 3,
		6: 3
	};
</script>

<div class="gallery" style="grid-template-columns: repeat({columnNumber[images.length]}, 1fr);">
	{#each images.slice(0, 5) as image, index}
		{#if index === 4 && images.length > 6}
			<div class="gallery-item more-images">
				+{images.length - 5} more
			</div>
		{:else}
			<div class="gallery-item rounded-lg">
				<img
					src={image}
					alt="Gallery"
					class="rounded-lg object-cover min-h-[15rem] max-h-[15rem]"
					class:aspect-square={columnNumber[images.length] > 1}
				/>
			</div>
		{/if}
	{/each}
</div>

<style>
	.gallery {
		display: grid;
		gap: 10px;
	}
	.gallery-item {
		position: relative;
	}
	.more-images {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 0, 0, 0.5);
		color: white;
		font-size: 1.5rem;
	}
</style>
