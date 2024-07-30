<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		if (typeof window !== 'undefined' && window.go) {
			goto('/signin');
		}
	});
</script>

<h1 class="text-5xl">Welcome to SvelteKit</h1>
