import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

type PushMessage = {
	subscription: string;
	title: string;
	body: string;
	url?: string;
};

export const POST: RequestHandler = async ({ request }) => {
	const publicKey = env.VITE_VAPID_PUBLIC_KEY;
	const privateKey = env.VAPID_PRIVATE_KEY;
	const subject = env.VAPID_SUBJECT ?? 'mailto:camping@localhost';

	if (!publicKey || !privateKey) {
		return json({ ok: false, reason: 'push_not_configured' }, { status: 503 });
	}

	let body: { messages?: PushMessage[] };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, reason: 'bad_json' }, { status: 400 });
	}

	const messages = body.messages ?? [];
	if (messages.length === 0) return json({ ok: true, sent: 0 });

	const webpush = await import('web-push');
	webpush.setVapidDetails(subject, publicKey, privateKey);

	let sent = 0;
	for (const msg of messages) {
		try {
			const sub = JSON.parse(msg.subscription);
			await webpush.sendNotification(
				sub,
				JSON.stringify({
					title: msg.title,
					body: msg.body,
					url: msg.url ?? '/'
				})
			);
			sent += 1;
		} catch (e) {
			console.error('Push failed', e);
		}
	}

	return json({ ok: true, sent });
};
