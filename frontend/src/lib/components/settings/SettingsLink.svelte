<script lang="ts">
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	export let icon: string;
	export let href: string;
</script>

<a
	{href}
	class="flex items-center gap-x-3 text-zinc-400 group hover:text-white hover:bg-zinc-800 pl-3 py-1 rounded-lg transition-colors duration-75"
	class:text-white={$page.url.pathname.includes(href)}
	class:bg-zinc-800={$page.url.pathname.includes(href)}
>
	<Icon {icon} />
	<slot />
</a>
