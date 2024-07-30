<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	type $$Props = ContextMenuPrimitive.ItemProps & {
		inset?: boolean;
	};
	type $$Events = ContextMenuPrimitive.ItemEvents;

	let className: $$Props['class'] = undefined;
	export let inset: $$Props['inset'] = undefined;
	export { className as class };
</script>

<ContextMenuPrimitive.Item
	class={cn(
		'relative flex first:mt-0 cursor-pointer select-none items-center rounded-lg pl-2 pr-5 py-2 text-base outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-zinc-700 data-[highlighted]:transition-colors data-[highlighted]:duration-75 data-[disabled]:opacity-50',
		inset && 'pl-8',
		className
	)}
	{...$$restProps}
	on:click
	on:keydown
	on:focusin
	on:focusout
	on:pointerdown
	on:pointerleave
	on:pointermove
>
	<slot />
</ContextMenuPrimitive.Item>
