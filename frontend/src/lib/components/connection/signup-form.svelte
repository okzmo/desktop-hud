<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { registerFormSchema, type RegisterFormSchema } from './schema-signup';
	import Icon from '@iconify/svelte';

	export let data: SuperValidated<Infer<RegisterFormSchema>>;

	const form = superForm(data, {
		validators: zodClient(registerFormSchema),
		dataType: 'json',
		multipleSubmits: 'prevent'
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
		<Form.Field {form} name="username" class="relative">
			<Form.Control let:attrs>
				<div class="flex space-x-2 items-center">
					<Form.Label
						class="text-zinc-500 after:content-['-'] gap-x-2 flex items-center after:opacity-0 data-[fs-error]:after:opacity-100 text-base leading-none"
						>Username</Form.Label
					>
					<Form.FieldErrors class="leading-none font-normal" />
				</div>
				<div class="relative">
					<Icon
						icon="ph:at-duotone"
						height={22}
						width={22}
						class="text-zinc-500 absolute top-1/2 -translate-y-1/2 left-3"
					/>
					<Input
						{...attrs}
						bind:value={$formData.username}
						class="pl-11 !mt-0 data-[fs-error]:border-destructive data-[fs-error]:ring-destructive"
					/>
				</div>
			</Form.Control>
		</Form.Field>
		<Form.Field {form} name="display_name" class="relative">
			<Form.Control let:attrs>
				<div class="flex space-x-2 items-center">
					<Form.Label
						class="text-zinc-500 after:content-['-'] gap-x-2 flex items-center after:opacity-0 data-[fs-error]:after:opacity-100 text-base leading-none"
						>Display Name</Form.Label
					>
					<Form.FieldErrors class="leading-none font-normal" />
				</div>
				<div class="relative">
					<Icon
						icon="ph:user-duotone"
						height={22}
						width={22}
						class="text-zinc-500 absolute top-1/2 -translate-y-1/2 left-3"
					/>
					<Input
						{...attrs}
						bind:value={$formData.display_name}
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
		<Form.Button>Sign up</Form.Button>
		{#if $errors.unexpected}<span class="text-destructive">{$errors.unexpected}</span>{/if}
	</form>
</div>
