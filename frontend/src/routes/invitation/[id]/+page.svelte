<script lang="ts">
	import Icon from '@iconify/svelte';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import {
		registerFormSchema,
		type RegisterFormSchema
	} from '$lib/components/connection/schema-signup';
	import type { User } from '$lib/types';

	export let data: {
		invite: { initiator: User };
		form: SuperValidated<Infer<RegisterFormSchema>>;
	};

	const form = superForm(data.form, {
		validators: zodClient(registerFormSchema),
		dataType: 'json',
		multipleSubmits: 'prevent'
	});

	const { form: formData, enhance, errors } = form;

	let initiator = data.invite.initiator;

	let inviteCard: HTMLElement;
	let formSignup: HTMLElement;
</script>

<div class="w-full h-full flex justify-center items-center">
	{#if data.invite}
		<div bind:this={inviteCard} class="w-fit absolute transition-opacity shadow-2xl">
			<div class="rounded-xl overflow-hidden">
				<p class="absolute z-10 text-white/30 left-5 bottom-4 text-sm">
					Sent by {initiator.display_name}
				</p>
				<p class="absolute z-10 text-white/30 left-5 top-4 flex gap-x-1 items-center text-sm">
					<Icon icon="ph:envelope-duotone" height={26} width={19} />
					New invitation
				</p>
				<button
					class="absolute z-10 text-white bg-white/5 px-3 backdrop-blur-md py-1 rounded-lg right-5 bottom-4 hover:bg-white/15 transition-colors"
					on:click={() => {
						inviteCard.style.opacity = '0%';
						formSignup.style.opacity = '100%';
					}}>Use</button
				>
				<img src={initiator.banner} alt="banner" class="max-w-[25rem] rounded-[1.2rem]" />
				<div class="w-full absolute h-full progressive-blur rounded-2xl z-[0]"></div>
			</div>
			<img
				class="w-full max-w-none h-full absolute left-0 top-0 object-cover rounded-xl blur-xl transform-gpu z-[-1]"
				src={initiator.banner}
				alt=""
			/>
		</div>

		<form
			bind:this={formSignup}
			method="POST"
			use:enhance
			class="flex flex-col gap-5 min-w-[20rem] transition-opacity opacity-0"
		>
			<Form.Field {form} name="email">
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
	{/if}
</div>

<style lang="postcss">
	.progressive-blur {
		backdrop-filter: blur(40px);
		-webkit-backdrop-filter: blur(40px);
		inset: 0;

		mask-image: radial-gradient(50% 50% at 50% 50%, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%);
		-webkit-mask-image: radial-gradient(
			48% 48% at 50% 50%,
			rgba(0, 0, 0, 0) 0%,
			rgba(0, 0, 0, 1) 100%
		);
	}
</style>
