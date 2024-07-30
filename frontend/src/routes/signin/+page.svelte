<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import SigninForm from '$lib/components/connection/signin-form.svelte';
	import { IsAuthenticated } from '$lib/wailsjs/go/main/App';
	import { onMount } from 'svelte';

	onMount(async () => {
		const response = await IsAuthenticated();
		if (response.status == 200) {
			goto('/hudori/chat/friends');
		}
	});
</script>

<SigninForm />
