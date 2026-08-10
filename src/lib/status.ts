import type { Item, ItemStatus } from './types';

export function claimedCount(item: Pick<Item, 'claims'>): number {
	return (item.claims ?? []).reduce((sum, c) => sum + (c.count || 1), 0);
}

export function getItemStatus(item: Pick<Item, 'claims' | 'neededCount'>): ItemStatus {
	const claimed = claimedCount(item);
	if (claimed <= 0) return 'open';
	if (claimed < (item.neededCount || 1)) return 'partial';
	return 'covered';
}

export const STATUS_META: Record<ItemStatus, { label: string; symbol: string }> = {
	open: { label: 'Noch offen', symbol: '⚠️' },
	partial: { label: 'Teilweise versorgt', symbol: '🟡' },
	covered: { label: 'Versorgt', symbol: '✅' }
};

export interface TripProgress {
	total: number;
	covered: number;
	pct: number;
	/** Alle Items versorgt (nur wenn total > 0) */
	complete: boolean;
}

/** Versorgungsgrad eines Trips anhand der Item-Claims. */
export function getTripProgress(
	items: Array<Pick<Item, 'claims' | 'neededCount'>> | undefined | null
): TripProgress {
	const list = items ?? [];
	const total = list.length;
	const covered = list.filter((i) => getItemStatus(i) === 'covered').length;
	const pct = total === 0 ? 0 : Math.round((covered / total) * 100);
	return { total, covered, pct, complete: total > 0 && covered === total };
}
