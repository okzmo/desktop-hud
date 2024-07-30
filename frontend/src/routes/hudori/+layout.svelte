<script lang="ts">
	import Navbar from '$lib/components/ui/navbar/Navbar.svelte';
	import Sidebar from '$lib/components/ui/sidebar/Sidebar.svelte';
	import { treatMessage, treatMessageJSON } from '$lib/websocket';
	import { notifications, friendRequest, wsConn, messProto, servers } from '$lib/stores';
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import wasmUrl from 'brotli-dec-wasm/web/bg.wasm?url';
	import { default as init } from 'brotli-dec-wasm/web';
	import protobuf from 'protobufjs';
	import { fetchNotifs, scheduleSync, syncNotifications } from '$lib/fetches';

	export let data: LayoutData;
	friendRequest.set(data.props?.formFriendRequest);

	$: if ($notifications) {
		scheduleSync();
	}

	let ws;

	onMount(() => {
		ws = new WebSocket(
			`${import.meta.env.VITE_API_WS_URL}/ws/${data.props?.user.id.split(':')[1]}`
		);
		ws.binaryType = 'arraybuffer';
		wsConn.set(ws);

		window.setInterval(() => {
			ws.send('heartbeat');
		}, 10 * 1000);

		ws.onmessage = (event) => {
			if (event.data === 'heartbeat') return;

			if (event.data instanceof ArrayBuffer) {
				treatMessage(event.data);
			} else if (typeof event.data === 'string') {
				treatMessageJSON(event.data);
			}
		};

		ws.onopen = async () => {
			await init(wasmUrl);
			const protoResponse = await fetch('/proto/message.proto');
			if (!protoResponse.ok) {
				throw new Error(`HTTP error! status: ${protoResponse.status}`);
			}
			const protoContent = await protoResponse.text();

			const root = protobuf.parse(protoContent, { keepCase: true }).root;
			messProto.set(root.lookupType('hudori.WSMessage'));
		};

		ws.onerror = (event) => {
			// console.log(event);
		};

		ws.onclose = (event) => {
			// console.log(event);
		};

		const body = document.body;

		// body.oncontextmenu = (ev) => {
		// 	ev.preventDefault();
		// };

		const audios = document.getElementsByTagName('audio');
		for (const audio of audios) {
			audio.volume = 0.25;
		}

		window.addEventListener('beforeunload', syncNotifications);
		document.addEventListener('visibilitychange', async () => {
			if (document.visibilityState === 'hidden') {
				syncNotifications();
			}
		});

		setTimeout(() => {
			fetchNotifs();
		}, 250);
	});
</script>

<div class="h-full w-full flex">
	<!-- <div -->
	<!-- 	class="absolute -top-14 left-1/2 -translate-x-1/2 rounded-[50%] w-5/6 h-28 bg-zinc-500 z-[1] bg-gradient-to-b from-[#B693FF] to-[#9397FF] blur-3xl opacity-15 pointer-events-none" -->
	<!-- ></div> -->

	{#if !$page.url.pathname.includes('settings')}
		<Navbar />
		<Sidebar />
	{/if}
	{#if !$page.url.pathname.includes('settings')}
		<main class="flex-grow max-w-[calc(100%-17rem-4.15rem)] relative">
			<slot />
		</main>
	{/if}
	{#if $page.url.pathname.includes('settings')}
		<slot />
	{/if}

	<!-- <audio id="audio_join_channel" src="/audio/join_channel_pos.mp3"></audio> -->
	<!-- <audio id="audio_quit_channel" src="/audio/join_channel_neg.mp3"></audio> -->
	<!-- <audio id="audio_ringtone" src="/audio/ringtone.mp3"></audio> -->
</div>

<style>
	:global(a[data-internal='true']::after) {
		content: none;
	}
</style>
