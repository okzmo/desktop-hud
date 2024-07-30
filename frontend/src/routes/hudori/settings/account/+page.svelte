<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as Form from '$lib/components/ui/form';
	import { Button } from '$lib/components/ui/button';
	import { user } from '$lib/stores';
	import Icon from '@iconify/svelte';
	import { defaults, setError, superForm } from 'sveltekit-superforms/client';
	import type { PageData } from './$types';
	import {
		detailsDisplayNameSchema,
		detailsEmailSchema,
		detailsUsernameSchema
	} from '$lib/components/settings/schema-details';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';
	import { fail } from '@sveltejs/kit';
	import { ChangeDPName, ChangeEmail, ChangeUsername } from '$lib/wailsjs/go/main/App';

	let editDisplayName: Boolean = false;
	let editUsername: Boolean = false;
	let editEmail: Boolean = false;

	let userId: string = $user!.id;

	const dataEmail = defaults(zod(detailsEmailSchema));
	const emailForm = superForm(dataEmail, {
		validators: zod(detailsEmailSchema),
		SPA: true,
		dataType: 'json',
		validationMethod: 'submit-only',
		multipleSubmits: 'prevent',
		onSubmit({ formData }) {
			formData.set('user_id', userId);
		},
		async onUpdate({ form }) {
			if (!form.valid) return;

			let body: any = {
				user_id: $user.id,
				email: form.data.email
			};

			try {
				const response = await ChangeEmail(JSON.stringify(body));

				if (response.message !== 'success') {
					return setError(form, response.name, response.message);
				}

				user.update((user) => {
					user!.display_name = form.data.email;
					return user;
				});
				editEmail = false;
			} catch (e) {
				console.log(e);
				return fail(500, { error: 'An unexpected error occured.' });
			}
		}
	});

	const dataUsername = defaults(zod(detailsUsernameSchema));
	const usernameForm = superForm(dataUsername, {
		validators: zod(detailsUsernameSchema),
		SPA: true,
		dataType: 'json',
		validationMethod: 'submit-only',
		multipleSubmits: 'prevent',
		onSubmit({ formData }) {
			formData.set('user_id', userId);
		},
		async onUpdate({ form }) {
			if (!form.valid) return;

			let body: any = {
				user_id: $user.id,
				username: form.data.username
			};

			try {
				const response = await ChangeUsername(JSON.stringify(body));

				if (response.message !== 'success') {
					return setError(form, response.name, response.message);
				}

				user.update((user) => {
					user!.display_name = $usernameFormData.username;
					return user;
				});
				editUsername = false;
			} catch (e) {
				console.log(e);
				return fail(500, { error: 'An unexpected error occured.' });
			}
		}
	});

	const dataDP = defaults(zod(detailsDisplayNameSchema));
	const displayNameForm = superForm(dataDP, {
		validators: zodClient(detailsDisplayNameSchema),
		SPA: true,
		dataType: 'json',
		validationMethod: 'submit-only',
		multipleSubmits: 'prevent',
		onSubmit({ formData }) {
			formData.set('user_id', userId);
		},
		async onUpdate({ form }) {
			if (!form.valid) return;

			let body: any = {
				user_id: $user.id,
				display_name: form.data.display_name
			};

			try {
				const response = await ChangeDPName(JSON.stringify(body));

				if (response.message !== 'success') {
					return setError(form, response.name, response.message);
				}

				user.update((user) => {
					user!.display_name = form.data.display_name;
					return user;
				});
				editDisplayName = false;
			} catch (e) {
				console.log(e);
				return fail(500, { error: 'An unexpected error occured.' });
			}
		}
	});

	const { form: emailFormData, enhance: emailEnhance } = emailForm;
	const { form: usernameFormData, enhance: usernameEnhance } = usernameForm;
	const { form: displayNameFormData, enhance: displayNameEnhance } = displayNameForm;
</script>

<section class="flex-grow bg-zinc-800 ml-5 p-6 rounded-lg flex">
	<span class="flex-[60%_0_0]">
		<h3 class="text-xl font-semibold">Basic Details</h3>
		<p class="text-zinc-500">Change your username, display name or email.</p>
	</span>
	<div class="flex-[40%_0_0] flex flex-col gap-y-3">
		<form method="POST" use:displayNameEnhance>
			<Form.Field form={displayNameForm} name="display_name" class="relative">
				<Form.Control let:attrs>
					<div class="flex space-x-2 items-end">
						<Form.Label
							class="text-zinc-400 after:content-['-'] gap-x-2 flex items-center after:opacity-0 data-[fs-error]:after:opacity-100 text-xs uppercase leading-none"
							>Display Name</Form.Label
						>
						<Form.FieldErrors class="text-xs uppercase leading-none font-normal" />
					</div>
					<div class="relative">
						<Input
							{...attrs}
							bind:value={$displayNameFormData.display_name}
							disabled={!editDisplayName}
							class="!mt-0 data-[fs-error]:border-destructive data-[fs-error]:ring-destructive pr-0"
							placeholder={$user?.display_name}
						/>
						<Button
							on:click={() =>
								editDisplayName ? displayNameForm.submit() : (editDisplayName = true)}
							size="icon"
							class={`absolute top-1/2 -translate-y-1/2 right-2 h-8 w-8 border-none bg-zinc-800 ${editDisplayName ? 'hover:text-white hover:bg-green-500 text-green-500 border-none' : ''}`}
						>
							<Icon
								icon={editDisplayName ? 'ph:check-bold' : 'ph:pencil-simple-line-duotone'}
								height={18}
								width={18}
							/>
						</Button>
					</div>
				</Form.Control>
			</Form.Field>
		</form>
		<form method="POST" use:usernameEnhance>
			<Form.Field form={usernameForm} name="username" class="relative">
				<Form.Control let:attrs>
					<div class="flex items-end space-x-2">
						<Form.Label
							class="text-zinc-400 after:content-['-'] gap-x-2 flex items-center after:opacity-0 data-[fs-error]:after:opacity-100 text-xs uppercase leading-none"
							>username</Form.Label
						>
						<Form.FieldErrors class="text-xs uppercase leading-none font-normal" />
					</div>
					<div class="relative">
						<Input
							{...attrs}
							bind:value={$usernameFormData.username}
							disabled={!editUsername}
							class="!mt-0 data-[fs-error]:border-destructive data-[fs-error]:ring-destructive pr-0"
							placeholder={$user?.username}
						/>
						<Button
							on:click={() =>
								editUsername ? usernameForm.submit() : (editUsername = !editUsername)}
							size="icon"
							class={`absolute top-1/2 -translate-y-1/2 right-2 h-8 w-8 border-none bg-zinc-800 ${editUsername ? 'hover:text-white hover:bg-green-500 text-green-500 border-none' : ''}`}
						>
							<Icon
								icon={editUsername ? 'ph:check-bold' : 'ph:pencil-simple-line-duotone'}
								height={18}
								width={18}
							/>
						</Button>
					</div>
				</Form.Control>
			</Form.Field>
		</form>
		<form method="POST" use:emailEnhance>
			<Form.Field form={emailForm} name="email" class="relative">
				<Form.Control let:attrs>
					<div class="flex space-x-2 items-end">
						<Form.Label
							class="text-zinc-400 after:content-['-'] flex items-center after:opacity-0 data-[fs-error]:after:opacity-100 text-xs uppercase leading-none"
							>Email</Form.Label
						>
						<Form.FieldErrors class="text-xs uppercase leading-none font-normal" />
					</div>
					<div class="relative">
						<Input
							{...attrs}
							bind:value={$emailFormData.email}
							disabled={!editEmail}
							class="!mt-0 data-[fs-error]:border-destructive data-[fs-error]:ring-destructive pr-0"
							placeholder={$user?.email}
						/>
						<Button
							on:click={() => (editEmail ? emailForm.submit() : (editEmail = !editEmail))}
							size="icon"
							class={`absolute top-1/2 -translate-y-1/2 right-2 h-8 w-8 border-none bg-zinc-800 ${editEmail ? 'hover:text-white hover:bg-green-500 text-green-500 border-none' : ''}`}
						>
							<Icon
								icon={editEmail ? 'ph:check-bold' : 'ph:pencil-simple-line-duotone'}
								height={18}
								width={18}
							/>
						</Button>
					</div>
				</Form.Control>
			</Form.Field>
		</form>
	</div>
</section>
<section>Password</section>
