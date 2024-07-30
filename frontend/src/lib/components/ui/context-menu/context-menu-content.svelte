<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	type $$Props = ContextMenuPrimitive.ContentProps;

	let className: $$Props['class'] = undefined;
	export { className as class };
</script>

<ContextMenuPrimitive.Content
	class={cn(
		'z-50 min-w-[8rem] rounded-xl border bg-zinc-800 border-zinc-750 p-1 text-zinc-50 shadow-md focus:outline-none',
		className
	)}
	{...$$restProps}
	on:keydown
>
	<slot />
</ContextMenuPrimitive.Content>
