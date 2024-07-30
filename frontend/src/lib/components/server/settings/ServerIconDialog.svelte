<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import Cropper from 'svelte-easy-crop';
	import Button from '$lib/components/ui/button/button.svelte';
	import Dropzone from 'svelte-file-dropzone';
	import Icon from '@iconify/svelte';
	import { servers, user } from '$lib/stores';
	import type { Writable } from 'svelte/store';
	import { page } from '$app/stores';
	let crop = { x: 0, y: 0 };
	let zoom = 1;
	let image: string | undefined = undefined;
	let file: Blob | string | undefined;
	let croppingElements: any;

	export let dialogState: Writable<boolean>;

	let uploading = false;

	function handleFilesSelect(e) {
		const { acceptedFiles } = e.detail;
		if (acceptedFiles.length > 0) {
			const image = acceptedFiles[0];
			file = acceptedFiles[0];
			readImage(image);
		}
	}
	function readImage(imageFile: any) {
		const reader = new FileReader();
		reader.onload = (e) => {
			image = e.target?.result as string | undefined;
		};
		reader.readAsDataURL(imageFile);
	}

	async function submitIcon() {
		if (!image || !file) return;

		uploading = true;
		const form = new FormData();
		const old_icon = $servers[`servers:${$page.params.serverId}`]?.icon?.split('/').at(-1);
		form.append('icon', file);
		form.append('cropY', croppingElements.pixels.y);
		form.append('cropX', croppingElements.pixels.x);
		form.append('cropWidth', croppingElements.pixels.width);
		form.append('cropHeight', croppingElements.pixels.height);
		if (old_icon) form.append('old_icon', old_icon);
		if ($servers[`servers:${$page.params.serverId}`]) {
			form.append('server_id', `servers:${$page.params.serverId}`);
		}

		const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/server/change_icon`, {
			method: 'POST',
			credentials: 'include',
			body: form,
			headers: {
				'X-User-ID': $user?.id
			}
		});

		if (!response.ok) {
			console.error('Image upload failed', response.status);
		}

		const data = await response.json();
		uploading = false;
		servers.update((server) => {
			const serverExist = server[`servers:${$page.params.serverId}`];
			if (serverExist) {
				serverExist.icon = data.icon;
			}
			return server;
		});

		dialogState.set(false);
		image = undefined;
		crop = { x: 0, y: 0 };
		zoom = 1;
		file = undefined;
	}
</script>

<Dialog.Content class="max-w-[30rem] aspect-square">
	<Dialog.Header>
		<Dialog.Title>Change your server icon</Dialog.Title>
		<Dialog.Description
			>Click to choose an image or drag and drop then crop it and save!</Dialog.Description
		>
	</Dialog.Header>
	<div
		class={`relative w-full h-[20rem] border border-zinc-800 ${image ? 'bg-zinc-800' : 'bg-zinc-925'}`}
	>
		{#if image}
			<Cropper
				on:cropcomplete={(e) => (croppingElements = e.detail)}
				{image}
				showGrid={false}
				aspect={40 / 40}
				bind:zoom
				bind:crop
				zoomSpeed={0.2}
			/>
		{:else}
			<Dropzone
				on:drop={handleFilesSelect}
				containerClasses="h-full justify-center !bg-transparent !text-zinc-700"
				accept={['image/*']}
			>
				<Icon icon="ph:image-duotone" height={100} width={100} />
				Choose an image and crop it!
			</Dropzone>
		{/if}
	</div>
	<div class="flex w-full gap-x-2">
		{#if image}
			<Button
				size="icon"
				on:click={() => (image = undefined)}
				class="shadow-none border-none bg-destructive hover:bg-red-600"
			>
				<Icon icon="ph:trash-duotone" height={20} width={20} />
			</Button>
		{/if}
		<Button class="flex-1" disabled={!image || uploading} on:click={submitIcon}
			>{uploading ? 'Uploading...' : 'Save'}</Button
		>
	</div>
</Dialog.Content>
