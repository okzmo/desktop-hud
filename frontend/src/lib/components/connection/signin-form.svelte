<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { superForm, defaults, setError, fail } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import Icon from '@iconify/svelte';
	import { signinFormSchema } from './schema-signin';
	import { SignIn } from '$lib/wailsjs/go/main/App';
	import { formatError } from '$lib/utils';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores';

	const data = defaults(zod(signinFormSchema));

	const form = superForm(data, {
		SPA: true,
		validators: zod(signinFormSchema),
		clearOnSubmit: 'errors-and-message',
		dataType: 'json',
		async onUpdate({ form }) {
			if (!form.valid) return;

			try {
				const result = await SignIn(JSON.stringify(form.data));
				console.log(result);

				if (result.message !== 'success') {
					return setError(form, result.name, result.message);
				}

				user.set(result.user);
				goto('/hudori/chat/friends');
			} catch (e) {
				return fail(500, { error: 'An unexpected error occured.' });
			}
		}
	});

	const { form: formData, enhance, errors } = form;
</script>

<div class="w-full h-full flex justify-center items-center">
	<form method="POST" use:enhance class="flex flex-col gap-5 min-w-[20rem]">
		<Form.Field {form} name="email" class="relative">
			<Form.Control let:attrs>
				<div class="flex space-x-2 items-end">
					<Form.Label
						class="text-zinc-500 after:content-['-'] gap-x-2 flex items-center after:opacity-0 data-[fs-error]:after:opacity-100 text-base leading-none"
						>Email</Form.Label
					>
					<Form.FieldErrors class="leading-none font-normal" />
				</div>
				<div class="relative">
					<Icon
						icon="ph:envelope-duotone"
						height={22}
						width={22}
						class="text-zinc-500 absolute top-1/2 -translate-y-1/2 left-3"
					/>
					<Input
						{...attrs}
						bind:value={$formData.email}
						class="pl-11 !mt-0 data-[fs-error]:border-destructive data-[fs-error]:ring-destructive"
					/>
				</div>
			</Form.Control>
		</Form.Field>
		<Form.Field {form} name="password" class="relative">
			<Form.Control let:attrs>
				<div class="flex space-x-2 items-center">
					<Form.Label
						class="text-zinc-500 after:content-['-'] gap-x-2 flex items-center after:opacity-0 data-[fs-error]:after:opacity-100 text-base leading-none"
						>Password</Form.Label
					>
					<Form.FieldErrors class="leading-none font-normal" />
				</div>
				<div class="relative">
					<Icon
						icon="ph:lock-key-duotone"
						height={22}
						width={22}
						class="text-zinc-500 absolute top-1/2 -translate-y-1/2 left-3"
					/>
					<Input
						{...attrs}
						bind:value={$formData.password}
						type="password"
						class="pl-11 !mt-0 data-[fs-error]:border-destructive data-[fs-error]:ring-destructive"
					/>
				</div>
			</Form.Control>
		</Form.Field>
		<Form.Button>Sign in</Form.Button>

		{#if $errors.unexpected}<span class="text-destructive">{$errors.unexpected}</span>{/if}
	</form>
</div>
