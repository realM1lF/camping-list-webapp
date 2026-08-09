/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

/** Cache-Key mit App-Version — alter Gift-Cache (cache-first auf alles) wird verworfen. */
const CACHE = `rossmuehle-v2-${version}`;
const ASSETS = new Set([...build, ...files]);

self.addEventListener('install', (event: ExtendableEvent) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll([...ASSETS]))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event: ExtendableEvent) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
			)
			.then(() => self.clients.claim())
	);
});

/**
 * Nur precachte Build-/Static-Assets: cache-first.
 * Navigation + alles andere: network-only — kein Runtime-Caching,
 * sonst kleben alte CSS/JS nach Deploys (genau der „altes Design flackert“-Bug).
 */
self.addEventListener('fetch', (event: FetchEvent) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	// HTML-Navigation immer frisch vom Netz
	if (request.mode === 'navigate') {
		event.respondWith(fetch(request));
		return;
	}

	const path = url.pathname;
	if (!ASSETS.has(path)) {
		// Nicht in der Precache-Liste → nie aus Cache, nie neu cachen
		return;
	}

	event.respondWith(
		caches.match(request).then(
			(cached) =>
				cached ??
				fetch(request).then((res) => {
					if (res.ok) {
						const clone = res.clone();
						caches.open(CACHE).then((cache) => cache.put(request, clone));
					}
					return res;
				})
		)
	);
});
