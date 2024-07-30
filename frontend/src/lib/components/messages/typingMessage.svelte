<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';

	export let usersTyping: any[];
	let totalUsers = 0;
	$: if (usersTyping) {
		totalUsers = usersTyping.filter(
			(user) =>
				user.channel_id === $page.params.channelId || user.user_id.split(':')[1] === $page.params.id
		).length;
	}
</script>

{#if browser}
	<div class="flex gap-x-2 items-end mt-6">
		<div
			class="flex-shrink-0 h-10 w-10 rounded-xl overflow-hidden bg-zinc-850 flex justify-center items-center"
		>
			{totalUsers}
		</div>
		<div class="flex flex-col w-fit">
			<div
				class="bg-zinc-850 rounded-xl rounded-bl-sm px-3 py-1 mt-1 w-fit text-sm [&>p]:break-all flex flex-col gap-y-1 max-w-[45rem]"
			>
				<Icon icon="eos-icons:three-dots-loading" height={35} width={45} class="text-zinc-600" />
			</div>
		</div>
	</div>
{/if}
