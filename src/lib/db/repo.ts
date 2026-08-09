import { requireDb, id } from './client';
import { prepareAvatar } from '$lib/image';

const db = new Proxy({} as ReturnType<typeof requireDb>, {
	get(_target, prop) {
		return requireDb()[prop as keyof ReturnType<typeof requireDb>];
	}
});

// ---- Auth (Magic Code) ----

export async function sendMagicCode(email: string) {
	return db.auth.sendMagicCode({ email });
}

export async function signInWithMagicCode(email: string, code: string) {
	return db.auth.signInWithMagicCode({ email, code });
}

export async function signOut() {
	return db.auth.signOut();
}

// ---- Profile ----

export async function ensureProfile(authUserId: string, name: string, avatarFile?: File | null) {
	const pid = id();
	await db.transact(
		db.tx.profiles[pid].update({ name: name.trim(), createdAt: Date.now() }).link({ $user: authUserId })
	);
	if (avatarFile) {
		await setProfileAvatar(authUserId, pid, avatarFile);
	}
	return pid;
}

export function updateProfileName(profileId: string, name: string) {
	return db.transact(db.tx.profiles[profileId].update({ name: name.trim() }));
}

/** Avatar hochladen, zuschneiden und mit Profil verknüpfen. */
export async function setProfileAvatar(authUserId: string, profileId: string, file: File) {
	const prepared = await prepareAvatar(file);
	const path = `${authUserId}/avatar.jpg`;
	const { data } = await db.storage.uploadFile(path, prepared, {
		contentType: 'image/jpeg',
		contentDisposition: 'inline'
	});
	return db.transact(db.tx.profiles[profileId].link({ avatar: data.id }));
}

// ---- Trips ----

export interface TripInput {
	name: string;
	year: number;
	location?: string;
	startDate?: string;
	endDate?: string;
}

export function createTrip(profileId: string, input: TripInput) {
	const tid = id();
	return db.transact(
		db.tx.trips[tid]
			.update({ ...input, createdAt: Date.now() })
			.link({ createdBy: profileId })
	);
}

export function deleteTrip(tripId: string) {
	return db.transact(db.tx.trips[tripId].delete());
}

// ---- Items ----

export interface ItemInput {
	name: string;
	emoji: string;
	category: string;
	neededCount?: number;
}

export function addItem(tripId: string, profileId: string, input: ItemInput) {
	const iid = id();
	return db.transact(
		db.tx.items[iid]
			.update({
				name: input.name.trim(),
				emoji: input.emoji,
				category: input.category,
				neededCount: input.neededCount ?? 1,
				createdAt: Date.now()
			})
			.link({ trip: tripId, createdBy: profileId })
	);
}

export function updateItem(itemId: string, patch: Partial<ItemInput>) {
	return db.transact(db.tx.items[itemId].update(patch));
}

/** Löscht Item inkl. Zusagen und Kommentaren (keine Cascades in Instant). */
export function deleteItem(itemId: string, claimIds: string[], commentIds: string[]) {
	return db.transact([
		...claimIds.map((cid) => db.tx.claims[cid].delete()),
		...commentIds.map((cid) => db.tx.comments[cid].delete()),
		db.tx.items[itemId].delete()
	]);
}

// ---- Zusagen (Claims) ----

export function claimItem(itemId: string, profileId: string, count = 1) {
	const cid = id();
	return db.transact(
		db.tx.claims[cid]
			.update({ count, createdAt: Date.now() })
			.link({ item: itemId, user: profileId })
	);
}

export function unclaimItem(claimId: string) {
	return db.transact(db.tx.claims[claimId].delete());
}

/** Anzahl der eigenen Zusage ändern (z. B. „ich bringe 2 mit"). */
export function updateClaimCount(claimId: string, count: number) {
	if (count < 1) return unclaimItem(claimId);
	return db.transact(db.tx.claims[claimId].update({ count }));
}

// ---- Kommentare ----

export function addComment(itemId: string, profileId: string, text: string) {
	const cid = id();
	return db.transact(
		db.tx.comments[cid]
			.update({ text: text.trim(), createdAt: Date.now() })
			.link({ item: itemId, author: profileId })
	);
}

export function deleteComment(commentId: string) {
	return db.transact(db.tx.comments[commentId].delete());
}
