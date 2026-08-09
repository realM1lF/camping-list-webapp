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
