import type { Comment, Item, NotificationKind, Profile } from '$lib/types';
import { prefOn } from '$lib/types';

export type NotifTarget = { profileId: string; kind: NotificationKind };

/**
 * Empfänger ohne Doppel-Ping.
 * Priorität: mention > reply > item_activity (pro Person nur ein Kind).
 */
export function resolveCommentTargets(input: {
	authorId: string;
	mentionIds: string[];
	replyToAuthorId?: string | null;
	item: Pick<Item, 'createdBy' | 'claims'>;
}): NotifTarget[] {
	const map = new Map<string, NotificationKind>();

	for (const id of input.mentionIds) {
		if (id && id !== input.authorId) map.set(id, 'mention');
	}

	const replyAuthor = input.replyToAuthorId;
	if (replyAuthor && replyAuthor !== input.authorId && !map.has(replyAuthor)) {
		map.set(replyAuthor, 'reply');
	}

	const activityIds = new Set<string>();
	if (input.item.createdBy?.id) activityIds.add(input.item.createdBy.id);
	for (const c of input.item.claims ?? []) {
		if (c.user?.id) activityIds.add(c.user.id);
	}
	for (const id of activityIds) {
		if (id !== input.authorId && !map.has(id)) map.set(id, 'item_activity');
	}

	return [...map.entries()].map(([profileId, kind]) => ({ profileId, kind }));
}

export function filterTargetsByPrefs(
	targets: NotifTarget[],
	profilesById: Map<string, Profile>
): NotifTarget[] {
	return targets.filter(({ profileId, kind }) => {
		const p = profilesById.get(profileId);
		if (!p) return true; // Prefs unbekannt → Default an
		if (kind === 'mention') return prefOn(p.notifyMentions);
		if (kind === 'reply') return prefOn(p.notifyReplies);
		return prefOn(p.notifyItemActivity);
	});
}

export function notifCopy(kind: NotificationKind, authorName: string, itemName: string, preview: string) {
	const short = preview.length > 80 ? `${preview.slice(0, 77)}…` : preview;
	if (kind === 'mention') {
		return {
			title: `${authorName} hat dich erwähnt`,
			body: `${itemName}: ${short}`
		};
	}
	if (kind === 'reply') {
		return {
			title: `${authorName} hat geantwortet`,
			body: `${itemName}: ${short}`
		};
	}
	return {
		title: `Neuer Kommentar: ${itemName}`,
		body: `${authorName}: ${short}`
	};
}

/** @Name aus Text → Profil-IDs (längere Namen zuerst). */
export function parseMentionIds(text: string, people: Profile[]): string[] {
	const sorted = [...people].sort((a, b) => b.name.length - a.name.length);
	const found = new Set<string>();
	for (const p of sorted) {
		const re = new RegExp(`(?:^|\\s)@${escapeReg(p.name)}(?=\\s|$|[.,!?;:])`, 'gi');
		if (re.test(text)) found.add(p.id);
	}
	return [...found];
}

function escapeReg(s: string) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function findComment(comments: Comment[], id: string | null | undefined): Comment | undefined {
	if (!id) return undefined;
	return comments.find((c) => c.id === id);
}
