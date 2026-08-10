/* Camping-Planner – Push + offline shell */
self.addEventListener('install', (event) => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
	let data = { title: 'Camping-Planner', body: '', url: '/' };
	try {
		if (event.data) data = { ...data, ...event.data.json() };
	} catch {
		try {
			data.body = event.data?.text() ?? '';
		} catch {
			/* ignore */
		}
	}
	event.waitUntil(
		self.registration.showNotification(data.title || 'Camping-Planner', {
			body: data.body || '',
			icon: '/icon.svg',
			badge: '/icon.svg',
			data: { url: data.url || '/' }
		})
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = event.notification.data?.url || '/';
	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
			for (const c of clients) {
				if ('focus' in c) {
					c.navigate?.(url);
					return c.focus();
				}
			}
			if (self.clients.openWindow) return self.clients.openWindow(url);
		})
	);
});
