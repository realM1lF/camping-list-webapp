import { readable } from 'svelte/store';
import { db } from './client';
import type { Profile } from '$lib/types';

export interface QueryState<T> {
	data: T | undefined;
	isLoading: boolean;
	error: string | null;
}

type QueryDef = Record<string, unknown>;
type QueryCallback = (res: {
	data?: unknown;
	isLoading: boolean;
	error?: { message?: string };
}) => void;

/**
 * Wrappt db.subscribeQuery in einen Svelte-Store.
 * Nutzung: `const items = query<Item[]>({ items: { ... } });` dann `$items.data`.
 * Ohne konfiguriertes Backend bleibt der Store im Ladezustand (Setup-Hinweis greift vorher).
 */
export function query<T>(q: QueryDef) {
	return readable<QueryState<T>>({ data: undefined, isLoading: true, error: null }, (set) => {
		if (!db) return;
		const client = db;
		const unsub = client.subscribeQuery(q as never, ((res: unknown) => {
			const r = res as { data?: unknown; isLoading: boolean; error?: { message?: string } };
			set({
				data: (r.data ?? undefined) as T | undefined,
				isLoading: r.isLoading,
				error: r.error?.message ?? null
			});
		}) satisfies QueryCallback as never);
		return unsub;
	});
}

export interface AuthUser {
	id: string;
	email?: string;
}

export interface AuthState {
	user: AuthUser | null;
	isLoading: boolean;
	error: string | null;
}

/**
 * Auth-Status. subscribeAuth liefert kein isLoading – der Zustand vor dem
 * ersten Callback ist "lädt" (Token-Validierung aus localStorage).
 */
export const auth = readable<AuthState>(
	{ user: null, isLoading: Boolean(db), error: null },
	(set) => {
		if (!db) return;
		const client = db;
		const unsub = client.subscribeAuth((res) => {
			set({
				user: res.user ? { id: res.user.id, email: res.user.email ?? undefined } : null,
				isLoading: false,
				error: res.error?.message ?? null
			});
		});
		return unsub;
	}
);

/**
 * Profil des eingeloggten Nutzers.
 * undefined = lädt noch, null = nicht eingeloggt oder Profil fehlt.
 */
export const myProfile = readable<Profile | null | undefined>(db ? undefined : null, (set) => {
	if (!db) return;
	const client = db;
	let unsubQuery: (() => void) | undefined;
	const unsubAuth = client.subscribeAuth((authRes) => {
		unsubQuery?.();
		unsubQuery = undefined;
		if (!authRes.user) {
			set(null);
			return;
		}
		const uid = authRes.user.id;
		// Erst auf "lädt" setzen, damit nach Logout→Login nicht kurz
		// der Profil-Setup-Screen aufblitzt.
		set(undefined);
		unsubQuery = client.subscribeQuery(
			{ profiles: { $: { where: { '$user.id': uid } }, avatar: {} } } as never,
			((res: unknown) => {
				const r = res as { data?: { profiles?: Profile[] } };
				set(r.data?.profiles?.[0] ?? null);
			}) as never
		);
	});
	return () => {
		unsubQuery?.();
		unsubAuth();
	};
});
