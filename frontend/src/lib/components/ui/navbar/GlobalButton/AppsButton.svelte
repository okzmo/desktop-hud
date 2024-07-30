<script lang="ts">
	import { page } from '$app/stores';
	import Button from '../../button/button.svelte';
	import Icon from '@iconify/svelte';

	export let name: string;
    export let href: string;
	export let description: string;
	export let icon: string;

	let active: boolean;
    $:{
	  const filteredHref = href.split("/").slice(1,3).join("/")
	 active =$page.url.pathname.includes(filteredHref);	
	}
</script>

<Button
	class="group flex items-center gap-x-4  w-full
				 rounded-xl justify-start !border-none py-2 px-3 {active ? 'bg-zinc-700 hover:bg-zinc-725' : 'hover:bg-zinc-725'}"
    {href}
>
	<Icon {icon} height={25} width={25} class={active ? 'text-zinc-50' : 'text-zinc-600 group-hover:text-zinc-400'} />
	<span>
		<p class="text-left text-sm {active ? 'text-zinc-50' : 'text-zinc-600 group-hover:text-zinc-400'} ">{name}</p>
		<p class="text-xs text-left {active ? 'text-zinc-400' : 'text-zinc-600 group-hover:text-zinc-500'} ">
			{description}
		</p>
	</span>
</Button>
