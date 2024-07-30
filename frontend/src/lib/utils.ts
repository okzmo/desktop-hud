import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';
import { contextMenuInfo } from './stores';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
	y?: number;
	x?: number;
	start?: number;
	duration?: number;
};

export const flyAndScale = (
	node: Element,
	params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
	const style = getComputedStyle(node);
	const transform = style.transform === 'none' ? '' : style.transform;

	const scaleConversion = (valueA: number, scaleA: [number, number], scaleB: [number, number]) => {
		const [minA, maxA] = scaleA;
		const [minB, maxB] = scaleB;

		const percentage = (valueA - minA) / (maxA - minA);
		const valueB = percentage * (maxB - minB) + minB;

		return valueB;
	};

	const styleToString = (style: Record<string, number | string | undefined>): string => {
		return Object.keys(style).reduce((str, key) => {
			if (style[key] === undefined) return str;
			return str + `${key}:${style[key]};`;
		}, '');
	};

	return {
		duration: params.duration ?? 200,
		delay: 0,
		css: (t) => {
			const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
			const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
			const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

			return styleToString({
				transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
				opacity: t
			});
		},
		easing: cubicOut
	};
};

export function formatISODate(isoDate: string): string {
	const date = new Date(isoDate);
	const now = new Date();

	// If the date is today or yesterday
	if (date.toDateString() === now.toDateString()) {
		return `Today, ${date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
	} else {
		const yesterday = new Date(now);
		yesterday.setDate(yesterday.getDate() - 1);
		if (date.toDateString() === yesterday.toDateString()) {
			return `Yesterday, ${date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
		}
	}

	// If the date is older than yesterday
	return (
		date.toLocaleDateString('en', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		}) +
		' ' +
		date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: true })
	);
}

export function formatError(message: string): string {
	return message[0].toUpperCase() + message.slice(1) + '.';
}

export function manageTooltip(node: HTMLAnchorElement) {
	const handleMouseOver = (ev: MouseEvent) => {
		const link = ev.currentTarget as HTMLAnchorElement;
		if (link.hostname === window.location.hostname) {
			link.setAttribute('data-internal', 'true');
		} else {
			link.removeAttribute('data-internal');
		}
	};

	node.addEventListener('mouseover', handleMouseOver);

	return {
		destroy() {
			node.removeEventListener('mouseover', handleMouseOver);
		}
	};
}

export function handleContextMenu(id: string, roles: string[] | undefined = undefined) {
	const informations = {
		id: id,
		roles: roles
	};
	contextMenuInfo.set(informations);
}

export function generateRandomId(length = 5): string {
	return Math.random()
		.toString(36)
		.substring(2, 2 + length);
}

export function debounce<T extends (...args: any[]) => Promise<any>>(
	func: T,
	wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
	let timeout: ReturnType<typeof setTimeout> | null = null;
	let pendingPromise: Promise<ReturnType<T>> | null = null;

	return function (this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
		if (pendingPromise) {
			return pendingPromise;
		}

		const executeFunction = () => {
			const result = func.apply(this, args);
			return result instanceof Promise ? result : Promise.resolve(result);
		};

		if (timeout !== null) {
			clearTimeout(timeout);
		}

		return new Promise((resolve) => {
			timeout = setTimeout(() => {
				pendingPromise = executeFunction().finally(() => {
					pendingPromise = null;
				});
				resolve(pendingPromise);
			}, wait);
		});
	};
}

export async function removeCachedProfile(user_id: string) {
	const cache = await caches.open('user_profile');
	const cachedResponse = await cache.match(
		`${import.meta.env.VITE_API_URL}/api/v1/user/${user_id}`
	);

	if (cachedResponse) {
		await cache.delete(`${import.meta.env.VITE_API_URL}/api/v1/user/${user_id}`);
	}
}
