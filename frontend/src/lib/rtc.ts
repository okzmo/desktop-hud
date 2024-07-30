import {
	Participant,
	RemoteParticipant,
	RemoteTrack,
	RemoteTrackPublication,
	Room,
	RoomEvent,
	LocalTrackPublication,
	LocalParticipant,
	VideoPresets,
	Track,
	TrackPublication
} from 'livekit-client';
import {
	mutedState,
	participantExist,
	servers,
	sharingScreen,
	user,
	vcRoom,
	wsConn
} from './stores';
import { get } from 'svelte/store';
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { GenerateRoomToken } from '$lib/wailsjs/go/main/App';

export async function joinRoom(channelId: string, userId: string, serverId: string) {
	const existingRoom = get(vcRoom);
	const pageInfos = get(page);

	if (existingRoom && existingRoom.name === channelId && pageInfos.params.channelId === channelId)
		return;
	if (existingRoom && existingRoom.name === channelId && pageInfos.params.channelId !== channelId) {
		goto(`/hudori/chat/community/${serverId.split(':')[1]}/channels/${channelId.split(':')[1]}`);
		return;
	}
	if (existingRoom) {
		quitRoom(serverId);
	}

	const resp = await GenerateRoomToken(channelId, userId);
	const token = resp.token;

	const room = new Room({
		audioCaptureDefaults: {
			autoGainControl: true,
			echoCancellation: true,
			noiseSuppression: true
		},

		adaptiveStream: true,
		dynacast: true,
		videoCaptureDefaults: {
			resolution: VideoPresets.h1080.resolution
		},
		publishDefaults: {
			screenShareEncoding: {
				maxBitrate: 1_500_000,
				maxFramerate: 60
			},
			dtx: true
		}
	});

	// set up event listeners
	room
		.on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
		.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
		.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakerChange)
		.on(RoomEvent.Disconnected, handleDisconnect)
		.on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished)
		.on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);
	// .on(RoomEvent.TrackPublished, handleTrackPublished);

	await room.connect(import.meta.env.VITE_LIVEKIT_URL, token);
	const mutedParticipant = get(mutedState);

	try {
		await room.localParticipant.setMicrophoneEnabled(!mutedParticipant.muteMic);
	} catch (error) {
		console.error('Error enabling camera and microphone:', error);
	}

	if (mutedParticipant.muteHead) {
		room.remoteParticipants.forEach((participant) => {
			const audioTrack = participant.getTrackPublication(Track.Source.Microphone);
			audioTrack?.setEnabled(!mutedParticipant.muteHead);
		});
	}

	vcRoom.set(room);
	const userInfos = get(user);
	const exist = participantExist(serverId, channelId, userInfos?.id);

	goto(`/hudori/chat/community/${serverId.split(':')[1]}/channels/${channelId.split(':')[1]}`);

	if (!exist) {
		const ws = get(wsConn);

		const wsMessNew = {
			type: 'new_participant',
			content: {
				user: {
					id: userInfos.id,
					display_name: userInfos.display_name,
					avatar: userInfos.avatar,
					username_color: userInfos.username_color
				},
				serverId: serverId,
				channelId: channelId
			}
		};

		ws?.send(JSON.stringify(wsMessNew));
	}
}

export async function quitRoom(serverId: string) {
	const room = get(vcRoom);
	await room?.disconnect();
	vcRoom.set(undefined);
	const audio = document.getElementById('audio_quit_channel') as HTMLMediaElement;
	audio.play();

	const pageInfos = get(page);

	if (pageInfos.url.pathname.includes(serverId.split(':')[1])) {
		const ws = get(wsConn);
		const userInfos = get(user);
		const wsMess = {
			type: 'quit_participant',
			content: {
				user_id: userInfos?.id,
				serverId: serverId,
				channelId: room?.name
			}
		};

		ws?.send(JSON.stringify(wsMess));
	}
}

function handleTrackSubscribed(
	track: RemoteTrack,
	publication: RemoteTrackPublication,
	participant: RemoteParticipant
) {
	if (track.kind === Track.Kind.Audio) {
		const element = track.attach();
		document.body.appendChild(element);

		const audioPos = document.getElementById('audio_join_channel') as HTMLMediaElement;
		audioPos.play();
	}
	if (track.kind === Track.Kind.Video && track.source === 'screen_share') {
		setTimeout(() => {
			const vidElement = document.getElementById(
				`${participant.identity}-video-element`
			) as HTMLMediaElement;
			track.attach(vidElement);
		}, 200);
	}
}

function handleTrackUnsubscribed(
	track: RemoteTrack,
	publication: RemoteTrackPublication,
	participant: RemoteParticipant
) {
	// remove tracks from all attached elements
	track.detach();
}

function handleLocalTrackUnpublished(
	publication: LocalTrackPublication,
	participant: LocalParticipant
) {
	// when local tracks are ended, update UI to remove them from rendering
	publication.track?.detach();
}

function handleLocalTrackPublished(publication: LocalTrackPublication) {
	// when local tracks are ended, update UI to remove them from rendering
	if (publication.track?.kind === 'video' && publication.track?.source === 'screen_share') {
		const userId = get(user)?.id;
		const vidElement = document.getElementById(`${userId}-video-element`) as HTMLMediaElement;

		publication.track.attach(vidElement);
	}
}

function handleActiveSpeakerChange(speakers: Participant[]) {
	// show UI indicators when participant is speaking
	const room = get(vcRoom);
	const speakersMap = new Map(speakers.map((speaker) => [speaker.identity, true]));

	const pageInfo = get(page);
	servers.update((cache) => {
		const server = cache[`servers:${pageInfo.params.serverId}`];
		for (const category of server?.categories) {
			for (const channel of category.channels) {
				if (channel.id === room?.name) {
					for (const participant of channel.participants) {
						participant.talking = speakersMap.has(participant.id);
					}
					break;
				}
			}
		}
		return cache;
	});
}

function handleDisconnect() {}

export async function shareScreen() {
	const currentRoom = get(vcRoom);
	await currentRoom?.localParticipant.setScreenShareEnabled(true);
	sharingScreen.set(true);
}

export async function stopShareScreen() {
	const currentRoom = get(vcRoom);
	await currentRoom?.localParticipant.setScreenShareEnabled(false);
	sharingScreen.set(false);
}
