<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import type { User } from '$lib/types';

	export let user: User | undefined;
	export let side: 'top' | 'left' | 'bottom' | 'right' | undefined = 'right';
</script>

<Popover.Content
	{side}
	class="w-[25rem] h-[16rem] p-0 bg-transparent border-none shadow-none"
	sideOffset={10}
	align="start"
>
	<img
		class="w-full max-w-none h-full absolute left-0 top-0 object-cover rounded-2xl blur-2xl transform-gpu"
		src={user?.banner}
		alt=""
	/>
	<div class="rounded-2xl flex relative px-4 py-2 h-full">
		<div class="w-full h-full absolute left-0 top-0 object-cover rounded-[1.1rem] bg-zinc-700" />
		<img
			class="w-full h-full absolute left-0 top-0 object-cover rounded-[1.1rem] transform-gpu"
			src={user?.banner}
			alt=""
		/>
		<div class="flex flex-col justify-end gap-y-2 z-[2]">
			<span class="flex gap-x-3">
				<img class="w-14 h-14 object-cover rounded-2xl" src={user?.avatar} alt="" />
				<span class="flex flex-col justify-end mb-2">
					<p
						style={`
                color: ${user?.username_color?.includes('linear-gradient') ? 'transparent' : user?.username_color};
                background: ${user?.username_color?.includes('linear-gradient') ? user?.username_color : ''};
                background-clip: ${user?.username_color?.includes('linear-gradient') ? 'text' : ''};
              `}
						class="text-sm leading-3"
					>
						{user?.display_name}
					</p>
					<p class="text-sm leading-5 text-zinc-400">{user?.username}</p>
				</span>
			</span>
			<p class="text-sm leading-[1.10rem]">{user?.about_me}</p>
		</div>
		<div class="w-full absolute h-full progressive-blur rounded-2xl"></div>
		<div
			class="w-[calc(100%+1px)] absolute h-full rounded-2xl bg-gradient-to-t from-black/15 to-transparent left-0 top-0"
		></div>
	</div>
</Popover.Content>

<style lang="postcss">
	.progressive-blur {
		backdrop-filter: blur(40px);
		-webkit-backdrop-filter: blur(40px);
		inset: 0;

		mask-image: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) 85%, rgb(0, 0, 0));
		-webkit-mask-image: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) 85%, rgb(0, 0, 0));
	}
</style>
