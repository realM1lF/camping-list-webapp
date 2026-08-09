import { writable } from 'svelte/store';

/** Home large-title collapsed into nav — driven by scroll on `/`. */
export const homeTitleCompact = writable(false);
export const homeGreeting = writable('');
