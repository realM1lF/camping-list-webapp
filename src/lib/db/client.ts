import { init, id } from '@instantdb/core';
import { browser } from '$app/environment';
import schema from './schema';

const appId = import.meta.env.VITE_INSTANT_APP_ID as string | undefined;

function createDb() {
	if (!browser || !appId) return null;
	try {
		return init({ appId, schema, devtool: false });
	} catch (e) {
		console.error('InstantDB konnte nicht initialisiert werden (App-ID prüfen):', e);
		return null;
	}
}

/**
 * null, wenn keine App-ID konfiguriert ist – die App zeigt dann einen
 * Setup-Hinweis statt eines Whitecreens.
 */
export const db = createDb();
export const hasBackend = db !== null;

export { id };

/** Wirft einen verständlichen Fehler, wenn Mutationen ohne Backend laufen. */
export function requireDb() {
	if (!db) throw new Error('Backend nicht konfiguriert (VITE_INSTANT_APP_ID fehlt).');
	return db;
}
