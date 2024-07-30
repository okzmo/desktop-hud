<script lang="ts">
	import { spring } from 'svelte/motion';
	import { Button } from '../ui/button';
	import { type Writable } from 'svelte/store';
	import { user } from '$lib/stores';
	import { ChangeNameColor } from '$lib/wailsjs/go/main/App';

	interface ColorStop {
		color: string;
		position: number;
	}

	export let selectedColor: Writable<string>;

	let isGradient = false;
	let colorStops: ColorStop[] = [
		{ color: 'rgb(255, 0, 0)', position: 0 },
		{ color: 'rgb(0, 0, 255)', position: 100 }
	];
	let solidColor = 'rgb(255,0,0)';
	let activeStopIndex = 0;

	let hue = 0;

	let pickerWidth = 300;
	const pickerHeight = pickerWidth * (179 / 300);

	const dotPosition = spring(
		{ x: pickerWidth, y: 0 },
		{
			stiffness: 0.3,
			damping: 0.8
		}
	);

	$: pickerColor = `hsl(${hue}, 100%, 50%)`;

	function updateColor(event: MouseEvent | { clientX: number; clientY: number }) {
		let x: number, y: number;

		if ('target' in event) {
			const { left, top, width, height } = (event.target as HTMLElement).getBoundingClientRect();
			x = Math.max(0, Math.min(event.clientX - left, width));
			y = Math.max(0, Math.min(event.clientY - top, height));
		} else {
			x = event.clientX;
			y = event.clientY;
		}

		dotPosition.set({ x, y });

		// Calculate saturation and value (brightness) from x and y
		const s = x / pickerWidth;
		const v = 1 - y / pickerHeight;

		// Convert HSV to RGB
		const h = hue / 360; // Normalize hue to 0-1 range
		const i = Math.floor(h * 6);
		const f = h * 6 - i;
		const p = v * (1 - s);
		const q = v * (1 - f * s);
		const t = v * (1 - (1 - f) * s);

		let r, g, b;
		switch (i % 6) {
			case 0:
				[r, g, b] = [v, t, p];
				break;
			case 1:
				[r, g, b] = [q, v, p];
				break;
			case 2:
				[r, g, b] = [p, v, t];
				break;
			case 3:
				[r, g, b] = [p, q, v];
				break;
			case 4:
				[r, g, b] = [t, p, v];
				break;
			case 5:
				[r, g, b] = [v, p, q];
				break;
		}

		// Adjust RGB values and convert to 0-255 range
		r = Math.round(r * 255);
		g = Math.round(g * 255);
		b = Math.round(b * 255);

		const newColor = `rgb(${r}, ${g}, ${b})`;
		if (isGradient) {
			colorStops[activeStopIndex].color = newColor;
			updateGradient();
		} else {
			solidColor = newColor;
			selectedColor.set(newColor);
		}
	}

	function handleHueChange(event: Event) {
		hue = parseInt((event.target as HTMLInputElement).value);
		updateColor({ clientX: $dotPosition.x, clientY: $dotPosition.y } as MouseEvent);
	}
	function addColorStop() {
		if (colorStops.length < 5) {
			const insertIndex = colorStops.length - 1;
			const newPosition =
				(colorStops[colorStops.length - 1].position + colorStops[colorStops.length - 2].position) /
				2;
			const newStop = { color: 'rgb(255,0,0)', position: newPosition };

			colorStops = [...colorStops.slice(0, insertIndex), newStop, ...colorStops.slice(insertIndex)];
			activeStopIndex = insertIndex;
			resetDotPosition(colorStops[insertIndex].color);
			redistributeColorStops();
			updateGradient();
		}
	}

	function removeColorStop(index: number) {
		if (colorStops.length > 2) {
			colorStops = colorStops.filter((_, i) => i !== index);
			activeStopIndex = Math.min(activeStopIndex, colorStops.length - 1);
			redistributeColorStops();
			updateGradient();
		}
	}

	function redistributeColorStops() {
		const stopCount = colorStops.length;
		const interval = 100 / (stopCount - 1);
		colorStops = colorStops.map((stop, index) => ({
			...stop,
			position: Math.round(index * interval)
		}));
	}

	function updateGradient() {
		selectedColor.set(generateGradientString());
	}

	function generateGradientString() {
		const gradientString = colorStops
			.sort((a, b) => a.position - b.position)
			.map((stop) => `${stop.color} ${stop.position}%`)
			.join(', ');
		return `linear-gradient(to right, ${gradientString})`;
	}

	function toggleGradient() {
		isGradient = !isGradient;
		if (isGradient) {
			resetDotPosition(colorStops[activeStopIndex].color);

			updateGradient();
		} else {
			selectedColor.set(solidColor);

			resetDotPosition(solidColor);
		}
	}

	function selectColorStop(index: number) {
		activeStopIndex = index;
		const selectedStop = colorStops[index];

		resetDotPosition(selectedStop.color);
	}

	function resetDotPosition(color: string) {
		const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
		if (match) {
			const r = parseInt(match[1]) / 255;
			const g = parseInt(match[2]) / 255;
			const b = parseInt(match[3]) / 255;

			const max = Math.max(r, g, b);
			const min = Math.min(r, g, b);
			const delta = max - min;

			// Calculate hue
			if (delta === 0) {
				hue = 0;
			} else if (max === r) {
				hue = 60 * (((g - b) / delta) % 6);
			} else if (max === g) {
				hue = 60 * ((b - r) / delta + 2);
			} else {
				hue = 60 * ((r - g) / delta + 4);
			}
			hue = Math.round(hue);

			// Calculate saturation and value
			const v = max;
			const s = max === 0 ? 0 : delta / max;

			dotPosition.set({
				x: s * pickerWidth,
				y: (1 - v) * pickerWidth
			});
		}
	}

	let saving: boolean;
	async function submitColor() {
		saving = true;

		const body = {
			user_id: $user.id,
			username_color: $selectedColor
		};

		const response = await ChangeNameColor(JSON.stringify(body));

		if (response.message !== 'success') {
			console.error('Color change failed', response.status);
		}

		saving = false;
		user.update((user) => {
			user.username_color = $selectedColor;
			return user;
		});
	}
</script>

<div class="color-picker p-2 bg-zinc-850 border border-zinc-750">
	<div
		class="picker-area"
		style="--picker-color-bg: {pickerColor};"
		on:mousedown={updateColor}
		on:mousemove={(event) => event.buttons === 1 && updateColor(event)}
	>
		<div class="picker-dot" style="left: {$dotPosition.x}px; top: {$dotPosition.y}px;"></div>
	</div>
	<input
		type="range"
		min="0"
		max="360"
		bind:value={hue}
		on:input={handleHueChange}
		class="hue-slider"
	/>
	<div class="color-stops mt-2" style="background: {$selectedColor};">
		{#if isGradient}
			{#each colorStops as stop, index}
				<div
					class="color-stop"
					style="background-color: {stop.color}; left: {stop.position}%;"
					class:active={index === activeStopIndex}
					on:click={() => selectColorStop(index)}
				>
					{#if index > 0 && index < colorStops.length - 1}
						<button class="remove-stop" on:click|stopPropagation={() => removeColorStop(index)}
							>×</button
						>
					{/if}
				</div>
			{/each}
			{#if colorStops.length < 5}
				<button class="add-stop" on:click={addColorStop}>+</button>
			{/if}
		{/if}
	</div>
	<div class="flex justify-between items-center mt-2 gap-x-2">
		<Button
			on:click={toggleGradient}
			class="aspect-square h-10 w-10"
			style="background: {isGradient ? solidColor : generateGradientString()};"
		></Button>
		<Button class="flex-grow" on:click={submitColor}>Save</Button>
	</div>
</div>

<style>
	.color-picker {
		width: 20rem;
		height: 18rem;
		display: flex;
		flex-direction: column;
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.picker-area {
		flex-grow: 1;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgb(0, 0, 0)),
			linear-gradient(to right, rgb(255, 255, 255), rgba(255, 255, 255, 0)), var(--picker-color-bg);
		position: relative;
		cursor: crosshair;
		border-radius: 0.5rem 0.5rem 0 0;
		flex-shrink: 0;
	}

	.picker-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 2px solid white;
		position: absolute;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}
	.hue-slider {
		width: 100%;
		height: 1rem;
		-webkit-appearance: none;
		border-radius: 0 0 0.5rem 0.5rem;
		background: linear-gradient(
			to right,
			hsl(0, 100%, 50%),
			hsl(60, 100%, 50%),
			hsl(120, 100%, 50%),
			hsl(180, 100%, 50%),
			hsl(240, 100%, 50%),
			hsl(300, 100%, 50%),
			hsl(360, 100%, 50%)
		);
	}

	.hue-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 5px;
		height: 1rem;
		border-radius: 20px;
		background: #ffffff;
		cursor: pointer;
	}

	.hue-slider::-moz-range-thumb {
		width: 5px;
		height: 1rem;
		border-radius: 20px;
		background: #ffffff;
		cursor: pointer;
		border: 1px solid black;
	}

	.color-stops {
		position: relative;
		height: 20px;
		background: #ddd;
		border-radius: 10px;
		margin-top: 10px;
	}

	.color-stop {
		position: absolute;
		width: 12px;
		height: 20px;
		border-radius: 1.2rem;
		border: 2px solid white;
		cursor: pointer;
		transform: translateX(-50%);
		transition: border-color 0.2s ease;
	}

	.color-stop.active {
		border-color: black;
		z-index: 1;
	}

	.remove-stop {
		position: absolute;
		top: -15px;
		left: 50%;
		transform: translateX(-50%);
		background: red;
		color: white;
		border: none;
		border-radius: 50%;
		width: 15px;
		height: 15px;
		font-size: 10px;
		line-height: 1;
		cursor: pointer;
	}

	.add-stop {
		position: absolute;
		right: 5px;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(255, 255, 255, 0.3);
		color: white;
		border: none;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		font-size: 16px;
		line-height: 1;
		cursor: pointer;
	}

	.add-stop:hover {
		background: rgba(255, 255, 255, 0.5);
	}
</style>
