<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { servers } from '$lib/stores';
	import { page } from '$app/stores';

	onMount(() => {
		if ($servers[`servers:${$page.params.serverId}`].roles?.some((role) => role === 'owner')) {
			history.back();
		} else {
			goto('/hudori/settings/account');
		}
	});
</script>
