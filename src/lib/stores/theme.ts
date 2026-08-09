import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'rossmuehle-theme';

function initialTheme(): Theme {
	if (!browser) return 'light';
	const saved = localStorage.getItem(STORAGE_KEY);
	// Light ist Standard – Dark nur bei expliziter Wahl.
	return saved === 'dark' ? 'dark' : 'light';
}

export const theme = writable<Theme>(initialTheme());

if (browser) {
	theme.subscribe((t) => {
		document.documentElement.classList.toggle('dark', t === 'dark');
		localStorage.setItem(STORAGE_KEY, t);
	});
}

export function toggleTheme() {
	theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
}
