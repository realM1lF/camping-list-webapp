import { browser } from '$app/environment';
import { savePushSubscription } from '$lib/db/repo';

const PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export function pushConfigured(): boolean {
	return Boolean(PUBLIC_KEY && PUBLIC_KEY.length > 20);
}

function urlBase64ToUint8Array(base64String: string) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const raw = atob(base64);
	const out = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
	return out;
}

export async function ensurePushSubscription(profileId: string): Promise<boolean> {
	if (!browser || !pushConfigured() || !('serviceWorker' in navigator) || !('PushManager' in window)) {
		return false;
	}
	const perm = await Notification.requestPermission();
	if (perm !== 'granted') return false;

	const reg = await navigator.serviceWorker.register('/sw.js');
	await navigator.serviceWorker.ready;

	let sub = await reg.pushManager.getSubscription();
	if (!sub) {
		sub = await reg.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY!)
		});
	}
	await savePushSubscription(profileId, JSON.stringify(sub.toJSON()));
	return true;
}

export async function clearPushSubscription(profileId: string): Promise<void> {
	if (!browser || !('serviceWorker' in navigator)) {
		await savePushSubscription(profileId, null);
		return;
	}
	const reg = await navigator.serviceWorker.getRegistration();
	const sub = await reg?.pushManager.getSubscription();
	await sub?.unsubscribe();
	await savePushSubscription(profileId, null);
}
