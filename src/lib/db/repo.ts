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
		db.tx.profiles[pid]
			.update({
				name: name.trim(),
				createdAt: Date.now(),
				notifyReplies: true,
				notifyMentions: true,
				notifyItemActivity: true
			})
			.link({ $user: authUserId })
	);
	if (avatarFile) {
		await setProfileAvatar(authUserId, pid, avatarFile);
	}
	return pid;
}

export function updateProfileName(profileId: string, name: string) {
	return db.transact(db.tx.profiles[profileId].update({ name: name.trim() }));
}

export function updateNotifPrefs(
	profileId: string,
	prefs: {
		notifyReplies?: boolean;
		notifyMentions?: boolean;
		notifyItemActivity?: boolean;
	}
) {
	return db.transact(db.tx.profiles[profileId].update(prefs));
}

export function savePushSubscription(profileId: string, subscriptionJson: string | null) {
	return db.transact(
		db.tx.profiles[profileId].update({ pushSubscription: subscriptionJson ?? undefined })
	);
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

export interface AddCommentInput {
	itemId: string;
	authorId: string;
	text: string;
	replyToId?: string | null;
	mentionIds?: string[];
	/** Für Notifications */
	tripId?: string;
	itemName?: string;
	authorName?: string;
	replyToAuthorId?: string | null;
	itemCreatedById?: string | null;
	claimUserIds?: string[];
	/** Profile der Empfänger (Prefs + Push) */
	people?: Array<{
		id: string;
		name: string;
		notifyReplies?: boolean | null;
		notifyMentions?: boolean | null;
		notifyItemActivity?: boolean | null;
		pushSubscription?: string | null;
	}>;
}

export async function addComment(input: AddCommentInput) {
	const cid = id();
	const text = input.text.trim();
	const mentionIds = [...new Set(input.mentionIds ?? [])].filter((id) => id !== input.authorId);

	let tx = db.tx.comments[cid]
		.update({ text, createdAt: Date.now() })
		.link({ item: input.itemId, author: input.authorId });

	if (input.replyToId) {
		tx = tx.link({ replyTo: input.replyToId });
	}
	if (mentionIds.length > 0) {
		tx = tx.link({ mentions: mentionIds });
	}

	await db.transact(tx);

	// Notifications (kein Doppel-Ping) – best effort
	try {
		const { resolveCommentTargets, filterTargetsByPrefs, notifCopy } = await import('$lib/notify');
		const { prefOn } = await import('$lib/types');
		const people = input.people ?? [];
		const byId = new Map(people.map((p) => [p.id, p]));

		const targets = filterTargetsByPrefs(
			resolveCommentTargets({
				authorId: input.authorId,
				mentionIds,
				replyToAuthorId: input.replyToAuthorId,
				item: {
					createdBy: input.itemCreatedById ? { id: input.itemCreatedById } as never : undefined,
					claims: (input.claimUserIds ?? []).map((id) => ({ user: { id } })) as never
				}
			}),
			byId as never
		);

		const preview = text;
		const itemName = input.itemName ?? 'Eintrag';
		const authorName = input.authorName ?? 'Jemand';
		const steps = [];

		for (const t of targets) {
			const nid = id();
			const copy = notifCopy(t.kind, authorName, itemName, preview);
			steps.push(
				db.tx.notifications[nid]
					.update({
						kind: t.kind,
						title: copy.title,
						body: copy.body,
						read: false,
						createdAt: Date.now(),
						tripId: input.tripId,
						itemId: input.itemId
					})
					.link({ recipient: t.profileId })
			);
		}
		if (steps.length) await db.transact(steps);

		// Web Push (wenn konfiguriert)
		const pushTargets = targets
			.map((t) => {
				const p = byId.get(t.profileId);
				if (!p?.pushSubscription) return null;
				if (t.kind === 'mention' && !prefOn(p.notifyMentions)) return null;
				if (t.kind === 'reply' && !prefOn(p.notifyReplies)) return null;
				if (t.kind === 'item_activity' && !prefOn(p.notifyItemActivity)) return null;
				const copy = notifCopy(t.kind, authorName, itemName, preview);
				return {
					subscription: p.pushSubscription,
					title: copy.title,
					body: copy.body,
					url:
						input.tripId && input.itemId
							? `/trip/${input.tripId}?item=${input.itemId}`
							: '/'
				};
			})
			.filter(Boolean);

		if (pushTargets.length > 0) {
			void fetch('/api/push', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ messages: pushTargets })
			}).catch(() => {});
		}
	} catch (e) {
		console.error('Notifications fehlgeschlagen', e);
	}

	return cid;
}

export function deleteComment(commentId: string) {
	return db.transact(db.tx.comments[commentId].delete());
}

export function markNotificationRead(notificationId: string) {
	return db.transact(db.tx.notifications[notificationId].update({ read: true }));
}

export function markAllNotificationsRead(ids: string[]) {
	if (ids.length === 0) return Promise.resolve();
	return db.transact(ids.map((nid) => db.tx.notifications[nid].update({ read: true })));
}
