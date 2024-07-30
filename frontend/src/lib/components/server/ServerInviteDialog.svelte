<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';

	export let id: string = '';
</script>

<Dialog.Content>
	<Dialog.Header>
		<Dialog.Title>Invite a friend!</Dialog.Title>
		<Dialog.Description
			>Just send them this link and they will be able to join you.</Dialog.Description
		>
	</Dialog.Header>
	<div class="flex flex-col gap-x-2">
		<div class="relative">
			<Input value={`https://hudori.app/${id}`} class="mt-2 !cursor-auto" disabled />
		</div>
	</div>
</Dialog.Content>
