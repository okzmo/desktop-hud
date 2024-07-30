<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import Icon from '@iconify/svelte';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import {
		defaults,
		fail,
		setError,
		stringProxy,
		superForm,
		type Infer
	} from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { serverCreationSchema } from '$lib/components/server/schema-server-request';
	import { servers, user } from '$lib/stores';
	import type { Server } from '$lib/types';
	import type { Writable } from 'svelte/store';
	import { CreateServer, JoinServer } from '$lib/wailsjs/go/main/App';
	import { formatError } from '$lib/utils';

	export let open: Writable<boolean>;
	const data = defaults(zod(serverCreationSchema));

	const { form, message, errors, enhance, delayed } = superForm<
		Infer<typeof serverCreationSchema>,
		{ status: number; text: string } // Strongly typed status message
	>(data, {
		SPA: true,
		clearOnSubmit: 'errors-and-message',
		validators: zod(serverCreationSchema),
		invalidateAll: false,
		async onUpdate({ form }) {
			if (!form.valid) return;

			let body: any = {};

			try {
				let response: { [key: string]: any };
				if (form.data.type === 'create') {
					body['user_id'] = $user.id;
					body['name'] = form.data.id;
					response = await CreateServer(JSON.stringify(body));
				} else {
					body['user'] = $user;
					body['invite_id'] = form.data.id;
					response = await JoinServer(JSON.stringify(body));
				}

				if (response.message !== 'success') {
					return setError(form, response.name, formatError(response.message));
				}

				const server = response.server as Server;
				servers.update((servers) => {
					if (form.data.type === 'create') {
						server.roles = ['owner'];
					}
					servers[server.id] = server;
					return servers;
				});
				open.set(false);
				message.set(undefined);
			} catch (e) {
				return fail(500, { error: 'An unexpected error occured.' });
			}
		}
	});

	$: if ($open === false) {
		message.set(undefined);
	}

	const id = stringProxy(form, 'id', { empty: 'null' });
	const type = stringProxy(form, 'type', { empty: 'null' });
</script>

<Dialog.Content>
	<Dialog.Header>
		<Dialog.Title>Join or create a community!</Dialog.Title>
		<Dialog.Description
			>A community is a way to gather your friends or a group of people in a single place.</Dialog.Description
		>
	</Dialog.Header>
	<div class="flex flex-col gap-x-2">
		<form method="POST" use:enhance class="flex flex-col gap-y-2 relative">
			<RadioGroup.Root bind:value={$type}>
				<div
					class="flex items-center space-x-4 border bg-zinc-900 border-zinc-800 py-5 px-3 rounded-lg hover:bg-zinc-850 hover:border-zinc-750 transition-colors hover:cursor-pointer relative"
					class:active={$type === 'create'}
				>
					<RadioGroup.Item value="create" id="create" class="absolute opacity-0" />
					<Icon icon="ph:plus" height="26" width="26" />
					<Label
						for="create"
						class="after:content-normal after:absolute after:left-0 after:top-0 after:w-full after:h-full hover:cursor-pointer text-base"
						>Create a community</Label
					>
				</div>
				<div
					class="flex items-center space-x-4 border bg-zinc-900 border-zinc-800 py-5 px-3 rounded-lg hover:bg-zinc-850 hover:border-zinc-750 transition-colors hover:cursor-pointer relative"
					class:active={$type === 'join'}
				>
					<RadioGroup.Item value="join" id="join" class="absolute opacity-0" />
					<Icon icon="ph:users-four-duotone" height="26" width="26" />
					<Label
						for="join"
						class="after:content-normal after:absolute after:left-0 after:top-0 after:w-full after:h-full hover:cursor-pointer text-base"
						>Join a community</Label
					>
				</div>
			</RadioGroup.Root>
			<div class="mt-5 relative">
				<Dialog.Description>
					{#if $type === 'create'}
						To create a community you just need to enter its name.
					{:else}
						To join a community you just need to enter the invite you've been given.
					{/if}
				</Dialog.Description>
				<Input
					bind:value={$id}
					placeholder={$type === 'create'
						? 'Name of your new community'
						: 'https://hudori.app/Je8dkeU'}
					class="mt-2"
				/>

				{#if $errors.unexpected}<span class="text-destructive mt-1">{$errors.unexpected}</span>{/if}
			</div>
			<Button type="submit" class="py-3 mt-0 w-full">
				{#if $type === 'create'}
					{#if $delayed}
						Creating...
					{:else}
						Create
					{/if}
				{:else if $delayed}
					Joining...
				{:else}
					Join
				{/if}
			</Button>
		</form>
	</div>
</Dialog.Content>

<style lang="postcss">
	.active {
		background-color: theme(colors.zinc.850);
		border-color: theme(colors.zinc.750);
	}
</style>
